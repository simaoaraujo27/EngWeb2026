const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const User = require('../models/user');
const Resource = require('../models/resource');
const Post = require('../models/post');
const News = require('../models/news');

const realData = [
  { "titulo": "TPC1: Aquecimento e Setup de Ambiente", "tipo": "relatorio", "ano": "2023" },
  { "titulo": "TPC2: Introdução ao HTML5 e CSS3", "tipo": "artigo", "ano": "2023" },
  { "titulo": "TPC3: Manipulação de JSON e Datasets", "tipo": "aplicacao", "ano": "2023" },
  { "titulo": "TPC4: Servidores em Node.js", "tipo": "slides", "ano": "2023" },
  { "titulo": "TPC5: Persistência de Dados com MongoDB", "tipo": "relatorio", "ano": "2023" },
  { "titulo": "TPC6: Desenvolvimento de APIs REST", "tipo": "artigo", "ano": "2023" },
  { "titulo": "TPC7: Frameworks Frontend (React/Vue)", "tipo": "slides", "ano": "2023" },
  { "titulo": "TPC8: Autenticação e Autorização (JWT)", "tipo": "relatorio", "ano": "2023" },
  { "titulo": "Teste Escrito de Engenharia Web", "tipo": "tese", "ano": "2023" },
  { "titulo": "Projeto Final: Desenvolvimento de Aplicação Web Full-stack", "tipo": "aplicacao", "ano": "2023" },
  { "titulo": "Relatório Técnico do Projeto Final", "tipo": "relatorio", "ano": "2023" },
  { "titulo": "Aula Teórica: Arquitetura Cliente-Servidor", "tipo": "slides", "ano": "2023" },
  { "titulo": "Aula Teórica: Protocolo HTTP e Verbos REST", "tipo": "slides", "ano": "2023" },
  { "titulo": "Aula Prática: Introdução ao Express.js", "tipo": "slides", "ano": "2023" },
  { "titulo": "Aula Prática: Modelagem de Dados em NoSQL", "tipo": "slides", "ano": "2023" },
  { "titulo": "Mini-teste de Programação Imperativa: Ciclos e Condicionais", "tipo": "tese", "ano": "2022" },
  { "titulo": "Mini-teste de Programação Imperativa: Arrays e Matrizes", "tipo": "tese", "ano": "2022" },
  { "titulo": "Ficha de Exercícios: Recursividade em C", "tipo": "relatorio", "ano": "2022" },
  { "titulo": "Ficha de Exercícios: Gestão Dinâmica de Memória", "tipo": "relatorio", "ano": "2022" },
  { "titulo": "Exame de Recurso: Engenharia Web", "tipo": "tese", "ano": "2023" }
];

const usuarios = [
  {
    _id: 'admin@test.pt',
    nome: 'Admin do Sistema',
    nivel: 'admin',
    password: '$2b$10$5b6ii.ab0193ZCD5f8KusOYvy0ZiGNhMGDmfaSp7lQ5MuGb0XRIpe' // password123
  },
  {
    _id: 'jcr@di.uminho.pt',
    nome: 'José Carlos Ramalho',
    filiacao: 'Universidade do Minho',
    departamento: 'Departamento de Informática',
    nivel: 'produtor',
    password: '$2b$10$5b6ii.ab0193ZCD5f8KusOYvy0ZiGNhMGDmfaSp7lQ5MuGb0XRIpe'
  }
];

async function populate() {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://mongodb:27017/projetoEW';
    await mongoose.connect(mongoURI);
    console.log('✅ Conectado à BD');

    // 1. Limpar coleções
    await User.deleteMany({});
    await Resource.deleteMany({});
    await Post.deleteMany({});
    await News.deleteMany({});
    console.log('🗑️  Dados antigos removidos.');

    // 2. Inserir Utilizadores
    await User.insertMany(usuarios);
    console.log('👤 Utilizadores base criados.');

    // 3. Processar Recursos Reais
    const storagePath = path.join(__dirname, '../storage/resources');
    
    // Garantir que a pasta de storage existe
    if (!fs.existsSync(storagePath)) fs.mkdirSync(storagePath, { recursive: true });

    for (let i = 0; i < realData.length; i++) {
        const item = realData[i];
        const resId = `real-${(i + 1).toString().padStart(3, '0')}`;
        
        // Criar pasta física
        const resDir = path.join(storagePath, resId);
        if (!fs.existsSync(resDir)) fs.mkdirSync(resDir, { recursive: true });

        // Criar ficheiro dummy e manifesto
        const fileName = `${item.titulo.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;
        fs.writeFileSync(path.join(resDir, fileName), `Conteúdo simulado para: ${item.titulo}`);
        fs.writeFileSync(path.join(resDir, 'manifest.txt'), `${fileName}\n`);

        const resource = new Resource({
            _id: resId,
            titulo: item.titulo,
            tipo: item.tipo,
            ano: item.ano,
            produtor: 'jcr@di.uminho.pt',
            dataRegisto: new Date(),
            downloads: Math.floor(Math.random() * 100),
            hashtags: ['real', 'aula', item.tipo],
            files: [{
                nome: fileName,
                mimetype: 'application/pdf',
                size: 1024,
                path: path.join('resources', resId, fileName)
            }]
        });

        await resource.save();

        // Notícia para os primeiros 5
        if (i < 5) {
            await new News({
                conteudo: `Novo recurso disponível: ${item.titulo}`,
                tipo: 'submissao',
                resourceId: resId,
                data: new Date()
            }).save();
        }
    }

    console.log(`📚 ${realData.length} recursos reais inseridos com sucesso.`);
    
    await mongoose.connection.close();
    console.log('✨ Processo concluído.');
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

populate();
