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
        try {
            res.locals.user = JSON.parse(req.cookies.user);
        } catch (e) {
            console.error('Error parsing user cookie:', e);
            res.locals.user = null;
        }
    }
    next();
});

// Página Principal (News Feed)
router.get('/', async (req, res) => {
    try {
        const [newsResponse, topResponse, statsResponse] = await Promise.all([
            axios.get(`${API_URL}/news`),
            axios.get(`${API_URL}/resources?top=true`),
            axios.get(`${API_URL}/admin/stats`)
        ]);

        res.render('index', { 
            title: 'EduPortal - Recursos Educativos', 
            news: newsResponse.data, 
            top: topResponse.data,
            stats: statsResponse.data
        });
    } catch (error) {
        res.render('error', { message: 'Erro ao carregar notícias e estatísticas', error: error });
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
        form.append('subtitulo', req.body.subtitulo || '');
        form.append('ano', req.body.ano);
        form.append('tipo', req.body.tipo);
        form.append('dataCriacao', req.body.dataCriacao || '');
        form.append('visibilidade', req.body.visibilidade);
        form.append('produtor', user._id);
        
        const tags = req.body.hashtags ? req.body.hashtags.split(',').map(s => s.trim()) : [];
        form.append('hashtags', JSON.stringify(tags));

        form.append('zipFile', fs.createReadStream(req.file.path), {
            filename: req.file.originalname,
            contentType: req.file.mimetype
        });

        const response = await axios.post(`${API_URL}/resources/ingest`, form, {
            headers: { 
                ...form.getHeaders(),
                Authorization: req.cookies.token 
            },
            timeout: 300000 // 5 minutos
        });

        if (req.file) fs.unlinkSync(req.file.path);
        
        // Notícia automática
        await axios.post(`${API_URL}/news`, { 
            conteudo: `Novo recurso: ${req.body.titulo}`, 
            tipo: 'submissao' 
        });

        // Devolver JSON para o fetch do frontend
        res.status(200).json({ _id: response.data._id });

    } catch (error) {
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        
        const errorData = error.response ? error.response.data : error;
        // Se for um pedido fetch (XHR), devolvemos JSON de erro
        if (req.xhr || req.headers.accept.indexOf('json') > -1) {
            return res.status(error.response ? error.response.status : 500).json(errorData);
        }
        
        res.render('error', { 
            title: 'Erro na Ingestão', 
            message: 'Ocorreu um problema ao processar o seu pacote SIP.',
            error: errorData 
        });
    }
});

// GET Listagem de Recursos
router.get('/resources', async (req, res) => {
    try {
        let queryParams = '';
        if (req.query.tipo) queryParams = `?tipo=${req.query.tipo}`;
        else if (req.query.hashtag) queryParams = `?hashtag=${req.query.hashtag}`;
        
        const response = await axios.get(`${API_URL}/resources${queryParams}`);
        res.render('resources', { 
            title: 'EduPortal - Listagem de Recursos', 
            resources: response.data,
            queryTipo: req.query.tipo 
        });
    } catch (error) {
        res.render('error', { message: 'Erro ao carregar recursos', error: error });
    }
});

// --- ROTAS DE EDIÇÃO (Devem vir antes do :id genérico) ---

// GET Editar Recurso
router.get('/resources/edit/:id', async (req, res) => {
    if (!req.cookies.token) return res.redirect('/login');
    try {
        const response = await axios.get(`${API_URL}/resources/${req.params.id}`, {
            headers: { Authorization: req.cookies.token }
        });
        
        const user = JSON.parse(req.cookies.user);
        if (response.data.produtor !== user._id && user.nivel !== 'admin') {
            return res.status(403).render('error', { message: 'Acesso Negado: Não pode editar este recurso.' });
        }

        res.render('editResource', { title: 'EduPortal - Editar Recurso', resource: response.data });
    } catch (error) {
        res.render('error', { message: 'Erro ao carregar recurso para edição', error: error });
    }
});

// POST Editar Recurso
router.post('/resources/edit/:id', async (req, res) => {
    if (!req.cookies.token) return res.redirect('/login');
    try {
        const tags = req.body.hashtags ? req.body.hashtags.split(',').map(s => s.trim()) : [];
        const updateData = {
            titulo: req.body.titulo,
            subtitulo: req.body.subtitulo,
            tipo: req.body.tipo,
            ano: req.body.ano,
            hashtags: tags,
            visibilidade: req.body.visibilidade
        };

        await axios.put(`${API_URL}/resources/${req.params.id}`, updateData, {
            headers: { Authorization: req.cookies.token }
        });
        
        res.redirect(`/resources/${req.params.id}`);
    } catch (error) {
        res.render('error', { message: 'Erro ao guardar alterações', error: error });
    }
});

// GET Download (DIP)
router.get('/resources/download/:id', async (req, res) => {
    if (!req.cookies.token) return res.redirect('/login');
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

// GET Detalhe do Recurso (Genérica - Deve vir por último)
router.get('/resources/:id', async (req, res) => {
    try {
        const resourceResponse = await axios.get(`${API_URL}/resources/${req.params.id}`);
        const postsResponse = await axios.get(`${API_URL}/posts/resource/${req.params.id}`);
        
        let totalStars = 0;
        let countRatings = 0;
        postsResponse.data.forEach(p => {
            if (p.ratings) {
                p.ratings.forEach(r => {
                    totalStars += r.estrelas;
                    countRatings++;
                });
            }
        });
        const average = countRatings > 0 ? (totalStars / countRatings).toFixed(1) : "0.0";

        res.render('resource', { 
            title: `EduPortal - ${resourceResponse.data.titulo}`, 
            resource: resourceResponse.data,
            posts: postsResponse.data,
            ratingAverage: average,
            ratingCount: countRatings
        });
    } catch (error) {
        res.status(404).render('error', { title: 'Recurso Não Encontrado' });
    }
});

// Painel Admin, Import, Export...
router.get('/admin', async (req, res) => {
    if (!req.cookies.token) return res.redirect('/login');
    try {
        const usersResponse = await axios.get(`${API_URL}/users`, { headers: { Authorization: req.cookies.token } });
        const resourcesResponse = await axios.get(`${API_URL}/resources`);
        res.render('admin', { title: 'EduPortal - Administração', users: usersResponse.data, resources: resourcesResponse.data });
    } catch (error) {
        res.redirect('/logout');
    }
});

router.post('/admin-import', upload.single('zipFile'), async (req, res) => {
    if (!req.cookies.token) return res.redirect('/login');
    try {
        const form = new FormData();
        form.append('zipFile', fs.createReadStream(req.file.path), { filename: req.file.originalname, contentType: req.file.mimetype });
        await axios.post(`${API_URL}/admin/import`, form, { headers: { ...form.getHeaders(), Authorization: req.cookies.token }, timeout: 300000 });
        if (req.file) fs.unlinkSync(req.file.path);
        res.redirect('/admin?restore=success');
    } catch (error) {
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        res.render('error', { title: 'Erro no Restore', message: 'Falha ao restaurar os dados.', error: error });
    }
});

router.get('/admin/delete-resource/:id', async (req, res) => {
    if (!req.cookies.token) return res.status(404).render('error');
    try {
        await axios.delete(`${API_URL}/resources/${req.params.id}`, { headers: { Authorization: req.cookies.token } });
        res.redirect('/admin');
    } catch (error) { res.status(404).render('error'); }
});

router.get('/admin/delete-user/:id', async (req, res) => {
    if (!req.cookies.token) return res.status(404).render('error');
    try {
        await axios.delete(`${API_URL}/users/${req.params.id}`, { headers: { Authorization: req.cookies.token } });
        res.redirect('/admin');
    } catch (error) { res.status(404).render('error'); }
});

router.get('/admin/export', async (req, res) => {
    if (!req.cookies.token) return res.status(404).render('error');
    try {
        const response = await axios({ url: `${API_URL}/admin/export`, method: 'GET', headers: { Authorization: req.cookies.token }, responseType: 'stream' });
        res.set('Content-Type', 'application/zip');
        res.set('Content-Disposition', 'attachment; filename="EduPortal-Full-Export.zip"');
        response.data.pipe(res);
    } catch (error) { res.status(404).render('error'); }
});

router.post('/resources/post/:rid', async (req, res) => {
    if (!req.cookies.token) return res.redirect('/login');
    try {
        const user = JSON.parse(req.cookies.user);
        await axios.post(`${API_URL}/posts`, { resourceId: req.params.rid, userId: user._id, conteudo: req.body.conteudo }, { headers: { Authorization: req.cookies.token } });
        res.redirect(`/resources/${req.params.rid}`);
    } catch (error) { res.render('error', { message: 'Erro ao publicar post', error: error }); }
});

router.post('/resources/rating/:rid', async (req, res) => {
    if (!req.cookies.token) return res.redirect('/login');
    try {
        const user = JSON.parse(req.cookies.user);
        const posts = await axios.get(`${API_URL}/posts/resource/${req.params.rid}`);
        let postId;
        if (posts.data.length > 0) postId = posts.data[0]._id;
        else {
            const newPost = await axios.post(`${API_URL}/posts`, { resourceId: req.params.rid, userId: 'system', conteudo: 'Ratings e Comentários Gerais' }, { headers: { Authorization: req.cookies.token } });
            postId = newPost.data._id;
        }
        await axios.post(`${API_URL}/posts/${postId}/rating`, { userId: user._id, estrelas: req.body.estrelas }, { headers: { Authorization: req.cookies.token } });
        res.redirect(`/resources/${req.params.rid}`);
    } catch (error) { res.render('error', { message: 'Erro ao submeter rating', error: error }); }
});

router.get('/login', (req, res) => res.render('login', { title: 'EduPortal - Login' }));
router.post('/login', async (req, res) => {
    try {
        const response = await axios.post(`${API_URL}/users/login`, req.body);
        const cookieOptions = { httpOnly: true, sameSite: 'strict' };
        res.cookie('token', response.data.token, cookieOptions);
        res.cookie('user', JSON.stringify(response.data.user), cookieOptions);
        res.redirect('/');
    } catch (error) { res.render('login', { title: 'EduPortal - Login', error: "Credenciais inválidas." }); }
});

router.get('/register', (req, res) => res.render('register', { title: 'EduPortal - Registo' }));
router.post('/register', async (req, res) => {
    try {
        if (req.body.password !== req.body.confirm_password) return res.render('register', { error: "As passwords não coincidem." });
        await axios.post(`${API_URL}/users`, req.body);
        await axios.post(`${API_URL}/news`, { conteudo: `Novo utilizador registado: ${req.body.nome}`, tipo: 'utilizador' });
        res.redirect('/login');
    } catch (error) { res.render('register', { error: "Erro no registo." }); }
});

router.get('/logout', (req, res) => { res.clearCookie('token'); res.clearCookie('user'); res.redirect('/'); });
router.get('/help', (req, res) => res.render('help', { title: 'EduPortal - Ajuda' }));

router.use((req, res) => { res.status(404).render('error', { title: 'Página Não Encontrada' }); });

module.exports = router;
