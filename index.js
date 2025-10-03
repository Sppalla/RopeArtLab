const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

console.log('🚀 RopeArtLab SIMPLIFIED starting...');
console.log('📍 PORT:', PORT);

// Servir arquivos estáticos do src
app.use(express.static(path.join(__dirname, 'src')));
app.use('/public', express.static(path.join(__dirname, 'public')));

// Rota principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Rota admin
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'src', 'admin.html'));
});

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        message: 'RopeArtLab funcionando!',
        timestamp: new Date().toISOString() 
    });
});

// Test endpoint
app.get('/test', (req, res) => {
    res.json({
        success: true,
        message: 'API funcionando!',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'production'
    });
});

app.listen(PORT, () => {
    console.log(`✅ RopeArtLab rodando na porta ${PORT}`);
    console.log(`🌐 http://localhost:${PORT}`);
});
