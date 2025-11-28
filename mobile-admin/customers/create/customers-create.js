/* mobile-admin/customers/create/customers-create.js */

document.addEventListener('DOMContentLoaded', () => {
    setupDocumentTypeDropdown();
    setupInputValidations();
    setupSaveAction();
});

// ... (Las funciones setupDocumentTypeDropdown y setupInputValidations son idénticas a la versión anterior)
function setupDocumentTypeDropdown() {
    const wrapper = document.getElementById('doctype-wrapper');
    const display = document.getElementById('document_type_display');
    const inputType = document.getElementById('document_type');
    const inputNumber = document.getElementById('document_number');
    const dropdown = document.getElementById('doctype-dropdown');
    const options = document.querySelectorAll('.dropdown-option');

    wrapper.addEventListener('click', (e) => {
        if(e.target.classList.contains('dropdown-option')) return;
        dropdown.classList.toggle('u-hidden');
    });

    options.forEach(opt => {
        opt.addEventListener('click', () => {
            const val = opt.getAttribute('data-value');
            display.value = val;
            inputType.value = val;
            dropdown.classList.add('u-hidden');
            inputNumber.value = ''; 
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
    const enforceNumbers = (e) => { e.target.value = e.target.value.replace(/\D/g, ''); };
    numInput.addEventListener('input', enforceNumbers);
    phoneInput.addEventListener('input', enforceNumbers);
}

function setupSaveAction() {
    const btnSave = document.getElementById('btn-save');
    
    btnSave.addEventListener('click', async () => {
        const fullName = document.getElementById('full_name').value.trim();
        const docType = document.getElementById('document_type').value;
        let docNumber = document.getElementById('document_number').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const email = document.getElementById('email').value.trim();
        const address = document.getElementById('address').value.trim();

        if (!fullName) {
            // CAMBIO: Toast de error
            showToast('El nombre es obligatorio', 'error');
            return;
        }

        if (!docNumber) {
            docNumber = (docType === 'RUC') ? '00000000000' : '00000000';
        }

        if ((docType === 'DNI' || docType === 'CE') && docNumber.length !== 8) {
            showToast(`El ${docType} debe tener 8 dígitos`, 'error');
            return;
        }
        if (docType === 'RUC' && docNumber.length !== 11) {
            showToast('El RUC debe tener 11 dígitos', 'error');
            return;
        }

        btnSave.disabled = true;
        btnSave.textContent = 'Guardando...';

        const customerData = {
            full_name: fullName,
            document_type: docType,
            document_number: docNumber,
            phone: phone || null,
            email: email || null,
            address: address || null,
            is_active: true,
            customer_since: new Date().toISOString()
        };

        try {
            const res = await mobileApi.createCustomer(customerData);
            
            if (res.success) {
                // CAMBIO: Toast de éxito + Retraso para volver
                showToast('Cliente creado correctamente', 'success');
                setTimeout(() => {
                    history.back(); 
                }, 1500); // Esperar 1.5s para ver el toast
            } else {
                throw new Error(res.error || 'Error desconocido');
            }
        } catch (error) {
            console.error(error);
            if (error.message.includes('unique constraint')) {
                showToast('Ya existe un cliente con ese documento', 'error');
            } else {
                showToast('Error al guardar cliente', 'error');
            }
            btnSave.disabled = false;
            btnSave.textContent = 'Guardar Cliente';
        }
    });
}