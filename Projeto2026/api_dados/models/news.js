const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema({
    conteudo: { type: String, required: true },
    data: { type: Date, default: Date.now },
    tipo: { 
        type: String, 
        enum: ['submissao', 'utilizador', 'ranking', 'manual'],
        required: true 
    }
}, { versionKey: false });

module.exports = mongoose.model('news', newsSchema);
