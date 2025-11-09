/* public/store/header/store-header.js */

document.addEventListener('DOMContentLoaded', () => {
    const headerContainer = document.getElementById('store-header-container');
    const currentPath = window.location.pathname;

    // Verificar si estamos en una página de autenticación que NO debe cargar el header
    const isAuthPage = currentPath.includes('/public/auth/login/') || currentPath.includes('/public/auth/register/');

    // Si estamos en una página de autenticación, salimos inmediatamente.
    if (isAuthPage) {
        if (headerContainer) {
            headerContainer.remove();
        }
        return; 
    }

    // Función para cargar un componente HTML (mantenida ya que el header se carga con JS)
    async function loadComponent(url, targetElement) {
        try {
            // Se asume que en este punto (no es página de auth) la ruta relativa funcionará
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const html = await response.text();
            targetElement.innerHTML = html;
            
            // Lógica adicional después de cargar el componente:
            if (url.includes('store-header.html')) {
                setupProfileMenu();
            }
        } catch (error) {
            console.error(`Error loading component from ${url}:`, error);
            targetElement.innerHTML = '<h1>Error al cargar el Header.</h1>';
        }
    }

    // Lógica del Menú Desplegable (se mantiene la lógica de inyección de enlaces)
    function setupProfileMenu() {
        const iconButton = document.querySelector('#profile-menu-container .store-header__icon-link');
        const dropdown = document.getElementById('profile-dropdown');
        const isUserAuthenticated = typeof isAuthenticated === 'function' ? isAuthenticated() : false;
        const userRole = typeof getUserRole === 'function' ? getUserRole() : null;

        if (!iconButton || !dropdown) return;

        // Mostrar/Ocultar el menú al hacer clic en el icono
        iconButton.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('u-hidden');
        });

        // Ocultar el menú al hacer clic fuera
        document.addEventListener('click', (e) => {
            if (!dropdown.contains(e.target) && !iconButton.contains(e.target)) {
                dropdown.classList.add('u-hidden');
            }
        });

        // Generar el contenido del menú
        if (isUserAuthenticated) {
            // Usuario autenticado: Mostrar Dashboard/Perfil y Logout
            let authenticatedLinks = '';
            
            if (userRole === 'admin') {
                authenticatedLinks += `
                    <a href="/admin/dashboard.html" class="dropdown-item">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line><line x1="15" y1="3" x2="15" y2="21"></line><line x1="3" y1="9" x2="21" y2="9"></line><line x1="3" y1="15" x2="21" y2="15"></line></svg>
                        <span>Dashboard Admin</span>
                    </a>
                `;
            } else {
                 authenticatedLinks += `
                    <a href="/profile.html" class="dropdown-item">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                        <span>Mi Perfil</span>
                    </a>
                `;
            }

            authenticatedLinks += `
                <button id="logout-button" class="dropdown-item is-logout">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                    <span>Cerrar Sesión</span>
                </button>
            `;
            
            dropdown.innerHTML = authenticatedLinks;

            document.getElementById('logout-button')?.addEventListener('click', (e) => {
                e.preventDefault();
                if (typeof logout === 'function') {
                    logout();
                }
            });
            
        } else {
            // Usuario NO autenticado: Mostrar Login y Register con enlaces directos
            dropdown.innerHTML = `
                <a href="/public/auth/login/login.html" class="dropdown-item">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"></path><path d="M10 14L21 3"></path><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path></svg>
                    <span>Iniciar sesión</span>
                </a>
                <a href="/public/auth/register/register.html" class="dropdown-item">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>
                    <span>Registrarse</span>
                </a>
            `;
        }
    }

    // Cargar el componente del header si no es una página de autenticación
    if (headerContainer) {
        loadComponent('public/store/header/store-header.html', headerContainer);
    }
});