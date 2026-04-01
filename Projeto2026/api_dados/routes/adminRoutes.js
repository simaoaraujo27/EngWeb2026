const express = require('express');
const router = express.Router();
const Admin = require('../controllers/adminController');
const auth = require('../auth/auth');

// Rota de Exportação Global (Apenas Admin)
router.get('/export', auth.verificaAcesso, async (req, res) => {
    if (req.user.nivel !== 'admin') {
        return res.status(403).json({ message: "Acesso Negado: Apenas administradores podem exportar dados." });
    }

    try {
        const zipBuffer = await Admin.exportAll();
        
        res.set('Content-Type', 'application/zip');
        res.set('Content-Disposition', 'attachment; filename="EduPortal-Full-Export.zip"');
        res.send(zipBuffer);
    } catch (error) {
        res.status(500).json({ error: error.message, message: "Erro na exportação global." });
    }
});

module.exports = router;
