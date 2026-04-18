const express = require('express');
const path = require('path');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const indexRouter = require('./routes/index');

const app = express();

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ extended: false, limit: '500mb' }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Security headers
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    next();
});

// Rotas
app.use('/', indexRouter);

// Catch 404 and forward to error handler
app.use(function(req, res, next) {
  res.status(404).render('error', { message: 'Página não encontrada', error: {} });
});

// Error handler
app.use(function(err, req, res, next) {
  console.error('Unhandled error:', err);
  res.status(err.status || 500);
  res.render('error', { message: err.message, error: err });
});

const PORT = process.env.PORT || 16001;
app.listen(PORT, () => {
  console.log(`Servidor de Interface a correr na porta ${PORT}`);
});
