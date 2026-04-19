const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
    _id: { type: String, required: true }, // UUID ou ID gerado
    tipo: { type: String, required: true }, // tese, artigo, slides, etc.
    titulo: { type: String, required: true },
    subtitulo: String,
    ano: String, // Ano de criação/publicação
    dataCriacao: Date,
    dataRegisto: { type: Date, default: Date.now },
    produtor: { type: String, ref: 'user', required: true },
    hashtags: [String],
    downloads: { type: Number, default: 0 },
    files: [{
        nome: String,
        mimetype: String,
        size: Number,
        path: String
    }]
}, { versionKey: false });

module.exports = mongoose.model('resource', resourceSchema);
