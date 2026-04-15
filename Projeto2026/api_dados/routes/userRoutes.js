const express = require('express');
const router = express.Router();
const User = require('../controllers/userController');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'EngWeb2026-Projeto-Secret';
const auth = require('../auth/auth');
const authz = require('../auth/authorization');

// Rota de Login (Público)
router.post('/login', async (req, res) => {
    try {
        const user = await User.getUser(req.body._id);
        if (!user) return res.status(401).json({ message: "Utilizador não encontrado." });

        const isMatch = await bcrypt.compare(req.body.password, user.password);
        if (!isMatch) return res.status(401).json({ message: "Password incorreta." });

        const token = jwt.sign({ _id: user._id, nivel: user.nivel, nome: user.nome }, SECRET, { expiresIn: '1h' });
        
        // Não retornar a password
        const userResponse = { _id: user._id, nome: user.nome, nivel: user.nivel, email: user._id };
        res.status(200).json({ token: token, user: userResponse });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: "Erro no servidor" });
    }
});

// Listar todos os utilizadores (Protegido - Admin apenas)
router.get('/', auth.verificaAcesso, authz.requireAdmin, (req, res) => {
    User.list()
        .then(dados => {
            // Remover passwords da resposta
            const safeData = dados.map(u => {
                const obj = u.toObject ? u.toObject() : u;
                delete obj.password;
                return obj;
            });
            res.status(200).json(safeData);
        })
        .catch(erro => {
            console.error('List users error:', erro);
            res.status(500).json({ message: "Erro na listagem de utilizadores" });
        });
});

// Consultar um utilizador por ID (Protegido)
router.get('/:id', auth.verificaAcesso, (req, res) => {
    User.getUser(req.params.id)
        .then(dados => {
            if (!dados) return res.status(404).json({ message: "Utilizador não encontrado" });
            
            // Remover password se não for o próprio utilizador
            const obj = dados.toObject ? dados.toObject() : dados;
            if (req.user._id !== req.params.id && req.user.nivel !== 'admin') {
                delete obj.password;
            }
            res.status(200).json(obj);
        })
        .catch(erro => {
            console.error('Get user error:', erro);
            res.status(500).json({ message: "Erro na consulta do utilizador" });
        });
});

// Inserir um utilizador (Registo - Público)
router.post('/', async (req, res) => {
    try {
        // Validação básica
        if (!req.body._id || !req.body.password || !req.body.nome) {
            return res.status(400).json({ message: "Campos obrigatórios faltando: _id, password, nome" });
        }

        // Verificar se utilizador já existe
        const existing = await User.getUser(req.body._id);
        if (existing) {
            return res.status(409).json({ message: "Utilizador já existe" });
        }

        const salt = await bcrypt.genSalt(10);
        req.body.password = await bcrypt.hash(req.body.password, salt);
        req.body.nivel = req.body.nivel || 'consumidor'; // Padrão: consumidor
        
        const dados = await User.insert(req.body);
        
        // Remover password da resposta
        const obj = dados.toObject ? dados.toObject() : dados;
        delete obj.password;
        res.status(201).json(obj);
    } catch (erro) {
        console.error('Insert user error:', erro);
        res.status(500).json({ message: "Erro na inserção do utilizador" });
    }
});

// Atualizar um utilizador (Protegido - Próprio utilizador ou Admin)
router.put('/:id', auth.verificaAcesso, (req, res) => {
    // Verificar se é o próprio utilizador ou admin
    if (req.user._id !== req.params.id && req.user.nivel !== 'admin') {
        return res.status(403).json({ message: "Acesso Negado: Só pode atualizar a sua própria conta" });
    }

    // Não permitir alterar password por esta rota
    delete req.body.password;
    // Não permitir alterar nivel a menos que seja admin
    if (req.user.nivel !== 'admin') {
        delete req.body.nivel;
    }

    User.update(req.params.id, req.body)
        .then(dados => {
            const obj = dados.toObject ? dados.toObject() : dados;
            delete obj.password;
            res.status(200).json(obj);
        })
        .catch(erro => {
            console.error('Update user error:', erro);
            res.status(500).json({ message: "Erro na atualização do utilizador" });
        });
});

// Remover um utilizador (Protegido - Admin apenas)
router.delete('/:id', auth.verificaAcesso, authz.requireAdmin, (req, res) => {
    User.remove(req.params.id)
        .then(dados => res.status(200).json({ message: "Utilizador removido com sucesso" }))
        .catch(erro => {
            console.error('Delete user error:', erro);
            res.status(500).json({ message: "Erro na remoção do utilizador" });
        });
});

module.exports = router;
