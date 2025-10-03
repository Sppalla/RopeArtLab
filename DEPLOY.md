# 🚀 RopeArtLab - Guia de Deploy no Render

## 📋 Pré-requisitos

### 1. Conta no Render
- Crie uma conta gratuita em [render.com](https://render.com)
- Confirme seu email

### 2. Repositório no GitHub
- Crie um repositório no GitHub
- Faça upload do código do projeto

## 🏗️ Configuração do Deploy

### Passo 1: Criar Web Service no Render

1. **Acesse Render Dashboard**
   - Entre em [dashboard.render.com](https://dashboard.render.com)

2. **Criar Novo Web Service**
   ```
   New + → Web Service → Build and deploy from a Git repository
   ```

3. **Conectar Repositório**
   ```
   Connect GitHub → Selecionar repositório RopeArtLab
   ```

4. **Configurar Deploy**
   ```
   Name: ropeartlab-api
   Environment: Node
   Region: São Paulo (Brazil) ou Oregon
   Branch: main (ou sua branch principal)
   Build Command: npm install
   Start Command: npm start
   ```

### Passo 2: Configurar Banco de PostgreSQL

1. **Criar Database PostgreSQL**
   ```
   New + → PostgreSQL
   Name: ropeartlab-db
   Database: ropeartlab_db
   User: ropeartlab_user
   Region: Same as Web Service
   ```

2. **Salvar Dados de Conexão**
   ```
   Host: copiar_da_tela
   Port: 5432
   Database: ropeartlab_db
   Username: ropeartlab_user
   Password: copiar_da_tela
   ```

### Passo 3: Configurar Variáveis de Ambiente

No Web Service, vá em **Environment**:

```env
NODE_ENV=production
DATABASE_URL=postgresql://ropeartlab_user:senha@hostname:5432/ropeartlab_db
PORT=10000
FRONTEND_URL=https://seu-site.onrender.com
JWT_SECRET=super_secret_key_mudar_em_producao_123456
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Passo 4: Executar Migrações

Após o primeiro deploy, execute as migrações:

1. **Conectar ao Database**
   ```bash
   # No Render, vá em Database → Logs
   # Copie o connection string completo
   ```

2. **Aplicar Migrações**
   ```bash
   # Usando psql ou cliente SQL
   psql "postgresql://USER:PASS@HOST:PORT/DATABASE"
   
   # No terminal do cliente:
   \i migrations/001_init_tables.sql
   ```

## 📱 Configuração do Frontend

### Passo 5: Configurar Integração

1. **Atualizar URLs da API**
   ```javascript
   // Em src/scripts/api-client.js (criar este arquivo)
   const API_BASE_URL = 'https://ropeartlab-api.onrender.com/api';
   ```

2. **Modificar localStorage para usar API**
   ```javascript
   // Fallback: usar localStorage se API não estiver disponível
   const useAPI = window.location.hostname !== 'file://';
   ```

## 🔧 Monitoramento e Logs

### Render Dashboard
- **Metrics**: CPU, memória, requests
- **Logs**: Logs em tempo real
- **Deploys**: Histórico de deploy

### Banco de Dados
- **Monitor**: Performance das queries
- **Logs**: Erros de conexão
- **Backups**: Automático pelo Render

## ✅ Checklist de Deploy

### Antes do Deploy
- [ ] Código no GitHub
- [ ] Testes locais funcionando
- [ ] Banco PostgreSQL configurado
- [ ] Variáveis de ambiente definidas

### Após o Deploy
- [ ] Health check funcionando (`/api/health`)
- [ ] Migrações aplicadas
- [ ] Frontend carregando dados da API
- [ ] Sistema de login funcionando
- [ ] Admin panel acessível

### Verificações Finais
- [ ] SSL funcionando (automatic no Render)
- [ ] Performance adequada
- [ ] Logs sem erro crítico
- [ ] Backup automático ativo

## 🚨 Troubleshooting

### Erro: Cannot connect to database
```bash
# Verificar se DATABASE_URL está correto
# Verificar se PostgreSQL está ativo no Render
```

### Erro: Module not found
```bash
# Verificar package.json
# Executar npm install localmente primeiro
```

### Erro: Port binding
```bash
# Render usa porta dinâmica
# Usar process.env.PORT no código
```

### CORS Errors
```bash
# Verificar FRONTEND_URL nas variáveis
# Adicionar domínio correto no CORS
```

## 💰 Custos (Render Free Tier)

### Incluído Gratuitamente
- ✅ Web Service: 750h/mês
- ✅ PostgreSQL: 1GB storage
- ✅ SSL automático
- ✅ Custom domains

### Limites Gratuitos
- ⚠️ Web Service sleep depois de 15min inativo
- ⚠️ Database hiberna após 1h sem uso
- ⚠️ Processamento limitado

### Upgrade (quando necessário)
```
Starter: $7/mês - Sem sleep
Standard: $20/mês - Mais recursos
```

## 🎯 Próximos Passos

1. **Configurar Custom Domain**
2. **Implementar Cache Redis**
3. **Adicionar Rate Limiting Avançado**
4. **Configurar Monitoring (Uptime Robot)**
5. **Implementar Backup Strategy**

---

📞 **Suporte**: Em caso de dúvidas, consulte a [documentação do Render](https://render.com/docs)
