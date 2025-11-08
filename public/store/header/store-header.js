/* public/store/header/store-header.js */

document.addEventListener('DOMContentLoaded', () => {
    const headerContainer = document.getElementById('store-header-container');

    // Función para cargar un componente HTML
    async function loadComponent(url, targetElement) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const html = await response.text();
            targetElement.innerHTML = html;
        } catch (error) {
            console.error(`Error loading component from ${url}:`, error);
            targetElement.innerHTML = '<h1>Error al cargar el Header.</h1>';
        }
    }

    // Cargar el componente del header
    if (headerContainer) {
        loadComponent('public/store/header/store-header.html', headerContainer);
    }

    // Nota: La lógica para el efecto de scroll/blurriness en el fondo del body
    // se maneja principalmente con CSS (position: sticky y backdrop-filter).
    // Si se necesitara cambiar la clase del header al hacer scroll, se añadiría aquí.
});