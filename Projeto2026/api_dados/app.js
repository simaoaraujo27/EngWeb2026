const express = require('express');
const mongoose = require('mongoose');
const logger = require('morgan');
const cors = require('cors');

const app = express();
const PORT = 16000;

// Configurações
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());

// Ligação ao MongoDB
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/projetoEW";
mongoose.connect(MONGODB_URI)
  .then(() => console.log('API de Dados: Ligação ao MongoDB estabelecida.'))
  .catch(err => console.error('Erro na ligação ao MongoDB:', err));

// Rotas
app.use('/users', require('./routes/userRoutes'));
app.use('/resources', require('./routes/resourceRoutes'));
app.use('/posts', require('./routes/postRoutes'));
app.use('/news', require('./routes/newsRoutes'));
app.use('/admin', require('./routes/adminRoutes'));

// Tratamento de erros
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint não encontrado' });
});

app.listen(PORT, () => {
    console.log(`API de Dados a correr na porta ${PORT}`);
});
