document.getElementById('btn-save').addEventListener('click', async () => {
    const data = {
        full_name: document.getElementById('full_name').value,
        document_type: document.getElementById('document_type').value,
        document_number: document.getElementById('document_number').value,
        phone: document.getElementById('phone').value,
        email: document.getElementById('email').value,
        address: document.getElementById('address').value,
        is_active: true
    };
    if(!data.full_name) return alert('Nombre requerido');
    
    const res = await mobileApi.createCustomer(data);
    if(res.success) { alert('Cliente creado'); history.back(); }
    else alert('Error: ' + res.error);
});