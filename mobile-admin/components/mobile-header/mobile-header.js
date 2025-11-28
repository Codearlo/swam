/* mobile-admin/components/mobile-header/mobile-header.js */

async function loadMobileHeader() {
    const container = document.getElementById('mobile-header-container');
    if (!container) return;

    try {
        // CORRECCIÓN: Ruta Absoluta para evitar errores 404
        const response = await fetch('/mobile-admin/components/mobile-header/mobile-header.html');
        
        if (response.ok) {
            container.innerHTML = await response.text();
            initializeHeaderData();
            initializeNotifications();
        } else {
            console.error('Error cargando header:', response.status);
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
        btnNotif.addEventListener('click', (e) => {
            e.stopPropagation();
            modal.classList.toggle('u-hidden');
        });

        if (btnClose) {
            btnClose.addEventListener('click', (e) => {
                e.stopPropagation();
                modal.classList.add('u-hidden');
            });
        }

        document.addEventListener('click', (e) => {
            if (!modal.contains(e.target) && !btnNotif.contains(e.target)) {
                modal.classList.add('u-hidden');
            }
        });
    }
}

window.loadMobileHeader = loadMobileHeader;