const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/user');
const Resource = require('./models/resource');
const News = require('./models/news');
const fs = require('fs');
const path = require('path');

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/projetoEW";

async function populate() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("Ligado ao MongoDB para povoamento...");

        // 1. Limpar coleções existentes
        await User.deleteMany({});
        await Resource.deleteMany({});
        await News.deleteMany({});
        console.log("Base de dados limpa.");

        // 2. Criar Utilizadores
        const salt = await bcrypt.genSalt(10);
        const hashedAdminPwd = await bcrypt.hash("admin123", salt);
        const hashedProdutorPwd = await bcrypt.hash("produtor123", salt);
        const hashedConsumidorPwd = await bcrypt.hash("user123", salt);

        const users = [
            { _id: "admin@eduportal.pt", nome: "Admin do Sistema", filiacao: "Universidade do Minho", nivel: "admin", password: hashedAdminPwd },
            { _id: "jcr@di.uminho.pt", nome: "José Carlos Ramalho", filiacao: "Departamento de Informática", nivel: "produtor", password: hashedProdutorPwd },
            { _id: "aluno1@alunos.uminho.pt", nome: "João Aluno", filiacao: "Mestrado em Engenharia Informática", nivel: "consumidor", password: hashedConsumidorPwd }
        ];
        await User.insertMany(users);
        console.log("Utilizadores criados.");

        // 3. Criar Recursos
        const resources = [
            {
                _id: "res001",
                tipo: "slides",
                titulo: "Introdução à Engenharia Web",
                subtitulo: "Conceitos base e arquitetura",
                dataCriacao: new Date("2026-02-01"),
                produtor: "jcr@di.uminho.pt",
                hashtags: ["web", "node", "express"],
                downloads: 15,
                files: [{ nome: "aula1.pdf", size: 1024000, path: "resources/res001/aula1.pdf" }]
            },
            {
                _id: "res002",
                tipo: "artigo",
                titulo: "Preservação Digital com OAIS",
                subtitulo: "Um estudo sobre o modelo de referência",
                dataCriacao: new Date("2026-01-15"),
                produtor: "jcr@di.uminho.pt",
                hashtags: ["oais", "preservação", "digital"],
                downloads: 42,
                files: [{ nome: "artigo_oais.pdf", size: 2048000, path: "resources/res002/artigo_oais.pdf" }]
            },
            {
                _id: "res003",
                tipo: "tese",
                titulo: "Gestão de Ativos Digitais em Ambientes Académicos",
                dataCriacao: new Date("2025-12-20"),
                produtor: "admin@eduportal.pt",
                hashtags: ["tese", "gestão", "ativos"],
                downloads: 8,
                files: [{ nome: "tese_final.pdf", size: 5120000, path: "resources/res003/tese_final.pdf" }]
            }
        ];
        await Resource.insertMany(resources);
        console.log("Recursos criados.");

        // 4. Criar Notícias
        const news = [
            { conteudo: "Bem-vindo ao EduPortal! A plataforma está online.", tipo: "manual" },
            { conteudo: "Novo utilizador registado: João Aluno", tipo: "utilizador" },
            { conteudo: "Recurso popular: 'Preservação Digital com OAIS' atingiu 40 downloads!", tipo: "ranking" }
        ];
        await News.insertMany(news);
        console.log("Notícias criadas.");

        // 5. Criar pastas físicas dummy para os recursos (para evitar erros no download)
        for (const res of resources) {
            const dir = path.join(__dirname, 'storage/resources', res._id);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
                fs.writeFileSync(path.join(dir, 'manifest.txt'), 'Ficheiro dummy para demonstração.');
            }
        }
        console.log("Pastas físicas dummy criadas.");

        console.log("Povoamento concluído com sucesso!");
        process.exit(0);
    } catch (error) {
        console.error("Erro no povoamento:", error);
        process.exit(1);
    }
}

populate();
