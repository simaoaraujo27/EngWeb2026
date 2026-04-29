// Middleware para verificar nível de acesso

module.exports.requireAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: "Acesso negado: Token não fornecido." });
    }
    
    if (req.user.nivel !== 'admin') {
        return res.status(403).json({ message: "Acesso Negado: Apenas administradores podem executar esta operação." });
    }
    
    next();
};

module.exports.requireProducer = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: "Acesso negado: Token não fornecido." });
    }
    
    if (req.user.nivel !== 'admin' && req.user.nivel !== 'produtor') {
        return res.status(403).json({ message: "Acesso Negado: Apenas produtores podem executar esta operação." });
    }
    
    next();
};

module.exports.requireOwnerOrAdmin = (resourceProducer) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: "Acesso negado: Token não fornecido." });
        }
        
        if (req.user.nivel !== 'admin' && req.user._id !== resourceProducer) {
            return res.status(403).json({ message: "Acesso Negado: Você não tem permissão para modificar este recurso." });
        }
        
        next();
    };
};
