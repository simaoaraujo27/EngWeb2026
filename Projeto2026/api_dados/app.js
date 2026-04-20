const express = require('express');
const mongoose = require('mongoose');
const logger = require('morgan');
const cors = require('cors');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
require('dotenv').config();

const app = express();

// Configuração do Swagger
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'EduPortal API',
            version: '1.0.0',
            description: 'Documentação detalhada da API de Dados do EduPortal (EngWeb2026)',
        },
        servers: [
            { 
                url: '/api-proxy', 
                description: 'Gateway da Interface (Proxy)' 
            }
        ],
        components: { 
            securitySchemes: { 
                bearerAuth: { 
                    type: 'http', 
                    scheme: 'bearer', 
                    bearerFormat: 'JWT' 
                } 
            } 
        },
        security: [{ bearerAuth: [] }]
    },
    apis: ['./routes/*.js', './models/*.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs-ui', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/api-docs-json', (req, res) => { 
    res.setHeader('Content-Type', 'application/json'); 
    res.send(swaggerSpec); 
});

const PORT = process.env.PORT || 16000;

// Configurações de segurança
const corsOptions = {
    origin: (process.env.ALLOWED_ORIGINS || 'http://localhost:16001').split(','),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(logger('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));
app.use(cors(corsOptions));

// Security headers
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    next();
});

// Ligação ao MongoDB
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://mongodb:27017/projetoEW";
mongoose.connect(MONGODB_URI)
    .then(() => console.log('API de Dados: Ligação ao MongoDB estabelecida.'))
    .catch(err => console.error('Erro na ligação ao MongoDB:', err));

// Rotas
app.use('/users', require('./routes/userRoutes'));
app.use('/resources', require('./routes/resourceRoutes'));
app.use('/posts', require('./routes/postRoutes'));
app.use('/news', require('./routes/newsRoutes'));
app.use('/admin', require('./routes/adminRoutes'));

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK' });
});

// Tratamento de erros 404
app.use((req, res, next) => {
    if (req.path === '/api-docs-json' || req.path === '/api-docs-ui') return next();
    res.status(404).json({ message: 'Endpoint não encontrado' });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(err.status || 500).json({ message: "Erro no servidor" });
});

app.listen(PORT, () => {
    console.log(`API de Dados a correr na porta ${PORT}`);
    const News = require('./controllers/newsController');
    setInterval(() => {
        News.generateTop3News();
    }, 3600000);
});
