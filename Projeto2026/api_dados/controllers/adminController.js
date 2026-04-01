const User = require('../models/user');
const Resource = require('../models/resource');
const Post = require('../models/post');
const News = require('../models/news');
const AdmZip = require('adm-zip');
const path = require('path');
const fs = require('fs');

module.exports.exportAll = async () => {
    const zip = new AdmZip();

    // 1. Obter dados das coleções
    const users = await User.find().exec();
    const resources = await Resource.find().exec();
    const posts = await Post.find().exec();
    const news = await News.find().exec();

    // 2. Adicionar JSONs ao ZIP
    zip.addFile("users.json", Buffer.from(JSON.stringify(users, null, 2), "utf8"));
    zip.addFile("resources.json", Buffer.from(JSON.stringify(resources, null, 2), "utf8"));
    zip.addFile("posts.json", Buffer.from(JSON.stringify(posts, null, 2), "utf8"));
    zip.addFile("news.json", Buffer.from(JSON.stringify(news, null, 2), "utf8"));

    // 3. Adicionar ficheiros de storage
    const storagePath = path.join(__dirname, '../storage/resources');
    if (fs.existsSync(storagePath)) {
        zip.addLocalFolder(storagePath, "storage/resources");
    }

    return zip.toBuffer();
};
