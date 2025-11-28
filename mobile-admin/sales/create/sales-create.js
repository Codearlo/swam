/* mobile-admin/sales/create/sales-create.js */

let cart = [];
// Mock de productos para demo (En producción usar api.searchProducts)
const productsMock = [
    { id: 101, name: "Mouse Gamer Logitech G502", price: 189.90, stock: 12 },
    { id: 102, name: "Teclado Mecánico Redragon", price: 240.00, stock: 5 },
    { id: 103, name: "Monitor Samsung 24 Curvo", price: 650.00, stock: 2 },
    { id: 104, name: "Cable HDMI 2.0 2m", price: 25.00, stock: 50 },
    { id: 105, name: "Silla Gamer Ergonómica", price: 899.00, stock: 0 }
];

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Cargar Componentes
    if(typeof loadMobileHeader === 'function') await loadMobileHeader();
    await loadBottomNav();

    // 2. Fecha
    const options = { weekday: 'long', day: 'numeric', month: 'long' };
    const dateStr = new Date().toLocaleDateString('es-ES', options);
    document.getElementById('sale-date').textContent = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);

    // 3. Inicializar Lógica
    loadCustomers();
    setupSearch();
    setupCartActions();
});

async function loadBottomNav() {
    try {
        const resp = await fetch('../../components/bottom-nav/bottom-nav.html');
        if(resp.ok) document.getElementById('bottom-nav-container').innerHTML = await resp.text();
    } catch(e) { console.error(e); }
}

// --- CLIENTES ---
function loadCustomers() {
    const select = document.getElementById('customer-select');
    // Mock
    const customers = [
        { id: 1, name: "Cliente General" },
        { id: 2, name: "Juan Pérez (DNI)" },
        { id: 3, name: "Empresa SAC (RUC)" }
    ];
    customers.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = c.name;
        select.appendChild(opt);
    });
}

// --- BUSCADOR ---
function setupSearch() {
    const input = document.getElementById('product-search');
    const resultsBox = document.getElementById('search-results');

    input.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase().trim();
        if (term.length < 2) {
            resultsBox.classList.add('u-hidden');
            return;
        }

        const found = productsMock.filter(p => p.name.toLowerCase().includes(term));
        renderSearchResults(found);
    });

    // Cerrar al hacer click fuera
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
        // Deshabilitar visualmente si no hay stock
        const noStock = p.stock <= 0;
        if(noStock) div.style.opacity = '0.5';

        div.innerHTML = `
            <div>
                <div class="result-name">${p.name}</div>
                <div class="result-stock">${noStock ? 'Sin Stock' : 'Stock: ' + p.stock}</div>
            </div>
            <div class="result-price">S/. ${p.price.toFixed(2)}</div>
        `;
        
        if(!noStock) {
            div.addEventListener('click', () => {
                addToCart(p);
                document.getElementById('product-search').value = '';
                container.classList.add('u-hidden');
            });
        }
        
        container.appendChild(div);
    });
    container.classList.remove('u-hidden');
}

// --- CARRITO ---
function setupCartActions() {
    document.getElementById('btn-clear-cart').addEventListener('click', () => {
        if(cart.length > 0 && confirm('¿Vaciar carrito?')) {
            cart = [];
            renderCart();
        }
    });
}

function addToCart(product) {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
        // Validar stock real aquí si fuera necesario
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

// Exponer globalmente para onclick en HTML generado
window.updateQty = updateQty;

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
                <div class="empty-icon-bg">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
                </div>
                <p style="color:#a1a1aa; font-size:0.9rem;">Tu carrito está vacío</p>
            </div>
        `;
        totalEl.textContent = 'S/. 0.00';
        btnCheckout.disabled = true;
        btnCheckout.textContent = 'Confirmar Venta';
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

    const totalFormatted = `S/. ${total.toFixed(2)}`;
    totalEl.textContent = totalFormatted;
    btnCheckout.textContent = `Cobrar ${totalFormatted}`;
    btnCheckout.disabled = false;
}