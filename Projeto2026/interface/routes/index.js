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
        const config = req.cookies.token ? { headers: { Authorization: req.cookies.token } } : {};
        const [newsResponse, topResponse, statsResponse] = await Promise.all([
            axios.get(`${API_URL}/news`),
            axios.get(`${API_URL}/resources?top=true`, config),
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
    // Se não estiver logado, finge que a página não existe
    if (!req.cookies.token) {
        return res.status(404).render('error', { title: 'Página Não Encontrada' });
    }
    res.render('ingest', { title: 'EduPortal - Ingestão de Recurso' });
});

// POST Ingestão
router.post('/ingest', upload.single('zipFile'), async (req, res) => {
    if (!req.cookies.token) return res.status(404).render('error');
    
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
            timeout: 300000 
        });

        if (req.file) fs.unlinkSync(req.file.path);
        
        await axios.post(`${API_URL}/news`, { 
            conteudo: `Novo recurso: ${req.body.titulo}`, 
            tipo: 'submissao',
            resourceId: response.data._id
        });

        res.status(200).json({ _id: response.data._id });

    } catch (error) {
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        const errorData = error.response ? error.response.data : error;
        if (req.xhr || req.headers.accept.indexOf('json') > -1) {
            return res.status(error.response ? error.response.status : 500).json(errorData);
        }
        res.render('error', { title: 'Erro na Ingestão', message: 'Ocorreu um problema ao processar o seu pacote SIP.', error: errorData });
    }
});

// GET Listagem de Recursos
router.get('/resources', async (req, res) => {
    try {
        let queryParams = '';
        if (req.query.tipo) queryParams = `?tipo=${req.query.tipo}`;
        else if (req.query.hashtag) queryParams = `?hashtag=${req.query.hashtag}`;
        else if (req.query.ano) queryParams = `?ano=${req.query.ano}`;
        
        const config = req.cookies.token ? { headers: { Authorization: req.cookies.token } } : {};
        const response = await axios.get(`${API_URL}/resources${queryParams}`, config);
        
        let anos = [];
        try {
            const allResources = await axios.get(`${API_URL}/resources`, config);
            if (allResources.data && Array.isArray(allResources.data)) {
                anos = [...new Set(allResources.data.map(r => r.ano))].filter(a => a).sort((a, b) => b - a);
            }
        } catch (e) { console.error("Erro ao obter anos:", e.message); }

        res.render('resources', { 
            title: 'EduPortal - Listagem de Recursos', 
            resources: response.data || [],
            queryTipo: req.query.tipo,
            queryAno: req.query.ano,
            anos: anos
        });
    } catch (error) {
        res.status(500).render('error', { title: 'Erro de Ligação', message: 'Não foi possível carregar os recursos.', error: error });
    }
});

// GET Download (DIP)
router.get('/resources/download/:id', async (req, res) => {
    try {
        const response = await axios({
            url: `${API_URL}/resources/download/${req.params.id}`,
            method: 'GET',
            responseType: 'stream',
            headers: req.cookies.token ? { Authorization: req.cookies.token } : {}
        });
        res.set('Content-Type', 'application/zip');
        res.set('Content-Disposition', `attachment; filename="DIP-${req.params.id}.zip"`);
        response.data.pipe(res);
    } catch (error) {
        res.render('error', { message: 'Erro ao descarregar recurso', error: error });
    }
});

// GET Download de Ficheiro Individual
router.get('/resources/:id/file/:filename', async (req, res) => {
    try {
        const response = await axios({
            url: `${API_URL}/resources/${req.params.id}/file/${encodeURIComponent(req.params.filename)}`,
            method: 'GET',
            responseType: 'stream',
            headers: { Authorization: req.cookies.token }
        });
        res.set('Content-Disposition', `attachment; filename="${req.params.filename}"`);
        response.data.pipe(res);
    } catch (error) {
        res.status(404).render('error', { title: 'Ficheiro Não Encontrado' });
    }
});

// GET Detalhe do Recurso
router.get('/resources/:id', async (req, res) => {
    try {
        const config = req.cookies.token ? { headers: { Authorization: req.cookies.token } } : {};
        const resourceResponse = await axios.get(`${API_URL}/resources/${req.params.id}`, config);
        const postsResponse = await axios.get(`${API_URL}/posts/resource/${req.params.id}`, config);
        
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
        res.render('error', { message: 'Erro ao carregar detalhes do recurso', error: error });
    }
});

// GET Painel de Administração
router.get('/admin', async (req, res) => {
    // Ofuscação de segurança: se não for admin ou não logado, 404
    if (!req.cookies.token || !res.locals.user || res.locals.user.nivel !== 'admin') {
        return res.status(404).render('error', { title: 'Página Não Encontrada' });
    }

    try {
        const config = { headers: { Authorization: req.cookies.token } };
        const usersResponse = await axios.get(`${API_URL}/users`, config);
        const resourcesResponse = await axios.get(`${API_URL}/resources`, config);
        res.render('admin', { title: 'EduPortal - Administração', users: usersResponse.data, resources: resourcesResponse.data });
    } catch (error) {
        res.status(404).render('error');
    }
});

// GET Eliminar Recurso (Admin)
router.get('/admin/delete-resource/:id', async (req, res) => {
    if (!req.cookies.token || !res.locals.user || res.locals.user.nivel !== 'admin') {
        return res.status(404).render('error');
    }
    try {
        await axios.delete(`${API_URL}/resources/${req.params.id}`, { headers: { Authorization: req.cookies.token } });
        res.redirect('/admin');
    } catch (error) { res.status(404).render('error'); }
});

// GET Eliminar Utilizador (Admin)
router.get('/admin/delete-user/:id', async (req, res) => {
    if (!req.cookies.token || !res.locals.user || res.locals.user.nivel !== 'admin') {
        return res.status(404).render('error');
    }
    try {
        await axios.delete(`${API_URL}/users/${req.params.id}`, { headers: { Authorization: req.cookies.token } });
        res.redirect('/admin');
    } catch (error) { res.status(404).render('error'); }
});

// GET Exportação Global (Admin)
router.get('/admin/export', async (req, res) => {
    if (!req.cookies.token || !res.locals.user || res.locals.user.nivel !== 'admin') {
        return res.status(404).render('error');
    }
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
    } catch (error) { res.status(404).render('error'); }
});

// POST Novo Post
router.post('/resources/post/:rid', async (req, res) => {
    if (!req.cookies.token) return res.status(404).render('error');
    try {
        const user = JSON.parse(req.cookies.user);
        await axios.post(`${API_URL}/posts`, { resourceId: req.params.rid, userId: user._id, conteudo: req.body.conteudo }, { headers: { Authorization: req.cookies.token } });
        res.redirect(`/resources/${req.params.rid}`);
    } catch (error) { res.render('error', { message: 'Erro ao publicar post', error: error }); }
});

// POST Novo Comentário num Post
router.post('/resources/post/:pid/comment', async (req, res) => {
    if (!req.cookies.token) return res.status(404).render('error');
    try {
        const resourceId = req.body.resourceId;
        await axios.post(`${API_URL}/posts/${req.params.pid}/comment`, { conteudo: req.body.conteudo }, { headers: { Authorization: req.cookies.token } });
        res.redirect(`/resources/${resourceId}`);
    } catch (error) { res.render('error', { message: 'Erro ao publicar comentário', error: error }); }
});

// POST Novo Rating
router.post('/resources/rating/:rid', async (req, res) => {
    if (!req.cookies.token) return res.status(404).render('error');
    try {
        const config = { headers: { Authorization: req.cookies.token } };
        const user = JSON.parse(req.cookies.user);
        const posts = await axios.get(`${API_URL}/posts/resource/${req.params.rid}`, config);
        let postId;
        if (posts.data.length > 0) postId = posts.data[0]._id;
        else {
            const newPost = await axios.post(`${API_URL}/posts`, { resourceId: req.params.rid, userId: 'system', conteudo: 'Ratings e Comentários Gerais' }, config);
            postId = newPost.data._id;
        }
        await axios.post(`${API_URL}/posts/${postId}/rating`, { userId: user._id, estrelas: req.body.estrelas }, config);
        res.redirect(`/resources/${req.params.rid}`);
    } catch (error) { res.render('error', { message: 'Erro ao submeter rating', error: error }); }
});

// --- ÁREA PÚBLICA (Login/Registo) ---

router.get('/login', (req, res) => res.render('login', { title: 'EduPortal - Login' }));
router.post('/login', async (req, res) => {
    try {
        const response = await axios.post(`${API_URL}/users/login`, req.body);
        const cookieOptions = { httpOnly: true, sameSite: 'strict', secure: process.env.COOKIE_SECURE === 'true' };
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

// Documentação da API
router.get('/api-docs-json', async (req, res) => {
    try {
        const response = await axios.get(`http://api_dados:16000/api-docs-json`);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: "Erro ao obter a especificação da API" });
    }
});

router.get('/api-docs', (req, res) => {
    res.render('api_docs', { title: 'EduPortal - Documentação da API' });
});

// --- ÁREA DO UTILIZADOR (Perfil) ---

router.get('/profile', async (req, res) => {
    if (!req.cookies.token) return res.status(404).render('error');
    try {
        const user = JSON.parse(req.cookies.user);
        const config = { headers: { Authorization: req.cookies.token } };
        const [userResponse, resourcesResponse] = await Promise.all([
            axios.get(`${API_URL}/users/${user._id}`, config),
            axios.get(`${API_URL}/resources?produtor=${user._id}`, config)
        ]);
        res.render('profile', { title: `EduPortal - Perfil`, user: userResponse.data, resources: resourcesResponse.data });
    } catch (error) { res.status(404).render('error'); }
});

router.get('/profile/edit', async (req, res) => {
    if (!req.cookies.token) return res.status(404).render('error');
    try {
        const user = JSON.parse(req.cookies.user);
        const response = await axios.get(`${API_URL}/users/${user._id}`, { headers: { Authorization: req.cookies.token } });
        res.render('edit_profile', { title: 'EduPortal - Editar Perfil', user: response.data });
    } catch (error) { res.status(404).render('error'); }
});

router.post('/profile/edit', async (req, res) => {
    if (!req.cookies.token) return res.status(404).render('error');
    try {
        const user = JSON.parse(req.cookies.user);
        const response = await axios.put(`${API_URL}/users/${user._id}`, req.body, { headers: { Authorization: req.cookies.token } });
        const updatedUser = response.data;
        res.cookie('user', JSON.stringify(updatedUser), { httpOnly: true, sameSite: 'strict', secure: process.env.COOKIE_SECURE === 'true' });
        res.redirect('/profile');
    } catch (error) { res.status(404).render('error'); }
});

router.get('/resources/edit/:id', async (req, res) => {
    if (!req.cookies.token) return res.status(404).render('error');
    try {
        const config = { headers: { Authorization: req.cookies.token } };
        const response = await axios.get(`${API_URL}/resources/${req.params.id}`, config);
        const resource = response.data;
        const user = JSON.parse(req.cookies.user);
        
        // Apenas o dono pode editar (Admin já não tem permissão aqui)
        if (resource.produtor !== user._id) return res.status(404).render('error');
        
        res.render('edit_resource', { title: `EduPortal - Editar Recurso`, resource: resource });
    } catch (error) { res.status(404).render('error'); }
});

router.post('/resources/edit/:id', async (req, res) => {
    if (!req.cookies.token) return res.status(404).render('error');
    try {
        const config = { headers: { Authorization: req.cookies.token } };
        const response = await axios.get(`${API_URL}/resources/${req.params.id}`, config);
        const resource = response.data;
        const user = JSON.parse(req.cookies.user);
        
        // Validar propriedade no POST também
        if (resource.produtor !== user._id) return res.status(404).render('error');

        if (req.body.hashtags && typeof req.body.hashtags === 'string') req.body.hashtags = req.body.hashtags.split(',').map(s => s.trim()).filter(s => s.length > 0);
        await axios.put(`${API_URL}/resources/${req.params.id}`, req.body, config);
        await axios.post(`${API_URL}/news`, { conteudo: `Recurso atualizado: ${req.body.titulo}`, tipo: 'manual', resourceId: req.params.id });
        res.redirect(`/resources/${req.params.id}`);
    } catch (error) { res.status(404).render('error'); }
});

// Catch-all para rotas não encontradas
router.use((req, res) => { res.status(404).render('error', { title: 'Página Não Encontrada' }); });

module.exports = router;
