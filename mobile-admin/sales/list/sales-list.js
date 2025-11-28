/* mobile-admin/sales/list/sales-list.js */

let allSales = []; // Almacén local para filtrar rápido

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Cargar Componentes
    if(typeof loadMobileHeader === 'function') await loadMobileHeader();
    
    try {
        const resp = await fetch('../../components/bottom-nav/bottom-nav.html');
        if(resp.ok) {
            document.getElementById('bottom-nav-container').innerHTML = await resp.text();
            document.getElementById('nav-sales')?.classList.add('is-active');
        }
    } catch(e) { console.error(e); }

    // 2. Event Listeners
    setupFilters();
    setupSearch();

    // 3. Cargar Datos
    loadSalesHistory();
});

// --- LÓGICA DE DATOS ---
async function loadSalesHistory() {
    const container = document.getElementById('sales-list-container');
    
    // Obtener datos reales de la API
    // Usamos getSalesList(page, size, filters)
    // Para simplificar móvil, pedimos las ultimas 20 sin filtros complejos iniciales
    const response = await api.getSalesList(1, 20);
    
    if (response.success && response.data.length > 0) {
        allSales = response.data;
    } else {
        // Datos Mock para demostración si no hay datos reales o API falla
        console.warn("Usando datos Mock para demostración");
        allSales = [
            { code: "V-2045", customer: "Juan Pérez", amount: 180.00, date: new Date().toISOString(), status: "completed" },
            { code: "V-2044", customer: "Maria Garcia", amount: 250.50, date: new Date().toISOString(), status: "completed" },
            { code: "V-2043", customer: "Cliente General", amount: 45.00, date: new Date(Date.now() - 86400000).toISOString(), status: "completed" }, // Ayer
            { code: "V-2042", customer: "Empresa SAC", amount: 1200.00, date: "2023-11-20", status: "pending" },
            { code: "V-2041", customer: "Carlos Ruiz", amount: 85.00, date: "2023-11-15", status: "completed" }
        ];
    }

    renderList(allSales);
}

function renderList(data) {
    const container = document.getElementById('sales-list-container');
    
    if (data.length === 0) {
        container.innerHTML = `
            <div class="u-flex-center" style="flex-direction:column; padding:40px 0; color:#666; text-align:center;">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom:10px; opacity:0.5"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
                <p>No se encontraron ventas</p>
            </div>`;
        return;
    }

    container.innerHTML = data.map(sale => {
        // Formateo de fecha simple
        const dateObj = new Date(sale.date);
        const dateStr = isNaN(dateObj.getTime()) ? sale.date : dateObj.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', hour: '2-digit', minute:'2-digit' });
        
        // Estilo de estado
        const statusClass = sale.status === 'pending' ? 'status-pending' : 'status-completed';
        const statusText = sale.status === 'pending' ? 'Pendiente' : 'Completado';

        return `
        <div class="sale-card-item">
            <div class="sale-card-left">
                <div class="sale-icon-box">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
                </div>
                <div class="sale-details">
                    <h4 class="sale-customer">${sale.customer}</h4>
                    <div class="sale-meta">
                        <span>${sale.code}</span>
                        <span>•</span>
                        <span>${dateStr}</span>
                    </div>
                </div>
            </div>
            <div class="sale-card-right">
                <div class="sale-amount">S/. ${parseFloat(sale.amount).toFixed(2)}</div>
                <span class="status-badge ${statusClass}">${statusText}</span>
            </div>
        </div>
        `;
    }).join('');
}

// --- FILTROS Y BUSQUEDA ---
function setupFilters() {
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(btn => {
        btn.addEventListener('click', () => {
            // UI Update
            tabs.forEach(t => t.classList.remove('active'));
            btn.classList.add('active');
            
            // Logic Update (Simulado)
            const filter = btn.dataset.filter; // today, week, month
            filterData(filter);
        });
    });
}

function filterData(timeFilter) {
    // Filtrado simple en cliente para demo
    const now = new Date();
    let filtered = allSales;

    if (timeFilter === 'today') {
        filtered = allSales.filter(s => {
            const d = new Date(s.date);
            return d.getDate() === now.getDate() && d.getMonth() === now.getMonth();
        });
    } 
    // Week/Month implementation simplified...
    
    renderList(filtered);
}

function setupSearch() {
    const input = document.getElementById('search-input');
    input.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const filtered = allSales.filter(s => 
            s.customer.toLowerCase().includes(term) || 
            s.code.toLowerCase().includes(term)
        );
        renderList(filtered);
    });
}