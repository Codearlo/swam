/* admin/customers/list/customers-list.js */

let currentPage = 1;
const pageSize = 10;
let searchTerm = '';

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Auth Check
    if (!isAuthenticated()) {
        window.location.href = '/public/auth/login/login.html';
        return;
    }
    if (getUserRole() !== 'admin') {
        window.location.href = '/index.html';
        return;
    }

    // 2. UI Init (Header y Sidebar)
    // Cargar Header dinámico con nombre CORTO
    if (typeof loadAdminHeader === 'function') {
        await loadAdminHeader('Clientes');
    }

    await loadSidebar();
    
    // 3. Listeners
    setupSearchListeners();
    setupActionListeners();

    // 4. Cargar Data
    await loadCustomers();
});

// --- LÓGICA DE CLIENTES (Carga de tabla) ---
async function loadCustomers() {
    const tableBody = document.getElementById('customers-table-body');
    const paginationInfo = document.getElementById('pagination-info');
    const btnPrev = document.getElementById('btn-prev');
    const btnNext = document.getElementById('btn-next');

    tableBody.innerHTML = '<tr><td colspan="5" class="text-center" style="padding: 20px;">Cargando...</td></tr>';
    btnPrev.disabled = true;
    btnNext.disabled = true;

    const response = await api.getCustomersList(currentPage, pageSize, searchTerm);

    if (response.success) {
        const customers = response.data;
        const total = response.total;

        if (customers.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" class="text-center" style="padding: 20px; color: var(--color-purple-light);">No se encontraron clientes.</td></tr>';
        } else {
            tableBody.innerHTML = customers.map(c => `
                <tr>
                    <td><div style="font-weight: 600;">${c.name}</div></td>
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

        const totalPages = Math.ceil(total / pageSize);
        const startItem = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
        const endItem = Math.min(currentPage * pageSize, total);

        paginationInfo.textContent = `Mostrando ${startItem} - ${endItem} de ${total}`;
        btnPrev.disabled = currentPage === 1;
        btnNext.disabled = currentPage >= totalPages || total === 0;

        btnPrev.onclick = () => { if (currentPage > 1) { currentPage--; loadCustomers(); } };
        btnNext.onclick = () => { if (currentPage < totalPages) { currentPage++; loadCustomers(); } };

    } else {
        tableBody.innerHTML = `<tr><td colspan="5" class="text-center" style="color: var(--color-error);">Error: ${response.error}</td></tr>`;
    }
}

function setupSearchListeners() {
    const btnSearch = document.getElementById('btn-search');
    const btnClear = document.getElementById('btn-clear');
    const inputSearch = document.getElementById('search-input');

    if (btnSearch) {
        btnSearch.addEventListener('click', () => {
            searchTerm = inputSearch.value.trim();
            currentPage = 1;
            loadCustomers();
        });
    }

    if (btnClear) {
        btnClear.addEventListener('click', () => {
            inputSearch.value = '';
            searchTerm = '';
            currentPage = 1;
            loadCustomers();
        });
    }

    if (inputSearch) {
        inputSearch.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') btnSearch.click();
        });
    }
}

// --- LÓGICA DEL MODAL ---

function setupActionListeners() {
    const btnAdd = document.getElementById('btn-add-customer');
    const modalOverlay = document.getElementById('modal-overlay');

    preloadCreateResources();

    if (btnAdd) {
        btnAdd.addEventListener('click', () => {
            openCreateCustomerModal();
        });
    }

    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                closeModal();
            }
        });
    }
}

function preloadCreateResources() {
    if (!document.querySelector('link[href*="customers-create.css"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = '../create/customers-create.css'; 
        document.head.appendChild(link);
    }
    if (!document.querySelector('script[src*="customers-create.js"]')) {
        const script = document.createElement('script');
        script.src = '../create/customers-create.js';
        document.body.appendChild(script);
    }
}

async function openCreateCustomerModal() {
    const modalOverlay = document.getElementById('modal-overlay');
    const modalContent = document.getElementById('modal-content');
    
    modalOverlay.classList.remove('u-hidden');
    modalContent.innerHTML = '<div class="u-flex-center" style="height:300px;"><div class="modal-loader"></div></div>';

    try {
        const response = await fetch('../create/customers-create.html');
        if (!response.ok) throw new Error('Error cargando el formulario');
        const html = await response.text();

        modalContent.innerHTML = html;

        if (typeof window.initCreateCustomerForm === 'function') {
            window.initCreateCustomerForm();
        } else {
            setTimeout(() => {
                if (typeof window.initCreateCustomerForm === 'function') {
                    window.initCreateCustomerForm();
                } else {
                    console.error('Error: initCreateCustomerForm no está disponible.');
                }
            }, 300);
        }

    } catch (error) {
        console.error(error);
        modalContent.innerHTML = '<div style="padding:20px; text-align:center; color: var(--color-error);">Error al cargar el formulario.</div>';
    }
}

function closeModal() {
    const modalOverlay = document.getElementById('modal-overlay');
    modalOverlay.classList.add('u-hidden');
}

window.closeModal = closeModal;
window.loadCustomers = loadCustomers;

async function loadSidebar() {
    const container = document.getElementById('sidebar-container');
    if (!container) return;
    try {
        const res = await fetch('/public/shared/components/sidebar/sidebar.html');
        if (!res.ok) throw new Error('Error loading sidebar');
        container.innerHTML = await res.text();
        const links = container.querySelectorAll('.sidebar-link');
        links.forEach(link => {
            if(link.href.includes('customers-list')) link.classList.add('is-active');
        });
    } catch(e) { console.error(e); }
}