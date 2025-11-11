/* public/auth/register/register.js */

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
    const authCard = document.querySelector('.auth-card');
    const errorMessage = document.getElementById('register-error-message');
    const passwordInput = document.getElementById('password-register');
    const strengthIndicator = document.getElementById('password-strength-indicator');

    if (!registerForm || !passwordInput || !strengthIndicator) return;

    passwordInput.addEventListener('input', () => {
        updatePasswordStrength(passwordInput.value, strengthIndicator);
    });

    const displayConfirmationMessage = () => {
        authCard.innerHTML = `
            <div class="auth-card__header u-flex-center" style="gap: 20px; text-align: center;">
                <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="var(--color-purple-primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--color-purple-primary); /* Simula el efecto Glass */">
                    <rect x="2" y="7" width="20" height="15" rx="2" ry="2"></rect>
                    <path d="M22 7l-10 7-10-7"></path>
                    <line x1="12" y1="18" x2="12" y2="12"></line>
                </svg>
                <h2 style="font-size: 2rem;">¡Registro Exitoso!</h2>
            </div>
            <p style="text-align: center; color: var(--color-purple-light); font-size: 1.1rem; margin-bottom: 30px;">
                Hemos enviado un **enlace de confirmación** a tu correo electrónico. 
                <br><br>
                Ve a tu bandeja de entrada y haz clic en el enlace para activar tu cuenta.
            </p>
            <a href="../login/login.html" class="button button--primary u-full-width">
                Ir a Iniciar Sesión
            </a>
        `;
        authCard.style.padding = '60px 40px';
    };

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorMessage.classList.add('u-hidden');
        errorMessage.textContent = '';
        errorMessage.style.color = 'var(--color-error)';

        const fullName = document.getElementById('full-name').value.trim();
        const email = document.getElementById('email-register').value.trim();
        const password = passwordInput.value;

        if (!fullName || fullName.length < 3) {
            errorMessage.textContent = 'El nombre completo debe tener al menos 3 caracteres.';
            errorMessage.classList.remove('u-hidden');
            return;
        }

        if (password.length < 6) {
            errorMessage.textContent = 'La contraseña debe tener al menos 6 caracteres.';
            errorMessage.classList.remove('u-hidden');
            return;
        }

        const submitBtn = registerForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Registrando...';

        try {
            const response = await api.registerUser({
                full_name: fullName,
                email: email,
                password: password
            });

            if (response.success) {
                // Si la API devuelve éxito (sin importar si es MOCK o producción con verificación)
                // Ocultamos el formulario y mostramos el mensaje de confirmación
                displayConfirmationMessage();
            } else {
                // Flujo de Error (Ej. usuario ya existe, error de Supabase)
                errorMessage.textContent = response.error || 'Error al registrar el usuario. Inténtalo de nuevo.';
                errorMessage.classList.remove('u-hidden');
                submitBtn.disabled = false;
                submitBtn.textContent = 'Registrarse';
            }

        } catch (error) {
            console.error('Error al registrarse:', error);
            errorMessage.textContent = 'Error de conexión. Intenta más tarde.';
            errorMessage.classList.remove('u-hidden');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Registrarse';
        }
    });
});