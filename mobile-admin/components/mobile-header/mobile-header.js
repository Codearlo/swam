/* mobile-admin/components/mobile-header/mobile-header.js */

async function loadMobileHeader() {
    const container = document.getElementById('mobile-header-container');
    if (!container) return;

    try {
        const response = await fetch('../../mobile-admin/components/mobile-header/mobile-header.html');
        
        if (response.ok) {
            container.innerHTML = await response.text();
            initializeHeaderData();
            initializeNotifications(); // Nueva función
        } else {
            console.error('Error cargando mobile-header.html');
        }
    } catch (error) {
        console.error('Error en loadMobileHeader:', error);
    }
}

function initializeHeaderData() {
    const fullName = localStorage.getItem('swam_user_full_name') || 'Admin';
    const firstName = fullName.split(' ')[0];
    const initial = firstName.charAt(0).toUpperCase();

    const nameEl = document.getElementById('mobile-header-username');
    const avatarEl = document.getElementById('mobile-header-avatar');

    if (nameEl) nameEl.textContent = firstName;
    if (avatarEl) avatarEl.textContent = initial;
}

function initializeNotifications() {
    const btnNotif = document.getElementById('btn-notifications');
    const btnClose = document.getElementById('btn-close-notif');
    const modal = document.getElementById('notifications-modal');

    if (btnNotif && modal) {
        // Toggle abrir/cerrar
        btnNotif.addEventListener('click', (e) => {
            e.stopPropagation(); // Evitar que el click cierre inmediatamente
            modal.classList.toggle('u-hidden');
        });

        // Botón cerrar interno
        if (btnClose) {
            btnClose.addEventListener('click', (e) => {
                e.stopPropagation();
                modal.classList.add('u-hidden');
            });
        }

        // Cerrar al hacer click fuera
        document.addEventListener('click', (e) => {
            if (!modal.contains(e.target) && !btnNotif.contains(e.target)) {
                modal.classList.add('u-hidden');
            }
        });
    }
}

// Exponer globalmente
window.loadMobileHeader = loadMobileHeader;