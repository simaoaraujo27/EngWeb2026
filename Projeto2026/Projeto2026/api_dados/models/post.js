const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    resourceId: { type: String, ref: 'resource', required: true },
    userId: { type: String, ref: 'user', required: true },
    conteudo: { type: String, required: true },
    data: { type: Date, default: Date.now },
    comentarios: [{
        userId: { type: String, ref: 'user' },
        conteudo: String,
        data: { type: Date, default: Date.now }
    }],
    ratings: [{
        userId: { type: String, ref: 'user' },
        estrelas: { type: Number, min: 1, max: 5 }
    }]
}, { versionKey: false });

module.exports = mongoose.model('post', postSchema);
