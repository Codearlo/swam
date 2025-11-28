/* mobile-admin/dashboard/dashboard.js */

document.addEventListener('DOMContentLoaded', async () => {
    await Promise.all([
        loadMobileHeader(),
        loadBottomNav()
    ]);

    if (typeof isAuthenticated === 'function' && !isAuthenticated()) {
        window.location.href = '../../public/auth/login/login.html';
        return;
    }

    // --- Configurar Título del Mes (Sección de Abajo) ---
    const dateOptions = { month: 'long' };
    const monthName = new Date().toLocaleDateString('es-ES', dateOptions);
    const monthCapitalized = monthName.charAt(0).toUpperCase() + monthName.slice(1);
    
    const monthTitle = document.getElementById('month-section-title');
    if(monthTitle) monthTitle.textContent = `Resumen de ${monthCapitalized}`;

    await loadDashboardData();
});

async function loadBottomNav() {
    try {
        const navContainer = document.getElementById('bottom-nav-container');
        if (navContainer) {
            const resp = await fetch('../components/bottom-nav/bottom-nav.html');
            if (resp.ok) {
                navContainer.innerHTML = await resp.text();
                document.getElementById('nav-dashboard')?.classList.add('is-active');
            }
        }
    } catch(e) { console.error('Error loading nav', e); }
}

async function loadDashboardData() {
    if (typeof api === 'undefined') return;

    // --- A. Métricas Generales ---
    try {
        const metricsData = await api.getDashboardData();
        if (metricsData.success) {
            const dailySales = metricsData.dailySales || 0;
            
            // 1. ARRIBA (Hero): Ventas de HOY
            updateText('hero-daily-sales', formatMoney(dailySales));

            // 2. ABAJO (Grid): Resumen del MES (Simulado con daily * 30 o lógica de acumulado)
            // En un escenario real, la API debería devolver 'monthlySales'
            let monthlySales = dailySales; // Placeholder si es el primer día
            
            // Truco visual para demo: Si el diario es > 0, asumimos un acumulado mayor
            if (dailySales > 0) {
                monthlySales = dailySales * 1; // Aquí iría el valor real acumulado
            }

            updateText('kpi-monthly-sales', formatMoney(monthlySales));
            updateText('kpi-orders', metricsData.activeOrders || '0');
        }
    } catch (e) { console.error(e); }

    // --- B. Listas ---
    await loadLists();
}

async function loadLists() {
    // Ventas Recientes
    const salesListEl = document.getElementById('recent-sales-list');
    try {
        const salesResponse = await api.getRecentSales(3);
        salesListEl.innerHTML = ''; 
        if (salesResponse.success && salesResponse.data.length > 0) {
            
            // Lógica visual: Sumar ventas recientes al acumulado mensual para realismo en demo
            let totalVisual = salesResponse.data.reduce((acc, curr) => acc + curr.amount, 0);
            // Actualizamos la tarjeta del MES (abajo)
            updateText('kpi-monthly-sales', formatMoney(totalVisual)); 

            salesListEl.innerHTML = salesResponse.data.map(sale => `
                <div class="list-item">
                    <div class="sale-info">
                        <span class="sale-code">${sale.code}</span>
                        <span class="sale-customer">${sale.customer}</span>
                    </div>
                    <div class="sale-amount">+ ${formatMoney(sale.amount)}</div>
                </div>
            `).join('');
        } else {
            salesListEl.innerHTML = '<div style="text-align:center; color:#444; padding:15px; font-size:0.8rem;">Sin ventas recientes</div>';
        }
    } catch (e) { salesListEl.innerHTML = ''; }

    // Alertas
    const alertsListEl = document.getElementById('inventory-alerts-list');
    try {
        const alertsResponse = await api.getInventoryAlerts(3);
        alertsListEl.innerHTML = '';
        if (alertsResponse.success && alertsResponse.data.length > 0) {
            alertsListEl.innerHTML = alertsResponse.data.map(alert => `
                <div class="list-item">
                    <div class="alert-info">
                        <span class="alert-title">${alert.title}</span>
                        <span class="alert-subtitle">${alert.subtitle}</span>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                </div>
            `).join('');
        } else {
            alertsListEl.innerHTML = '<div style="text-align:center; color:#444; padding:15px; font-size:0.8rem;">Todo en orden</div>';
        }
    } catch (e) { alertsListEl.innerHTML = ''; }
}

function updateText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

function formatMoney(amount) {
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(amount);
}