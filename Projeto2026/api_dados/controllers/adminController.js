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
    const users = await User.list();
    const resources = await Resource.list();
    const posts = await Post.find().exec();
    const news = await News.find().sort({ data: -1 }).exec();

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

module.exports.importAll = async (zipBuffer) => {
    const zip = new AdmZip(zipBuffer);
    const zipEntries = zip.getEntries();

    // 1. Limpar coleções (Opcional, mas recomendado para consistência)
    // Se preferires fazer merge, podes remover estas linhas
    await UserDoc.deleteMany({});
    await ResourceDoc.deleteMany({});
    await Post.deleteMany({});
    await News.deleteMany({});

    // 2. Importar JSONs
    for (const entry of zipEntries) {
        if (entry.entryName === "users.json") {
            const data = JSON.parse(entry.getData().toString("utf8"));
            await UserDoc.insertMany(data);
        } else if (entry.entryName === "resources.json") {
            const data = JSON.parse(entry.getData().toString("utf8"));
            await ResourceDoc.insertMany(data);
        } else if (entry.entryName === "posts.json") {
            const data = JSON.parse(entry.getData().toString("utf8"));
            await Post.insertMany(data);
        } else if (entry.entryName === "news.json") {
            const data = JSON.parse(entry.getData().toString("utf8"));
            await News.insertMany(data);
        }
    }

    // 3. Restaurar storage/resources
    const storagePath = path.join(__dirname, '../storage/resources');
    zipEntries.forEach(entry => {
        if (entry.entryName.startsWith("storage/resources/") && !entry.isDirectory) {
            // Remover o prefixo "storage/resources/" para extrair no local correto
            const relativePath = entry.entryName.replace("storage/resources/", "");
            const fullPath = path.join(storagePath, relativePath);
            const dir = path.dirname(fullPath);
            
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(fullPath, entry.getData());
        }
    });

    return { message: "Importação concluída com sucesso." };
};
