/* public/shared/scripts/auth-utils.js */

/**
 * Almacena el token y el rol del usuario en el Local Storage.
 * @param {string} token - El token de autenticación (JWT).
 * @param {string} role - El rol del usuario ('admin' o 'client').
 */
function setAuthData(token, role) {
    localStorage.setItem('swam_auth_token', token);
    // La base de datos usa 'employee', pero el frontend usará 'client' por defecto si no es 'admin'.
    localStorage.setItem('swam_user_role', role === 'admin' ? 'admin' : 'client'); 
}

/**
 * Obtiene el token de autenticación.
 * @returns {string | null} El token de autenticación o null si no existe.
 */
function getAuthToken() {
    return localStorage.getItem('swam_auth_token');
}

/**
 * Obtiene el rol del usuario.
 * @returns {string | null} El rol del usuario o null si no existe.
 */
function getUserRole() {
    return localStorage.getItem('swam_user_role');
}

/**
 * Cierra la sesión, elimina los datos de autenticación y redirige a la página principal.
 */
function logout() {
    localStorage.removeItem('swam_auth_token');
    localStorage.removeItem('swam_user_role');
    // Redirección con recarga completa
    window.location.href = '/'; 
}

/**
 * Redirige al usuario según su rol después de iniciar sesión.
 * - 'admin' va a /admin/dashboard.html
 * - 'client' va a /index.html
 * @param {string} role - El rol del usuario ('admin' o 'client').
 */
function redirectAfterLogin(role) {
    if (role === 'admin') {
        window.location.href = '/admin/dashboard.html'; // Redirección al Dashboard de Admin
    } else {
        window.location.href = '/index.html'; // Redirección a la tienda (Cliente)
    }
}

/**
 * Verifica si el usuario está autenticado.
 * @returns {boolean} True si hay un token, False en caso contrario.
 */
function isAuthenticated() {
    return !!getAuthToken();
}