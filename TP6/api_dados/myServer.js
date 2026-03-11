const express = require('express');
const mongoose = require('mongoose');
const app = express();

app.use(express.json());

// Logger
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url} ${new Date().toISOString().substring(0, 16)}`);
    next();
});

// MongoDB Connection
const nomeBD = "cinema"
const mongoHost = process.env.MONGO_URL || `mongodb://127.0.0.1:27017/${nomeBD}`
mongoose.connect(mongoHost)
    .then(() => console.log(`MongoDB: Ligado à base de dados ${nomeBD}`))
    .catch(err => console.error('Erro de conexão ao MongoDB:', err));

// Schemas
const filmSchema = new mongoose.Schema({
    _id: String
}, { strict: false, collection: 'filmes', versionKey: false });

const actorSchema = new mongoose.Schema({
    _id: String
}, { strict: false, collection: 'atores', versionKey: false });

const genreSchema = new mongoose.Schema({
    _id: String
}, { strict: false, collection: 'generos', versionKey: false });

const Filme = mongoose.model('Filme', filmSchema);
const Ator = mongoose.model('Ator', actorSchema);
const Genero = mongoose.model('Genero', genreSchema);

// generic find helper
const getItems = async (Model, req, res) => {
    try {
        let query = {};
        let projection = {};
        if (req.query._select) {
            req.query._select.split(',').forEach(f => projection[f.trim()] = 1);
        }
        const items = await Model.find(query, projection).exec();
        res.json(items);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const getItemById = async (Model, req, res) => {
    try {
        const item = await Model.findById(req.params.id);
        if (!item) return res.status(404).json({ error: "Não encontrado" });
        res.json(item);
    } catch (err) {
        res.status(400).json({ error: "ID inválido ou erro de sistema" });
    }
};

// Routes
app.get('/filmes', (req, res) => getItems(Filme, req, res));
app.get('/filmes/:id', (req, res) => getItemById(Filme, req, res));

app.get('/atores', (req, res) => getItems(Ator, req, res));
app.get('/atores/:id', (req, res) => getItemById(Ator, req, res));

app.get('/generos', (req, res) => getItems(Genero, req, res));
app.get('/generos/:id', (req, res) => getItemById(Genero, req, res));

const PORT = 7789;
app.listen(PORT, () => console.log(`API Cinema a correr na porta ${PORT}`));
