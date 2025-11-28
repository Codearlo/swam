/* mobile-admin/scripts/mobile-api.js */

const mobileApi = {
    
    // --- LISTADO DE VENTAS ---
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
                status: 'completed' // Tu tabla no tiene status aún, asumimos completado
            }));

            return { success: true, data: sales, total: count };
        } catch (error) {
            console.error('Error getSalesHistory:', error);
            return { success: false, error: error.message };
        }
    },

    // --- NUEVA VENTA: BUSCAR PRODUCTOS ---
    async searchProducts(term) {
        if (!supabaseClient) return { success: false, error: 'Sin conexión' };

        try {
            const { data, error } = await supabaseClient
                .from('products')
                .select('id, name, sku, suggested_price, is_active')
                .ilike('name', `%${term}%`)
                .eq('is_active', true)
                .limit(10);

            if (error) throw error;

            // Mapeamos para asegurar estructura
            const products = data.map(p => ({
                id: p.id,
                name: p.name,
                sku: p.sku,
                price: parseFloat(p.suggested_price || 0),
                stock: 10 // Mock temporal ya que 'stock' suele estar en otra tabla (batches) o calculado
            }));

            return { success: true, data: products };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // --- NUEVA VENTA: CARGAR CLIENTES ---
    async getCustomers() {
        if (!supabaseClient) return { success: false, error: 'Sin conexión' };
        try {
            const { data, error } = await supabaseClient
                .from('customers')
                .select('id, full_name')
                .eq('is_active', true)
                .order('full_name')
                .limit(50);

            if (error) throw error;
            return { success: true, data: data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // --- NUEVA VENTA: GUARDAR ---
    async createSale(salePayload) {
        if (!supabaseClient) return { success: false, error: 'Sin conexión' };

        try {
            // 1. Insertar Venta Cabecera
            const { data: saleData, error: saleError } = await supabaseClient
                .from('sales')
                .insert([{
                    sale_code: `V-${Date.now().toString().slice(-6)}`, // Generar código simple
                    customer_id: salePayload.customerId,
                    payment_method_id: salePayload.paymentMethodId, // Asegúrate de tener este ID válido
                    sale_date: new Date().toISOString(),
                    sale_time: new Date().toLocaleTimeString(),
                    total_sale: salePayload.total,
                    created_by: salePayload.userId
                }])
                .select()
                .single();

            if (saleError) throw saleError;

            // 2. Insertar Items (Si tuvieras tabla sale_items configurada)
            // Por simplicidad en este paso, solo guardamos la cabecera.
            // Para producción, aquí harías un .insert() en 'sale_items' usando saleData.id

            return { success: true, data: saleData };
        } catch (error) {
            console.error('Error createSale:', error);
            return { success: false, error: error.message };
        }
    },

    // --- UTILIDAD: Obtener Métodos de Pago ---
    async getPaymentMethods() {
        if (!supabaseClient) return { success: false, data: [] };
        const { data } = await supabaseClient.from('payment_methods').select('id, name').eq('is_active', true);
        return { success: true, data: data || [] };
    }
};

window.mobileApi = mobileApi;