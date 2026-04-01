const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    _id: { type: String, required: true }, // Email ou Username como ID
    nome: { type: String, required: true },
    filiacao: String,
    nivel: { 
        type: String, 
        enum: ['admin', 'produtor', 'consumidor'], 
        required: true 
    },
    dataRegisto: { type: Date, default: Date.now },
    dataUltimoAcesso: Date,
    password: { type: String, required: true }
}, { versionKey: false });

module.exports = mongoose.model('user', userSchema);
