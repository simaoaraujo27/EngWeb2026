const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const AdmZip = require('adm-zip');
const Resource = require('../controllers/resourceController');
const auth = require('../auth/auth');
const authz = require('../auth/authorization');

// Configuração do multer com limite de tamanho
const upload = multer({ 
    dest: 'uploads/',
    limits: { 
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 500 * 1024 * 1024 // 500MB
    }
});

// Validar resourceId para evitar path traversal
function validateResourceId(id) {
    return /^[a-zA-Z0-9_-]+$/.test(id);
}

// --- Rota de Ingestão (SIP) ---
router.post('/ingest', auth.verificaAcesso, authz.requireProducer, upload.single('zipFile'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: "Ficheiro ZIP não enviado." });

        // Validar resourceId
        const resourceId = req.body._id || Date.now().toString();
        
        // Debug logs (vão aparecer no docker logs)
        console.log("Recebido no body:", req.body);

        const zipPath = req.file.path;
        let zip;
        try {
            zip = new AdmZip(zipPath);
        } catch (e) {
            fs.unlinkSync(zipPath);
            return res.status(400).json({ message: "Ficheiro ZIP inválido ou corrompido." });
        }

        const zipEntries = zip.getEntries();
        
        const extractPath = path.join(__dirname, '../storage/resources/', resourceId);
        
        if (!fs.existsSync(extractPath)) fs.mkdirSync(extractPath, { recursive: true });
        zip.extractAllTo(extractPath, true);

        const manifestEntry = zipEntries.find(e => e.entryName.toLowerCase().includes('manifest'));
        if (!manifestEntry) {
            // ... cleanup logic ...
            return res.status(400).json({ 
                error: "Relatório de Erros de Ingestão",
                timestamp: new Date(),
                validacoes: [
                    { componente: "SIP", status: "Inválido", erro: "Manifesto não encontrado" },
                    { componente: "Estrutura", status: "Incompleta", erro: "O pacote ZIP deve conter um ficheiro manifest.txt ou manifest.json." }
                ]
            });
        }

        // --- Processar Manifesto (Aceitar JSON ou TXT) ---
        const manifestContent = manifestEntry.getData().toString('utf8');
        let filesList = [];
        
        try {
            // Tentar como JSON primeiro
            const manifestJson = JSON.parse(manifestContent);
            if (Array.isArray(manifestJson.files)) {
                filesList = manifestJson.files;
            } else if (typeof manifestJson === 'object') {
                filesList = Object.keys(manifestJson);
            }
        } catch (e) {
            // Se falhar JSON, tratar como lista de ficheiros (texto simples, um por linha)
            filesList = manifestContent.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);
        }

        // --- Validar se os ficheiros no manifesto existem no ZIP ---
        const zipFileNames = zipEntries.filter(e => !e.isDirectory).map(e => e.entryName);
        const missingFiles = filesList.filter(f => !zipFileNames.includes(f) && f.toLowerCase() !== manifestEntry.entryName.toLowerCase());

        if (missingFiles.length > 0 && filesList.length > 0) {
             // Limpeza
             try { fs.rmSync(extractPath, { recursive: true, force: true }); } catch (e) {}
             try { fs.unlinkSync(zipPath); } catch (e) {}
             
             return res.status(400).json({ 
                error: "Relatório de Erros de Ingestão",
                timestamp: new Date(),
                validacoes: [
                    { componente: "Integridade", status: "Falha", erro: `Ficheiros listados no manifesto não encontrados no ZIP: ${missingFiles.join(', ')}` }
                ]
            });
        }

        const filesMetadata = zipEntries
            .filter(e => !e.isDirectory && !e.entryName.toLowerCase().includes('manifest'))
            .map(e => ({
                nome: e.name,
                size: e.header.size,
                path: path.join('resources', resourceId, e.entryName)
            }));

        const resourceData = {
            _id: resourceId,
            tipo: req.body.tipo,
            titulo: req.body.titulo,
            subtitulo: req.body.subtitulo,
            ano: req.body.ano,
            dataCriacao: req.body.dataCriacao,
            produtor: req.user._id, // Usar o utilizador autenticado como produtor
            hashtags: req.body.hashtags ? (typeof req.body.hashtags === 'string' ? JSON.parse(req.body.hashtags) : req.body.hashtags) : [],
            visibilidade: req.body.visibilidade || 'público',
            files: filesMetadata
        };

        const result = await Resource.insert(resourceData);
        try {
            fs.unlinkSync(zipPath);
        } catch (e) {
            console.error('Error deleting zip file:', e);
        }
        res.status(201).json(result);
    } catch (error) {
        console.error('Ingest error:', error);
        res.status(500).json({ message: "Falha no processo de ingestão (SIP)." });
    }
});

// --- Rota de Download (DIP) ---
router.get('/download/:id', async (req, res) => {
    try {
        const resourceId = req.params.id;

        // Validar resourceId
        if (!validateResourceId(resourceId)) {
            return res.status(400).json({ message: "resourceId inválido." });
        }

        const resource = await Resource.getResource(resourceId);
        if (!resource) {
            return res.status(404).json({ message: "Recurso não encontrado." });
        }

        // Verificar visibilidade
        if (resource.visibilidade === 'privado' && (!req.user || (req.user._id !== resource.produtor && req.user.nivel !== 'admin'))) {
            return res.status(403).json({ message: "Acesso negado: Recurso é privado." });
        }

        const resourcePath = path.join(__dirname, '../storage/resources/', resourceId);
        
        if (!fs.existsSync(resourcePath)) {
            return res.status(404).json({ message: "Recurso não encontrado no armazenamento." });
        }

        // Incrementar contador de downloads
        await Resource.incDownloads(resourceId);

        const zip = new AdmZip();
        zip.addLocalFolder(resourcePath);
        
        const zipBuffer = zip.toBuffer();
        
        res.set('Content-Type', 'application/zip');
        res.set('Content-Disposition', `attachment; filename="DIP-${resourceId}.zip"`);
        res.send(zipBuffer);

    } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({ message: "Erro ao gerar pacote de disseminação (DIP)." });
    }
});

// --- Rotas CRUD Normais ---
router.get('/', (req, res) => {
    if (req.query.tipo) {
        Resource.listByType(req.query.tipo)
            .then(dados => res.status(200).json(dados))
            .catch(erro => {
                console.error('List by type error:', erro);
                res.status(500).json({ message: "Erro na listagem de recursos" });
            });
    } else if (req.query.hashtag) {
        Resource.listByHashtag(req.query.hashtag)
            .then(dados => res.status(200).json(dados))
            .catch(erro => {
                console.error('List by hashtag error:', erro);
                res.status(500).json({ message: "Erro na listagem de recursos" });
            });
    } else if (req.query.produtor) {
        Resource.listByProducer(req.query.produtor)
            .then(dados => res.status(200).json(dados))
            .catch(erro => {
                console.error('List by producer error:', erro);
                res.status(500).json({ message: "Erro na listagem de recursos" });
            });
    } else if (req.query.ano) {
        Resource.listByYear(req.query.ano)
            .then(dados => res.status(200).json(dados))
            .catch(erro => {
                console.error('List by year error:', erro);
                res.status(500).json({ message: "Erro na listagem de recursos" });
            });
    } else if (req.query.top) {
        Resource.top3()
            .then(dados => res.status(200).json(dados))
            .catch(erro => {
                console.error('List top3 error:', erro);
                res.status(500).json({ message: "Erro na listagem de recursos" });
            });
    } else {
        Resource.list()
            .then(dados => res.status(200).json(dados))
            .catch(erro => {
                console.error('List resources error:', erro);
                res.status(500).json({ message: "Erro na listagem de recursos" });
            });
    }
});

router.get('/:id', (req, res) => {
    Resource.getResource(req.params.id)
        .then(dados => {
            if (!dados) return res.status(404).json({ message: "Recurso não encontrado" });
            res.status(200).json(dados);
        })
        .catch(erro => {
            console.error('Get resource error:', erro);
            res.status(500).json({ message: "Erro na consulta do recurso" });
        });
});

router.post('/', auth.verificaAcesso, authz.requireProducer, (req, res) => {
    // Validar campos obrigatórios
    if (!req.body.titulo || !req.body.tipo) {
        return res.status(400).json({ message: "Campos obrigatórios faltando: titulo, tipo" });
    }

    req.body.produtor = req.user._id; // Definir produtor como utilizador autenticado
    Resource.insert(req.body)
        .then(dados => res.status(201).json(dados))
        .catch(erro => {
            console.error('Insert resource error:', erro);
            res.status(500).json({ message: "Erro na inserção do recurso" });
        });
});

router.put('/:id', auth.verificaAcesso, async (req, res) => {
    try {
        const resource = await Resource.getResource(req.params.id);
        if (!resource) {
            return res.status(404).json({ message: "Recurso não encontrado" });
        }

        // Verificar permissões
        if (req.user._id !== resource.produtor && req.user.nivel !== 'admin') {
            return res.status(403).json({ message: "Acesso Negado: Você não pode modificar este recurso." });
        }

        // Não permitir alterar produtor a menos que seja admin
        if (req.user.nivel !== 'admin') {
            delete req.body.produtor;
        }

        Resource.update(req.params.id, req.body)
            .then(dados => res.status(200).json(dados))
            .catch(erro => {
                console.error('Update resource error:', erro);
                res.status(500).json({ message: "Erro na atualização do recurso" });
            });
    } catch (erro) {
        console.error('Put resource error:', erro);
        res.status(500).json({ message: "Erro na atualização do recurso" });
    }
});

router.delete('/:id', auth.verificaAcesso, async (req, res) => {
    try {
        const resource = await Resource.getResource(req.params.id);
        if (!resource) {
            return res.status(404).json({ message: "Recurso não encontrado" });
        }

        // Verificar permissões - apenas proprietário ou admin
        if (req.user._id !== resource.produtor && req.user.nivel !== 'admin') {
            return res.status(403).json({ message: "Acesso Negado: Você não pode deletar este recurso." });
        }

        // Remover ficheiros do storage
        const resourcePath = path.join(__dirname, '../storage/resources/', req.params.id);
        if (fs.existsSync(resourcePath)) {
            try {
                fs.rmSync(resourcePath, { recursive: true, force: true });
            } catch (e) {
                console.error('Error removing resource directory:', e);
            }
        }

        Resource.remove(req.params.id)
            .then(dados => res.status(200).json({ message: "Recurso deletado com sucesso" }))
            .catch(erro => {
                console.error('Delete resource error:', erro);
                res.status(500).json({ message: "Erro na remoção do recurso" });
            });
    } catch (erro) {
        console.error('Delete resource error:', erro);
        res.status(500).json({ message: "Erro na remoção do recurso" });
    }
});

module.exports = router;
