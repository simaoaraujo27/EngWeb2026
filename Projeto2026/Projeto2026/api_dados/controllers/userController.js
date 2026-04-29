const User = require('../models/user');

// Listar todos os utilizadores
module.exports.list = () => {
    return User.find().sort('nome').exec();
};

// Consultar um utilizador por ID (email)
module.exports.getUser = id => {
    return User.findOne({ _id: id }).exec();
};

// Criar um novo utilizador
module.exports.insert = u => {
    const newUser = new User(u);
    return newUser.save();
};

// Atualizar um utilizador
module.exports.update = (id, u) => {
    return User.findByIdAndUpdate(id, u, { new: true }).exec();
};

// Remover um utilizador
module.exports.remove = id => {
    return User.findByIdAndDelete(id).exec();
};

// Contar utilizadores
module.exports.count = () => {
    return User.countDocuments().exec();
};
