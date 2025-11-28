/* mobile-admin/customers/list/customers-list.js */
document.addEventListener('DOMContentLoaded', async () => {
    if(typeof loadMobileHeader === 'function') await loadMobileHeader();
    try {
        const resp = await fetch('/mobile-admin/components/bottom-nav/bottom-nav.html');
        if(resp.ok) {
            document.getElementById('bottom-nav-container').innerHTML = await resp.text();
            document.getElementById('nav-customers')?.classList.add('is-active');
        }
    } catch(e) {}
    loadCustomers();
    document.getElementById('search-input').addEventListener('input', (e) => loadCustomers(e.target.value));
});

async function loadCustomers(search = '') {
    const container = document.getElementById('customers-list-container');
    const res = await mobileApi.getCustomers(1, 50, search);
    
    if(res.success && res.data.length > 0) {
        container.innerHTML = res.data.map(c => `
            <a href="../detail/customers-detail.html?id=${c.id}" class="customer-card">
                <div class="customer-info">
                    <div class="customer-avatar">${c.full_name.charAt(0).toUpperCase()}</div>
                    <div class="customer-details">
                        <h4>${c.full_name}</h4>
                        <p>${c.document_type || 'DOC'}: ${c.document_number || '---'}</p>
                    </div>
                </div>
                <svg class="arrow-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </a>
        `).join('');
    } else {
        container.innerHTML = '<div style="text-align:center; padding:30px; color:#666;">No se encontraron clientes</div>';
    }
}