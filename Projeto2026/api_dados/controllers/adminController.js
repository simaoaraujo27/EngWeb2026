const User = require('./userController');
const Resource = require('./resourceController');
const Post = require('../models/post');
const News = require('../models/news');
const UserDoc = require('../models/user');
const ResourceDoc = require('../models/resource');
const AdmZip = require('adm-zip');
const path = require('path');
const fs = require('fs');

module.exports.getStats = async () => {
    const [userCount, resourceCount, lastMonthCount, allResources] = await Promise.all([
        UserDoc.countDocuments().exec(),
        ResourceDoc.countDocuments().exec(),
        Resource.countLastMonth(),
        ResourceDoc.find().exec()
    ]);

    const totalDownloads = allResources.reduce((acc, r) => acc + (r.downloads || 0), 0);

    return {
        userCount,
        resourceCount,
        lastMonthCount,
        totalDownloads
    };
};

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
