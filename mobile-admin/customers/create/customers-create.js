/* mobile-admin/customers/create/customers-create.js */

document.addEventListener('DOMContentLoaded', () => {
    const btnSave = document.getElementById('btn-save');
    
    btnSave.addEventListener('click', async () => {
        // Recolectar datos
        const fullName = document.getElementById('full_name').value.trim();
        const docType = document.getElementById('document_type').value;
        const docNumber = document.getElementById('document_number').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const email = document.getElementById('email').value.trim();
        const address = document.getElementById('address').value.trim();

        // Validación simple
        if (!fullName) {
            alert('El nombre es obligatorio');
            return;
        }

        // Estado de carga
        btnSave.disabled = true;
        btnSave.textContent = 'Guardando...';

        const customerData = {
            full_name: fullName,
            document_type: docType,
            document_number: docNumber || null,
            phone: phone || null,
            email: email || null,
            address: address || null,
            is_active: true,
            customer_since: new Date().toISOString()
        };

        try {
            const res = await mobileApi.createCustomer(customerData);
            
            if (res.success) {
                // Éxito
                alert('Cliente creado correctamente');
                history.back(); // Volver a la lista
            } else {
                throw new Error(res.error || 'Error desconocido');
            }
        } catch (error) {
            console.error(error);
            alert('Error al guardar: ' + error.message);
            btnSave.disabled = false;
            btnSave.textContent = 'Guardar Cliente';
        }
    });
});