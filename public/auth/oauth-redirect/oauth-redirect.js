/* public/auth/oauth-redirect/oauth-redirect.js */

document.addEventListener('DOMContentLoaded', async () => {
    const title = document.getElementById('redirect-title');
    const message = document.getElementById('redirect-message');
    const icon = document.getElementById('redirect-icon');
    const homeButton = document.getElementById('home-button');

    // Muestra la animación de carga (que ya está en el HTML)
    // mientras se ejecuta esta función asíncrona.
    const processRedirect = async () => {
        
        // El spinner gira mientras 'await' está esperando la respuesta de la API.
        const response = await api.handleOAuthRedirect();

        // Una vez que la API responde, detenemos la animación y mostramos el resultado.

        if (response.success) {
            // ÉXITO REAL
            title.textContent = '¡Inicio de Sesión Exitoso!';
            message.innerHTML = `Serás redirigido a la tienda en 3 segundos.`;
            
            // Detener animación y cambiar icono a 'Check'
            icon.style.animation = 'none';
            icon.style.color = 'var(--color-purple-primary)'; // (Éxito ahora usa el color de acento)
            icon.innerHTML = '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>'; 

            setTimeout(() => {
                redirectAfterLogin(response.role || 'client');
            }, 3000); 

            homeButton.classList.remove('u-hidden');

        } else {
            // MANEJO DE ERROR (Incluyendo RLS)
            let errorMessageText = response.error || 'No se pudo iniciar sesión con Google. Intente nuevamente.';
            
            if (errorMessageText.includes('invalid input syntax for type bigint')) {
                errorMessageText = 'Error de BD (BigInt): El tipo de ID de usuario es incorrecto.';
            } else if (errorMessageText.includes('violates row-level security policy')) {
                errorMessageText = 'Error de Permisos (RLS): No se pudo crear el perfil de usuario.';
            }

            title.textContent = 'Error de Acceso';
            message.textContent = errorMessageText;
            
            // Detener animación y cambiar icono a 'Error'
            icon.style.animation = 'none';
            icon.style.color = 'var(--color-error)'; 
            icon.innerHTML = '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>';
            
            homeButton.textContent = 'Ir a Iniciar Sesión';
            homeButton.href = '/public/auth/login/login.html';
            homeButton.classList.remove('u-hidden');
        }
    };

    // Ejecutar el proceso
    processRedirect();
});