/* admin/sales/list/sales-list.js */

let currentPage = 1;
const pageSize = 10;
let currentFilters = {
    search: '',
    startDate: '',
    endDate: ''
};

document.addEventListener('DOMContentLoaded', async () => {
    if (!isAuthenticated()) {
        window.location.href = '/public/auth/login/login.html';
        return;
    }
    if (getUserRole() !== 'admin') {
        window.location.href = '/index.html';
        return;
    }

    // MODIFICADO: Nombre corto
    if (typeof loadAdminHeader === 'function') {
        await loadAdminHeader('Ventas');
    }

    await loadSidebar();

    setupFilterListeners();
    await loadSales();
});

async function loadSales() {
    const tableBody = document.getElementById('sales-table-body');
    const paginationInfo = document.getElementById('pagination-info');
    const btnPrev = document.getElementById('btn-prev');
    const btnNext = document.getElementById('btn-next');

    tableBody.innerHTML = '<tr><td colspan="6" class="text-center" style="padding: 20px;">Cargando...</td></tr>';
    btnPrev.disabled = true;
    btnNext.disabled = true;

    const response = await api.getSalesList(currentPage, pageSize, currentFilters);

    if (response.success) {
        const sales = response.data;
        const total = response.total;

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

        const totalPages = Math.ceil(total / pageSize);
        const startItem = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
        const endItem = Math.min(currentPage * pageSize, total);

        paginationInfo.textContent = `Mostrando ${startItem} - ${endItem} de ${total}`;
        btnPrev.disabled = currentPage === 1;
        btnNext.disabled = currentPage >= totalPages || total === 0;

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

function setupFilterListeners() {
    const btnFilter = document.getElementById('btn-filter');
    const btnClear = document.getElementById('btn-clear');
    const searchInput = document.getElementById('search-input');
    const dateStart = document.getElementById('date-start');
    const dateEnd = document.getElementById('date-end');

    if (btnFilter) {
        btnFilter.addEventListener('click', () => {
            currentFilters.search = searchInput.value.trim();
            currentFilters.startDate = dateStart.value;
            currentFilters.endDate = dateEnd.value;
            currentPage = 1; 
            loadSales();
        });
    }

    if (btnClear) {
        btnClear.addEventListener('click', () => {
            searchInput.value = '';
            dateStart.value = '';
            dateEnd.value = '';
            currentFilters = { search: '', startDate: '', endDate: '' };
            currentPage = 1;
            loadSales();
        });
    }

    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') btnFilter.click();
        });
    }
}

function formatDate(dateString) {
    if (!dateString) return '-';
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    return new Date(dateString + 'T00:00:00').toLocaleDateString('es-PE', options);
}

async function loadSidebar() {
    const container = document.getElementById('sidebar-container');
    if (!container) return;
    try {
        const res = await fetch('/public/shared/components/sidebar/sidebar.html');
        if (!res.ok) throw new Error('Error loading sidebar');
        container.innerHTML = await res.text();
        const links = container.querySelectorAll('.sidebar-link');
        links.forEach(link => {
            if(link.href.includes('sales-list')) link.classList.add('is-active');
        });
    } catch(e) { console.error(e); }
}