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

        // --- MOCK DE LLAMADA A LA API (REEMPLAZAR POR LLAMADA REAL) ---
        try {
            // Simulación de respuesta de la API para pruebas de frontend y redirección.
            let mockResponse;
            // Usuarios simulados: admin@swam.com (admin), client@swam.com (cliente)
            if (email === 'admin@swam.com' && password === '123456') {
                mockResponse = {
                    success: true,
                    token: 'mock_admin_token_123',
                    role: 'admin',
                    full_name: 'Admin User' // NOMBRE SIMULADO
                };
            } else if (email === 'client@swam.com' && password === '123456') {
                mockResponse = {
                    success: true,
                    token: 'mock_client_token_456',
                    role: 'client', 
                    full_name: 'Client User' // NOMBRE SIMULADO
                };
            } else {
                mockResponse = {
                    success: false,
                    message: 'Credenciales inválidas. Inténtalo de nuevo.'
                };
            }

            if (mockResponse.success) {
                // LLAMADA ACTUALIZADA con mockResponse.full_name
                setAuthData(mockResponse.token, mockResponse.role, mockResponse.full_name);
                redirectAfterLogin(mockResponse.role);
            } else {
                errorMessage.textContent = mockResponse.message;
                errorMessage.classList.remove('u-hidden');
            }

        } catch (error) {
            console.error('Error al iniciar sesión:', error);
            errorMessage.textContent = 'Error de conexión con el servidor. Intenta más tarde.';
            errorMessage.classList.remove('u-hidden');
        }
    });
});