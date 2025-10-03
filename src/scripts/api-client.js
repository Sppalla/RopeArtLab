/**
 * =====================================================
 * ROPEARTLAB - CLIENTE API COM FALLBACK PARA LOCALSTORAGE
 * =====================================================
 * 
 * Este arquivo fornece uma camada de abstração que permite:
 * 1. Usar API quando disponível (produção)
 * 2. Usar localStorage quando API não está disponível (local)
 * 3. Migração transparente entre os dois sistemas
 * 
 * Compatibilidade total com código existente!
 */

// Configuração baseada no ambiente
const API_CONFIG = {
    // URL da API (detecta automaticamente se local ou produção)
    baseURL: window.location.protocol === 'file:' 
        ? 'http://localhost:3000/api' 
        : '/api', // Usar API local no mesmo domínio
    
    // Timeout para requests
    timeout: 5000,
    
    // Retry automático em caso de falha
    retries: 2,
    
    // Usar localStorage como fallback
    useLocalStorageFallback: true
};

class APIClient {
    constructor() {
        this.baseURL = API_CONFIG.baseURL;
        this.useFallback = API_CONFIG.useLocalStorageFallback;
        this.apiAvailable = false;
        
        console.log('🚀 APIClient inicializado');
        console.log('📍 Base URL:', this.baseURL);
        console.log('🔄 Fallback localStorage:', this.useFallback);
        
        // Testar conectividade da API
        this.testAPI();
    }

    /**
     * Testa se a API está disponível
     */
    async testAPI() {
        try {
            const response = await fetch(`${this.baseURL}/health`, {
                method: 'GET',
                timeout: 3000
            });
            
            if (response.ok) {
                this.apiAvailable = true;
                console.log('✅ API disponível - usando banco de dados');
                return true;
            }
        } catch (error) {
            console.log('⚠️ API não disponível - usando localStorage');
        }
        
        this.apiAvailable = false;
        return false;
    }

    /**
     * Executa chamada HTTP com retry automático
     */
    async fetchWithRetry(url, options = {}, retries = API_CONFIG.retries) {
        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return response;
        } catch (error) {
            if (retries > 0) {
                console.log(`🔄 Tentativa ${API_CONFIG.retries - retries + 1} falhou, tentando novamente...`);
                await new Promise(resolve => setTimeout(resolve, 1000));
                return this.fetchWithRetry(url, options, retries - 1);
            }
            throw error;
        }
    }

    // =====================================================
    // PRODUTOS
    // =====================================================

    /**
     * Buscar todos os produtos
     */
    async getProducts() {
        if (this.apiAvailable) {
            try {
                const response = await this.fetchWithRetry(`${this.baseURL}/products`);
                const data = await response.json();
                console.log('📦 Produtos carregados da API:', data.count);
                return data.data;
            } catch (error) {
                console.log('❌ Erro ao buscar produtos da API, usando localStorage');
            }
        }

        // Fallback para localStorage
        if (this.useFallback) {
            const products = JSON.parse(localStorage.getItem('ropeartlab_products') || '[]');
            console.log('📦 Produtos carregados do localStorage:', products.length);
            return products;
        }

        return [];
    }

    /**
     * Buscar produto por ID
     */
    async getProduct(id) {
        if (this.apiAvailable) {
            try {
                const response = await this.fetchWithRetry(`${this.baseURL}/products/${id}`);
                const data = await response.json();
                return data.data;
            } catch (error) {
                console.log('❌ Erro ao buscar produto da API, using localStorage');
            }
        }

        // Fallback para localStorage
        if (this.useFallback) {
            const products = JSON.parse(localStorage.getItem('ropeartlab_products') || '[]');
            return products.find(p => p.id == id) || null;
        }

        return null;
    }

    /**
     * Criar novo produto
     */
    async createProduct(productData) {
        if (this.apiAvailable) {
            try {
                const response = await this.fetchWithRetry(`${this.baseURL}/products`, {
                    method: 'POST',
                    body: JSON.stringify(productData)
                });
                const data = await response.json();
                console.log('✅ Produto criado na API:', data.data.name);
                return data.data;
            } catch (error) {
                console.log('❌ Erro ao criar produto na API, usando localStorage');
            }
        }

        // Fallback para localStorage
        if (this.useFallback) {
            const products = JSON.parse(localStorage.getItem('ropeartlab_products') || '[]');
            const newProduct = {
                ...productData,
                id: Date.now().toString(),
                createdAt: new Date().toISOString()
            };
            products.push(newProduct);
            localStorage.setItem('ropeartlab_products', JSON.stringify(products));
            console.log('✅ Produto criado no localStorage:', newProduct.name);
            return newProduct;
        }

        return null;
    }

    // =====================================================
    // USUÁRIOS
    // =====================================================

    /**
     * Buscar usuário por email
     */
    async getUserByEmail(email) {
        if (this.apiAvailable) {
            try {
                const response = await this.fetchWithRetry(`${this.baseURL}/users/email/${email}`);
                const data = await response.json();
                return data.data;
            } catch (error) {
                console.log('❌ Erro ao buscar usuário da API, usando localStorage');
            }
        }

        // Fallback para localStorage
        if (this.useFallback) {
            const users = JSON.parse(localStorage.getItem('ropeartlab_users') || '[]');
            return users.find(u => u.email === email) || null;
        }

        return null;
    }

    /**
     * Criar novo usuário
     */
    async createUser(userData) {
        if (this.apiAvailable) {
            try {
                const response = await this.fetchWithRetry(`${this.baseURL}/users/register`, {
                    method: 'POST',
                    body: JSON.stringify(userData)
                });
                console.log('✅ Usuário criado na API');
                return response.data;
            } catch (error) {
                console.log('❌ Erro ao criar usuário na API, usando localStorage');
            }
        }

        // Fallback para localStorage
        if (this.useFallback) {
            const users = JSON.parse(localStorage.getItem('ropeartlab_users') || '[]');
            const newUser = {
                ...userData,
                id: Date.now().toString(),
                createdAt: new Date().toISOString()
            };
            users.push(newUser);
            localStorage.setItem('ropeartlab_users', JSON.stringify(users));
            console.log('✅ Usuário criado no localStorage');
            return newUser;
        }

        return null;
    }

    /**
     * Login de usuário
     */
    async authenticateUser(identifier) {
        if (this.apiAvailable) {
            try {
                const response = await this.fetchWithRetry(`${this.baseURL}/users/authenticate`, {
                    method: 'POST',
                    body: JSON.stringify({ identifier })
                });
                const data = await response.json();
                return data.data;
            } catch (error) {
                console.log('❌ Erro ao autenticar na API, usando localStorage');
            }
        }

        // Fallback para localStorage
        if (this.useFallback) {
            const users = JSON.parse(localStorage.getItem('ropeartlab_users') || '[]');
            let user = null;
            
            if (identifier.includes('@')) {
                user = users.find(u => u.email === identifier);
            } else {
                const cleanIdentifier = identifier.replace(/[^\d]/g, '');
                user = users.find(u => u.cpf?.replace(/[^\d]/g, '') === cleanIdentifier);
            }
            
            return user || null;
        }

        return null;
    }

    // =====================================================
    // PEDIDOS
    // =====================================================

    /**
     * Buscar pedidos do usuário
     */
    async getUserOrders(userEmail) {
        if (this.apiAvailable) {
            try {
                const response = await this.fetchWithRetry(`${this.baseURL}/orders/user/${userEmail}`);
                const data = await response.json();
                return data.data;
            } catch (error) {
                console.log('❌ Erro ao buscar pedidos da API, usando localStorage');
            }
        }

        // Fallback para localStorage
        if (this.useFallback) {
            const orders = JSON.parse(localStorage.getItem('ropeartlab_orders') || '[]');
            return orders.filter(o => o.userEmail === userEmail);
        }

        return [];
    }

    /**
     * Criar novo pedido
     */
    async createOrder(orderData) {
        if (this.apiAvailable) {
            try {
                const response = await this.fetchWithRetry(`${this.baseURL}/orders`, {
                    method: 'POST',
                    body: JSON.stringify(orderData)
                });
                console.log('✅ Pedido criado na API');
                return response.data;
            } catch (error) {
                console.log('❌ Erro ao criar pedido na API, usando localStorage');
            }
        }

        // Fallback para localStorage
        if (this.useFallback) {
            const orders = JSON.parse(localStorage.getItem('ropeartlab_orders') || '[]');
            const newOrder = {
                ...orderData,
                id: Date.now().toString(),
                date: new Date().toISOString(),
                status: 'pending'
            };
            orders.push(newOrder);
            localStorage.setItem('ropeartlab_orders', JSON.stringify(orders));
            console.log('✅ Pedido criado no localStorage');
            return newOrder;
        }

        return null;
    }

    // =====================================================
    // ANÁLISES (ADMIN)
    // =====================================================

    /**
     * Buscar dados para análises financeiras
     */
    async getAnalyticsData(period = '30') {
        if (this.apiAvailable) {
            try {
                const response = await this.fetchWithRetry(`${this.baseURL}/analytics/financial?period=${period}`);
                const data = await response.json();
                return data.data;
            } catch (error) {
                console.log('❌ Erro ao buscar análises da API, usando localStorage');
            }
        }

        // Fallback para localStorage
        if (this.useFallback) {
            const orders = JSON.parse(localStorage.getItem('ropeartlab_orders') || '[]');
            const finalizedOrders = orders.filter(order => order.status === 'finalized');
            
            return {
                totalRevenue: finalizedOrders.reduce((sum, order) => sum + parseFloat(order.total || 0), 0),
                totalOrders: finalizedOrders.length,
                productSales: this.calculateProductSales(finalizedOrders)
            };
        }

        return null;
    }

    /**
     * Calcular vendas por produto (localStorage)
     */
    calculateProductSales(orders) {
        const productSales = {};
        
        orders.forEach(order => {
            if (order.items) {
                order.items.forEach(item => {
                    const productName = item.name;
                    if (!productSales[productName]) {
                        productSales[productName] = {
                            name: productName,
                            totalSold: 0,
                            totalRevenue: 0,
                            orders: 0
                        };
                    }
                    
                    productSales[productName].totalSold += parseInt(item.quantity || 0);
                    productSales[productName].totalRevenue += parseFloat(item.price || 0) * parseInt(item.quantity || 0);
                    productSales[productName].orders++;
                });
            }
        });

        return Object.values(productSales);
    }

    // =====================================================
    // SINCRONIZAÇÃO E MIGRAÇÃO
    // =====================================================

    /**
     * Migrar dados do localStorage para API (quando disponível)
     */
    async migrateToAPI() {
        if (!this.apiAvailable || !this.useFallback) {
            return false;
        }

        console.log('🔄 Iniciando migração de dados do localStorage para API...');

        try {
            // Migrar produtos
            const products = JSON.parse(localStorage.getItem('ropeartlab_products') || '[]');
            for (const product of products) {
                await this.createProduct(product);
                await new Promise(resolve => setTimeout(resolve, 100)); // Rate limiting
            }

            // Migrar usuários
            const users = JSON.parse(localStorage.getItem('ropeartlab_users') || '[]');
            for (const user of users) {
                await this.createUser(user);
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            // Migrar pedidos
            const orders = JSON.parse(localStorage.getItem('ropeartlab_orders') || '[]');
            for (const order of orders) {
                await this.createOrder(order);
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            console.log('✅ Migração concluída com sucesso!');
            return true;

        } catch (error) {
            console.error('❌ Erro durante migração:', error);
            return false;
        }
    }

    /**
     * Status da conectividade
     */
    getStatus() {
        return {
            apiAvailable: this.apiAvailable,
            usingFallback: this.useFallback,
            baseURL: this.baseURL,
            environment: window.location.protocol === 'file:' ? 'local' : 'production'
        };
    }
}

// Criar instância global
window.apiClient = new APIClient();

// Log de status inicial
console.log('🎯 Status inicial do APIClient:', window.apiClient.getStatus());

// Auto-migração (opcional)
window.addEventListener('load', () => {
    setTimeout(() => {
        if (window.apiClient.apiAvailable) {
            console.log('🚀 API disponível detectada - migração automática iniciada');
            window.apiClient.migrateToAPI();
        }
    }, 3000);
});

// Exportar para módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIClient;
}
