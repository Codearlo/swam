/* public/auth/register/register.js */

document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('register-form');
    const errorMessage = document.getElementById('register-error-message');

    if (!registerForm) return;

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorMessage.classList.add('u-hidden');
        errorMessage.textContent = '';

        const fullName = document.getElementById('full-name').value;
        const email = document.getElementById('email-register').value;
        const password = document.getElementById('password-register').value;
        const passwordConfirm = document.getElementById('password-confirm').value;

        if (password !== passwordConfirm) {
            errorMessage.textContent = 'Las contraseñas no coinciden.';
            errorMessage.classList.remove('u-hidden');
            return;
        }

        // --- MOCK DE LLAMADA A LA API (REEMPLAZAR POR LLAMADA REAL) ---
        try {
            // Simulación de respuesta de la API. Asumimos que la API siempre asigna 'client'
            const mockResponse = {
                success: true,
                token: 'mock_client_token_' + Date.now(),
                role: 'client',
                full_name: fullName
            };
            
            if (mockResponse.success) {
                // Las funciones setAuthData y redirectAfterLogin provienen de auth-utils.js
                setAuthData(mockResponse.token, mockResponse.role);
                redirectAfterLogin(mockResponse.role);
            } else {
                errorMessage.textContent = 'Error al registrar el usuario. Inténtalo con otro email.';
                errorMessage.classList.remove('u-hidden');
            }

        } catch (error) {
            console.error('Error al registrarse:', error);
            errorMessage.textContent = 'Error de conexión con el servidor. Intenta más tarde.';
            errorMessage.classList.remove('u-hidden');
        }
    });
});