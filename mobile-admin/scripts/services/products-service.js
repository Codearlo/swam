/* mobile-admin/scripts/services/products-service.js */

const ProductsService = {

    async getAll(page = 1, pageSize = 20, search = '', filter = 'active') {
        if (!supabaseClient) return { success: false, error: 'Sin conexión' };
        try {
            const start = (page - 1) * pageSize;
            
            let query = supabaseClient
                .from('products')
                .select(`
                    id, name, suggested_price, image_url, is_active, sku,
                    brands ( name ),
                    batches ( quantity_available )
                `, { count: 'exact' })
                .order('created_at', { ascending: false })
                .range(start, start + pageSize - 1);

            if (filter === 'active') query = query.eq('is_active', true);
            if (search) query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%`);

            const { data, error, count } = await query;
            if (error) throw error;

            let products = data.map(p => {
                const totalStock = p.batches 
                    ? p.batches.reduce((sum, b) => sum + (b.quantity_available || 0), 0)
                    : 0;
                
                return {
                    id: p.id, sku: p.sku || '', name: p.name, brand: p.brands?.name || '',
                    suggested_price: p.suggested_price, image_url: p.image_url, is_active: p.is_active,
                    stock: totalStock
                };
            });

            if (filter === 'low_stock') products = products.filter(p => p.stock < 10);

            return { success: true, data: products, total: count };
        } catch (error) { return { success: false, error: error.message }; }
    },

    async getById(id) {
        if (!supabaseClient) return { success: false, error: 'Sin conexión' };
        try {
            const { data, error } = await supabaseClient
                .from('products')
                .select(`*, brands ( name )`)
                .eq('id', id)
                .single();
            if (error) throw error;
            return { success: true, data: data };
        } catch (error) { return { success: false, error: error.message }; }
    },

    async create(data) {
        if (!supabaseClient) return { success: false, error: 'Sin conexión' };
        try {
            const { data: d, error } = await supabaseClient.from('products').insert([data]).select().single();
            if (error) throw error;
            return { success: true, data: d };
        } catch (error) { return { success: false, error: error.message }; }
    },

    async update(id, data) {
        if (!supabaseClient) return { success: false, error: 'Sin conexión' };
        try {
            const { data: d, error } = await supabaseClient.from('products').update(data).eq('id', id).select().single();
            if (error) throw error;
            return { success: true, data: d };
        } catch (error) { return { success: false, error: error.message }; }
    },

    async uploadImage(file) {
        if (!supabaseClient) return { success: false, error: 'Sin conexión' };
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}.${fileExt}`;
            const { error: uploadError } = await supabaseClient.storage.from('product-images').upload(fileName, file);
            if (uploadError) throw uploadError;
            const { data } = supabaseClient.storage.from('product-images').getPublicUrl(fileName);
            return { success: true, url: data.publicUrl };
        } catch (error) { console.error(error); return { success: false, error: 'Error al subir imagen' }; }
    },

    async getCategoriesTree() {
        if (!supabaseClient) return { success: false, data: [] };
        try {
            const { data, error } = await supabaseClient.from('product_categories').select('id, name, parent_id').eq('is_active', true).order('name');
            if (error) throw error;
            const parents = data.filter(c => c.parent_id === null);
            const children = data.filter(c => c.parent_id !== null);
            return { success: true, data: parents.map(p => ({ ...p, subcategories: children.filter(c => c.parent_id === p.id) })) };
        } catch (error) { return { success: false, error: error.message }; }
    },

    async getBrands(search = '') {
        if (!supabaseClient) return { success: false, data: [] };
        try {
            let query = supabaseClient.from('brands').select('id, name').eq('is_active', true).order('name');
            if(search) query = query.ilike('name', `%${search}%`);
            const { data, error } = await query;
            if (error) throw error;
            return { success: true, data: data };
        } catch (error) { return { success: false, error: error.message }; }
    },

    async createBrand(name) {
        if (!supabaseClient) return { success: false };
        try {
            const { data, error } = await supabaseClient.from('brands').insert([{ name: name }]).select().single();
            if (error) throw error;
            return { success: true, data: data };
        } catch (e) { return { success: false, error: e.message }; }
    },

    subscribe(callback) {
        if (!supabaseClient) return null;
        console.log('🔌 Suscribiendo a cambios en productos...');
        const channel = supabaseClient.channel('mobile-products-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
                if(typeof showToast === 'function') showToast('Actualizando inventario...', 'success'); callback(); 
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'batches' }, () => {
                if(typeof showToast === 'function') showToast('Actualizando stock...', 'success'); callback();
            })
            .subscribe((status) => {
                if (status === 'SUBSCRIBED' && typeof showToast === 'function') showToast('Conectado en tiempo real 🟢', 'success');
                if ((status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') && typeof showToast === 'function') showToast('Error de conexión en vivo 🔴', 'error');
            });
        return channel;
    }
};

window.ProductsService = ProductsService;