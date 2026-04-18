const express = require('express');
const router = express.Router();
const Admin = require('../controllers/adminController');
const auth = require('../auth/auth');
const authz = require('../auth/authorization');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const fs = require('fs');

// Rota de Estatísticas (Público)
router.get('/stats', async (req, res) => {
    try {
        const stats = await Admin.getStats();
        res.status(200).json(stats);
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ message: "Erro ao obter estatísticas" });
    }
});

// Rota de Exportação Global (Apenas Admin)
router.get('/export', auth.verificaAcesso, authz.requireAdmin, async (req, res) => {
    try {
        const zipBuffer = await Admin.exportAll();
        
        res.set('Content-Type', 'application/zip');
        res.set('Content-Disposition', 'attachment; filename="EduPortal-Full-Export.zip"');
        res.send(zipBuffer);
    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({ message: "Erro na exportação global." });
    }
});

// Rota de Importação Global (Apenas Admin)
router.post('/import', auth.verificaAcesso, authz.requireAdmin, upload.single('zipFile'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: "Ficheiro não enviado." });
        
        const result = await Admin.importAll(req.file.path);
        fs.unlinkSync(req.file.path);
        res.status(200).json(result);
    } catch (error) {
        if (req.file) fs.unlinkSync(req.file.path);
        console.error('Import error:', error);
        res.status(500).json({ message: "Erro na importação global." });
    }
});

module.exports = router;
