/* public/auth/register/register.js */

/**
 * Mide la fortaleza de la contraseña y actualiza la barra.
 * @param {string} password - La contraseña ingresada.
 * @param {HTMLElement} indicator - Elemento span para la barra de color.
 */
function updatePasswordStrength(password, indicator) {
    let strength = 0;
    if (password.length > 5) strength++;
    if (password.length > 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    indicator.classList.remove('strength-weak', 'strength-medium', 'strength-strong');

    if (password.length === 0) {
        indicator.style.width = '0%';
    } else if (strength < 3) {
        indicator.style.width = '33%';
        indicator.classList.add('strength-weak');
    } else if (strength < 5) {
        indicator.style.width = '66%';
        indicator.classList.add('strength-medium');
    } else {
        indicator.style.width = '100%';
        indicator.classList.add('strength-strong');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('register-form');
    const errorMessage = document.getElementById('register-error-message');
    const passwordInput = document.getElementById('password-register');
    const strengthIndicator = document.getElementById('password-strength-indicator');

    if (!registerForm || !passwordInput || !strengthIndicator) return;

    // Listener para actualizar la barra en tiempo real
    passwordInput.addEventListener('input', () => {
        updatePasswordStrength(passwordInput.value, strengthIndicator);
    });

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorMessage.classList.add('u-hidden');
        errorMessage.textContent = '';

        const fullName = document.getElementById('full-name').value;
        const email = document.getElementById('email-register').value;
        const password = passwordInput.value;
        // La validación de confirmación de contraseña se ha eliminado.

        // Simulación: Comprobar que la contraseña tenga una fortaleza mínima (ej. > 5 caracteres)
        if (password.length < 6) {
            errorMessage.textContent = 'La contraseña debe tener al menos 6 caracteres.';
            errorMessage.classList.remove('u-hidden');
            return;
        }

        // --- MOCK DE LLAMADA A LA API ---
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