const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const AdmZip = require('adm-zip');
const Resource = require('../controllers/resourceController');
const auth = require('../auth/auth');

const upload = multer({ dest: 'uploads/' });

// --- Rota de Ingestão (SIP) ---
router.post('/ingest', auth.verificaAcesso, upload.single('zipFile'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: "Ficheiro ZIP não enviado." });

        const zipPath = req.file.path;
        const zip = new AdmZip(zipPath);
        const zipEntries = zip.getEntries();
        
        const resourceId = req.body._id || Date.now().toString();
        const extractPath = path.join(__dirname, '../storage/resources/', resourceId);
        
        if (!fs.existsSync(extractPath)) fs.mkdirSync(extractPath, { recursive: true });
        zip.extractAllTo(extractPath, true);

        const manifestEntry = zipEntries.find(e => e.entryName.toLowerCase().includes('manifest'));
        if (!manifestEntry) {
            fs.rmSync(extractPath, { recursive: true, force: true });
            fs.unlinkSync(zipPath);
            return res.status(400).json({ message: "Erro de validação: Manifesto não encontrado no SIP." });
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
            dataCriacao: req.body.dataCriacao,
            produtor: req.body.produtor,
            hashtags: req.body.hashtags ? (typeof req.body.hashtags === 'string' ? JSON.parse(req.body.hashtags) : req.body.hashtags) : [],
            visibilidade: req.body.visibilidade || 'público',
            files: filesMetadata
        };

        const result = await Resource.insert(resourceData);
        fs.unlinkSync(zipPath);
        res.status(201).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message, message: "Falha no processo de ingestão (SIP)." });
    }
});

// --- Rota de Download (DIP) ---
router.get('/download/:id', async (req, res) => {
    try {
        const resourceId = req.params.id;
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
        res.status(500).json({ error: error.message, message: "Erro ao gerar pacote de disseminação (DIP)." });
    }
});

// --- Rotas CRUD Normais ---
router.get('/', (req, res) => {
    if (req.query.tipo) {
        Resource.listByType(req.query.tipo)
            .then(dados => res.status(200).json(dados))
            .catch(erro => res.status(500).json({ error: erro }));
    } else if (req.query.hashtag) {
        Resource.listByHashtag(req.query.hashtag)
            .then(dados => res.status(200).json(dados))
            .catch(erro => res.status(500).json({ error: erro }));
    } else if (req.query.top) {
        Resource.top3()
            .then(dados => res.status(200).json(dados))
            .catch(erro => res.status(500).json({ error: erro }));
    } else {
        Resource.list()
            .then(dados => res.status(200).json(dados))
            .catch(erro => res.status(500).json({ error: erro }));
    }
});

router.get('/:id', (req, res) => {
    Resource.getResource(req.params.id)
        .then(dados => res.status(200).json(dados))
        .catch(erro => res.status(500).json({ error: erro }));
});

router.post('/', auth.verificaAcesso, (req, res) => {
    Resource.insert(req.body)
        .then(dados => res.status(201).json(dados))
        .catch(erro => res.status(500).json({ error: erro }));
});

router.put('/:id', auth.verificaAcesso, (req, res) => {
    Resource.update(req.params.id, req.body)
        .then(dados => res.status(200).json(dados))
        .catch(erro => res.status(500).json({ error: erro }));
});

router.delete('/:id', auth.verificaAcesso, (req, res) => {
    Resource.remove(req.params.id)
        .then(dados => res.status(200).json(dados))
        .catch(erro => res.status(500).json({ error: erro }));
});

module.exports = router;
