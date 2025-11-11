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
    const googleRegisterBtn = document.getElementById('google-register-btn');
    const errorMessage = document.getElementById('register-error-message');
    const passwordInput = document.getElementById('password-register');
    const strengthIndicator = document.getElementById('password-strength-indicator');

    // Comprobamos si los elementos de la barra de fortaleza existen antes de agregar el listener
    if (passwordInput && strengthIndicator) {
        passwordInput.addEventListener('input', () => {
            updatePasswordStrength(passwordInput.value, strengthIndicator);
        });
    }

    if (!registerForm) return;

    // Lógica para Email/Password
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
            // CORRECCIÓN DEFENSIVA: Verifica la API
            if (typeof api === 'undefined' || typeof api.registerUser !== 'function') {
                throw new Error('Las funciones de autenticación no están cargadas.');
            }
            
            const response = await api.registerUser({
                full_name: fullName,
                email: email,
                password: password
            });

            if (response.success) {
                // Éxito en el registro Y auto-login
                redirectAfterLogin(response.role || 'client');
            } else if (response.needsEmailVerification) {
                 // Si aún requiere verificación (Supabase no fue configurado correctamente)
                errorMessage.textContent = 'Registro exitoso. Se requiere la verificación de email. Por favor, revisa tu bandeja de entrada.';
                errorMessage.classList.remove('u-hidden');
                submitBtn.disabled = false;
                submitBtn.textContent = 'Registrarse';
            } 
            else {
                // Flujo de Error (Ej. usuario ya existe, error de Supabase)
                errorMessage.textContent = response.error || 'Error al registrar el usuario. Inténtalo de nuevo.';
                errorMessage.classList.remove('u-hidden');
                submitBtn.disabled = false;
                submitBtn.textContent = 'Registrarse';
            }

        } catch (error) {
            console.error('Error al registrarse:', error);
            errorMessage.textContent = error.message.includes('cargadas') ? error.message : 'Error de conexión. Intenta más tarde.';
            errorMessage.classList.remove('u-hidden');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Registrarse';
        }
    });

    // Lógica para Google Sign-In
    if (googleRegisterBtn) {
        googleRegisterBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            errorMessage.classList.add('u-hidden');
            errorMessage.textContent = '';
            
            // CORRECCIÓN DEFENSIVA: Verifica que 'api' exista antes de usarlo.
            if (typeof api === 'undefined' || typeof api.signInWithGoogle !== 'function') {
                errorMessage.textContent = 'Error interno: Las funciones de autenticación no están cargadas.';
                errorMessage.classList.remove('u-hidden');
                return;
            }

            googleRegisterBtn.disabled = true;
            googleRegisterBtn.textContent = 'Redirigiendo a Google...';

            try {
                const response = await api.signInWithGoogle();
                
                if (response.success && response.url) {
                    // Redirigir al usuario a la URL de autenticación de Google
                    window.location.href = response.url;
                } else {
                    errorMessage.textContent = response.error || 'Error al registrarse con Google.';
                    errorMessage.classList.remove('u-hidden');
                    googleRegisterBtn.disabled = false;
                    googleRegisterBtn.innerHTML = '<img src="../../assets/icons/google.svg" alt="Google Icon" class="oauth-icon"> Registrarse con Google';
                }
            } catch (error) {
                console.error('Error al registrarse con Google:', error);
                errorMessage.textContent = 'Error de conexión. Intenta más tarde.';
                errorMessage.classList.remove('u-hidden');
                googleRegisterBtn.disabled = false;
                googleRegisterBtn.innerHTML = '<img src="../../assets/icons/google.svg" alt="Google Icon" class="oauth-icon"> Registrarse con Google';
            }
        });
    }
});