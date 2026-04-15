const express = require('express');
const router = express.Router();
const News = require('../controllers/newsController');
const auth = require('../auth/auth');
const authz = require('../auth/authorization');

// Listar notícias (Público)
router.get('/', (req, res) => {
    News.list()
        .then(dados => res.status(200).json(dados))
        .catch(erro => {
            console.error('List news error:', erro);
            res.status(500).json({ message: "Erro na listagem de notícias" });
        });
});

// Inserir uma notícia (Apenas Admin)
router.post('/', auth.verificaAcesso, authz.requireAdmin, (req, res) => {
    if (!req.body.conteudo || !req.body.tipo) {
        return res.status(400).json({ message: "Campos obrigatórios faltando: conteudo, tipo" });
    }

    News.insert(req.body)
        .then(dados => res.status(201).json(dados))
        .catch(erro => {
            console.error('Insert news error:', erro);
            res.status(500).json({ message: "Erro na inserção da notícia" });
        });
});

module.exports = router;
