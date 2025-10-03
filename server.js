const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares de Segurança
app.use(helmet({
    contentSecurityPolicy: false, // Permitir servir arquivos locais
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(compression());
app.use(morgan('combined'));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // limite máximo de requests
    message: {
        error: 'Muitas tentativas. Tente novamente em alguns minutos.'
    }
});

app.use('/api/', limiter);

// CORS Configuration
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://ropeartlabs.onrender.com', process.env.FRONTEND_URL]
        : ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true
}));

// Middlewares básicos
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir arquivos estáticos do frontend
app.use(express.static('src'));

// Routes
app.use('/api/products', require('./routes/products'));
app.use('/api/users', require('./routes/users'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/webhooks', require('./routes/webhooks'));

// Rota principal - servir o frontend
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/src/index.html');
});

// Rota admin - servir o painel administrativo
app.get('/admin', (req, res) => {
    res.sendFile(__dirname + '/src/admin.html');
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        database: 'Connected',
        services: {
            users: 'Active',
            products: 'Active',
            orders: 'Active',
            analytics: 'Active'
        }
    });
});

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
    console.error('Erro na API:', err);
    res.status(500).json({
        error: 'Erro interno do servidor',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Algo deu errado'
    });
});

// 404 handler
app.use('*', (req, res) => {
    if (req.originalUrl.startsWith('/api/')) {
        res.status(404).json({ error: 'Endpoint não encontrado' });
    } else {
        res.status(404).sendFile(__dirname + '/src/index.html');
    }
});

// Inicializar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor RopeArtLab rodando na porta ${PORT}`);
    console.log(`📱 Frontend: http://localhost:${PORT}`);
    console.log(`🔧 Admin: http://localhost:${PORT}/admin`);
    console.log(`📊 API: http://localhost:${PORT}/api/health`);
    console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 Recebido SIGTERM, finalizando servidor...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('🛑 Recebido SIGINT, finalizando servidor...');
    process.exit(0);
});

module.exports = app;
