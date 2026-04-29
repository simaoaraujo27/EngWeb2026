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

module.exports.importAll = async (source) => {
    // AdmZip aceita tanto buffer como string (caminho)
    const zip = new AdmZip(source);
    const zipEntries = zip.getEntries();

    console.log("Iniciando importação global...");

    // 1. Limpar coleções
    await UserDoc.deleteMany({});
    await ResourceDoc.deleteMany({});
    await Post.deleteMany({});
    await News.deleteMany({});

    // 2. Importar JSONs
    for (const entry of zipEntries) {
        try {
            if (entry.entryName === "users.json") {
                const data = JSON.parse(entry.getData().toString("utf8"));
                if (data.length > 0) await UserDoc.insertMany(data);
            } else if (entry.entryName === "resources.json") {
                const data = JSON.parse(entry.getData().toString("utf8"));
                if (data.length > 0) await ResourceDoc.insertMany(data);
            } else if (entry.entryName === "posts.json") {
                const data = JSON.parse(entry.getData().toString("utf8"));
                if (data.length > 0) await Post.insertMany(data);
            } else if (entry.entryName === "news.json") {
                const data = JSON.parse(entry.getData().toString("utf8"));
                if (data.length > 0) await News.insertMany(data);
            }
        } catch (e) {
            console.error(`Erro ao importar ${entry.entryName}:`, e.message);
        }
    }

    // 3. Restaurar storage/resources
    const storagePath = path.join(__dirname, '../storage/resources');
    
    // Limpar storage atual antes de restaurar (evita lixo)
    if (fs.existsSync(storagePath)) {
        fs.rmSync(storagePath, { recursive: true, force: true });
    }
    fs.mkdirSync(storagePath, { recursive: true });

    zipEntries.forEach(entry => {
        if (entry.entryName.startsWith("storage/resources/") && !entry.isDirectory) {
            const relativePath = entry.entryName.replace("storage/resources/", "");
            const fullPath = path.join(storagePath, relativePath);
            const dir = path.dirname(fullPath);
            
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(fullPath, entry.getData());
        }
    });

    console.log("Importação concluída com sucesso.");
    return { message: "Importação concluída com sucesso." };
};
