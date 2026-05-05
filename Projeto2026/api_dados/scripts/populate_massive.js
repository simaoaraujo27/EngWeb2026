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
        console.log('🚀 Iniciando povoamento MASSIVO (~10.000 recursos)...');

        // Limpar dados existentes
        await Promise.all([
            User.deleteMany({}), 
            Resource.deleteMany({}), 
            Post.deleteMany({}), 
            News.deleteMany({})
        ]);

        const hashedPassword = await bcrypt.hash('password123', 10);

        // 1. Utilizadores
        const users = [
            { _id: 'jcr@di.uminho.pt', nome: 'José Carlos Ramalho', nivel: 'admin', filiacao: 'Universidade do Minho', departamento: 'DI', password: hashedPassword, ativo: true },
            { _id: 'prh@di.uminho.pt', nome: 'Pedro Rangel Henriques', nivel: 'produtor', filiacao: 'Universidade do Minho', departamento: 'DI', password: hashedPassword, ativo: true },
            { _id: 'jj@di.uminho.pt', nome: 'José João Almeida', nivel: 'produtor', filiacao: 'Universidade do Minho', departamento: 'DI', password: hashedPassword, ativo: true },
            { _id: 'mjt@di.uminho.pt', nome: 'Maria João Varanda', nivel: 'produtor', filiacao: 'IPB', departamento: 'DI', password: hashedPassword, ativo: true }
        ];

        // Gerar mais 50 utilizadores (alunos)
        for (let i = 1; i <= 50; i++) {
            const id = `a${10000 + i}@alunos.uminho.pt`;
            users.push({
                _id: id,
                nome: `Aluno ${i}`,
                nivel: Math.random() > 0.3 ? 'produtor' : 'consumidor',
                filiacao: 'Universidade do Minho',
                curso: Math.random() > 0.5 ? 'MIEI' : 'LCC',
                password: hashedPassword,
                ativo: true
            });
        }
        await User.insertMany(users);
        console.log(`👤 ${users.length} utilizadores criados.`);

        const ucs = [
            { id: 'EW', nome: 'Engenharia Web', tags: ['web', 'javascript', 'nodejs', 'mongodb'], produtor: 'jcr@di.uminho.pt' },
            { id: 'RPCW', nome: 'Representação e Processamento de Conhecimento na Web', tags: ['rdf', 'sparql', 'ontologias', 'semantic-web'], produtor: 'jcr@di.uminho.pt' },
            { id: 'ATP', nome: 'Algoritmos e Tipos de Dados', tags: ['c', 'algoritmos', 'estruturas-dados'], produtor: 'jcr@di.uminho.pt' },
            { id: 'PI', nome: 'Programação Imperativa', tags: ['c', 'imperative', 'miniteste'], produtor: 'prh@di.uminho.pt' },
            { id: 'COMP', nome: 'Compiladores', tags: ['gramaticas', 'antlr', 'lex-yacc'], produtor: 'prh@di.uminho.pt' },
            { id: 'SPLN', nome: 'Scripting no Processamento de Linguagem Natural', tags: ['perl', 'regex', 'text-processing'], produtor: 'jj@di.uminho.pt' },
            { id: 'PL', nome: 'Processamento de Linguagens', tags: ['grammars', 'parsing', 'translation'], produtor: 'prh@di.uminho.pt' }
        ];

        const tipos = ['slides', 'relatorio', 'teste_exame', 'problema_resolvido', 'tese', 'artigo', 'aplicacao'];
        const anos = ['2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025', '2026'];
        const temas = [
            'Arquitetura Web', 'Protocolo HTTP', 'Persistência NoSQL', 'Segurança JWT', 'APIs REST', 
            'GraphQL', 'Web Semântica', 'Docker e Microserviços', 'Single Page Applications', 'Ontologias OWL',
            'Sistemas Distribuídos', 'Inteligência Artificial', 'Machine Learning', 'Computação em Nuvem',
            'Cibersegurança', 'Internet das Coisas', 'Realidade Virtual', 'Blockchain', 'Big Data', 'User Experience'
        ];

        const totalResources = 1000;
        const batchSize = 250;
        const producerIds = users.filter(u => u.nivel !== 'consumidor').map(u => u._id);

        console.log(`📚 Gerando ${totalResources} recursos em lotes de ${batchSize}...`);

        for (let b = 0; b < totalResources / batchSize; b++) {
            const batch = [];
            for (let i = 1; i <= batchSize; i++) {
                const globalIndex = b * batchSize + i;
                const uc = ucs[globalIndex % ucs.length];
                const tipo = tipos[globalIndex % tipos.length];
                const ano = anos[globalIndex % anos.length];
                const tema = temas[globalIndex % temas.length];
                const resId = `res-${globalIndex.toString().padStart(5, '0')}`;
                
                let titulo = "";
                let filename = "";

                if (tipo === 'slides') {
                    titulo = `Aula ${globalIndex % 20}: ${tema}`;
                    filename = `aula_${globalIndex}.pdf`;
                } else if (tipo === 'teste_exame') {
                    titulo = `Avaliação de ${uc.nome} (${ano})`;
                    filename = `exame_${uc.id.toLowerCase()}_${ano}.pdf`;
                } else if (tipo === 'problema_resolvido') {
                    titulo = `Resolução: ${tema} - Exercício ${globalIndex % 10}`;
                    filename = `resolucao_${globalIndex}.zip`;
                } else if (tipo === 'relatorio') {
                    titulo = `Projeto final: ${tema}`;
                    filename = `relatorio_${globalIndex}.pdf`;
                } else if (tipo === 'tese') {
                    titulo = `Dissertação sobre ${tema}`;
                    filename = `tese_${globalIndex}.pdf`;
                } else if (tipo === 'aplicacao') {
                    titulo = `Protótipo de ${tema}`;
                    filename = `app_${globalIndex}.zip`;
                } else {
                    titulo = `Publicação: Inovações em ${tema}`;
                    filename = `paper_${globalIndex}.pdf`;
                }

                const resource = {
                    _id: resId,
                    titulo: titulo,
                    subtitulo: `Material gerado automaticamente para testes de carga.`,
                    tipo: tipo,
                    ano: ano,
                    produtor: producerIds[globalIndex % producerIds.length],
                    hashtags: [uc.id.toLowerCase(), ...uc.tags.slice(0, 2), tema.toLowerCase().replace(/ /g, '-')],
                    visibilidade: Math.random() > 0.05 ? 'publico' : 'privado',
                    downloads: Math.floor(Math.random() * 500),
                    dataRegisto: new Date(Date.now() - Math.floor(Math.random() * 10000000000)),
                    files: [{ 
                        nome: filename, 
                        size: Math.floor(Math.random() * 10000000) + 100000, 
                        path: `resources/${resId}/${filename}` 
                    }]
                };

                // Para não sobrecarregar o disco, criamos ficheiros apenas para os primeiros 100
                // e para os restantes apenas simulamos a estrutura se necessário.
                // Mas para a API funcionar corretamente, o registro no BD é o mais importante.
                if (globalIndex <= 100) {
                    const resDir = path.join(STORAGE_PATH, resId);
                    if (!fs.existsSync(resDir)) fs.mkdirSync(resDir, { recursive: true });
                    fs.writeFileSync(path.join(resDir, filename), `Conteúdo dummy para ${titulo}`);
                    fs.writeFileSync(path.join(resDir, 'manifest.txt'), `hash ${filename}\n`);
                }

                batch.push(resource);
            }
            await Resource.insertMany(batch);
            process.stdout.write(`.`);
        }
        console.log(`\n📚 ${totalResources} recursos inseridos.`);

        // 3. Notícias variadas
        const news = [
            { conteudo: 'EduPortal: Atualização massiva de sistema concluída!', tipo: 'manual' },
            { conteudo: 'Novo recorde de acessos este mês!', tipo: 'manual' }
        ];
        
        // Gerar algumas notícias de submissão recentes
        for(let i=0; i<20; i++) {
            news.push({
                conteudo: `O sistema atingiu a marca de ${500 * (i+1)} recursos!`,
                tipo: 'ranking',
                data: new Date()
            });
        }
        await News.insertMany(news);

        console.log('✅ Povoamento massivo concluído!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Erro:', error);
        process.exit(1);
    }
}

populate();
