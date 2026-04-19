const express = require('express');
const router = express.Router();
const News = require('../controllers/newsController');
const auth = require('../auth/auth');
const authz = require('../auth/authorization');

/**
 * @openapi
 * tags:
 *   - name: News
 *     description: Feed de atividade e anúncios do sistema
 * 
 * /news:
 *   get:
 *     summary: Lista as notícias mais recentes
 *     tags: [News]
 *     responses:
 *       200:
 *         description: Lista de notícias (limite 20)
 *   post:
 *     summary: Cria uma nova notícia
 *     tags: [News]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [conteudo, tipo]
 *             properties:
 *               conteudo: { type: string, example: "Manutenção agendada" }
 *               tipo: { type: string, enum: [submissao, utilizador, ranking, manual], example: "manual" }
 *               resourceId: { type: string, description: "ID opcional do recurso associado" }
 *     responses:
 *       201:
 *         description: Notícia criada
 */

// Listar notícias (Público)
router.get('/', (req, res) => {
    News.list()
        .then(dados => res.status(200).json(dados))
        .catch(erro => {
            console.error('List news error:', erro);
            res.status(500).json({ message: "Erro na listagem de notícias" });
        });
});

// Inserir uma notícia
router.post('/', (req, res, next) => {
    // Se for uma notícia manual, exige admin. Se for do sistema, permite.
    if (req.body.tipo === 'manual') {
        return auth.verificaAcesso(req, res, () => {
            authz.requireAdmin(req, res, next);
        });
    }
    next();
}, (req, res) => {
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
