/* public/auth/login/login.js */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Redirigir si ya está autenticado (Igual que en register.js)
    if (typeof isAuthenticated === 'function' && isAuthenticated()) {
        const userRole = typeof getUserRole === 'function' ? getUserRole() : 'client';
        redirectAfterLogin(userRole);
        return; // Detener la ejecución si ya hay sesión
    }
    
    const loginForm = document.getElementById('login-form');
    const googleLoginBtn = document.getElementById('google-login-btn'); 
    const errorMessage = document.getElementById('login-error-message');

    // Validación básica de existencia de elementos
    if (!loginForm) return;

    // --- LÓGICA PARA EMAIL/PASSWORD ---
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Limpiar errores previos
        errorMessage.classList.add('u-hidden');
        errorMessage.textContent = '';
        
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

        // Deshabilitar botón durante la petición
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Iniciando sesión...';

        try {
            // Verificar disponibilidad de la API
            if (typeof api === 'undefined' || typeof api.loginUser !== 'function') {
                throw new Error('Error interno: API no cargada.');
            }

            const response = await api.loginUser({ email, password });

            if (response.success) {
                // Redirigir según el rol
                redirectAfterLogin(response.role);
            } else {
                // Manejo de errores de credenciales o sistema
                errorMessage.textContent = response.error || 'Credenciales incorrectas.';
                errorMessage.classList.remove('u-hidden');
                submitBtn.disabled = false;
                submitBtn.textContent = originalBtnText;
            }

        } catch (error) {
            console.error('Error al iniciar sesión:', error);
            errorMessage.textContent = 'Error de conexión. Intenta más tarde.';
            errorMessage.classList.remove('u-hidden');
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
        }
    });

    // --- LÓGICA PARA GOOGLE SIGN-IN (Réplica exacta de register.js) ---
    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            
            // Limpiar errores previos
            errorMessage.classList.add('u-hidden');
            errorMessage.textContent = '';
            
            // CORRECCIÓN DEFENSIVA: Verifica que 'api' exista antes de usarlo
            if (typeof api === 'undefined' || typeof api.signInWithGoogle !== 'function') {
                errorMessage.textContent = 'Error interno: Las funciones de autenticación no están cargadas.';
                errorMessage.classList.remove('u-hidden');
                return;
            }

            // Estado de carga UI
            googleLoginBtn.disabled = true;
            // Guardamos el contenido HTML original para restaurarlo si falla (icono + texto)
            const originalBtnContent = googleLoginBtn.innerHTML; 
            googleLoginBtn.textContent = 'Redirigiendo a Google...';

            try {
                const response = await api.signInWithGoogle();
                
                if (response.success && response.url) {
                    // ÉXITO: Redirigir al usuario a la URL de autenticación de Google (Supabase)
                    window.location.href = response.url;
                } else {
                    // ERROR CONTROLADO
                    errorMessage.textContent = response.error || 'Error al iniciar sesión con Google.';
                    errorMessage.classList.remove('u-hidden');
                    
                    // Restaurar botón
                    googleLoginBtn.disabled = false;
                    googleLoginBtn.innerHTML = originalBtnContent;
                }
            } catch (error) {
                // ERROR DE RED O INESPERADO
                console.error('Error al iniciar sesión con Google:', error);
                errorMessage.textContent = 'Error de conexión. Intenta más tarde.';
                errorMessage.classList.remove('u-hidden');
                
                // Restaurar botón
                googleLoginBtn.disabled = false;
                googleLoginBtn.innerHTML = originalBtnContent;
            }
        });
    }
});