/* mobile-admin/sales/create/sales-create.js */

let cart = [];

document.addEventListener('DOMContentLoaded', async () => {
    if(typeof loadMobileHeader === 'function') await loadMobileHeader();
    
    try {
        const resp = await fetch('/mobile-admin/components/bottom-nav/bottom-nav.html');
        if(resp.ok) document.getElementById('bottom-nav-container').innerHTML = await resp.text();
    } catch(e) {}

    // Fecha
    const dateStr = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
    document.getElementById('sale-date').textContent = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);

    // Inicializar datos
    await loadInitialData();
    setupSearch();
    setupCartActions();
});

async function loadInitialData() {
    // 1. Clientes
    const customersRes = await mobileApi.getCustomers();
    const select = document.getElementById('customer-select');
    select.innerHTML = '<option value="" disabled selected>Seleccionar Cliente...</option>';
    
    if (customersRes.success) {
        customersRes.data.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.id;
            opt.textContent = c.full_name;
            select.appendChild(opt);
        });
    }

    // 2. Métodos de Pago
    const pmRes = await mobileApi.getPaymentMethods();
    const pmSelect = document.getElementById('payment-method');
    if (pmRes.success && pmRes.data.length > 0) {
        pmSelect.innerHTML = '';
        pmRes.data.forEach(pm => {
            const opt = document.createElement('option');
            opt.value = pm.id;
            opt.textContent = pm.name;
            pmSelect.appendChild(opt);
        });
    }
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
            renderSearchResults(res.data || []);
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
        container.innerHTML = '<div style="padding:12px; color:#666; text-align:center;">No encontrado</div>';
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
window.updateQty = updateQty; // Exponer

function renderCart() {
    const container = document.getElementById('cart-items-container');
    const countEl = document.getElementById('cart-count');
    const totalEl = document.getElementById('footer-total');
    const btnCheckout = document.getElementById('btn-checkout');

    countEl.textContent = cart.reduce((acc, item) => acc + item.qty, 0);
    container.innerHTML = '';

    if (cart.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>Tu carrito está vacío</p>
            </div>
        `;
        totalEl.textContent = 'S/. 0.00';
        btnCheckout.disabled = true;
        return;
    }

    let total = 0;
    cart.forEach((item, index) => {
        total += item.price * item.qty;
        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `
            <div class="item-info">
                <div class="item-title">${item.name}</div>
                <div class="item-price">S/. ${item.price.toFixed(2)} x ${item.qty}</div>
            </div>
            <div class="item-actions">
                <button class="qty-btn" onclick="updateQty(${index}, -1)">-</button>
                <div class="qty-val">${item.qty}</div>
                <button class="qty-btn" onclick="updateQty(${index}, 1)">+</button>
            </div>
        `;
        container.appendChild(div);
    });

    totalEl.textContent = `S/. ${total.toFixed(2)}`;
    btnCheckout.disabled = false;
    btnCheckout.onclick = handleCheckout;
}

// --- GUARDAR VENTA ---
async function handleCheckout() {
    const customerId = document.getElementById('customer-select').value;
    const paymentMethodId = document.getElementById('payment-method').value;
    const btn = document.getElementById('btn-checkout');

    if (!customerId) {
        alert('Por favor selecciona un cliente');
        return;
    }

    btn.disabled = true;
    btn.textContent = 'Procesando...';

    const total = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
    
    // Obtener ID usuario (si auth-utils.js guarda user_id, úsalo, sino null o mock)
    // Aquí asumimos que auth-utils o login guardaron algo, o enviamos null
    const userId = null; 

    const result = await mobileApi.createSale({
        customerId: customerId,
        paymentMethodId: paymentMethodId,
        total: total,
        userId: userId
    });

    if (result.success) {
        alert('¡Venta realizada con éxito!');
        cart = [];
        renderCart();
        btn.textContent = 'Confirmar Venta';
    } else {
        alert('Error al guardar: ' + result.error);
        btn.disabled = false;
        btn.textContent = 'Confirmar Venta';
    }
}

// Botón limpiar
function setupCartActions() {
    document.getElementById('btn-clear-cart').addEventListener('click', () => {
        if(cart.length > 0 && confirm('¿Vaciar carrito?')) {
            cart = [];
            renderCart();
        }
    });
}