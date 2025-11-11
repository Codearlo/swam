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
    const errorMessage = document.getElementById('register-error-message');
    const passwordInput = document.getElementById('password-register');
    const strengthIndicator = document.getElementById('password-strength-indicator');

    if (!registerForm || !passwordInput || !strengthIndicator) return;

    passwordInput.addEventListener('input', () => {
        updatePasswordStrength(passwordInput.value, strengthIndicator);
    });

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
                if (response.needsEmailVerification) {
                    // Este bloque SÓLO se ejecutará si Supabase está configurado y requiere email
                    errorMessage.textContent = response.message || 'Verifica tu email para completar el registro.';
                    errorMessage.style.color = 'var(--color-success)';
                    errorMessage.classList.remove('u-hidden');
                    
                    window.location.href = '/public/auth/login/login.html';
                } else {
                    // ESTA ES LA RUTA DE ÉXITO INMEDIATO (Modo MOCK o Producción sin verificación)
                    setAuthData(response.token, response.role, response.full_name);
                    redirectAfterLogin(response.role); // Redirige al /index.html
                }
            } else {
                errorMessage.textContent = response.error || 'Error al registrar el usuario.';
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