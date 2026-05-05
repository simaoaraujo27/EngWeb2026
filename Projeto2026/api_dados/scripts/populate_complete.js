const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://mongodb:27017/projetoEW';
const STORAGE_PATH = path.join(__dirname, '../storage/resources');

const User = require('../models/user');
const Resource = require('../models/resource');
const Post = require('../models/post');
const News = require('../models/news');

async function populate() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('🚀 Iniciando povoamento massivo com passwords encriptadas...');

        await Promise.all([User.deleteMany({}), Resource.deleteMany({}), Post.deleteMany({}), News.deleteMany({})]);

        // Encriptar a password padrão
        const hashedPassword = await bcrypt.hash('password123', 10);

        // 1. Utilizadores (Docentes + Alunos Genéricos)
        const users = [
            { _id: 'jcr@di.uminho.pt', nome: 'José Carlos Ramalho', nivel: 'admin', filiacao: 'Universidade do Minho', departamento: 'DI', password: hashedPassword, ativo: true },
            { _id: 'prh@di.uminho.pt', nome: 'Pedro Rangel Henriques', nivel: 'produtor', filiacao: 'Universidade do Minho', departamento: 'DI', password: hashedPassword, ativo: true },
            { _id: 'a10001@alunos.uminho.pt', nome: 'Ana Martins', nivel: 'produtor', filiacao: 'Engenharia Informática', curso: 'MIEI', password: hashedPassword, ativo: true },
            { _id: 'a10002@alunos.uminho.pt', nome: 'Carlos Silva', nivel: 'produtor', filiacao: 'Engenharia Informática', curso: 'LCC', password: hashedPassword, ativo: true },
            { _id: 'a10003@alunos.uminho.pt', nome: 'Joana Rodrigues', nivel: 'produtor', filiacao: 'Engenharia Informática', curso: 'MIEI', password: hashedPassword, ativo: true },
            { _id: 'a10004@alunos.uminho.pt', nome: 'Ricardo Pereira', nivel: 'consumidor', filiacao: 'Engenharia Informática', curso: 'LCC', password: hashedPassword, ativo: true }
        ];
        await User.insertMany(users);

        const resources = [];
        const ucs = [
            { id: 'EW', nome: 'Engenharia Web', tags: ['web', 'javascript', 'nodejs', 'mongodb'], produtor: 'jcr@di.uminho.pt' },
            { id: 'RPCW', nome: 'Representação e Processamento de Conhecimento na Web', tags: ['rdf', 'sparql', 'ontologias', 'semantic-web'], produtor: 'jcr@di.uminho.pt' },
            { id: 'ATP', nome: 'Algoritmos e Tipos de Dados', tags: ['c', 'algoritmos', 'estruturas-dados'], produtor: 'jcr@di.uminho.pt' },
            { id: 'PI', nome: 'Programação Imperativa', tags: ['c', 'imperative', 'miniteste'], produtor: 'prh@di.uminho.pt' },
            { id: 'COMP', nome: 'Compiladores', tags: ['gramaticas', 'antlr', 'lex-yacc'], produtor: 'prh@di.uminho.pt' }
        ];

        const tipos = ['slides', 'relatorio', 'teste_exame', 'problema_resolvido', 'tese', 'artigo', 'aplicacao'];
        const anos = ['2022', '2023', '2024', '2025', '2026'];

        const totalResources = 1000;
        // Gerar 1000 recursos variados
        for (let i = 1; i <= totalResources; i++) {
            const uc = ucs[i % ucs.length];
            const tipo = tipos[i % tipos.length];
            const ano = anos[i % anos.length];
            const resId = `real-${i.toString().padStart(3, '0')}`;
            
            // Criar títulos baseados em material real das UCs e no TIPO
            let titulo = "";
            let filename = "";
            
            const temas = ['Arquitetura Web', 'Protocolo HTTP', 'Persistência NoSQL', 'Segurança JWT', 'APIs REST', 'GraphQL', 'Web Semântica', 'Docker e Microserviços', 'Single Page Applications', 'Ontologias OWL'];
            // Usar um desfasamento (i+j) para evitar que o mesmo tipo calhe sempre no mesmo tema
            const tema = temas[(i + Math.floor(i/7)) % temas.length];

            if (tipo === 'slides') {
                titulo = `Aula Teórica: ${tema}`;
                filename = `aula_${i}.pdf`;
            } else if (tipo === 'teste_exame') {
                titulo = `Exame de ${uc.nome} (${ano})`;
                filename = `exame_${uc.id.toLowerCase()}_${ano}.pdf`;
            } else if (tipo === 'problema_resolvido') {
                titulo = `Resolução: Exercícios de ${tema}`;
                filename = `resolucao_${i}.zip`;
            } else if (tipo === 'relatorio') {
                titulo = `Relatório de Projeto (${tema}): ${uc.nome}`;
                filename = `relatorio_final_${i}.pdf`;
            } else if (tipo === 'tese') {
                titulo = `Dissertação: Avanços em ${tema}`;
                filename = `tese_mestrado_${i}.pdf`;
            } else if (tipo === 'aplicacao') {
                titulo = `Software: Engine de ${tema}`;
                filename = `app_v${i}.zip`;
            } else {
                titulo = `Artigo Científico: Estudo sobre ${tema}`;
                filename = `paper_${i}.pdf`;
            }

            const resource = {
                _id: resId,
                titulo: titulo,
                subtitulo: `Material de apoio da UC ${uc.nome}`,
                tipo: tipo,
                ano: ano,
                produtor: i > 25 ? `a1000${(i % 3) + 1}@alunos.uminho.pt` : uc.produtor,
                hashtags: [uc.id.toLowerCase(), ...uc.tags.slice(0, 2)],
                visibilidade: i === 5 ? 'privado' : 'publico',
                downloads: Math.floor(Math.random() * 200),
                files: [{ nome: filename, size: Math.floor(Math.random() * 5000000) + 100000, path: `resources/${resId}/${filename}` }]
            };

            // Criar ficheiros físicos simulados
            const resDir = path.join(STORAGE_PATH, resId);
            if (!fs.existsSync(resDir)) fs.mkdirSync(resDir, { recursive: true });
            fs.writeFileSync(path.join(resDir, filename), `Conteúdo dummy para ${titulo}`);
            fs.writeFileSync(path.join(resDir, 'manifest.txt'), `hash ${filename}\n`);

            resources.push(resource);
        }

        await Resource.insertMany(resources);
        console.log(`📚 ${resources.length} Recursos criados com material real.`);

        // 3. Posts e Notícias
        const posts = [
            { resourceId: 'real-001', userId: 'a10001@alunos.uminho.pt', conteudo: 'Estes slides estão muito claros, obrigado prof!', ratings: [{ userId: 'a10001@alunos.uminho.pt', estrelas: 5 }] },
            { resourceId: 'real-005', userId: 'a10002@alunos.uminho.pt', conteudo: 'Alguém conseguiu pôr o código a correr?', comentarios: [{ userId: 'jcr@di.uminho.pt', conteudo: 'Verifique se instalou todas as dependências do npm.' }] }
        ];
        await Post.insertMany(posts);

        const news = [
            { conteudo: 'EduPortal: Bem-vindos ao novo repositório de Engenharia Web!', tipo: 'manual' },
            { conteudo: 'Top 3 Recursos da semana atualizado!', tipo: 'ranking' }
        ];
        await News.insertMany(news);

        console.log('✅ Povoamento concluído. Plataforma pronta para demonstração!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Erro:', error);
        process.exit(1);
    }
}

populate();
