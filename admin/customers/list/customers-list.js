/* admin/customers/list/customers-list.js */

let currentPage = 1;
const pageSize = 10;
let searchTerm = '';

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Verificaciones de Autenticación
    if (!isAuthenticated()) {
        window.location.href = '/public/auth/login/login.html';
        return;
    }
    if (getUserRole() !== 'admin') {
        window.location.href = '/index.html';
        return;
    }

    // 2. Inicializar UI (Nombre de usuario y Sidebar)
    const fullName = getUserFullName();
    if (fullName) {
        const userDisplay = document.getElementById('user-name-display');
        if (userDisplay) userDisplay.textContent = fullName;
    }

    await loadSidebar();
    initializeSidebarToggle();
    initializeLogout();

    // 3. Configurar Listeners de Búsqueda
    setupSearchListeners();

    // 4. Cargar Datos Iniciales
    await loadCustomers();
});

/**
 * Carga la lista de clientes desde la API.
 */
async function loadCustomers() {
    const tableBody = document.getElementById('customers-table-body');
    const paginationInfo = document.getElementById('pagination-info');
    const btnPrev = document.getElementById('btn-prev');
    const btnNext = document.getElementById('btn-next');

    // Mostrar estado de carga
    tableBody.innerHTML = '<tr><td colspan="5" class="text-center" style="padding: 20px;">Cargando...</td></tr>';
    btnPrev.disabled = true;
    btnNext.disabled = true;

    // Llamada a la API
    const response = await api.getCustomersList(currentPage, pageSize, searchTerm);

    if (response.success) {
        const customers = response.data;
        const total = response.total;

        if (customers.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" class="text-center" style="padding: 20px; color: var(--color-purple-light);">No se encontraron clientes.</td></tr>';
        } else {
            // Renderizar filas
            tableBody.innerHTML = customers.map(c => `
                <tr>
                    <td>
                        <div style="font-weight: 600;">${c.name}</div>
                    </td>
                    <td>
                        <div style="font-size: 0.85rem; color: var(--color-purple-light);">${c.docType}</div>
                        <div>${c.docNumber}</div>
                    </td>
                    <td>
                        <div style="display: flex; flex-direction: column; gap: 2px;">
                            ${c.email !== '-' ? `<div style="font-size: 0.85rem;">✉️ ${c.email}</div>` : ''}
                            ${c.phone !== '-' ? `<div style="font-size: 0.85rem;">📞 ${c.phone}</div>` : ''}
                            ${c.email === '-' && c.phone === '-' ? '<span style="opacity:0.5;">Sin contacto</span>' : ''}
                        </div>
                    </td>
                    <td>
                        <div style="display: flex; align-items: center;">
                            <span class="status-dot ${c.isActive ? 'status-active' : 'status-inactive'}"></span>
                            <span>${c.isActive ? 'Activo' : 'Inactivo'}</span>
                        </div>
                    </td>
                    <td class="text-center">
                        <button class="action-btn" title="Editar (Próximamente)">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                        </button>
                    </td>
                </tr>
            `).join('');
        }

        // Paginación
        const totalPages = Math.ceil(total / pageSize);
        const startItem = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
        const endItem = Math.min(currentPage * pageSize, total);

        paginationInfo.textContent = `Mostrando ${startItem} - ${endItem} de ${total}`;

        btnPrev.disabled = currentPage === 1;
        btnNext.disabled = currentPage >= totalPages || total === 0;

        // Listeners Paginación
        btnPrev.onclick = () => {
            if (currentPage > 1) {
                currentPage--;
                loadCustomers();
            }
        };
        btnNext.onclick = () => {
            if (currentPage < totalPages) {
                currentPage++;
                loadCustomers();
            }
        };

    } else {
        tableBody.innerHTML = `<tr><td colspan="5" class="text-center" style="color: var(--color-error);">Error: ${response.error}</td></tr>`;
    }
}

/**
 * Configura los listeners para la búsqueda.
 */
function setupSearchListeners() {
    const btnSearch = document.getElementById('btn-search');
    const btnClear = document.getElementById('btn-clear');
    const inputSearch = document.getElementById('search-input');

    btnSearch.addEventListener('click', () => {
        searchTerm = inputSearch.value.trim();
        currentPage = 1; // Resetear a primera página
        loadCustomers();
    });

    btnClear.addEventListener('click', () => {
        inputSearch.value = '';
        searchTerm = '';
        currentPage = 1;
        loadCustomers();
    });

    inputSearch.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') btnSearch.click();
    });
}

// --- Funciones Compartidas del Layout (Sidebar/Logout) ---

async function loadSidebar() {
    const container = document.getElementById('sidebar-container');
    if (!container) return;
    try {
        const res = await fetch('/public/shared/components/sidebar/sidebar.html');
        if (!res.ok) throw new Error('Error sidebar');
        container.innerHTML = await res.text();
        
        // Marcar activo el link de Clientes
        const links = container.querySelectorAll('.sidebar-link');
        links.forEach(link => {
            if(link.href.includes('customers-list')) link.classList.add('is-active');
        });
    } catch(e) { console.error(e); }
}

function initializeSidebarToggle() {
    const btn = document.getElementById('sidebar-toggle');
    const bar = document.querySelector('.admin-sidebar');
    if(btn && bar) {
        btn.addEventListener('click', () => bar.classList.toggle('is-open'));
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
        if(confirm('¿Cerrar sesión?')) api.logoutUser();
    });
}