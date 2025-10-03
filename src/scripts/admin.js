// Sistema de Administração - RopeArtLab
class AdminSystem {
    constructor() {
        console.log('Inicializando AdminSystem...');
        this.currentTab = 'dashboard';
        this.products = this.loadProducts();
        console.log('Produtos carregados no construtor:', this.products.length);
        this.siteContent = this.loadSiteContent();
        this.contactSettings = this.loadContactSettings();
        this.siteSettings = this.loadSiteSettings();
        this.images = this.loadImages();
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.setupBroadcastChannel();
        this.loadDashboardData();
        this.loadProducts();
        this.loadClients();
        this.loadOrders();
        this.loadImages();
        
        // Verificar itens expirados na lixeira
        checkExpiredTrashItems();
        
        // Verificar a cada hora
        setInterval(checkExpiredTrashItems, 60 * 60 * 1000);
        
        // Restaurar estado da sidebar
        restoreSidebarState();
        
        // Forçar carregamento dos produtos após um delay
        setTimeout(() => {
            console.log('Forçando carregamento dos produtos...');
            this.loadProducts();
        }, 1000);
    }
    
    setupBroadcastChannel() {
        try {
            // Criar canal de comunicação entre abas
            window.productsChannel = new BroadcastChannel('ropeartlab_products');
            console.log('BroadcastChannel criado para sincronização');
        } catch (error) {
            console.warn('BroadcastChannel não suportado:', error);
        }
    }
    
    setupEventListeners() {
        // Navegação da sidebar
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                const tab = item.dataset.tab;
                this.switchTab(tab);
            });
        });
        
        // Busca de clientes
        const clientSearch = document.getElementById('client-search');
        if (clientSearch) {
            clientSearch.addEventListener('input', (e) => {
                this.searchClients(e.target.value);
            });
        }
        
        // Filtro de pedidos
        const orderFilter = document.getElementById('order-status-filter');
        if (orderFilter) {
            orderFilter.addEventListener('change', (e) => {
                this.filterOrders(e.target.value);
            });
        }
    }
    
    switchTab(tabName) {
        // Remover active de todos os nav-items
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Remover active de todas as abas
        document.querySelectorAll('.admin-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Adicionar active ao nav-item correspondente
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        
        // Mostrar aba correspondente
        document.getElementById(`${tabName}-tab`).classList.add('active');
        
        this.currentTab = tabName;
        
        // Carregar dados específicos da aba
        switch(tabName) {
            case 'dashboard':
                this.loadDashboardData();
                break;
            case 'products':
                console.log('Carregando aba de produtos...');
                // Forçar carregamento dos produtos
                setTimeout(() => {
                    console.log('Carregando produtos na aba...');
                    this.loadProducts();
                }, 100);
                break;
            case 'clients':
                this.loadClients();
                break;
            case 'orders':
                this.loadOrders();
                break;
            case 'analytics':
                this.loadAnalytics();
                break;
        }
    }
    
    // Dashboard
    loadDashboardData() {
        const users = this.loadUsers();
        const orders = this.loadOrders();
        
        // Atualizar estatísticas
        document.getElementById('total-clients').textContent = users.length;
        document.getElementById('total-products').textContent = this.products.length;
        document.getElementById('total-orders').textContent = orders.length;
        
        // Calcular receita total
        const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
        document.getElementById('total-revenue').textContent = `R$ ${totalRevenue.toFixed(2)}`;
        
        // Carregar pedidos recentes
        this.loadRecentOrders();
        
        // Carregar clientes recentes
        this.loadRecentClients();
    }
    
    loadRecentOrders() {
        const orders = this.loadOrders();
        const recentOrders = orders.slice(-5).reverse();
        
        const container = document.getElementById('recent-orders');
        if (container) {
            container.innerHTML = recentOrders.map(order => `
                <div class="recent-item">
                    <div class="item-info">
                        <strong>Pedido #${order.orderNumber}</strong>
                        <span>R$ ${order.total.toFixed(2)}</span>
                    </div>
                    <div class="item-date">${new Date(order.date).toLocaleDateString('pt-BR')}</div>
                </div>
            `).join('');
        }
    }
    
    loadRecentClients() {
        const users = this.loadUsers();
        const recentClients = users.slice(-5).reverse();
        
        const container = document.getElementById('recent-clients');
        if (container) {
            container.innerHTML = recentClients.map(user => `
                <div class="recent-item">
                    <div class="item-info">
                        <strong>${user.nome} ${user.sobrenome}</strong>
                        <span>${user.email}</span>
                    </div>
                    <div class="item-date">${new Date(user.createdAt).toLocaleDateString('pt-BR')}</div>
                </div>
            `).join('');
        }
    }
    
    
    getPriceHtml(product) {
        if (product.discount && product.discountPercentage > 0) {
            const originalPrice = product.price;
            const discountAmount = (originalPrice * product.discountPercentage) / 100;
            const discountedPrice = originalPrice - discountAmount;
            
            return `
                <div class="product-price discount">
                    <span class="product-price-original">R$ ${originalPrice.toFixed(2)}</span>
                    <span class="product-price-discounted">R$ ${discountedPrice.toFixed(2)}</span>
                    <span class="product-discount-percentage">-${product.discountPercentage}%</span>
                </div>
            `;
        } else {
            return `<p class="product-price">R$ ${product.price.toFixed(2)}</p>`;
        }
    }
    
    openProductModal(productId = null) {
        const modal = document.getElementById('product-modal');
        const title = document.getElementById('product-modal-title');
        const form = document.getElementById('product-form');
        
        // Configurar evento para mostrar/ocultar campos de desconto
        const discountCheckbox = document.getElementById('product-discount-enabled');
        const discountFields = document.getElementById('discount-fields');
        
        discountCheckbox.addEventListener('change', function() {
            discountFields.style.display = this.checked ? 'block' : 'none';
        });
        
        if (productId) {
            const product = this.products.find(p => p.id === productId);
            title.textContent = 'Editar Produto';
            
            // Preencher formulário
            document.getElementById('product-name').value = product.name;
            document.getElementById('product-price').value = product.price;
            document.getElementById('product-description').value = product.description || '';
            document.getElementById('product-image').value = product.image || '';
            document.getElementById('product-category').value = product.category || 'outros';
            document.getElementById('product-category-tag').value = product.category || '';
            document.getElementById('product-stock').value = product.stock || 0;
            document.getElementById('product-active').checked = product.active !== false;
            document.getElementById('product-featured').checked = product.featured || false;
            
            // Campos de desconto
            const hasDiscount = product.discount && product.discountPercentage > 0;
            document.getElementById('product-discount-enabled').checked = hasDiscount;
            document.getElementById('product-discount-percentage').value = product.discountPercentage || 0;
            discountFields.style.display = hasDiscount ? 'block' : 'none';
            
            // Atualizar estado visual dos botões de checkbox
            updateCheckboxButtonState('product-active', product.active !== false);
            updateCheckboxButtonState('product-featured', product.featured || false);
            updateCheckboxButtonState('product-discount-enabled', hasDiscount);
            
            // Campos de tamanho
            const sizes = product.sizes || [];
            document.getElementById('size-small').checked = sizes.includes('pequeno');
            document.getElementById('size-medium').checked = sizes.includes('medio');
            document.getElementById('size-large').checked = sizes.includes('grande');
            document.getElementById('size-custom').checked = sizes.includes('personalizado');
            
            // Imagem do produto
            if (product.image) {
                const preview = document.getElementById('product-image-preview');
                const previewImg = document.getElementById('product-image-preview-img');
                const placeholder = document.getElementById('image-upload-placeholder');
                
                previewImg.src = product.image;
                preview.style.display = 'block';
                placeholder.style.display = 'none';
            }
            
            form.dataset.productId = productId;
        } else {
            title.textContent = 'Adicionar Produto';
            form.reset();
            form.removeAttribute('data-product-id');
            discountFields.style.display = 'none';
        }
        
        modal.classList.add('open');
    }
    
    closeProductModal() {
        document.getElementById('product-modal').classList.remove('open');
    }
    
    saveProduct(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const productId = event.target.dataset.productId;
        
        // Coletar tamanhos selecionados
        const sizes = [];
        if (document.getElementById('size-small').checked) sizes.push('pequeno');
        if (document.getElementById('size-medium').checked) sizes.push('medio');
        if (document.getElementById('size-large').checked) sizes.push('grande');
        if (document.getElementById('size-custom').checked) sizes.push('personalizado');
        
        // Obter imagem (da preview ou manter existente)
        const previewImg = document.getElementById('product-image-preview-img');
        let productImage = '';
        
        if (previewImg.src && previewImg.src !== window.location.href) {
            productImage = previewImg.src;
        } else if (productId) {
            // Manter imagem existente se não foi alterada
            const existingProduct = this.products.find(p => p.id === parseInt(productId));
            productImage = existingProduct ? existingProduct.image : '';
        }
        
        const product = {
            name: formData.get('product-name'),
            price: parseFloat(formData.get('product-price')),
            description: formData.get('product-description'),
            image: productImage,
            category: formData.get('product-category'),
            stock: parseInt(formData.get('product-stock')),
            active: formData.get('product-active') === 'on',
            featured: formData.get('product-featured') === 'on',
            discount: formData.get('product-discount-enabled') === 'on',
            discountPercentage: formData.get('product-discount-enabled') === 'on' ? parseInt(formData.get('product-discount-percentage')) : 0,
            sizes: sizes
        };
        
        if (productId) {
            // Editar produto existente
            const index = this.products.findIndex(p => p.id === parseInt(productId));
            if (index !== -1) {
                this.products[index] = { ...this.products[index], ...product };
            }
        } else {
            // Adicionar novo produto
            product.id = Date.now();
            product.createdAt = new Date().toISOString();
            this.products.push(product);
        }
        
        this.saveProducts();
        this.loadProducts();
        this.closeProductModal();
        
        this.showNotification('Produto salvo com sucesso!', 'success');
    }
    
    editProduct(productId) {
        this.openProductModal(productId);
    }
    
    deleteProduct(productId) {
        if (confirm('Tem certeza que deseja excluir este produto?')) {
            this.products = this.products.filter(p => p.id !== productId);
            this.saveProducts();
            this.loadProducts();
            this.showNotification('Produto excluído com sucesso!', 'success');
        }
    }
    
    // Clientes
    loadClients() {
        const users = this.loadUsers();
        const container = document.getElementById('clients-table-body');
        
        if (container) {
            if (users.length === 0) {
                container.innerHTML = `
                    <tr>
                        <td colspan="6" style="text-align: center; padding: 40px;">
                            <i class="fas fa-users" style="font-size: 3rem; color: #ccc; margin-bottom: 10px;"></i>
                            <h3>Nenhum cliente cadastrado</h3>
                            <p>Os clientes aparecerão aqui após se cadastrarem no site.</p>
                        </td>
                    </tr>
                `;
                return;
            }
            
            container.innerHTML = users.map(user => `
                <tr>
                    <td>${user.nome || ''} ${user.sobrenome || ''}</td>
                    <td>${user.email || 'N/A'}</td>
                    <td>${user.cpf || 'N/A'}</td>
                    <td>${user.telefone || 'N/A'}</td>
                    <td>${new Date(user.createdAt || Date.now()).toLocaleDateString('pt-BR')}</td>
                    <td>
                        <div class="client-actions">
                            <button class="btn-edit" onclick="adminSystem.viewClient(${user.id})" title="Ver detalhes">
                                <i class="fas fa-eye"></i> Ver
                            </button>
                            <button class="btn-orders" onclick="adminSystem.viewClientOrders(${user.id})" title="Ver pedidos">
                                <i class="fas fa-shopping-cart"></i> Pedidos
                            </button>
                            <button class="btn-delete" onclick="adminSystem.deleteClient(${user.id})" title="Excluir cliente">
                                <i class="fas fa-trash"></i> Excluir
                            </button>
                        </div>
                    </td>
                </tr>
            `).join('');
        }
    }
    
    searchClients(query) {
        const users = this.loadUsers();
        const filteredUsers = users.filter(user => 
            user.nome.toLowerCase().includes(query.toLowerCase()) ||
            user.email.toLowerCase().includes(query.toLowerCase()) ||
            user.cpfCnpj.includes(query)
        );
        
        const container = document.getElementById('clients-table-body');
        if (container) {
            container.innerHTML = filteredUsers.map(user => `
                <tr>
                    <td>${user.nome} ${user.sobrenome}</td>
                    <td>${user.email}</td>
                    <td>${user.cpfCnpj}</td>
                    <td>${user.celular}</td>
                    <td>${new Date(user.createdAt).toLocaleDateString('pt-BR')}</td>
                    <td>
                        <button class="btn-edit" onclick="adminSystem.viewClient(${user.id})">
                            <i class="fas fa-eye"></i> Ver
                        </button>
                        <button class="btn-delete" onclick="adminSystem.deleteClient(${user.id})">
                            <i class="fas fa-trash"></i> Excluir
                        </button>
                    </td>
                </tr>
            `).join('');
        }
    }
    
    viewClient(userId) {
        console.log('🔍 viewClient chamado com userId:', userId);
        const users = this.loadUsers();
        console.log('📋 Usuários carregados:', users.length);
        const user = users.find(u => u.id === userId);
        console.log('👤 Usuário encontrado:', user);
        
        if (user) {
            // Usar nova função de modal interno
            showClientPopup(user);
            
        } else {
            console.log('❌ Usuário não encontrado para ID:', userId);
            alert('Cliente não encontrado!');
        }
    }
    
    viewClientOrders(userId) {
        const users = this.loadUsers();
        const user = users.find(u => u.id === userId);
        const orders = JSON.parse(localStorage.getItem('ropeartlab_orders') || '[]');
        const clientOrders = orders.filter(order => order.userEmail === user?.email);
        
        if (!user) {
            this.showNotification('Cliente não encontrado!', 'error');
            return;
        }
        
        if (clientOrders.length === 0) {
            alert(`CLIENTE: ${user.nome || ''} ${user.sobrenome || ''}\n\n` +
                  `Este cliente ainda não fez nenhum pedido.\n` +
                  `Email: ${user.email || 'N/A'}`);
            return;
        }
        
        const ordersInfo = clientOrders.map(order => {
            const items = order.items.map(item => 
                `  • ${item.name}${item.size ? ` (${item.size})` : ''} - Qty: ${item.quantity} - R$ ${(item.price * item.quantity).toFixed(2)}`
            ).join('\n');
            
            return `PEDIDO #${order.orderNumber}\n` +
                   `Data: ${new Date(order.date).toLocaleDateString('pt-BR')}\n` +
                   `Status: ${order.status || 'Pendente'}\n` +
                   `Total: R$ ${order.total.toFixed(2)}\n` +
                   `Itens:\n${items}\n` +
                   `${'='.repeat(40)}`;
        }).join('\n');
        
        alert(`HISTÓRICO DE PEDIDOS\n` +
              `Cliente: ${user.nome || ''} ${user.sobrenome || ''}\n` +
              `Email: ${user.email || 'N/A'}\n\n` +
              `${ordersInfo}`);
    }
    
    deleteClient(userId) {
        const users = this.loadUsers();
        const user = users.find(u => u.id === userId);
        
        if (!user) {
            this.showNotification('Cliente não encontrado!', 'error');
            return;
        }
        
        const confirmMessage = `Tem certeza que deseja excluir este cliente?\n\n` +
                              `Cliente: ${user.nome || ''} ${user.sobrenome || ''}\n` +
                              `Email: ${user.email || 'N/A'}\n\n` +
                              `Esta ação não pode ser desfeita e também excluirá:\n` +
                              `• Histórico de pedidos\n` +
                              `• Todos os dados pessoais\n\n` +
                              `Digite "CONFIRMAR" para prosseguir:`;
        
        const confirmation = prompt(confirmMessage);
        
        if (confirmation === 'CONFIRMAR') {
            // Remover cliente da lista
            const filteredUsers = users.filter(u => u.id !== userId);
            localStorage.setItem('ropeartlab_users', JSON.stringify(filteredUsers));
            
            // Remover pedidos do cliente (opcional - pode manter se preferir)
            const orders = JSON.parse(localStorage.getItem('ropeartlab_orders') || '[]');
            const filteredOrders = orders.filter(order => order.userEmail !== user.email);
            localStorage.setItem('ropeartlab_orders', JSON.stringify(filteredOrders));
            
            this.loadClients();
            this.showNotification('Cliente e dados relacionados excluídos com sucesso!', 'success');
        } else if (confirmation !== null) {
            this.showNotification('Exclusão cancelada.', 'info');
        }
    }
    
    // Pedidos
    loadOrders() {
        const orders = JSON.parse(localStorage.getItem('ropeartlab_orders') || '[]');
        const container = document.getElementById('orders-table-body');
        
        if (container) {
            container.innerHTML = orders.map(order => `
                <tr>
                    <td>#${order.orderNumber}</td>
                    <td>${order.userName}</td>
                    <td>${new Date(order.date).toLocaleDateString('pt-BR')}</td>
                    <td>R$ ${order.total.toFixed(2)}</td>
                    <td><span class="status-badge status-${order.status || 'pending'}">${this.getStatusText(order.status || 'pending')}</span></td>
                    <td>
                        <button class="btn-edit" onclick="adminSystem.viewOrder(${order.id})">
                            <i class="fas fa-eye"></i> Ver
                        </button>
                        <button class="btn-edit" onclick="adminSystem.updateOrderStatus(${order.id})">
                            <i class="fas fa-edit"></i> Status
                        </button>
                    </td>
                </tr>
            `).join('');
        }
        
        return orders;
    }
    
    filterOrders(status) {
        const orders = JSON.parse(localStorage.getItem('ropeartlab_orders') || '[]');
        const filteredOrders = status ? orders.filter(order => order.status === status) : orders;
        
        const container = document.getElementById('orders-table-body');
        if (container) {
            container.innerHTML = filteredOrders.map(order => `
                <tr>
                    <td>#${order.orderNumber}</td>
                    <td>${order.userName}</td>
                    <td>${new Date(order.date).toLocaleDateString('pt-BR')}</td>
                    <td>R$ ${order.total.toFixed(2)}</td>
                    <td><span class="status-badge status-${order.status || 'pending'}">${this.getStatusText(order.status || 'pending')}</span></td>
                    <td>
                        <button class="btn-edit" onclick="adminSystem.viewOrder(${order.id})">
                            <i class="fas fa-eye"></i> Ver
                        </button>
                        <button class="btn-edit" onclick="adminSystem.updateOrderStatus(${order.id})">
                            <i class="fas fa-edit"></i> Status
                        </button>
                    </td>
                </tr>
            `).join('');
        }
    }
    
    getStatusText(status) {
        const statusMap = {
            'pending': 'Pendente',
            'processing': 'Processando',
            'completed': 'Concluído',
            'cancelled': 'Cancelado'
        };
        return statusMap[status] || 'Pendente';
    }
    
    viewOrder(orderId) {
        const orders = JSON.parse(localStorage.getItem('ropeartlab_orders') || '[]');
        const order = orders.find(o => o.id === orderId);
        
        if (order) {
            const items = order.items.map(item => 
                `${item.name} - Qtd: ${item.quantity} - R$ ${(item.price * item.quantity).toFixed(2)}`
            ).join('\n');
            
            alert(`Pedido #${order.orderNumber}\nCliente: ${order.userName}\nData: ${new Date(order.date).toLocaleDateString('pt-BR')}\nTotal: R$ ${order.total.toFixed(2)}\n\nItens:\n${items}`);
        }
    }
    
    updateOrderStatus(orderId) {
        const orders = JSON.parse(localStorage.getItem('ropeartlab_orders') || '[]');
        const order = orders.find(o => o.id === orderId);
        
        if (order) {
            const newStatus = prompt('Novo status do pedido:', order.status || 'pending');
            if (newStatus && ['pending', 'processing', 'completed', 'cancelled'].includes(newStatus)) {
                order.status = newStatus;
                localStorage.setItem('ropeartlab_orders', JSON.stringify(orders));
                this.loadOrders();
                this.showNotification('Status do pedido atualizado!', 'success');
            }
        }
    }
    
    // Imagens
    loadImages() {
        const container = document.getElementById('images-grid');
        if (container) {
            container.innerHTML = this.images.map(image => `
                <div class="image-card">
                    <img src="${image.url}" alt="${image.name}" class="image-preview">
                    <div class="image-info">
                        <div class="image-name">${image.name}</div>
                        <div class="image-description">${image.description || 'Sem descrição'}</div>
                    </div>
                </div>
            `).join('');
        }
    }
    
    openImageUploadModal() {
        document.getElementById('image-upload-modal').classList.add('open');
    }
    
    closeImageUploadModal() {
        document.getElementById('image-upload-modal').classList.remove('open');
    }
    
    uploadImage(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const fileInput = document.getElementById('image-file');
        const file = fileInput.files[0];
        
        if (file) {
            // Simular upload (em produção, enviaria para servidor)
            const reader = new FileReader();
            reader.onload = (e) => {
                const image = {
                    id: Date.now(),
                    name: formData.get('image-name'),
                    description: formData.get('image-description'),
                    url: e.target.result,
                    uploadedAt: new Date().toISOString()
                };
                
                this.images.push(image);
                this.saveImages();
                this.loadImages();
                this.closeImageUploadModal();
                this.showNotification('Imagem enviada com sucesso!', 'success');
            };
            reader.readAsDataURL(file);
        }
    }
    
    // Conteúdo do Site
    saveContent() {
        const content = {
            heroTitle: document.getElementById('hero-title').value,
            heroSubtitle: document.getElementById('hero-subtitle').value,
            aboutTitle: document.getElementById('about-title').value,
            aboutContent: document.getElementById('about-content').value,
            footerText: document.getElementById('footer-text').value
        };
        
        localStorage.setItem('ropeartlab_site_content', JSON.stringify(content));
        this.showNotification('Conteúdo salvo com sucesso!', 'success');
    }
    
    // Configurações de Contato
    saveContactSettings() {
        const settings = {
            whatsapp: document.getElementById('whatsapp-number').value,
            email: document.getElementById('email-contact').value,
            phone: document.getElementById('phone-contact').value,
            address: document.getElementById('address-contact').value
        };
        
        localStorage.setItem('ropeartlab_contact_settings', JSON.stringify(settings));
        this.showNotification('Configurações de contato salvas!', 'success');
    }
    
    // Configurações Gerais
    saveSettings() {
        const settings = {
            siteTitle: document.getElementById('site-title').value,
            siteDescription: document.getElementById('site-description').value,
            adminPassword: document.getElementById('admin-password').value
        };
        
        localStorage.setItem('ropeartlab_site_settings', JSON.stringify(settings));
        this.showNotification('Configurações salvas com sucesso!', 'success');
    }
    
    // Utilitários
    loadUsers() {
        return JSON.parse(localStorage.getItem('ropeartlab_users') || '[]');
    }
    
    loadProducts() {
        console.log('Carregando produtos...');
        
        let products = JSON.parse(localStorage.getItem('ropeartlab_products') || '[]');
        console.log('Produtos encontrados no localStorage:', products.length);
        
        if (products.length === 0) {
            console.log('Nenhum produto encontrado, importando produtos do site...');
            // Importar produtos do site principal
            const siteProducts = this.importProductsFromSite();
            localStorage.setItem('ropeartlab_products', JSON.stringify(siteProducts));
            products = siteProducts;
        }
        
        // Filtrar apenas produtos ativos e não deletados
        products = products.filter(product => product.active !== false && !product.deletedAt);
        console.log('Produtos ativos após filtro:', products.length);
        
        // Atualizar a propriedade products do adminSystem
        this.products = products;
        
        
        // Exibir produtos na interface
        this.displayProducts(products);
        
        return products;
    }
    
    importProductsFromSite() {
        // Produtos do site principal com estrutura completa
        const siteProducts = [
                {
                    id: 1,
                name: 'Corda Amarela e Laranja',
                description: 'Uma combinação vibrante de amarelo e laranja que traz energia e alegria. Perfeita para atividades ao ar livre e decoração moderna.',
                image: '../../images/amarelo e laranja.jpg',
                images: ['../../images/amarelo e laranja.jpg'],
                category: 'Moderna',
                    stock: 10,
                    active: true,
                featured: true,
                    discount: false,
                    discountPercentage: 0,
                sizes: [
                    { size: 'até 50cm', price: 130.00 },
                    { size: '60cm', price: 140.00 },
                    { size: '90cm', price: 150.00 },
                    { size: 'Personalizado', price: 'Entre em contato direto com o vendedor.' }
                ],
                    createdAt: new Date().toISOString()
                },
                {
                    id: 2,
                name: 'Corda Azul Bebê e Chumbo',
                description: 'Elegante mistura de azul suave e chumbo, criando um contraste sofisticado. Ideal para ambientes contemporâneos e minimalistas.',
                    image: '../../images/azul bebe e chumbo.jpg',
                    images: ['../../images/azul bebe e chumbo.jpg'],
                category: 'Elegância',
                    stock: 8,
                    active: true,
                    featured: true,
                    discount: false,
                    discountPercentage: 0,
                sizes: [
                    { size: 'até 50cm', price: 130.00 },
                    { size: '60cm', price: 140.00 },
                    { size: '90cm', price: 150.00 },
                    { size: 'Personalizado', price: 'Entre em contato direto com o vendedor.' }
                ],
                    createdAt: new Date().toISOString()
                },
            {
                id: 3,
                name: 'Corda Marinho e Vermelho',
                description: 'Combinação clássica e atemporal de azul marinho com vermelho vibrante. Uma peça que nunca sai de moda.',
                image: '../../images/marinho e vermelho.jpg',
                images: ['../../images/marinho e vermelho.jpg'],
                category: 'Clássico',
                stock: 7,
                active: true,
                featured: false,
                discount: false,
                discountPercentage: 0,
                sizes: [
                    { size: 'até 50cm', price: 130.00 },
                    { size: '60cm', price: 140.00 },
                    { size: '90cm', price: 150.00 },
                    { size: 'Personalizado', price: 'Entre em contato direto com o vendedor.' }
                ],
                createdAt: new Date().toISOString()
            },
            {
                id: 4,
                name: 'Corda Militar e Marrom',
                description: 'Tons terrosos que remetem à natureza e aventura. Perfeita para quem busca um estilo rústico e autêntico.',
                image: '../../images/militar e marrom.jpg',
                images: ['../../images/militar e marrom.jpg'],
                category: 'Rústico',
                stock: 5,
                active: true,
                featured: false,
                discount: false,
                discountPercentage: 0,
                sizes: [
                    { size: 'até 50cm', price: 130.00 },
                    { size: '60cm', price: 140.00 },
                    { size: '90cm', price: 150.00 },
                    { size: 'Personalizado', price: 'Entre em contato direto com o vendedor.' }
                ],
                createdAt: new Date().toISOString()
            },
            {
                id: 5,
                name: 'Corda Rosa Bebê e Verde Bebê',
                description: 'Delicada combinação de rosa e verde pastel, criando um ambiente suave e acolhedor. Ideal para quartos e espaços relaxantes.',
                image: '../../images/rosa bebe e verde bebe.jpg',
                images: ['../../images/rosa bebe e verde bebe.jpg'],
                category: 'Delicado',
                stock: 8,
                active: true,
                featured: false,
                discount: false,
                discountPercentage: 0,
                sizes: [
                    { size: 'até 50cm', price: 130.00 },
                    { size: '60cm', price: 140.00 },
                    { size: '90cm', price: 150.00 },
                    { size: 'Personalizado', price: 'Entre em contato direto com o vendedor.' }
                ],
                createdAt: new Date().toISOString()
            },
            {
                id: 6,
                name: 'Corda Rosa Pink e Lilás',
                description: 'Gradiente romântico de rosa pink para lilás, perfeito para criar um ambiente feminino e elegante.',
                image: '../../images/rosa pink e lilas.jpg',
                images: ['../../images/rosa pink e lilas.jpg'],
                category: 'Romântico',
                stock: 6,
                active: true,
                featured: true,
                discount: false,
                discountPercentage: 0,
                sizes: [
                    { size: 'até 50cm', price: 130.00 },
                    { size: '60cm', price: 140.00 },
                    { size: '90cm', price: 150.00 },
                    { size: 'Personalizado', price: 'Entre em contato direto com o vendedor.' }
                ],
                createdAt: new Date().toISOString()
            },
            {
                id: 7,
                name: 'Corda Roxo e Laranja',
                description: 'Combinação vibrante e moderna de roxo profundo com laranja energético. Uma peça que chama atenção e adiciona personalidade ao ambiente.',
                image: '../../images/roxo e laranja .jpg',
                images: ['../../images/roxo e laranja .jpg'],
                category: 'Moderno',
                stock: 9,
                active: true,
                featured: true,
                discount: false,
                discountPercentage: 0,
                sizes: [
                    { size: 'até 50cm', price: 130.00 },
                    { size: '60cm', price: 140.00 },
                    { size: '90cm', price: 150.00 },
                    { size: 'Personalizado', price: 'Entre em contato direto com o vendedor.' }
                ],
                createdAt: new Date().toISOString()
            },
            {
                id: 8,
                name: 'Corda Verde e Cinza',
                description: 'Harmonia perfeita entre verde natural e cinza neutro. Uma escolha versátil que combina com qualquer decoração.',
                image: '../../images/verde e cinza.jpg',
                images: ['../../images/verde e cinza.jpg'],
                category: 'Versátil',
                stock: 12,
                active: true,
                featured: false,
                discount: false,
                discountPercentage: 0,
                sizes: [
                    { size: 'até 50cm', price: 130.00 },
                    { size: '60cm', price: 140.00 },
                    { size: '90cm', price: 150.00 },
                    { size: 'Personalizado', price: 'Entre em contato direto com o vendedor.' }
                ],
                createdAt: new Date().toISOString()
            }
            ];
        
        return siteProducts;
    }
    
    displayProducts(products) {
        const productsGrid = document.getElementById('products-grid');
        if (!productsGrid) {
            console.log('Grid de produtos não encontrado');
            return;
        }
        
        if (products.length === 0) {
            productsGrid.innerHTML = `
                <div class="no-products">
                    <i class="fas fa-box-open"></i>
                    <h3>Nenhum produto encontrado</h3>
                    <p>Clique em "Novo Produto" para adicionar seu primeiro produto.</p>
                </div>
            `;
            return;
        }
        
        productsGrid.innerHTML = products.map(product => `
            <div class="product-card-admin" data-product-id="${product.id}">
                <div class="product-image-container">
                    <img src="${product.images && product.images[0] ? product.images[0] : product.image}" alt="${product.name}" class="product-image" onerror="this.src='../../images/logo.jpg'">
                    <div class="product-status ${product.active ? 'active' : 'inactive'}">
                        ${product.active ? 'Ativo' : 'Inativo'}
                    </div>
                </div>
                <div class="product-info">
                    <h3 class="product-name">${product.name}</h3>
                    <p class="product-description">${product.description}</p>
                    <div class="product-details">
                        <span class="product-category">${product.category}</span>
                        <span class="product-stock">Estoque: ${product.stock || 0}</span>
                    </div>
                    <div class="product-sizes">
                        <strong>Tamanhos:</strong>
                        ${product.sizes ? product.sizes.map(size => 
                            `<span class="size-tag">${size.size}</span>`
                        ).join('') : 'N/A'}
                    </div>
                    <div class="product-actions">
                        <button class="btn-edit" onclick="editProduct('${product.id}')">
                            <i class="fas fa-edit"></i>
                            Editar
                        </button>
                        <button class="btn-toggle" onclick="toggleProductStatus('${product.id}')" 
                                style="background: ${product.active ? '#ff4757' : '#2ed573'}; color: white; border: none; padding: 8px 12px; border-radius: 5px; cursor: pointer; font-size: 0.9rem; display: flex; align-items: center; gap: 5px;">
                            <i class="fas fa-${product.active ? 'eye-slash' : 'eye'}"></i>
                            ${product.active ? 'Desativar' : 'Ativar'}
                        </button>
                        <button class="btn-delete" onclick="deleteProduct('${product.id}')">
                            <i class="fas fa-trash"></i>
                            Excluir
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    saveProducts() {
        localStorage.setItem('ropeartlab_products', JSON.stringify(this.products));
        
        // Marcar que os produtos foram atualizados
        localStorage.setItem('products_updated', Date.now().toString());
        
        // Enviar mensagem via BroadcastChannel para sincronização em tempo real
        if (window.productsChannel) {
            window.productsChannel.postMessage({
                type: 'products_updated',
                products: this.products,
                timestamp: Date.now()
            });
        }
        
        // Disparar evento personalizado no localStorage (fallback)
        window.dispatchEvent(new StorageEvent('storage', {
            key: 'ropeartlab_products',
            newValue: JSON.stringify(this.products),
            url: window.location.href
        }));
        
        // Método adicional: postMessage para outras abas
        try {
            // Enviar mensagem para todas as abas
            window.postMessage({
                type: 'ropeartlab_products_updated',
                products: this.products,
                timestamp: Date.now()
            }, '*');
        } catch (error) {
            console.warn('Erro ao enviar postMessage:', error);
        }
    }
    
    // Função para sincronizar produto específico
    syncSpecificProduct(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) {
            console.error('Produto não encontrado para sincronização:', productId);
            return;
        }
        
        console.log('Sincronizando produto específico:', product);
        
        // Marcar timestamp da última atualização do produto
        localStorage.setItem(`product_${productId}_updated`, Date.now().toString());
        
        // Enviar mensagem via BroadcastChannel para produto específico
        if (window.productsChannel) {
            window.productsChannel.postMessage({
                type: 'product_updated',
                productId: productId,
                product: product,
                timestamp: Date.now()
            });
        }
        
        // Disparar evento personalizado para produto específico
        window.dispatchEvent(new StorageEvent('storage', {
            key: `product_${productId}_updated`,
            newValue: Date.now().toString(),
            url: window.location.href
        }));
        
        // Enviar mensagem via postMessage para produto específico
        try {
            window.postMessage({
                type: 'ropeartlab_product_updated',
                productId: productId,
                product: product,
                timestamp: Date.now()
            }, '*');
        } catch (error) {
            console.warn('Erro ao enviar postMessage para produto específico:', error);
        }
        
        console.log(`Produto ${productId} sincronizado com sucesso`);
    }
    
    loadSiteContent() {
        return JSON.parse(localStorage.getItem('ropeartlab_site_content') || '{}');
    }
    
    loadContactSettings() {
        return JSON.parse(localStorage.getItem('ropeartlab_contact_settings') || '{}');
    }
    
    loadSiteSettings() {
        return JSON.parse(localStorage.getItem('ropeartlab_site_settings') || '{}');
    }
    
    loadImages() {
        return JSON.parse(localStorage.getItem('ropeartlab_images') || '[]');
    }
    
    saveImages() {
        localStorage.setItem('ropeartlab_images', JSON.stringify(this.images));
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
            <span>${message}</span>
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#2196f3'};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 3000;
            display: flex;
            align-items: center;
            gap: 10px;
            font-weight: 500;
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 4000);
    }
}

// Funções globais para os botões
window.openProductModal = function(productId = null) {
    adminSystem.openProductModal(productId);
};

window.closeProductModal = function() {
    adminSystem.closeProductModal();
};

window.saveProduct = function(event) {
    adminSystem.saveProduct(event);
};

// Função para alternar checkbox e atualizar visual
window.toggleCheckbox = function(checkboxId) {
    const checkbox = document.getElementById(checkboxId);
    const button = checkbox.closest('.checkbox-button');
    
    // Alternar estado do checkbox
    checkbox.checked = !checkbox.checked;
    
    // Atualizar visual do botão
    updateCheckboxButtonState(checkboxId, checkbox.checked);
    
    // Se for o checkbox de desconto, chamar a função existente
    if (checkboxId === 'product-discount-enabled') {
        toggleDiscountFields();
    }
};

// Função para atualizar estado visual do botão de checkbox
function updateCheckboxButtonState(checkboxId, isChecked) {
    const checkbox = document.getElementById(checkboxId);
    const button = checkbox.closest('.checkbox-button');
    
    if (isChecked) {
        button.classList.add('active');
    } else {
        button.classList.remove('active');
    }
}

window.openImageUploadModal = function() {
    adminSystem.openImageUploadModal();
};

window.closeImageUploadModal = function() {
    adminSystem.closeImageUploadModal();
};

window.uploadImage = function(event) {
    adminSystem.uploadImage(event);
};

window.saveContent = function() {
    adminSystem.saveContent();
};

window.saveContactSettings = function() {
    adminSystem.saveContactSettings();
};

window.saveSettings = function() {
    adminSystem.saveSettings();
};

// Funções para upload de imagem de produto
window.previewProductImage = function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.getElementById('product-image-preview');
            const previewImg = document.getElementById('product-image-preview-img');
            const placeholder = document.getElementById('image-upload-placeholder');
            
            previewImg.src = e.target.result;
            preview.style.display = 'block';
            placeholder.style.display = 'none';
        };
        reader.readAsDataURL(file);
    }
};

window.removeProductImage = function() {
    const preview = document.getElementById('product-image-preview');
    const placeholder = document.getElementById('image-upload-placeholder');
    const fileInput = document.getElementById('product-image-file');
    
    preview.style.display = 'none';
    placeholder.style.display = 'flex';
    fileInput.value = '';
};

// Funções para preview do site
window.refreshSitePreview = function() {
    const iframe = document.getElementById('site-preview-frame');
    iframe.src = iframe.src;
};

window.openSiteInNewTab = function() {
    window.open('index.html', '_blank');
};

window.saveSiteContent = function() {
    const content = {
        heroTitle: document.getElementById('preview-hero-title').value,
        heroSubtitle: document.getElementById('preview-hero-subtitle').value,
        aboutTitle: document.getElementById('preview-about-title').value,
        aboutContent: document.getElementById('preview-about-content').value,
        footerText: document.getElementById('preview-footer-text').value
    };
    
    localStorage.setItem('ropeartlab_site_content', JSON.stringify(content));
    adminSystem.showNotification('Conteúdo do site salvo com sucesso!', 'success');
    
    // Atualizar preview
    setTimeout(() => {
        refreshSitePreview();
    }, 500);
};

// Funções globais para edição inline
window.addNewProductCard = function() {
    adminSystem.addNewProductCard();
};

window.saveAllProducts = function() {
    adminSystem.saveAllProducts();
};

// Adicionar métodos à classe AdminSystem
AdminSystem.prototype.editProductInline = function(productId) {
    const card = document.querySelector(`[data-product-id="${productId}"]`);
    if (card) {
        card.classList.add('editing');
    }
};

AdminSystem.prototype.cancelEditProduct = function(productId) {
    const card = document.querySelector(`[data-product-id="${productId}"]`);
    if (card) {
        card.classList.remove('editing');
        // Recarregar o produto para restaurar valores originais
        this.loadProducts();
    }
};

AdminSystem.prototype.saveProductInline = function(productId) {
    const card = document.querySelector(`[data-product-id="${productId}"]`);
    if (!card) return;
    
    // Coletar dados do formulário
    const productData = {
        name: card.querySelector('.product-name-input').value,
        price: parseFloat(card.querySelector('.product-price-input').value),
        description: card.querySelector('.product-description-input').value,
        category: card.querySelector('.product-category-input').value,
        stock: parseInt(card.querySelector('.product-stock-input').value),
        active: card.querySelector('.product-active-input').checked,
        featured: card.querySelector('.product-featured-input').checked,
        discount: card.querySelector('.product-discount-input').checked,
        discountPercentage: parseInt(card.querySelector('.product-discount-percentage-input').value) || 0,
        sizes: []
    };
    
    // Coletar tamanhos
    if (card.querySelector('.size-small-input').checked) productData.sizes.push('pequeno');
    if (card.querySelector('.size-medium-input').checked) productData.sizes.push('medio');
    if (card.querySelector('.size-large-input').checked) productData.sizes.push('grande');
    if (card.querySelector('.size-custom-input').checked) productData.sizes.push('personalizado');
    
    // Validar dados
    if (!productData.name || productData.price <= 0) {
        this.showNotification('Nome e preço são obrigatórios!', 'error');
        return;
    }
    
    // Encontrar produto existente
    const productIndex = this.products.findIndex(p => p.id === productId);
    if (productIndex !== -1) {
        // Manter dados existentes que não foram editados
        const existingProduct = this.products[productIndex];
        productData.id = existingProduct.id;
        productData.image = existingProduct.image; // Manter imagem existente
        productData.createdAt = existingProduct.createdAt;
        
        // Atualizar produto
        this.products[productIndex] = productData;
        this.saveProducts();
        
        // Sair do modo de edição
        card.classList.remove('editing');
        
        this.showNotification('Produto atualizado com sucesso!', 'success');
    }
};

AdminSystem.prototype.addNewProductCard = function() {
    const container = document.getElementById('products-grid');
    if (!container) return;
    
    // Gerar novo ID
    const newId = Math.max(...this.products.map(p => p.id), 0) + 1;
    
    // Criar produto vazio
    const newProduct = {
        id: newId,
        name: 'Novo Produto',
        price: 0,
        description: '',
        image: '',
        category: 'outros',
        stock: 0,
        active: true,
        featured: false,
        discount: false,
        discountPercentage: 0,
        sizes: [],
        createdAt: new Date().toISOString()
    };
    
    // Adicionar ao array
    this.products.push(newProduct);
    
    // Criar card HTML para novo produto
    const newCardHtml = `
        <div class="product-card new-product" data-product-id="${newId}">
            <div class="product-image">
                <i class="fas fa-plus"></i>
            </div>
            <div class="product-info">
                <!-- Modo Visualização (oculto para novo produto) -->
                <div class="product-display">
                    <h3 class="product-name">Novo Produto</h3>
                    <div class="product-price">R$ 0,00</div>
                    <p class="product-description">Sem descrição</p>
                    <div class="product-sizes">
                        <strong>Tamanhos:</strong> Não especificado
                    </div>
                    <div class="product-status">
                        <span class="status-badge status-completed">Ativo</span>
                    </div>
                    <div class="product-actions">
                        <button class="btn-edit" onclick="adminSystem.editProductInline(${newId})">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                        <button class="btn-delete" onclick="adminSystem.deleteProduct(${newId})">
                            <i class="fas fa-trash"></i> Excluir
                        </button>
                    </div>
                </div>
                
                <!-- Modo Edição (visível para novo produto) -->
                <div class="product-edit-form">
                    <div class="inline-form-group">
                        <label>Nome do Produto</label>
                        <input type="text" class="product-name-input" value="Novo Produto" placeholder="Digite o nome do produto">
                    </div>
                    
                    <div class="inline-form-group">
                        <label>Preço</label>
                        <input type="number" class="product-price-input" value="0" step="0.01" placeholder="0.00">
                    </div>
                    
                    <div class="inline-form-group">
                        <label>Descrição</label>
                        <textarea class="product-description-input" rows="2" placeholder="Digite a descrição do produto"></textarea>
                    </div>
                    
                    <div class="inline-form-group">
                        <label>Categoria</label>
                        <select class="product-category-input">
                            <option value="brinquedos">Brinquedos</option>
                            <option value="acessorios" selected>Acessórios</option>
                            <option value="roupas">Roupas</option>
                            <option value="outros">Outros</option>
                        </select>
                    </div>
                    
                    <div class="inline-form-group">
                        <label>Estoque</label>
                        <input type="number" class="product-stock-input" value="0" min="0">
                    </div>
                    
                    <div class="inline-checkbox-group">
                        <div class="inline-checkbox">
                            <input type="checkbox" class="product-active-input" checked>
                            <span>Ativo</span>
                        </div>
                        <div class="inline-checkbox">
                            <input type="checkbox" class="product-featured-input">
                            <span>Destaque</span>
                        </div>
                        <div class="inline-checkbox">
                            <input type="checkbox" class="product-discount-input">
                            <span>Desconto</span>
                        </div>
                    </div>
                    
                    <div class="inline-form-group">
                        <label>% Desconto</label>
                        <input type="number" class="product-discount-percentage-input" value="0" min="0" max="99">
                    </div>
                    
                    <div class="inline-checkbox-group">
                        <div class="inline-checkbox">
                            <input type="checkbox" class="size-small-input">
                            <span>Pequeno</span>
                        </div>
                        <div class="inline-checkbox">
                            <input type="checkbox" class="size-medium-input">
                            <span>Médio</span>
                        </div>
                        <div class="inline-checkbox">
                            <input type="checkbox" class="size-large-input">
                            <span>Grande</span>
                        </div>
                        <div class="inline-checkbox">
                            <input type="checkbox" class="size-custom-input">
                            <span>Personalizado</span>
                        </div>
                    </div>
                    
                    <div class="product-form-actions">
                        <button class="btn-save" onclick="adminSystem.saveProductInline(${newId})">
                            <i class="fas fa-save"></i> Salvar
                        </button>
                        <button class="btn-cancel" onclick="adminSystem.cancelNewProduct(${newId})">
                            <i class="fas fa-times"></i> Cancelar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Adicionar ao container
    container.insertAdjacentHTML('beforeend', newCardHtml);
    
    this.showNotification('Novo produto adicionado! Preencha os dados e clique em Salvar.', 'info');
};

AdminSystem.prototype.cancelNewProduct = function(productId) {
    // Remover do array
    this.products = this.products.filter(p => p.id !== productId);
    
    // Remover card do DOM
    const card = document.querySelector(`[data-product-id="${productId}"]`);
    if (card) {
        card.remove();
    }
    
    this.showNotification('Novo produto cancelado.', 'info');
};

AdminSystem.prototype.saveAllProducts = function() {
    this.saveProducts();
    this.showNotification('Todos os produtos foram salvos!', 'success');
};

// Funções de Análise
AdminSystem.prototype.loadAnalytics = function() {
    console.log('Carregando análises...');
    this.updateAnalytics();
};

AdminSystem.prototype.updateAnalytics = function() {
    console.log('📊 Executando updateAnalytics...');
    
    const period = document.getElementById('analytics-period')?.value || '30';
    const orders = JSON.parse(localStorage.getItem('ropeartlab_orders') || '[]');
    
    console.log('📋 Pedidos carregados:', orders.length);
    
    // Verificar se orders é um array válido
    if (!Array.isArray(orders)) {
        console.error('❌ Orders não é um array:', orders);
        this.showNotification('❌ Erro ao carregar pedidos para análise', 'error');
        return;
    }
    
    // Filtrar pedidos por período
    const filteredOrders = this.filterOrdersByPeriod(orders, period);
    
    // Calcular estatísticas
    const stats = this.calculateSalesStats(filteredOrders);
    
    // Atualizar estatísticas na tela
    this.updateStatsDisplay(stats);
    
    // Atualizar análise financeira também
    this.updateFinancialAnalytics();
    
    console.log('✅ Análises atualizadas com sucesso');
};

AdminSystem.prototype.filterOrdersByPeriod = function(orders, period) {
    if (!Array.isArray(orders)) {
        console.log('⚠️ Orders não é array na filterOrdersByPeriod');
        return [];
    }
    
    if (period === 'all') return orders;
    
    const days = parseInt(period);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return orders.filter(order => {
        if (!order.date) return false;
        const orderDate = new Date(order.date);
        return orderDate >= cutoffDate;
    });
};

AdminSystem.prototype.calculateSalesStats = function(orders) {
    if (!Array.isArray(orders)) {
        console.log('⚠️ Orders não é array na calculateSalesStats');
        return {
            totalSales: 0,
            totalOrders: 0,
            avgOrderValue: 0,
            topProduct: 'Nenhum produto vendido'
        };
    }
    
    // Filtrar apenas pedidos finalizados para análise
    const finalizedOrders = orders.filter(order => order.status === 'finalized');
    
    const totalSales = finalizedOrders.reduce((sum, order) => sum + parseFloat(order.total || 0), 0);
    const totalOrders = finalizedOrders.length;
    const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
    
    // Encontrar produto mais vendido apenas nos pedidos finalizados
    const productSales = {};
    finalizedOrders.forEach(order => {
        if (order.items && Array.isArray(order.items)) {
            order.items.forEach(item => {
                if (!productSales[item.name]) {
                    productSales[item.name] = 0;
                }
                productSales[item.name] += parseInt(item.quantity || 0);
            });
        }
    });
    
    const topProduct = Object.keys(productSales).length > 0 
        ? Object.keys(productSales).reduce((a, b) => productSales[a] > productSales[b] ? a : b)
        : 'Nenhum produto vendido';
    
    return {
        totalSales,
        totalOrders,
        avgOrderValue,
        topProduct,
        productSales
    };
};

AdminSystem.prototype.updateStatsDisplay = function(stats) {
    document.getElementById('total-sales').textContent = `R$ ${stats.totalSales.toFixed(2)}`;
    document.getElementById('total-orders').textContent = stats.totalOrders;
    document.getElementById('avg-order-value').textContent = `R$ ${stats.avgOrderValue.toFixed(2)}`;
    document.getElementById('top-product').textContent = stats.topProduct;
};

AdminSystem.prototype.createSalesChart = function(orders) {
    const ctx = document.getElementById('salesChart');
    if (!ctx) return;
    
    // Destruir gráfico existente
    if (this.salesChart) {
        this.salesChart.destroy();
    }
    
    // Calcular vendas por produto
    const productSales = {};
    orders.forEach(order => {
        order.items.forEach(item => {
            if (!productSales[item.name]) {
                productSales[item.name] = 0;
            }
            productSales[item.name] += item.quantity;
        });
    });
    
    // Preparar dados para o gráfico
    const labels = Object.keys(productSales);
    const data = Object.values(productSales);
    
    this.salesChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Quantidade Vendida',
                data: data,
                backgroundColor: [
                    '#8B4513',
                    '#CD853F',
                    '#DEB887',
                    '#F4A460',
                    '#D2691E',
                    '#A0522D',
                    '#8B7355',
                    '#6B4423'
                ],
                borderColor: '#8B4513',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
};

AdminSystem.prototype.updateProductSalesList = function(orders) {
    const container = document.getElementById('product-sales-list');
    if (!container) return;
    
    // Calcular vendas por produto
    const productSales = {};
    orders.forEach(order => {
        order.items.forEach(item => {
            if (!productSales[item.name]) {
                productSales[item.name] = {
                    quantity: 0,
                    revenue: 0
                };
            }
            productSales[item.name].quantity += item.quantity;
            productSales[item.name].revenue += item.price * item.quantity;
        });
    });
    
    // Ordenar por quantidade vendida
    const sortedProducts = Object.entries(productSales)
        .sort(([,a], [,b]) => b.quantity - a.quantity);
    
    container.innerHTML = sortedProducts.map(([name, stats]) => `
        <div class="product-sales-item">
            <div class="product-sales-name">${name}</div>
            <div class="product-sales-stats">
                <span class="product-sales-quantity">${stats.quantity} vendidos</span>
                <span class="product-sales-revenue">R$ ${stats.revenue.toFixed(2)}</span>
            </div>
        </div>
    `).join('');
};

AdminSystem.prototype.refreshAnalytics = function() {
    this.updateAnalytics();
    this.showNotification('Análises atualizadas!', 'success');
};

// Função global para logout do admin
window.logoutAdmin = function() {
    if (confirm('Tem certeza que deseja sair do painel administrativo?')) {
        localStorage.removeItem('admin_logged_in');
        window.location.href = 'index.html';
    }
}

// Função para atualizar preço principal baseado no menor tamanho
function updateMainPriceFromSizes() {
    const priceInputs = document.querySelectorAll('.price-input');
    const mainPriceInput = document.getElementById('product-price');
    
    if (!mainPriceInput) return;
    
    let smallestPrice = null;
    
    // Encontrar o menor preço numérico
    priceInputs.forEach((priceInput) => {
        const price = parseFloat(priceInput.value);
        if (!isNaN(price) && (smallestPrice === null || price < smallestPrice)) {
            smallestPrice = price;
        }
    });
    
    // Atualizar preço principal se encontrou um preço válido
    if (smallestPrice !== null) {
        mainPriceInput.value = smallestPrice.toFixed(2);
        // Recalcular desconto se estiver ativo
        calculateDiscount();
    }
}

// Funções para gerenciar tamanhos e preços
window.addSizeItem = function() {
    const container = document.getElementById('sizes-prices-container');
    const newItem = document.createElement('div');
    newItem.className = 'size-price-item';
    newItem.innerHTML = `
        <div class="size-input-group">
            <label>Tamanho:</label>
            <input type="text" class="size-input" placeholder="Ex: 120cm">
        </div>
        <div class="price-input-group">
            <label>Preço:</label>
            <input type="number" class="price-input" placeholder="0.00" step="0.01" onchange="updateMainPriceFromSizes()">
        </div>
        <button type="button" class="remove-size-btn" onclick="removeSizeItem(this)">
            <i class="fas fa-trash"></i>
        </button>
    `;
    container.appendChild(newItem);
};

window.removeSizeItem = function(button) {
    const container = document.getElementById('sizes-prices-container');
    if (container.children.length > 1) {
        button.parentElement.remove();
        updateMainPriceFromSizes(); // Atualizar preço principal após remoção
    } else {
        alert('É necessário ter pelo menos um tamanho.');
    }
};

window.getSizesFromForm = function() {
    const container = document.getElementById('sizes-prices-container');
    const sizes = [];
    
    console.log('Coletando tamanhos do formulário...');
    console.log('Container encontrado:', container);
    console.log('Itens encontrados:', container.querySelectorAll('.size-price-item').length);
    
    container.querySelectorAll('.size-price-item').forEach((item, index) => {
        const sizeInput = item.querySelector('.size-input');
        const priceInput = item.querySelector('.price-input');
        
        console.log(`Item ${index + 1}:`, {
            size: sizeInput ? sizeInput.value : 'N/A',
            price: priceInput ? priceInput.value : 'N/A'
        });
        
        if (sizeInput && priceInput && sizeInput.value.trim() && priceInput.value.trim()) {
            const price = isNaN(priceInput.value) ? priceInput.value : parseFloat(priceInput.value);
            sizes.push({
                size: sizeInput.value.trim(),
                price: price
            });
        }
    });
    
    console.log('Tamanhos coletados:', sizes);
    return sizes;
};

window.setSizesToForm = function(sizes) {
    const container = document.getElementById('sizes-prices-container');
    container.innerHTML = '';
    
    if (sizes && sizes.length > 0) {
        sizes.forEach(sizeData => {
            const newItem = document.createElement('div');
            newItem.className = 'size-price-item';
            newItem.innerHTML = `
                <div class="size-input-group">
                    <label>Tamanho:</label>
                    <input type="text" class="size-input" value="${sizeData.size}">
                </div>
                <div class="price-input-group">
                    <label>Preço:</label>
                    <input type="${typeof sizeData.price === 'number' ? 'number' : 'text'}" 
                        class="price-input" 
                        value="${sizeData.price}" 
                        ${typeof sizeData.price === 'number' ? 'step="0.01"' : ''}
                        onchange="updateMainPriceFromSizes()">
                </div>
                <button type="button" class="remove-size-btn" onclick="removeSizeItem(this)">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            container.appendChild(newItem);
        });
    } else {
        // Adicionar um item padrão se não houver tamanhos
        window.addSizeItem();
    }
    
    // Atualizar preço principal após carregar tamanhos
    updateMainPriceFromSizes();
};

// Funções para gerenciar desconto
function toggleDiscountFields() {
    const discountCheckbox = document.getElementById('product-discount-enabled');
    const discountSection = document.getElementById('discount-section');
    const discountButton = discountCheckbox.closest('.checkbox-button');
    const discountPercentageInput = document.getElementById('product-discount-percentage');
    
    if (discountCheckbox.checked) {
        discountSection.style.display = 'block';
        discountSection.classList.add('active');
        discountButton.classList.add('active');
        // Quando desconto está ativo, permitir valor 0 para remover desconto
        discountPercentageInput.setAttribute('min', '0');
        calculateDiscount();
    } else {
        discountSection.style.display = 'none';
        discountSection.classList.remove('active');
        discountButton.classList.remove('active');
        // Quando desconto está inativo, definir valor como 0
        discountPercentageInput.setAttribute('min', '0');
        discountPercentageInput.value = '0';
    }
}

function calculateDiscount() {
    const mainPriceInput = document.getElementById('product-price');
    const discountPercentageInput = document.getElementById('product-discount-percentage');
    const originalPriceDisplay = document.getElementById('original-price-display');
    const discountedPriceDisplay = document.getElementById('discounted-price-display');
    const savingsDisplay = document.getElementById('savings-display');
    
    if (!mainPriceInput || !discountPercentageInput) return;
    
    const originalPrice = parseFloat(mainPriceInput.value) || 0;
    const discountPercentage = parseFloat(discountPercentageInput.value) || 0;
    
    if (originalPrice > 0 && discountPercentage > 0) {
        const discountAmount = (originalPrice * discountPercentage) / 100;
        const discountedPrice = originalPrice - discountAmount;
        
        originalPriceDisplay.textContent = `R$ ${originalPrice.toFixed(2).replace('.', ',')}`;
        discountedPriceDisplay.textContent = `R$ ${discountedPrice.toFixed(2).replace('.', ',')}`;
        savingsDisplay.textContent = `R$ ${discountAmount.toFixed(2).replace('.', ',')}`;
    } else {
        originalPriceDisplay.textContent = 'R$ 0,00';
        discountedPriceDisplay.textContent = 'R$ 0,00';
        savingsDisplay.textContent = 'R$ 0,00';
    }
}

// Funções para gerenciar imagens
let productImages = [];

function addProductImages(event) {
    const files = Array.from(event.target.files);
    files.forEach(file => {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                productImages.push(e.target.result);
                updateImagesGrid();
            };
            reader.readAsDataURL(file);
        }
    });
    event.target.value = '';
}

function removeProductImage(imageIndex) {
    productImages.splice(imageIndex, 1);
    updateImagesGrid();
}

function setPrimaryImage(imageIndex) {
    if (productImages.length > 0) {
        const primaryImage = productImages.splice(imageIndex, 1)[0];
        productImages.unshift(primaryImage);
        updateImagesGrid();
    }
}

function updateImagesGrid() {
    const grid = document.getElementById('product-images-grid');
    grid.innerHTML = '';
    
    productImages.forEach((imageSrc, index) => {
        const imageItem = document.createElement('div');
        imageItem.className = `image-item ${index === 0 ? 'primary' : ''}`;
        imageItem.innerHTML = `
            <img src="${imageSrc}" alt="Produto ${index + 1}">
            <button type="button" class="remove-image-btn" onclick="removeProductImage(${index})">
                <i class="fas fa-times"></i>
            </button>
            ${index !== 0 ? `
                <button type="button" class="set-primary-btn" onclick="setPrimaryImage(${index})">
                    Principal
                </button>
            ` : ''}
        `;
        grid.appendChild(imageItem);
    });
}

function loadProductImages(images) {
    productImages = Array.isArray(images) ? [...images] : (images ? [images] : []);
    updateImagesGrid();
}

// Funções para gerenciar produtos
window.editProduct = function(productId) {
    const products = JSON.parse(localStorage.getItem('ropeartlab_products') || '[]');
    const numericProductId = parseInt(productId);
    const product = products.find(p => p.id === numericProductId);
    
    if (!product) {
        alert('Produto não encontrado!');
        return;
    }
    
    // Preencher formulário com dados do produto
    document.getElementById('product-name').value = product.name;
    document.getElementById('product-description').value = product.description;
    document.getElementById('product-category').value = product.category;
    document.getElementById('product-category-tag').value = product.category;
    document.getElementById('product-stock').value = product.stock;
    document.getElementById('product-active').checked = product.active;
    document.getElementById('product-featured').checked = product.featured;
    // Verificar se tem desconto válido
    const hasValidDiscount = product.discount && product.discountPercentage > 0;
    document.getElementById('product-discount-enabled').checked = hasValidDiscount;
    document.getElementById('product-discount-percentage').value = product.discountPercentage || 0;
    
    // Atualizar estado visual dos botões de checkbox
    updateCheckboxButtonState('product-active', product.active);
    updateCheckboxButtonState('product-featured', product.featured);
    updateCheckboxButtonState('product-discount-enabled', hasValidDiscount);
    
    // Atualizar seção de desconto
    toggleDiscountFields();
    
    // Configurar tamanhos
    window.setSizesToForm(product.sizes);
    
    // Configurar imagens
    loadProductImages(product.images || product.image);
    
    // Atualizar título do modal
    document.getElementById('product-modal-title').textContent = 'Editar Produto';
    
    // Armazenar ID do produto sendo editado
    document.getElementById('product-form').dataset.editingId = productId;
    
    // Mostrar modal
    openProductModal();
}

window.toggleProductStatus = function(productId) {
    // Converter para número para garantir comparação correta
    const numericProductId = parseInt(productId);
    
    const products = JSON.parse(localStorage.getItem('ropeartlab_products') || '[]');
    const productIndex = products.findIndex(p => p.id === numericProductId);
    
    if (productIndex === -1) {
        console.error('Produto não encontrado!');
        alert('Produto não encontrado!');
        return;
    }
    
    const product = products[productIndex];
    
    // Alternar status
    products[productIndex].active = !products[productIndex].active;
    
    // Salvar no localStorage
    localStorage.setItem('ropeartlab_products', JSON.stringify(products));
    
    // Atualizar a propriedade products do adminSystem
    adminSystem.products = products;
    
    // Sincronizar produto específico
    adminSystem.syncSpecificProduct(numericProductId);
    
    // Recarregar produtos na interface
    adminSystem.loadProducts();
    
    const status = products[productIndex].active ? 'ativado' : 'desativado';
    const productName = products[productIndex].name;
    
    // Mostrar notificação
    adminSystem.showNotification(`Produto "${productName}" ${status} com sucesso!`, 'success');
}

window.deleteProduct = function(productId) {
    const products = JSON.parse(localStorage.getItem('ropeartlab_products') || '[]');
    const numericProductId = parseInt(productId);
    const product = products.find(p => p.id === numericProductId);
    
    if (!product) {
        alert('Produto não encontrado!');
        return;
    }
    
    const confirmMessage = `Tem certeza que deseja mover o produto "${product.name}" para a lixeira?\n\nO produto ficará na lixeira por 30 dias antes de ser excluído permanentemente.`;
    
    if (!confirm(confirmMessage)) {
        return;
    }
    
    // Mover para lixeira em vez de excluir
    moveToTrash(numericProductId);
    
    // Sincronizar produto específico (removido)
    adminSystem.syncSpecificProduct(numericProductId);
    
    // Recarregar produtos
    setTimeout(() => {
        adminSystem.loadProducts();
        adminSystem.displayProducts(adminSystem.products);
    }, 100);
    
    // Mostrar notificação
    adminSystem.showNotification(`Produto "${product.name}" movido para a lixeira!`, 'info');
}

// Sistema de lixeira
function moveToTrash(productId) {
    const products = JSON.parse(localStorage.getItem('ropeartlab_products') || '[]');
    const trash = JSON.parse(localStorage.getItem('ropeartlab_trash') || '[]');
    
    const productIndex = products.findIndex(p => p.id === productId);
    if (productIndex === -1) return;
    
    const product = products[productIndex];
    
    // Adicionar data de exclusão
    product.deletedAt = new Date().toISOString();
    product.deletedBy = 'admin';
    
    // Mover para lixeira
    trash.push(product);
    
    // Remover dos produtos ativos
    products.splice(productIndex, 1);
    
    // Salvar alterações
    localStorage.setItem('ropeartlab_products', JSON.stringify(products));
    localStorage.setItem('ropeartlab_trash', JSON.stringify(trash));
}

function restoreFromTrash(productId) {
    const products = JSON.parse(localStorage.getItem('ropeartlab_products') || '[]');
    const trash = JSON.parse(localStorage.getItem('ropeartlab_trash') || '[]');
    
    const productIndex = trash.findIndex(p => p.id === productId);
    if (productIndex === -1) return;
    
    const product = trash[productIndex];
    
    // Remover campos de exclusão
    delete product.deletedAt;
    delete product.deletedBy;
    
    // Restaurar produto
    products.push(product);
    
    // Remover da lixeira
    trash.splice(productIndex, 1);
    
    // Salvar alterações
    localStorage.setItem('ropeartlab_products', JSON.stringify(products));
    localStorage.setItem('ropeartlab_trash', JSON.stringify(trash));
    
    // Atualizar a propriedade products do adminSystem
    adminSystem.products = products;
    
    // Sincronizar produto específico (restaurado)
    adminSystem.syncSpecificProduct(productId);
}

function permanentlyDeleteFromTrash(productId) {
    const trash = JSON.parse(localStorage.getItem('ropeartlab_trash') || '[]');
    const filteredTrash = trash.filter(p => p.id !== productId);
    
    localStorage.setItem('ropeartlab_trash', JSON.stringify(filteredTrash));
}

function checkExpiredTrashItems() {
    const trash = JSON.parse(localStorage.getItem('ropeartlab_trash') || '[]');
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    
    const expiredItems = trash.filter(item => {
        const deletedDate = new Date(item.deletedAt);
        return deletedDate < thirtyDaysAgo;
    });
    
    if (expiredItems.length > 0) {
        const remainingTrash = trash.filter(item => {
            const deletedDate = new Date(item.deletedAt);
            return deletedDate >= thirtyDaysAgo;
        });
        
        localStorage.setItem('ropeartlab_trash', JSON.stringify(remainingTrash));
        
        console.log(`${expiredItems.length} itens foram excluídos permanentemente da lixeira.`);
    }
}

// Função para fechar modal da lixeira
window.closeTrashModal = function() {
    const trashModal = document.getElementById('trash-modal');
    if (trashModal) {
        trashModal.style.display = 'none';
        trashModal.classList.remove('open');
    }
};

// Função para exibir lixeira
window.showTrash = function() {
    const trashModal = document.getElementById('trash-modal');
    const trash = JSON.parse(localStorage.getItem('ropeartlab_trash') || '[]');
    const trashGrid = document.getElementById('trash-grid');
    const trashEmpty = document.getElementById('trash-empty');
    
    // Mostrar modal
    trashModal.style.display = 'flex';
    trashModal.classList.add('open');
    
    if (trash.length === 0) {
        trashGrid.style.display = 'none';
        trashEmpty.style.display = 'block';
    } else {
        trashGrid.style.display = 'grid';
        trashEmpty.style.display = 'none';
        
        trashGrid.innerHTML = trash.map(item => {
            const deletedDate = new Date(item.deletedAt);
            const daysLeft = Math.ceil((30 - (new Date() - deletedDate) / (1000 * 60 * 60 * 24)));
            const isExpired = daysLeft <= 0;
            
            return `
                <div class="trash-item ${isExpired ? 'expired' : ''}">
                    <div class="trash-item-header">
                        <img src="${item.image}" alt="${item.name}" class="trash-item-image" onerror="this.src='../../images/logo.jpg'">
                        <div class="trash-item-info">
                            <h4>${item.name}</h4>
                            <p>${item.category}</p>
                        </div>
                    </div>
                    
                    <div class="trash-item-details">
                        <div><strong>Excluído em:</strong> ${deletedDate.toLocaleDateString('pt-BR')}</div>
                        <div><strong>Dias restantes:</strong> ${isExpired ? 'Expirado' : daysLeft + ' dias'}</div>
                        <div><strong>Estoque:</strong> ${item.stock || 0}</div>
                        <div><strong>Tamanhos:</strong> ${item.sizes ? item.sizes.length : 0}</div>
                    </div>
                    
                    <div class="trash-item-actions">
                        <button class="btn-restore" onclick="restoreFromTrashModal(${item.id})">
                            <i class="fas fa-undo"></i>
                            Restaurar
                        </button>
                        <button class="btn-delete-permanent" onclick="permanentlyDeleteFromTrashModal(${item.id})">
                            <i class="fas fa-trash"></i>
                            Excluir Permanentemente
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    document.getElementById('trash-modal').style.display = 'flex';
    document.getElementById('trash-modal').classList.add('open');
}

// Função para abrir modal de upload de imagem
window.openImageUploadModal = function() {
    const modal = document.getElementById('image-upload-modal');
    modal.style.display = 'flex';
    modal.classList.add('open');
    
    // Garantir que o modal seja totalmente visível
    setTimeout(() => {
        modal.scrollTop = 0;
        const form = modal.querySelector('form');
        if (form) {
            form.scrollTop = 0;
        }
    }, 100);
}

// Função para fechar modal de upload de imagem
window.closeImageUploadModal = function() {
    const modal = document.getElementById('image-upload-modal');
    modal.style.display = 'none';
    modal.classList.remove('open');
}

// Função para abrir modal de produto
window.openProductModal = function() {
    const modal = document.getElementById('product-modal');
    modal.style.display = 'flex';
    modal.classList.add('open');
    
    // Garantir que o modal seja totalmente visível
    setTimeout(() => {
        modal.scrollTop = 0;
        const form = modal.querySelector('form');
        if (form) {
            form.scrollTop = 0;
        }
    }, 100);
}

// Função para fechar modal de produto
window.closeProductModal = function() {
    const modal = document.getElementById('product-modal');
    modal.style.display = 'none';
    modal.classList.remove('open');
}

// Função para toggle da sidebar
window.toggleSidebar = function() {
    const sidebar = document.getElementById('admin-sidebar');
    const toggleIcon = sidebar.querySelector('.sidebar-toggle i');
    
    sidebar.classList.toggle('collapsed');
    
    // Trocar ícone
    if (sidebar.classList.contains('collapsed')) {
        toggleIcon.className = 'fas fa-angle-right';
    } else {
        toggleIcon.className = 'fas fa-bars';
    }
    
    // Salvar estado no localStorage
    localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed'));
}

// Função para restaurar estado da sidebar
function restoreSidebarState() {
    const sidebar = document.getElementById('admin-sidebar');
    const toggleIcon = sidebar.querySelector('.sidebar-toggle i');
    const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    
    if (isCollapsed) {
        sidebar.classList.add('collapsed');
        toggleIcon.className = 'fas fa-angle-right';
    }
}

// Função para restaurar item da lixeira (do modal)
window.restoreFromTrashModal = function(productId) {
    if (!confirm('Tem certeza que deseja restaurar este produto da lixeira?')) {
        return;
    }
    
    restoreFromTrash(productId);
    showTrash(); // Recarregar a lixeira
    adminSystem.loadProducts(); // Recarregar produtos ativos
    adminSystem.showNotification('Produto restaurado com sucesso!', 'success');
}

// Função para excluir permanentemente da lixeira (do modal)
window.permanentlyDeleteFromTrashModal = function(productId) {
    if (!confirm('Tem certeza que deseja excluir este produto permanentemente?\n\nEsta ação não pode ser desfeita!')) {
        return;
    }
    
    permanentlyDeleteFromTrash(productId);
    showTrash(); // Recarregar a lixeira
    alert('Produto excluído permanentemente!');
}

// Função para salvar produto (nova ou edição)
window.saveProduct = function(event) {
    event.preventDefault();
    
    try {
        const form = event.target;
        const editingId = form.dataset.editingId;
        
        // Coletar dados do formulário
        const sizes = window.getSizesFromForm();
        console.log('Tamanhos coletados para salvar:', sizes);
        
        // Validar campo de desconto
        const discountEnabled = document.getElementById('product-discount-enabled').checked;
        const discountPercentage = parseInt(document.getElementById('product-discount-percentage').value) || 0;
        
        // Se desconto estiver desabilitado ou percentual for 0, definir como 0
        const finalDiscountPercentage = (discountEnabled && discountPercentage > 0) ? discountPercentage : 0;
        const finalDiscountEnabled = (discountEnabled && discountPercentage > 0);
        
        const productData = {
            name: document.getElementById('product-name').value,
            description: document.getElementById('product-description').value,
            category: document.getElementById('product-category-tag').value || document.getElementById('product-category').value,
            stock: parseInt(document.getElementById('product-stock').value) || 0,
            active: document.getElementById('product-active').checked,
            featured: document.getElementById('product-featured').checked,
            discount: finalDiscountEnabled,
            discountPercentage: finalDiscountPercentage,
            sizes: sizes
        };
        
        console.log('Dados do produto a serem salvos:', productData);
        
        // Adicionar imagens se houver
        if (productImages.length > 0) {
            productData.images = productImages;
            productData.image = productImages[0]; // Primeira imagem como principal
        }
        
        const products = JSON.parse(localStorage.getItem('ropeartlab_products') || '[]');
        
        if (editingId) {
            // Editar produto existente
            const productIndex = products.findIndex(p => p.id === parseInt(editingId));
            if (productIndex !== -1) {
                products[productIndex] = { ...products[productIndex], ...productData };
            }
        } else {
            // Adicionar novo produto
            const newId = Math.max(...products.map(p => p.id), 0) + 1;
            productData.id = newId;
            productData.createdAt = new Date().toISOString();
            products.push(productData);
        }
        
        localStorage.setItem('ropeartlab_products', JSON.stringify(products));
        
        // Atualizar a propriedade products do adminSystem
        adminSystem.products = products;
        
        // Sincronizar produto específico
        if (editingId) {
            adminSystem.syncSpecificProduct(parseInt(editingId));
        } else {
            // Para novo produto, sincronizar todos
            adminSystem.saveProducts();
        }
        
        // Recarregar produtos
        adminSystem.loadProducts();
        
        // Fechar modal
        closeProductModal();
        
        // Mostrar notificação
        adminSystem.showNotification(editingId ? 'Produto atualizado com sucesso!' : 'Produto adicionado com sucesso!', 'success');
        
    } catch (error) {
        console.error('Erro ao salvar produto:', error);
        alert('Erro ao salvar produto. Verifique o console para mais detalhes.');
    }
}

// Função global para adicionar novo produto
window.addNewProductCard = function() {
    document.getElementById('product-modal-title').textContent = 'Adicionar Produto';
    document.getElementById('product-form').reset();
    document.getElementById('product-form').dataset.editingId = '';
    
    // Resetar estado visual dos botões de checkbox
    updateCheckboxButtonState('product-active', false);
    updateCheckboxButtonState('product-featured', false);
    updateCheckboxButtonState('product-discount-enabled', false);
    
    // Limpar imagens
    productImages = [];
    updateImagesGrid();
    
    // Limpar tamanhos e adicionar padrão
    window.setSizesToForm([]);
    
    openProductModal();
};

// Função global para testar produtos
window.testProducts = function() {
    console.log('Testando carregamento de produtos...');
    console.log('AdminSystem:', adminSystem);
    console.log('Produtos:', adminSystem.products);
    console.log('Container:', document.getElementById('products-grid'));
    
    // Testar caminhos das imagens
    const testImages = [
        '../../images/amarelo e laranja.jpg',
        '../../images/azul bebe e chumbo.jpg',
        '../../images/marinho e vermelho.jpg',
        '../../images/militar e marrom.jpg',
        '../../images/rosa bebe e verde bebe.jpg',
        '../../images/rosa pink e lilas.jpg',
        '../../images/roxo e laranja .jpg',
        '../../images/verde e cinza.jpg'
    ];
    
    testImages.forEach((imgPath, index) => {
        const img = new Image();
        img.onload = () => console.log(`✅ Imagem ${index + 1} carregada: ${imgPath}`);
        img.onerror = () => console.log(`❌ Erro ao carregar imagem ${index + 1}: ${imgPath}`);
        img.src = imgPath;
    });
    
    adminSystem.loadProducts();
};

// Verificar se é admin logado
function checkAdminLogin() {
    const isLoggedIn = localStorage.getItem('admin_logged_in');
    if (!isLoggedIn) {
        window.location.href = 'index.html';
    }
}

// Funções para gerenciar modal de detalhes do cliente (modal interno)
function showClientPopup(user) {
    // Remover modal existente se houver
    const existingModal = document.getElementById('client-popup-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Buscar pedidos do cliente
    const orders = JSON.parse(localStorage.getItem('ropeartlab_orders') || '[]');
    const clientOrders = orders.filter(order => order.userEmail === user.email);
    
    const fullAddress = `${user.endereco || ''}, ${user.numero || ''}` + 
                      (user.complemento ? `, ${user.complemento}` : '');
    
    // Criar modal interno
    const modal = document.createElement('div');
    modal.id = 'client-popup-modal';
    modal.className = 'client-popup-overlay';
    modal.innerHTML = `
        <div class="client-popup-content">
            <div class="client-popup-header">
                <h1>🐘 Detalhes do Cliente</h1>
                <button class="client-popup-close" onclick="closeClientPopup()">❌</button>
            </div>
            <div class="client-popup-body">
                <h2>🐕 ${user.nome} ${user.sobrenome || ''}</h2>
                <h3>📋 Informações Pessoais</h3>
                <div class="info-grid">
                    <div class="info-field"><strong>📧 Email:</strong> ${user.email || 'N/A'}</div>
                    <div class="info-field"><strong>🆔 CPF/CNPJ:</strong> ${user.cpf || 'N/A'}</div>
                    <div class="info-field"><strong>📞 Telefone:</strong> ${user.telefone || 'N/A'}</div>
                    <div class="info-field"><strong>📅 Data Cadastro:</strong> ${new Date(user.createdAt || Date.now()).toLocaleDateString('pt-BR')}</div>
                    <div class="info-field"><strong>📮 CEP:</strong> ${user.cep || 'N/A'}</div>
                    <div class="info-field"><strong>🏙️ Cidade/Estado:</strong> ${user.cidade || ''} - ${user.estado || ''}</div>
                    <div class="info-field full-width"><strong>🏠 Endereço:</strong> ${fullAddress || 'N/A'}</div>
                </div>
                <div class="orders-section">
                    <h3>🛒 Histórico de Pedidos (${clientOrders.length})</h3>
                    ${clientOrders.length > 0 ? clientOrders.map(order => `
                        <div class="order-item">
                            <h4>📦 Pedido #${order.id}</h4>
                            <div class="order-info">
                                <div><strong>📅 Data:</strong> ${new Date(order.date || Date.now()).toLocaleDateString('pt-BR')}</div>
                                <div><strong>💰 Total:</strong> R$ ${order.total || '0,00'}</div>
                                <div><strong>📋 Produtos:</strong> ${order.items ? order.items.map(item => item.name + ' (x' + item.quantity + ')').join(', ') : 'N/A'}</div>
                                <div><strong>📦 Status:</strong> ${order.status || 'Pendente'}</div>
                            </div>
                        </div>
                    `).join('') : '<div class="no-orders">🚫 Nenhum pedido encontrado</div>'}
                </div>
                <button class="close-popup-btn" onclick="closeClientPopup()">🗑️ Fechar</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    console.log('🎉 Modal interno criado com dados do cliente:', user.nome);
}

function closeClientPopup() {
    const modal = document.getElementById('client-popup-modal');
    if (modal) {
        modal.style.opacity = '0';
        setTimeout(() => {
            modal.remove();
        }, 300);
    }
}

// Funções para gerenciar modal de detalhes do cliente (versão antiga - não usada mais)
function closeClientDetailsModal() {
    const modal = document.getElementById('client-details-modal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 400);
    }
}

function viewClientOrdersFromModal() {
    const userId = document.getElementById('client-details-modal').dataset.currentUserId;
    if (userId) {
        adminSystem.viewClientOrders(userId);
        closeClientDetailsModal();
    }
}

function deleteClientFromModal() {
    const userId = document.getElementById('client-details-modal').dataset.currentUserId;
    if (userId) {
        adminSystem.deleteClient(userId);
        closeClientDetailsModal();
    }
}

// Sistema de Controle de Pedidos - Aprovação/Cancelamento
AdminSystem.prototype.loadOrders = function() {
    const orders = JSON.parse(localStorage.getItem('ropeartlab_orders') || '[]');
    const users = this.loadUsers();
    
    if (orders.length === 0) {
        this.showNoOrdersMessage();
        return [];
    }
    
    const tbody = document.getElementById('orders-table-body');
    if (!tbody) return [];
    
    tbody.innerHTML = orders.map(order => {
        const user = users.find(u => u.email === order.userEmail);
        const orderDate = new Date(order.date || Date.now());
        const products = order.items ? order.items.map(item => `${item.name} (x${item.quantity})`).join(', ') : 'Nenhum produto';
        
        // Status dos pedidos
        const statusInfo = this.getOrderStatusInfo(order.status);
        
        return `
            <tr class="order-row" data-order-id="${order.id}" data-status="${order.status}">
                <td><strong>#${order.id}</strong></td>
                <td>${user ? `${user.nome} ${user.sobrenome || ''}` : 'Cliente não encontrado'}</td>)
                <td>${orderDate.toLocaleDateString('pt-BR')}</td>
                <td><strong>R$ ${parseFloat(order.total || 0).toFixed(2)}</strong></td>
                <td>
                    <span class="status-badge status-${order.status}">
                        ${statusInfo.label}
                    </span>
                </td>
                <td class="products-info">${products}</td>
                <td class="order-actions">
                    ${this.getOrderActionButtons(order.status, order.id)}
                    <button class="btn-small btn-info" onclick="adminSystem.viewOrderDetails('${order.id}')" title="Ver Detalhes">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
    
    return orders; // RETORNAR os pedidos para as análises
};

// Obter informações do status do pedido
AdminSystem.prototype.getOrderStatusInfo = function(status) {
    const statusMap = {
        'pending': { label: 'Pendente', class: 'status-pending', icon: '⏳' },
        'approved': { label: 'Aprovado', class: 'status-approved', icon: '✅' },
        'finalized': { label: 'Finalizado', class: 'status-finalized', icon: '🎉' },
        'cancelled': { label: 'Cancelado', class: 'status-cancelled', icon: '❌' }
    };
    
    return statusMap[status] || { label: 'Desconhecido', class: 'status-unknown', icon: '❓' };
};

// Obter botões de ação baseado no status
AdminSystem.prototype.getOrderActionButtons = function(status, orderId) {
    switch(status) {
        case 'pending':
            return `
                <button class="btn-small btn-success" onclick="adminSystem.approveOrder('${orderId}')" title="Aprovar Pedido">
                    <i class="fas fa-check"></i>
                </button>
                <button class="btn-small btn-danger" onclick="adminSystem.cancelOrder('${orderId}')" title="Cancelar Pedido">
                    <i class="fas fa-times"></i>
                </button>
            `;
        case 'approved':
            return `
                <button class="btn-small btn-primary" onclick="adminSystem.finalizeOrder('${orderId}')" title="Finalizar Pedido">
                    <i class="fas fa-flag-checkered"></i>
                </button>
                <button class="btn-small btn-danger" onclick="adminSystem.cancelOrder('${orderId}')" title="Cancelar Pedido">
                    <i class="fas fa-times"></i>
                </button>
            `;
        case 'finalized':
            return `
                <span class="text-success">
                    <i class="fas fa-check-circle"></i> Finalizado
                </span>
            `;
        case 'cancelled':
            return `
                <button class="btn-small btn-warning" onclick="adminSystem.restoreOrder('${orderId}')" title="Restaurar Pedido">
                    <i class="fas fa-undo"></i>
                </button>
                <button class="btn-small btn-inverse" onclick="adminSystem.deletePermanently('${orderId}')" title="Excluir Permanentemente">
                    <i class="fas fa-trash"></i>
                </button>
            `;
        default:
            return '<span class="text-muted">Sem ações</span>';
    }
};

// Aprovar pedido
AdminSystem.prototype.approveOrder = function(orderId) {
    const orders = JSON.parse(localStorage.getItem('ropeartlab_orders') || '[]');
    const orderIndex = orders.findIndex(o => o.id === orderId);
    
    if (orderIndex !== -1) {
        orders[orderIndex].status = 'approved';
        orders[orderIndex].approvedAt = new Date().toISOString();
        localStorage.setItem('ropeartlab_orders', JSON.stringify(orders));
        
        this.loadOrders();
        this.showNotification('✅ Pedido aprovado com sucesso!', 'success');
        console.log('🎉 Pedido aprovado:', orderId);
    }
};

// Finalizar pedido (para análise)
AdminSystem.prototype.finalizeOrder = function(orderId) {
    const orders = JSON.parse(localStorage.getItem('ropeartlab_orders') || '[]');
    const orderIndex = orders.findIndex(o => o.id === orderId);
    
    if (orderIndex !== -1) {
        orders[orderIndex].status = 'finalized';
        orders[orderIndex].finalizedAt = new Date().toISOString();
        localStorage.setItem('ropeartlab_orders', JSON.stringify(orders));
        
        this.loadOrders();
        this.showNotification('🎉 Pedido finalizado para análise!', 'success');
        console.log('💰 Pedido finalizado para análise:', orderId);
        
        // Atualizar análises quando pedido for finalizado
        this.updateFinancialAnalytics();
    }
};

// Cancelar pedido
AdminSystem.prototype.cancelOrder = function(orderId) {
    if (!confirm('Tem certeza que deseja cancelar este pedido?')) return;
    
    const orders = JSON.parse(localStorage.getItem('ropeartlab_orders') || '[]');
    const orderIndex = orders.findIndex(o => o.id === orderId);
    
    if (orderIndex !== -1) {
        orders[orderIndex].status = 'cancelled';
        orders[orderIndex].cancelledAt = new Date().toISOString();
        localStorage.setItem('ropeartlab_orders', JSON.stringify(orders));
        
        this.loadOrders();
        this.showNotification('❌ Pedido cancelado!', 'warning');
        console.log('🚫 Pedido cancelado:', orderId);
    }
};

// Restaurar pedido cancelado
AdminSystem.prototype.restoreOrder = function(orderId) {
    const orders = JSON.parse(localStorage.getItem('ropeartlab_orders') || '[]');
    const orderIndex = orders.findIndex(o => o.id === orderId);
    
    if (orderIndex !== -1) {
        orders[orderIndex].status = 'pending';
        orders[orderIndex].restoredAt = new Date().toISOString();
        localStorage.setItem('ropeartlab_orders', JSON.stringify(orders));
        
        this.loadOrders();
        this.showNotification('🔄 Pedido restaurado como pendente!', 'info');
        console.log('🔄 Pedido restaurado:', orderId);
    }
};

// Excluir permanentemente
AdminSystem.prototype.deletePermanently = function(orderId) {
    if (!confirm('Tem certeza que deseja excluir PERMANENTEMENTE este pedido?')) return;
    
    const orders = JSON.parse(localStorage.getItem('ropeartlab_orders') || '[]');
    const filteredOrders = orders.filter(o => o.id !== orderId);
    
    localStorage.setItem('ropeartlab_orders', JSON.stringify(filteredOrders));
    this.loadOrders();
    this.showNotification('🗑️ Pedido excluído permanentemente!', 'error');
    console.log('🗑️ Pedido excluído permanentemente:', orderId);
};

// Mostrar mensagem quando não há pedidos
AdminSystem.prototype.showNoOrdersMessage = function() {
    const tbody = document.getElementById('orders-table-body');
    if (!tbody) return;
    
    tbody.innerHTML = `
        <tr>
            <td colspan="7" class="no-orders-message">
                <div class="no-orders-content">
                    <i class="fas fa-shopping-cart"></i>
                    <h3>Nenhum pedido encontrado</h3>
                    <p>Todos os pedidos enviados pelo WhatsApp aparecerão aqui</p>
                </div>
            </td>
        </tr>
    `;
};

// Contar clientes ativos
AdminSystem.prototype.getActiveClientsCount = function() {
    const orders = JSON.parse(localStorage.getItem('ropeartlab_orders') || '[]');
    const finalizedOrders = orders.filter(order => order.status === 'finalized');
    const lastThreeMonths = new Date();
    lastThreeMonths.setMonth(lastThreeMonths.getMonth() - 3);
    
    const activeClients = new Set();
    finalizedOrders.forEach(order => {
        const orderDate = new Date(order.date);
        if (orderDate >= lastThreeMonths) {
            activeClients.add(order.userEmail);
        }
    });
    
    return activeClients.size;
};

// Gerar gráficos de analytics
AdminSystem.prototype.generateAnalyticsCharts = function(productSales) {
    // Implementação básica dos gráficos
    console.log('📊 Gerando gráficos com dados:', Object.keys(productSales).length, 'produtos');
};

// Atualizar análises anuais
AdminSystem.prototype.updateYearlyAnalytics = function() {
    const selectedYear = document.getElementById('year-selector')?.value;
    console.log('📅 Atualizando análises para o ano:', selectedYear);
    // Implementar análises por ano
};

// Atualizar análises mensais
AdminSystem.prototype.updateMonthlyAnalytics = function() {
    const selectedMonth = document.getElementById('months-selector')?.value;
    console.log('📅 Atualizando análises para o mês:', selectedMonth);
    // Implementar análises por mês
};

// Gerar relatório financeiro
AdminSystem.prototype.generateFinancialReport = function() {
    const orders = JSON.parse(localStorage.getItem('ropeartlab_orders') || '[]');
    const finalizedOrders = orders.filter(order => order.status === 'finalized');
    
    let report = `RELATÓRIO FINANCEIRO - RopeArtLab\n`;
    report += `Data: ${new Date().toLocaleDateString('pt-BR')}\n\n`;
    report += `RESUMO EXECUTIVO:\n`;
    report += `- Total de Pedidos Finalizados: ${finalizedOrders.length}\n`;
    
    let totalRevenue = 0;
    finalizedOrders.forEach(order => {
        totalRevenue += parseFloat(order.total || 0);
    });
    
    report += `- Receita Total: R$ ${totalRevenue.toFixed(2)}\n`;
    report += `- Ticket Médio: R$ ${finalizedOrders.length > 0 ? (totalRevenue / finalizedOrders.length).toFixed(2) : '0,00'}\n\n`;
    
    report += `DETALHES POR PEDIDO:\n`;
    finalizedOrders.forEach((order, index) => {
        report += `${index + 1}. Pedido #${order.id} - R$ ${parseFloat(order.total || 0).toFixed(2)} - ${new Date(order.date).toLocaleDateString('pt-BR')}\n`;
    });
    
    // Criar arquivo de download
    const blob = new Blob([report], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-financeiro-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    this.showNotification('📄 Relatório financeiro gerado com sucesso!', 'success');
};

// Ver detalhes do pedido
AdminSystem.prototype.viewOrderDetails = function(orderId) {
    const orders = JSON.parse(localStorage.getItem('ropeartlab_orders') || '[]');
    const order = orders.find(o => o.id === orderId);
    
    if (!order) {
        alert('Pedido não encontrado!');
        return;
    }
    
    const users = this.loadUsers();
    const user = users.find(u => u.email === order.userEmail);
    const orderDate = new Date(order.date || Date.now());
    
    let details = `DETALHES DO PEDIDO #${order.id}\n\n`;
    details += `Cliente: ${user ? `${user.nome} ${user.sobrenome || ''}` : 'Não encontrado'}\n`;
    details += `Email: ${user?.email || 'N/A'}\n`;
    details += `Data: ${orderDate.toLocaleDateString('pt-BR')}\n`;
    details += `Status: ${this.getOrderStatusInfo(order.status).label}\n`;
    details += `Total: R$ ${parseFloat(order.total || 0).toFixed(2)}\n\n`;
    details += `PRODUTOS:\n`;
    
    if (order.items && order.items.length > 0) {
        order.items.forEach((item, index) => {
            details += `${index + 1}. ${item.name} - Qtd: ${item.quantity} - R$ ${parseFloat(item.price || 0).toFixed(2)}\n`;
        });
    } else {
        details += 'Nenhum produto no pedido.\n';
    }
    
    alert(details);
};

// Atualizar display das estatísticas
AdminSystem.prototype.updateStatsDisplay = function(stats) {
    console.log('📱 Atualizando display com estatísticas:', stats);
    
    // Tentar atualizar elementos existentes, mas não falhar se não existirem
    const elements = {
        'total-sales': `R$ ${stats.totalSales.toFixed(2)}`,
        'total-orders': stats.totalOrders.toString(),
        'avg-order-value': `R$ ${stats.avgOrderValue.toFixed(2)}`,
        'top-product': stats.topProduct
    };
    
    Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
            console.log(`✅ Elemento ${id} atualizado: ${value}`);
        } else {
            console.log(`⚠️ Elemento ${id} não encontrado no DOM`);
        }
    });
};

// Refresh analytics
AdminSystem.prototype.refreshAnalytics = function() {
    console.log('🔄 Atualizando análises...');
    this.updateFinancialAnalytics();
    this.showNotification('📊 Análises atualizadas!', 'success');
};

// Carregar análise financeira detalhada
AdminSystem.prototype.updateFinancialAnalytics = function() {
    console.log('📊 Atualizando análise financeira...');
    
    const orders = JSON.parse(localStorage.getItem('ropeartlab_orders') || '[]');
    const products = this.loadProducts();
    
    // Filtrar apenas pedidos finalizados (para análise)
    const finalizedOrders = orders.filter(order => order.status === 'finalized');
    
    console.log('📦 Pedidos finalizados para análise:', finalizedOrders.length);
    
    // Análise por produto
    const productSales = {};
    let totalRevenue = 0;
    let totalOrders = finalizedOrders.length;
    
    finalizedOrders.forEach(order => {
        totalRevenue += parseFloat(order.total || 0);
        
        if (order.items) {
            order.items.forEach(item => {
                const productName = item.name;
                const quantity = parseInt(item.quantity) || 0;
                const price = parseFloat(item.price) || 0;
                const itemTotal = quantity * price;
                
                if (!productSales[productName]) {
                    productSales[productName] = {
                        name: productName,
                        totalSold: 0,
                        totalRevenue: 0,
                        orders: 0
                    };
                }
                
                productSales[productName].totalSold += quantity;
                productSales[productName].totalRevenue += itemTotal;
                productSales[productName].orders++;
            });
        }
    });
    
    // Atualizar resumo financeiro
    this.updateFinancialSummary(totalRevenue, totalOrders, productSales);
    
    // Atualizar análise por produto
    this.updateProductAnalytics(productSales);
    
    // Gerar gráficos
    this.generateAnalyticsCharts(productSales);
    
    console.log('✅ Análise financeira atualizada:', {
        totalRevenue: `R$ ${totalRevenue.toFixed(2)}`,
        totalOrders,
        productsAnalyzed: Object.keys(productSales).length
    });
};

// Atualizar resumo financeiro
AdminSystem.prototype.updateFinancialSummary = function(totalRevenue, totalOrders, productSales) {
    // Atualizar elementos do dashboard se existirem
    const elements = {
        'total-revenue-year': `R$ ${totalRevenue.toFixed(2)}`,
        'total-finalized-orders': totalOrders.toString(),
        'avg-ticket': totalOrders > 0 ? `R$ ${(totalRevenue / totalOrders).toFixed(2)}` : 'R$ 0,00',
        'active-clients': this.getActiveClientsCount()
    };
    
    Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    });
};

// Atualizar análise por produto
AdminSystem.prototype.updateProductAnalytics = function(productSales) {
    const container = document.getElementById('product-detailed-analysis') || 
                     document.getElementById('product-sales-list');
    
    if (!container) return;
    
    // Converter para array e ordenar por receita
    const productArray = Object.values(productSales)
        .sort((a, b) => b.totalRevenue - a.totalRevenue);
    
    if (productArray.length === 0) {
        container.innerHTML = '<div class="no-data">Nenhum produto vendido ainda</div>';
        return;
    }
    
    container.innerHTML = productArray.map(product => `
        <div class="product-analytics-item">
            <div class="product-info">
                <h4>${product.name}</h4>
                <div class="product-metrics">
                    <div class="metric">
                        <span class="metric-label">📦 Qtd Vendida:</span>
                        <span class="metric-value">${product.totalSold}</span>
                    </div>
                    <div class="metric">
                        <span class="metric-label">💰 Receita:</span>
                        <span class="metric-value">R$ ${product.totalRevenue.toFixed(2)}</span>
                    </div>
                    <div class="metric">
                        <span class="metric-label">📋 Pedidos:</span>
                        <span class="metric-value">${product.orders}</span>
                    </div>
                    <div class="metric">
                        <span class="metric-label">📊 Ticket Médio:</span>
                        <span class="metric-value">R$ ${(product.totalRevenue / product.orders).toFixed(2)}</span>
                    </div>
                </div>
            </div>
            <div class="product-chart">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${(product.totalRevenue / productArray[0].totalRevenue) * 100}%"></div>
                </div>
            </div>
        </div>
    `).join('');
};

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM carregado, verificando login...');
    checkAdminLogin();
    
    console.log('Inicializando AdminSystem...');
    window.adminSystem = new AdminSystem();
    console.log('AdminSystem inicializado:', window.adminSystem);
    
    // Garantir que modal de cliente está oculto
    const clientModal = document.getElementById('client-details-modal');
    if (clientModal) {
        clientModal.style.display = 'none';
        console.log('✅ Modal de cliente inicializado e oculto');
    } else {
        console.error('❌ Modal client-details-modal não encontrado no HTML!');
    }
    
    // Forçar carregamento dos produtos após inicialização
    setTimeout(() => {
        console.log('Forçando carregamento dos produtos após inicialização...');
        if (window.adminSystem) {
            window.adminSystem.loadProducts();
        }
    }, 1000);
});
