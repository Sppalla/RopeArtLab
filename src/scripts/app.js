// RopeArtLab - Catálogo de Cordas Artesanais
// JavaScript para funcionalidades dinâmicas e interações do usuário

// Variável global para produtos
let products = [];

document.addEventListener('DOMContentLoaded', () => {
    // Carregar produtos do localStorage (sincronizado com admin) ou usar padrão
    products = JSON.parse(localStorage.getItem('ropeartlab_products') || '[]');
    
    // Se não há produtos no localStorage, usar produtos padrão
    if (products.length === 0) {
        products = [
            {
                id: 1,
                name: 'Corda Amarela e Laranja',
                images: [], // Usar placeholder em vez de imagem real
                description: 'Uma combinação vibrante de amarelo e laranja que traz energia e alegria. Perfeita para atividades ao ar livre e decoração moderna.',
                sizes: [
                    { size: 'até 50cm', price: 130.00 },
                    { size: '60cm', price: 140.00 },
                    { size: '90cm', price: 150.00 },
                    { size: 'Personalizado', price: 'Entre em contato direto com o vendedor.' }
                ],
                category: 'Moderna',
                featured: true,
                active: true
            },
            {
                id: 2,
                name: 'Corda Azul Bebê e Chumbo',
                images: [], // Usar placeholder em vez de imagem real
                description: 'Elegante mistura de azul suave e chumbo, criando um contraste sofisticado. Ideal para ambientes contemporâneos e minimalistas.',
                sizes: [
                    { size: 'até 50cm', price: 130.00 },
                    { size: '60cm', price: 140.00 },
                    { size: '90cm', price: 150.00 },
                    { size: 'Personalizado', price: 'Entre em contato direto com o vendedor.' }
                ],
                category: 'Elegância',
                featured: true,
                active: true
            },
            {
                id: 3,
                name: 'Corda Marinho e Vermelho',
                images: [], // Usar placeholder em vez de imagem real
                description: 'Combinação clássica de marinho e vermelho, perfeita para um visual atemporal e elegante.',
                sizes: [
                    { size: 'até 50cm', price: 130.00 },
                    { size: '60cm', price: 140.00 },
                    { size: '90cm', price: 150.00 },
                    { size: 'Personalizado', price: 'Entre em contato direto com o vendedor.' }
                ],
                category: 'Clássico',
                featured: false,
                active: true
            },
            {
                id: 4,
                name: 'Corda Militar e Marrom',
                images: [], // Usar placeholder em vez de imagem real
                description: 'Estilo militar com tons terrosos, ideal para quem busca robustez e durabilidade.',
                sizes: [
                    { size: 'até 50cm', price: 130.00 },
                    { size: '60cm', price: 140.00 },
                    { size: '90cm', price: 150.00 },
                    { size: 'Personalizado', price: 'Entre em contato direto com o vendedor.' }
                ],
                category: 'Militar',
                featured: false,
                active: true
            },
            {
                id: 5,
                name: 'Corda Rosa Bebê e Verde Bebê',
                images: [], // Usar placeholder em vez de imagem real
                description: 'Delicada combinação de rosa e verde suaves, perfeita para um visual romântico e natural.',
                sizes: [
                    { size: 'até 50cm', price: 130.00 },
                    { size: '60cm', price: 140.00 },
                    { size: '90cm', price: 150.00 },
                    { size: 'Personalizado', price: 'Entre em contato direto com o vendedor.' }
                ],
                category: 'Romântico',
                featured: true,
                active: true
            },
            {
                id: 6,
                name: 'Corda Rosa Pink e Lilás',
                images: [], // Usar placeholder em vez de imagem real
                description: 'Vibrante mistura de rosa pink e lilás, criando um visual moderno e cheio de personalidade.',
                sizes: [
                    { size: 'até 50cm', price: 130.00 },
                    { size: '60cm', price: 140.00 },
                    { size: '90cm', price: 150.00 },
                    { size: 'Personalizado', price: 'Entre em contato direto com o vendedor.' }
                ],
                category: 'Moderno',
                featured: true,
                active: true
            },
            {
                id: 7,
                name: 'Corda Roxo e Laranja',
                images: [], // Usar placeholder em vez de imagem real
                description: 'Contraste vibrante entre roxo e laranja, perfeito para quem busca originalidade e energia.',
                sizes: [
                    { size: 'até 50cm', price: 130.00 },
                    { size: '60cm', price: 140.00 },
                    { size: '90cm', price: 150.00 },
                    { size: 'Personalizado', price: 'Entre em contato direto com o vendedor.' }
                ],
                category: 'Moderno',
                featured: true,
                active: true
            },
            {
                id: 8,
                name: 'Corda Verde e Cinza',
                images: [], // Usar placeholder em vez de imagem real
                description: 'Harmonia perfeita entre verde natural e cinza neutro. Uma escolha versátil que combina com qualquer decoração.',
                sizes: [
                    { size: 'até 50cm', price: 130.00 },
                    { size: '60cm', price: 140.00 },
                    { size: '90cm', price: 150.00 },
                    { size: 'Personalizado', price: 'Entre em contato direto com o vendedor.' }
                ],
                category: 'Versátil',
                featured: false,
                active: true
            }
        ];
        
        // Salvar produtos padrão no localStorage
        localStorage.setItem('ropeartlab_products', JSON.stringify(products));
    } else {
        // Carregar produtos existentes do localStorage
        products = JSON.parse(localStorage.getItem('ropeartlab_products'));
    }
    
    // Filtrar apenas produtos ativos para exibição no site
    products = products.filter(product => product.active === true);

    // Referência ao container de produtos
    const productList = document.getElementById('product-list');

    // Carrinho de compras
    let cart = JSON.parse(localStorage.getItem('cart')) || [];

    // Função para adicionar produto ao carrinho com tamanho
    window.addToCartWithSize = function(productName) {
        const product = products.find(p => p.name === productName);
        if (!product) return;

        // Encontrar o tamanho selecionado
        const productCard = document.querySelector(`[data-product-name="${productName}"]`) || 
                        Array.from(document.querySelectorAll('.product-card')).find(card => 
                            card.querySelector('.product-name').textContent === productName);
        
        if (!productCard) return;

        const selectedSizeInput = productCard.querySelector('input[type="radio"]:checked');
        if (!selectedSizeInput) return;

        const selectedSize = selectedSizeInput.value;
        const selectedSizeData = product.sizes.find(s => s.size === selectedSize);
        
        if (!selectedSizeData) return;

        // Verificar se é personalizado
        if (selectedSize === 'Personalizado') {
            showNotification('Para tamanhos personalizados, entre em contato direto conosco!', 'info');
            return;
        }

        // Aplicar desconto se existir
        let finalPrice = selectedSizeData.price;
        if (product.discount && product.discountPercentage > 0 && typeof selectedSizeData.price === 'number') {
            finalPrice = selectedSizeData.price * (1 - product.discountPercentage / 100);
        }
        
        const itemKey = `${productName} - ${selectedSize}`;

        const existingItem = cart.find(item => item.key === itemKey);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({
                key: itemKey,
                name: productName,
                size: selectedSize,
                price: finalPrice,
                originalPrice: selectedSizeData.price,
                discount: product.discountPercentage || 0,
                image: product.images[0],
                quantity: 1
            });
        }

        // Salvar no localStorage
        localStorage.setItem('cart', JSON.stringify(cart));
        
        // Atualizar interface
        updateCartCounter();
        updateCartDisplay();
        
        // Mostrar notificação
        showNotification(`${productName} (${selectedSize}) adicionado ao carrinho!`);
    };

    // Função para adicionar produto ao carrinho (mantida para compatibilidade)
    window.addToCart = function(productName, price) {
        const product = products.find(p => p.name === productName);
        if (!product) return;

        const existingItem = cart.find(item => item.name === productName && !item.size);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({
                name: productName,
                price: price,
                image: product.images[0],
                quantity: 1
            });
        }

        // Salvar no localStorage
        localStorage.setItem('cart', JSON.stringify(cart));
        
        // Atualizar interface
        updateCartCounter();
        updateCartDisplay();
        
        // Mostrar notificação
        showNotification(`${productName} adicionado ao carrinho!`);
    };

    // Função para mostrar notificação
    function showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'cart-notification';
        notification.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // Função para atualizar contador do carrinho
    function updateCartCounter() {
        const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
        const cartCounter = document.querySelector('.cart-counter');
        if (cartCounter) {
            cartCounter.textContent = totalItems;
        }
    }

    // Função para atualizar exibição do carrinho
    function updateCartDisplay() {
        const cartItems = document.getElementById('cart-items');
        const cartTotal = document.getElementById('cart-total');
        const previewBtn = document.getElementById('preview-btn');
        
        if (cart.length === 0) {
            cartItems.innerHTML = `
                <div class="empty-cart">
                    <i class="fas fa-shopping-cart"></i>
                    <p>Seu carrinho está vazio</p>
                    <p>Adicione alguns produtos para começar!</p>
                </div>
            `;
            cartTotal.textContent = '0,00';
            previewBtn.style.display = 'none';
        } else {
            cartItems.innerHTML = cart.map(item => {
                const itemKey = item.key || item.name;
                const displayName = item.size ? `${item.name} (${item.size})` : item.name;
                
                // Verificar se tem desconto
                const hasDiscount = item.discount && item.discount > 0 && item.originalPrice;
                const priceDisplay = hasDiscount ? `
                    <div class="cart-item-price">
                        <span class="original-price">R$ ${item.originalPrice.toFixed(2)}</span>
                        <span class="discounted-price">R$ ${item.price.toFixed(2)}</span>
                        <span class="discount-badge">-${item.discount}%</span>
                    </div>
                ` : `
                    <div class="cart-item-price">R$ ${item.price.toFixed(2)}</div>
                `;
                
                return `
                    <div class="cart-item">
                        <img src="${item.image}" alt="${item.name}" class="cart-item-image">
                        <div class="cart-item-info">
                            <div class="cart-item-name">${displayName}</div>
                            ${priceDisplay}
                        </div>
                        <div class="cart-item-controls">
                            <button class="quantity-btn" onclick="updateQuantity('${itemKey}', -1)">-</button>
                            <span class="quantity">${item.quantity}</span>
                            <button class="quantity-btn" onclick="updateQuantity('${itemKey}', 1)">+</button>
                            <button class="remove-item" onclick="removeFromCart('${itemKey}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
            
            const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            cartTotal.textContent = total.toFixed(2);
            previewBtn.style.display = 'flex';
        }
    }

    // Função para atualizar quantidade
    window.updateQuantity = function(itemKey, change) {
        const item = cart.find(item => (item.key || item.name) === itemKey);
        if (item) {
            item.quantity += change;
            if (item.quantity <= 0) {
                removeFromCart(itemKey);
                return;
            }
            localStorage.setItem('cart', JSON.stringify(cart));
            updateCartCounter();
            updateCartDisplay();
        }
    };

    // Função para remover item do carrinho
    window.removeFromCart = function(itemKey) {
        const item = cart.find(item => (item.key || item.name) === itemKey);
        const displayName = item ? (item.size ? `${item.name} (${item.size})` : item.name) : itemKey;
        
        cart = cart.filter(item => (item.key || item.name) !== itemKey);
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartCounter();
        updateCartDisplay();
        showNotification(`${displayName} removido do carrinho!`);
    };

    // Função para alternar carrinho
    window.toggleCart = function() {
        const cartModal = document.getElementById('cart-modal');
        cartModal.classList.toggle('open');
    };

    // Função para finalizar compra
    window.proceedToCheckout = function() {
        if (cart.length === 0) {
            showNotification('Seu carrinho está vazio!', 'error');
            return;
        }
        
        // Verificar se usuário está logado
        const currentUser = JSON.parse(localStorage.getItem('ropeartlab_current_user'));
        if (!currentUser) {
            showNotification('É necessário fazer login para finalizar o pedido!', 'error');
            toggleLogin();
            return;
        }
        
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const orderNumber = generateOrderNumber();
        
        // Formatar mensagem para WhatsApp
        const whatsappMessage = formatWhatsAppMessage(cart, total, orderNumber, currentUser);
        
        // Número do WhatsApp
        const whatsappNumber = '555191055765';
        
        // Criar URL do WhatsApp
        const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;
        
        // Confirmar antes de redirecionar
        const confirmMessage = `Deseja finalizar seu pedido via WhatsApp?\n\nNúmero do Pedido: #${orderNumber}\nTotal: R$ ${total.toFixed(2)}\n\nVocê será redirecionado para o WhatsApp com os detalhes do seu pedido.`;
        
        if (confirm(confirmMessage)) {
            // Salvar pedido no localStorage
            const order = {
                id: Date.now(),
                orderNumber: orderNumber,
                userEmail: currentUser.email,
                userName: currentUser.nome || 'Usuário',
                items: cart.map(item => ({
                    name: item.name,
                    size: item.size,
                    price: item.price,
                    quantity: item.quantity
                })),
                total: total,
                date: new Date().toISOString(),
                status: 'pending'
            };
            
            // Salvar pedido
            const existingOrders = JSON.parse(localStorage.getItem('ropeartlab_orders') || '[]');
            existingOrders.push(order);
            localStorage.setItem('ropeartlab_orders', JSON.stringify(existingOrders));
            
            // Abrir WhatsApp em nova aba
            window.open(whatsappUrl, '_blank');
            
            // Limpar carrinho após confirmação
            cart = [];
            localStorage.removeItem('cart');
            updateCartCounter();
            updateCartDisplay();
            toggleCart();
            
            // Mostrar notificação de sucesso
            showNotification(`Pedido #${orderNumber} enviado para o WhatsApp!`, 'success');
        }
    };

    // Função para gerar número do pedido
    function generateOrderNumber() {
        const orders = JSON.parse(localStorage.getItem('ropeartlab_orders') || '[]');
        const nextNumber = orders.length + 1;
        return nextNumber.toString().padStart(4, '0');
    }

    // Função para formatar mensagem do WhatsApp
    function formatWhatsAppMessage(cartItems, total, orderNumber, user) {
        const currentDate = new Date().toLocaleDateString('pt-BR');
        const currentTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        
        let message = `NOVO PEDIDO - RopeArtLab\n\n`;
        message += `Data: ${currentDate}\n`;
        message += `Horário: ${currentTime}\n\n`;
        message += `ITENS DO PEDIDO:\n\n`;
        
        cartItems.forEach((item, index) => {
            const itemTotal = item.price * item.quantity;
            const displayName = item.size ? `${item.name} (${item.size})` : item.name;
            message += `${index + 1}. ${displayName}\n`;
            message += `     Preço unitário: R$ ${item.price.toFixed(2)}\n`;
            message += `     Quantidade: ${item.quantity}\n`;
            message += `     Subtotal: R$ ${itemTotal.toFixed(2)}\n\n`;
        });
        
        message += `VALOR TOTAL: R$ ${total.toFixed(2)}\n\n`;
        message += `INFORMAÇÕES PARA ENTREGA:\n`;
        message += `Nome: ${user.nome || '_____________'}\n`;
        message += `Telefone: ${user.telefone || '_____________'}\n`;
        message += `Endereço: ${user.endereco || '_____________'}\n`;
        message += `CEP: ${user.cep || '_____________'}\n`;
        message += `Cidade: ${user.cidade || '_____________'}\n\n`;
        message += `OBSERVAÇÕES:\n`;
        message += `_____________\n\n`;
        message += `Confirme os dados acima para finalizar o pedido!\n`;
        message += `Entraremos em contato para confirmar a entrega.`;
        
        return message;
    }

    // Função para gerar HTML do preço com desconto
    function getProductPriceHtml(product, sizeData) {
        if (product.discount && product.discountPercentage > 0 && typeof sizeData.price === 'number') {
            const originalPrice = sizeData.price;
            const discountAmount = (originalPrice * product.discountPercentage) / 100;
            const discountedPrice = originalPrice - discountAmount;
            
            return `
                <div class="product-price-with-discount">
                    <span class="original-price">R$ ${originalPrice.toFixed(2).replace('.', ',')}</span>
                    <span class="discounted-price">R$ ${discountedPrice.toFixed(2).replace('.', ',')}</span>
                    <span class="discount-badge">-${product.discountPercentage}%</span>
                </div>
            `;
        } else {
            return typeof sizeData.price === 'number' 
                ? `R$ ${sizeData.price.toFixed(2).replace('.', ',')}` 
                : sizeData.price;
        }
    }

    // Função para criar galeria de imagens
    function createImageGallery(images, productName) {
        if (images && images.length === 1) {
            return `<img src="${images[0]}" alt="${productName}" class="product-image" data-product-name="${productName}">`;
        }

        const galleryId = `gallery-${productName.replace(/\s+/g, '-').toLowerCase()}`;
        
        return `
            <div class="image-gallery" id="${galleryId}" data-product-name="${productName}">
                <div class="gallery-container">
                    <img src="${images[0]}" alt="${productName}" class="product-image active" data-index="0" data-product-name="${productName}">
                    ${images.length > 1 ? `
                        <button class="gallery-nav prev" onclick="changeImage('${galleryId}', -1)">
                            <i class="fas fa-chevron-left"></i>
                        </button>
                        <button class="gallery-nav next" onclick="changeImage('${galleryId}', 1)">
                            <i class="fas fa-chevron-right"></i>
                        </button>
                    ` : ''}
                </div>
                ${images.length > 1 ? `
                    <div class="gallery-dots">
                        ${images.map((_, index) => `
                            <span class="dot ${index === 0 ? 'active' : ''}" onclick="goToImage('${galleryId}', ${index})"></span>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    }

    // Função para criar um card de produto
    function createProductCard(product) {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.setAttribute('data-product-name', product.name);
        
        if (product.featured) {
            productCard.classList.add('featured-product');
        }

        // Gerar HTML da galeria de imagens
        const imageGallery = createImageGallery(product.images, product.name);

        // Gerar HTML dos tamanhos
        const sizesHtml = product.sizes.map((size, index) => `
            <label class="size-option">
                <input type="radio" name="size-${product.name.replace(/\s+/g, '-').toLowerCase()}" value="${size.size}" ${index === 0 ? 'checked' : ''}>
                <span class="size-label">${size.size}</span>
                <span class="size-price">${typeof size.price === 'number' ? `R$ ${size.price.toFixed(2).replace('.', ',')}` : size.price}</span>
            </label>
        `).join('');

        productCard.innerHTML = `
            <div class="product-image-container">
                ${imageGallery}
                ${product.featured ? '<div class="featured-badge">Destaque</div>' : ''}
            </div>
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <p class="product-description">${product.description}</p>
                <div class="product-category">${product.category}</div>
                <div class="product-sizes">
                    <h4>Tamanhos Disponíveis:</h4>
                    <div class="size-options">
                        ${sizesHtml}
                    </div>
                </div>
                <div class="product-price" id="price-${product.name.replace(/\s+/g, '-').toLowerCase()}">
                    ${getProductPriceHtml(product, product.sizes[0])}
                </div>
                <button class="add-to-cart-btn" onclick="addToCartWithSize('${product.name}')">
                    <i class="fas fa-shopping-cart"></i>
                    Adicionar ao Carrinho
                </button>
            </div>
        `;

        // Adicionar event listeners para mudança de tamanho
        const sizeInputs = productCard.querySelectorAll('input[type="radio"]');
        const priceElement = productCard.querySelector(`#price-${product.name.replace(/\s+/g, '-').toLowerCase()}`);
        
        sizeInputs.forEach(input => {
            input.addEventListener('change', function() {
                const selectedSize = product.sizes.find(s => s.size === this.value);
                if (selectedSize) {
                    priceElement.innerHTML = getProductPriceHtml(product, selectedSize);
                }
            });
        });

        // Adicionar funcionalidade de hover para mudança de imagem
        if (product.images && product.images.length > 1) {
            const productImage = productCard.querySelector('.product-image');
            const productName = product.name;
            
            // Encontrar imagens relacionadas pelo nome do produto
            const relatedImages = findRelatedImages(productName);
            
            if (relatedImages.length > 1) {
                productCard.addEventListener('mouseenter', function() {
                    if (relatedImages.length > 1) {
                        this.hoverInterval = setInterval(() => {
                            let currentIndex = parseInt(this.dataset.currentImageIndex) || 0;
                            currentIndex = (currentIndex + 1) % relatedImages.length;
                            
                            productImage.src = relatedImages[currentIndex];
                            this.dataset.currentImageIndex = currentIndex;
                            
                            // Atualizar bolinhas
                            const dots = this.querySelectorAll('.product-dot');
                            dots.forEach((dot, index) => {
                                dot.classList.toggle('active', index === currentIndex);
                            });
                        }, 1000); // Muda a cada 1 segundo
                    }
                });
                
                productCard.addEventListener('mouseleave', function() {
                    if (this.hoverInterval) {
                        clearInterval(this.hoverInterval);
                        // Voltar para a primeira imagem
                        this.dataset.currentImageIndex = '0';
                        productImage.src = relatedImages[0];
                        
                        // Atualizar bolinhas
                        const dots = this.querySelectorAll('.product-dot');
                        dots.forEach((dot, index) => {
                            dot.classList.toggle('active', index === 0);
                        });
                    }
                });
            }
        }

        // Adicionar setas de navegação e bolinhas para produtos com múltiplas imagens
        if (product.images && product.images.length > 1) {
            const productName = product.name;
            const relatedImages = findRelatedImages(productName);
            
            if (relatedImages.length > 1) {
                const imageContainer = productCard.querySelector('.product-image-container');
                const productImage = productCard.querySelector('.product-image');
                
                // Criar setas de navegação
                const navigationArrows = document.createElement('div');
                navigationArrows.className = 'image-navigation-arrows';
                navigationArrows.innerHTML = `
                    <button class="nav-arrow prev-arrow" onclick="navigateProductImage('${productName}', -1)">
                        <i class="fas fa-chevron-left"></i>
                    </button>
                    <button class="nav-arrow next-arrow" onclick="navigateProductImage('${productName}', 1)">
                        <i class="fas fa-chevron-right"></i>
                    </button>
                `;
                
                // Criar bolinhas indicadoras
                const dotsContainer = document.createElement('div');
                dotsContainer.className = 'product-dots-container';
                dotsContainer.innerHTML = `
                    <div class="product-dots">
                        ${relatedImages.map((_, index) => `
                            <span class="product-dot ${index === 0 ? 'active' : ''}" onclick="goToProductImage('${productName}', ${index})"></span>
                        `).join('')}
                    </div>
                `;
                
                imageContainer.appendChild(navigationArrows);
                imageContainer.appendChild(dotsContainer);
                
                // Armazenar informações do produto para navegação
                productCard.dataset.currentImageIndex = '0';
                productCard.dataset.totalImages = relatedImages.length;
            }
        }

        return productCard;
    }

    // Função para encontrar imagens relacionadas pelo nome do produto
    function findRelatedImages(productName) {
        const relatedImages = [];
        
        // Mapear nomes de produtos para padrões de imagens
        const imagePatterns = {
            'Corda Amarela e Laranja': ['amarelo e laranja'],
            'Corda Azul Bebê e Chumbo': ['azul bebe e chumbo', 'azul bebe e chumb'],
            'Corda Marinho e Vermelho': ['marinho e vermelho'],
            'Corda Militar e Marrom': ['militar e marrom'],
            'Corda Rosa Bebê e Verde Bebê': ['rosa bebe e verde bebe'],
            'Corda Rosa Pink e Lilás': ['rosa pink e lilas'],
            'Corda Roxo e Laranja': ['roxo e laranja'],
            'Corda Verde e Cinza': ['verde e cinza']
        };
        
        const patterns = imagePatterns[productName];
        if (patterns) {
            patterns.forEach(pattern => {
                // Não adicionar mais imagens reais - usar placeholders
                console.log(`📱 Usando placeholder para: ${pattern}`);
            });
        }
        
        // Não filtrar mais imagens - usar placeholders
        console.log(`📱 Retornando placeholder para produto: ${productName}`);
        return []; // Retornar array vazio para usar placeholder
    }

    // Função para renderizar todos os produtos
    function renderProducts() {
        const productList = document.getElementById('product-list');
        if (!productList) return;
        
        productList.innerHTML = '';
        
        products.forEach((product, index) => {
            const productCard = createProductCard(product);
            
            // Adicionar animação de entrada com delay
            productCard.style.animationDelay = `${index * 0.1}s`;
            productCard.classList.add('fade-in-up');
            
            productList.appendChild(productCard);
        });
    }

    // Função para scroll suave para seções
    function smoothScroll() {
        const links = document.querySelectorAll('a[href^="#"]');
        
        links.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                
                const targetId = this.getAttribute('href');
                const targetSection = document.querySelector(targetId);
                
                if (targetSection) {
                    targetSection.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }

    // Função para animação de elementos ao fazer scroll
    function animateOnScroll() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, {
            threshold: 0.1
        });

        // Observar elementos que devem ser animados
        const animateElements = document.querySelectorAll('.feature-card, .section-header');
        animateElements.forEach(el => observer.observe(el));
    }

    // Função para efeito parallax sutil apenas nos elementos decorativos
    function parallaxEffect() {
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            const floatingElements = document.querySelectorAll('.floating-element');
            
            // Aplicar parallax apenas nos elementos decorativos, não no conteúdo principal
            floatingElements.forEach((element, index) => {
                const speed = 0.05 + (index * 0.02); // Velocidade muito reduzida
                element.style.transform = `translateY(${scrolled * speed}px)`;
            });
        });
    }

    // Funções de navegação da galeria de imagens
    window.changeImage = function(galleryId, direction) {
        const gallery = document.getElementById(galleryId);
        if (!gallery) return;
        
        const productName = gallery.dataset.productName;
        const relatedImages = findRelatedImages(productName);
        
        if (relatedImages.length <= 1) return;
        
        const currentImg = gallery.querySelector('.product-image.active');
        const currentSrc = currentImg.src;
        const currentIndex = relatedImages.findIndex(img => img === currentSrc.replace(window.location.origin + '/', ''));
        
        let newIndex = currentIndex + direction;
        if (newIndex < 0) newIndex = relatedImages.length - 1;
        if (newIndex >= relatedImages.length) newIndex = 0;
        
        // Atualizar imagem ativa
        currentImg.src = relatedImages[newIndex];
        currentImg.dataset.index = newIndex;
        
        // Atualizar dots se existirem
        const dots = gallery.querySelectorAll('.dot');
        if (dots.length > 0) {
            dots.forEach((dot, index) => {
                dot.classList.toggle('active', index === newIndex);
            });
        }
    };

    window.goToImage = function(galleryId, index) {
        const gallery = document.getElementById(galleryId);
        if (!gallery) return;
        
        const productName = gallery.dataset.productName;
        const relatedImages = findRelatedImages(productName);
        
        if (relatedImages.length <= 1 || index >= relatedImages.length) return;
        
        const currentImg = gallery.querySelector('.product-image.active');
        const dots = gallery.querySelectorAll('.dot');
        
        // Atualizar imagem ativa
        currentImg.src = relatedImages[index];
        currentImg.dataset.index = index;
        
        // Atualizar dots se existirem
        if (dots.length > 0) {
            dots.forEach((dot, i) => {
                dot.classList.toggle('active', i === index);
            });
        }
    };

    // Função para navegar entre imagens do produto usando setas (navegação infinita)
    window.navigateProductImage = function(productName, direction) {
        const productCard = document.querySelector(`[data-product-name="${productName}"]`);
        if (!productCard) return;
        
        const productImage = productCard.querySelector('.product-image');
        const relatedImages = findRelatedImages(productName);
        
        if (relatedImages.length <= 1) return;
        
        // Obter índice atual
        let currentIndex = parseInt(productCard.dataset.currentImageIndex) || 0;
        
        // Calcular novo índice com navegação infinita
        let newIndex = currentIndex + direction;
        if (newIndex < 0) {
            newIndex = relatedImages.length - 1; // Vai para a última imagem
        } else if (newIndex >= relatedImages.length) {
            newIndex = 0; // Vai para a primeira imagem
        }
        
        // Atualizar imagem
        productImage.src = relatedImages[newIndex];
        
        // Atualizar índice atual
        productCard.dataset.currentImageIndex = newIndex;
        
        // Atualizar bolinhas
        const dots = productCard.querySelectorAll('.product-dot');
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === newIndex);
        });
        
        // Parar hover automático se estiver ativo
        if (productCard.hoverInterval) {
            clearInterval(productCard.hoverInterval);
            productCard.hoverInterval = null;
        }
    };

    // Função para ir diretamente para uma imagem específica
    window.goToProductImage = function(productName, targetIndex) {
        const productCard = document.querySelector(`[data-product-name="${productName}"]`);
        if (!productCard) return;
        
        const productImage = productCard.querySelector('.product-image');
        const relatedImages = findRelatedImages(productName);
        
        if (relatedImages.length <= 1 || targetIndex >= relatedImages.length) return;
        
        // Atualizar imagem
        productImage.src = relatedImages[targetIndex];
        
        // Atualizar índice atual
        productCard.dataset.currentImageIndex = targetIndex;
        
        // Atualizar bolinhas
        const dots = productCard.querySelectorAll('.product-dot');
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === targetIndex);
        });
        
        // Parar hover automático se estiver ativo
        if (productCard.hoverInterval) {
            clearInterval(productCard.hoverInterval);
            productCard.hoverInterval = null;
        }
    };

    // Inicializar todas as funcionalidades
    function init() {
        console.log('🚀 Inicializando aplicação...');
        
        renderProducts();
        smoothScroll();
        animateOnScroll();
        parallaxEffect();
        
        // Verificar se há usuário logado
        checkLoginStatus();
        
        // Inicializar carrinho
        updateCartCounter();
        updateCartDisplay();
        
        // Adicionar evento ao botão CTA
        const ctaButton = document.querySelector('.cta-button');
        if (ctaButton) {
            ctaButton.addEventListener('click', () => {
                document.querySelector('#produtos').scrollIntoView({
                    behavior: 'smooth'
                });
            });
        }
        
        // Fechar carrinho ao clicar fora dele
        document.addEventListener('click', (e) => {
            const cartModal = document.getElementById('cart-modal');
            const cartIcon = document.querySelector('.cart-icon');
            
            if (cartModal.classList.contains('open') && 
                !cartModal.contains(e.target) && 
                !cartIcon.contains(e.target)) {
                cartModal.classList.remove('open');
            }
        });
    }

    // Executar inicialização
    init();
    
    // Logout automático quando fechar/recarregar página
    window.addEventListener('beforeunload', function() {
        console.log('🔄 Página sendo recarregada/fechada - logout automático');
        localStorage.removeItem('ropeartlab_current_user');
    });
});

// Logout automático também ao focar na página (caso usuário troque de aba)
window.addEventListener('focus', function() {
    // Verificar se houve refresh enviando um sinal de logout
    const wasLoggingOut = sessionStorage.getItem('isLoggingOut');
    if (wasLoggingOut) {
        sessionStorage.removeItem('isLoggingOut');
        localStorage.removeItem('ropeartlab_current_user');
        console.log('🔄 Logout por foco na página');
    }
});

// Função para alternar modal de login
window.toggleLogin = function() {
    const loginModal = document.getElementById('login-modal');
    const isCurrentlyOpen = loginModal.classList.contains('open');
    
    loginModal.classList.toggle('open');
    
    // Se estiver fechando o modal, limpar formulários
    if (isCurrentlyOpen) {
        clearForms();
    }
};

// Função inteligente para clique no ícone do usuário
window.handleUserIconClick = function() {
    const currentUser = JSON.parse(localStorage.getItem('ropeartlab_current_user'));
    
    if (currentUser) {
        // Se estiver logado, abrir menu dropdown
        toggleUserMenu();
    } else {
        // Se não estiver logado, abrir modal de login
        toggleLogin();
    }
};

// Função para alternar menu do usuário
window.toggleUserMenu = function() {
    const dropdown = document.getElementById('user-dropdown');
    const currentUser = JSON.parse(localStorage.getItem('ropeartlab_current_user'));
    
    if (!currentUser) {
        console.log('❌ Usuário não logado - redirecionando para login');
        toggleLogin();
        return;
    }
    
    console.log('🖱️ Alternando menu dropdown do usuário');
    
    if (dropdown) {
        // Toggle visibilidade
        const isVisible = dropdown.style.display === 'block' || dropdown.classList.contains('show');
        
        if (isVisible) {
            dropdown.style.display = 'none';
            dropdown.classList.remove('show');
            console.log('📂 Menu dropdown fechado');
        } else {
            dropdown.style.display = 'block';
            dropdown.classList.add('show');
            console.log('📂 Menu dropdown aberto');
        }
    } else {
        console.error('❌ Dropdown não encontrado!');
    }
};

// Função para fechar todos os modais
function closeAllModals() {
    document.getElementById('login-modal').classList.remove('open');
    document.getElementById('edit-profile-modal').classList.remove('open');
    document.getElementById('order-history-modal').classList.remove('open');
}

// Função para limpar formulários
function clearForms() {
    // Limpar campos de login
    document.getElementById('login-email').value = '';
    document.getElementById('login-password').value = '';
    
    // Limpar campos de cadastro
    document.getElementById('nome').value = '';
    document.getElementById('sobrenome').value = '';
    document.getElementById('cpf-cnpj').value = '';
    document.getElementById('celular').value = '';
    document.getElementById('email').value = '';
    document.getElementById('senha').value = '';
    document.getElementById('cep').value = '';
    document.getElementById('endereco').value = '';
    document.getElementById('numero').value = '';
    document.getElementById('complemento').value = '';
    document.getElementById('bairro').value = '';
    document.getElementById('cidade').value = '';
    document.getElementById('observacao').value = '';
}

// Função para alternar abas do modal de login
window.switchTab = function(tab) {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const tabButtons = document.querySelectorAll('.tab-btn');
    
    // Verificar se os elementos existem
    if (!loginForm || !registerForm || tabButtons.length === 0) {
        console.warn('⚠️ Elementos do modal não encontrados');
        return;
    }
    
    if (tab === 'login') {
        loginForm.classList.add('active');
        registerForm.classList.remove('active');
        
        // Atualizar botões das abas
        tabButtons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.textContent.includes('Entrar')) {
                btn.classList.add('active');
            }
        });
    } else {
        loginForm.classList.remove('active');
        registerForm.classList.add('active');
        
        // Atualizar botões das abas
        tabButtons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.textContent.includes('Cadastrar')) {
                btn.classList.add('active');
            }
        });
    }
    
    clearForms();
};

// Função auxiliar para limpar CPF/CNPJ (remover pontos, traços, barras)
function cleanCpfCnpj(value) {
    return value.replace(/[^\d]/g, '');
}

// Helper function para obter texto do status do pedido
function getOrderStatusText(status) {
    const statusMap = {
        'pending': '⏳ Aguardando Aprovação',
        'approved': '✅ Aprovado - Em Processamento',
        'finalized': '🎉 Finalizado',
        'cancelled': '❌ Cancelado'
    };
    
    return statusMap[status] || '❓ Status Desconhecido';
}

// Função para formatar CPF/CNPJ automaticamente
window.formatCpfCnpj = function(input) {
    let value = cleanCpfCnpj(input.value);
    
    // CPF (11 dígitos)
    if (value.length <= 11) {
        if (value.length > 3) {
            value = value.replace(/^(\d{3})(\d)/, '$1.$2');
        }
        if (value.length > 6) {
            value = value.replace(/^(\d{3})(\.)(\d{3})(\d)/, '$1$2$3.$4');
        }
        if (value.length > 9) {
            value = value.replace(/^(\d{3})(\.)(\d{3})(\.)(\d{3})(\d)/, '$1$2$3$4$5-$6');
        }
    }
    // CNPJ (14 dígitos)
    else {
        if (value.length > 2) {
            value = value.replace(/^(\d{2})(\d)/, '$1.$2');
        }
        if (value.length > 5) {
            value = value.replace(/^(\d{2})(\.)(\d{3})(\d)/, '$1$2$3.$4');
        }
        if (value.length > 8) {
            value = value.replace(/^(\d{2})(\.)(\d{3})(\.)(\d{3})(\d)/, '$1$2$3$4$5/$6');
        }
        if (value.length > 12) {
            value = value.replace(/^(\d{2})(\.)(\d{3})(\.)(\d{3})(\/)(\d{4})(\d)/, '$1$2$3$4$5$6$7-$8');
        }
    }
    
    input.value = value;
};

// Função para processar cadastro
function handleRegister(event) {
    console.log('🚀 Função handleRegister chamada!', event);
    
    if (event) event.preventDefault();
    
    console.log('📋 Buscando formulário...');
    const form = document.getElementById('register-form-element');
    
    if (!form) {
        console.error('❌ Formulário não encontrado!');
        showNotification('Erro: Formulário não encontrado!', 'error');
        return;
    }
    
    console.log('✅ Formulário encontrado:', form);
    const formData = new FormData(form);
    console.log('📄 FormData criado:', formData);
    
    // Criar objeto do usuário com todos os dados
    const user = {
        id: Date.now(),
        nome: formData.get('nome'),
        sobrenome: formData.get('sobrenome'),
        email: formData.get('email'),
        telefone: formData.get('celular'),
        cpf: formData.get('cpf-cnpj'),
        endereco: formData.get('endereco'),
        numero: formData.get('numero'),
        complemento: formData.get('complemento'),
        bairro: formData.get('bairro'),
        cidade: formData.get('cidade'),
        cep: formData.get('cep'),
        observacao: formData.get('observacao'),
        senha: formData.get('senha'),
        createdAt: new Date().toISOString()
    };
    
    console.log('👤 Usuário criado:', user);
    
    // Verificar se email já existe
    console.log('🔍 Verificando usuários existentes...');
    const existingUsers = JSON.parse(localStorage.getItem('ropeartlab_users') || '[]');
    console.log('📚 Usuários existentes:', existingUsers.length, existingUsers);
    
    const emailExists = existingUsers.some(existingUser => existingUser.email === user.email);
    
    if (emailExists) {
        showNotification('Este email já está cadastrado!', 'error');
        return;
    }
    
    // Verificar se CPF/CNPJ já existe
    const cpfCnpjExists = existingUsers.some(existingUser => 
        cleanCpfCnpj(existingUser.cpf) === cleanCpfCnpj(user.cpf)
    );
    
    if (cpfCnpjExists) {
        showNotification('Este CPF/CNPJ já está cadastrado! Cada documento só pode ser usado uma vez. Se você é o proprietário deste documento, entre em contato com o administrador para excluir o cadastro anterior.', 'error');
        return;
    }
    
    // Salvar usuário na lista de usuários
    existingUsers.push(user);
    localStorage.setItem('ropeartlab_users', JSON.stringify(existingUsers));
    console.log('📚 Lista de usuários atualizada:', existingUsers.length, 'usuários');
    
    // Salvar como usuário atual
    localStorage.setItem('ropeartlab_current_user', JSON.stringify(user));
    console.log('👤 Usuário atual salvo:', user.email);
    
    // Verificar se foi salvo corretamente
    setTimeout(() => {
        const savedUser = localStorage.getItem('ropeartlab_current_user');
        const savedUsers = localStorage.getItem('ropeartlab_users');
        console.log('✅ Verificação pós-salvamento:');
        console.log('   - Usuário atual:', savedUser ? '✅ Salvo' : '❌ Não salvo');
        console.log('   - Lista de usuários:', savedUsers ? '✅ Salvo' : '❌ Não salvo');
        
        if (savedUser) {
            const userObj = JSON.parse(savedUser);
            console.log('   - Email do usuário atual:', userObj.email);
        }
    }, 100);
    
    // Limpar formulário após cadastro bem-sucedido
    clearForms();
    
    
    // Preparar informações do usuário para exibição
    const userInfo = `${user.nome} ${user.sobrenome}`;
    const emailInfo = user.email;
    const createdAt = new Date().toLocaleString('pt-BR');
    
    console.log('✅ Usuário salvo com sucesso!');
    
    // Mostrar informações detalhadas do cadastro
    showNotification(`
        ✅ CADASTRO REALIZADO COM SUCESSO!
        
        👤 Nome: ${userInfo}
        📧 Email: ${emailInfo}
        📅 Data: ${createdAt}
        
        🎉 Você já está logado e pode usar todos os recursos!
    `, 'success');
    
    console.log('🚪 Fechando modal...');
    
    // Fechar modal de login/cadastro após delay rápido
    setTimeout(() => {
        console.log('🚪 Tentando fechar modal...');
        
        const loginModal = document.getElementById('login-modal');
        if (loginModal) {
            // Múltiplas formas de fechar o modal
            loginModal.classList.remove('open');
            loginModal.style.display = 'none';
            loginModal.style.visibility = 'hidden';
            loginModal.style.opacity = '0';
            
            console.log('✅ Modal removido da tela');
        } else {
            console.error('❌ Modal não encontrado!');
        }
        
        // Voltar para aba de login por padrão
        switchTab('login');
        
        // Atualizar estado de login na interface
        updateUserMenu();
        
        console.log('🎉 Processo de cadastro finalizado!');
    }, 1500); // Aguardar 1.5 segundos para mostrar a notificação
}

// Tornar função globalmente acessível
window.handleRegister = handleRegister;

// Função de teste para debug
window.testRegister = function() {
    console.log('🧪 Teste de função executada!');
    alert('JavaScript está funcionando! Teste concluído.');
};

// Função para atualizar menu do usuário após login
function updateUserMenu() {
    console.log('🔄 Atualizando menu do usuário...');
    
    const currentUser = JSON.parse(localStorage.getItem('ropeartlab_current_user'));
    const userIcon = document.querySelector('.user-icon');
    const userDropdown = document.getElementById('user-dropdown');
    
    console.log('📊 Estado atual:');
    console.log('   - Usuário logado:', currentUser ? `${currentUser.nome} (${currentUser.email})` : 'Nenhum');
    console.log('   - Ícone encontrado:', userIcon ? '✅' : '❌');
    console.log('   - Dropdown encontrado:', userDropdown ? '✅' : '❌');
    
    if (currentUser && userIcon) {
        // Mostrar dropdown do usuário se não estiver visível
        if (userDropdown) {
            userDropdown.style.display = 'block';
        }
        
        // Adicionar indicador visual de logado (mantém cor branca)
        userIcon.title = `Logado como: ${currentUser.nome || 'Usuário'}`;
        
        // Adicionar classe para CSS
        userIcon.classList.add('logged-in');
        
        console.log('✅ Menu atualizado - usuário logado:', currentUser.nome);
        
        // NÃO mostrar notificação automática - só quando necessário
        
    } else {
        // Se não há usuário logado, resetar estado
        if (userIcon) {
            userIcon.style.color = '';
            userIcon.title = 'Login/Cadastro';
            userIcon.classList.remove('logged-in');
        }
        
        console.log('ℹ️ Nenhum usuário logado');
    }
}

// Função para verificar login na inicialização (LOGOUT AUTOMÁTICO AO REFRESH)
function checkLoginStatus() {
    console.log('🔍 Verificando status de login...');
    
    // Verificar se foi logout manual (não mostrar notificação)
    const wasManualLogout = sessionStorage.getItem('isManualLogout');
    const isManualLogout = wasManualLogout !== null;
    
    if (isManualLogout) {
        sessionStorage.removeItem('isManualLogout');
        console.log('ℹ️ Último logout foi manual - não mostrando notificação');
    }
    
    // Sempre fazer logout ao carregar a página
    const currentUser = JSON.parse(localStorage.getItem('ropeartlab_current_user'));
    
    if (currentUser) {
        console.log('🔄 Refresh detectado - fazendo logout automático de:', currentUser.nome);
        
        // Fazer logout automático
        localStorage.removeItem('ropeartlab_current_user');
        
        // Notificar usuário sobre o logout (apenas se foi refresh automático)
        if (!wasManualLogout) {
            showNotification('Você foi deslogado ao atualizar a página. Faça login novamente.', 'info');
        }
        
        console.log('✅ Logout automático realizado após refresh');
    }
    
    // Garantir que não há dados visíveis
    const userIcon = document.querySelector('.user-icon');
    const userDropdown = document.getElementById('user-dropdown');
    
    if (userIcon) {
        userIcon.style.color = '';
        userIcon.title = 'Login/Cadastro';
        userIcon.classList.remove('logged-in');
    }
    
    if (userDropdown) {
        userDropdown.style.display = 'none';
    }
    
    console.log('📝 Página carregada - usuário não logado');
    return false;
}

// Função para fazer logout do usuário
window.logout = function() {
    const currentUser = JSON.parse(localStorage.getItem('ropeartlab_current_user'));
    
    if (!currentUser) {
        showNotification('Você não está logado!', 'warning');
        return;
    }
    
    console.log('👋 Fazendo logout manual do usuário:', currentUser.nome);
    
    // Marcar que é logout manual (não automático por refresh)
    sessionStorage.setItem('isManualLogout', 'true');
    
    // Remover usuário atual
    localStorage.removeItem('ropeartlab_current_user');
    
    // Limpar carrinho (opcional)
    localStorage.removeItem('cart');
    
    // Resetar interface do usuário
    const userIcon = document.querySelector('.user-icon');
    const userDropdown = document.getElementById('user-dropdown');
    
    if (userIcon) {
        userIcon.style.color = '';
        userIcon.title = 'Login/Cadastro';
        userIcon.classList.remove('logged-in');
    }
    
    if (userDropdown) {
        userDropdown.style.display = 'none';
    }
    
    // Mostrar notificação
    showNotification(`Até logo, ${currentUser.nome}! Logout realizado com sucesso.`, 'info');
    
    console.log('✅ Logout realizado com sucesso!');
};

// Função para processar login
window.handleLogin = function() {
    console.log('🚀 Função handleLogin chamada!');
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    console.log('📧 Tentando fazer login com:', email);
    
    // Limpar CPF/CNPJ para comparação (caso usuário insira CPF no campo email)
    const cleanEmail = email.replace(/[^\w@.-]/g, '');
    const cleanedInput = cleanCpfCnpj(email);
    console.log('🔍 Input limpo:', cleanedInput, '(tamanho:', cleanedInput.length, ')');
    
    // Verificar se é login do admin
    if (email === 'admin@gmail.com' && password === 'admin25') {
        console.log('👑 Login de administrador');
        // Salvar login do admin
        localStorage.setItem('admin_logged_in', 'true');
        
        // Limpar formulário
        document.getElementById('login-email').value = '';
        document.getElementById('login-password').value = '';
        
        showNotification('Login administrativo realizado com sucesso!', 'success');
        
        // Fechar modal
        setTimeout(() => {
            const loginModal = document.getElementById('login-modal');
            if (loginModal) {
                loginModal.style.display = 'none';
                loginModal.classList.remove('open');
            }
        }, 300);
        
        // Redirecionar para admin
        setTimeout(() => {
            window.location.href = 'admin.html';
        }, 600);
        return;
    }
    
    // Buscar usuário cadastrado na lista de usuários
    console.log('🔍 Verificando usuários cadastrados...');
    const users = JSON.parse(localStorage.getItem('ropeartlab_users') || '[]');
    console.log('📚 Total de usuários:', users.length);
    
    if (users.length === 0) {
        console.log('❌ Nenhum usuário cadastrado encontrado');
        showNotification('Nenhum usuário cadastrado encontrado! Cadastre-item primeiro.', 'error');
        return;
    }
    
    console.log('📋 Usuários disponíveis:');
    users.forEach((u, i) => console.log(`   ${i + 1}. ${u.email} / ${cleanCpfCnpj(u.cpf)} (${u.nome})`));
    
    // Buscar usuário por email OU CPF/CNPJ
    const user = users.find(u => {
        const userEmailMatch = u.email === email || u.email === cleanEmail;
        const userCpfMatch = cleanedInput.length > 0 && cleanCpfCnpj(u.cpf) === cleanedInput;
        const passwordMatch = u.senha === password;
        
        console.log(`🔍 Verificando usuário ${u.nome}:`);
        console.log(`   - Email match: ${userEmailMatch}`);
        console.log(`   - CPF match: ${userCpfMatch} (input: ${cleanedInput}, user: ${cleanCpfCnpj(u.cpf)})`);
        console.log(`   - Password match: ${passwordMatch}`);
        
        return (userEmailMatch || userCpfMatch) && passwordMatch;
    });
    
    if (user) {
        console.log('✅ Usuário encontrado:', user.nome);
        
        // Salvar como usuário atual
        localStorage.setItem('ropeartlab_current_user', JSON.stringify(user));
        
        // Limpar formulário
        document.getElementById('login-email').value = '';
        document.getElementById('login-password').value = '';
        
        console.log('👤 Usuário atual salvo:', user.email);
        
        showNotification(`Login realizado com sucesso! Bem-vindo(a), ${user.nome}!`, 'success');
        
        // Fechar modal após delay rápido
        setTimeout(() => {
            const loginModal = document.getElementById('login-modal');
            if (loginModal) {
                loginModal.style.display = 'none';
                loginModal.classList.remove('open');
            }
            
            // Atualizar menu do usuário
            updateUserMenu();
        }, 500);
        
        console.log('🎉 Login bem-sucedido!');
        return;
    }
    
    // Se não encontrou usuário
    console.log('❌ Email/CPF/CNPJ ou senha incorretos para:', email);
    showNotification('Email/CPF/CNPJ ou senha incorretos! Verifique os dados ou cadastre-item.', 'error');
};

// Função para abrir histórico de pedidos
window.openOrderHistory = function() {
    const currentUser = JSON.parse(localStorage.getItem('ropeartlab_current_user'));
    if (!currentUser) {
        showNotification('É necessário fazer login para ver o histórico de pedidos!', 'error');
        toggleLogin();
        return;
    }
    
    // Carregar pedidos do usuário
    const allOrders = JSON.parse(localStorage.getItem('ropeartlab_orders') || '[]');
    const userOrders = allOrders.filter(order => order.userEmail === currentUser.email);
    
    const orderList = document.getElementById('profile-order-list');
    const emptyOrders = document.getElementById('profile-empty-orders');
    
    if (userOrders.length === 0) {
        orderList.style.display = 'none';
        emptyOrders.style.display = 'block';
    } else {
        orderList.style.display = 'block';
        emptyOrders.style.display = 'none';
        
        orderList.innerHTML = userOrders.map(order => `
            <div class="order-item">
                <div class="order-header">
                    <div class="order-number">Pedido #${order.orderNumber}</div>
                    <div class="order-date">${new Date(order.date).toLocaleDateString('pt-BR')}</div>
                    <div class="order-status status-${order.status || 'pending'}">${getOrderStatusText(order.status || 'pending')}</div>
                </div>
                <div class="order-items">
                    ${order.items.map(item => `
                        <div class="order-item-detail">
                            <span class="item-name">${item.name}${item.size ? ` (${item.size})` : ''}</span>
                            <span class="item-quantity">Qtd: ${item.quantity}</span>
                            <span class="item-price">R$ ${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                    `).join('')}
                </div>
                <div class="order-total">
                    <strong>Total: R$ ${order.total.toFixed(2)}</strong>
                </div>
            </div>
        `).join('');
    }
    
    // Abrir modal de perfil na aba de histórico
    openEditProfile();
    switchProfileTab('history');
};

// Função para alternar abas do perfil
window.switchProfileTab = function(tabName) {
    // Remover active de todas as abas
    document.querySelectorAll('.profile-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Adicionar active à aba selecionada
    document.getElementById(`profile-${tabName}-tab`).classList.add('active');
    
    // Atualizar navegação
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    document.querySelector(`[onclick="switchProfileTab('${tabName}')"]`).classList.add('active');
};

// Função para obter texto do status
function getStatusText(status) {
    const statusMap = {
        'pending': 'Pendente',
        'processing': 'Processando',
        'completed': 'Concluído',
        'cancelled': 'Cancelado'
    };
    return statusMap[status] || 'Pendente';
}

// Função para abrir modal de edição de perfil
window.openEditProfile = function() {
    const currentUser = JSON.parse(localStorage.getItem('ropeartlab_current_user'));
    
    if (!currentUser) {
        showNotification('É necessário fazer login para acessar o perfil!', 'error');
        toggleLogin();
        return;
    }
    
    // Preencher formulário com dados do usuário atual
    document.getElementById('profile-nome').value = currentUser.nome || '';
    document.getElementById('profile-sobrenome').value = currentUser.sobrenome || '';
    
    // Format CPF/CNPJ for display
    const cpfCnpjClean = cleanCpfCnpj(currentUser.cpf || '');
    let formattedCpfCnpj = '';
    if (cpfCnpjClean.length === 11) {
        // CPF format: 000.000.000-00
        formattedCpfCnpj = cpfCnpjClean.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
    } else if (cpfCnpjClean.length === 14) {
        // CNPJ format: 00.000.000/0000-00
        formattedCpfCnpj = cpfCnpjClean.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
    } else {
        formattedCpfCnpj = currentUser.cpf || '';
    }
    document.getElementById('profile-cpf-cnpj').value = formattedCpfCnpj;
    document.getElementById('profile-cep').value = currentUser.cep || '';
    document.getElementById('profile-endereco').value = currentUser.endereco || '';
    document.getElementById('profile-numero').value = currentUser.numero || '';
    document.getElementById('profile-bairro').value = currentUser.bairro || '';
    document.getElementById('profile-cidade').value = currentUser.cidade || '';
    document.getElementById('profile-complemento').value = currentUser.complemento || '';
    document.getElementById('profile-email').value = currentUser.email || '';
    document.getElementById('profile-celular').value = currentUser.telefone || '';
    document.getElementById('profile-observacao').value = currentUser.observacao || '';
    
    // Mostrar modal de perfil
    const profileModal = document.getElementById('profile-modal');
    profileModal.style.display = 'flex';
    profileModal.classList.add('open');
    
    // Ir para aba de edição
    switchProfileTab('edit');
};

// Função para fechar modal de perfil
window.closeProfile = function() {
    const profileModal = document.getElementById('profile-modal');
    profileModal.style.display = 'none';
    profileModal.classList.remove('open');
};

// Função para processar edição de perfil
window.handleEditProfile = function(event) {
    event.preventDefault();
    
    const currentUser = JSON.parse(localStorage.getItem('ropeartlab_current_user'));
    if (!currentUser) {
        showNotification('Usuário não encontrado!', 'error');
        return;
    }
    
    const formData = new FormData(event.target);
    
    // Verificar senha atual
    const senhaAtual = formData.get('senha-atual');
    if (senhaAtual && senhaAtual !== currentUser.senha) {
        showNotification('Senha atual incorreta!', 'error');
        return;
    }
    
    // Verificar se novo email já existe (se mudou)
    const novoEmail = formData.get('email');
    if (novoEmail !== currentUser.email) {
        const users = JSON.parse(localStorage.getItem('ropeartlab_users') || '[]');
        const emailExists = users.some(user => user.email === novoEmail && user.id !== currentUser.id);
        
        if (emailExists) {
            showNotification('Este email já está sendo usado por outro usuário!', 'error');
            return;
        }
    }
    
    // Atualizar dados do usuário
    const updatedUser = {
        ...currentUser,
        nome: formData.get('nome'),
        sobrenome: formData.get('sobrenome'),
        email: novoEmail,
        telefone: formData.get('celular'),
        endereco: formData.get('endereco'),
        numero: formData.get('numero'),
        bairro: formData.get('bairro'),
        cidade: formData.get('cidade'),
        complemento: formData.get('complemento'),
        cep: formData.get('cep'),
        observacao: formData.get('observacao'),
        updatedAt: new Date().toISOString()
    };
    
    // Atualizar senha se fornecida
    const novaSenha = formData.get('nova-senha');
    if (novaSenha && novaSenha.trim() !== '') {
        updatedUser.senha = novaSenha;
    }
    
    // Salvar usuário atualizado
    localStorage.setItem('ropeartlab_current_user', JSON.stringify(updatedUser));
    
    // Atualizar na lista de usuários
    const users = JSON.parse(localStorage.getItem('ropeartlab_users') || '[]');
    const userIndex = users.findIndex(u => u.id === currentUser.id);
    if (userIndex !== -1) {
        users[userIndex] = updatedUser;
        localStorage.setItem('ropeartlab_users', JSON.stringify(users));
    }
    
    showNotification('Perfil atualizado com sucesso!', 'success');
    closeProfile();
};

// Função para excluir conta do usuário
window.deleteAccount = function() {
    const currentUser = JSON.parse(localStorage.getItem('ropeartlab_current_user'));
    
    if (!currentUser) {
        showNotification('Usuário não encontrado!', 'error');
        return;
    }
    
    const confirmMessage = `⚠️ ATENÇÃO: EXCLUSÃO DEFINITIVA DA CONTA ⚠️\n\n` +
                          `Você está prestes a excluir permanentemente sua conta.\n\n` +
                          `Esta ação irá excluir:\n` +
                          `• Todos os seus dados pessoais\n` +
                          `• Histórico completo de pedidos\n` +
                          `• Todas as informações salvas\n\n` +
                          `Uma vez excluída, sua conta não poderá ser recuperada!\n\n` +
                          `Cliente: ${currentUser.nome || ''} ${currentUser.sobrenome || ''}\n` +
                          `Email: ${currentUser.email || 'N/A'}\n` +
                          `CPF/CNPJ: ${currentUser.cpf || 'N/A'}\n\n` +
                          `Digite "EXCLUIR CONTA" para confirmar:`;
    
    const confirmation = prompt(confirmMessage);
    
    if (confirmation === 'EXCLUIR CONTA') {
        // Remover usuário da lista
        const users = JSON.parse(localStorage.getItem('ropeartlab_users') || '[]');
        const filteredUsers = users.filter(u => u.id !== currentUser.id);
        localStorage.setItem('ropeartlab_users', JSON.stringify(filteredUsers));
        
        // Remover pedidos do usuário
        const orders = JSON.parse(localStorage.getItem('ropeartlab_orders') || '[]');
        const filteredOrders = orders.filter(order => order.userEmail !== currentUser.email);
        localStorage.setItem('ropeartlab_orders', JSON.stringify(filteredOrders));
        
        // Limpar usuário atual
        localStorage.removeItem('ropeartlab_current_user');
        
        // Limpar carrinho
        localStorage.removeItem('cart');
        
        showNotification('Conta excluída permanentemente!', 'success');
        
        // Redirecionar após exclusão
        setTimeout(() => {
            window.location.reload();
        }, 2000);
        
    } else if (confirmation !== null) {
        showNotification('Exclusão cancelada.', 'info');
    }
};

// Função para mostrar notificação personalizada
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    // Converter quebras de linha do template string em <br>
    const formattedMessage = message.replace(/\n/g, '<br>');
    
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <div style="white-space: pre-line;">${formattedMessage}</div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Funções para busca automática de CEP
window.formatCEP = function(input) {
    let value = input.value.replace(/\D/g, '');
    
    if (value.length > 5) {
        value = value.replace(/^(\d{5})(\d)/, '$1-$2');
    }
    
    input.value = value;
    
    // Buscar automaticamente quando CEP estiver completo (8 dígitos)
    if (value.replace(/\D/g, '').length === 8) {
        setTimeout(() => {
            searchCEP();
        }, 500); // Aguardar 500ms após a digitação para evitar muitas requisições
    }
};

window.searchCEP = function() {
    const cepInput = document.getElementById('cep');
    const enderecoInput = document.getElementById('endereco');
    const bairroInput = document.getElementById('bairro');
    const cidadeInput = document.getElementById('cidade');
    const cepSearchBtn = document.querySelector('.cep-search-btn');
    
    if (!cepInput || !cepInput.value) {
        showNotification('Por favor, digite um CEP válido', 'error');
        return;
    }
    
    // Definir um botão padrão se não existir o real
    let actualBtn = cepSearchBtn;
    if (!actualBtn) {
        // Criar um botão temporário para controlar o estado
        actualBtn = { innerHTML: '', disabled: false };
    }
    
    // Limpar CEP - remover caracteres não numéricos
    const cep = cepInput.value.replace(/\D/g, '');
    
    // Validar CEP (deve ter 8 dígitos)
    if (cep.length !== 8) {
        showNotification('CEP deve conter 8 dígitos', 'error');
        return;
    }
    
    // Mostrar loading no botão
    const originalContent = actualBtn.innerHTML;
    actualBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    actualBtn.disabled = true;
    
    // Fazer requisição para ViaCEP
    fetch(`https://viacep.com.br/ws/${cep}/json/`)
        .then(response => response.json())
        .then(data => {
            if (data.erro) {
                // CEP não encontrado
                showNotification('CEP não encontrado. Preencha manualmente.', 'warning');
                
                // Limpar campos para preenchimento manual
                enderecoInput.value = '';
                if (bairroInput) bairroInput.value = '';
                if (cidadeInput) cidadeInput.value = '';
            } else {
                // CEP encontrado - preencher campos automaticamente
                if (enderecoInput) enderecoInput.value = data.logradouro || '';
                if (bairroInput) bairroInput.value = data.bairro || '';
                if (cidadeInput) cidadeInput.value = `${data.localidade} - ${data.uf}` || '';
                
                showNotification(`Endereço encontrado: ${data.logradouro}, ${data.bairro}, ${data.localidade}` , 'success');
                
                // Focar no próximo campo (número)
                const numeroInput = document.getElementById('numero');
                if (numeroInput) {
                    numeroInput.focus();
                }
            }
        })
        .catch(error => {
            console.error('Erro ao buscar CEP:', error);
            showNotification('Erro ao buscar CEP. Tente novamente ou preencha manualmente.', 'error');
        })
        .finally(() => {
            // Restaurar botão
            actualBtn.innerHTML = originalContent;
            actualBtn.disabled = false;
        });
};

// Função de busca de CEP para o perfil (reutiliza a mesma lógica)
window.searchProfileCEP = function() {
    const cepInput = document.getElementById('profile-cep');
    const enderecoInput = document.getElementById('profile-endereco');
    const bairroInput = document.getElementById('profile-bairro');
    const cidadeInput = document.getElementById('profile-cidade');
    const cepSearchBtn = document.querySelector('.cep-search-btn');
    
    if (!cepInput || !cepInput.value) {
        showNotification('Por favor, digite um CEP válido', 'error');
        return;
    }
    
    // Definir um botão padrão se não existir o real
    let actualBtn = cepSearchBtn;
    if (!actualBtn) {
        // Criar um botão temporário para controlar o estado
        actualBtn = { innerHTML: '', disabled: false };
    }
    
    // Limpar CEP - remover caracteres não numéricos
    const cep = cepInput.value.replace(/\D/g, '');
    
    // Validar CEP (deve ter 8 dígitos)
    if (cep.length !== 8) {
        showNotification('CEP deve conter 8 dígitos', 'error');
        return;
    }
    
    // Mostrar loading no botão
    const originalContent = actualBtn.innerHTML;
    actualBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    actualBtn.disabled = true;
    
    // Fazer requisição para ViaCEP
    fetch(`https://viacep.com.br/ws/${cep}/json/`)
        .then(response => response.json())
        .then(data => {
            if (data.erro) {
                // CEP não encontrado
                showNotification('CEP não encontrado. Preencha manualmente.', 'warning');
                
                // Limpar campos para preenchimento manual
                if (enderecoInput) enderecoInput.value = '';
                if (bairroInput) bairroInput.value = '';
                if (cidadeInput) cidadeInput.value = '';
            } else {
                // CEP encontrado - preencher campos automaticamente
                if (enderecoInput) enderecoInput.value = data.logradouro || '';
                if (bairroInput) bairroInput.value = data.bairro || '';
                if (cidadeInput) cidadeInput.value = data.localidade || '';
                
                showNotification(`Endereço encontrado: ${data.logradouro}, ${data.bairro}, ${data.localidade}`, 'success');
                
                // Focar no próximo campo (número)
                const numeroInput = document.getElementById('profile-numero');
                if (numeroInput) {
                    numeroInput.focus();
                }
            }
        })
        .catch(error => {
            console.error('Erro ao buscar CEP:', error);
            showNotification('Erro ao buscar CEP. Tente novamente ou preencha manualmente.', 'error');
        })
        .finally(() => {
            // Restaurar botão
            actualBtn.innerHTML = originalContent;
            actualBtn.disabled = false;
        });
};


// Fecha modais ao clicar fora do conteúdo
window.onclick = function(event) {
    const editModal = document.getElementById('edit-profile-modal');
    const orderModal = document.getElementById('order-history-modal');
    
    if (event.target === editModal) {
        editModal.style.display = 'none';
        editModal.classList.remove('open');
        document.body.style.overflow = '';
    }
    if (event.target === orderModal) {
        orderModal.style.display = 'none';
        orderModal.classList.remove('open');
        document.body.style.overflow = '';
    }
};