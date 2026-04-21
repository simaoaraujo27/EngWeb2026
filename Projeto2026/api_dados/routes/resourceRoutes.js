const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const AdmZip = require('adm-zip');
const { validateSIP } = require('../utils/bagitValidator');

const Resource = require('../controllers/resourceController');
const News = require('../controllers/newsController');
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

/**
 * @openapi
 * tags:
 *   - name: Resources
 *     description: Gestão de recursos educativos, ingestão SIP e disseminação DIP
 * 
 * /resources/ingest:
 *   post:
 *     summary: Ingestão de um novo recurso (pacote SIP)
 *     tags: [Resources]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [zipFile, titulo, tipo, ano]
 *             properties:
 *               zipFile: { type: string, format: binary, description: "Ficheiro ZIP com manifesto" }
 *               titulo: { type: string, example: "Minha Tese" }
 *               tipo: { type: string, enum: [tese, artigo, slides, relatorio, aplicacao], example: "tese" }
 *               ano: { type: string, example: "2026" }
 *               subtitulo: { type: string }
 *               hashtags: { type: string, description: "Lista em JSON ou separada por vírgulas" }
 *     responses:
 *       201:
 *         description: Recurso criado com sucesso
 *       400:
 *         description: Erro na validação do pacote SIP
 * 
 * /resources:
 *   get:
 *     summary: Listagem de recursos com filtros
 *     tags: [Resources]
 *     parameters:
 *       - name: tipo
 *         in: query
 *         schema: { type: string }
 *       - name: ano
 *         in: query
 *         schema: { type: string }
 *       - name: produtor
 *         in: query
 *         schema: { type: string }
 *       - name: hashtag
 *         in: query
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Lista de recursos
 * 
 * /resources/download/{id}:
 *   get:
 *     summary: Descarregar pacote DIP (ZIP)
 *     tags: [Resources]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Ficheiro ZIP gerado dinamicamente
 */

// --- Rota de Ingestão (SIP) ---
router.post('/ingest', auth.verificaAcesso, authz.requireProducer, upload.single('zipFile'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: "Ficheiro ZIP não enviado." });

        const resourceId = req.body._id || Date.now().toString();
        const zipPath = req.file.path;
        let zip;

        // Validar e extrair ZIP
        try {
            zip = new AdmZip(zipPath);
        } catch (e) {
            fs.unlinkSync(zipPath);
            return res.status(400).json({ 
                error: "Erro na Ingestão",
                timestamp: new Date(),
                mensagem: "Ficheiro ZIP inválido ou corrompido."
            });
        }

        const zipEntries = zip.getEntries();
        const extractPath = path.join(__dirname, '../storage/resources/', resourceId);
        
        if (!fs.existsSync(extractPath)) fs.mkdirSync(extractPath, { recursive: true });
        zip.extractAllTo(extractPath, true);

        // Procurar manifesto
        const manifestEntry = zipEntries.find(e => e.entryName.toLowerCase().includes('manifest'));
        if (!manifestEntry) {
            try { fs.rmSync(extractPath, { recursive: true, force: true }); } catch (e) {}
            try { fs.unlinkSync(zipPath); } catch (e) {}
            
            return res.status(400).json({ 
                error: "Relatório de Erros de Ingestão",
                timestamp: new Date(),
                validacoes: [
                    { componente: "Manifesto", status: "Erro Crítico", erro: "Manifesto não encontrado no pacote SIP" }
                ]
            });
        }

        // Validação BagIt completa
        const manifestContent = manifestEntry.getData().toString('utf8');
        const validacao = validateSIP(extractPath, manifestContent);

        if (!validacao.valid) {
            // Limpeza em caso de erro
            try { fs.rmSync(extractPath, { recursive: true, force: true }); } catch (e) {}
            try { fs.unlinkSync(zipPath); } catch (e) {}
            
            return res.status(400).json({ 
                error: "Relatório de Erros de Ingestão SIP",
                timestamp: new Date(),
                resumo: {
                    erros: validacao.errors.length,
                    avisos: validacao.warnings.length
                },
                validacoes: [...validacao.errors, ...validacao.warnings]
            });
        }

        // Extrair metadados de ficheiros
        const filesMetadata = zipEntries
            .filter(e => !e.isDirectory && !e.entryName.toLowerCase().includes('manifest'))
            .map(e => ({
                nome: e.name,
                size: e.header.size,
                path: path.join('resources', resourceId, e.entryName)
            }));

        // Criar recurso no BD
        const resourceData = {
            _id: resourceId,
            tipo: req.body.tipo,
            titulo: req.body.titulo,
            subtitulo: req.body.subtitulo,
            ano: req.body.ano,
            dataCriacao: req.body.dataCriacao,
            produtor: req.user._id,
            visibilidade: req.body.visibilidade || 'publico',
            hashtags: req.body.hashtags ? (typeof req.body.hashtags === 'string' ? JSON.parse(req.body.hashtags) : req.body.hashtags) : [],
            files: filesMetadata
        };

        const result = await Resource.insert(resourceData);
        
        // --- GERAR NOTÍCIA AUTOMÁTICA (API side) ---
        try {
            await News.insert({
                conteudo: `Nova submissão: O produtor ${req.user.nome} disponibilizou um(a) ${req.body.tipo} entitulado(a) "${req.body.titulo}".`,
                tipo: 'submissao',
                resourceId: resourceId
            });
        } catch (newsErr) {
            console.error('Error generating submission news:', newsErr);
        }

        try {
            fs.unlinkSync(zipPath);
        } catch (e) {
            console.error('Error deleting zip file:', e);
        }

        res.status(201).json({
            message: "Recurso ingerido com sucesso",
            resourceId: resourceId,
            validacao: {
                valid: true,
                avisos: validacao.warnings.length,
                detalhes: validacao.warnings
            },
            resource: result
        });
    } catch (error) {
        console.error('Ingest error:', error);
        res.status(500).json({ message: "Falha no processo de ingestão (SIP)." });
    }
});

// --- Rota de Download de Ficheiro Individual ---
router.get('/:id/file/:filename', async (req, res) => {
    try {
        const resourceId = req.params.id;
        const filename = req.params.filename;

        if (!validateResourceId(resourceId)) {
            return res.status(400).json({ message: "resourceId inválido." });
        }

        const resource = await Resource.getResource(resourceId);
        if (!resource) {
            return res.status(404).json({ message: "Recurso não encontrado." });
        }

        // Encontrar o metadado do ficheiro para obter o caminho relativo correto
        const fileMetadata = resource.files.find(f => f.nome === filename);
        if (!fileMetadata) {
            return res.status(404).json({ message: "Ficheiro não encontrado no recurso." });
        }

        const filePath = path.join(__dirname, '../storage', fileMetadata.path);
        
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ message: "Ficheiro físico não encontrado." });
        }

        res.download(filePath, filename);

    } catch (error) {
        console.error('File download error:', error);
        res.status(500).json({ message: "Erro ao descarregar ficheiro." });
    }
});

// --- Rota de Download (DIP) ---
router.get('/download/:id', auth.autenticacaoOpcional, async (req, res) => {
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

        // Verificar visibilidade para download
        if (resource.visibilidade === 'privado') {
            if (!req.user || (req.user.nivel !== 'admin' && req.user._id !== resource.produtor)) {
                return res.status(403).json({ message: "Acesso Negado para download: Este recurso é privado." });
            }
        }

        const resourcePath = path.join(__dirname, '../storage/resources/', resourceId);
        
        if (!fs.existsSync(resourcePath)) {
            return res.status(404).json({ message: "Recurso não encontrado no armazenamento." });
        }

        // Incrementar contador de downloads
        await Resource.incDownloads(resourceId);
        News.generateTop3News(); // Gatilho assíncrono

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
router.get('/', auth.autenticacaoOpcional, (req, res) => {
    let filter = {};

    // Se não for admin, aplicar restrições de visibilidade
    if (!req.user || req.user.nivel !== 'admin') {
        const userId = req.user ? req.user._id : null;
        filter.$or = [
            { visibilidade: 'publico' },
            { produtor: userId }
        ];
    }

    // Aplicar filtros de query adicionais (merge com o filtro de visibilidade)
    if (req.query.tipo) filter.tipo = req.query.tipo;
    if (req.query.hashtag) filter.hashtags = req.query.hashtag;
    if (req.query.produtor) filter.produtor = req.query.produtor;
    if (req.query.ano) filter.ano = req.query.ano;

    if (req.query.top) {
        Resource.top3()
            .then(dados => res.status(200).json(dados))
            .catch(erro => {
                console.error('List top3 error:', erro);
                res.status(500).json({ message: "Erro na listagem de recursos" });
            });
    } else {
        Resource.list(filter)
            .then(dados => res.status(200).json(dados))
            .catch(erro => {
                console.error('List resources error:', erro);
                res.status(500).json({ message: "Erro na listagem de recursos" });
            });
    }
});

router.get('/:id', auth.autenticacaoOpcional, async (req, res) => {
    try {
        const resource = await Resource.getResource(req.params.id);
        if (!resource) return res.status(404).json({ message: "Recurso não encontrado" });

        // Verificar visibilidade
        if (resource.visibilidade === 'privado') {
            if (!req.user || (req.user.nivel !== 'admin' && req.user._id !== resource.produtor)) {
                return res.status(403).json({ message: "Acesso Negado: Este recurso é privado." });
            }
        }

        res.status(200).json(resource);
    } catch (erro) {
        console.error('Get resource error:', erro);
        res.status(500).json({ message: "Erro na consulta do recurso" });
    }
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
