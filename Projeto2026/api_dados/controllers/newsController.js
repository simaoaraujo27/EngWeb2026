const News = require('../models/news');
const Resource = require('./resourceController');

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

// Gerar notícia do Top 3
module.exports.generateTop3News = async () => {
    try {
        const top = await Resource.top3();
        if (top.length > 0) {
            const nomes = top.map(r => r.titulo).join(', ');
            const conteudo = `Top 3 Recursos mais requisitados: ${nomes}`;
            
            // Verificar se a última notícia do tipo ranking é igual a esta (para não repetir)
            const lastRanking = await News.findOne({ tipo: 'ranking' }).sort({ data: -1 }).exec();
            if (!lastRanking || lastRanking.conteudo !== conteudo) {
                const newNews = new News({
                    conteudo: conteudo,
                    tipo: 'ranking'
                });
                return await newNews.save();
            }
        }
    } catch (error) {
        console.error('Error generating Top 3 news:', error);
    }
};
