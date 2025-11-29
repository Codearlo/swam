/* mobile-admin/customers/detail/customers-detail.js */

document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');

    if(!id) { 
        showToast('Cliente no especificado', 'error');
        setTimeout(() => history.back(), 1000);
        return; 
    }

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

        // Botón Eliminar
        setupDeleteAction(id, c.full_name);

        loadLastSale(id);
    } else {
        showToast('Error al cargar cliente', 'error');
        setTimeout(() => history.back(), 1500);
    }
});

function setupDeleteAction(id, name) {
    const btnDelete = document.getElementById('btn-delete');
    
    btnDelete.addEventListener('click', async () => {
        // Usamos confirm nativo o podrías hacer un modal custom
        const confirmed = confirm(`¿Estás seguro de eliminar a ${name}?`);
        
        if (confirmed) {
            const res = await mobileApi.deleteCustomer(id);
            if (res.success) {
                showToast('Cliente eliminado', 'success');
                setTimeout(() => history.back(), 1000);
            } else {
                showToast('No se pudo eliminar el cliente', 'error');
            }
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