/* mobile-admin/sales/create/sales-create.js */

let cart = [];
let allCustomers = [];

document.addEventListener('DOMContentLoaded', async () => {
    await fetchCustomers(); 
    setupCustomerSearch();  
    setupProductSearch();   
    setupPaymentMethods();
    setupCartActions();
    renderCart();
});

async function fetchCustomers() {
    try {
        const res = await mobileApi.getCustomers(1, 100); // Traemos más registros por defecto
        if(res.success) {
            // FILTRO ADICIONAL: Solo mostrar ACTIVOS en el dropdown de ventas
            allCustomers = res.data.filter(c => c.is_active !== false);
        } else {
            allCustomers = [];
        }
    } catch(e) { console.error(e); }
}

function setupCustomerSearch() {
    const input = document.getElementById('customer-search-input');
    const dropdown = document.getElementById('customer-dropdown');
    const hiddenId = document.getElementById('selected-customer-id');

    input.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        if (term.length === 0) {
            dropdown.classList.add('u-hidden');
            return;
        }
        const filtered = allCustomers.filter(c => c.full_name.toLowerCase().includes(term));
        renderCustomerOptions(filtered);
    });

    input.addEventListener('focus', () => {
        // Al hacer focus, mostramos todos los disponibles (que ya están filtrados por activo arriba)
        if(input.value.trim() === '') renderCustomerOptions(allCustomers);
    });

    document.addEventListener('click', (e) => {
        if (!input.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.classList.add('u-hidden');
        }
    });
}

function renderCustomerOptions(customers) {
    const dropdown = document.getElementById('customer-dropdown');
    const input = document.getElementById('customer-search-input');
    const hiddenId = document.getElementById('selected-customer-id');
    
    dropdown.innerHTML = '';
    
    if (customers.length === 0) {
        dropdown.innerHTML = '<div style="padding:15px; color:#666;">No encontrado</div>';
    } else {
        customers.forEach(c => {
            const div = document.createElement('div');
            div.className = 'dropdown-item';
            div.textContent = c.full_name;
            div.addEventListener('click', () => {
                input.value = c.full_name;
                hiddenId.value = c.id;
                dropdown.classList.add('u-hidden');
            });
            dropdown.appendChild(div);
        });
    }
    dropdown.classList.remove('u-hidden');
}

function setupProductSearch() {
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
            renderProductResults(res.data || []);
        }, 300);
    });

    document.addEventListener('click', (e) => {
        if (!input.contains(e.target) && !resultsBox.contains(e.target)) {
            resultsBox.classList.add('u-hidden');
        }
    });
}

function renderProductResults(products) {
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
        div.innerHTML = `<div><div class="result-name">${p.name}</div><div style="font-size:0.75rem; color:#666">${p.sku}</div></div><div class="result-price">S/. ${p.price.toFixed(2)}</div>`;
        div.addEventListener('click', () => {
            addToCart(p);
            document.getElementById('product-search').value = '';
            container.classList.add('u-hidden');
        });
        container.appendChild(div);
    });
    container.classList.remove('u-hidden');
}

function addToCart(product) {
    const existing = cart.find(item => item.id === product.id);
    if (existing) { existing.qty++; } else { cart.push({ ...product, qty: 1 }); }
    renderCart();
}

function updateQty(index, change) {
    if (cart[index].qty + change <= 0) { cart.splice(index, 1); } else { cart[index].qty += change; }
    renderCart();
}
window.updateQty = updateQty; 

function renderCart() {
    const container = document.getElementById('cart-items-container');
    const countEl = document.getElementById('cart-count');
    const totalEl = document.getElementById('footer-total');
    const btnCheckout = document.getElementById('btn-checkout');
    const btnClear = document.getElementById('btn-clear-cart');

    countEl.textContent = cart.reduce((acc, item) => acc + item.qty, 0);
    container.innerHTML = '';

    if (cart.length === 0) {
        container.innerHTML = `<div class="empty-state"><p>Agrega productos para comenzar</p></div>`;
        totalEl.textContent = 'S/. 0.00';
        btnCheckout.disabled = true;
        if(btnClear) btnClear.disabled = true;
        return;
    }

    if(btnClear) btnClear.disabled = false;

    let total = 0;
    cart.forEach((item, index) => {
        total += item.price * item.qty;
        container.innerHTML += `
            <div class="cart-item">
                <div class="item-info"><div class="item-title">${item.name}</div><div class="item-price">S/. ${item.price.toFixed(2)}</div></div>
                <div class="item-actions">
                    <button class="qty-btn" onclick="updateQty(${index}, -1)">-</button><div class="qty-val">${item.qty}</div><button class="qty-btn" onclick="updateQty(${index}, 1)">+</button>
                </div>
            </div>`;
    });

    totalEl.textContent = `S/. ${total.toFixed(2)}`;
    btnCheckout.disabled = false;
    
    btnCheckout.onclick = async () => {
        const customerId = document.getElementById('selected-customer-id').value;
        if (!customerId) { alert('Selecciona un cliente de la lista'); return; }
        
        btnCheckout.disabled = true;
        btnCheckout.innerHTML = 'Procesando...'; 
        
        const paymentMethod = document.getElementById('selected-payment-method').value;
        let pmId = 1; 
        if (paymentMethod === 'card') pmId = 2;
        if (paymentMethod === 'yape') pmId = 3;

        const res = await mobileApi.createSale({ 
            customerId, total, paymentMethodId: pmId, userId: null 
        });
        
        if(res.success) {
            alert('Venta Creada');
            cart = [];
            renderCart();
            document.getElementById('customer-search-input').value = "";
            document.getElementById('selected-customer-id').value = "";
        } else {
            alert('Error: ' + res.error);
        }
        btnCheckout.disabled = false;
        btnCheckout.innerHTML = `Cobrar <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>`;
    };
}

function setupPaymentMethods() {
    const buttons = document.querySelectorAll('.pay-btn');
    const input = document.getElementById('selected-payment-method');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            input.value = btn.dataset.method;
        });
    });
}

function setupCartActions() {
    document.getElementById('btn-clear-cart').addEventListener('click', () => {
        if(cart.length > 0 && confirm('¿Vaciar carrito?')) {
            cart = [];
            renderCart();
        }
    });
}