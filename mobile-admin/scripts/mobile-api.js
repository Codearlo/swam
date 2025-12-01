/* mobile-admin/scripts/mobile-api.js */

const mobileApi = {
    
    // ==========================================
    // 1. MÓDULO DE VENTAS
    // ==========================================

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
        if (!supabaseClient) return { success: false, error: 'Sin conexión' };
        try {
            const { data, error } = await supabaseClient
                .from('products')
                .select('id, name, sku, suggested_price, is_active')
                .ilike('name', `%${term}%`)
                .eq('is_active', true)
                .limit(10);
            if(error) throw error;
            
            // Stock simulado en búsqueda rápida (para ventas)
            return { success: true, data: data.map(p => ({ 
                id: p.id, name: p.name, sku: p.sku, price: parseFloat(p.suggested_price), stock: 10 
            })) };
        } catch(e) { return { success: false, error: e.message }; }
    },

    // ==========================================
    // 2. MÓDULO DE CLIENTES
    // ==========================================

    async getCustomers(page = 1, pageSize = 20, search = '', onlyActive = true) {
        if (!supabaseClient) return { success: false, error: 'Sin conexión' };
        try {
            const start = (page - 1) * pageSize;
            
            let query = supabaseClient
                .from('customers')
                .select('*', { count: 'exact' })
                .order('full_name', { ascending: true })
                .range(start, start + pageSize - 1);

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

    async deleteCustomer(id) {
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

    async getCustomerSales(customerId, limit = 5) {
        if (!supabaseClient) return { success: false, error: 'Sin conexión' };
        try {
            const { data, error } = await supabaseClient.from('sales').select('id, sale_code, total_sale, created_at').eq('customer_id', customerId).order('created_at', { ascending: false }).limit(limit);
            if (error) throw error;
            return { success: true, data: data.map(s => ({ id: s.id, code: s.sale_code, amount: parseFloat(s.total_sale), date: s.created_at })) };
        } catch (error) { return { success: false, error: error.message }; }
    },

    async getCustomerCredits(id) {
         if (!supabaseClient) return { success: false };
         try {
             const { data, error } = await supabaseClient.from('customers').select('credit_limit, current_debt').eq('id', id).single();
             if(error) throw error;
             return { success: true, data: { debt: data.current_debt || 0, limit: data.credit_limit || 0 } };
         } catch(e) { return { success: false, error: e.message }; }
    },

    // ==========================================
    // 3. MÓDULO DE PRODUCTOS (INVENTARIO)
    // ==========================================

    async getProducts(page = 1, pageSize = 20, search = '', filter = 'active') {
        if (!supabaseClient) return { success: false, error: 'Sin conexión' };
        try {
            const start = (page - 1) * pageSize;
            
            // Consulta de productos con Marcas y Lotes (para stock)
            let query = supabaseClient
                .from('products')
                .select(`
                    id, name, suggested_price, image_url, is_active, sku,
                    brands ( name ),
                    batches ( quantity_available )
                `, { count: 'exact' })
                .order('created_at', { ascending: false })
                .range(start, start + pageSize - 1);

            if (filter === 'active') {
                query = query.eq('is_active', true);
            }

            if (search) {
                // Búsqueda por nombre o SKU (si existe)
                query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%`);
            }

            const { data, error, count } = await query;
            if (error) throw error;

            let products = data.map(p => {
                // Calcular stock sumando lotes
                const totalStock = p.batches 
                    ? p.batches.reduce((sum, b) => sum + (b.quantity_available || 0), 0)
                    : 0;
                
                return {
                    id: p.id,
                    sku: p.sku || '',
                    name: p.name,
                    brand: p.brands?.name || '', // Nombre de la marca
                    suggested_price: p.suggested_price,
                    image_url: p.image_url,
                    is_active: p.is_active,
                    stock: totalStock
                };
            });

            if (filter === 'low_stock') {
                products = products.filter(p => p.stock < 10);
            }

            return { success: true, data: products, total: count };
        } catch (error) { return { success: false, error: error.message }; }
    },

    async createProduct(data) {
        if (!supabaseClient) return { success: false, error: 'Sin conexión' };
        try {
            const { data: d, error } = await supabaseClient
                .from('products')
                .insert([data])
                .select()
                .single();
                
            if (error) throw error;
            return { success: true, data: d };
        } catch (error) { return { success: false, error: error.message }; }
    },

    // --- IMÁGENES (STORAGE) ---
    async uploadProductImage(file) {
        if (!supabaseClient) return { success: false, error: 'Sin conexión' };
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            // Subir al bucket 'product-images'
            const { error: uploadError } = await supabaseClient.storage
                .from('product-images')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // Obtener URL pública
            const { data } = supabaseClient.storage.from('product-images').getPublicUrl(filePath);
            return { success: true, url: data.publicUrl };
        } catch (error) {
            console.error('Error upload:', error);
            return { success: false, error: 'Error al subir imagen' };
        }
    },

    // --- CATEGORÍAS (ÁRBOL PADRE -> HIJO) ---
    async getCategoriesTree() {
        if (!supabaseClient) return { success: false, data: [] };
        try {
            const { data, error } = await supabaseClient
                .from('product_categories')
                .select('id, name, parent_id')
                .eq('is_active', true)
                .order('name');
            
            if (error) throw error;

            // Organizar en árbol
            const parents = data.filter(c => c.parent_id === null);
            const children = data.filter(c => c.parent_id !== null);

            const tree = parents.map(parent => ({
                ...parent,
                subcategories: children.filter(child => child.parent_id === parent.id)
            }));

            return { success: true, data: tree };
        } catch (error) { return { success: false, error: error.message }; }
    },

    // --- MARCAS (BUSCAR Y CREAR) ---
    async getBrands(search = '') {
        if (!supabaseClient) return { success: false, data: [] };
        try {
            let query = supabaseClient
                .from('brands')
                .select('id, name')
                .eq('is_active', true)
                .order('name');
            
            if(search) query = query.ilike('name', `%${search}%`);
            
            const { data, error } = await query;
            if (error) throw error;
            return { success: true, data: data };
        } catch (error) { return { success: false, error: error.message }; }
    },

    async createBrand(name) {
        if (!supabaseClient) return { success: false };
        try {
            const { data, error } = await supabaseClient
                .from('brands')
                .insert([{ name: name }])
                .select()
                .single();
            if (error) throw error;
            return { success: true, data: data };
        } catch (e) { return { success: false, error: e.message }; }
    },

    // ==========================================
    // 4. SUSCRIPCIÓN EN TIEMPO REAL
    // ==========================================
    subscribeToProducts(callback) {
        if (!supabaseClient) return null;
        
        console.log('🔌 Suscribiendo a cambios en productos...');
        
        const channel = supabaseClient.channel('mobile-products-realtime')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'products' },
                (payload) => {
                    console.log('🔔 Cambio en producto:', payload.eventType);
                    callback(); 
                }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'batches' }, // Stock
                (payload) => {
                    console.log('🔔 Cambio en stock:', payload.eventType);
                    callback();
                }
            )
            .subscribe();
            
        return channel;
    },

    // ==========================================
    // 5. UTILIDADES Y DASHBOARD
    // ==========================================

    async getPaymentMethods() {
        if (!supabaseClient) return { success: false, data: [] };
        const { data } = await supabaseClient.from('payment_methods').select('id, name').eq('is_active', true);
        return { success: true, data: data || [] };
    },

    async getDashboardData() {
        // Mock simple si no existe el RPC
        return { success: true, dailySales: 0, activeOrders: 0, activeCustomers: 0, productsInStock: 0 };
    },
    
    async getRecentSales(limit=3) {
        return this.getSalesHistory(1, limit);
    },
    
    async getInventoryAlerts(limit=3) {
        return { success: true, data: [] };
    }
};

window.mobileApi = mobileApi;