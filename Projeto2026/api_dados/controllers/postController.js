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
module.exports.addRating = async (pid, rating) => {
    // 1. Remover rating anterior do utilizador (se existir)
    await Post.findByIdAndUpdate(
        pid,
        { $pull: { ratings: { userId: rating.userId } } }
    ).exec();

    // 2. Adicionar novo rating
    return Post.findByIdAndUpdate(
        pid,
        { $push: { ratings: rating } },
        { new: true }
    ).exec();
};

// Remover um post
module.exports.remove = id => {
    return Post.findByIdAndDelete(id).exec();
};
