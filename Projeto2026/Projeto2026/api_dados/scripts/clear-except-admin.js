const mongoose = require('mongoose');
const User = require('../models/user');
const Resource = require('../models/resource');
const Post = require('../models/post');
const News = require('../models/news');

async function clearExceptAdmin() {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://mongodb:27017/projetoEW';
    
    try {
        await mongoose.connect(mongoURI);
        console.log('Conectado ao MongoDB para limpeza parcial...');

        // Remover todos os recursos, posts e notícias
        await Resource.deleteMany({});
        await Post.deleteMany({});
        await News.deleteMany({});
        console.log('Recursos, posts e notícias removidos.');

        // Remover todos os utilizadores exceto os admins
        const result = await User.deleteMany({ nivel: { $ne: 'admin' } });
        console.log(`${result.deletedCount} utilizadores removidos. Admins preservados.`);

    } catch (error) {
        console.error('Erro durante a limpeza:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Desconectado do MongoDB.');
    }
}

clearExceptAdmin();
