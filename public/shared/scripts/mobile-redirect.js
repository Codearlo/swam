/* public/shared/scripts/mobile-redirect.js */
(function() {
    // 1. Configuración: ¿Cuál es la raíz de tu versión móvil?
    const MOBILE_ROOT = '/mobile-admin/';
    
    // 2. Definir qué consideramos "Móvil"
    // Comprobamos el Agente de Usuario (User Agent) y el ancho de pantalla
    const isMobileUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isSmallScreen = window.innerWidth <= 768; // O 1024 si quieres incluir tablets verticales

    // 3. Lógica de Redirección
    if (isMobileUserAgent || isSmallScreen) {
        
        // Evitar bucles infinitos: Si ya estamos en la carpeta móvil, NO hacer nada
        if (window.location.pathname.includes(MOBILE_ROOT)) {
            return;
        }

        console.log('📱 Dispositivo móvil detectado. Redirigiendo a la versión móvil...');

        // ESTRATEGIA DE REDIRECCIÓN:
        // Opción A: Redirigir siempre al Dashboard Móvil principal
        window.location.href = MOBILE_ROOT + 'dashboard/dashboard.html';

        /* Opción B (Avanzada): Intentar llevar al usuario a la misma página pero en versión móvil.
           Esto requiere que tus carpetas coincidan exactamente.
           
           const currentPath = window.location.pathname;
           // Reemplaza '/admin/' por '/mobile-admin/'
           const newPath = currentPath.replace('/admin/', MOBILE_ROOT);
           window.location.href = newPath;
        */
    }
})();