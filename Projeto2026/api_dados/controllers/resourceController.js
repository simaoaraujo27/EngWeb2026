const Resource = require('../models/resource');

// Listar recursos com filtros dinâmicos
module.exports.list = (filter = {}) => {
    return Resource.find(filter).sort({ dataRegisto: -1 }).exec();
};

// Consultar um recurso por ID
module.exports.getResource = id => {
    return Resource.findOne({ _id: id }).exec();
};

// Inserir um novo recurso
module.exports.insert = r => {
    const newResource = new Resource(r);
    return newResource.save();
};

// Atualizar um recurso
module.exports.update = (id, r) => {
    return Resource.findByIdAndUpdate(id, r, { new: true }).exec();
};

// Remover um recurso
module.exports.remove = id => {
    return Resource.findByIdAndDelete(id).exec();
};

// Remover todos os recursos de um produtor
module.exports.removeByProducer = produtorId => {
    return Resource.deleteMany({ produtor: produtorId }).exec();
};

// Listar por tipo
module.exports.listByType = t => {
    return Resource.find({ tipo: t }).exec();
};

// Listar por hashtag
module.exports.listByHashtag = h => {
    return Resource.find({ hashtags: h }).exec();
};

// Listar por produtor
module.exports.listByProducer = p => {
    return Resource.find({ produtor: p }).sort({ dataRegisto: -1 }).exec();
};

// Listar por ano
module.exports.listByYear = a => {
    return Resource.find({ ano: a }).sort({ dataRegisto: -1 }).exec();
};

// Incrementar contador de downloads
module.exports.incDownloads = id => {
    return Resource.findByIdAndUpdate(id, { $inc: { downloads: 1 } }, { new: true }).exec();
};

// Obter Top 3 mais descarregados
module.exports.top3 = () => {
    return Resource.find().sort({ downloads: -1 }).limit(3).exec();
};

// Contar recursos criados nos últimos 30 dias
module.exports.countLastMonth = () => {
    const lastMonth = new Date();
    lastMonth.setDate(lastMonth.getDate() - 30);
    return Resource.countDocuments({ dataRegisto: { $gte: lastMonth } }).exec();
};
