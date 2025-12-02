/* mobile-admin/components/mobile-header/mobile-header.js */

document.addEventListener('DOMContentLoaded', () => {
    // Lógica para botones del header si existen
    const backBtn = document.querySelector('.header-back-btn');
    const menuBtn = document.querySelector('.header-menu-btn');
    const titleEl = document.querySelector('.header-title');

    // Botón Atrás
    if (backBtn) {
        backBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (window.history.length > 1) {
                window.history.back();
            } else {
                // Si no hay historial, ir al dashboard por defecto
                window.location.href = '../../dashboard/dashboard.html';
            }
        });
    }

    // Botón Menú (Toggle Sidebar)
    if (menuBtn) {
        menuBtn.addEventListener('click', (e) => {
            e.preventDefault();
            // Lógica para abrir/cerrar sidebar si existe
            const sidebar = document.getElementById('appSidebar');
            if (sidebar) {
                sidebar.classList.toggle('active');
            }
        });
    }
    
    // Función global para actualizar título dinámicamente
    window.updateHeaderTitle = (newTitle) => {
        if (titleEl) {
            titleEl.textContent = newTitle;
        }
    };
});