/* public/store/index/store-index.js */

// Función para cargar un componente HTML (copiada de store-header.js para modularidad)
async function loadComponent(url, targetElementId) {
    const targetElement = document.getElementById(targetElementId);
    if (!targetElement) return;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const html = await response.text();
        targetElement.innerHTML = html;
    } catch (error) {
        console.error(`Error loading component from ${url}:`, error);
        targetElement.innerHTML = `<div class="u-flex-center" style="min-height: 50vh;"><h1>Error al cargar el contenido principal.</h1></div>`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // 1. Cargar el Banner principal en #app-container
    loadComponent('public/store/main-banner/store-main-banner.html', 'app-container');
    
    // Nota: Eliminamos el mensaje de 'Cargando...' ya que el banner se cargará aquí.
    const loadingMessage = document.getElementById('loading-message');
    if (loadingMessage) {
        loadingMessage.remove();
    }
});