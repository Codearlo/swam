/* mobile-admin/components/mobile-header/mobile-header.js */

/**
 * Carga el HTML del Header en el contenedor correspondiente.
 * Se define en window para estar disponible globalmente.
 */
window.loadMobileHeader = async function() {
    const headerContainer = document.getElementById('mobile-header-container');
    if (!headerContainer) return;

    try {
        // Ajusta la ruta si tus archivos están en carpetas diferentes
        const response = await fetch('/mobile-admin/components/mobile-header/mobile-header.html');
        if (response.ok) {
            headerContainer.innerHTML = await response.text();
            setupHeaderEvents();
        } else {
            console.error('Error cargando header.html');
        }
    } catch (e) {
        console.error('Error de red al cargar header:', e);
    }
};

function setupHeaderEvents() {
    // Lógica visual del header (ej. botón de notificaciones)
    const notifBtn = document.getElementById('btn-notifications');
    const notifModal = document.getElementById('notifications-modal');
    const closeNotifBtn = document.getElementById('btn-close-notif');

    if (notifBtn && notifModal) {
        notifBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            notifModal.classList.toggle('u-hidden');
            notifModal.classList.toggle('is-open');
        });
    }

    if (closeNotifBtn && notifModal) {
        closeNotifBtn.addEventListener('click', () => {
            notifModal.classList.add('u-hidden');
            notifModal.classList.remove('is-open');
        });
    }

    // Cerrar al hacer click fuera
    document.addEventListener('click', (e) => {
        if (notifModal && !notifModal.contains(e.target) && !notifBtn.contains(e.target)) {
            notifModal.classList.add('u-hidden');
            notifModal.classList.remove('is-open');
        }
    });
}