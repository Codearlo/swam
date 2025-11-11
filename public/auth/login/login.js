/* public/auth/login/login.js */

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const googleLoginBtn = document.getElementById('google-login-btn'); 
    const errorMessage = document.getElementById('login-error-message');

    if (!loginForm) return;

    // Lógica para Email/Password
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

    // Lógica para Google Sign-In
    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            errorMessage.classList.add('u-hidden');
            errorMessage.textContent = '';
            
            googleLoginBtn.disabled = true;
            googleLoginBtn.textContent = 'Redirigiendo a Google...';

            try {
                const response = await api.signInWithGoogle();
                
                if (response.success && response.url) {
                    // Redirigir al usuario a la URL de autenticación de Google
                    window.location.href = response.url;
                } else {
                    errorMessage.textContent = response.error || 'Error al iniciar sesión con Google.';
                    errorMessage.classList.remove('u-hidden');
                    googleLoginBtn.disabled = false;
                    googleLoginBtn.innerHTML = '<img src="../../assets/icons/google.svg" alt="Google Icon" class="oauth-icon"> Acceder con Google';
                }
            } catch (error) {
                console.error('Error al iniciar sesión con Google:', error);
                errorMessage.textContent = 'Error de conexión. Intenta más tarde.';
                errorMessage.classList.remove('u-hidden');
                googleLoginBtn.disabled = false;
                googleLoginBtn.innerHTML = '<img src="../../assets/icons/google.svg" alt="Google Icon" class="oauth-icon"> Acceder con Google';
            }
        });
    }
});