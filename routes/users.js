const express = require('express');
const router = express.Router();
const { query, transaction } = require('../config/database');
const bcrypt = require('bcryptjs');

// =====================================================
// LISTAR USUÁRIOS (ADMIN)
// =====================================================
router.get('/', async (req, res) => {
    try {
        console.log('👥 Buscando usuários no banco...');
        
        const result = await query(`
            SELECT 
                id,
                uuid,
                nome,
                sobrenome,
                email,
                cpf_cnpj,
                telefone,
                cep,
                endereco,
                numero,
                complemento,
                cidade,
                estado,
                email_verified,
                created_at,
                last_login,
                is_active
            FROM users 
            WHERE is_active = true AND deleted_at IS NULL
            ORDER BY created_at DESC
        `);

        console.log(`✅ ${result.rows.length} usuários encontrados`);
        
        // Converter para formato compatível com frontend
        const users = result.rows.map(row => ({
            id: row.uuid, // Usar UUID como ID público
            nome: row.nome,
            sobrenome: row.sobrenome,
            email: row.email,
            cpf: row.cpf_cnpj,
            telefone: row.telefone,
            cep: row.cep,
            endereco: row.endereco,
            numero: row.numero,
            complemento: row.complemento,
            cidade: row.cidade,
            estado: row.estado,
            emailVerified: row.email_verified,
            createdAt: row.created_at,
            lastLogin: row.last_login,
            isActive: row.is_active
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
            error: 'Erro interno do servidor',
            message: 'Não foi possível carregar os usuários'
        });
    }
});

// =====================================================
// BUSCAR USUÁRIO POR ID/UUID
// =====================================================
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Aceitar tanto UUID quanto ID numérico
        const whereClause = isNaN(id) ? 'uuid = $1' : 'id = $1';
        
        const result = await query(`
            SELECT 
                id,
                uuid,
                nome,
                sobrenome,
                email,
                cpf_cnpj,
                telefone,
                cep,
                endereco,
                numero,
                complemento,
                cidade,
                estado,
                email_verified,
                created_at,
                last_login
            FROM users 
            WHERE ${whereClause} AND is_active = true AND deleted_at IS NULL
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Usuário não encontrado'
            });
        }

        const user = result.rows[0];
        res.json({
            success: true,
            data: {
                id: user.uuid,
                nome: user.nome,
                sobrenome: user.sobrenome,
                email: user.email,
                cpf:用户的cpf_cnpj,
                telefone: user.telefone,
                cep: user.cep,
                endereco: user.endereco,
                numero: user.numero,
                complemento: user.complemento,
                cidade: user.cidade,
                estado: user.estado,
                emailVerified: user.email_verified,
                createdAt: user.created_at,
                lastLogin: user.last_login
            }
        });

    } catch (error) {
        console.error('❌ Erro ao buscar usuário:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

// =====================================================
// CRIAR NOVO USUÁRIO (REGISTRO)
// =====================================================
router.post('/register', async (req, res) => {
    try {
        const {
            nome,
            sobrenome,
            email,
            cpf_cnpj,
            telefone,
            password, // Para futuro sistema de auth
            cep,
            endereco,
            numero,
            complemento,
            cidade,
            estado
        } = req.body;

        // Validação básica
        if (!nome || !email || !cpf_cnpj) {
            return res.status(400).json({
                success: false,
                error: 'Nome, email e CPF/CNPJ são obrigatórios'
            });
        }

        // Limpar CPF/CNPJ
        const cleanCpfCnpj = cpf_cnpj.replace(/[^\d]/g, '');

        // Verificar se usuário já existe
        const existingEmail = await query(`
            SELECT id FROM users 
            WHERE email = $1 AND is_active = true
        `, [email.toLowerCase()]);

        if (existingEmail.rows.length > 0) {
            return res.status(409).json({
                success: false,
                error: 'Email já cadastrado'
            });
        }

        const existingCpf = await query(`
            SELECT id FROM users 
            WHERE cpf_cnpj = $1 AND is_active = true
        `, [cleanCpfCnpj]);

        if (existingCpf.rows.length > 0) {
            return res.status(409).json({
                success: false,
                error: 'CPF/CNPJ já cadastrado'
            });
        }

        await transaction(async (client) => {
            // Criar usuário
            const result = await client.query(`
                INSERT INTO users (
                    nome, sobrenome, email, cpf_cnpj, telefone, cep,
                    endereco, numero, complemento, cidade, estado,
                    password_hash, email_verified
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                RETURNING id, uuid, email, created_at
            `, [
                nome,
                sobrenome || null,
                email.toLowerCase(),
                cleanCpfCnpj,
                telefone || null,
                cep || null,
                endereco || null,
                numero || null,
                complemento || null,
                cidade || null,
                estado || null,
                password ? await bcrypt.hash(password, 10) : null,
                false // Por enquanto, sem verificação de email
            ]);

            const newUser = result.rows[0];
            console.log(`✅ Usuário criado: ${email} (UUID: ${newUser.uuid})`);

            return {
                id: newUser.uuid,
                email: newUser.email,
                createdAt: newUser.created_at
            };
        });

        res.status(201).json({
            success: true,
            message: 'Usuário criado com sucesso'
        });

    } catch (error) {
        console.error('❌ Erro ao criar usuário:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

// =====================================================
// BUSCAR USUÁRIO POR EMAIL (LOGIN HELPER)
// =====================================================
router.get('/email/:email', async (req, res) => {
    try {
        const { email } = req.params;
        
        const result = await query(`
            SELECT 
                id,
                uuid,
                nome,
                sobrenome,
                email,
                cpf_cnpj,
                telefone,
                cep,
                endereco,
                numero,
                complemento,
                cidade,
                estado,
                created_at,
                password_hash
            FROM users 
            WHERE email = $1 AND is_active = true AND deleted_at IS NULL
        `, [email.toLowerCase()]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Usuário não encontrado'
            });
        }

        const user = result.rows[0];
        
        // Atualizar último login
        await query(`
            UPDATE users 
            SET last_login = NOW(), updated_at = NOW()
            WHERE id = $1
        `, [user.id]);

        res.json({
            success: true,
            data: {
                id: user.uuid,
                nome: user.nome,
                sobrenome: user.sobrenome,
                email: user.email,
                cpf: user.cpf_cnpj,
                telefone: user.telefone,
                cep: user.cep,
                endereco: user.endereco,
                numero: user.numero,
                complemento: user.complemento,
                cidade: user.cidade,
                estado: user.estado,
                createdAt: user.created_at,
                hasPassword: !!user.password_hash
            }
        });

    } catch (error) {
        console.error('❌ Erro ao buscar usuário por email:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

// =====================================================
// ATUALIZAR USUÁRIO (EDITAR PERFIL)
// =====================================================
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        // Verificar se usuário existe
        const existing = await query(`
            SELECT id FROM users 
            WHERE uuid = $1 AND is_active = true AND deleted_at IS NULL
        `, [id]);

        if (existing.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Usuário não encontrado'
            });
        }

        // Preparar campos para atualização
        const fields = [];
        const values = [];
        let paramCount = 1;

        const allowedFields = [
            'nome', 'sobrenome', 'email', 'telefone', 'cep',
            'endereco', 'numero', 'complemento', 'cidade', 'estado'
        ];

        for (const [key, value] of Object.entries(updateData)) {
            if (allowedFields.includes(key) && value !== undefined) {
                fields.push(`${key} = $${paramCount}`);
                values.push(value);
                paramCount++;
            }
        }

        if (fields.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Nenhum campo válido para atualizar'
            });
        }

        // Adicionar email na verificação de duplicata se necessário
        if (updateData.email) {
            const emailCheck = await query(`
                SELECT id FROM users 
                WHERE email = $1 AND uuid != $2 AND is_active = true
            `, [updateData.email.toLowerCase(), id]);

            if (emailCheck.rows.length > 0) {
                return res.status(409).json({
                    success: false,
                    error: 'Email já está sendo usado por outro usuário'
                });
            }
        }

        await query(`
            UPDATE users 
            SET ${fields.join(', ')}, updated_at = NOW()
            WHERE uuid = $${paramCount}
        `, [...values, id]);

        console.log(`✅ Usuário atualizado: UUID ${id}`);

        res.json({
            success: true,
            message: 'Usuário atualizado com sucesso'
        });

    } catch (error) {
        console.error('❌ Erro ao atualizar usuário:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

// =====================================================
// DESATIVAR USUÁRIO (SOFT DELETE)
// =====================================================
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await query(`
            UPDATE users 
            SET deleted_at = NOW(), updated_at = NOW(), is_active = false
            WHERE uuid = $1 AND is_active = true
            RETURNING nome, email
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Usuário não encontrado'
            });
        }

        console.log(`🗑️ Usuário desativado: ${result.rows[0].email}`);

        res.json({
            success: true,
            message: 'Usuário excluído com sucesso'
        });

    } catch (error) {
        console.error('❌ Erro ao deletar usuário:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

// =====================================================
// AUTENTICAÇÃO SIMPLES (LOGIN VIA EMAIL/CPF)
// =====================================================
router.post('/authenticate', async (req, res) => {
    try {
        const { identifier } = req.body; // identifier pode ser email ou CPF/CNPJ
        
        let userResult;
        
        if (identifier.includes('@')) {
            // Buscar por email
            userResult = await query(`
                SELECT 
                    id,
                    uuid,
                    nome,
                    sobrenome,
                    email,
                    cpf_cnpj,
                    telefone,
                    cep,
                    endereco,
                    numero,
                    complemento,
                    cidade,
                    estado,
                    created_at
                FROM users 
                WHERE email = $1 AND is_active = true AND deleted_at IS NULL
            `, [identifier.toLowerCase()]);
        } else {
            // Buscar por CPF/CNPJ (limpar)
            const cleanCpfCnpj = identifier.replace(/[^\d]/g, '');
            userResult = await query(`
                SELECT 
                    id,
                    uuid,
                    nome,
                    sobrenome,
                    email,
                    cpf_cnpj,
                    telefone,
                    cep,
                    endereco,
                    numero,
                    complemento,
                    cidade,
                    estado,
                    created_at
                FROM users 
                WHERE cpf_cnpj = $1 AND is_active = true AND deleted_at IS NULL
            `, [cleanCpfCnpj]);
        }

        if (userResult.rows.length === 0) {
            return res.status(401).json({
                success: false,
                error: 'Credenciais inválidas'
            });
        }

        const user = userResult.rows[0];
        
        // Atualizar último login
        await query(`
            UPDATE users 
            SET last_login = NOW(), updated_at = NOW()
            WHERE id = $1
        `, [user.id]);

        res.json({
            success: true,
            message: 'Login realizado com sucesso',
            data: {
                id: user.uuid,
                nome: user.nome,
                sobrenome: user.sobrenome,
                email: user.email,
                cpf: user.cpf_cnpj,
                telefone: user.telefone,
                cep: user.cep,
                endereco: user.endereco,
                numero: user.numero,
                complemento: user.complemento,
                cidade: user.cidade,
                estado: user.estado,
                createdAt: user.created_at
            }
        });

    } catch (error) {
        console.error('❌ Erro ao autenticar usuário:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

module.exports = router;
