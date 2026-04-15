const mongoose = require('mongoose');
const User = require('../models/user');
const Resource = require('../models/resource');
const Post = require('../models/post');
const News = require('../models/news');

async function clearDB() {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/projetoEW';
    
    await mongoose.connect(mongoURI);

    console.log('✅ Conectado à BD');
    console.log('🗑️  Limpando base de dados...');

    await User.deleteMany({});
    await Resource.deleteMany({});
    await Post.deleteMany({});
    await News.deleteMany({});

    console.log('✨ Base de dados limpa com sucesso!');

    await mongoose.connection.close();
    console.log('✅ Ligação fechada');

  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

clearDB();
