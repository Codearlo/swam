/* mobile-admin/components/toast/toast.js */

// 1. Cargar el HTML del Toast automáticamente al iniciar
(async function initToast() {
    const existing = document.getElementById('app-toast');
    if (existing) return; // Ya existe

    try {
        // Determinar ruta relativa (asumiendo estructura estándar)
        // Intentamos cargar desde la raíz relativa
        const response = await fetch('/mobile-admin/components/toast/toast.html');
        if (response.ok) {
            const html = await response.text();
            document.body.insertAdjacentHTML('beforeend', html);
        }
    } catch (e) {
        console.error('Error cargando Toast:', e);
    }
})();

/**
 * Muestra una notificación flotante.
 * @param {string} message - El texto a mostrar.
 * @param {string} type - 'success' (default) o 'error'.
 */
window.showToast = function(message, type = 'success') {
    const toast = document.getElementById('app-toast');
    const msgEl = document.getElementById('toast-message');
    const iconEl = document.getElementById('toast-icon');

    if (!toast) return;

    // Configurar contenido
    msgEl.textContent = message;
    
    // Configurar estilo
    toast.className = `toast-notification toast-${type}`;
    
    // Iconos SVG
    if (type === 'success') {
        iconEl.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
    } else {
        iconEl.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
    }

    // Mostrar
    // Pequeño delay para asegurar que el DOM se actualizó si se llama rápido
    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    // Ocultar después de 3 segundos
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
};