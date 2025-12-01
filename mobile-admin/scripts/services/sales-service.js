/* mobile-admin/scripts/services/sales-service.js */

const SalesService = {
    
    async getHistory(page = 1, pageSize = 20, searchTerm = '') {
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

    async create(salePayload) {
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

    async searchProductsForSale(term) {
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
    }
};

window.SalesService = SalesService;