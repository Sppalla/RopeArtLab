#!/bin/bash
# Script de build para Render.com
set -e

echo "🚀 Iniciando build no Render..."
echo "📍 Diretório atual: $(pwd)"
echo "📦 Node.js versão: $(node --version)"
echo "⚙️ npm versão: $(npm --version)"

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ ERROR: package.json não encontrado!"
    echo "📁 Conteúdo do diretório:"
    ls -la
    exit 1
fi

echo "✅ package.json encontrado"
echo "📦 Instalando dependências..."

# Instalar dependências
npm install --production --silent

echo "✅ Dependências instaladas com sucesso!"
echo "🔍 Verificando estrutura do projeto:"
ls -la

if [ -f "server.js" ]; then
    echo "✅ server.js encontrado"
else
    echo "❌ ERROR: server.js não encontrado!"
    exit 1
fi

if [ -d "src" ]; then
    echo "✅ Diretório src encontrado"
    ls -la src/
else
    echo "❌ ERROR: Diretório src não encontrado!"
    exit 1
fi

echo "🎉 Build concluído com sucesso!"
