/* mobile-admin/customers/detail/customers-detail.js */

document.addEventListener('DOMContentLoaded', async () => {
    // Obtener ID de la URL
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');

    if(!id) { 
        alert('Cliente no especificado'); 
        history.back(); 
        return; 
    }

    // 1. Cargar Datos del Cliente
    const res = await mobileApi.getCustomerById(id);
    
    if(res.success) {
        const c = res.data;
        
        // Header y Perfil
        document.getElementById('detail-avatar').textContent = c.full_name.charAt(0).toUpperCase();
        document.getElementById('detail-name').textContent = c.full_name;
        
        const docText = (c.document_type && c.document_number) 
            ? `${c.document_type}: ${c.document_number}` 
            : 'Sin documento';
        document.getElementById('detail-doc').textContent = docText;

        document.getElementById('detail-email').textContent = c.email || 'No registrado';
        document.getElementById('detail-phone').textContent = c.phone || 'No registrado';
        document.getElementById('detail-address').textContent = c.address || 'No registrada';
        
        // Configurar Links
        document.getElementById('btn-edit').href = `../edit/customers-edit.html?id=${id}`;
        
        // NOTA: Para el historial completo, podríamos redirigir a la lista de ventas filtrada
        // Por ahora, asumimos que existe un filtro o simplemente llevamos a la lista general.
        // Una mejora sería: sales-list.html?search=NOMBRE_CLIENTE
        document.getElementById('btn-full-history').href = `/mobile-admin/sales/list/sales-list.html`; 

        // 2. Cargar Última Venta
        loadLastSale(id);
        
    } else {
        alert('Error al cargar cliente');
        history.back();
    }
});

async function loadLastSale(customerId) {
    const container = document.getElementById('last-sale-container');
    const res = await mobileApi.getCustomerSales(customerId, 1); // Limit 1 para la última

    if (res.success && res.data.length > 0) {
        const sale = res.data[0];
        const dateObj = new Date(sale.date);
        const dateStr = dateObj.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year:'numeric', hour: '2-digit', minute:'2-digit' });
        const amountStr = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(sale.amount);

        // Renderizar Tarjeta de Venta (Estilo Sale List)
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
                <div class="sale-preview-footer">
                    <span class="status-badge status-completed">Completado</span>
                </div>
            </div>
        `;
    } else {
        container.innerHTML = `
            <div class="empty-sales-state">
                <p>No hay compras registradas</p>
            </div>
        `;
    }
}