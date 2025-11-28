/* mobile-admin/scripts/mobile-api.js */

const mobileApi = {
    
    /**
     * Obtiene el historial de ventas reales de la base de datos.
     * Soporta paginación y búsqueda básica.
     */
    async getSalesHistory(page = 1, pageSize = 20, searchTerm = '') {
        // Verificar conexión
        if (typeof supabaseClient === 'undefined' || !supabaseClient) {
            console.error('Supabase no está inicializado.');
            return { success: false, error: 'Sin conexión a la base de datos' };
        }

        try {
            const start = (page - 1) * pageSize;
            const end = start + pageSize - 1;

            // Construir consulta: Tabla 'sales' + datos del cliente 'customers'
            let query = supabaseClient
                .from('sales')
                .select(`
                    id,
                    sale_code,
                    total_sale,
                    created_at,
                    status, 
                    customers (
                        full_name
                    )
                `, { count: 'exact' })
                .order('created_at', { ascending: false })
                .range(start, end);

            // Filtro de búsqueda (si el usuario escribió algo)
            if (searchTerm) {
                // Filtramos por código de venta (exacto o parcial)
                query = query.ilike('sale_code', `%${searchTerm}%`);
            }

            const { data, error, count } = await query;

            if (error) throw error;

            // Formatear datos para la vista móvil
            const sales = data.map(sale => ({
                id: sale.id,
                code: sale.sale_code || '---',
                customer: sale.customers?.full_name || 'Cliente General', // Manejo seguro si es null
                amount: parseFloat(sale.total_sale || 0),
                date: sale.created_at,
                // Si tu tabla no tiene columna 'status', asumimos completado
                status: sale.status || 'completed' 
            }));

            return {
                success: true,
                data: sales,
                total: count
            };

        } catch (error) {
            console.error('Error en mobileApi.getSalesHistory:', error);
            return { success: false, error: 'Error al cargar ventas' };
        }
    }
};

// Exponer la API globalmente para que la usen las páginas
window.mobileApi = mobileApi;