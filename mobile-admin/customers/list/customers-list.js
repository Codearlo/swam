/* mobile-admin/customers/list/customers-list.js */

let currentPage = 1;
let currentSearch = '';
let currentFilter = 'active'; // 'active' (Activos) o 'all' (Todos)

// --- SOLUCIÓN AL PROBLEMA DE REFRESCO ---
// Usamos 'pageshow' en lugar de solo DOMContentLoaded.
// Esto detecta cuando el usuario regresa a esta página usando el botón "Atrás" del navegador
// y fuerza la recarga de la lista para mostrar los cambios recientes (como eliminaciones).
window.addEventListener('pageshow', (event) => {
    // Si la página ya estaba cargada en memoria (cache del navegador), recargamos los clientes
    // O si es la primera carga, también funciona.
    loadCustomers();
});

document.addEventListener('DOMContentLoaded', () => {
    setupTabs();
    setupSearch();
    // loadCustomers() se llama automáticamente por el evento pageshow de arriba,
    // pero lo dejamos aquí por seguridad para navegadores antiguos.
    loadCustomers();
});

function setupTabs() {
    // Seleccionamos por atributo data-filter para evitar errores de ID null
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
    
    // Actualizar estilos visuales (Clase .active)
    const allTabs = document.querySelectorAll('.tab-btn');
    allTabs.forEach(btn => {
        if (btn.dataset.filter === tab) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // Reiniciar y recargar lista
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

    // Spinner de carga
    listContainer.innerHTML = '<div class="u-flex-center" style="padding:40px"><div class="spin" style="width:24px;height:24px;border:2px solid #fff;border-top-color:transparent;border-radius:50%"></div></div>';

    // Lógica de filtro para la API
    const onlyActive = (currentFilter === 'active');
    
    // Llamada a la API
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
        // Al hacer click, lleva al detalle (donde ahora está el botón de borrar)
        div.href = `../detail/customers-detail.html?id=${c.id}`;
        
        // Determinar estado y estilos
        const isActive = c.is_active !== false; 
        const statusClass = isActive ? 'status-active' : 'status-inactive';
        const statusText = isActive ? 'ACTIVO' : 'INACTIVO';

        // --- CAMBIO: SE ELIMINÓ EL BOTÓN DE BORRAR DE AQUÍ ---
        // Ahora toda la tarjeta es clickeable para ir al detalle.

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
