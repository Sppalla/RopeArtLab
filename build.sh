#!/bin/bash
# Build script para Render.com - FORÇA NODE.JS

echo "🚀 RopeArtLab Build Script - Node.js"
echo "📍 Diretório: $(pwd)"
echo "📦 Node version: $(node --version)"
echo "⚙️ npm version: $(npm --version)"

# Verificar se é realmente Node.js
if [ ! -f "package.json" ]; then
    echo "❌ ERRO: package.json não encontrado!"
    exit 1
fi

echo "✅ package.json encontrado - Node.js confirmado!"

# Instalar dependências
echo "📦 Instalando dependências..."
npm install

echo "✅ Build Node.js concluído!"
