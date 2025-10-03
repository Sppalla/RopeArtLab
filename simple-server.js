// Servidor simplificado para debug no Render
const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

console.log('🚀 Iniciando RopeArtLab Simple Server...');
console.log('📍 PORT:', PORT);
console.log('📁 __dirname:', __dirname);

// Middleware básico
app.use(express.json());
app.use(express.static('src'));

// Rota de teste
app.get('/test', (req, res) => {
    res.json({
        message: 'RopeArtLab Server funcionando!',
        timestamp: new Date().toISOString(),
        port: PORT,
        environment: process.env.NODE_ENV || 'development'
    });
});

// Rota de saúde para Render
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'healthy', timestamp: Date.now() });
});

// Servir arquivo principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'src', 'index.html'));
});

// Servir admin
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'src', 'admin.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`✅ RopeArtLab rodando na porta ${PORT}`);
    console.log(`🌐 Frontend: http://localhost:${PORT}`);
    console.log(`🔧 Admin: http://localhost:${PORT}/admin`);
    console.log(`📊 Health: http://localhost:${PORT}/health`);
});
