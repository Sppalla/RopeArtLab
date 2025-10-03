const express = require('express');
const router = express.Router();
const { query, transaction } = require('../config/database');

// =====================================================
// LISTAR TODOS OS PEDIDOS (ADMIN)
// =====================================================
router.get('/', async (req, res) => {
    try {
        console.log('📦 Buscando pedidos no banco...');
        
        const result = await query(`
            SELECT 
                o.id,
                o.uuid,
                o.order_number,
                o.user_email,
                o.total_amount,
                o.status,
                o.payment_method,
                o.notes,
                o.created_at,
                o.updated_at,
                o.approved_at,
                o.finalized_at,
                o.cancelled_at,
                u.nome,
                u.sobrenome
            FROM orders o
            LEFT JOIN users u ON o.user_email = u.email
            ORDER BY o.created_at DESC
        `);

        console.log(`✅ ${result.rows.length} pedidos encontrados`);
        
        // Converter para formato compatível com frontend
        const orders = result.rows.map(row => ({
            id: row.uuid, // UUID público
            orderNumber: row.order_number,
            userEmail: row.user_email,
            userNome: `${row.nome || ''} ${row.sobrenome || ''}`.trim(),
            total: parseFloat(row.total_amount),
            status: row.status || 'pending',
            paymentMethod: row.payment_method || 'whatsapp',
            notes: row.notes,
            date: row.created_at,
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
            error: 'Erro interno do servidor',
            message: 'Não foi possível carregar os pedidos'
        });
    }
});

// =====================================================
// BUSCAR PEDIDOS DE UM USUÁRIO
// =====================================================
router.get('/user/:userEmail', async (req, res) => {
    try {
        const { userEmail } = req.params;
        
        const ordersResult = await query(`
            SELECT 
                o.uuid,
                o.order_number,
                o.total_amount,
                o.status,
                o.created_at,
                o.approved_at,
                o.finalized_at,
                o.cancelled_at
            FROM orders o
            WHERE o.user_email = $1
            ORDER BY o.created_at DESC
        `, [userEmail.toLowerCase()]);

        // Buscar itens dos pedidos
        const orders = [];
        for (const order of ordersResult.rows) {
            const itemsResult = await query(`
                SELECT 
                    product_name,
                    product_price,
                    quantity,
                    subtotal
                FROM order_items
                WHERE order_id = (
                    SELECT id FROM orders WHERE uuid = $1
                )
            `, [order.uuid]);

            orders.push({
                id: order.uuid,
                orderNumber: order.order_number,
                total: parseFloat(order.total_amount),
                status: order.status,
                date: order.created_at,
                approvedAt: order.approved_at,
                finalizedAt: order.finalized_at,
                cancelledAt: order.cancelled_at,
                items: itemsResult.rows.map(item => ({
                    name: item.product_name,
                    price: parseFloat(item.product_price),
                    quantity: item.quantity,
                    subtotal: parseFloat(item.subtotal)
                }))
            });
        }

        res.json({
            success: true,
            count: orders.length,
            data: orders
        });

    } catch (error) {
        console.error('❌ Erro ao buscar pedidos do usuário:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

// =====================================================
// BUSCAR PEDIDO POR ID
// =====================================================
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const orderResult = await query(`
            SELECT 
                o.uuid,
                o.order_number,
                o.user_email,
                o.total_amount,
                o.status,
                o.payment_method,
                o.notes,
                o.created_at,
                o.approved_at,
                o.finalized_at,
                o.cancelled_at
            FROM orders o
            WHERE o.uuid = $1
        `, [id]);

        if (orderResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Pedido não encontrado'
            });
        }

        const order = orderResult.rows[0];
        
        // Buscar itens do pedido
        const itemsResult = await query(`
            SELECT 
                product_name,
                product_price,
                quantity,
                subtotal
            FROM order_items
            WHERE order_id = (
                SELECT id FROM orders WHERE uuid = $1
            )
        `, [id]);

        res.json({
            success: true,
            data: {
                id: order.uuid,
                orderNumber: order.order_number,
                userEmail: order.user_email,
                total: parseFloat(order.total_amount),
                status: order.status,
                paymentMethod: order.payment_method,
                notes: order.notes,
                date: order.created_at,
                approvedAt: order.approved_at,
                finalizedAt: order.finalized_at,
                cancelledAt: order.cancelled_at,
                items: itemsResult.rows.map(item => ({
                    name: item.product_name,
                    price: parseFloat(item.product_price),
                    quantity: item.quantity,
                    subtotal: parseFloat(item.subtotal)
                }))
            }
        });

    } catch (error) {
        console.error('❌ Erro ao buscar pedido:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

// =====================================================
// CRIAR NOVO PEDIDO
// =====================================================
router.post('/', async (req, res) => {
    try {
        const { userEmail, items, total, paymentMethod, notes } = req.body;

        if (!userEmail || !items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Dados obrigatórios: userEmail e items'
            });
        }

        await transaction(async (client) => {
            // Criar pedido
            const orderResult = await client.query(`
                INSERT INTO orders (user_email, total_amount, payment_method, notes, status)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING id, uuid, order_number, created_at
            `, [userEmail.toLowerCase(), parseFloat(total), paymentMethod || 'whatsapp', notes, 'pending']);

            const order = orderResult.rows[0];

            // Inserir itens do pedido
            for (const item of items) {
                await client.query(`
                    INSERT INTO order_items (order_id, product_name, product_price, quantity, subtotal)
                    VALUES ($1, $2, $3, $4, $5)
                `, [
                    order.id,
                    item.name,
                    parseFloat(item.price),
                    parseInt(item.quantity),
                    parseFloat(item.price) * parseInt(item.quantity)
                ]);
            }

            console.log(`✅ Pedido criado: ${order.order_number} (UUID: ${order.uuid})`);

            res.json({
                success: true,
                message: 'Pedido criado com sucesso',
                data: {
                    id: order.uuid,
                    orderNumber: order.order_number,
                    total: parseFloat(total),
                    status: 'pending',
                    createdAt: order.created_at
                }
            });
        });

    } catch (error) {
        console.error('❌ Erro ao criar pedido:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

// =====================================================
// APROVAR PEDIDO (ADMIN)
// =====================================================
router.patch('/:id/approve', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await query(`
            UPDATE orders 
            SET status = 'approved', approved_at = NOW(), updated_at = NOW()
            WHERE uuid = $1 AND status = 'pending'
            RETURNING order_number
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Pedido não encontrado ou já foi processado'
            });
        }

        console.log(`✅ Pedido aprovado: ${result.rows[0].order_number}`);

        res.json({
            success: true,
            message: 'Pedido aprovado com sucesso'
        });

    } catch (error) {
        console.error('❌ Erro ao aprovar pedido:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

// =====================================================
// FINALIZAR PEDIDO (ADMIN)
// =====================================================
router.patch('/:id/finalize', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await query(`
            UPDATE orders 
            SET status = 'finalized', finalized_at = NOW(), updated_at = NOW()
            WHERE uuid = $1 AND status = 'approved'
            RETURNING order_number, total_amount
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Pedido não encontrado ou não está aprovado'
            });
        }

        console.log(`🎉 Pedido finalizado: ${result.rows[0].order_number} - R$ ${parseFloat(result.rows[0].total_amount).toFixed(2)}`);

        res.json({
            success: true,
            message: 'Pedido finalizado com sucesso'
        });

    } catch (error) {
        console.error('❌ Erro ao finalizar pedido:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

// =====================================================
// CANCELAR PEDIDO (ADMIN)
// =====================================================
router.patch('/:id/cancel', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await query(`
            UPDATE orders 
            SET status = 'cancelled', cancelled_at = NOW(), updated_at = NOW()
            WHERE uuid = $1 AND status IN ('pending', 'approved')
            RETURNING order_number
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Pedido não encontrado ou não pode ser cancelado'
            });
        }

        console.log(`❌ Pedido cancelado: ${result.rows[0].order_number}`);

        res.json({
            success: true,
            message: 'Pedido cancelado com sucesso'
        });

    } catch (error) {
        console.error('❌ Erro ao cancelar pedido:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

// =====================================================
// RESTAURAR PEDIDO CANCELADO (ADMIN)
// =====================================================
router.patch('/:id/restore', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await query(`
            UPDATE orders 
            SET status = 'pending', cancelled_at = NULL, updated_at = NOW()
            WHERE uuid = $1 AND status = 'cancelled'
            RETURNING order_number
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Pedido não encontrado ou não está cancelado'
            });
        }

        console.log(`🔄 Pedido restaurado: ${result.rows[0].order_number}`);

        res.json({
            success: true,
            message: 'Pedido restaurado com sucesso'
        });

    } catch (error) {
        console.error('❌ Erro ao restaurar pedido:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

module.exports = router;

