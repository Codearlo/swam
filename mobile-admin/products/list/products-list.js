/* mobile-admin/products/list/products-list.js */

let currentPage = 1;
let currentSearch = '';
let currentFilter = 'active'; 
let productsSubscription = null;

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Cargar Header y Navbar
    if(typeof loadMobileHeader === 'function') await loadMobileHeader();
    
    try {
        const resp = await fetch('/mobile-admin/components/bottom-nav/bottom-nav.html');
        if(resp.ok) {
            document.getElementById('bottom-nav-container').innerHTML = await resp.text();
            
            const activeLink = document.getElementById('nav-products');
            if (activeLink) activeLink.classList.add('is-active');
            
            // Botón central apunta a Crear Producto
            const mainBtn = document.querySelector('.bottom-nav-item--main');
            if (mainBtn) {
                mainBtn.href = '../create/products-create.html'; 
                mainBtn.setAttribute('aria-label', 'Agregar Nuevo Producto');
            }
        }
    } catch(e) { console.error('Error loading nav', e); }

    // 2. Listeners de UI
    setupTabs();
    setupSearch();

    // 3. Cargar Datos
    await loadProducts();

    // 4. Realtime
    if (typeof mobileApi !== 'undefined' && mobileApi.subscribeToProducts) {
        productsSubscription = mobileApi.subscribeToProducts(() => {
            loadProducts(true); 
        });
    }
});

// Limpieza
window.addEventListener('beforeunload', () => {
    if (productsSubscription && typeof supabaseClient !== 'undefined') {
        supabaseClient.removeChannel(productsSubscription);
    }
});

function setupTabs() {
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(btn => {
        btn.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            currentPage = 1;
            loadProducts();
        });
    });
}

function setupSearch() {
    const input = document.getElementById('search-input');
    if(!input) return;
    
    let debounce;
    input.addEventListener('input', (e) => {
        clearTimeout(debounce);
        debounce = setTimeout(() => {
            currentSearch = e.target.value.trim();
            currentPage = 1;
            loadProducts();
        }, 400);
    });
}

async function loadProducts(isBackgroundUpdate = false) {
    const container = document.getElementById('products-list-container');
    
    if (!container) return;

    if (!isBackgroundUpdate) {
        container.innerHTML = '<div class="u-flex-center" style="padding:40px"><div class="spin" style="width:24px;height:24px;border:2px solid #fff;border-top-color:transparent;border-radius:50%"></div></div>';
    }

    try {
        // Verificación crítica para evitar "Error inesperado" por caché
        if (typeof mobileApi === 'undefined' || typeof mobileApi.getProducts !== 'function') {
            throw new Error("La API no está cargada correctamente. Intenta recargar la página (F5 o borrar caché).");
        }

        const res = await mobileApi.getProducts(currentPage, 20, currentSearch, currentFilter);

        if (isBackgroundUpdate) container.innerHTML = '';

        if (!res.success) {
            // Muestra el error REAL que viene de la base de datos
            container.innerHTML = `<div style="text-align:center; padding:20px; color:#ef4444">
                <p style="font-weight:bold; margin-bottom:5px;">Error de Datos</p>
                <small>${res.error || 'Error desconocido'}</small>
            </div>`;
            return;
        }

        if (!res.data || res.data.length === 0) {
            container.innerHTML = `<div style="text-align:center; padding:60px 20px; color:#52525b; font-size:0.9rem">No se encontraron productos</div>`;
            return;
        }

        if (!isBackgroundUpdate) container.innerHTML = '';

        res.data.forEach(p => {
            const priceStr = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(p.suggested_price || 0);
            
            let stockClass = 'stock-high';
            let stockText = `${p.stock} unid.`;
            if (p.stock <= 0) { stockClass = 'stock-none'; stockText = 'Agotado'; }
            else if (p.stock < 5) { stockClass = 'stock-low'; stockText = `${p.stock} unid. (Bajo)`; }

            const card = document.createElement('div'); // Cambiado a div para evitar click accidental si no hay link
            card.className = 'product-card';
            
            // Animación suave
            if(isBackgroundUpdate) card.style.animation = 'fadeIn 0.3s ease';

            const imgHtml = p.image_url 
                ? `<img src="${p.image_url}" alt="${p.name}" class="product-thumb" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                   <div class="product-image-box" style="display:none; width:100%; height:100%; border:none;"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg></div>`
                : `<div class="product-image-box" style="width:100%; height:100%; border:none;"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg></div>`;

            card.innerHTML = `
                <div class="product-image-box">
                    ${imgHtml}
                </div>
                <div class="product-details">
                    <h4 class="product-name">${p.name}</h4>
                    <div style="display:flex; gap:6px; align-items:center;">
                        <span class="product-sku" style="opacity:0.7">${p.brand || 'Generico'}</span>
                    </div>
                    <div class="stock-badge ${stockClass}">
                        <span style="width:6px;height:6px;border-radius:50%;background:currentColor;display:inline-block;margin-right:4px;"></span>
                        ${stockText}
                    </div>
                </div>
                <div class="product-right">
                    <span class="product-price">${priceStr}</span>
                    <div class="status-dot ${p.is_active ? 'is-active' : 'is-inactive'}"></div>
                </div>
            `;
            container.appendChild(card);
        });

    } catch (e) {
        console.error(e);
        // Muestra el error de JS en pantalla para saber qué pasó
        if(!isBackgroundUpdate) {
            container.innerHTML = `<div style="text-align:center; padding:20px; color:#ef4444; word-break: break-word;">
                <p style="font-weight:bold">Error del Sistema</p>
                <small>${e.message}</small>
            </div>`;
        }
    }
}