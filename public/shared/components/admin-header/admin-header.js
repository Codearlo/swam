/* public/shared/components/admin-header/admin-header.js */

/**
 * Carga el componente Header Admin en el contenedor especificado.
 * @param {string} pageTitle - El título que se mostrará en el header (ej: "Dashboard").
 */
async function loadAdminHeader(pageTitle = 'Panel Admin') {
    const container = document.getElementById('admin-header-container');
    if (!container) {
        console.warn('Contenedor #admin-header-container no encontrado.');
        return;
    }

    try {
        // Determinar la ruta relativa correcta basada en la ubicación actual
        // Asumimos que estamos dentro de /admin/...
        const response = await fetch('/public/shared/components/admin-header/admin-header.html');
        if (!response.ok) throw new Error('Error al cargar admin-header.html');
        
        const html = await response.text();
        container.innerHTML = html;
        
        // 1. Establecer Título
        const titleEl = document.getElementById('page-title-display');
        if (titleEl) titleEl.textContent = pageTitle;

        // 2. Establecer Nombre de Usuario
        const fullName = typeof getUserFullName === 'function' ? getUserFullName() : 'Usuario';
        const nameEl = document.getElementById('header-user-name');
        if (nameEl && fullName) nameEl.textContent = fullName;

        // 3. Inicializar Eventos
        initializeHeaderEvents();

    } catch (error) {
        console.error('Error cargando el Header:', error);
        container.innerHTML = `<div style="color:red; padding:10px;">Error Header: ${error.message}</div>`;
    }
}

function initializeHeaderEvents() {
    // A. Toggle Sidebar (Móvil)
    const toggleBtn = document.getElementById('sidebar-toggle');
    const sidebar = document.querySelector('.admin-sidebar');
    
    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Evitar cerrar inmediatamente
            sidebar.classList.toggle('is-open');
        });
    }

    // B. Logout
    const logoutBtn = document.getElementById('header-logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
                if (typeof api !== 'undefined' && api.logoutUser) {
                    api.logoutUser();
                } else {
                    // Fallback si la API no está cargada
                    window.location.href = '/public/auth/login/login.html';
                }
            }
        });
    }
}

// Exponer la función globalmente
window.loadAdminHeader = loadAdminHeader;