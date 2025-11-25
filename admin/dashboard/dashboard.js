/* admin/dashboard/dashboard.js */

let dashboardSubscription = null;
let currentTopProductsFilter = 'week'; // Estado global para el filtro

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Verificaciones de Seguridad
    if (!isAuthenticated()) {
        window.location.href = '/public/auth/login/login.html';
        return;
    }
    const userRole = getUserRole();
    if (userRole !== 'admin') {
        window.location.href = '/index.html';
        return;
    }

    // 2. UI Inicial y Sidebar
    const fullName = getUserFullName();
    if (fullName) {
        const nameDisplay = document.getElementById('user-name-display');
        if (nameDisplay) nameDisplay.textContent = fullName;
    }
    
    await loadSidebar();
    initializeSidebarToggle();
    initializeLogout();

    // 3. Carga Inicial de Datos
    await loadAllDashboardData();

    // 4. Inicializar Realtime
    initializeRealtimeUpdates();

    // 5. Inicializar Gráficos
    initializeCharts(); 
    
    // Exponer función de filtro al window para que el HTML pueda llamarla
    window.changeTopProductsFilter = changeTopProductsFilter;
});

/**
 * Carga el sidebar del administrador
 */
async function loadSidebar() {
    const sidebarContainer = document.getElementById('sidebar-container');
    if (!sidebarContainer) return;

    try {
        const response = await fetch('/public/shared/components/sidebar/sidebar.html');
        if (!response.ok) throw new Error('Error al cargar sidebar');
        
        const html = await response.text();
        sidebarContainer.innerHTML = html;
        
        // Marcar la opción activa
        const dashboardLink = sidebarContainer.querySelector('[href*="dashboard"]');
        if (dashboardLink) {
            dashboardLink.classList.add('is-active');
        }
    } catch (error) {
        console.error('Error al cargar el sidebar:', error);
    }
}

/**
 * Carga todos los datos del dashboard de una vez
 */
async function loadAllDashboardData() {
    await Promise.all([
        refreshMetrics(),
        refreshRecentSales(),
        refreshInventoryAlerts(),
        refreshTopProducts(currentTopProductsFilter) // Usar el filtro por defecto
    ]);
}

/**
 * Configura los listeners de Supabase para actualizar componentes individuales
 */
function initializeRealtimeUpdates() {
    const callbacks = {
        onSalesChange: () => {
            console.log('♻️ Actualizando datos por nueva venta...');
            refreshMetrics();       
            refreshRecentSales();   
            // Al actualizar por realtime, respetamos el filtro que el usuario tenga seleccionado
            refreshTopProducts(currentTopProductsFilter); 
        },
        onOrdersChange: () => {
            console.log('♻️ Actualizando Órdenes...');
            refreshMetrics();
        },
        onInventoryChange: () => {
            console.log('♻️ Actualizando Inventario...');
            refreshMetrics();
            refreshInventoryAlerts();
        },
        onCustomersChange: () => {
            refreshMetrics();
        }
    };

    dashboardSubscription = api.subscribeToDashboard(callbacks);
}

// --- LÓGICA DEL FILTRO DE PRODUCTOS ---

/**
 * Función llamada al hacer clic en los botones de Semana/Mes/Año
 */
async function changeTopProductsFilter(period, btnElement) {
    // 1. Actualizar estado visual de los botones
    const container = btnElement.parentElement;
    const buttons = container.querySelectorAll('.chart-btn');
    buttons.forEach(btn => btn.classList.remove('chart-btn--active'));
    btnElement.classList.add('chart-btn--active');

    // 2. Actualizar variable global
    currentTopProductsFilter = period;

    // 3. Recargar datos con efecto de carga
    const listContainer = document.getElementById('top-products-list');
    if(listContainer) {
        listContainer.style.opacity = '0.5';
        // Opcional: mostrar mensaje de carga si se desea
        // listContainer.innerHTML = '<p style="text-align:center; padding: 20px;">Cargando...</p>';
    }

    await refreshTopProducts(period);
    
    if(listContainer) listContainer.style.opacity = '1';
}

// --- FUNCIONES DE RECARGA ESPECÍFICAS ---

async function refreshMetrics() {
    const data = await api.getDashboardData();
    if (data.success) {
        updateElementText('daily-sales', `S/. ${data.dailySales.toFixed(2)}`);
        updateElementText('active-orders', data.activeOrders);
        updateElementText('active-customers', data.activeCustomers);
        updateElementText('products-stock', data.productsInStock);
    }
}

async function refreshRecentSales() {
    const response = await api.getRecentSales(5);
    if (response.success) {
        updateRecentSalesTable(response.data);
    }
}

async function refreshInventoryAlerts() {
    const response = await api.getInventoryAlerts(5);
    if (response.success) {
        updateInventoryAlertsList(response.data);
    }
}

async function refreshTopProducts(period = 'week') {
    const response = await api.getTopProducts(5, period);
    if (response.success) {
        updateTopProductsList(response.data);
    }
}

// --- MANIPULACIÓN DEL DOM (Helpers visuales) ---

function updateElementText(id, value) {
    const el = document.getElementById(id);
    if (el) {
        el.style.transition = 'opacity 0.2s';
        el.style.opacity = '0.5';
        setTimeout(() => {
            el.textContent = value;
            el.style.opacity = '1';
        }, 200);
    }
}

function updateRecentSalesTable(sales) {
    const tableBody = document.getElementById('recent-sales-table');
    if (!tableBody) return;

    if (sales.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 20px; color: var(--color-purple-light);">No hay ventas registradas</td></tr>';
        return;
    }

    tableBody.innerHTML = sales.map(sale => `
        <tr>
            <td><span class="table-code">${sale.code}</span></td>
            <td>${sale.customer}</td>
            <td>S/. ${sale.amount.toFixed(2)}</td>
            <td><span class="status-badge status-badge--success">Completado</span></td>
        </tr>
    `).join('');
}

function updateInventoryAlertsList(alerts) {
    const alertsList = document.getElementById('inventory-alerts-list');
    if (!alertsList) return;

    if (alerts.length === 0) {
        alertsList.innerHTML = '<p style="text-align:center; opacity:0.7; padding:10px;">El inventario está saludable</p>';
        return;
    }

    const iconMap = {
        warning: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
        error: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>'
    };

    alertsList.innerHTML = alerts.map(alert => `
        <div class="alert-item alert-item--${alert.type}">
            <div class="alert-item__icon">
                ${iconMap[alert.type] || iconMap.warning}
            </div>
            <div class="alert-item__content">
                <p class="alert-item__title">${alert.title}</p>
                <span class="alert-item__subtitle">${alert.subtitle}</span>
            </div>
        </div>
    `).join('');
}

function updateTopProductsList(products) {
    const listContainer = document.getElementById('top-products-list');
    if (!listContainer) return;

    if (products.length === 0) {
        listContainer.innerHTML = `
            <div style="text-align:center; padding: 20px; color: var(--color-purple-light);">
                <p>No hay ventas en este periodo.</p>
            </div>`;
        return;
    }

    listContainer.innerHTML = products.map(prod => `
        <div class="top-product-item">
            <div class="top-product-item__info">
                <span class="top-product-item__rank">#${prod.rank}</span>
                <div>
                    <p class="top-product-item__name">${prod.name}</p>
                    <span class="top-product-item__sales">${prod.sales}</span>
                </div>
            </div>
            <span class="top-product-item__amount">S/. ${prod.amount.toFixed(2)}</span>
        </div>
    `).join('');
}

// --- UTILIDADES DEL LAYOUT ---

function initializeSidebarToggle() {
    const toggleBtn = document.getElementById('sidebar-toggle');
    const sidebar = document.querySelector('.admin-sidebar');
    
    if (!toggleBtn || !sidebar) return;

    toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('is-open');
    });

    // Cerrar sidebar al hacer clic fuera en móvil
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768) {
            if (!sidebar.contains(e.target) && !toggleBtn.contains(e.target)) {
                sidebar.classList.remove('is-open');
            }
        }
    });
}

function initializeLogout() {
    const logoutBtn = document.getElementById('logout-btn');
    if (!logoutBtn) return;

    logoutBtn.addEventListener('click', () => {
        if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
            api.logoutUser();
        }
    });
}

function initializeCharts() {
    const salesChartCanvas = document.getElementById('sales-chart');
    if (!salesChartCanvas) return;

    const ctx = salesChartCanvas.getContext('2d');

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
            datasets: [{
                label: 'Ventas (S/.)',
                data: [0, 0, 0, 0, 0, 0, 0], 
                borderColor: 'rgb(243, 244, 246)',
                backgroundColor: 'rgba(243, 244, 246, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointBackgroundColor: 'rgb(243, 244, 246)',
                pointBorderColor: 'rgb(0, 0, 0)',
                pointBorderWidth: 2,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: 'rgb(243, 244, 246)',
                    bodyColor: 'rgb(243, 244, 246)',
                    borderColor: 'rgba(243, 244, 246, 0.2)',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: false,
                    callbacks: {
                        label: function(context) {
                            return 'S/. ' + context.parsed.y.toFixed(2);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255, 255, 255, 0.05)', drawBorder: false },
                    ticks: {
                        color: 'rgb(161, 161, 161)',
                        callback: function(value) { return 'S/. ' + value; }
                    }
                },
                x: {
                    grid: { display: false, drawBorder: false },
                    ticks: { color: 'rgb(161, 161, 161)' }
                }
            }
        }
    });
}