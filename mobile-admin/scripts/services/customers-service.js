/* mobile-admin/scripts/services/customers-service.js */

const CustomersService = {

    async getAll(page = 1, pageSize = 20, search = '', onlyActive = true) {
        if (!supabaseClient) return { success: false, error: 'Sin conexión' };
        try {
            const start = (page - 1) * pageSize;
            let query = supabaseClient
                .from('customers')
                .select('*', { count: 'exact' })
                .order('full_name', { ascending: true })
                .range(start, start + pageSize - 1);

            if (onlyActive) query = query.eq('is_active', true);
            if (search) query = query.or(`full_name.ilike.%${search}%,document_number.ilike.%${search}%`);
            
            const { data, error, count } = await query;
            if (error) throw error;
            return { success: true, data: data, total: count };
        } catch (error) { return { success: false, error: error.message }; }
    },

    async getById(id) {
        if (!supabaseClient) return { success: false };
        try {
            const { data, error } = await supabaseClient.from('customers').select('*').eq('id', id).single();
            if (error) throw error;
            return { success: true, data: data };
        } catch (error) { return { success: false, error: error.message }; }
    },

    async create(data) {
        if (!supabaseClient) return { success: false };
        try { 
            const { data: d, error } = await supabaseClient.from('customers').insert([data]).select().single(); 
            if(error) throw error; 
            return { success: true, data: d }; 
        } catch(e) { return { success: false, error: e.message }; }
    },

    async update(id, data) {
        if (!supabaseClient) return { success: false };
        try {
            const { data: d, error } = await supabaseClient.from('customers').update(data).eq('id', id).select().single();
            if (error) throw error;
            return { success: true, data: d };
        } catch (error) { return { success: false, error: error.message }; }
    },

    async delete(id) {
        if (!supabaseClient) return { success: false };
        try {
            const { error } = await supabaseClient.from('customers').delete().eq('id', id);
            if (error) {
                if (error.code === '23503') throw new Error('No se puede eliminar: El cliente tiene ventas registradas.');
                throw error;
            }
            return { success: true };
        } catch (error) { return { success: false, error: error.message }; }
    },

    async getSales(customerId, limit = 5) {
        if (!supabaseClient) return { success: false, error: 'Sin conexión' };
        try {
            const { data, error } = await supabaseClient
                .from('sales')
                .select('id, sale_code, total_sale, created_at')
                .eq('customer_id', customerId)
                .order('created_at', { ascending: false })
                .limit(limit);
            if (error) throw error;
            return { success: true, data: data.map(s => ({ id: s.id, code: s.sale_code, amount: parseFloat(s.total_sale), date: s.created_at })) };
        } catch (error) { return { success: false, error: error.message }; }
    },

    async getCredits(id) {
         if (!supabaseClient) return { success: false };
         try {
             const { data, error } = await supabaseClient.from('customers').select('credit_limit, current_debt').eq('id', id).single();
             if(error) throw error;
             return { success: true, data: { debt: data.current_debt || 0, limit: data.credit_limit || 0 } };
         } catch(e) { return { success: false, error: e.message }; }
    }
};

window.CustomersService = CustomersService;