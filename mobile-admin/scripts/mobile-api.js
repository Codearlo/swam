/* mobile-admin/scripts/mobile-api.js */

const mobileApi = {
    
    // ... (Funciones anteriores de Ventas y Productos se mantienen igual) ...
    async getSalesHistory(page = 1, pageSize = 20, searchTerm = '') {
        // (Código existente...)
        if (!supabaseClient) return { success: false, error: 'Sin conexión a BD' };
        try {
            const start = (page - 1) * pageSize;
            const end = start + pageSize - 1;
            let query = supabaseClient.from('sales').select(`id, sale_code, total_sale, sale_date, created_at, customers ( full_name )`, { count: 'exact' }).order('created_at', { ascending: false }).range(start, end);
            if (searchTerm) query = query.ilike('sale_code', `%${searchTerm}%`);
            const { data, error, count } = await query;
            if (error) throw error;
            const sales = data.map(sale => ({
                id: sale.id, code: sale.sale_code || '---', customer: sale.customers?.full_name || 'Cliente General', amount: parseFloat(sale.total_sale || 0), date: sale.sale_date || sale.created_at, status: 'completed'
            }));
            return { success: true, data: sales, total: count };
        } catch (error) { return { success: false, error: error.message }; }
    },

    async searchProducts(term) { /* ... */ 
        if (!supabaseClient) return { success: false, error: 'Sin conexión' };
        try {
            const { data, error } = await supabaseClient.from('products').select('id, name, sku, suggested_price, is_active').ilike('name', `%${term}%`).limit(10);
            if(error) throw error;
            return { success: true, data: data.map(p => ({ id: p.id, name: p.name, sku: p.sku, price: p.suggested_price, stock: 10 })) };
        } catch(e) { return { success: false, error: e.message }; }
    },

    async createSale(payload) { /* ... */ 
        // ... (Tu código de crear venta anterior)
        return { success: true }; 
    },

    // --- CLIENTES ---

    async getCustomers(page, pageSize, search) { /* ... (Código existente) ... */ 
        if (!supabaseClient) return { success: false, error: 'Sin conexión' };
        try {
            let query = supabaseClient.from('customers').select('*', { count: 'exact' }).eq('is_active', true).order('full_name', { ascending: true }).range((page-1)*pageSize, page*pageSize-1);
            if (search) query = query.or(`full_name.ilike.%${search}%,document_number.ilike.%${search}%`);
            const { data, error, count } = await query;
            if (error) throw error;
            return { success: true, data: data, total: count };
        } catch (error) { return { success: false, error: error.message }; }
    },

    async getCustomerById(id) {
        if (!supabaseClient) return { success: false };
        try {
            const { data, error } = await supabaseClient.from('customers').select('*').eq('id', id).single();
            if (error) throw error;
            return { success: true, data: data };
        } catch (error) { return { success: false, error: error.message }; }
    },

    async createCustomer(data) { /* ... */ 
        if (!supabaseClient) return { success: false };
        try { const { data: d, error } = await supabaseClient.from('customers').insert([data]).select().single(); if(error) throw error; return { success: true, data: d }; } catch(e) { return { success: false, error: e.message }; }
    },

    // NUEVO: Obtener ventas de un cliente específico
    async getCustomerSales(customerId, limit = 5) {
        if (!supabaseClient) return { success: false, error: 'Sin conexión' };
        try {
            const { data, error } = await supabaseClient
                .from('sales')
                .select('id, sale_code, total_sale, created_at')
                .eq('customer_id', customerId)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) throw error;

            return { 
                success: true, 
                data: data.map(s => ({
                    id: s.id,
                    code: s.sale_code,
                    amount: parseFloat(s.total_sale),
                    date: s.created_at
                }))
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
};

window.mobileApi = mobileApi;