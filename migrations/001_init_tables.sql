-- =====================================================
-- ROPEARTLAB - INICIALIZAÇÃO DO BANCO DE DADOS
-- =====================================================
-- Este arquivo cria todas as tabelas necessárias para o sistema
-- Compatível com o sistema atual (localStorage) mas escalável

-- Configurações gerais
SET timezone = 'America/Sao_Paulo';

-- =====================================================
-- TABELA DE PRODUTOS
-- =====================================================
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    image_url VARCHAR(500),
    category VARCHAR(100),
    color VARCHAR(50),
    discount_price DECIMAL(10,2) CHECK (discount_price >= 0),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE NULL
);

-- Índices para produtos
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);

-- =====================================================
-- TABELA DE USUÁRIOS
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    uuid VARCHAR(36) UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
    nome VARCHAR(150) NOT NULL,
    sobrenome VARCHAR(150),
    email VARCHAR(255) UNIQUE NOT NULL,
    cpf_cnpj VARCHAR(14) UNIQUE NOT NULL,
    telefone VARCHAR(20),
    cep VARCHAR(10),
    endereco VARCHAR(255),
    numero VARCHAR(20),
    complemento VARCHAR(100),
    cidade VARCHAR(100),
    estado VARCHAR(2),
    password_hash VARCHAR(255), -- Para futuro sistema de autenticação
    email_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    deleted_at TIMESTAMP WITH TIME ZONE NULL
);

-- Índices<｜tool▁calls▁end｜>usuários
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_cpf_cnpj ON users(cpf_cnpj);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);

-- =====================================================
-- TABELA DE PEDIDOS
-- =====================================================
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    uuid VARCHAR(36) UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
    order_number VARCHAR(20) UNIQUE NOT NULL DEFAULT 'PED-' || LPAD(nextval('order_number_seq')::text, 6, '0'),
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    user_email VARCHAR(255) NOT NULL, -- Backup do email para compatibilidade
    total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'finalized', 'cancelled')),
    payment_method VARCHAR(50) DEFAULT 'whatsapp',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_at TIMESTAMP WITH TIME ZONE NULL,
    finalized_at TIMESTAMP WITH TIME ZONE NULL,
    cancelled_at TIMESTAMP WITH TIME ZONE NULL,
    restored_at TIMESTAMP WITH TIME ZONE NULL
);

-- Sequência para números de pedido
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1;

-- Índices para pedidos
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_email ON orders(user_email);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number);

-- =====================================================
-- TABELA DE ITENS DO PEDIDO
-- =====================================================
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL, -- Backupe do nome
    product_price DECIMAL(10,2) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    subtotal DECIMAL(10,2) NOT NULL CHECK (subtotal >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para itens do pedido
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- =====================================================
-- TABELA DE ANÁLISES FINANCEIRAS (CACHE)
-- =====================================================
CREATE TABLE IF NOT EXISTS analytics_cache (
    id SERIAL PRIMARY KEY,
    cache_key VARCHAR(100) NOT NULL UNIQUE,
    cache_data JSONB NOT NULL,
    period_type VARCHAR(20) NOT NULL, -- 'daily', 'weekly', 'monthly', 'yearly'
    period_value VARCHAR(20) NOT NULL, -- '2024', '2024-10', etc
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Índices para cache de análises
CREATE INDEX IF NOT EXISTS idx_analytics_cache_key ON analytics_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_analytics_expires ON analytics_cache(expires_at);

-- =====================================================
-- TABELA DE CONFIGURAÇÕES DO ADMIN
-- =====================================================
CREATE TABLE IF NOT EXISTS admin_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    description TEXT,
    updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABELA DE LOGS (AUDITORIA)
-- =====================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    table_name VARCHAR(50) NOT NULL,
    record_id INTEGER,
    action VARCHAR(20) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    old_values JSONB,
    new_values JSONB,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record ON audit_logs(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- =====================================================
-- TRIGGERS PARA AUDITORIA
-- =====================================================

-- Função para triggers de auditoria
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO audit_logs (table_name, record_id, action, old_values, new_values)
        VALUES (TG_TABLE_NAME, OLD.id, TG_OP, row_to_json(OLD), NULL);
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_logs (table_name, record_id, action, old_values, new_values)
        VALUES (TG_TABLE_NAME, NEW.id, TG_OP, row_to_json(OLD), row_to_json(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs (table_name, record_id, action, old_values, new_values)
        VALUES (TG_TABLE_NAME, NEW.id, TG_OP, NULL, row_to_json(NEW));
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Aplicar triggers em tabelas principais
CREATE TRIGGER audit_products_trigger
    AFTER INSERT OR UPDATE OR DELETE ON products
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_users_trigger
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_orders_trigger
    AFTER INSERT OR UPDATE OR DELETE ON orders
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- =====================================================
-- TRIGGERS PARA TIMESTAMP AUTOMÁTICO
-- =====================================================

-- Função para atualizar timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar em tabelas de conteúdo
CREATE TRIGGER update_products_updated_at 
    BEFORE UPDATE ON products 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at 
    BEFORE UPDATE ON orders 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- DADOS INICIAIS DE TESTE (OPCIONAL)
-- =====================================================

-- Inserir produtos iniciais (dados do sistema atual)
INSERT INTO products (name, description, price, image_url, category, color, is_active) VALUES
('Corda Amarela e Laranja', 'Corda de alta qualidade com acabamento elegante', 45.90, '/images/amarelo e laranja.jpg', 'Elegância', 'Amarelo/Laranja', true),
('Corda Azul Bebê e Chumbo', 'Corda resistente com visual moderno', 42.50, '/images/azul bebe e chumb 2.jpg', 'Moderno', 'Azul/Chumbo', true),
('Corda Marinho e Vermelho', 'Corda clássica para todos os ambientes', 38.99, '/images/marinho e vermelho.jpg', 'Clássico', 'Marinho/Vermelho', true),
('Corda Militar e Marrom', 'Corda rústica com estilo militar', 44.20, '/images/militar e marrom.jpg', 'Militar', 'Militar/Marrom', true),
('Corda Rosa Bebê e Verde', 'Corda delicada para decoração suave', 39.90, '/images/rosa bebe e verde bebe.jpg', 'Delicado', 'Rosa/Verde', true),
('Corda Rosa Pink e Lilás', 'Corda vibrante para espaço moderno', 43.50, '/images/rosa pink e lilas.jpg', 'Moderno', 'Rosa/Lilás', true),
('Corda Roxo e Laranja', 'Corda especial com cores únicas', 46.90, '/images/roxo e laranja.jpg', 'Especial', 'Roxo/Laranja', true),
('Corda Verde e Cinza', 'Corda neutra para qualquer ambiente', 41.30, '/images/verde e cinza.jpg', 'Neutro', 'Verde/Cinza', true)
ON CONFLICT DO NOTHING;

-- =====================================================
-- COMENTÁRIOS FINAIS
-- =====================================================
-- Este banco de dados foi projetado para ser:
-- 1. Escalável - suporta crescimento futuro
-- 2. Compatível - funciona com sistema atual (localStorage)
-- 3. Robusto - com auditoria e backups automáticos
-- 4. Otimizado - com índices para performance
-- 5. Flexível - permite mudanças futuras sem quebrar
