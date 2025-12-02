/* mobile-admin/sales/list/sales-list.js */

let allSales = []; 

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Cargar Header Superior
    if(typeof loadMobileHeader === 'function') {
        await loadMobileHeader();
    }
    
    // 2. Cargar Barra de Navegación Inferior
    try {
        const resp = await fetch('/mobile-admin/components/bottom-nav/bottom-nav.html');
        if(resp.ok) {
            document.getElementById('bottom-nav-container').innerHTML = await resp.text();
            // Marcar icono activo
            document.getElementById('nav-sales')?.classList.add('is-active');
        }
    } catch(e) { console.error(e); }

    // 3. Inicializar lógica de página
    setupFilters();
    setupSearch();
    loadSalesHistory();
});

async function loadSalesHistory() {
    const container = document.getElementById('sales-list-container');
    
    // Verificación de seguridad
    if (typeof mobileApi === 'undefined') {
        container.innerHTML = `<div style="text-align:center; padding:20px; color:#ef4444;">Error: API no cargada</div>`;
        return;
    }

    // Spinner de carga
    container.innerHTML = '<div class="u-flex-center" style="padding:40px"><div class="spin" style="width:24px;height:24px;border:2px solid #fff;border-top-color:transparent;border-radius:50%"></div></div>';

    const response = await mobileApi.getSalesHistory(1, 50);
    
    if (response.success) {
        allSales = response.data;
        renderList(allSales);
    } else {
        container.innerHTML = `
            <div class="u-flex-center" style="flex-direction:column; padding:40px 0; color:#ef4444; text-align:center;">
                <p>Error al cargar datos</p>
                <small style="opacity:0.7; font-size:0.8rem">${response.error}</small>
            </div>`;
    }
}

function renderList(data) {
    const container = document.getElementById('sales-list-container');
    
    if (!data || data.length === 0) {
        container.innerHTML = `
            <div class="u-flex-center" style="flex-direction:column; padding:60px 0; color:#52525b; text-align:center;">
                <p>No se encontraron ventas</p>
            </div>`;
        return;
    }

    container.innerHTML = data.map(sale => {
        let dateStr = '-';
        if (sale.date) {
            const dateObj = new Date(sale.date);
            if (!isNaN(dateObj.getTime())) {
                dateStr = dateObj.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', hour: '2-digit', minute:'2-digit' });
            }
        }
        
        const amountStr = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(sale.amount);

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
                        <span style="opacity:0.5">•</span>
                        <span>${dateStr}</span>
                    </div>
                </div>
            </div>
            <div class="sale-card-right">
                <div class="sale-amount">${amountStr}</div>
                <span class="status-badge status-completed">Completado</span>
            </div>
        </div>
        `;
    }).join('');
}

function setupFilters() {
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(btn => {
        btn.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            btn.classList.add('active');
            
            const filter = btn.dataset.filter;
            const now = new Date();
            let filtered = [...allSales];

            if (filter === 'today') {
                filtered = allSales.filter(s => {
                    const d = new Date(s.date);
                    return d.getDate() === now.getDate() && 
                           d.getMonth() === now.getMonth() && 
                           d.getFullYear() === now.getFullYear();
                });
            } else if (filter === 'month') {
                filtered = allSales.filter(s => {
                    const d = new Date(s.date);
                    return d.getMonth() === now.getMonth() && 
                           d.getFullYear() === now.getFullYear();
                });
            }
            renderList(filtered);
        });
    });
}

function setupSearch() {
    const input = document.getElementById('search-input');
    if(input) {
        input.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase().trim();
            if (!term) {
                renderList(allSales);
                return;
            }
            const filtered = allSales.filter(s => 
                (s.customer && s.customer.toLowerCase().includes(term)) || 
                (s.code && s.code.toLowerCase().includes(term))
            );
            renderList(filtered);
        });
    }
}