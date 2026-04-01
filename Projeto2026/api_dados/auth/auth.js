const jwt = require('jsonwebtoken');
const SECRET = "EngWeb2026-Projeto-Secret"; // Deve coincidir com o usado no login

module.exports.verificaAcesso = (req, res, next) => {
    // O token pode vir no query string ou no header Authorization
    const token = req.headers['authorization'] || req.query.token;

    if (!token) {
        return res.status(401).json({ message: "Acesso negado: Token não fornecido." });
    }

    jwt.verify(token, SECRET, (err, payload) => {
        if (err) {
            return res.status(401).json({ message: "Acesso negado: Token inválido ou expirado." });
        }
        req.user = payload; // Guarda os dados do utilizador no request
        next();
    });
};
