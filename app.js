// App.js - Servidor mínimo para Render
const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

console.log('🚀 RopeArtLab iniciando...');
console.log('📍 PORT:', PORT);
console.log('📁 DIR:', __dirname);

// Middleware
app.use(express.static(path.join(__dirname, 'src')));
app.use(express.json());

// Rota principal
app.get('/', (req, res) => {
    console.log('📄 Carregando página principal...');
    try {
        res.sendFile(path.join(__dirname, 'src', 'index.html'));
    } catch (err) {
        console.error('❌ Erro ao carregar index:', err);
        res.status(500).send('Erro interno');
    }
});

// Admin
app.get('/admin', (req, res) => {
    console.log('🔧 Carregando admin...');
    res.sendFile(path.join(__dirname, 'src', 'admin.html'));
});

// Health check simples
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Erro 404 customizado
app.use((req, res) => {
    console.log('❓ Rota não encontrada:', req.url);
    res.status(404).send('Página não encontrada');
});

// Iniciar servidor
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Servidor rodando na porta ${PORT}`);
    console.log(`🌐 URL: http://localhost:${PORT}`);
});

// Capturar erros
process.on('uncaughtException', (err) => {
    console.error('💥 Erro não capturado:', err);
    process.exit(1);
});

process.on('unhandledRejection', (reason) => {
    console.error('💥 Promise rejeitada:', reason);
    process.exit(1);
});
