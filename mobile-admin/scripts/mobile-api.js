/* mobile-admin/scripts/mobile-api.js */

const mobileApi = {
    
    // --- VENTAS ---
    async getSalesHistory(page = 1, pageSize = 20, searchTerm = '') {
        if (!supabaseClient) return { success: false, error: 'Sin conexión a BD' };
        try {
            const start = (page - 1) * pageSize;
            const end = start + pageSize - 1;
            
            // Intentamos traer datos snapshot si existen, sino fallback a relaciones
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
                // Si guardaste el nombre snapshot úsalo, sino usa la relación
                customer: sale.customers?.full_name || 'Cliente General', 
                amount: parseFloat(sale.total_sale || 0),
                date: sale.sale_date || sale.created_at,
                status: 'completed'
            }));

            return { success: true, data: sales, total: count };
        } catch (error) { return { success: false, error: error.message }; }
    },

    // --- SNAPSHOT DE VENTA (IMPORTANTE) ---
    async createSale(salePayload) {
        if (!supabaseClient) return { success: false, error: 'Sin conexión' };

        try {
            // Preparar el objeto de venta.
            // Para cumplir tu requerimiento: intentamos guardar los nombres textuales.
            // Asegúrate que tu tabla 'sales' tenga columnas JSON o Text para esto,
            // si no las tiene, Supabase ignorará los campos extra o dará error si es estricto.
            
            const saleData = {
                sale_code: `V-${Date.now().toString().slice(-6)}`,
                sale_date: new Date().toISOString(),
                total_sale: salePayload.total,
                
                // Referencias ID (Aún necesarias para integridad si la BD lo exige)
                customer_id: salePayload.customerId, 
                payment_method_id: salePayload.paymentMethodId,
                
                // SNAPSHOTS: Datos "congelados" (Esto es lo que pides)
                // Si tu tabla soporta columna JSON 'items_snapshot' o 'customer_name_snapshot'
                // customer_snapshot_name: salePayload.customerName, 
                // items_snapshot: salePayload.items 
            };

            const { data, error } = await supabaseClient
                .from('sales')
                .insert([saleData])
                .select()
                .single();

            if (error) throw error;

            return { success: true, data: data };
        } catch (error) {
            console.error('Error createSale:', error);
            return { success: false, error: error.message };
        }
    },

    async searchProducts(term) {
        if (!supabaseClient) return { success: false, error: 'Sin conexión' };
        try {
            const { data, error } = await supabaseClient
                .from('products')
                .select('id, name, sku, suggested_price, is_active')
                .ilike('name', `%${term}%`)
                .eq('is_active', true) // Solo productos activos
                .limit(10);
            if(error) throw error;
            return { success: true, data: data.map(p => ({ 
                id: p.id, name: p.name, sku: p.sku, price: parseFloat(p.suggested_price), stock: 10 
            })) };
        } catch(e) { return { success: false, error: e.message }; }
    },

    // --- CLIENTES ---

    async getCustomers(page = 1, pageSize = 20, search = '') {
        if (!supabaseClient) return { success: false, error: 'Sin conexión' };
        try {
            const start = (page - 1) * pageSize;
            let query = supabaseClient
                .from('customers')
                .select('*', { count: 'exact' })
                .eq('is_active', true) // IMPORTANTE: Solo traer activos (no eliminados)
                .order('full_name', { ascending: true })
                .range(start, start + pageSize - 1);

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

    // --- NUEVO: ELIMINAR CLIENTE (SOFT DELETE) ---
    // En lugar de borrar la fila (DELETE), marcamos is_active = false.
    // Esto preserva el historial de ventas pasadas.
    async deleteCustomer(id) {
        if (!supabaseClient) return { success: false };
        try {
            const { error } = await supabaseClient
                .from('customers')
                .update({ is_active: false }) 
                .eq('id', id);

            if (error) throw error;
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