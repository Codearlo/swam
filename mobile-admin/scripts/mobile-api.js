/* mobile-admin/scripts/mobile-api.js */

/**
 * MOBILE API FACADE
 * Este archivo coordina los servicios especializados.
 * Requiere que sales-service.js, customers-service.js y products-service.js se carguen antes.
 */

const mobileApi = {
    // --- VENTAS (Usa SalesService) ---
    getSalesHistory: (p, s, t) => SalesService.getHistory(p, s, t),
    createSale: (p) => SalesService.create(p),
    searchProducts: (t) => SalesService.searchProductsForSale(t),

    // --- CLIENTES (Usa CustomersService) ---
    getCustomers: (p, s, term, a) => CustomersService.getAll(p, s, term, a),
    getCustomerById: (id) => CustomersService.getById(id),
    createCustomer: (d) => CustomersService.create(d),
    updateCustomer: (id, d) => CustomersService.update(id, d),
    deleteCustomer: (id) => CustomersService.delete(id),
    getCustomerSales: (id, l) => CustomersService.getSales(id, l),
    getCustomerCredits: (id) => CustomersService.getCredits(id),

    // --- PRODUCTOS (Usa ProductsService) ---
    getProducts: (p, s, term, f) => ProductsService.getAll(p, s, term, f),
    getProductById: (id) => ProductsService.getById(id),
    createProduct: (d) => ProductsService.create(d),
    updateProduct: (id, d) => ProductsService.update(id, d),
    uploadProductImage: (f) => ProductsService.uploadImage(f),
    getCategoriesTree: () => ProductsService.getCategoriesTree(),
    getBrands: (s) => ProductsService.getBrands(s),
    createBrand: (n) => ProductsService.createBrand(n),
    subscribeToProducts: (cb) => ProductsService.subscribe(cb),

    // --- UTILIDADES GLOBALES ---
    async getPaymentMethods() {
        if (!supabaseClient) return { success: false, data: [] };
        const { data } = await supabaseClient.from('payment_methods').select('id, name').eq('is_active', true);
        return { success: true, data: data || [] };
    },

    async getDashboardData() {
        // Datos básicos para el dashboard home
        return { success: true, dailySales: 0, activeOrders: 0, activeCustomers: 0, productsInStock: 0 };
    },
    
    async getRecentSales(limit=3) {
        return this.getSalesHistory(1, limit);
    },
    
    async getInventoryAlerts(limit=3) {
        return { success: true, data: [] };
    }
};

// Exponer globalmente
window.mobileApi = mobileApi;