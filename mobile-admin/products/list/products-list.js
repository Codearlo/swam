/* mobile-admin/products/list/products-list.js */

let currentPage = 1;
let currentSearch = '';
let currentFilter = 'active'; 
let productsSubscription = null;

// Evento para refrescar al volver (back button)
window.addEventListener('pageshow', (event) => {
    // Si la página se restauró desde la caché (bfcache), recargamos
    if (event.persisted) {
        loadProducts(true);
    }
});

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Cargar Header
    if(typeof loadMobileHeader === 'function') await loadMobileHeader();
    
    // 2. Cargar Bottom Nav y ACTIVAR EL ICONO DE PRODUCTOS
    try {
        const resp = await fetch('/mobile-admin/components/bottom-nav/bottom-nav.html');
        if(resp.ok) {
            document.getElementById('bottom-nav-container').innerHTML = await resp.text();
            
            // Activar icono "Productos"
            const activeLink = document.getElementById('nav-products');
            if (activeLink) activeLink.classList.add('is-active');
            
            // Reconfigurar botón central (+) para ir a Crear Producto
            const mainBtn = document.querySelector('.bottom-nav-item--main');
            if (mainBtn) {
                mainBtn.href = '../create/products-create.html'; 
                mainBtn.setAttribute('aria-label', 'Agregar Nuevo Producto');
            }
            
            // Configurar menú lateral
            const menuBtn = document.getElementById('mobile-menu-trigger');
            if(menuBtn) {
                menuBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const sidebar = document.querySelector('.admin-sidebar'); // Si usas sidebar móvil
                    if(sidebar) sidebar.classList.add('is-open');
                });
            }
        }
    } catch(e) { console.error('Error loading nav', e); }

    // 3. Listeners
    setupTabs();
    setupSearch();

    // 4. Cargar Datos
    await loadProducts();

    // 5. Suscripción Realtime (Actualización automática)
    if (typeof mobileApi !== 'undefined' && mobileApi.subscribeToProducts) {
        productsSubscription = mobileApi.subscribeToProducts(() => {
            loadProducts(true); // Recarga silenciosa
        });
    }
});

// Limpiar suscripción al salir
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

    // Spinner solo si no es actualización de fondo
    if (!isBackgroundUpdate) {
        container.innerHTML = '<div class="u-flex-center" style="padding:40px"><div class="spin" style="width:24px;height:24px;border:2px solid #fff;border-top-color:transparent;border-radius:50%"></div></div>';
    }

    try {
        if (typeof mobileApi === 'undefined' || typeof mobileApi.getProducts !== 'function') {
            throw new Error("API no inicializada");
        }

        const res = await mobileApi.getProducts(currentPage, 20, currentSearch, currentFilter);

        // Limpiar para renderizar
        if (isBackgroundUpdate) container.innerHTML = '';

        if (!res.success) {
            container.innerHTML = `<div style="text-align:center; padding:20px; color:#ef4444">Error al cargar datos</div>`;
            return;
        }

        if (!res.data || res.data.length === 0) {
            container.innerHTML = `<div style="text-align:center; padding:60px 20px; color:#52525b; font-size:0.9rem">No se encontraron productos</div>`;
            return;
        }

        if (!isBackgroundUpdate) container.innerHTML = '';

        res.data.forEach(p => {
            const priceStr = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(p.suggested_price || 0);
            
            // Lógica de Stock
            let stockClass = 'stock-high';
            let stockText = `${p.stock} unid.`;
            
            if (p.stock <= 0) { stockClass = 'stock-none'; stockText = 'Agotado'; }
            else if (p.stock < 5) { stockClass = 'stock-low'; stockText = `${p.stock} (Bajo)`; }
            else if (p.stock < 10) { stockClass = 'stock-medium'; }

            // Crear Tarjeta (Link a Editar)
            const card = document.createElement('a');
            card.className = 'product-card';
            card.href = `../edit/products-edit.html?id=${p.id}`;
            
            if(isBackgroundUpdate) card.style.animation = 'fadeIn 0.3s ease';

            // Manejo de imagen
            const imgHtml = p.image_url 
                ? `<img src="${p.image_url}" alt="${p.name}" class="product-thumb" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                   <div class="product-image-box" style="display:none; border:none; width:100%; height:100%;"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg></div>`
                : `<div class="product-image-box" style="border:none; width:100%; height:100%;"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg></div>`;

            card.innerHTML = `
                <div class="product-image-box">${imgHtml}</div>
                
                <div class="product-details">
                    <h4 class="product-name">${p.name}</h4>
                    <span class="product-brand">${p.brand || 'Generico'}</span>
                    
                    <div class="stock-badge ${stockClass}">
                        <span class="stock-dot"></span>
                        ${stockText}
                    </div>
                </div>
                
                <div class="product-right">
                    <span class="product-price">${priceStr}</span>
                    <span class="status-indicator ${p.is_active ? 'active' : ''}">
                        ${p.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                </div>
            `;
            container.appendChild(card);
        });

    } catch (e) {
        console.error(e);
        if(!isBackgroundUpdate) {
            container.innerHTML = `<div style="text-align:center; padding:20px; color:#ef4444">Error: ${e.message}</div>`;
        }
    }
}