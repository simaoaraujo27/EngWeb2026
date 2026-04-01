const express = require('express');
const router = express.Router();
const News = require('../controllers/newsController');

// Listar notícias
router.get('/', (req, res) => {
    News.list()
        .then(dados => res.status(200).json(dados))
        .catch(erro => res.status(500).json({ error: erro, message: "Erro na listagem de notícias" }));
});

// Inserir uma notícia
router.post('/', (req, res) => {
    News.insert(req.body)
        .then(dados => res.status(201).json(dados))
        .catch(erro => res.status(500).json({ error: erro, message: "Erro na inserção da notícia" }));
});

module.exports = router;
