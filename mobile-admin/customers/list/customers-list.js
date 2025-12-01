/* mobile-admin/customers/list/customers-list.js */

let currentPage = 1;
let currentSearch = '';
let currentFilter = 'active'; 
let isDeleting = false;

// Refrescar lista al volver atrás (Solución Zombie)
window.addEventListener('pageshow', (event) => {
    loadCustomers();
});

document.addEventListener('DOMContentLoaded', async () => {
    // --- 1. CARGA DE INTERFAZ (RESTITUÍDO) ---
    
    // Cargar Header Superior
    if(typeof loadMobileHeader === 'function') {
        await loadMobileHeader();
    }
    
    // Cargar Barra de Navegación Inferior
    try {
        const resp = await fetch('/mobile-admin/components/bottom-nav/bottom-nav.html');
        if(resp.ok) {
            const navContainer = document.getElementById('bottom-nav-container');
            if (navContainer) {
                navContainer.innerHTML = await resp.text();
                // Marcar pestaña activa
                document.getElementById('nav-customers')?.classList.add('is-active');
                
                // Configurar botón central (+)
                const mainBtn = document.querySelector('.bottom-nav-item--main');
                if(mainBtn) {
                    // Si es un link 'a', poner href, si es button, manejar click
                    if(mainBtn.tagName === 'A') {
                        mainBtn.href = '/mobile-admin/customers/create/customers-create.html';
                    } else {
                        mainBtn.onclick = () => window.location.href = '/mobile-admin/customers/create/customers-create.html';
                    }
                }
            }
        }
    } catch(e) { console.error('Error cargando menú', e); }

    // --- 2. LÓGICA DE LA LISTA ---
    setupTabs();
    setupSearch();
    loadCustomers();
});

function setupTabs() {
    const btnActive = document.querySelector('.tab-btn[data-filter="active"]');
    const btnAll = document.querySelector('.tab-btn[data-filter="all"]');

    if (btnActive) {
        btnActive.addEventListener('click', () => {
            if (currentFilter === 'active') return;
            setActiveTab('active');
        });
    }

    if (btnAll) {
        btnAll.addEventListener('click', () => {
            if (currentFilter === 'all') return;
            setActiveTab('all');
        });
    }
}

function setActiveTab(tab) {
    currentFilter = tab;
    
    const allTabs = document.querySelectorAll('.tab-btn');
    allTabs.forEach(btn => {
        if (btn.dataset.filter === tab) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    currentPage = 1;
    loadCustomers();
}

function setupSearch() {
    const input = document.getElementById('search-input'); 
    let debounce;
    
    if (!input) return; 

    input.addEventListener('input', (e) => {
        clearTimeout(debounce);
        debounce = setTimeout(() => {
            currentSearch = e.target.value.trim();
            currentPage = 1;
            loadCustomers();
        }, 400);
    });
}

async function loadCustomers() {
    const listContainer = document.getElementById('customers-list-container');
    if (!listContainer) return;

    listContainer.innerHTML = '<div class="u-flex-center" style="padding:40px"><div class="spin" style="width:24px;height:24px;border:2px solid #fff;border-top-color:transparent;border-radius:50%"></div></div>';

    // Si filtro es 'active', onlyActive=true. Si es 'all', onlyActive=false.
    const onlyActive = (currentFilter === 'active');
    
    const res = await mobileApi.getCustomers(currentPage, 20, currentSearch, onlyActive);

    listContainer.innerHTML = '';

    if (!res.success) {
        listContainer.innerHTML = `<div style="text-align:center; padding:20px; color:#ef4444">Error al cargar</div>`;
        return;
    }

    if (!res.data || res.data.length === 0) {
        listContainer.innerHTML = `<div style="text-align:center; padding:40px; color:#666">No hay clientes</div>`;
        return;
    }

    res.data.forEach(c => {
        const div = document.createElement('a');
        div.className = 'customer-card';
        div.href = `../detail/customers-detail.html?id=${c.id}`;
        
        const isActive = c.is_active !== false; 
        const statusClass = isActive ? 'status-active' : 'status-inactive';
        const statusText = isActive ? 'ACTIVO' : 'INACTIVO';

        div.innerHTML = `
            <div class="customer-card-left">
                <div class="customer-icon-box">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                </div>
                <div class="customer-details">
                    <h4 class="customer-name">${c.full_name}</h4>
                    <div class="customer-meta">
                        <span>${c.document_number || 'S/DNI'}</span>
                    </div>
                </div>
            </div>
            
            <div class="customer-card-right" style="display:flex; align-items:center; gap:8px;">
                <span class="status-badge ${statusClass}">${statusText}</span>
            </div>
        `;
        listContainer.appendChild(div);
    });
}