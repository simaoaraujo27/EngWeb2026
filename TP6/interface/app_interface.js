const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(express.static(path.join(__dirname, 'public')));

const API_URL = process.env.API_URL || "http://localhost:7789";

const formatDate = () => new Date().toISOString().substring(0, 16);

// Filmes
app.get('/filmes', (req, res) => {
    axios.get(`${API_URL}/filmes`)
        .then(response => {
            res.render('filmes_lista', { filmes: response.data, date: formatDate() });
        })
        .catch(err => res.render('error', { error: err, message: "Erro ao obter filmes" }));
});

app.get('/filmes/:id', (req, res) => {
    axios.get(`${API_URL}/filmes/${req.params.id}`)
        .then(response => {
            res.render('filme_detalhe', { filme: response.data, date: formatDate() });
        })
        .catch(err => res.render('error', { error: err, message: "Erro ao obter detalhe do filme" }));
});

// Atores
app.get('/atores', (req, res) => {
    axios.get(`${API_URL}/atores`)
        .then(response => {
            res.render('atores_lista', { atores: response.data, date: formatDate() });
        })
        .catch(err => res.render('error', { error: err, message: "Erro ao obter atores" }));
});

app.get('/atores/:id', (req, res) => {
    axios.get(`${API_URL}/atores/${req.params.id}`)
        .then(response => {
            res.render('ator_detalhe', { ator: response.data, date: formatDate() });
        })
        .catch(err => res.render('error', { error: err, message: "Erro ao obter detalhe do ator" }));
});

// Generos
app.get('/generos', (req, res) => {
    axios.get(`${API_URL}/generos`)
        .then(response => {
            res.render('generos_lista', { generos: response.data, date: formatDate() });
        })
        .catch(err => res.render('error', { error: err, message: "Erro ao obter géneros" }));
});

// Home redirect
app.get('/', (req, res) => res.redirect('/filmes'));

const PORT = 7790;
app.listen(PORT, () => console.log(`Interface Cinema a correr na porta ${PORT}`));
