const express = require('express');
const router = express.Router();
const axios = require('axios');
const multer = require('multer');
const FormData = require('form-data');
const fs = require('fs');

const API_URL = process.env.API_URL || "http://localhost:16000";
const upload = multer({ dest: 'uploads/' });

// Middleware para passar dados do utilizador para as vistas PUG
router.use((req, res, next) => {
    if (req.cookies.user) {
        res.locals.user = JSON.parse(req.cookies.user);
    }
    next();
});

// Página Principal (News Feed)
router.get('/', async (req, res) => {
    try {
        const [newsResponse, topResponse] = await Promise.all([
            axios.get(`${API_URL}/news`),
            axios.get(`${API_URL}/resources?top=true`)
        ]);
        res.render('index', { title: 'EduPortal - Recursos Educativos', news: newsResponse.data, top: topResponse.data });
    } catch (error) {
        res.render('error', { message: 'Erro ao carregar notícias', error: error });
    }
});

// GET Ingestão
router.get('/ingest', (req, res) => {
    if (!req.cookies.token) return res.redirect('/login');
    res.render('ingest', { title: 'EduPortal - Ingestão de Recurso' });
});

// POST Ingestão
router.post('/ingest', upload.single('zipFile'), async (req, res) => {
    if (!req.cookies.token) return res.redirect('/login');
    
    try {
        const user = JSON.parse(req.cookies.user);
        const form = new FormData();
        form.append('titulo', req.body.titulo);
        form.append('subtitulo', req.body.subtitulo);
        form.append('tipo', req.body.tipo);
        form.append('dataCriacao', req.body.dataCriacao);
        form.append('visibilidade', req.body.visibilidade);
        form.append('produtor', user._id);
        
        const tags = req.body.hashtags ? req.body.hashtags.split(',').map(s => s.trim()) : [];
        form.append('hashtags', JSON.stringify(tags));

        form.append('zipFile', fs.createReadStream(req.file.path), {
            filename: req.file.originalname,
            contentType: req.file.mimetype
        });

        await axios.post(`${API_URL}/resources/ingest`, form, {
            headers: { 
                ...form.getHeaders(),
                Authorization: req.cookies.token 
            }
        });

        fs.unlinkSync(req.file.path);
        await axios.post(`${API_URL}/news`, { conteudo: `Novo recurso: ${req.body.titulo}`, tipo: 'submissao' });
        res.redirect('/');

    } catch (error) {
        if (req.file) fs.unlinkSync(req.file.path);
        res.render('error', { message: 'Erro na ingestão', error: error.response ? error.response.data : error });
    }
});

// GET Listagem de Recursos
router.get('/resources', async (req, res) => {
    try {
        let queryParams = '';
        if (req.query.tipo) queryParams = `?tipo=${req.query.tipo}`;
        else if (req.query.hashtag) queryParams = `?hashtag=${req.query.hashtag}`;
        
        const response = await axios.get(`${API_URL}/resources${queryParams}`);
        res.render('resources', { title: 'EduPortal - Listagem de Recursos', resources: response.data });
    } catch (error) {
        res.render('error', { message: 'Erro ao carregar recursos', error: error });
    }
});

// GET Detalhe do Recurso
router.get('/resources/:id', async (req, res) => {
    try {
        const resourceResponse = await axios.get(`${API_URL}/resources/${req.params.id}`);
        const postsResponse = await axios.get(`${API_URL}/posts/resource/${req.params.id}`);
        res.render('resource', { 
            title: `EduPortal - ${resourceResponse.data.titulo}`, 
            resource: resourceResponse.data,
            posts: postsResponse.data
        });
    } catch (error) {
        res.render('error', { message: 'Erro ao carregar detalhes do recurso', error: error });
    }
});

// GET Download (DIP)
router.get('/resources/download/:id', async (req, res) => {
    try {
        const response = await axios({
            url: `${API_URL}/resources/download/${req.params.id}`,
            method: 'GET',
            responseType: 'stream'
        });

        res.set('Content-Type', 'application/zip');
        res.set('Content-Disposition', `attachment; filename="DIP-${req.params.id}.zip"`);
        response.data.pipe(res);
    } catch (error) {
        res.render('error', { message: 'Erro ao descarregar recurso', error: error });
    }
});

// GET Painel de Administração
router.get('/admin', async (req, res) => {
    if (!req.cookies.token) return res.redirect('/login');
    if (!res.locals.user || res.locals.user.nivel !== 'admin') {
        return res.render('error', { message: 'Acesso Negado: Apenas administradores podem ver esta página.', error: { stack: '' } });
    }

    try {
        const usersResponse = await axios.get(`${API_URL}/users`, { headers: { Authorization: req.cookies.token } });
        const resourcesResponse = await axios.get(`${API_URL}/resources`);
        res.render('admin', { title: 'EduPortal - Administração', users: usersResponse.data, resources: resourcesResponse.data });
    } catch (error) {
        res.render('error', { message: 'Erro ao carregar dados de administração', error: error });
    }
});

// GET Eliminar Recurso (Admin)
router.get('/admin/delete-resource/:id', async (req, res) => {
    if (!req.cookies.token) return res.redirect('/login');
    try {
        await axios.delete(`${API_URL}/resources/${req.params.id}`, { headers: { Authorization: req.cookies.token } });
        res.redirect('/admin');
    } catch (error) {
        res.render('error', { message: 'Erro ao eliminar recurso', error: error });
    }
});

// GET Eliminar Utilizador (Admin)
router.get('/admin/delete-user/:id', async (req, res) => {
    if (!req.cookies.token) return res.redirect('/login');
    try {
        await axios.delete(`${API_URL}/users/${req.params.id}`, { headers: { Authorization: req.cookies.token } });
        res.redirect('/admin');
    } catch (error) {
        res.render('error', { message: 'Erro ao eliminar utilizador', error: error });
    }
});

// GET Exportação Global (Admin)
router.get('/admin/export', async (req, res) => {
    if (!req.cookies.token) return res.redirect('/login');
    try {
        const response = await axios({
            url: `${API_URL}/admin/export`,
            method: 'GET',
            headers: { Authorization: req.cookies.token },
            responseType: 'stream'
        });

        res.set('Content-Type', 'application/zip');
        res.set('Content-Disposition', 'attachment; filename="EduPortal-Full-Export.zip"');
        response.data.pipe(res);
    } catch (error) {
        res.render('error', { message: 'Erro na exportação de dados', error: error });
    }
});

// POST Novo Post
router.post('/resources/post/:rid', async (req, res) => {
    if (!req.cookies.token) return res.redirect('/login');
    
    try {
        const user = JSON.parse(req.cookies.user);
        await axios.post(`${API_URL}/posts`, {
            resourceId: req.params.rid,
            userId: user._id,
            conteudo: req.body.conteudo
        }, {
            headers: { Authorization: req.cookies.token }
        });
        res.redirect(`/resources/${req.params.rid}`);
    } catch (error) {
        res.render('error', { message: 'Erro ao publicar post', error: error });
    }
});

// POST Novo Rating
router.post('/resources/rating/:rid', async (req, res) => {
    if (!req.cookies.token) return res.redirect('/login');

    try {
        const user = JSON.parse(req.cookies.user);
        const posts = await axios.get(`${API_URL}/posts/resource/${req.params.rid}`);
        let postId;
        
        if (posts.data.length > 0) {
            postId = posts.data[0]._id;
        } else {
            const newPost = await axios.post(`${API_URL}/posts`, {
                resourceId: req.params.rid,
                userId: 'system',
                conteudo: 'Ratings e Comentários Gerais'
            }, {
                headers: { Authorization: req.cookies.token }
            });
            postId = newPost.data._id;
        }

        await axios.post(`${API_URL}/posts/${postId}/rating`, {
            userId: user._id,
            estrelas: req.body.estrelas
        }, {
            headers: { Authorization: req.cookies.token }
        });

        res.redirect(`/resources/${req.params.rid}`);
    } catch (error) {
        res.render('error', { message: 'Erro ao submeter rating', error: error });
    }
});

// GET Login
router.get('/login', (req, res) => {
    res.render('login', { title: 'EduPortal - Login' });
});

// POST Login
router.post('/login', async (req, res) => {
    try {
        const response = await axios.post(`${API_URL}/users/login`, req.body);
        res.cookie('token', response.data.token);
        res.cookie('user', JSON.stringify(response.data.user));
        res.redirect('/');
    } catch (error) {
        let msg = "Credenciais inválidas. Por favor, tente novamente.";
        if (error.response && error.response.data && error.response.data.message) {
            msg = error.response.data.message;
        }
        res.render('login', { title: 'EduPortal - Login', error: msg });
    }
});

// GET Registo
router.get('/register', (req, res) => {
    res.render('register', { title: 'EduPortal - Registo' });
});

// POST Registo
router.post('/register', async (req, res) => {
    try {
        if (req.body.password !== req.body.confirm_password) {
            return res.render('register', { title: 'EduPortal - Registo', error: "As passwords não coincidem." });
        }

        await axios.post(`${API_URL}/users`, req.body);
        
        // Notícia automática de novo utilizador
        await axios.post(`${API_URL}/news`, {
            conteudo: `Novo utilizador registado: ${req.body.nome}`,
            tipo: 'utilizador'
        });

        res.redirect('/login');
    } catch (error) {
        let msg = "Erro no registo. Por favor, tente novamente.";
        if (error.response && error.response.data && error.response.data.message) {
            msg = error.response.data.message;
        }
        res.render('register', { title: 'EduPortal - Registo', error: msg });
    }
});

// GET Logout
router.get('/logout', (req, res) => {
    res.clearCookie('token');
    res.clearCookie('user');
    res.redirect('/');
});

module.exports = router;
