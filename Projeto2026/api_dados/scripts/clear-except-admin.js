const mongoose = require('mongoose');
const User = require('../models/user');
const Resource = require('../models/resource');
const Post = require('../models/post');
const News = require('../models/news');
const fs = require('fs');
const path = require('path');

async function clearExceptAdmin() {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/projetoEW';
    await mongoose.connect(mongoURI);

    console.log('✅ Conectado à BD');
    
    // 1. Limpar Coleções exceto Admin
    const usersRes = await User.deleteMany({ nivel: { $ne: 'admin' } });
    const resourcesRes = await Resource.deleteMany({});
    const postsRes = await Post.deleteMany({});
    const newsRes = await News.deleteMany({});

    console.log(`🗑️  Utilizadores removidos (não-admins): ${usersRes.deletedCount}`);
    console.log(`🗑️  Recursos removidos: ${resourcesRes.deletedCount}`);
    console.log(`🗑️  Posts removidos: ${postsRes.deletedCount}`);
    console.log(`🗑️  Notícias removidas: ${newsRes.deletedCount}`);

    // 2. Limpar Ficheiros Físicos
    const storagePath = path.join(__dirname, '../storage/resources');
    if (fs.existsSync(storagePath)) {
        const folders = fs.readdirSync(storagePath);
        for (const folder of folders) {
            const fullPath = path.join(storagePath, folder);
            fs.rmSync(fullPath, { recursive: true, force: true });
        }
        console.log('📂 Pastas de recursos eliminadas.');
    }

    // 3. Listar Admins restantes para confirmação
    const admins = await User.find({ nivel: 'admin' });
    console.log('\n👑 Administradores preservados:');
    admins.forEach(a => console.log(`   - ${a._id} (${a.nome})`));

    await mongoose.connection.close();
    console.log('\n✅ Operação concluída.');

  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

clearExceptAdmin();
