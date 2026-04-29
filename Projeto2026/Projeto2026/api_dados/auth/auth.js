const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'EngWeb2026-Projeto-Secret';

module.exports.verificaAcesso = (req, res, next) => {
    // Token deve vir no header Authorization (Bearer <token>)
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
        return res.status(401).json({ message: "Acesso negado: Token não fornecido." });
    }

    // Extrair token do formato "Bearer <token>"
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;

    if (!token) {
        return res.status(401).json({ message: "Acesso negado: Formato de token inválido." });
    }

    jwt.verify(token, SECRET, (err, payload) => {
        if (err) {
            return res.status(401).json({ message: "Acesso negado: Token inválido ou expirado." });
        }
        req.user = payload;
        next();
    });
};

module.exports.autenticacaoOpcional = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        req.user = null;
        return next();
    }
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
    jwt.verify(token, SECRET, (err, payload) => {
        if (err) req.user = null;
        else req.user = payload;
        next();
    });
};
