const mongoose = require('mongoose');
const User = require('../models/user');
const Resource = require('../models/resource');
const Post = require('../models/post');
const News = require('../models/news');

// Dados realistas para a BD
const usuarios = [
  {
    _id: 'admin@elearn.pt',
    nome: 'Administrador eLearn',
    filiacao: 'Universidade do Minho',
    nivel: 'admin',
    dataRegisto: new Date('2026-01-01'),
    password: '$2b$10$abcdef123456' // Mock password
  },
  {
    _id: 'prof.silva@uminho.pt',
    nome: 'Prof. João Silva',
    filiacao: 'Departamento de Engenharia Informática - UMinho',
    nivel: 'produtor',
    dataRegisto: new Date('2026-01-15'),
    password: '$2b$10$abcdef123456'
  },
  {
    _id: 'prof.costa@uminho.pt',
    nome: 'Prof. Maria Costa',
    filiacao: 'Departamento de Engenharia Web - UMinho',
    nivel: 'produtor',
    dataRegisto: new Date('2026-01-20'),
    password: '$2b$10$abcdef123456'
  },
  {
    _id: 'prof.ferreira@uminho.pt',
    nome: 'Prof. Pedro Ferreira',
    filiacao: 'Departamento de Engenharia Informática - UMinho',
    nivel: 'produtor',
    dataRegisto: new Date('2026-02-01'),
    password: '$2b$10$abcdef123456'
  },
  {
    _id: 'aluno1@uminho.pt',
    nome: 'João Santos',
    filiacao: 'Estudante - Engenharia Informática - UMinho',
    nivel: 'consumidor',
    dataRegisto: new Date('2026-02-10'),
    password: '$2b$10$abcdef123456'
  },
  {
    _id: 'aluno2@uminho.pt',
    nome: 'Ana Oliveira',
    filiacao: 'Estudante - Engenharia Informática - UMinho',
    nivel: 'consumidor',
    dataRegisto: new Date('2026-02-12'),
    password: '$2b$10$abcdef123456'
  },
  {
    _id: 'aluno3@uminho.pt',
    nome: 'Carlos Mendes',
    filiacao: 'Estudante - Engenharia Informática - UMinho',
    nivel: 'consumidor',
    dataRegisto: new Date('2026-02-15'),
    password: '$2b$10$abcdef123456'
  },
  {
    _id: 'aluno4@uminho.pt',
    nome: 'Sofia Rodrigues',
    filiacao: 'Estudante - Engenharia Informática - UMinho',
    nivel: 'consumidor',
    dataRegisto: new Date('2026-02-18'),
    password: '$2b$10$abcdef123456'
  }
];

const recursos = [
  {
    _id: 'res-001',
    tipo: 'slides',
    titulo: 'Introdução a Node.js',
    subtitulo: 'Fundamentos e primeiras aplicações',
    dataCriacao: new Date('2026-02-01'),
    dataRegisto: new Date('2026-02-05'),
    produtor: 'prof.silva@uminho.pt',
    hashtags: ['nodejs', 'javascript', 'backend', 'web'],
    downloads: 245,
    files: [
      { nome: 'nodejs-intro.pdf', mimetype: 'application/pdf', size: 2500000, path: '/uploads/res-001/nodejs-intro.pdf' }
    ]
  },
  {
    _id: 'res-002',
    tipo: 'artigo',
    titulo: 'Arquitetura de Aplicações Web Modernas',
    subtitulo: 'Padrões e melhores práticas 2026',
    dataCriacao: new Date('2026-02-10'),
    dataRegisto: new Date('2026-02-12'),
    produtor: 'prof.costa@uminho.pt',
    hashtags: ['arquitetura', 'web', 'padroes', 'best-practices'],
    downloads: 189,
    files: [
      { nome: 'arquitetura-web.pdf', mimetype: 'application/pdf', size: 3200000, path: '/uploads/res-002/arquitetura-web.pdf' }
    ]
  },
  {
    _id: 'res-003',
    tipo: 'tese',
    titulo: 'Plataformas OAIS para Educação Digital',
    subtitulo: 'Um estudo comparativo',
    dataCriacao: new Date('2025-06-15'),
    dataRegisto: new Date('2026-01-10'),
    produtor: 'prof.ferreira@uminho.pt',
    hashtags: ['oais', 'educacao', 'digital', 'tese'],
    downloads: 45,
    files: [
      { nome: 'tese-oais.pdf', mimetype: 'application/pdf', size: 5800000, path: '/uploads/res-003/tese-oais.pdf' }
    ]
  },
  {
    _id: 'res-004',
    tipo: 'slides',
    titulo: 'MongoDB para Iniciantes',
    subtitulo: 'Database NoSQL e modelagem de dados',
    dataCriacao: new Date('2026-02-20'),
    dataRegisto: new Date('2026-02-21'),
    produtor: 'prof.silva@uminho.pt',
    hashtags: ['mongodb', 'nosql', 'database', 'javascript'],
    downloads: 156,
    files: [
      { nome: 'mongodb-basics.pdf', mimetype: 'application/pdf', size: 2100000, path: '/uploads/res-004/mongodb-basics.pdf' }
    ]
  },
  {
    _id: 'res-005',
    tipo: 'tutorial',
    titulo: 'Docker para Desenvolvimento Web',
    subtitulo: 'Containerização e orquestração',
    dataCriacao: new Date('2026-02-25'),
    dataRegisto: new Date('2026-02-26'),
    produtor: 'prof.costa@uminho.pt',
    hashtags: ['docker', 'containers', 'devops', 'web'],
    downloads: 312,
    files: [
      { nome: 'docker-tutorial.pdf', mimetype: 'application/pdf', size: 2800000, path: '/uploads/res-005/docker-tutorial.pdf' }
    ]
  },
  {
    _id: 'res-006',
    tipo: 'slides',
    titulo: 'RESTful APIs - Princípios e Implementação',
    subtitulo: 'Criando APIs escaláveis e seguras',
    dataCriacao: new Date('2026-03-01'),
    dataRegisto: new Date('2026-03-02'),
    produtor: 'prof.ferreira@uminho.pt',
    hashtags: ['rest', 'api', 'http', 'web-services'],
    downloads: 201,
    files: [
      { nome: 'restful-apis.pdf', mimetype: 'application/pdf', size: 2300000, path: '/uploads/res-006/restful-apis.pdf' }
    ]
  },
  {
    _id: 'res-007',
    tipo: 'artigo',
    titulo: 'Segurança em Aplicações Web',
    subtitulo: 'OWASP Top 10 e mitigação de riscos',
    dataCriacao: new Date('2026-03-05'),
    dataRegisto: new Date('2026-03-06'),
    produtor: 'prof.silva@uminho.pt',
    hashtags: ['seguranca', 'owasp', 'web', 'vulnerabilidades'],
    downloads: 278,
    files: [
      { nome: 'seguranca-web.pdf', mimetype: 'application/pdf', size: 3100000, path: '/uploads/res-007/seguranca-web.pdf' }
    ]
  },
  {
    _id: 'res-008',
    tipo: 'slides',
    titulo: 'React - Biblioteca para Interfaces Dinâmicas',
    subtitulo: 'Componentes, estados e ciclo de vida',
    dataCriacao: new Date('2026-03-10'),
    dataRegisto: new Date('2026-03-11'),
    produtor: 'prof.costa@uminho.pt',
    hashtags: ['react', 'javascript', 'frontend', 'ui'],
    downloads: 289,
    files: [
      { nome: 'react-intro.pdf', mimetype: 'application/pdf', size: 2600000, path: '/uploads/res-008/react-intro.pdf' }
    ]
  },
  {
    _id: 'app-001',
    tipo: 'aplicacao',
    titulo: 'Calculadora Científica Online',
    subtitulo: 'Ferramenta interativa para cálculos avançados',
    dataCriacao: new Date('2026-02-15'),
    dataRegisto: new Date('2026-02-16'),
    produtor: 'prof.silva@uminho.pt',
    hashtags: ['javascript', 'ferramentas', 'educacao', 'interativa'],
    downloads: 156,
    files: [
      { nome: 'calculator.zip', mimetype: 'application/zip', size: 450000, path: '/uploads/app-001/calculator.zip' }
    ]
  },
  {
    _id: 'app-002',
    tipo: 'aplicacao',
    titulo: 'Visualizador de Estruturas de Dados',
    subtitulo: 'Animations de algoritmos e estruturas (arrays, árvores, grafos)',
    dataCriacao: new Date('2026-02-20'),
    dataRegisto: new Date('2026-02-21'),
    produtor: 'prof.ferreira@uminho.pt',
    hashtags: ['estruturas-dados', 'algoritmos', 'visualizacao', 'educacao'],
    downloads: 423,
    files: [
      { nome: 'dsa-visualizer.zip', mimetype: 'application/zip', size: 2100000, path: '/uploads/app-002/dsa-visualizer.zip' }
    ]
  },
  {
    _id: 'app-003',
    tipo: 'aplicacao',
    titulo: 'Conversor de Bases Numéricas',
    subtitulo: 'Converte entre binário, decimal, hexadecimal e octal em tempo real',
    dataCriacao: new Date('2026-02-28'),
    dataRegisto: new Date('2026-03-01'),
    produtor: 'prof.silva@uminho.pt',
    hashtags: ['numeros', 'bases', 'javascript', 'ferramentas'],
    downloads: 89,
    files: [
      { nome: 'base-converter.zip', mimetype: 'application/zip', size: 320000, path: '/uploads/app-003/base-converter.zip' }
    ]
  },
  {
    _id: 'app-004',
    tipo: 'aplicacao',
    titulo: 'Simulador de Autómatos Finitos',
    subtitulo: 'Cria e testa autómatos determinísticos e não-determinísticos',
    dataCriacao: new Date('2026-03-05'),
    dataRegisto: new Date('2026-03-06'),
    produtor: 'prof.costa@uminho.pt',
    hashtags: ['teoria-computacao', 'automatos', 'educacao', 'interativa'],
    downloads: 267,
    files: [
      { nome: 'automata-simulator.zip', mimetype: 'application/zip', size: 1800000, path: '/uploads/app-004/automata-simulator.zip' }
    ]
  },
  {
    _id: 'app-005',
    tipo: 'aplicacao',
    titulo: 'Editor de Expressões Regulares',
    subtitulo: 'Testa padrões regex com feedback visual em tempo real',
    dataCriacao: new Date('2026-03-10'),
    dataRegisto: new Date('2026-03-11'),
    produtor: 'prof.ferreira@uminho.pt',
    hashtags: ['regex', 'javascript', 'ferramentas', 'desenvolvimento'],
    downloads: 334,
    files: [
      { nome: 'regex-editor.zip', mimetype: 'application/zip', size: 560000, path: '/uploads/app-005/regex-editor.zip' }
    ]
  }
];

const posts = [
  {
    resourceId: 'res-001',
    userId: 'aluno1@uminho.pt',
    conteudo: 'Excelente introdução a Node.js! Muito clara e com bons exemplos práticos.',
    data: new Date('2026-02-06'),
    comentarios: [
      {
        userId: 'prof.silva@uminho.pt',
        conteudo: 'Obrigado! Fico feliz que tenha ajudado.',
        data: new Date('2026-02-07')
      }
    ],
    ratings: [
      { userId: 'aluno1@uminho.pt', estrelas: 5 },
      { userId: 'aluno2@uminho.pt', estrelas: 5 },
      { userId: 'aluno3@uminho.pt', estrelas: 4 }
    ]
  },
  {
    resourceId: 'res-002',
    userId: 'aluno2@uminho.pt',
    conteudo: 'Muito útil para compreender a arquitetura moderna. Os exemplos de real-world são valiosos.',
    data: new Date('2026-02-15'),
    comentarios: [],
    ratings: [
      { userId: 'aluno2@uminho.pt', estrelas: 5 },
      { userId: 'aluno4@uminho.pt', estrelas: 4 },
      { userId: 'aluno1@uminho.pt', estrelas: 5 }
    ]
  },
  {
    resourceId: 'res-004',
    userId: 'aluno3@uminho.pt',
    conteudo: 'MongoDB finalmente fez sentido para mim! Slides muito didáticas.',
    data: new Date('2026-02-22'),
    comentarios: [
      {
        userId: 'aluno1@uminho.pt',
        conteudo: 'Concordo! Muito melhor que outras explicações.',
        data: new Date('2026-02-22')
      },
      {
        userId: 'prof.silva@uminho.pt',
        conteudo: 'Fico feliz! A prática é fundamental nesta área.',
        data: new Date('2026-02-23')
      }
    ],
    ratings: [
      { userId: 'aluno1@uminho.pt', estrelas: 5 },
      { userId: 'aluno3@uminho.pt', estrelas: 5 },
      { userId: 'aluno4@uminho.pt', estrelas: 5 }
    ]
  },
  {
    resourceId: 'res-005',
    userId: 'aluno4@uminho.pt',
    conteudo: 'Tutorial de Docker muito prático! Já consegui containerizar a minha aplicação.',
    data: new Date('2026-02-28'),
    comentarios: [],
    ratings: [
      { userId: 'aluno1@uminho.pt', estrelas: 5 },
      { userId: 'aluno2@uminho.pt', estrelas: 4 },
      { userId: 'aluno3@uminho.pt', estrelas: 5 }
    ]
  },
  {
    resourceId: 'res-006',
    userId: 'aluno1@uminho.pt',
    conteudo: 'Excelente explicação sobre RESTful APIs. Agora compreendo melhor o design.',
    data: new Date('2026-03-03'),
    comentarios: [
      {
        userId: 'prof.ferreira@uminho.pt',
        conteudo: 'Obrigado pelo feedback! A compreensão de REST é fundamental.',
        data: new Date('2026-03-04')
      }
    ],
    ratings: [
      { userId: 'aluno1@uminho.pt', estrelas: 5 },
      { userId: 'aluno2@uminho.pt', estrelas: 5 },
      { userId: 'aluno4@uminho.pt', estrelas: 4 }
    ]
  },
  {
    resourceId: 'res-007',
    userId: 'aluno2@uminho.pt',
    conteudo: 'Muito importante aprender sobre segurança desde o início. Excelente cobertura do OWASP Top 10.',
    data: new Date('2026-03-08'),
    comentarios: [],
    ratings: [
      { userId: 'aluno1@uminho.pt', estrelas: 5 },
      { userId: 'aluno3@uminho.pt', estrelas: 5 },
      { userId: 'aluno4@uminho.pt', estrelas: 5 }
    ]
  }
];

const noticias = [
  {
    conteudo: 'Novo recurso adicionado: "Introdução a Node.js" - Prof. João Silva',
    data: new Date('2026-02-05'),
    tipo: 'submissao'
  },
  {
    conteudo: 'Novo utilizador: João Santos - Estudante de Engenharia Informática',
    data: new Date('2026-02-10'),
    tipo: 'utilizador'
  },
  {
    conteudo: 'Novo recurso adicionado: "Arquitetura de Aplicações Web Modernas" - Prof. Maria Costa',
    data: new Date('2026-02-12'),
    tipo: 'submissao'
  },
  {
    conteudo: 'Novo utilizador: Ana Oliveira - Estudante de Engenharia de Sistemas',
    data: new Date('2026-02-12'),
    tipo: 'utilizador'
  },
  {
    conteudo: 'Recurso mais bem classificado esta semana: "Docker para Desenvolvimento Web" com 5/5 estrelas',
    data: new Date('2026-03-02'),
    tipo: 'ranking'
  },
  {
    conteudo: 'Novo recurso adicionado: "React - Biblioteca para Interfaces Dinâmicas" - Prof. Maria Costa',
    data: new Date('2026-03-11'),
    tipo: 'submissao'
  }
];

async function populateDB() {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/projetoEW';
    
    await mongoose.connect(mongoURI);

    console.log('✅ Conectado à BD');

    // Limpar BD existente
    console.log('🗑️  Limpando dados existentes...');
    await User.deleteMany({});
    await Resource.deleteMany({});
    await Post.deleteMany({});
    await News.deleteMany({});

    // Inserir dados
    console.log('📝 Inserindo utilizadores...');
    await User.insertMany(usuarios);
    console.log(`   ✅ ${usuarios.length} utilizadores inseridos`);

    console.log('📝 Inserindo recursos...');
    await Resource.insertMany(recursos);
    console.log(`   ✅ ${recursos.length} recursos inseridos`);

    console.log('📝 Inserindo posts e comentários...');
    await Post.insertMany(posts);
    console.log(`   ✅ ${posts.length} posts inseridos`);

    console.log('📝 Inserindo notícias...');
    await News.insertMany(noticias);
    console.log(`   ✅ ${noticias.length} notícias inseridas`);

    console.log('\n✨ Base de dados populada com sucesso!');
    console.log('\n📊 Resumo:');
    console.log(`   • Utilizadores: ${usuarios.length}`);
    console.log(`   • Recursos: ${recursos.length}`);
    console.log(`   • Posts: ${posts.length}`);
    console.log(`   • Notícias: ${noticias.length}`);

    await mongoose.connection.close();
    console.log('\n✅ Ligação fechada');

  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

populateDB();
