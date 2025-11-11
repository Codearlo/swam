/* admin/dashboard/dashboard.js */

document.addEventListener('DOMContentLoaded', async () => {
    // Verificar autenticación
    if (!isAuthenticated()) {
        window.location.href = '/public/auth/login/login.html';
        return;
    }

    // Verificar que sea admin
    const userRole = getUserRole();
    if (userRole !== 'admin') {
        window.location.href = '/index.html';
        return;
    }

    // Mostrar nombre del usuario
    const fullName = getUserFullName();
    if (fullName) {
        const userNameDisplay = document.getElementById('user-name-display');
        if (userNameDisplay) {
            userNameDisplay.textContent = fullName;
        }
    }

    // Cargar el sidebar
    await loadSidebar();

    // Inicializar funcionalidades
    initializeSidebarToggle();
    initializeLogout();
    await loadDashboardData();
    initializeCharts();
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
 * Inicializa el toggle del sidebar para móviles
 */
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

/**
 * Inicializa el botón de logout
 */
function initializeLogout() {
    const logoutBtn = document.getElementById('logout-btn');
    if (!logoutBtn) return;

    logoutBtn.addEventListener('click', () => {
        if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
            logout();
        }
    });
}

/**
 * Carga los datos del dashboard desde la API
 */
async function loadDashboardData() {
    try {
        // Cargar datos del dashboard
        const dashboardData = await api.getDashboardData();
        
        if (dashboardData.success) {
            updateMetrics(dashboardData);
        } else {
            console.error('Error al cargar métricas:', dashboardData.error);
        }

        // Cargar ventas recientes
        const salesData = await api.getRecentSales(5);
        if (salesData.success) {
            updateRecentSales(salesData.data);
        }

        // Cargar alertas de inventario
        const alertsData = await api.getInventoryAlerts(5);
        if (alertsData.success) {
            updateInventoryAlerts(alertsData.data);
        }

    } catch (error) {
        console.error('Error al cargar datos del dashboard:', error);
        showErrorMessage('No se pudieron cargar los datos del dashboard');
    }
}

/**
 * Actualiza las tarjetas de métricas
 */
function updateMetrics(data) {
    const dailySalesEl = document.getElementById('daily-sales');
    const activeOrdersEl = document.getElementById('active-orders');
    const activeCustomersEl = document.getElementById('active-customers');
    const productsStockEl = document.getElementById('products-stock');

    if (dailySalesEl) {
        dailySalesEl.textContent = `S/. ${data.dailySales.toFixed(2)}`;
        animateValue(dailySalesEl, 0, data.dailySales, 1000, true);
    }

    if (activeOrdersEl) {
        activeOrdersEl.textContent = data.activeOrders;
        animateValue(activeOrdersEl, 0, data.activeOrders, 800, false);
    }

    if (activeCustomersEl) {
        activeCustomersEl.textContent = data.activeCustomers;
        animateValue(activeCustomersEl, 0, data.activeCustomers, 800, false);
    }

    if (productsStockEl) {
        productsStockEl.textContent = data.productsInStock;
        animateValue(productsStockEl, 0, data.productsInStock, 800, false);
    }
}

/**
 * Anima el conteo de un valor numérico
 */
function animateValue(element, start, end, duration, isCurrency = false) {
    const range = end - start;
    const increment = range / (duration / 16);
    let current = start;

    const timer = setInterval(() => {
        current += increment;
        if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
            current = end;
            clearInterval(timer);
        }
        
        if (isCurrency) {
            element.textContent = `S/. ${current.toFixed(2)}`;
        } else {
            element.textContent = Math.floor(current);
        }
    }, 16);
}

/**
 * Actualiza la tabla de ventas recientes
 */
function updateRecentSales(sales) {
    const tableBody = document.getElementById('recent-sales-table');
    if (!tableBody || !sales || sales.length === 0) return;

    tableBody.innerHTML = sales.map(sale => {
        const statusClass = sale.status === 'completed' ? 'success' : 'warning';
        const statusText = sale.status === 'completed' ? 'Completado' : 'Pendiente';
        
        return `
            <tr>
                <td><span class="table-code">${sale.code}</span></td>
                <td>${sale.customer}</td>
                <td>S/. ${sale.amount.toFixed(2)}</td>
                <td><span class="status-badge status-badge--${statusClass}">${statusText}</span></td>
            </tr>
        `;
    }).join('');
}

/**
 * Actualiza la lista de alertas de inventario
 */
function updateInventoryAlerts(alerts) {
    const alertsList = document.getElementById('inventory-alerts-list');
    if (!alertsList || !alerts || alerts.length === 0) return;

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

/**
 * Inicializa los gráficos con Chart.js
 */
function initializeCharts() {
    const salesChartCanvas = document.getElementById('sales-chart');
    if (!salesChartCanvas) return;

    const ctx = salesChartCanvas.getContext('2d');

    // Configuración del gráfico de ventas
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
            datasets: [{
                label: 'Ventas (S/.)',
                data: [1200, 1900, 1500, 2100, 1800, 2400, 2450],
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
                legend: {
                    display: false
                },
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
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)',
                        drawBorder: false
                    },
                    ticks: {
                        color: 'rgb(161, 161, 161)',
                        callback: function(value) {
                            return 'S/. ' + value;
                        }
                    }
                },
                x: {
                    grid: {
                        display: false,
                        drawBorder: false
                    },
                    ticks: {
                        color: 'rgb(161, 161, 161)'
                    }
                }
            }
        }
    });
}

/**
 * Muestra un mensaje de error
 */
function showErrorMessage(message) {
    // Implementar sistema de notificaciones toast
    console.error(message);
    alert(message);
}