const Post = require('../models/post');

// Listar posts de um recurso
module.exports.listByResource = rid => {
    return Post.find({ resourceId: rid }).sort({ data: -1 }).exec();
};

// Inserir um novo post
module.exports.insert = p => {
    const newPost = new Post(p);
    return newPost.save();
};

// Adicionar um comentário a um post
module.exports.addComment = (pid, comment) => {
    return Post.findByIdAndUpdate(
        pid,
        { $push: { comentarios: comment } },
        { new: true }
    ).exec();
};

// Adicionar/Atualizar um rating (evitar duplicatas)
module.exports.addRating = (pid, rating) => {
    // Verificar se o utilizador já votou
    return Post.findByIdAndUpdate(
        pid,
        { 
            $pull: { ratings: { userId: rating.userId } }, // Remover rating anterior do utilizador
            $push: { ratings: rating } // Adicionar novo rating
        },
        { new: true }
    ).exec();
};

// Remover um post
module.exports.remove = id => {
    return Post.findByIdAndDelete(id).exec();
};
