const express = require('express');
const router = express.Router();
const { query } = require('../config/database');

// Middleware para verificar autenticação de admin (simplificado)
const adminAuth = (req, res, next) => {
    const { authorization } = req.headers;
    
    // Para simplificar, vamos usar um token fixo por enquanto
    // Em produção real, deveria usar JWT ou sistema de sessão
    const adminToken = process.env.ADMIN_TOKEN || 'ropeartlab-admin-2024';
    
    if (authorization === adminToken) {
        next();
    } else {
        res.status(401).json({
            success: false,
            error: 'Acesso não autorizado'
        });
    }
};

// =====================================================
// STATS GERAIS DO DASHBOARD (ADMIN)
// =====================================================
router.get('/dashboard', adminAuth, async (req, res) => {
    try {
        console.log('📊 Gerando dashboard do admin...');
        
        // Estatísticas de produtos
        const productsStats = await query(`
            SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN is_active = true AND deleted_at IS NULL THEN 1 END) as active,
                COUNT(CASE WHEN deleted_at IS NOT NULL THEN 1 END) as in_trash
            FROM products
        `);

        // Estatísticas de usuários
        const usersStats = await query(`
            SELECT 
                COUNT(*) as total_users,
                COUNT(CASE WHEN is_active = true AND deleted_at IS NULL THEN 1 END) as active_users,
                COUNT(CASE WHEN last_login >= NOW() - INTERVAL '30 days' THEN 1 END) as active_last_month
            FROM users
        `);

        // Estatísticas de pedidos
        const ordersStats = await query(`
            SELECT 
                COUNT(*) as total_orders,
                COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
                COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_orders,
                COUNT(CASE WHEN status = 'finalized' THEN 1 END) as finalized_orders,
                COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders,
                SUM(CASE WHEN status = 'finalized' THEN total_amount ELSE 0 END) as total_revenue
            FROM orders
        `);

        // Pedidos recentes
        const recentOrders = await query(`
            SELECT 
                o.uuid,
                o.order_number,
                o.total_amount,
                o.status,
                o.created_at,
                u.nome,
                u.sobrenome
            FROM orders o
            LEFT JOIN users u ON o.user_email = u.email
            ORDER BY o.created_at DESC
            LIMIT 10
        `);

        // Usuários recentes
        const recentUsers = await query(`
            SELECT 
                uuid,
                nome,
                sobrenome,
                email,
                created_at
            FROM users
            WHERE is_active = true AND deleted_at IS NULL
            ORDER BY created_at DESC
            LIMIT 10
        `);

        const dashboard = {
            products: {
                total: parseInt(productsStats.rows[0].total),
                active: parseInt(productsStats.rows[0].active),
                inTrash: parseInt(productsStats.rows[0].in_trash)
            },
            users: {
                total: parseInt(usersStats.rows[0].total_users),
                active: parseInt(usersStats.rows[0].active_users),
                activeLastMonth: parseInt(usersStats.rows[0].active_last_month)
            },
            orders: {
                total: parseInt(ordersStats.rows[0].total_orders),
                pending: parseInt(ordersStats.rows[0].pending_orders),
                approved: parseInt(ordersStats.rows[0].approved_orders),
                finalized: parseInt(ordersStats.rows[0].finalized_orders),
                cancelled: parseInt(ordersStats.rows[0].cancelled_orders),
                totalRevenue: parseFloat(ordersStats.rows[0].total_revenue || 0)
            },
            recentOrders: recentOrders.rows.map(order => ({
                id: order.uuid,
                orderNumber: order.order_number,
                total: parseFloat(order.total_amount),
                status: order.status,
                userInfo: `${order.nome || ''} ${order.sobrenome || ''}`.trim() || 'Cliente não encontrado',
                createdAt: order.created_at
            })),
            recentUsers: recentUsers.rows.map(user => ({
                id: user.uuid,
                nome: user.nome,
                sobrenome: user.sobrenome,
                email: user.email,
                createdAt: user.created_at
            }))
        };

        res.json({
            success: true,
            data: dashboard
        });

    } catch (error) {
        console.error('❌ Erro ao gerar dashboard:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

// =====================================================
// LISTAR TODOS OS USUÁRIOS (ADMIN)
// =====================================================
router.get('/users', adminAuth, async (req, res) => {
    try {
        console.log('👥 Buscando todos os usuários para admin...');
        
        const result = await query(`
            SELECT 
                uuid,
                nome,
                sobrenome,
                email,
                cpf_cnpj,
                telefone,
                cidade,
                estado,
                created_at,
                last_login,
                is_active
            FROM users 
            WHERE is_active = true AND deleted_at IS NULL
            ORDER BY created_at DESC
        `);

        const users = result.rows.map(row => ({
            id: row.uuid,
            nome: row.nome,
            sobrenome: row.sobrenome,
            email: row.email,
            cpf: row.cpf_cnpj,
            telefone: row.telefone,
            cidade: row.cidade,
            estado: row.estado,
            created_at: row.created_at,
            last_login: row.last_login,
            is_active: row.is_active
        }));

        res.json({
            success: true,
            count: users.length,
            data: users
        });

    } catch (error) {
        console.error('❌ Erro ao buscar usuários:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

// =====================================================
// LISTAR TODOS OS PEDIDOS (ADMIN)
// =====================================================
router.get('/orders', adminAuth, async (req, res) => {
    try {
        console.log('📦 Buscando todos os pedidos para admin...');
        
        const result = await query(`
            SELECT 
                o.uuid,
                o.order_number,
                o.user_email,
                o.total_amount,
                o.status,
                o.payment_method,
                o.created_at,
                o.approved_at,
                o.finalized_at,
                o.cancelled_at,
                u.nome,
                u.sobrenome
            FROM orders o
            LEFT JOIN users u ON o.user_email = u.email
                
            ORDER BY o.created_at DESC
        `);

        const orders = result.rows.map(row => ({
            id: row.uuid,
            orderNumber: row.order_number,
            userEmail: row.user_email,
            userName: `${row.nome || ''} ${row.sobrenome || ''}`.trim() || 'Cliente não encontrado',
            total: parseFloat(row.total_amount),
            status: row.status,
            paymentMethod: row.payment_method,
            createdAt: row.created_at,
            approvedAt: row.approved_at,
            finalizedAt: row.finalized_at,
            cancelledAt: row.cancelled_at
        }));

        res.json({
            success: true,
            count: orders.length,
            data: orders
        });

    } catch (error) {
        console.error('❌ Erro ao buscar pedidos:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

// =====================================================
// ESTATÍSTICAS RELATÓRIOS (ADMIN)
// =====================================================
router.get('/reports', adminAuth, async (req, res) => {
    try {
        const { type = 'general', period = '30' } = req.query;
        
        console.log(`📊 Gerando relatório ${type} para período ${period}`);
        
        let reportData = {};
        
        switch (type) {
            case 'general':
                reportData = await generateGeneralReport(period);
                break;
            case 'products':
                reportData = await generateProductReport(period);
                break;
            case 'users':
                reportData = await generateUserReport(period);
                break;
            default:
                return res.status(400).json({
                    success: false,
                    error: 'Tipo de relatório inválido'
                });
        }

        res.json({
            success: true,
            type: type,
            period: period,
            data: reportData,
            generatedAt: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Erro ao gerar relatório:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

// =====================================================
// FUNÇÕES AUXILIARES PARA RELATÓRIOS
// =====================================================

async function generateGeneralReport(period) {
    const days = parseInt(period);
    
    const result = await query(`
        SELECT 
            COUNT(*) as total_orders,
            COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
            COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
            COUNT(CASE WHEN status = 'finalized' THEN 1 END) as finalized,
            COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled,
            SUM(CASE WHEN status = 'finalized' THEN total_amount ELSE 0 END) as revenue,
            AVG(CASE WHEN status = 'finalized' THEN total_amount ELSE NULL END) as avg_ticket
        FROM orders
        WHERE created_at >= NOW() - INTERVAL '${days} days'
    `, [days]);

    const row = result.rows[0];
    
    return {
        orders: {
            total: parseInt(row.total_orders),
            pending: parseInt(row.pending),
            approved: parseInt(row.approved),
            finalized: parseInt(row.finalized),
            cancelled: parseInt(row.cancelled)
        },
        revenue: {
            total: parseFloat(row.revenue || 0),
            averageTicket: parseFloat(row.avg_ticket || 0)
        },
        period: {
            days: days,
            description: `Últimos ${days} dias`
        }
    };
}

async function generateProductReport(period) {
    const days = parseInt(period);
    
    const result = await query(`
        SELECT 
            oi.product_name,
            SUM(oi.quantity) as total_sold,
            SUM(oi.subtotal) as revenue,
            COUNT(DISTINCT o.id) as orders_count,
            AVG(oi.product_price) as avg_price
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE o.status = 'finalized' 
            AND o.created_at >= NOW() - INTERVAL '${days} days'
        GROUP BY oi.product_name
        ORDER BY total_sold DESC
    `, [days]);

    return result.rows.map(row => ({
        productName: row.product_name,
        totalSold: parseInt(row.total_sold),
        revenue: parseFloat(row.revenue),
        ordersCount: parseInt(row.orders_count),
        averagePrice: parseFloat(row.avg_price)
    }));
}

async function generateUserReport(period) {
    const days = parseInt(period);
    
    const result = await query(`
        SELECT 
            COUNT(*) as new_users,
            COUNT(CASE WHEN last_login IS NOT NULL THEN 1 END) as active_users
        FROM users
        WHERE created_at >= NOW() - INTERVAL '${days} days'
    `, [days]);

    return {
        newUsers: parseInt(result.rows[0].new_users),
        activeUsers: parseInt(result.rows[0].active_users),
        period: {
            days: days,
            description: `Últimos ${days} dias`
        }
    };
}

module.exports = router;
