/* mobile-admin/sales/create/sales-create.js */

document.addEventListener('DOMContentLoaded', async () => {
    // Estado del carrito
    const cart = {
        items: [],
        total: 0,
        customerId: null,
        paymentMethodId: null
    };

    // Elementos DOM
    const productSearchInput = document.getElementById('productSearch');
    const searchResultsContainer = document.getElementById('searchResults');
    const cartItemsContainer = document.getElementById('cartItems');
    const totalAmountEl = document.getElementById('totalAmount');
    const checkoutBtn = document.getElementById('checkoutBtn');
    
    // Inicialización
    init();

    async function init() {
        // Cargar métodos de pago por defecto (opcional)
        const pmResponse = await mobileApi.getPaymentMethods();
        if (pmResponse.success && pmResponse.data.length > 0) {
            cart.paymentMethodId = pmResponse.data[0].id; // Seleccionar el primero por defecto
        }

        setupEventListeners();
        renderCart();
    }

    function setupEventListeners() {
        // Buscador de productos
        let debounceTimer;
        if (productSearchInput) {
            productSearchInput.addEventListener('input', (e) => {
                const term = e.target.value.trim();
                clearTimeout(debounceTimer);
                
                if (term.length < 2) {
                    searchResultsContainer.style.display = 'none';
                    return;
                }

                debounceTimer = setTimeout(async () => {
                    await searchProducts(term);
                }, 400);
            });
        }

        // Botón Cobrar
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', handleCheckout);
        }
    }

    async function searchProducts(term) {
        const response = await mobileApi.searchProducts(term);
        
        if (response.success && response.data.length > 0) {
            renderSearchResults(response.data);
        } else {
            searchResultsContainer.innerHTML = '<div class="p-3 text-center text-muted">No se encontraron productos</div>';
            searchResultsContainer.style.display = 'block';
        }
    }

    function renderSearchResults(products) {
        const html = products.map(p => `
            <div class="search-item" onclick='addToCart(${JSON.stringify(p).replace(/'/g, "&#39;")})'>
                <div class="item-info">
                    <span class="item-name">${p.name}</span>
                    <span class="item-sku">${p.sku || ''}</span>
                </div>
                <div class="item-price">$${p.price.toFixed(2)}</div>
            </div>
        `).join('');

        searchResultsContainer.innerHTML = html;
        searchResultsContainer.style.display = 'block';
    }

    // Función global para añadir al carrito
    window.addToCart = (product) => {
        const existing = cart.items.find(i => i.id === product.id);
        
        if (existing) {
            existing.qty += 1;
        } else {
            cart.items.push({ ...product, qty: 1 });
        }
        
        // Limpiar búsqueda
        if (productSearchInput) productSearchInput.value = '';
        searchResultsContainer.style.display = 'none';
        
        updateCartTotal();
        renderCart();
    };

    window.removeFromCart = (index) => {
        cart.items.splice(index, 1);
        updateCartTotal();
        renderCart();
    };

    window.updateQty = (index, delta) => {
        const item = cart.items[index];
        const newQty = item.qty + delta;
        
        if (newQty <= 0) {
            removeFromCart(index);
        } else {
            item.qty = newQty;
            updateCartTotal();
            renderCart();
        }
    };

    function updateCartTotal() {
        cart.total = cart.items.reduce((sum, item) => sum + (item.price * item.qty), 0);
        if (totalAmountEl) totalAmountEl.textContent = `$${cart.total.toFixed(2)}`;
        
        // Actualizar estado del botón
        if (checkoutBtn) {
            checkoutBtn.disabled = cart.items.length === 0;
            checkoutBtn.style.opacity = cart.items.length === 0 ? '0.5' : '1';
        }
    }

    function renderCart() {
        if (!cartItemsContainer) return;

        if (cart.items.length === 0) {
            cartItemsContainer.innerHTML = `
                <div class="empty-cart-state">
                    <p>El carrito está vacío</p>
                    <small>Busca productos para agregar</small>
                </div>`;
            return;
        }

        const html = cart.items.map((item, index) => `
            <div class="cart-item">
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-price">$${item.price.toFixed(2)} x ${item.qty}</div>
                </div>
                <div class="cart-item-controls">
                    <button class="qty-btn" onclick="updateQty(${index}, -1)">-</button>
                    <span class="qty-val">${item.qty}</span>
                    <button class="qty-btn" onclick="updateQty(${index}, 1)">+</button>
                </div>
                <div class="cart-item-total">
                    $${(item.price * item.qty).toFixed(2)}
                </div>
            </div>
        `).join('');

        cartItemsContainer.innerHTML = html;
    }

    async function handleCheckout() {
        if (cart.items.length === 0) return;
        if (isLoading) return;

        const confirm = window.confirm(`¿Confirmar venta por $${cart.total.toFixed(2)}?`);
        if (!confirm) return;

        // Mostrar loading en botón
        const originalText = checkoutBtn.innerText;
        checkoutBtn.innerText = 'Procesando...';
        checkoutBtn.disabled = true;
        isLoading = true;

        try {
            // Construir payload
            const saleData = {
                total: cart.total,
                customerId: cart.customerId, // Null = Cliente General
                paymentMethodId: cart.paymentMethodId,
                items: cart.items.map(i => ({ 
                    product_id: i.id, 
                    quantity: i.qty, 
                    unit_price: i.price 
                }))
            };

            const result = await mobileApi.createSale(saleData);

            if (result.success) {
                alert('Venta realizada con éxito!');
                // Reiniciar carrito
                cart.items = [];
                updateCartTotal();
                renderCart();
                // Opcional: Redirigir a historial
                // window.location.href = '../list/sales-list.html';
            } else {
                alert('Error al crear venta: ' + result.error);
            }
        } catch (e) {
            console.error(e);
            alert('Error inesperado');
        } finally {
            checkoutBtn.innerText = originalText;
            checkoutBtn.disabled = false;
            isLoading = false;
        }
    }
    
    // Variable flag para evitar doble submit
    let isLoading = false;
});