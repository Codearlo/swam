/* mobile-admin/sales/create/sales-create.js */

let cart = [];
let allCustomers = [];
let paymentMethods = [];

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Intentar cargar componentes de navegación si existen contenedores
    // (Nota: En sales-create.html el header suele estar hardcodeado en el HTML, 
    // pero si usas uno dinámico, descomenta la siguiente línea)
    // if(typeof loadMobileHeader === 'function') await loadMobileHeader();

    // 2. Cargar Datos Iniciales
    await Promise.all([loadCustomers(), loadPaymentMethods()]);
    
    // 3. Setup UI
    setupFloatingDropdown('customer-wrapper', 'customer-dropdown');
    setupFloatingDropdown('product-wrapper', 'product-results');
    
    setupCustomerSearch();
    setupProductSearch();
    setupPaymentLogic();
    setupCartLogic();
    setupCheckout();
    
    renderCart(); 
});

// --- UTILS ---
function setupFloatingDropdown(wrapperId, dropdownId) {
    const wrapper = document.getElementById(wrapperId);
    const dropdown = document.getElementById(dropdownId);
    if (!wrapper || !dropdown) return;

    document.body.appendChild(dropdown);
    dropdown.classList.add('dropdown-portal');

    const positionDropdown = () => {
        const rect = wrapper.getBoundingClientRect();
        dropdown.style.top = `${rect.bottom + 5}px`;
        dropdown.style.left = `${rect.left}px`;
        dropdown.style.width = `${rect.width}px`;
    };

    const input = wrapper.querySelector('input');
    if(input) {
        input.addEventListener('focus', () => {
            if(input.value.trim().length > 0 || dropdown.children.length > 0) {
                positionDropdown();
                dropdown.classList.remove('u-hidden');
            }
        });
        input.addEventListener('input', () => positionDropdown());
    }
}

document.addEventListener('click', (e) => {
    if (!e.target.closest('.custom-select-container') && !e.target.closest('.dropdown-portal')) {
        document.querySelectorAll('.dropdown-portal').forEach(d => d.classList.add('u-hidden'));
    }
});

// --- DATA LOGIC ---
async function loadCustomers() {
    if(typeof mobileApi === 'undefined') return;
    const res = await mobileApi.getCustomers(1, 100, '', true);
    if(res.success) allCustomers = res.data;
}

async function loadPaymentMethods() {
    if(typeof mobileApi === 'undefined') return;
    const res = await mobileApi.getPaymentMethods();
    if(res.success && res.data.length > 0) {
        paymentMethods = res.data;
    }
}

function setupCustomerSearch() {
    const input = document.getElementById('customer_input');
    const dropdown = document.getElementById('customer-dropdown');
    const hiddenId = document.getElementById('customer_id');

    input.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const filtered = allCustomers.filter(c => c.full_name.toLowerCase().includes(term));
        
        dropdown.innerHTML = '';
        if (filtered.length === 0) {
            dropdown.classList.add('u-hidden');
            return;
        }

        filtered.forEach(c => {
            const div = document.createElement('div');
            div.className = 'dropdown-option';
            div.textContent = c.full_name;
            div.onclick = () => {
                input.value = c.full_name;
                hiddenId.value = c.id;
                dropdown.classList.add('u-hidden');
            };
            dropdown.appendChild(div);
        });
        dropdown.classList.remove('u-hidden');
    });
}

function setupProductSearch() {
    const input = document.getElementById('product_input');
    const dropdown = document.getElementById('product-results');
    let debounce;

    input.addEventListener('input', (e) => {
        clearTimeout(debounce);
        const term = e.target.value.trim();
        
        if (term.length < 2) {
            dropdown.classList.add('u-hidden');
            return;
        }

        debounce = setTimeout(async () => {
            const res = await mobileApi.searchProducts(term);
            dropdown.innerHTML = '';
            
            if (res.success && res.data.length > 0) {
                res.data.forEach(p => {
                    const div = document.createElement('div');
                    div.className = 'search-result-item';
                    div.innerHTML = `
                        <div class="result-info">
                            <span class="result-name">${p.name}</span>
                            <span class="result-sku">SKU: ${p.sku}</span>
                        </div>
                        <span class="result-price">S/. ${p.price.toFixed(2)}</span>
                    `;
                    div.onclick = () => {
                        addToCart(p);
                        input.value = ''; 
                        dropdown.classList.add('u-hidden');
                    };
                    dropdown.appendChild(div);
                });
                dropdown.classList.remove('u-hidden');
            } else {
                dropdown.classList.add('u-hidden');
            }
        }, 300);
    });
}

// --- CART LOGIC ---
function addToCart(product) {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
        existing.qty++;
    } else {
        cart.push({ ...product, qty: 1 });
    }
    renderCart();
    if(typeof showToast === 'function') showToast(`${product.name} agregado`, 'success');
}

function updateQty(index, change) {
    if (cart[index].qty + change <= 0) {
        cart.splice(index, 1);
    } else {
        cart[index].qty += change;
    }
    renderCart();
}

function renderCart() {
    const container = document.getElementById('cart-items-container');
    const countEl = document.getElementById('cart-count');
    const totalEl = document.getElementById('footer-total');
    const btnCheckout = document.getElementById('btn-checkout');
    const btnClear = document.getElementById('btn-clear-cart');

    let totalQty = 0;
    let totalPrice = 0;

    container.innerHTML = '';

    cart.forEach((item, index) => {
        totalQty += item.qty;
        totalPrice += item.price * item.qty;

        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `
            <div class="item-info">
                <div class="item-title">${item.name}</div>
                <div class="item-price">S/. ${item.price.toFixed(2)} x ${item.qty}</div>
            </div>
            <div class="item-actions">
                <button class="qty-btn remove-one">-</button>
                <div class="qty-val">${item.qty}</div>
                <button class="qty-btn add-one">+</button>
            </div>
        `;
        
        div.querySelector('.remove-one').onclick = () => updateQty(index, -1);
        div.querySelector('.add-one').onclick = () => updateQty(index, 1);
        
        container.appendChild(div);
    });

    if (cart.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
                </div>
                <p>Busca productos para agregarlos</p>
            </div>`;
    }

    countEl.textContent = totalQty;
    totalEl.textContent = `S/. ${totalPrice.toFixed(2)}`;
    
    btnCheckout.disabled = cart.length === 0;
    if(btnClear) btnClear.disabled = cart.length === 0;
}

function setupCartLogic() {
    const btnClear = document.getElementById('btn-clear-cart');
    if(btnClear) {
        btnClear.addEventListener('click', () => {
            if(cart.length > 0 && confirm('¿Vaciar carrito?')) {
                cart = [];
                renderCart();
            }
        });
    }
}

function setupPaymentLogic() {
    const buttons = document.querySelectorAll('.pay-btn');
    const input = document.getElementById('selected-payment-method');
    
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            input.value = btn.dataset.id;
        });
    });
}

function setupCheckout() {
    const btn = document.getElementById('btn-checkout');
    
    btn.addEventListener('click', async () => {
        const customerId = document.getElementById('customer_id').value;
        const paymentMethodId = document.getElementById('selected-payment-method').value;
        
        if (!customerId) {
            if(typeof showToast === 'function') showToast('Selecciona un cliente', 'error');
            document.getElementById('customer_input').focus();
            return;
        }

        if (cart.length === 0) return;

        btn.disabled = true;
        btn.innerHTML = 'Procesando...';

        const total = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);

        const payload = {
            customerId: customerId,
            paymentMethodId: paymentMethodId,
            total: total,
            items: cart 
        };

        try {
            const res = await mobileApi.createSale(payload);
            
            if (res.success) {
                if(typeof showToast === 'function') showToast('¡Venta Exitosa!', 'success');
                cart = [];
                renderCart();
                document.getElementById('customer_input').value = '';
                document.getElementById('customer_id').value = '';
            } else {
                if(typeof showToast === 'function') showToast('Error al procesar venta', 'error');
            }
        } catch (error) {
            console.error(error);
            if(typeof showToast === 'function') showToast('Error de conexión', 'error');
        } finally {
            btn.disabled = false;
            btn.innerHTML = `Confirmar Venta <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>`;
            if(cart.length === 0) btn.disabled = true;
        }
    });
}