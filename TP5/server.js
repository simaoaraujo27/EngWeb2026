const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();
const port = 5000;
const db_url = 'http://localhost:3000';

// Set Pug as view engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get(['/', '/filmes'], async (req, res) => {
    try {
        const response = await axios.get(`${db_url}/filmes`);
        const filmes = response.data.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
        res.render('index', { title: 'Lista de Filmes', filmes });
    } catch (err) {
        res.status(500).send("Error fetching films: " + err.message);
    }
});

app.get('/filmes/:id', async (req, res) => {
    try {
        const response = await axios.get(`${db_url}/filmes/${req.params.id}`);
        const filme = response.data;
        res.render('filme', { title: `Filme: ${filme.title}`, filme });
    } catch (err) {
        res.status(404).send("Film not found: " + err.message);
    }
});

app.get('/atores', async (req, res) => {
    try {
        const response = await axios.get(`${db_url}/atores`);
        const atores = response.data.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        res.render('atores', { title: 'Lista de Atores', atores });
    } catch (err) {
        res.status(500).send("Error fetching actors: " + err.message);
    }
});

app.get('/atores/:id', async (req, res) => {
    try {
        const response = await axios.get(`${db_url}/atores/${req.params.id}`);
        const ator = response.data;
        res.render('ator', { title: `Ator: ${ator.name}`, ator });
    } catch (err) {
        res.status(404).send("Actor not found: " + err.message);
    }
});

app.get('/generos', async (req, res) => {
    try {
        const response = await axios.get(`${db_url}/generos`);
        const generos = response.data.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        res.render('generos', { title: 'Lista de Géneros', generos });
    } catch (err) {
        res.status(500).send("Error fetching genres: " + err.message);
    }
});

app.get('/generos/:id', async (req, res) => {
    try {
        const response = await axios.get(`${db_url}/generos/${req.params.id}`);
        const genero = response.data;
        res.render('genero', { title: `Género: ${genero.name}`, genero });
    } catch (err) {
        res.status(404).send("Genre not found: " + err.message);
    }
});

app.listen(port, () => {
    console.log(`Express server running on http://localhost:${port}`);
});
