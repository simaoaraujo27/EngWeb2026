const express = require('express');
const router = express.Router();
const Post = require('../controllers/postController');
const auth = require('../auth/auth');

/**
 * @openapi
 * tags:
 *   - name: Posts
 *     description: Comentários e avaliações de recursos
 * 
 * /posts/resource/{rid}:
 *   get:
 *     summary: Lista posts de um recurso
 *     tags: [Posts]
 *     parameters:
 *       - name: rid
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Lista de posts
 * 
 * /posts/{id}/comment:
 *   post:
 *     summary: Adiciona uma resposta a um post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [conteudo]
 *             properties:
 *               conteudo: { type: string, example: "Minha resposta" }
 *     responses:
 *       200:
 *         description: Comentário adicionado
 * 
 * /posts/{id}/rating:
 *   post:
 *     summary: Atribui uma classificação (estrelas) num post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [estrelas]
 *             properties:
 *               estrelas: { type: number, minimum: 1, maximum: 5, example: 5 }
 *     responses:
 *       200:
 *         description: Rating adicionado
 */

// Listar posts de um recurso (Público)
router.get('/resource/:rid', (req, res) => {
    Post.listByResource(req.params.rid)
        .then(dados => res.status(200).json(dados))
        .catch(erro => {
            console.error('List posts error:', erro);
            res.status(500).json({ message: "Erro na consulta de posts do recurso" });
        });
});

// Inserir um post (Protegido)
router.post('/', auth.verificaAcesso, (req, res) => {
    // Validar campos obrigatórios
    if (!req.body.resourceId || !req.body.conteudo) {
        return res.status(400).json({ message: "Campos obrigatórios faltando: resourceId, conteudo" });
    }

    req.body.userId = req.user._id;
    Post.insert(req.body)
        .then(dados => res.status(201).json(dados))
        .catch(erro => {
            console.error('Insert post error:', erro);
            res.status(500).json({ message: "Erro na inserção do post" });
        });
});

// Adicionar comentário (Protegido)
router.post('/:id/comment', auth.verificaAcesso, (req, res) => {
    // Validar conteúdo do comentário
    if (!req.body.conteudo) {
        return res.status(400).json({ message: "Conteúdo do comentário é obrigatório" });
    }

    const comment = {
        userId: req.user._id,
        conteudo: req.body.conteudo,
        data: new Date()
    };

    Post.addComment(req.params.id, comment)
        .then(dados => res.status(200).json(dados))
        .catch(erro => {
            console.error('Add comment error:', erro);
            res.status(500).json({ message: "Erro ao adicionar comentário" });
        });
});

// Adicionar rating (Protegido)
router.post('/:id/rating', auth.verificaAcesso, (req, res) => {
    // Validar rating
    if (!req.body.estrelas || req.body.estrelas < 1 || req.body.estrelas > 5) {
        return res.status(400).json({ message: "Rating deve ser um número entre 1 e 5" });
    }

    const rating = {
        userId: req.user._id,
        estrelas: req.body.estrelas
    };

    Post.addRating(req.params.id, rating)
        .then(dados => res.status(200).json(dados))
        .catch(erro => {
            console.error('Add rating error:', erro);
            res.status(500).json({ message: "Erro ao adicionar rating" });
        });
});

module.exports = router;
