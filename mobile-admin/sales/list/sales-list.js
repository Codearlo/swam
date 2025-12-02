/* mobile-admin/sales/list/sales-list.js */

document.addEventListener('DOMContentLoaded', async () => {
    // Elementos del DOM
    const salesContainer = document.querySelector('.sales-list-container') || document.getElementById('salesList'); // Ajustar según tu HTML
    const searchInput = document.getElementById('searchInput'); // <input type="text" placeholder="Buscar por código...">
    const filterButtons = document.querySelectorAll('.filter-chip'); // Botones Todos, Hoy, Mes

    let currentPage = 1;
    let currentSearch = '';
    let isLoading = false;
    
    // Inicialización
    init();

    function init() {
        loadSales();
        setupEventListeners();
    }

    function setupEventListeners() {
        // Buscador con Debounce
        let debounceTimer;
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    currentSearch = e.target.value;
                    currentPage = 1;
                    loadSales();
                }, 500);
            });
        }

        // Filtros (Visuales por ahora, o integrados en search)
        filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                filterButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                // Aquí podrías implementar lógica de filtro por fecha si el API lo soporta
                // Por ahora recargamos la lista base
                loadSales();
            });
        });
    }

    async function loadSales() {
        if (!salesContainer) return;
        
        isLoading = true;
        renderLoading();

        try {
            // Llamada al Servicio a través de mobileApi
            const response = await mobileApi.getSalesHistory(currentPage, 20, currentSearch);

            if (response.success) {
                renderSales(response.data);
            } else {
                salesContainer.innerHTML = `
                    <div class="empty-state">
                        <p>Error al cargar ventas: ${response.error}</p>
                    </div>`;
            }
        } catch (error) {
            console.error('Error cargando ventas:', error);
            salesContainer.innerHTML = '<div class="empty-state"><p>Ocurrió un error inesperado.</p></div>';
        } finally {
            isLoading = false;
        }
    }

    function renderLoading() {
        salesContainer.innerHTML = '<div class="loader-container"><div class="spinner"></div><p>Cargando ventas...</p></div>';
    }

    function renderSales(sales) {
        if (!sales || sales.length === 0) {
            salesContainer.innerHTML = `
                <div class="empty-state">
                    <img src="../../../public/assets/icons/empty-box.svg" alt="Sin ventas" style="width:64px; opacity:0.5; margin-bottom:1rem;">
                    <p>No se encontraron ventas</p>
                </div>`;
            return;
        }

        const html = sales.map(sale => `
            <div class="sale-card" onclick="openSaleDetail('${sale.id}')">
                <div class="sale-icon">
                    <span>🛍️</span>
                </div>
                <div class="sale-info">
                    <div class="sale-header">
                        <span class="sale-code">${sale.code}</span>
                        <span class="sale-amount">$${sale.amount.toFixed(2)}</span>
                    </div>
                    <div class="sale-sub">
                        <span class="sale-customer">${sale.customer}</span>
                        <span class="sale-date">${formatDate(sale.date)}</span>
                    </div>
                </div>
                <div class="sale-arrow">
                    ➔
                </div>
            </div>
        `).join('');

        salesContainer.innerHTML = html;
    }

    function formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', hour: '2-digit', minute:'2-digit' });
    }

    // Navegación (Expuesto globalmente para el onclick en el HTML)
    window.openSaleDetail = (id) => {
        // Implementar navegación a detalle si existe
        console.log('Ver detalle venta:', id);
        // window.location.href = `../detail/sales-detail.html?id=${id}`;
    };
});