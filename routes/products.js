const express = require('express');
const router = express.Router();
const { query, transaction } = require('../config/database');

// =====================================================
// LISTAR TODOS OS PRODUTOS ATIVOS
// =====================================================
router.get('/', async (req, res) => {
    try {
        console.log('📦 Buscando produtos no banco...');
        
        const result = await query(`
            SELECT 
                id,
                name,
                description,
                price,
                image_url,
                category,
                color,
                discount_price,
                created_at,
                updated_at
            FROM products 
            WHERE is_active = true AND deleted_at IS NULL
            ORDER BY created_at DESC
        `);

        console.log(`✅ ${result.rows.length} produtos encontrados`);
        
        // Converter para formato compatível com frontend
        const products = result.rows.map(row => ({
            id: row.id,
            name: row.name,
            description: row.description,
            price: parseFloat(row.price),
            image: row.image_url,
            category: row.category,
            color: row.color,
            discountPrice: row.discount_price ? parseFloat(row.discount_price) : null
        }));

        res.json({
            success: true,
            count: products.length,
            data: products
        });

    } catch (error) {
        console.error('❌ Erro ao buscar produtos:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor',
            message: 'Não foi possível carregar os produtos'
        });
    }
});

// =====================================================
// BUSCAR PRODUTO POR ID
// =====================================================
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await query(`
            SELECT 
                id,
                name,
                description,
                price,
                image_url,
                category,
                color,
                discount_price,
                created_at,
                updated_at
            FROM products 
            WHERE id = $1 AND is_active = true AND deleted_at IS NULL
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Produto não encontrado'
            });
        }

        const product = result.rows[0];
        res.json({
            success: true,
            data: {
                id: product.id,
                name: product.name,
                description: product.description,
                price: parseFloat(product.price),
                image: product.image_url,
                category: product.category,
                color: product.color,
                discountPrice: product.discount_price ? parseFloat(product.discount_price) : null
            }
        });

    } catch (error) {
        console.error('❌ Erro ao buscar produto:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

// =====================================================
// CRIAR NOVO PRODUTO (ADMIN)
// =====================================================
router.post('/', async (req, res) => {
    try {
        const { name, description, price, image_url, category, color, discount_price } = req.body;

        // Validação básica
        if (!name || !price) {
            return res.status(400).json({
                success: false,
                error: 'Nome e preço são obrigatórios'
            });
        }

        // Verificar se produto já existe
        const existing = await query(`
            SELECT id FROM products 
            WHERE name = $1 AND is_active = true
        `, [name]);

        if (existing.rows.length > 0) {
            return res.status(409).json({
                success: false,
                error: 'Produto com este nome já existe'
            });
        }

        const result = await query(`
            INSERT INTO products (name, description, price, image_url, category, color, discount_price)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id, name, created_at
        `, [name, description, parseFloat(price), image_url, category, color, discount_price ? parseFloat(discount_price) : null]);

        console.log(`✅ Produto criado: ${result.rows[0].name} (ID: ${result.rows[0].id})`);

        res.status(201).json({
            success: true,
            message: 'Produto criado com sucesso',
            data: {
                id: result.rows[0].id,
                name: result.rows[0].name,
                createdAt: result.rows[0].created_at
            }
        });

    } catch (error) {
        console.error('❌ Erro ao criar produto:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

// =====================================================
// ATUALIZAR PRODUTO (ADMIN)
// =====================================================
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, price, image_url, category, color, discount_price } = req.body;

        // Verificar se produto existe
        const existing = await query(`
            SELECT id FROM products 
            WHERE id = $1 AND is_active = true AND deleted_at IS NULL
        `, [id]);

        if (existing.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Produto não encontrado'
            });
        }

        await query(`
            UPDATE products 
            SET 
                name = COALESCE($2, name),
                description = COALESCE($3, description),
                price = COALESCE($4, price),
                image_url = COALESCE($5, image_url),
                category = COALESCE($6, category),
                color = COALESCE($7, color),
                discount_price = COALESCE($8, discount_price),
                updated_at = NOW()
            WHERE id = $1
        `, [id, name, description, price ? parseFloat(price) : null, image_url, category, color, discount_price ? parseFloat(discount_price) : null]);

        console.log(`✅ Produto atualizado: ID ${id}`);

        res.json({
            success: true,
            message: 'Produto atualizado com sucesso'
        });

    } catch (error) {
        console.error('❌ Erro ao atualizar produto:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

// =====================================================
// SOFT DELETE PRODUTO (ADMIN)
// =====================================================
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await query(`
            UPDATE products 
            SET deleted_at = NOW(), updated_at = NOW()
            WHERE id = $1 AND is_active = true
            RETURNING name
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Produto não encontrado'
            });
        }

        console.log(`🗑️ Produto movido para lixeira: ${result.rows[0].name}`);

        res.json({
            success: true,
            message: 'Produto movido para lixeira'
        });

    } catch (error) {
        console.error('❌ Erro ao deletar produto:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

// =====================================================
// RESTAURAR PRODUTO DA LIXEIRA (ADMIN)
// =====================================================
router.post('/:id/restore', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await query(`
            UPDATE products 
            SET deleted_at = NULL, updated_at = NOW()
            WHERE id = $1 AND deleted_at IS NOT NULL
            RETURNING name
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Produto não encontrado na lixeira'
            });
        }

        console.log(`♻️ Produto restaurado: ${result.rows[0].name}`);

        res.json({
            success: true,
            message: 'Produto restaurado com sucesso'
        });

    } catch (error) {
        console.error('❌ Erro ao restaurar produto:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

// =====================================================
// BUSCAR PRODUTOS NA LIXEIRA (ADMIN)
// =====================================================
router.get('/admin/trash', async (req, res) => {
    try {
        const result = await query(`
            SELECT 
                id,
                name,
                description,
                price,
                category,
                color,
                deleted_at
            FROM products 
            WHERE deleted_at IS NOT NULL
            ORDER BY deleted_at DESC
        `);

        const trashProducts = result.rows.map(row => ({
            id: row.id,
            name: row.name,
            description: row.description,
            price: parseFloat(row.price),
            category: row.category,
            color: row.color,
            deletedAt: row.deleted_at
        }));

        res.json({
            success: true,
            count: trashProducts.length,
            data: trashProducts
        });

    } catch (error) {
        console.error('❌ Erro ao buscar lixeira:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

module.exports = router;
