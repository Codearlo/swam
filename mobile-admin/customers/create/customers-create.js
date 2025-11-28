/* mobile-admin/customers/create/customers-create.js */

document.addEventListener('DOMContentLoaded', () => {
    setupDocumentTypeDropdown();
    setupInputValidations();
    setupSaveAction();
});

function setupDocumentTypeDropdown() {
    const wrapper = document.getElementById('doctype-wrapper');
    const display = document.getElementById('document_type_display');
    const inputType = document.getElementById('document_type');
    const inputNumber = document.getElementById('document_number');
    const dropdown = document.getElementById('doctype-dropdown');
    const options = document.querySelectorAll('.dropdown-option');

    // Toggle Dropdown
    wrapper.addEventListener('click', (e) => {
        if(e.target.classList.contains('dropdown-option')) return;
        dropdown.classList.toggle('u-hidden');
    });

    // Selección de Opción
    options.forEach(opt => {
        opt.addEventListener('click', () => {
            const val = opt.getAttribute('data-value');
            
            // Actualizar UI
            display.value = val;
            inputType.value = val;
            dropdown.classList.add('u-hidden');

            // Actualizar validaciones visuales
            inputNumber.value = ''; // Limpiar al cambiar tipo
            if (val === 'RUC') {
                inputNumber.maxLength = 11;
                inputNumber.placeholder = "N° RUC (11 dígitos)";
            } else {
                inputNumber.maxLength = 8;
                inputNumber.placeholder = `N° ${val} (8 dígitos)`;
            }
        });
    });

    document.addEventListener('click', (e) => {
        if (!wrapper.contains(e.target)) {
            dropdown.classList.add('u-hidden');
        }
    });
}

function setupInputValidations() {
    const numInput = document.getElementById('document_number');
    const phoneInput = document.getElementById('phone');

    // Solo permitir números
    const enforceNumbers = (e) => {
        e.target.value = e.target.value.replace(/\D/g, '');
    };

    numInput.addEventListener('input', enforceNumbers);
    phoneInput.addEventListener('input', enforceNumbers);
}

function setupSaveAction() {
    const btnSave = document.getElementById('btn-save');
    
    btnSave.addEventListener('click', async () => {
        // Obtener valores
        const fullName = document.getElementById('full_name').value.trim();
        const docType = document.getElementById('document_type').value;
        let docNumber = document.getElementById('document_number').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const email = document.getElementById('email').value.trim();
        const address = document.getElementById('address').value.trim();

        // 1. Validación: Nombre Indispensable
        if (!fullName) {
            alert('El Nombre es obligatorio.');
            return;
        }

        // 2. Lógica de Documento Automático (Si está vacío)
        if (!docNumber) {
            if (docType === 'RUC') {
                docNumber = '00000000000'; // 11 ceros por defecto
            } else {
                docNumber = '00000000'; // 8 ceros por defecto (DNI/CE)
            }
        }

        // Validación de Longitud (Aplica tanto si el usuario escribió como si fue automático)
        if ((docType === 'DNI' || docType === 'CE') && docNumber.length !== 8) {
            alert(`El ${docType} debe tener 8 dígitos.`);
            return;
        }
        if (docType === 'RUC' && docNumber.length !== 11) {
            alert('El RUC debe tener 11 dígitos.');
            return;
        }

        btnSave.disabled = true;
        btnSave.textContent = 'Guardando...';

        const customerData = {
            full_name: fullName,
            document_type: docType,
            document_number: docNumber,
            // 3. Campos Opcionales (Se envían null si están vacíos)
            phone: phone || null,
            email: email || null,
            address: address || null,
            is_active: true,
            customer_since: new Date().toISOString()
        };

        try {
            const res = await mobileApi.createCustomer(customerData);
            
            if (res.success) {
                alert('Cliente creado correctamente');
                history.back(); 
            } else {
                throw new Error(res.error || 'Error desconocido');
            }
        } catch (error) {
            console.error(error);
            // Manejo específico de error de duplicados (Supabase constraint)
            if (error.message.includes('unique constraint') || error.message.includes('duplicate key')) {
                alert('Error: Ya existe un cliente con este número de documento.');
            } else {
                alert('Error al guardar: ' + error.message);
            }
            btnSave.disabled = false;
            btnSave.textContent = 'Guardar Cliente';
        }
    });
}