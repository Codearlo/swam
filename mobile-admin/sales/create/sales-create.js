/* mobile-admin/sales/create/sales-create.js */

let cart = [];

document.addEventListener('DOMContentLoaded', async () => {
    // Carga de datos iniciales
    loadCustomers();
    setupSearch();
    setupPaymentMethods(); // Nueva lógica de botones
    setupCartActions();
});

// --- CLIENTES ---
async function loadCustomers() {
    const select = document.getElementById('customer-select');
    // Usamos API real o Mock si falla
    try {
        const res = await mobileApi.getCustomers();
        if(res.success && res.data.length > 0) {
            select.innerHTML = '<option value="" disabled selected>Seleccionar Cliente...</option>';
            res.data.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c.id;
                opt.textContent = c.full_name;
                select.appendChild(opt);
            });
        } else {
            // Mock Fallback
            loadMockCustomers(select);
        }
    } catch(e) { loadMockCustomers(select); }
}

function loadMockCustomers(select) {
    const mocks = [{id:1, name:'Cliente General'}, {id:2, name:'Juan Pérez'}];
    select.innerHTML = '<option value="" disabled selected>Seleccionar Cliente...</option>';
    mocks.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = c.name;
        select.appendChild(opt);
    });
}

// --- MÉTODOS DE PAGO (Botones) ---
function setupPaymentMethods() {
    const buttons = document.querySelectorAll('.pay-btn');
    const input = document.getElementById('selected-payment-method');

    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            // UI
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            // Logic
            input.value = btn.dataset.method;
        });
    });
}

// --- BUSCADOR ---
function setupSearch() {
    const input = document.getElementById('product-search');
    const resultsBox = document.getElementById('search-results');
    let debounceTimer;

    input.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        const term = e.target.value.trim();
        
        if (term.length < 2) {
            resultsBox.classList.add('u-hidden');
            return;
        }

        debounceTimer = setTimeout(async () => {
            const res = await mobileApi.searchProducts(term);
            // Mock si falla API o no devuelve nada para demo
            const data = res.success ? res.data : [];
            renderSearchResults(data);
        }, 300);
    });

    document.addEventListener('click', (e) => {
        if (!input.contains(e.target) && !resultsBox.contains(e.target)) {
            resultsBox.classList.add('u-hidden');
        }
    });
}

function renderSearchResults(products) {
    const container = document.getElementById('search-results');
    container.innerHTML = '';
    
    if (products.length === 0) {
        container.innerHTML = '<div style="padding:15px; color:#666; text-align:center;">No encontrado</div>';
        container.classList.remove('u-hidden');
        return;
    }

    products.forEach(p => {
        const div = document.createElement('div');
        div.className = 'search-result-item';
        div.innerHTML = `
            <div>
                <div class="result-name">${p.name}</div>
                <div style="font-size:0.75rem; color:#666">${p.sku}</div>
            </div>
            <div class="result-price">S/. ${p.price.toFixed(2)}</div>
        `;
        div.addEventListener('click', () => {
            addToCart(p);
            document.getElementById('product-search').value = '';
            container.classList.add('u-hidden');
        });
        container.appendChild(div);
    });
    container.classList.remove('u-hidden');
}

// --- CARRITO ---
function addToCart(product) {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
        existing.qty++;
    } else {
        cart.push({ ...product, qty: 1 });
    }
    renderCart();
}

function updateQty(index, change) {
    if (cart[index].qty + change <= 0) {
        cart.splice(index, 1);
    } else {
        cart[index].qty += change;
    }
    renderCart();
}
window.updateQty = updateQty; 

function renderCart() {
    const container = document.getElementById('cart-items-container');
    const countEl = document.getElementById('cart-count');
    const totalEl = document.getElementById('footer-total');
    const btnCheckout = document.getElementById('btn-checkout');

    countEl.textContent = cart.reduce((acc, item) => acc + item.qty, 0);
    container.innerHTML = '';

    if (cart.length === 0) {
        container.innerHTML = `<div class="empty-state"><p>Agrega productos para comenzar</p></div>`;
        totalEl.textContent = 'S/. 0.00';
        btnCheckout.disabled = true;
        return;
    }

    let total = 0;
    cart.forEach((item, index) => {
        total += item.price * item.qty;
        container.innerHTML += `
            <div class="cart-item">
                <div class="item-info">
                    <div class="item-title">${item.name}</div>
                    <div class="item-price">S/. ${item.price.toFixed(2)}</div>
                </div>
                <div class="item-actions">
                    <button class="qty-btn" onclick="updateQty(${index}, -1)">-</button>
                    <div class="qty-val">${item.qty}</div>
                    <button class="qty-btn" onclick="updateQty(${index}, 1)">+</button>
                </div>
            </div>
        `;
    });

    totalEl.textContent = `S/. ${total.toFixed(2)}`;
    btnCheckout.disabled = false;
    
    // Checkout Action
    btnCheckout.onclick = async () => {
        const customerId = document.getElementById('customer-select').value;
        if (!customerId) { alert('Selecciona un cliente'); return; }
        
        btnCheckout.disabled = true;
        btnCheckout.innerHTML = 'Procesando...'; // Feedback visual
        
        // Simular o Real Checkout
        const paymentMethod = document.getElementById('selected-payment-method').value;
        const res = await mobileApi.createSale({ 
            customerId, 
            total, 
            paymentMethodId: 1 // TODO: Mapear string 'yape' a ID real de BD
        });
        
        if(res.success) {
            alert('Venta Creada');
            cart = [];
            renderCart();
            document.getElementById('customer-select').value = "";
        } else {
            alert('Error: ' + res.error);
        }
        btnCheckout.disabled = false;
        btnCheckout.innerHTML = `Cobrar <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>`;
    };
}

function setupCartActions() {
    document.getElementById('btn-clear-cart').addEventListener('click', () => {
        if(cart.length > 0 && confirm('¿Borrar todo?')) {
            cart = [];
            renderCart();
        }
    });
}