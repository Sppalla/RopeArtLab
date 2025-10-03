# Dockerfile para garantir Node.js no Render
FROM node:18-alpine

WORKDIR /app

# Copiar package.json primeiro (para cache melhor)
COPY package.json ./
COPY package-lock.json ./

# Instalar dependências
RUN npm install

# Copiar resto do código
COPY . .

# Expor porta
EXPOSE 3000

# Comando para executar
CMD ["node", "index.js"]
