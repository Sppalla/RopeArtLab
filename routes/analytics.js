const express = require('express');
const router = express.Router();
const { query } = require('../config/database');

// =====================================================
// ANÁLISES FINANCEIRAS GERAIS
// =====================================================
router.get('/financial', async (req, res) => {
    try {
        const { period = '30' } = req.query;
        
        console.log('📊 Gerando análises financeiras para período:', period);
        
        // Construir filtro de data baseado no período
        let dateFilter = '';
        let params = [];
        
        if (period !== 'all') {
            const days = parseInt(period);
            dateFilter = ` AND created_at >= NOW() - INTERVAL '${days} days'`;
            params = [days];
        }

        // Buscar pedidos finalizados para análise
        const ordersResult = await query(`
            SELECT 
                o.total_amount,
                o.created_at,
                oi.product_name,
                oi.product_price,
                oi.quantity,
                oi.subtotal
            FROM orders o
            LEFT JOIN order_items oi ON o.id = oi.order_id
            WHERE o.status = 'finalized'${dateFilter}
            ORDER BY o.created_at DESC
        `, params);

        // Processar dados
        const analytics = processFinancialData(ordersResult.rows);
        
        console.log(`✅ Análise gerada: R$ ${analytics.totalRevenue.toFixed(2)} em ${analytics.totalOrders} pedidos`);

        res.json({
            success: true,
            period: period,
            periodText: getPeriodText(period),
            data: analytics
        });

    } catch (error) {
        console.error('❌ Erro ao gerar análises financeiras:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

// =====================================================
// ANÁLISES POR PRODUTO
// =====================================================
router.get('/products', async (req, res) => {
    try {
        const { period = '30' } = req.query;
        
        console.log('📦 Gerando análises por produto para período:', period);
        
        // Construir filtro de data
        let dateFilter = '';
        if (period !== 'all') {
            const days = parseInt(period);
            dateFilter = ` AND o.created_at >= NOW() - INTERVAL '${days} days'`;
        }

        const result = await query(`
            SELECT 
                oi.product_name,
                SUM(oi.quantity) as total_quantity,
                SUM(oi.subtotal) as total_revenue,
                COUNT(DISTINCT o.id) as total_orders,
                AVG(oi.product_price) as avg_price
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            WHERE o.status = 'finalized'${dateFilter}
            GROUP BY oi.product_name
            ORDER BY total_revenue DESC
        `);

        const productAnalytics = result.rows.map(row => ({
            productName: row.product_name,
            totalQuantity: parseInt(row.total_quantity),
            totalRevenue: parseFloat(row.total_revenue),
            totalOrders: parseInt(row.total_orders),
            averagePrice: parseFloat(row.avg_price),
            averageTicket: parseFloat(row.total_revenue) / parseInt(row.total_orders),
            revenuePercentage: 0 // Será calculado abaixo
        }));

        // Calcular percentual de receita
        const totalRevenue = productAnalytics.reduce((sum, item) => sum + item.totalRevenue, 0);
        productAnalytics.forEach(item => {
            item.revenuePercentage = totalRevenue > 0 ? 
                (item.totalRevenue / totalRevenue) * 100 : 0;
        });

        res.json({
            success: true,
            period: period,
            totalProducts: productAnalytics.length,
            data: productAnalytics
        });

    } catch (error) {
        console.error('❌ Erro ao gerar análises de produtos:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

// =====================================================
// ANÁLISES POR PERÍODO (DIÁRIO/MENSAL)
// =====================================================
router.get('/period-chart', async (req, res) => {
    try {
        const { type = 'daily', period = '30' } = req.query;
        
        console.log(`📈 Gerando gráfico ${type} para período:`, period);
        
        // Escolher agrupamento baseado no tipo
        let groupBy = '';
        let dateFormat = '';
        
        if (type === 'daily') {
            groupBy = `DATE_TRUNC('day', o.created_at)`;
            dateFormat = 'YYYY-MM-DD';
        } else if (type === 'monthly') {
            groupBy = `DATE_TRUNC('month', o.created_at)`;
            dateFormat = 'YYYY-MM';
        } else {
            return res.status(400).json({
                success: false,
                error: 'Tipo inválido. Use "daily" ou "monthly"'
            });
        }

        // Construir filtro de data
        let dateFilter = '';
        if (period !== 'all') {
            const days = parseInt(period);
            dateFilter = ` AND o.created_at >= NOW() - INTERVAL '${days} days'`;
        }

        const result = await query(`
            SELECT 
                ${groupBy} as period_start,
                COUNT(DISTINCT o.id) as total_orders,
                SUM(o.total_amount) as total_revenue,
                AVG(o.total_amount) as avg_ticket
            FROM orders o
            WHERE o.status = 'finalized'${dateFilter}
            GROUP BY ${groupBy}
            ORDER BY period_start ASC
        `);

        const chartData = result.rows.map(row => ({
            period: new Date(row.period_start).toISOString().split('T')[0],
            totalOrders: parseInt(row.total_orders),
            totalRevenue: parseFloat(row.total_revenue),
            averageTicket: parseFloat(row.avg_ticket)
        }));

        res.json({
            success: true,
            type: type,
            period: period,
            data: chartData
        });

    } catch (error) {
        console.error('❌ Erro ao gerar gráfico de período:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

// =====================================================
// RESUMO EXECUTIVO
// =====================================================
router.get('/summary', async (req, res) => {
    try {
        console.log('📋 Gerando resumo executivo...');
        
        // Métricas gerais
        const summaryResult = await query(`
            SELECT 
                COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
                COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_orders,
                COUNT(CASE WHEN status = 'finalized' THEN 1 END) as finalized_orders,
                COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders,
                SUM(CASE WHEN status = 'finalized' THEN total_amount ELSE 0 END) as total_revenue,
                COUNT(CASE WHEN status = 'finalized' THEN 1 END) as revenue_orders
            FROM orders
        `);

        // Receita por mês (últimos 6 meses)
        const monthlyResult = await query(`
            SELECT 
                DATE_TRUNC('month', created_at) as month,
                SUM(total_amount) as revenue,
                COUNT(*) as orders
            FROM orders
            WHERE status = 'finalized' 
                AND created_at >= NOW() - INTERVAL '6 months'
            GROUP BY DATE_TRUNC('month', created_at)
            ORDER BY month DESC
        `);

        // Top produtos (últimos 30 dias)
        const topProductsResult = await query(`
            SELECT 
                oi.product_name,
                SUM(oi.quantity) as quantity_sold,
                SUM(oi.subtotal) as revenue
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            WHERE o.status = 'finalized'
                AND o.created_at >= NOW() - INTERVAL '30 days'
            GROUP BY oi.product_name
            ORDER BY quantity_sold DESC
            LIMIT 5
        `);

        const summary = summaryResult.rows[0];
        const monthlyData = monthlyResult.rows.map(row => ({
            month: new Date(row.month).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
            revenue: parseFloat(row.revenue),
            orders: parseInt(row.orders)
        }));

        const topProducts = topProductsResult.rows.map(row => ({
            productName: row.product_name,
            quantitySold: parseInt(row.quantity_sold),
            revenue: parseFloat(row.revenue)
        }));

        const summaryData = {
            orders: {
                pending: parseInt(summary.pending_orders),
                approved: parseInt(summary.approved_orders),
                finalized: parseInt(summary.finalized_orders),
                cancelled: parseInt(summary.cancelled_orders)
            },
            revenue: {
                total: parseFloat(summary.total_revenue || 0),
                orders: parseInt(summary.revenue_orders),
                averageTicket: summary.revenue_orders > 0 ? 
                    parseFloat(summary.total_revenue || 0) / parseInt(summary.revenue_orders) : 0
            },
            monthlyTrend: monthlyData,
            topProducts: topProducts,
            generatedAt: new Date().toISOString()
        };

        res.json({
            success: true,
            data: summaryData
        });

    } catch (error) {
        console.error('❌ Erro ao gerar resumo executivo:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

// =====================================================
// FUNÇÕES AUXILIARES
// =====================================================

function processFinancialData(orders) {
    const uniqueOrders = new Map();
    const productSales = {};
    let totalRevenue = 0;
    let totalOrders = 0;

    // Processar cada item de pedido
    orders.forEach(row => {
        const orderKey = `${row.total_amount}_${row.created_at}`;
        
        // Contar pedidos únicos
        if (!uniqueOrders.has(orderKey)) {
            uniqueOrders.set(orderKey, true);
            totalOrders++;
            totalRevenue += parseFloat(row.total_amount || 0);
        }

        // Processar vendas por produto
        if (row.product_name) {
            const productName = row.product_name;
            if (!productSales[productName]) {
                productSales[productName] = {
                    name: productName,
                    totalSold: 0,
                    totalRevenue: 0,
                    orders: 0
                };
            }
            
            productSales[productName].totalSold += parseInt(row.quantity || 0);
            productSales[productName].totalRevenue += parseInt(parseFloat(row.subtotal || 0));
            productSales[productName].orders++;
        }
    });

    // Converter para array e ordenar por receita
    const productArray = Object.values(productSales)
        .sort((a, b) => b.totalRevenue - a.totalRevenue);

    return {
        totalRevenue,
        totalOrders,
        averageTicket: totalOrders > 0 ? totalRevenue / totalOrders : 0,
        productSales: productArray,
        productCount: productArray.length
    };
}

function getPeriodText(period) {
    switch (period) {
        case '7': return 'Últimos 7 dias';
        case '30': return 'Últimos 30 dias';
        case '90': return 'Últimos 90 dias';
        case 'all': return 'Todos os tempos';
        default: return `Últimos ${period} dias`;
    }
}

module.exports = router;
