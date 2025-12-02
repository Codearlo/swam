/* mobile-admin/scripts/mobile-api.js */

(function(global) {
    
    global.mobileApi = {
        
        // --- VENTAS ---
        async getSalesHistory(page, pageSize, searchTerm) {
            if (typeof SalesService === 'undefined') return { success: false, error: 'SalesService no cargado' };
            return await SalesService.getHistory(page, pageSize, searchTerm);
        },

        async createSale(salePayload) {
            if (typeof SalesService === 'undefined') return { success: false, error: 'SalesService no cargado' };
            return await SalesService.create(salePayload);
        },

        async searchProducts(term) {
            if (typeof SalesService === 'undefined') return { success: false, error: 'SalesService no cargado' };
            return await SalesService.searchProductsForSale(term);
        },

        // --- CLIENTES ---
        async getCustomers(page, pageSize, search, onlyActive) {
            if (typeof CustomersService === 'undefined') return { success: false, error: 'CustomersService no cargado' };
            return await CustomersService.getAll(page, pageSize, search, onlyActive);
        },

        async getCustomerById(id) {
            if (typeof CustomersService === 'undefined') return { success: false, error: 'CustomersService no cargado' };
            return await CustomersService.getById(id);
        },

        async createCustomer(data) {
            if (typeof CustomersService === 'undefined') return { success: false, error: 'CustomersService no cargado' };
            return await CustomersService.create(data);
        },

        async updateCustomer(id, data) {
            if (typeof CustomersService === 'undefined') return { success: false, error: 'CustomersService no cargado' };
            return await CustomersService.update(id, data);
        },

        async deleteCustomer(id) {
            if (typeof CustomersService === 'undefined') return { success: false, error: 'CustomersService no cargado' };
            return await CustomersService.delete(id);
        },

        async getCustomerSales(customerId, limit) {
            if (typeof CustomersService === 'undefined') return { success: false, error: 'CustomersService no cargado' };
            return await CustomersService.getSales(customerId, limit);
        },

        async getCustomerCredits(id) {
            if (typeof CustomersService === 'undefined') return { success: false, error: 'CustomersService no cargado' };
            return await CustomersService.getCredits(id);
        },

        // --- PRODUCTOS ---
        async getProducts(page, pageSize, search, filter) {
            if (typeof ProductsService === 'undefined') return { success: false, error: 'ProductsService no cargado' };
            return await ProductsService.getAll(page, pageSize, search, filter);
        },

        async getProductById(id) {
            if (typeof ProductsService === 'undefined') return { success: false, error: 'ProductsService no cargado' };
            return await ProductsService.getById(id);
        },

        async createProduct(data) {
            if (typeof ProductsService === 'undefined') return { success: false, error: 'ProductsService no cargado' };
            return await ProductsService.create(data);
        },

        async updateProduct(id, data) {
            if (typeof ProductsService === 'undefined') return { success: false, error: 'ProductsService no cargado' };
            return await ProductsService.update(id, data);
        },

        async uploadProductImage(file) {
            if (typeof ProductsService === 'undefined') return { success: false, error: 'ProductsService no cargado' };
            return await ProductsService.uploadImage(file);
        },

        // NUEVO: EXPONER FUNCIÓN DE BORRADO
        async deleteProductImage(url) {
            if (typeof ProductsService === 'undefined') return { success: false, error: 'ProductsService no cargado' };
            return await ProductsService.deleteImage(url);
        },

        async getCategoriesTree() {
            if (typeof ProductsService === 'undefined') return { success: false, error: 'ProductsService no cargado' };
            return await ProductsService.getCategoriesTree();
        },

        async getBrands(search) {
            if (typeof ProductsService === 'undefined') return { success: false, error: 'ProductsService no cargado' };
            return await ProductsService.getBrands(search);
        },

        async createBrand(name) {
            if (typeof ProductsService === 'undefined') return { success: false, error: 'ProductsService no cargado' };
            return await ProductsService.createBrand(name);
        },

        subscribeToProducts(callback) {
            if (typeof ProductsService === 'undefined') return null;
            return ProductsService.subscribe(callback);
        },

        // --- OTROS ---
        async getPaymentMethods() {
            if (typeof supabaseClient === 'undefined') return { success: false, data: [] };
            try {
                const { data, error } = await supabaseClient.from('payment_methods').select('id, name').eq('is_active', true);
                if (error) throw error;
                return { success: true, data: data || [] };
            } catch (e) {
                return { success: false, error: e.message };
            }
        },

        async getDashboardData() {
            return { success: true, dailySales: 0, activeOrders: 0, activeCustomers: 0, productsInStock: 0 };
        },
        
        async getRecentSales(limit=3) {
            if (typeof SalesService !== 'undefined') {
                return await SalesService.getHistory(1, limit);
            }
            return { success: false, data: [] };
        },
        
        async getInventoryAlerts(limit=3) {
            return { success: true, data: [] };
        }
    };

})(window);