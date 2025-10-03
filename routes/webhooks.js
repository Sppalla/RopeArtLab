const express = require('express');
const router = express.Router();
const { query, transaction } = require('../config/database');

// =====================================================
// WEBHOOK WHATSAPP BUSINESS API
// =====================================================
// Para integração futura com WhatsApp Business API

// Verificar webhook do WhatsApp
router.get('/whatsapp/verify', (req, res) => {
    const { 'hub.mode': mode, 'hub.challenge': challenge, 'hub.verify_token': token } = req.query;
    
    const expectedToken = process.env.WHATSAPP_VERIFY_TOKEN || 'ropeartlab_webhook_2024';
    
    if (mode === 'subscribe' && token === expectedToken) {
        console.log('✅ Webhook WhatsApp verificado com sucesso');
        res.status(200).send(challenge);
    } else {
        console.log('❌ Falha na verificação do webhook WhatsApp');
        res.status(403).json({ error: 'Token inválido' });
    }
});

// Receber mensagens do WhatsApp
router.post('/whatsapp/messages', async (req, res) => {
    try {
        const { entry } = req.body;
        
        console.log('📱 Webhook WhatsApp recebido:', JSON.stringify(req.body, null, 2));
        
        if (!entry || !entry[0] || !entry[0].changes) {
            return res.status(400).json({ error: 'Formato inválido' });
        }

        const changes = entry[0].changes[0];
        
        if (changes.field === 'messages') {
            const messages = changes.value.messages;
            
            if (messages && messages.length > 0) {
                await processWhatsAppMessages(messages);
            }
        }

        res.status(200).json({ status: 'success' });

    } catch (error) {
        console.error('❌ Erro no webhook WhatsApp:', error);
        res.status(500).json({ error: 'Erro interno' });
    }
});

// =====================================================
// WEBHOOK MEIO PAGAMENTO (PIX/PAYPAL/etc)
// =====================================================

// Webhook de pagamentos (PIX simulador)
router.post('/payment/pix', async (req, res) => {
    try {
        const { order_id, status, pix_key, amount, transaction_id } = req.body;
        
        console.log('💰 Webhook PIX:', { order_id, status, amount });
        
        if (status === 'PAID') {
            // Atualizar pedido para aprovado automaticamente
            await query(`
                UPDATE orders 
                SET 
                    status = 'approved',
                    approved_at = NOW(),
                    updated_at = NOW(),
                    payment_method = 'pix'
                WHERE uuid = $1 AND status = 'pending'
            `, [order_id]);
            
            console.log(`✅ Pagamento PIX processado: Pedido ${order_id}`);
        }
        
        res.status(200).json({ 
            status: 'processed',
            order_id: order_id,
            new_status: status === 'PAID' ? 'approved' : 'pending'
        });

    } catch (error) {
        console.error('❌ Erro no webhook PIX:', error);
        res.status(500).json({ error: 'Erro interno' });
    }
});

// =====================================================
// WEBHOOK AUDITORIA (LOG DE TODOS OS EVENTOS)
// =====================================================

// Registrar eventos de sistema
router.post('/audit', async (req, res) => {
    try {
        const { event_type, description, user_id, ip_address, metadata } = req.body;
        
        // Inserir log de auditoria
        await query(`
            INSERT INTO audit_logs (
                table_name, action, user_id, ip_address
            ) VALUES ($1, $2, $3, $4)
        `, [event_type, 'WEBHOOK', user_id, ip_address]);
        
        console.log(`📋 Evento de auditoria: ${event_type} - ${description}`);
        
        res.status(200).json({ status: 'logged' });

    } catch (error) {
        console.error('❌ Erro no webhook de auditoria:', error);
        res.status(500).json({ error: 'Erro interno' });
    }
});

// =====================================================
// FUNÇÕES AUXILIARES
// =====================================================

async function processWhatsAppMessages(messages) {
    for (const message of messages) {
        // Extrair informações da mensagem
        const whatsappId = message.from;
        const text = message.text?.body || '';
        const type = message.type;
        
        console.log(`📱 Mensagem WhatsApp recebida de ${whatsappId}: ${text.substring(0, 50)}...`);
        
        // Detectar se é um pedido
        if (isOrderMessage(text)) {
            await createOrderFromWhatsApp({
                whatsappId,
                messageText: text,
                receivedAt: new Date()
            });
        }
        
        // Detectar outros tipos de mensagem (suporte, dúvidas, etc)
        else if (isSupportMessage(text)) {
            await handleSupportMessage({
                whatsappId,
                messageText: text,
                receivedAt: new Date()
            });
        }
    }
}

function isOrderMessage(text) {
    const orderKeywords = ['pedido', 'comprar', 'quero', 'necessito', 'corda'];
    return orderKeywords.some(keyword => 
        text.toLowerCase().includes(keyword.toLowerCase())
    );
}

function isSupportMessage(text) {
    const supportKeywords = ['ajuda', 'suporte', 'dúvida', 'problema'];
    return supportKeywords.some(keyword => 
        text.toLowerCase().includes(keyword.toLowerCase())
    );
}

async function createOrderFromWhatsApp({ whatsappId, messageText, receivedAt }) {
    try {
        // Extrair produtos mencionados
        const detectedProducts = extractProductsFromMessage(messageText);
        
        if (detectedProducts.length === 0) {
            console.log('ℹ️ Nenhum produto detectado na mensagem WhatsApp');
            return;
        }
        
        // Calcular total
        const total = detectedProducts.reduce((sum, product) => 
            sum + (product.price * product.quantity), 0
        );
        
        // Criar pedido
        const orderResult = await query(`
            INSERT INTO orders (
                user_email, total_amount, status, payment_method, notes
            ) VALUES ($1, $2, $3, $4, $5)
            RETURNING id, uuid, order_number, created_at
        `, [
            whatsappId + '@whatsapp.local', // Email temporário do WhatsApp
            total,
            'pending',
            'whatsapp',
            `Pedido via WhatsApp: ${messageText.substring(0, 200)}`
        ]);
        
        const order = orderResult.rows[0];
        
        // Adicionar itens do pedido
        for (const product of detectedProducts) {
            await query(`
                INSERT INTO order_items (
                    order_id, product_name, product_price, quantity, subtotal
                ) VALUES ($1, $2, $3, $4, $5)
            `, [
                order.id,
                product.name,
                product.price,
                product.quantity,
                product.price * product.quantity
            ]);
        }
        
        console.log(`✅ Pedido WhatsApp criado: ${order.order_number} - R$ ${total.toFixed(2)}`);
        
        // TODO: Enviar confirmação para WhatsApp (quando API estiver configurada)
        
    } catch (error) {
        console.error('❌ Erro ao criar pedido do WhatsApp:', error);
    }
}

function extractProductsFromMessage(text) {
    // Simular detecção de produtos (em produção real, usar IA/NLP)
    const products = [];
    const productNames = [
        'Corda Amarela e Laranja', 'Corda Azul Bebê', 'Corda Marinho',
        'Corda Militar', 'Corda Rosa Bebê', 'Corda Rosa Pink',
        'Corda Roxo', 'Corda Verde'
    ];
    
    productNames.forEach(name => {
        const regex = new RegExp(name.toLowerCase(), 'i');
        if (regex.test(text.toLowerCase())) {
            // Extrair quantidade (simulação)
            const quantityMatch = text.match(/(\d+)|(?:\s+(?:uma|dois|três|quatro|cinco))/i);
            const quantity = quantityMatch ? parseInt(quantityMatch[1] || quantityMatch[0]) : 1;
            
            // Simular preço (em produção, buscar do banco)
            const price = 40 + Math.random() * 10; // Simular preços
            
            products.push({
                name: name,
                quantity: quantity,
                price: price
            });
        }
    });
    
    return products;
}

async function handleSupportMessage({ whatsappId, messageText, receivedAt }) {
    try {
        // Registrar mensagem de suporte para análise posterior
        console.log(`🆘 Mensagem de suporte de ${whatsappId}: ${messageText}`);
        
        // TODO: Implementar sistema de tickets de suporte
        // TODO: Auto-resposta baseada em FAQ
        // TODO: Escalar para atendente humano
        
    } catch (error) {
        console.error('❌ Erro ao processar mensagem de suporte:', error);
    }
}

module.exports = router;
