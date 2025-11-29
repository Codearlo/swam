/* mobile-admin/customers/detail/customers-detail.js */

// Variable para almacenar el ID que vamos a eliminar
let customerIdToDelete = null;

document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');

    if(!id) { 
        showToast('Cliente no especificado', 'error');
        setTimeout(() => history.back(), 1000);
        return; 
    }

    // Guardar ID globalmente para usarlo en el modal
    customerIdToDelete = id;

    // Cargar datos
    const res = await mobileApi.getCustomerById(id);
    
    if(res.success) {
        const c = res.data;
        
        document.getElementById('detail-avatar').textContent = c.full_name.charAt(0).toUpperCase();
        document.getElementById('detail-name').textContent = c.full_name;
        
        const docText = (c.document_type && c.document_number) ? `${c.document_type}: ${c.document_number}` : 'Sin documento';
        document.getElementById('detail-doc').textContent = docText;

        document.getElementById('detail-email').textContent = c.email || 'No registrado';
        document.getElementById('detail-phone').textContent = c.phone || 'No registrado';
        document.getElementById('detail-address').textContent = c.address || 'No registrada';
        
        // Links
        document.getElementById('btn-edit').href = `../edit/customers-edit.html?id=${id}`;
        document.getElementById('btn-full-history').href = `/mobile-admin/sales/list/sales-list.html`; 

        // Configurar acciones del Modal
        setupModalActions(c.full_name);

        loadLastSale(id);
    } else {
        showToast('Error al cargar cliente', 'error');
        setTimeout(() => history.back(), 1500);
    }
});

function setupModalActions(name) {
    const triggerBtn = document.getElementById('btn-delete-trigger');
    const modal = document.getElementById('delete-modal');
    const cancelBtn = document.getElementById('btn-modal-cancel');
    const confirmBtn = document.getElementById('btn-modal-confirm');
    const modalNameSpan = document.getElementById('modal-customer-name');

    // 1. ABRIR MODAL
    triggerBtn.addEventListener('click', () => {
        modalNameSpan.textContent = name;
        modal.classList.add('is-visible');
    });

    // 2. CERRAR MODAL (Cancelar)
    cancelBtn.addEventListener('click', () => {
        modal.classList.remove('is-visible');
    });

    // Cerrar al dar click fuera de la tarjeta (en el fondo oscuro)
    modal.addEventListener('click', (e) => {
        if(e.target === modal) modal.classList.remove('is-visible');
    });

    // 3. CONFIRMAR ELIMINACIÓN
    confirmBtn.addEventListener('click', async () => {
        if (!customerIdToDelete) return;

        // UI Loading State
        confirmBtn.disabled = true;
        confirmBtn.textContent = 'Eliminando...';

        try {
            const res = await mobileApi.deleteCustomer(customerIdToDelete);
            
            if (res.success) {
                showToast('Cliente eliminado permanentemente', 'success');
                modal.classList.remove('is-visible');
                
                // Redirigir a la lista
                setTimeout(() => {
                    window.location.replace('../list/customers-list.html'); 
                }, 1500);
            } else {
                showToast(res.error || 'Error al eliminar', 'error');
                // Restaurar botón si falló
                confirmBtn.disabled = false;
                confirmBtn.textContent = 'Sí, Eliminar';
                modal.classList.remove('is-visible');
            }
        } catch (error) {
            console.error(error);
            showToast('Error de conexión', 'error');
            confirmBtn.disabled = false;
            confirmBtn.textContent = 'Sí, Eliminar';
        }
    });
}

async function loadLastSale(customerId) {
    const container = document.getElementById('last-sale-container');
    const res = await mobileApi.getCustomerSales(customerId, 1);

    if (res.success && res.data.length > 0) {
        const sale = res.data[0];
        const dateObj = new Date(sale.date);
        const dateStr = dateObj.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year:'numeric', hour: '2-digit', minute:'2-digit' });
        const amountStr = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(sale.amount);

        container.innerHTML = `
            <div class="sale-preview-card">
                <div class="sale-preview-header">
                    <span class="sale-code">${sale.code}</span>
                    <span class="sale-date">${dateStr}</span>
                </div>
                <div class="sale-preview-body">
                    <span class="sale-label">Monto Total</span>
                    <span class="sale-amount">${amountStr}</span>
                </div>
                <div class="sale-preview-footer" style="margin-top:12px;">
                    <span class="status-badge status-completed">Completado</span>
                </div>
            </div>
        `;
    } else {
        container.innerHTML = `<div class="empty-sales-state"><p>No hay compras registradas</p></div>`;
    }
}