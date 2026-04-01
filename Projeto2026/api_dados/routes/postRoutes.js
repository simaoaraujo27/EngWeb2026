const express = require('express');
const router = express.Router();
const Post = require('../controllers/postController');
const auth = require('../auth/auth');

// Listar posts de um recurso (Público)
router.get('/resource/:rid', (req, res) => {
    Post.listByResource(req.params.rid)
        .then(dados => res.status(200).json(dados))
        .catch(erro => res.status(500).json({ error: erro, message: "Erro na consulta de posts do recurso" }));
});

// Inserir um post (Protegido)
router.post('/', auth.verificaAcesso, (req, res) => {
    Post.insert(req.body)
        .then(dados => res.status(201).json(dados))
        .catch(erro => res.status(500).json({ error: erro, message: "Erro na inserção do post" }));
});

// Adicionar comentário (Protegido)
router.post('/:id/comment', auth.verificaAcesso, (req, res) => {
    Post.addComment(req.params.id, req.body)
        .then(dados => res.status(200).json(dados))
        .catch(erro => res.status(500).json({ error: erro, message: "Erro ao adicionar comentário" }));
});

// Adicionar rating (Protegido)
router.post('/:id/rating', auth.verificaAcesso, (req, res) => {
    Post.addRating(req.params.id, req.body)
        .then(dados => res.status(200).json(dados))
        .catch(erro => res.status(500).json({ error: erro, message: "Erro ao adicionar rating" }));
});

module.exports = router;
