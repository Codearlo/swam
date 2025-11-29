/* mobile-admin/customers/edit/customers-edit.js */

document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const customerId = params.get('id');

    if(!customerId) {
        showToast('Cliente no especificado', 'error');
        setTimeout(() => history.back(), 1000);
        return;
    }

    setupDocumentTypeDropdown();
    setupInputValidations();
    setupSwitchListener(); // Nuevo Listener
    setupSaveAction(customerId);

    await loadCustomerData(customerId);
});

async function loadCustomerData(id) {
    try {
        const res = await mobileApi.getCustomerById(id);
        
        if (res.success) {
            const c = res.data;
            document.getElementById('full_name').value = c.full_name || '';
            
            const docType = c.document_type || 'DNI';
            document.getElementById('document_type').value = docType;
            document.getElementById('document_type_display').value = docType;
            
            document.getElementById('document_number').value = c.document_number || '';
            document.getElementById('phone').value = c.phone || '';
            document.getElementById('email').value = c.email || '';
            document.getElementById('address').value = c.address || '';

            // --- CARGAR ESTADO DEL SWITCH ---
            const switchEl = document.getElementById('is_active');
            // Si c.is_active es null o undefined, asumimos true, si es false es inactivo
            const isActive = c.is_active !== false; 
            switchEl.checked = isActive;
            updateStatusText(isActive);

            updateDocTypeUI(docType);

        } else {
            showToast('Error al cargar cliente', 'error');
            setTimeout(() => history.back(), 1500);
        }
    } catch (e) {
        console.error(e);
        showToast('Error de conexión', 'error');
    }
}

// --- LOGICA DEL SWITCH ---
function setupSwitchListener() {
    const switchEl = document.getElementById('is_active');
    switchEl.addEventListener('change', (e) => {
        updateStatusText(e.target.checked);
    });
}

function updateStatusText(isActive) {
    const label = document.getElementById('status-text');
    label.textContent = isActive ? 'Cliente Activo' : 'Cliente Inactivo';
    // Opcional: cambiar color del texto
    label.style.color = isActive ? '#10b981' : '#ef4444';
}

function updateDocTypeUI(val) {
    const inputNumber = document.getElementById('document_number');
    if (val === 'RUC') {
        inputNumber.maxLength = 11;
        inputNumber.placeholder = "N° RUC (11 dígitos)";
    } else {
        inputNumber.maxLength = 8;
        inputNumber.placeholder = `N° ${val} (8 dígitos)`;
    }
}

// ... (Funciones setupDocumentTypeDropdown y setupInputValidations IGUALES a versiones anteriores) ...
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
            updateDocTypeUI(val);
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

function setupSaveAction(id) {
    const btnSave = document.getElementById('btn-save');
    
    btnSave.addEventListener('click', async () => {
        const fullName = document.getElementById('full_name').value.trim();
        const docType = document.getElementById('document_type').value;
        let docNumber = document.getElementById('document_number').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const email = document.getElementById('email').value.trim();
        const address = document.getElementById('address').value.trim();
        
        // OBTENER VALOR DEL SWITCH
        const isActive = document.getElementById('is_active').checked;

        if (!fullName) {
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
            is_active: isActive // ENVIAR ESTADO
        };

        try {
            const res = await mobileApi.updateCustomer(id, customerData);
            
            if (res.success) {
                showToast('Cliente actualizado', 'success');
                setTimeout(() => history.back(), 1500); 
            } else {
                throw new Error(res.error || 'Error desconocido');
            }
        } catch (error) {
            console.error(error);
            showToast('Error al actualizar: ' + error.message, 'error');
            btnSave.disabled = false;
            btnSave.textContent = 'Guardar Cambios';
        }
    });
}