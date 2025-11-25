/* admin/sales/list/sales-list.js */

// Estado local
let currentPage = 1;
const pageSize = 10;
let currentFilters = {
    search: '',
    startDate: '',
    endDate: ''
};

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Verificar Autenticación
    if (!isAuthenticated()) {
        window.location.href = '/public/auth/login/login.html';
        return;
    }
    if (getUserRole() !== 'admin') {
        window.location.href = '/index.html';
        return;
    }

    // 2. Inicializar UI
    const fullName = getUserFullName();
    if (fullName) {
        const userDisplay = document.getElementById('user-name-display');
        if (userDisplay) userDisplay.textContent = fullName;
    }

    await loadSidebar();
    initializeSidebarToggle();
    initializeLogout();

    // 3. Configurar Filtros
    setupFilterListeners();

    // 4. Cargar Datos Iniciales
    await loadSales();
});

/**
 * Carga las ventas desde la API según la página y filtros actuales.
 */
async function loadSales() {
    const tableBody = document.getElementById('sales-table-body');
    const paginationInfo = document.getElementById('pagination-info');
    const btnPrev = document.getElementById('btn-prev');
    const btnNext = document.getElementById('btn-next');

    // Mostrar estado de carga
    tableBody.innerHTML = '<tr><td colspan="6" class="text-center" style="padding: 20px;">Cargando...</td></tr>';
    btnPrev.disabled = true;
    btnNext.disabled = true;

    // Llamada a la API
    const response = await api.getSalesList(currentPage, pageSize, currentFilters);

    if (response.success) {
        const sales = response.data;
        const total = response.total;

        // Renderizar filas de la tabla
        if (sales.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" class="text-center" style="padding: 20px; color: var(--color-purple-light);">No se encontraron ventas.</td></tr>';
        } else {
            tableBody.innerHTML = sales.map(sale => `
                <tr>
                    <td><span class="table-code">${sale.code}</span></td>
                    <td>${sale.customer}</td>
                    <td>${formatDate(sale.date)}</td>
                    <td>${sale.paymentMethod || 'N/A'}</td>
                    <td class="text-right" style="font-weight: 700;">S/. ${sale.total.toFixed(2)}</td>
                    <td class="text-center">
                        <button class="action-btn" title="Ver detalles (Próximamente)">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                        </button>
                    </td>
                </tr>
            `).join('');
        }

        // Calcular y actualizar paginación
        const totalPages = Math.ceil(total / pageSize);
        const startItem = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
        const endItem = Math.min(currentPage * pageSize, total);

        paginationInfo.textContent = `Mostrando ${startItem} - ${endItem} de ${total}`;

        // Habilitar/Deshabilitar botones
        btnPrev.disabled = currentPage === 1;
        btnNext.disabled = currentPage >= totalPages || total === 0;

        // Configurar eventos de los botones (limpiando anteriores para evitar duplicados)
        btnPrev.onclick = () => {
            if (currentPage > 1) {
                currentPage--;
                loadSales();
            }
        };
        btnNext.onclick = () => {
            if (currentPage < totalPages) {
                currentPage++;
                loadSales();
            }
        };

    } else {
        tableBody.innerHTML = `<tr><td colspan="6" class="text-center" style="color: var(--color-error);">Error al cargar ventas: ${response.error}</td></tr>`;
    }
}

/**
 * Configura los listeners para los botones de filtro y búsqueda.
 */
function setupFilterListeners() {
    const btnFilter = document.getElementById('btn-filter');
    const btnClear = document.getElementById('btn-clear');
    const searchInput = document.getElementById('search-input');
    const dateStart = document.getElementById('date-start');
    const dateEnd = document.getElementById('date-end');

    btnFilter.addEventListener('click', () => {
        currentFilters.search = searchInput.value.trim();
        currentFilters.startDate = dateStart.value;
        currentFilters.endDate = dateEnd.value;
        currentPage = 1; // Volver a la página 1 al filtrar
        loadSales();
    });

    btnClear.addEventListener('click', () => {
        searchInput.value = '';
        dateStart.value = '';
        dateEnd.value = '';
        currentFilters = { search: '', startDate: '', endDate: '' };
        currentPage = 1;
        loadSales();
    });

    // Permitir buscar al presionar Enter
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') btnFilter.click();
    });
}

// --- Funciones Auxiliares ---

function formatDate(dateString) {
    if (!dateString) return '-';
    // Asegurar interpretación correcta de la zona horaria local
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    return new Date(dateString + 'T00:00:00').toLocaleDateString('es-PE', options);
}

// --- Configuración del Sidebar y Layout (Compartido) ---

async function loadSidebar() {
    const container = document.getElementById('sidebar-container');
    if (!container) return;
    try {
        const res = await fetch('/public/shared/components/sidebar/sidebar.html');
        if (!res.ok) throw new Error('Error loading sidebar');
        container.innerHTML = await res.text();
        
        // Marcar activo el enlace de Ventas
        const links = container.querySelectorAll('.sidebar-link');
        links.forEach(link => {
            if(link.href.includes('sales-list')) link.classList.add('is-active');
        });
    } catch(e) { console.error(e); }
}

function initializeSidebarToggle() {
    const btn = document.getElementById('sidebar-toggle');
    const bar = document.querySelector('.admin-sidebar');
    if(btn && bar) {
        btn.addEventListener('click', () => bar.classList.toggle('is-open'));
        // Cerrar al hacer clic fuera en móvil
        document.addEventListener('click', (e) => {
            if(window.innerWidth <= 768 && !bar.contains(e.target) && !btn.contains(e.target)) {
                bar.classList.remove('is-open');
            }
        });
    }
}

function initializeLogout() {
    const btn = document.getElementById('logout-btn');
    if(btn) btn.addEventListener('click', () => {
        if(confirm('¿Deseas cerrar la sesión?')) api.logoutUser();
    });
}