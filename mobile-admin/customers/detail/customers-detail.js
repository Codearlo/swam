/* mobile-admin/customers/detail/customers-detail.js */
document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if(!id) { alert('Cliente no especificado'); history.back(); return; }

    const res = await mobileApi.getCustomerById(id);
    if(res.success) {
        const c = res.data;
        document.getElementById('detail-avatar').textContent = c.full_name.charAt(0).toUpperCase();
        document.getElementById('detail-name').textContent = c.full_name;
        document.getElementById('detail-doc').textContent = `${c.document_type || ''} ${c.document_number || ''}`;
        document.getElementById('detail-email').textContent = c.email || '-';
        document.getElementById('detail-phone').textContent = c.phone || '-';
        document.getElementById('detail-address').textContent = c.address || '-';
        
        // Links
        document.getElementById('btn-edit').href = `../edit/customers-edit.html?id=${id}`;
        document.getElementById('btn-credits').href = `../credits/customers-credits.html?id=${id}`;
    } else {
        alert('Error al cargar cliente');
    }
});