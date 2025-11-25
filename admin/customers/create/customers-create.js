/* admin/customers/create/customers-create.js */

// Definimos la función globalmente para poder invocarla desde el listado
window.initCreateCustomerForm = function() {
    console.log('Inicializando formulario de creación de cliente...');
    
    const form = document.getElementById('create-customer-form');
    const btnSave = document.getElementById('btn-save');
    const btnText = document.getElementById('btn-text');
    const btnLoader = document.getElementById('btn-loader');
    const errorMsg = document.getElementById('form-error');

    // --- FUNCIÓN DE NOTIFICACIÓN (Toast) ---
    function showNotification(message, type = 'success') {
        // 1. Crear el elemento HTML
        const notification = document.createElement('div');
        notification.className = `toast-notification toast-${type}`;
        
        // Iconos SVG según el tipo
        const iconSvg = type === 'success' 
            ? '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>'
            : '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>';

        notification.innerHTML = `
            <span class="toast-icon">${iconSvg}</span>
            <span>${message}</span>
        `;

        // 2. Agregarlo al body
        document.body.appendChild(notification);

        // 3. Forzar un reflow para que la animación CSS funcione y agregar clase visible
        requestAnimationFrame(() => {
            notification.classList.add('is-visible');
        });

        // 4. Eliminar después de 3 segundos
        setTimeout(() => {
            notification.classList.remove('is-visible');
            // Esperar a que termine la transición para remover del DOM
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }

    // --- LÓGICA DEL FORMULARIO ---

    if (!form) {
        console.error('No se encontró el formulario #create-customer-form');
        return;
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Limpiar mensaje de error visual
        if (errorMsg) {
            errorMsg.textContent = '';
            errorMsg.classList.add('u-hidden');
        }

        const formData = new FormData(form);
        
        // Preparar datos para Supabase
        const data = {
            full_name: formData.get('full_name').trim(),
            email: formData.get('email').trim() || null,
            document_type: formData.get('document_type'),
            document_number: formData.get('document_number').trim() || null,
            phone: formData.get('phone').trim() || null,
            address: formData.get('address').trim() || null,
            notes: formData.get('notes').trim() || null,
            customer_since: new Date().toISOString().split('T')[0], // Fecha actual
            is_active: true
        };

        // Validación simple
        if (!data.full_name) {
            showError('El nombre completo es obligatorio.');
            return;
        }

        // UI Loading
        if (btnSave) btnSave.disabled = true;
        if (btnText) btnText.classList.add('u-hidden');
        if (btnLoader) btnLoader.classList.remove('u-hidden');

        try {
            const configured = typeof isSupabaseConfigured === 'function' ? isSupabaseConfigured() : false;
            
            if (configured) {
                // Insertar en Supabase
                const { error } = await supabaseClient
                    .from('customers')
                    .insert([data]);

                if (error) throw error;
                
                // Éxito: Usamos la nueva notificación
                showNotification('Cliente creado correctamente.', 'success');
                
                // Cerrar modal y recargar lista (funciones globales definidas en customers-list.js)
                if (typeof closeModal === 'function') closeModal();
                if (typeof loadCustomers === 'function') loadCustomers();

            } else {
                // Modo Mock (sin backend)
                console.log('Simulando guardado:', data);
                setTimeout(() => {
                    // Éxito Mock: Usamos la nueva notificación
                    showNotification('Cliente guardado (Modo Simulación).', 'success');
                    
                    if (typeof closeModal === 'function') closeModal();
                    if (typeof loadCustomers === 'function') loadCustomers();
                }, 1000);
            }

        } catch (error) {
            console.error('Error al crear cliente:', error);
            let msg = 'Ocurrió un error al guardar.';
            
            if (error.code === '23505') {
                msg = 'Ya existe un cliente con ese email o documento.';
            }
            
            showError(msg);
            
            // Restaurar botón
            if (btnSave) btnSave.disabled = false;
            if (btnText) btnText.classList.remove('u-hidden');
            if (btnLoader) btnLoader.classList.add('u-hidden');
        }
    });

    function showError(msg) {
        if (errorMsg) {
            errorMsg.textContent = msg;
            errorMsg.classList.remove('u-hidden');
        } else {
            // Si por alguna razón no existe el contenedor de error, usamos un toast de error
            showNotification(msg, 'error');
        }
    }
};