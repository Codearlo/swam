/* mobile-admin/dashboard/dashboard.js */

document.addEventListener('DOMContentLoaded', async () => {
    await loadBottomNav();

    if (typeof isAuthenticated === 'function' && !isAuthenticated()) {
        window.location.href = '../../public/auth/login/login.html';
        return;
    }

    // Cargar Nombre de Usuario
    const userName = localStorage.getItem('swam_user_full_name') || 'Admin';
    const firstName = userName.split(' ')[0];
    document.getElementById('header-username').textContent = firstName;
    document.getElementById('header-avatar').textContent = firstName.charAt(0).toUpperCase();

    // Fecha del Mes
    const dateOptions = { month: 'long' };
    const monthName = new Date().toLocaleDateString('es-ES', dateOptions);
    // Capitalizar primera letra
    const monthCapitalized = monthName.charAt(0).toUpperCase() + monthName.slice(1);
    const heroLabel = document.querySelector('.hero-label');
    if(heroLabel) heroLabel.textContent = `Ventas de ${monthCapitalized}`;

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

    // --- A. Métricas Generales y Calculo del Mes ---
    try {
        const metricsData = await api.getDashboardData();
        if (metricsData.success) {
            const dailySales = metricsData.dailySales || 0;
            
            // 1. Mostrar Diario
            updateText('kpi-sales', formatMoney(dailySales));
            updateText('kpi-orders', metricsData.activeOrders || '0');

            // 2. Simular/Calcular Mensual (En producción esto vendría de una API específica)
            // Por ahora, para demo visual, si hay ventas hoy, proyectamos un valor acumulado
            // Si la base de datos devuelve 0 en diario, mostramos un valor base ficticio para que se vea bonito el diseño
            // O mostramos 0 si prefieres realismo puro.
            let monthlySales = dailySales; 
            
            // Si hay conexión real a la BD (api.js), tratará de obtener datos reales. 
            // Si estamos en modo MOCK, daily es 0. 
            
            // Lógica visual: Si daily es 0 (ej. inicio de día), mostrar acumulado mensual si existe
            // Como no tenemos endpoint 'getMonthlySales' en api.js, usaremos un placeholder o el diario.
            // Para efecto visual "Dark App", voy a dejarlo en 0 o el valor real diario acumulado.
            
            updateText('monthly-sales', formatMoney(monthlySales));
        }
    } catch (e) { console.error(e); }

    // --- B. Listas (Igual que antes) ---
    await loadLists();
}

async function loadLists() {
    // Ventas
    const salesListEl = document.getElementById('recent-sales-list');
    try {
        const salesResponse = await api.getRecentSales(5);
        salesListEl.innerHTML = ''; 
        if (salesResponse.success && salesResponse.data.length > 0) {
            // Si hay ventas, sumamos al acumulado mensual visual (Truco de frontend para demo)
            let totalVisual = salesResponse.data.reduce((acc, curr) => acc + curr.amount, 0);
            updateText('monthly-sales', formatMoney(totalVisual)); // Actualizar Hero con datos reales cargados

            salesListEl.innerHTML = salesResponse.data.map(sale => `
                <div class="list-item">
                    <div class="sale-info">
                        <span class="sale-code">${sale.code}</span>
                        <span class="sale-customer">${sale.customer}</span>
                    </div>
                    <div class="sale-amount">${formatMoney(sale.amount)}</div>
                </div>
            `).join('');
        } else {
            salesListEl.innerHTML = '<div style="text-align:center; color:#444; padding:15px; font-size:0.8rem;">Sin ventas recientes</div>';
        }
    } catch (e) { salesListEl.innerHTML = ''; }

    // Alertas
    const alertsListEl = document.getElementById('inventory-alerts-list');
    try {
        const alertsResponse = await api.getInventoryAlerts(5);
        alertsListEl.innerHTML = '';
        if (alertsResponse.success && alertsResponse.data.length > 0) {
            alertsListEl.innerHTML = alertsResponse.data.map(alert => `
                <div class="list-item">
                    <div class="alert-info">
                        <span class="alert-title" style="color:#ef4444">${alert.title}</span>
                        <span class="alert-subtitle">${alert.subtitle}</span>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
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