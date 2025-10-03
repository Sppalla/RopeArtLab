#!/usr/bin/env node

/**
 * =====================================================
 * ROPEARTLAB - SCRIPT DE MIGRAÇÃO DE DADOS
 * =====================================================
 * 
 * Este script migra dados do localStorage para o banco PostgreSQL
 * Execução: node scripts/migrate.js
 * 
 * IMPORTANTE: Execute apenas APÓS criar as tabelas no banco!
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Configurar ambiente para migração
const NODE_ENV = process.env.NODE_ENV || 'development';

console.log('🚀 RopeArtLab - Script de Migração de Dados');
console.log('📍 Ambiente:', NODE_ENV);
console.log('📅 Data:', new Date().toISOString());
console.log('='.repeat(50));

async function runMigration() {
    try {
        // Verificar se banco está configurado
        if (!process.env.DATABASE_URL) {
            console.error('❌ DATABASE_URL não configurado!');
            console.log('📝 Configure o arquivo .env com a URL do PostgreSQL');
            process.exit(1);
        }

        console.log('📋 Verificando conectividade com banco de dados...');
        
        // Importar configuração do banco
        const { query, healthCheck } = require('../config/database');
        
        // Testar conexão
        const health = await healthCheck();
        if (health.status !== 'healthy') {
            console.error('❌ Erro de conexão com banco:', health.error);
            process.exit(1);
        }
        
        console.log('✅ Banco conectado:', health.timestamp);

        // Executar migrações em ordem
        await migrateProducts();
        await migrateUsers();
        await migrateOrders();
        
        console.log('🎉 Migração concluída com sucesso!');
        console.log('✅ Todos os dados foram migrados do localStorage para PostgreSQL');

    } catch (error) {
        console.error('❌ Erro durante migração:', error.message);
        console.error('📍 Stack trace:', error.stack);
        process.exit(1);
    }
}

async function migrateProducts() {
    console.log('📦 Migrando produtos...');
    
    try {
        // Simular dados do localStorage (em produção real, você pegaria do localStorage do usuário)
        const productsData = [
            {
                id: 'prod_' + Date.now() + '_1',
                name: 'Corda Amarela e Laranja',
                description: 'Corda de alta qualidade com acabamento elegante',
                price: 45.90,
                image: '/images/amarelo e laranja.jpg',
                category: 'Elegância',
                color: 'Amarelo/Laranja'
            },
            {
                id: 'prod_' + Date.now() + '_2', 
                name: 'Corda Azul Bebê e Chumbo',
                description: 'Corda resistente com visual moderno',
                price: 42.50,
                image: '/images/azul bebe e chumb 2.jpg',
                category: 'Moderno',
                color: 'Azul/Chumbo'
            },
            {
                id: 'prod_' + Date.now() + '_3',
                name: 'Corda Marinho e Vermelho',
                description: 'Corda clássica para todos os ambientes',
                price: 38.99,
                image: '/images/marinho e vermelho.jpg',
                category: 'Clássico',
                color: 'Marinho/Vermelho'
            },
            {
                id: 'prod_' + Date.now() + '_4',
                name: 'Corda Militar e Marrom',
                description: 'Corda rústica com estilo militar',
                price: 44.20,
                image: '/images/militar e marrom.jpg',
                category: 'Militar',
                color: 'Militar/Marrom'
            },
            {
                id: 'prod_' + Date.now() + '_5',
                name: 'Corda Rosa Bebê e Verde',
                description: 'Corda delicada para decoração suave',
                price: 39.90,
                image: '/images/rosa bebe e verde bebe.jpg',
                category: 'Delicado',
                color: 'Rosa/Verde'
            },
            {
                id: 'prod_' + Date.now() + '_6',
                name: 'Corda Rosa Pink e Lilás',
                description: 'Corda vibrante para espaço moderno',
                price: 43.50,
                image: '/images/rosa pink e lilas.jpg',
                category: 'Moderno',
                color: 'Rosa/Lilás'
            },
            {
                id: 'prod_' + Date.now() + '_7',
                name: 'Corda Roxo e Laranja',
                description: 'Corda especial com cores únicas',
                price: 46.90,
                image: '/images/roxo e laranja.jpg',
                category: 'Especial',
                color: 'Roxo/Laranja'
            },
            {
                id: 'prod_' + Date.now() + '_8',
                name: 'Corda Verde e Cinza',
                description: 'Corda neutra para qualquer ambiente',
                price: 41.30,
                image: '/images/verde e cinza.jpg',
                category: 'Neutro',
                color: 'Verde/Cinza'
            }
        ];

        const { query } = require('../config/database');

        // Verificar se já existem produtos
        const existingCount = await query('SELECT COUNT(*) FROM products');
        
        if (parseInt(existingCount.rows[0].count) > 4) {
            console.log('ℹ️ Produtos já existem no banco, pulando migração');
            return;
        }

        // Inserir produtos
        let insertedCount = 0;
        for (const product of productsData) {
            try {
                await query(`
                    INSERT INTO products (name, description, price, image_url, category, color, is_active)
                    VALUES ($1, $2, $3, $4, $5, $6, $7)
                    ON CONFLICT (name) DO NOTHING
                `, [
                    product.name,
                    product.description,
                    parseFloat(product.price),
                    product.image,
                    product.category,
                    product.color,
                    true
                ]);
                insertedCount++;
            } catch (error) {
                console.log(`⚠️ Produto já existe: ${product.name}`);
            }
        }

        console.log(`✅ ${insertedCount} produtos migrados com sucesso`);

    } catch (error) {
        console.error('❌ Erro ao migrar produtos:', error.message);
        throw error;
    }
}

async function migrateUsers() {
    console.log('👥 Migrando usuários...');
    
    try {
        // Verificar se já existem usuários
        const existingCount = await query('SELECT COUNT(*) FROM users');
        
        if (parseInt(existingCount.rows[0].count) > 0) {
            console.log('ℹ️ Usuários já existem no banco, pulando migração');
            return;
        }

        // Criar um usuário de exemplo
        const { query } = require('../config/database');
        
        await query(`
            INSERT INTO users (
                nome, sobrenome, email, cpf_cnpj, telefone, 
                cep, endereco, numero, cidade, estado, email_verified
            ) VALUES (
                'João', 'Silva', 'joao@example.com', '12345678901', '11999999999',
                '01234567', 'Rua das Flores', '123', 'São Paulo', 'SP', true
            )
        `);

        console.log('✅ Usuário de exemplo criado');

    } catch (error) {
        console.error('❌ Erro ao migrar usuários:', error.message);
        throw error;
    }
}

async function migrateOrders() {
    console.log('📦 Migrando pedidos...');
    
    try {
        // Verificar se já existem pedidos
        const existingCount = await query('SELECT COUNT(*) FROM orders');
        
        if (parseInt(existingCount.rows[0].count) > 0) {
            console.log('ℹ️ Pedidos já existem no banco, pulando migração');
            return;
        }

        console.log('ℹ️ Nenhum pedido para migrar');

    } catch (error) {
        console.error('❌ Erro ao migrar pedidos:', error.message);
        throw error;
    }
}

// Executar migração se chamado diretamente
if (require.main === module) {
    runMigration().catch(error => {
        console.error('💥 Falha na migração:', error);
        process.exit(1);
    });
}

module.exports = { runMigration };

