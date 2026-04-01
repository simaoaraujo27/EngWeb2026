const express = require('express');
const router = express.Router();
const User = require('../controllers/userController');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const SECRET = "EngWeb2026-Projeto-Secret"; // Em produção usar variável de ambiente
const auth = require('../auth/auth');

// Rota de Login (Público)
router.post('/login', async (req, res) => {
    try {
        const user = await User.getUser(req.body._id);
        if (!user) return res.status(401).json({ message: "Utilizador não encontrado." });

        const isMatch = await bcrypt.compare(req.body.password, user.password);
        if (!isMatch) return res.status(401).json({ message: "Password incorreta." });

        const token = jwt.sign({ _id: user._id, nivel: user.nivel, nome: user.nome }, SECRET, { expiresIn: '1h' });
        res.status(200).json({ token: token, user: { _id: user._id, nome: user.nome, nivel: user.nivel } });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Listar todos os utilizadores (Protegido)
router.get('/', auth.verificaAcesso, (req, res) => {
    User.list()
        .then(dados => res.status(200).json(dados))
        .catch(erro => res.status(500).json({ error: erro, message: "Erro na listagem de utilizadores" }));
});

// Consultar um utilizador por ID (Protegido)
router.get('/:id', auth.verificaAcesso, (req, res) => {
    User.getUser(req.params.id)
        .then(dados => res.status(200).json(dados))
        .catch(erro => res.status(500).json({ error: erro, message: "Erro na consulta do utilizador" }));
});

// Inserir um utilizador (Registo - Público)
router.post('/', async (req, res) => {
    try {
        const salt = await bcrypt.genSalt(10);
        req.body.password = await bcrypt.hash(req.body.password, salt);
        
        const dados = await User.insert(req.body);
        res.status(201).json(dados);
    } catch (erro) {
        res.status(500).json({ error: erro, message: "Erro na inserção do utilizador" });
    }
});

// Atualizar um utilizador (Protegido)
router.put('/:id', auth.verificaAcesso, (req, res) => {
    User.update(req.params.id, req.body)
        .then(dados => res.status(200).json(dados))
        .catch(erro => res.status(500).json({ error: erro, message: "Erro na atualização do utilizador" }));
});

// Remover um utilizador (Protegido)
router.delete('/:id', auth.verificaAcesso, (req, res) => {
    User.remove(req.params.id)
        .then(dados => res.status(200).json(dados))
        .catch(erro => res.status(500).json({ error: erro, message: "Erro na remoção do utilizador" }));
});

// Atualizar um utilizador
router.put('/:id', (req, res) => {
    User.update(req.params.id, req.body)
        .then(dados => res.status(200).json(dados))
        .catch(erro => res.status(500).json({ error: erro, message: "Erro na atualização do utilizador" }));
});

// Remover um utilizador
router.delete('/:id', (req, res) => {
    User.remove(req.params.id)
        .then(dados => res.status(200).json(dados))
        .catch(erro => res.status(500).json({ error: erro, message: "Erro na remoção do utilizador" }));
});

module.exports = router;
