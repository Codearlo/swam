/* mobile-admin/customers/list/customers-list.js */

let allCustomers = []; // Cache local

document.addEventListener('DOMContentLoaded', async () => {
    if(typeof loadMobileHeader === 'function') await loadMobileHeader();
    
    try {
        const resp = await fetch('/mobile-admin/components/bottom-nav/bottom-nav.html');
        if(resp.ok) {
            document.getElementById('bottom-nav-container').innerHTML = await resp.text();
            document.getElementById('nav-customers')?.classList.add('is-active');
            const mainBtn = document.querySelector('.bottom-nav-item--main');
            if(mainBtn) {
                mainBtn.href = '/mobile-admin/customers/create/customers-create.html';
                mainBtn.setAttribute('aria-label', 'Nuevo Cliente');
            }
        }
    } catch(e) { console.error(e); }

    // 3. Inits
    setupFilters();
    loadCustomers();
    
    const input = document.getElementById('search-input');
    let debounceTimer;
    input.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => filterCustomers(e.target.value), 300);
    });
});

async function loadCustomers() {
    const container = document.getElementById('customers-list-container');
    
    // Llamada API (Trae todos para filtrado local rápido)
    const res = await mobileApi.getCustomers(1, 100, '');
    
    if(res.success) {
        allCustomers = res.data;
        renderList(allCustomers);
    } else {
        container.innerHTML = `
            <div class="u-flex-center" style="flex-direction:column; padding:40px 0; color:#ef4444; text-align:center;">
                <p>Error al cargar clientes</p>
                <small style="opacity:0.7; font-size:0.8rem">${res.error}</small>
            </div>`;
    }
}

function renderList(data) {
    const container = document.getElementById('customers-list-container');
    
    if (!data || data.length === 0) {
        container.innerHTML = `
            <div class="u-flex-center" style="flex-direction:column; padding:60px 0; color:#52525b; text-align:center;">
                <p>No se encontraron clientes</p>
            </div>`;
        return;
    }

    // NUEVA ESTRUCTURA HTML (Similar a Ventas)
    container.innerHTML = data.map(c => {
        // Estado mockeado si no existe en DB
        const isActive = c.is_active !== false; 
        const statusClass = isActive ? 'status-active' : 'status-inactive';
        const statusText = isActive ? 'Activo' : 'Inactivo';

        return `
        <a href="../detail/customers-detail.html?id=${c.id}" class="customer-card">
            <div class="customer-card-left">
                <div class="customer-icon-box">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                </div>
                <div class="customer-details">
                    <h4 class="customer-name">${c.full_name}</h4>
                    <div class="customer-meta">
                        <span>${c.document_type || 'DOC'}: ${c.document_number || '---'}</span>
                    </div>
                </div>
            </div>
            <div class="customer-card-right">
                <span class="status-badge ${statusClass}">${statusText}</span>
            </div>
        </a>
        `;
    }).join('');
}

// --- FILTROS ---
function setupFilters() {
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(btn => {
        btn.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            btn.classList.add('active');
            const filter = btn.dataset.filter;
            
            let filtered = [...allCustomers];
            if (filter === 'active') {
                filtered = allCustomers.filter(c => c.is_active !== false);
            }
            // Add more filters here if needed
            
            renderList(filtered);
            // Limpiar buscador al cambiar filtro
            document.getElementById('search-input').value = '';
        });
    });
}

function filterCustomers(term) {
    term = term.toLowerCase();
    const filtered = allCustomers.filter(c => 
        c.full_name.toLowerCase().includes(term) || 
        (c.document_number && c.document_number.includes(term))
    );
    renderList(filtered);
}