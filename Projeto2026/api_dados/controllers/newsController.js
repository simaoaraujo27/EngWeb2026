const News = require('../models/news');

// Listar notícias (mais recentes primeiro)
module.exports.list = () => {
    return News.find().sort({ data: -1 }).limit(20).exec();
};

// Inserir uma notícia
module.exports.insert = n => {
    const newNews = new News(n);
    return newNews.save();
};

// Remover uma notícia
module.exports.remove = id => {
    return News.findByIdAndDelete(id).exec();
};
