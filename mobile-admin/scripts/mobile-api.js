/* mobile-admin/scripts/mobile-api.js */

const mobileApi = {
    
    // ... (El resto de funciones getSales, createSale, etc. se mantienen igual) ...

    async getSalesHistory(page = 1, pageSize = 20, searchTerm = '') {
        if (!supabaseClient) return { success: false, error: 'Sin conexión a BD' };
        try {
            const start = (page - 1) * pageSize;
            const end = start + pageSize - 1;
            
            let query = supabaseClient
                .from('sales')
                .select(`
                    id, sale_code, total_sale, sale_date, created_at, 
                    customers ( full_name )
                `, { count: 'exact' })
                .order('created_at', { ascending: false })
                .range(start, end);

            if (searchTerm) {
                query = query.ilike('sale_code', `%${searchTerm}%`);
            }

            const { data, error, count } = await query;
            if (error) throw error;

            const sales = data.map(sale => ({
                id: sale.id,
                code: sale.sale_code || '---',
                customer: sale.customers?.full_name || 'Cliente General', 
                amount: parseFloat(sale.total_sale || 0),
                date: sale.sale_date || sale.created_at,
                status: 'completed'
            }));

            return { success: true, data: sales, total: count };
        } catch (error) { return { success: false, error: error.message }; }
    },

    async createSale(salePayload) {
        // ... (código existente createSale) ...
        if (!supabaseClient) return { success: false, error: 'Sin conexión' };
        try {
            const saleData = {
                sale_code: `V-${Date.now().toString().slice(-6)}`,
                sale_date: new Date().toISOString(),
                total_sale: salePayload.total,
                customer_id: salePayload.customerId, 
                payment_method_id: salePayload.paymentMethodId,
            };
            const { data, error } = await supabaseClient.from('sales').insert([saleData]).select().single();
            if (error) throw error;
            return { success: true, data: data };
        } catch (error) { return { success: false, error: error.message }; }
    },

    async searchProducts(term) {
        // ... (código existente searchProducts) ...
        if (!supabaseClient) return { success: false, error: 'Sin conexión' };
        try {
            const { data, error } = await supabaseClient
                .from('products')
                .select('id, name, sku, suggested_price, is_active')
                .ilike('name', `%${term}%`)
                .eq('is_active', true)
                .limit(10);
            if(error) throw error;
            return { success: true, data: data.map(p => ({ 
                id: p.id, name: p.name, sku: p.sku, price: parseFloat(p.suggested_price), stock: 10 
            })) };
        } catch(e) { return { success: false, error: e.message }; }
    },

    // --- CLIENTES ---

    async getCustomers(page = 1, pageSize = 20, search = '', onlyActive = true) {
        if (!supabaseClient) return { success: false, error: 'Sin conexión' };
        try {
            const start = (page - 1) * pageSize;
            
            let query = supabaseClient
                .from('customers')
                .select('*', { count: 'exact' })
                .order('full_name', { ascending: true })
                .range(start, start + pageSize - 1);

            // Mantenemos la lógica de filtro corregida anteriormente
            if (onlyActive) {
                query = query.eq('is_active', true);
            }

            if (search) {
                query = query.or(`full_name.ilike.%${search}%,document_number.ilike.%${search}%`);
            }
            
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

    async createCustomer(data) {
        if (!supabaseClient) return { success: false };
        try { 
            const { data: d, error } = await supabaseClient.from('customers').insert([data]).select().single(); 
            if(error) throw error; 
            return { success: true, data: d }; 
        } catch(e) { return { success: false, error: e.message }; }
    },

    async updateCustomer(id, data) {
        if (!supabaseClient) return { success: false };
        try {
            const { data: d, error } = await supabaseClient.from('customers').update(data).eq('id', id).select().single();
            if (error) throw error;
            return { success: true, data: d };
        } catch (error) { return { success: false, error: error.message }; }
    },

    // --- CAMBIO PRINCIPAL: BORRADO FÍSICO ---
    async deleteCustomer(id) {
        if (!supabaseClient) return { success: false };
        try {
            // ANTES: .update({ is_active: false })
            // AHORA: .delete() -> Esto elimina la fila de la base de datos permanentemente
            const { error } = await supabaseClient
                .from('customers')
                .delete()
                .eq('id', id);

            if (error) {
                // Manejo especial: Si falla por llave foránea (tiene ventas)
                if (error.code === '23503') {
                    throw new Error('No se puede eliminar: El cliente tiene ventas registradas.');
                }
                throw error;
            }
            return { success: true };
        } catch (error) {
            console.error(error);
            return { success: false, error: error.message };
        }
    },

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
                    id: s.id, code: s.sale_code, amount: parseFloat(s.total_sale), date: s.created_at
                }))
            };
        } catch (error) { return { success: false, error: error.message }; }
    },

    async getPaymentMethods() {
        if (!supabaseClient) return { success: false, data: [] };
        const { data } = await supabaseClient.from('payment_methods').select('id, name').eq('is_active', true);
        return { success: true, data: data || [] };
    }
};

window.mobileApi = mobileApi;