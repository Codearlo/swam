/* public/shared/scripts/cache-buster.js */

/**
 * Función que añade una marca de tiempo dinámica (cache buster) a los archivos
 * CSS y JS. Esto fuerza al navegador a recargar los recursos y no usar la caché.
 */
function forceRecache() {
    const cacheBuster = Date.now(); 

    // Procesa todos los enlaces CSS (link rel="stylesheet")
    document.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
        const url = new URL(link.href, window.location.href);
        url.searchParams.set('v', cacheBuster); 
        link.href = url.toString();
    });

    // Procesa todos los scripts JS (script src="")
    document.querySelectorAll('script[src]').forEach(script => {
        const url = new URL(script.src, window.location.href);
        // Solo aplica a scripts cargados desde el mismo origen (locales)
        if (url.origin === window.location.origin) {
            url.searchParams.set('v', cacheBuster); 
            script.src = url.toString();
        }
    });
}

// Ejecutar inmediatamente para asegurar que los recursos se carguen sin caché.
forceRecache();