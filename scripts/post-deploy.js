#!/usr/bin/env node

/**
 * =====================================================
 * ROPEARTLAB - SCRIPT PÓS-DEPLOY AUTOMÁTICO
 * =====================================================
 * 
 * Este script roda automaticamente após cada deploy
 * Adicione "npm run post-deploy" no package.json scripts
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 RopeArtLab - Executando script póS-deploy...');
console.log('📍 Ambiente:', process.env.NODE_ENV || 'production');
console.log('📅 Data:', new Date().toISOString());
console.log('='.repeat(50));

async function runPostDeploy() {
    try {
        // Verificar se banco está conectado
        await checkDatabaseConnection();
        
        // Verificar se todas as tabelas existem
        await verifyRequiredTables();
        
        // Executar migração de dados iniciais se necessário
        await ensureInitialData();
        
        // Executar verificações de integridade
        await performHealthChecks();
        
        console.log('✅ Script póS-deploy concluído com sucesso!');
        console.log('🎉 Sistema pronto para uso em produção');
        
    } catch (error) {
        console.error('❌ Erro durante script póS-deploy:', error.message);
        process.exit(1);
    }
}

async function checkDatabaseConnection() {
    console.log('🔍 Verificando conexão com banco de dados...');
    
    try {
        const { healthCheck } = require('../config/database');
        const health = await healthCheck();
        
        if (health.status === 'healthy') {
            console.log('✅ Banco conectado:', health.timestamp);
        } else {
            throw new Error('Erro de conexão: ' + health.error);
        }
        
    } catch (error) {
        console.error('❌ Banco não conectado:', error.message);
        throw error;
    }
}

async function verifyRequiredTables() {
    console.log('📋 Verificando tabelas obrigatórias...');
    
    const { query } = require('../config/database');
    
    const requiredTables = [
        'products', 'users', 'orders', 'order_items',
        'admin_settings', 'audit_logs', 'analytics_cache'
    ];
    
    for (const table of requiredTables) {
        try {
            const result = await query(`SELECT COUNT(*) FROM ${table}`);
            console.log(`✅ Tabela ${table}: OK`);
        } catch (error) {
            console.error(`❌ Tabela ${table} não encontrada:`, error.message);
            throw new Error(`Tabela ${table} não existe ou está corrompida`);
        }
    }
}

async function ensureInitialData() {
    console.log('📦 Verificando dados iniciais...');
    
    const { query } = require('../config/database');
    
    try {
        // Verificar se há produtos
        const productCount = await query('SELECT COUNT(*) FROM products WHERE is_active = true');
        
        if (parseInt(productCount.rows[0].count) === 0) {
            console.log('ℹ️ Nenhum produto encontrado - criando produtos iniciais...');
            
            // Inserir produtos padrão
            await query(`
                INSERT INTO products (name, description, price, image_url, category, color, is_active) VALUES
                ('Corda Amarela e Laranja', 'Corda de alta qualidade com acabamento elegante', 45.90, '/images/amarelo-e-laranja.jpg', 'Elegância', 'Amarelo/Laranja', true),
                ('Corda Azul Bebê e Chumbo', 'Corda resistente com visual moderno', 42.50, '/images/azul bebe e chumb 2.jpg', 'Moderno', 'Azul/Chumbo', true),
                ('Corda Marinho e Vermelho', 'Corda clássica para todos os ambientes', 38.99, '/images/marinho e vermelho.jpg', 'Clássico', 'Marinho/Vermelho', true),
                ('Corda Militar e Marrom', 'Corda rústica com estilo militar', 44.20, '/images/militar e marrom.jpg', 'Militar', 'Militar/Marrom', true),
                ('Corda Rosa Bebê e Verde', 'Corda delicada para decoração suave', 39.90, '/images/rosa bebe e verde bebe.jpg', 'Delicado', 'Rosa/Verde', true),
                ('Corda Rosa Pink e Lilás', 'Corda vibrante para espaço moderno', 43.50, '/images/rosa pink e lilas.jpg', 'Moderno', 'Rosa/Lilás', true),
                ('Corda Roxo e Laranja', 'Corda especial com cores únicas', 46.90, '/images/roxo e laranja.jpg', 'Especial', 'Roxo/Laranja', true),
                ('Corda Verde e Cinza', 'Corda neutra para qualquer ambiente', 41.30, '/images/verde e cinza.jpg', 'Neutro', 'Verde/Cinza', true)
                ON CONFLICT (name) DO NOTHING
            `);
            
            console.log('✅ Produtos iniciais criados');
        } else {
            console.log(`✅ ${productCount.rows[0].count} produtos já existem`);
        }
        
    } catch (error) {
        console.error('❌ Erro ao verificar dados iniciais:', error.message);
        // Não falhar deploy por este erro
    }
}

async function performHealthChecks() {
    console.log('🏥 Executando verificações de saúde...');
    
    const { query } = require('../config/database');
    
    try {
        // Testar queries básicas
        await query('SELECT NOW()'); // Verificar funcionalidade SQL
        await query('SELECT COUNT(*) FROM products LIMIT 1'); // Verificar acesso aos dados
        
        console.log('✅ Health checks aprovados');
        
    } catch (error) {
        console.error('❌ Health checks falharam:', error.message);
        throw error;
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    runPostDeploy().catch(error => {
        console.error('💥 Falha no script póS-deploy:', error);
        process.exit(1);
    });
}

module.exports = { runPostDeploy };
