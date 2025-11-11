/* public/auth/login/login.js */

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const errorMessage = document.getElementById('login-error-message');

    if (!loginForm) return;

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorMessage.classList.add('u-hidden');
        errorMessage.textContent = '';
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        // Deshabilitar botón durante la petición
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Iniciando sesión...';

        try {
            // Llamada real a la API
            const response = await api.loginUser({ email, password });

            if (response.success) {
                // Guardar datos de autenticación
                setAuthData(response.token, response.role, response.full_name);
                // Redirigir según el rol
                redirectAfterLogin(response.role);
            } else {
                errorMessage.textContent = response.error || 'Error al iniciar sesión';
                errorMessage.classList.remove('u-hidden');
                submitBtn.disabled = false;
                submitBtn.textContent = 'Acceder a SWAM';
            }

        } catch (error) {
            console.error('Error al iniciar sesión:', error);
            errorMessage.textContent = 'Error de conexión con el servidor. Intenta más tarde.';
            errorMessage.classList.remove('u-hidden');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Acceder a SWAM';
        }
    });
});