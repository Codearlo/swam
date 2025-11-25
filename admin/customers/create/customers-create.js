/* admin/customers/create/customers-create.js */

// Definimos la función globalmente para poder invocarla desde el listado
window.initCreateCustomerForm = function() {
    console.log('Inicializando formulario de creación de cliente...');
    
    const form = document.getElementById('create-customer-form');
    const btnSave = document.getElementById('btn-save');
    const btnText = document.getElementById('btn-text');
    const btnLoader = document.getElementById('btn-loader');
    const errorMsg = document.getElementById('form-error');

    if (!form) {
        console.error('No se encontró el formulario #create-customer-form');
        return;
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Limpiar mensaje de error
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
                
                // Éxito
                alert('Cliente creado correctamente.');
                
                // Cerrar modal y recargar lista (funciones globales definidas en customers-list.js)
                if (typeof closeModal === 'function') closeModal();
                if (typeof loadCustomers === 'function') loadCustomers();

            } else {
                // Modo Mock (sin backend)
                console.log('Simulando guardado:', data);
                setTimeout(() => {
                    alert('Cliente guardado (Modo Simulación).');
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
            alert(msg);
        }
    }
};