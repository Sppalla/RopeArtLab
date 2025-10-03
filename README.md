# 🎨 RopeArtLab - Sistema de Catálogo de Produtos

## 📋 Sobre o Projeto

**RopeArtLab** é um sistema completo de e-commerce para vendas de cordas decorativas, desenvolvido com tecnologias modernas e arquitetura híbrida.

### ✨ Características Principais

- 🎨 **Catálogo de Produtos** - Visualização atrativa de produtos
- 👥 **Sistema de Clientes** - Cadastro e gestão de usuários  
- 📦 **Gestão de Pedidos** - Aprovação, cancelamento e tracking
- 📊 **Analytics Financeiro** - Dashboard executivo completo
- 🍞 **Arquitetura Híbrida** - localStorage + PostgreSQL
- 📱 **Responsivo** - Funciona perfeitamente em mobile
- 🔒 **Seguro** - Pronto para produção

## 🚀 Instalação e Uso

### Desenvolvimento Local

```bash
# Clonar repositório
git clone https://github.com/USERNAME/ropeartlab.git
cd ropeartlab

# Instalar dependências
npm install

# Executar servidor
npm start

# Acessar aplicação
# Frontend: http://localhost:3000
# Admin: http://localhost:3000/admin
# API: http://localhost:3000/api/health
```

### Deploy na Produção

```bash
# Ver guia completo em DEPLOY.md
# Simplificado:

1. Conectar repositório GitHub ao Render
2. Criar PostgreSQL Database no Render
3. Configurar variáveis de ambiente
4. Deploy automático!
```

## 🛠️ Tecnologias Utilizadas

### Frontend
- **HTML5 / CSS3** - Estrutura e estilização
- **JavaScript ES6+** - Lógica de aplicação
- **Font Awesome** - Ícones
- **Chart.js** - Gráficos e análises

### Backend
- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **PostgreSQL** - Banco de dados principal
- **Pg** - Driver PostgreSQL para Node.js

### Utilidades
- **bcryptjs** - Hash de senhas
- **cors** - Cross-Origin Resource Sharing
- **helmet** - Segurança HTTP
- **compression** - Compressão de resposta
- **morgan** - Logs HTTP

## 📁 Estrutura Geral do Projeto

```
ropeartlab/
├── 📁 src/                    # Frontend
│   ├── 📄 index.html          # Site principal
│   ├── 📄 admin.html          # Painel administrativo
│   ├── 📁 styles/             # CSS
│   └── 📁 scripts/           # JavaScript
├── 📁 routes/                 # API Routes
│   ├── 📄 products.js         # Gestão de produtos
│   ├── 📄 users.js           # Gestão de usuários
│   ├── 📄 orders.js          # Gestão de pedidos
│   └── 📁 analytics.js       # Análises financeiras
├── 📁 config/                # Configurações
│   └── 📄 database.js        # Configuração PostgreSQL
├── 📁 migrations/            # Scripts SQL
│   └── 📄 001_init_tables.sql
├── 📁 scripts/              # Scripts auxiliares
│   ├── 📄 migrate.js        # Migração de dados
│   └── 📄 post-deploy.js    # Script pós-deploy
├── 📄 server.js             # Servidor principal
├── 📄 package.json          # Dependencies
└── 📄 .gitignore           # Arquivos ignorados
```

## 🔧 Funcionalidades Implementadas

### 📦 Gestão de Produtos
- ✅ Listagem com filtros
- ✅ Criação e edição
- ✅ Soft delete (lixeira)
- ✅ Categorização
- ✅ Upload de imagens

### 👥 Sistema de Usuários
- ✅ Cadastro completo
- ✅ Login com email/CPF
- ✅ Edição de perfil
- ✅ Histórico de pedidos
- ✅ Exclusão de conta

### 📦 Gestão de Pedidos
- ✅ Fluxo: Pendente → Aprovado → Finalizado
- ✅ Cancelamento e restauração
- ✅ Análise financeira automática
- ✅ Tracking de status

### 📊 Analytics Financeiro
- ✅ Dashboard executivo
- ✅ Métricas por produto
- ✅ Análise temporal
- ✅ Relatórios exportáveis

## 🌐 API Endpoints

### Produtos
- `GET /api/products` - Listar produtos
- `GET /api/products/:id` - Produto específico
- `POST /api/products` - Criar produto
- `PUT /api/products/:id` - Atualizar produto
- `DELETE /api/products/:id` - Deletar produto

### Usuários
- `GET /api/users` - Listar usuários
- `POST /api/users/register` - Registrar usuário
- `POST /api/users/authenticate` - Login

### Pedidos
- `GET /api/orders` - Listar pedidos (admin)
- `GET /api/orders/user/:email` - Pedidos do usuário
- `POST /api/orders` - Criar pedido
- `PATCH /api/orders/:id/approve` - Aprovar pedido

## 🔒 Arquitetura Híbrida

### Funcionamento Inteligente
- **Desenvolvimento**: Usa localStorage (zero dependências)
- **Produção**: Usa PostgreSQL automaticamente  
- **Migração**: Transparente, sem perda de dados
- **Fallback**: Se API falha, volta para localStorage

### Benefícios
- ✅ **Zero impacto** no código existente
- ✅ **Escalabilidade** garantida
- ✅ **Performance** otimizada
- ✅ **Confiabilidade** máxima

## 👨‍💻 Contribuição

### Desenvolvimento
1. Clone o repositório
2. Crie uma branch: `git checkout -b feature/nova-funcionalidade`
3. Commit suas alterações: `git commit -m 'Add nova funcionalidade'`
4. Push para a branch: `git push origin feature/nova-funcionalidade`
5. Abra um Pull Request

### Padrões
- **Código**: Sempre comentado em português
- **Commits**: Descritivos e em inglês
- **Tags**: Seguir versionamento semântico

## 📋 Configuração de Ambiente

### Variáveis Obrigatórias
```env
DATABASE_URL=postgresql://user:pass@host:port/db
NODE_ENV=production
PORT=10000
```

### Variáveis Opcionais
```env
ADMIN_TOKEN=ropeartlab-admin-2024
JWT_SECRET=super_secret_key
BCRYPT_ROUNDS=12
```

## 📞 Suporte

### Documentação
- 📖 **Deploy**: `DEPLOY.md`
- 🛠️ **Instalação**: `COMO-USAR.md`
- 📊 **API**: Documentação integrada

### Contato
- 📧 **Email**: dev@ropeartlab.com
- 🐛 **Issues**: GitHub Issues
- 📱 **WhatsApp**: Suporte técnico disponível

## 📄 Licença

Este projeto está sob a licença **MIT**. Veja o arquivo `LICENSE` para detalhes.

## 🙏 Agradecimentos

- **Render.com** - Hospedagem cloud gratuita
- **PostgreSQL** - Banco de dados confiável
- **Node.js Community** - Ecossistema rico
- **Open Source** - Construindo o futuro juntos

---

**🎨 Feito com ❤️ para revolucionar o mundo das cordas decorativas!**