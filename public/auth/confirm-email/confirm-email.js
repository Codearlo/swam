/* public/auth/confirm-email/confirm-email.js */

document.addEventListener('DOMContentLoaded', async () => {
    const title = document.getElementById('confirmation-title');
    const message = document.getElementById('confirmation-message');
    const icon = document.getElementById('confirmation-icon');
    const homeButton = document.getElementById('home-button');
    const url = new URL(window.location.href);

    // Obtener el fragmento de la URL (donde Supabase pone el token)
    // Supabase usa fragmentos (#access_token=...) para los tokens de sesión.
    // La función verifySession de la API manejará esto.

    const processConfirmation = async () => {
        // En un entorno de producción con Supabase, la sesión ya debería estar
        // establecida por el cliente JS al cargar la URL con el hash fragment.
        // Simularemos la verificación y obtención del usuario logueado.
        
        const response = await api.verifySession();

        if (response.success) {
            // Éxito: Mostrar mensaje personalizado y redirigir
            const fullName = response.full_name || 'nuevo usuario';

            title.textContent = '¡Confirmación Exitosa!';
            message.innerHTML = `
                Hola **${fullName}**, tu correo electrónico ha sido confirmado.
                <br>Serás redirigido a la tienda en 5 segundos.
            `;
            icon.classList.remove('loading-spinner');
            icon.classList.add('success-icon');
            icon.innerHTML = '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>'; // Checkmark

            // Redirigir a la tienda
            setTimeout(() => {
                window.location.href = '../../../index.html';
            }, 5000); 

            homeButton.classList.remove('u-hidden');

        } else {
            // Error: Mostrar error y dar opción de ir a login
            title.textContent = 'Error de Confirmación';
            message.textContent = response.error || 'No se pudo verificar su correo. Intente iniciar sesión o solicite una nueva contraseña.';
            icon.classList.remove('loading-spinner');
            icon.classList.add('status-badge--error'); // Usar clase de estilo
            icon.innerHTML = '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>'; // Icono de error
            
            homeButton.textContent = 'Ir a Iniciar Sesión';
            homeButton.href = '/public/auth/login/login.html';
            homeButton.classList.remove('u-hidden');
        }
    };

    // La confirmación se ejecuta automáticamente al cargar la página
    processConfirmation();
});