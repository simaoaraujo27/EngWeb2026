const express = require('express');
const router = express.Router();
const Admin = require('../controllers/adminController');
const auth = require('../auth/auth');
const authz = require('../auth/authorization');

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

module.exports = router;
