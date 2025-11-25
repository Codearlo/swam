/* public/shared/scripts/api.js */

// --- SECCIÓN 1: AUTENTICACIÓN Y USUARIOS ---

async function registerUser(userData) {
    try {
        const configured = typeof isSupabaseConfigured === 'function' ? isSupabaseConfigured() : false;
        
        if (!configured) {
            console.log('Modo MOCK - Registro simulado.');
            return {
                success: true,
                role: 'client',
                full_name: userData.full_name
            };
        }
        
        // 1. Crear usuario en Auth
        const { data: authData, error: authError } = await supabaseClient.auth.signUp({
            email: userData.email,
            password: userData.password,
            options: {
                data: {
                    full_name: userData.full_name
                }
            }
        });

        if (authError) throw authError;

        if (!authData.user) throw new Error('No se pudo crear el usuario');

        // 2. Insertar perfil en tabla pública 'profiles'
        const { error: insertError } = await supabaseClient
            .from('profiles')
            .insert({
                id: authData.user.id,
                full_name: userData.full_name,
                email: userData.email,
                role: 'client' // Rol por defecto
            });

        if (insertError) {
            console.warn('Error al crear perfil público:', insertError);
        }
        
        // 3. Manejar sesión
        if (authData.session) {
             setAuthData(authData.session.access_token, 'client', userData.full_name);
             return {
                success: true,
                token: authData.session.access_token,
                role: 'client',
                full_name: userData.full_name,
                user_id: authData.user.id
            };
        } else {
            return {
                success: false, 
                needsEmailVerification: true,
                error: 'Registro exitoso, pero requiere verificación de email.'
            };
        }

    } catch (error) {
        return handleSupabaseError(error, 'registerUser');
    }
}

async function loginUser(credentials) {
    try {
        const configured = typeof isSupabaseConfigured === 'function' ? isSupabaseConfigured() : false;
        
        if (!configured) return mockLogin(credentials);

        const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password
        });

        if (authError) return { success: false, error: 'Credenciales inválidas.' };

        // Obtener rol y nombre desde 'profiles'
        const { data: userProfile, error: userError } = await supabaseClient
            .from('profiles')
            .select('id, full_name, role')
            .eq('id', authData.user.id)
            .single();

        if (userError || !userProfile) {
            return { success: false, error: 'Perfil de usuario no encontrado.' };
        }

        setAuthData(authData.session.access_token, userProfile.role, userProfile.full_name);

        return {
            success: true,
            token: authData.session.access_token,
            role: userProfile.role,
            full_name: userProfile.full_name,
            user_id: userProfile.id
        };

    } catch (error) {
        return handleSupabaseError(error, 'loginUser');
    }
}

async function verifySession() {
    try {
        const configured = typeof isSupabaseConfigured === 'function' ? isSupabaseConfigured() : false;

        if (!configured) {
            return { success: true, full_name: 'Usuario Mock' };
        }

        const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
        
        if (sessionError || !session) return { success: false, error: 'Sesión no encontrada.' };
        
        const { data: userProfile, error: profileError } = await supabaseClient
            .from('profiles')
            .select('full_name, role')
            .eq('id', session.user.id)
            .single();
            
        if (profileError) return { success: false, error: 'Perfil no encontrado.' };

        setAuthData(session.access_token, userProfile.role, userProfile.full_name);

        return { success: true, full_name: userProfile.full_name };

    } catch (error) {
        return handleSupabaseError(error, 'verifySession');
    }
}

async function signInWithGoogle() {
    try {
        const configured = typeof isSupabaseConfigured === 'function' ? isSupabaseConfigured() : false;
        if (!configured) return { success: true, url: '#' }; // Mock

        const { data, error } = await supabaseClient.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/public/auth/oauth-redirect/oauth-redirect.html`,
                skipBrowserRedirect: false,
            }
        });

        if (error) throw error;
        return { success: true, url: data.url };
    } catch (error) {
        return handleSupabaseError(error, 'signInWithGoogle');
    }
}

async function handleOAuthRedirect() {
    try {
        const configured = typeof isSupabaseConfigured === 'function' ? isSupabaseConfigured() : false;
        if (!configured) return { success: true, role: 'client' }; // Mock
        
        const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
        
        if (sessionError || !session) return { success: false, error: 'Sesión OAuth no encontrada.' };

        const user = session.user;
        const fullName = user.user_metadata.full_name || user.email.split('@')[0];
        let userRole = 'client';

        // Verificar o crear perfil
        let { data: userProfile, error: fetchError } = await supabaseClient
            .from('profiles')
            .select('role, full_name')
            .eq('id', user.id)
            .single();

        if (fetchError && fetchError.code === 'PGRST116') {
            // Nuevo usuario, insertar perfil
            const { error: insertError } = await supabaseClient
                .from('profiles')
                .insert([{
                    id: user.id,
                    full_name: fullName,
                    email: user.email,
                    role: userRole
                }]);
            if (insertError) throw insertError;
        } else if (fetchError) {
            throw fetchError;
        } else {
            userRole = userProfile.role;
        }

        setAuthData(session.access_token, userRole, fullName);
        return { success: true, role: userRole };

    } catch (error) {
        return handleSupabaseError(error, 'handleOAuthRedirect');
    }
}

async function logoutUser() {
    try {
        const configured = typeof isSupabaseConfigured === 'function' ? isSupabaseConfigured() : false;
        if (configured) await supabaseClient.auth.signOut();
        logout(); // Limpia localStorage y redirige
        return { success: true };
    } catch (error) {
        return handleSupabaseError(error, 'logoutUser');
    }
}

async function resetPassword(email) {
    try {
        const configured = typeof isSupabaseConfigured === 'function' ? isSupabaseConfigured() : false;
        if (!configured) return { success: true, message: 'Simulación: Email enviado.' };

        const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/public/auth/reset-password/reset-password.html`
        });
        if (error) throw error;
        return { success: true, message: 'Enlace de recuperación enviado.' };
    } catch (error) {
        return handleSupabaseError(error, 'resetPassword');
    }
}

// --- SECCIÓN 2: DATOS DEL DASHBOARD (CONEXIÓN REAL) ---

// 1. Obtener Métricas Generales (Usando RPC para optimizar)
async function getDashboardData() {
    try {
        const configured = typeof isSupabaseConfigured === 'function' ? isSupabaseConfigured() : false;
        if (!configured) return getMockDashboardData();
        
        // Llamada a la función SQL 'get_dashboard_metrics' creada en Supabase
        const { data, error } = await supabaseClient.rpc('get_dashboard_metrics');
        
        if (error) throw error;
        
        return {
            success: true,
            ...data 
        };
    } catch (error) {
        console.error('Error dashboard metrics:', error);
        return { success: false, error: error.message };
    }
}

// 2. Obtener Ventas Recientes (Para el Dashboard Home)
async function getRecentSales(limit = 5) {
    try {
        const configured = typeof isSupabaseConfigured === 'function' ? isSupabaseConfigured() : false;
        if (!configured) return { success: true, data: getMockRecentSales() };

        const { data, error } = await supabaseClient
            .from('sales')
            .select(`
                sale_code, 
                total_sale, 
                customers (full_name)
            `)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;

        return {
            success: true,
            data: data.map(sale => ({
                code: sale.sale_code,
                customer: sale.customers?.full_name || 'Cliente General',
                amount: parseFloat(sale.total_sale),
                status: 'completed' 
            }))
        };
    } catch (error) {
        return handleSupabaseError(error, 'getRecentSales');
    }
}

// 3. Obtener Alertas de Inventario
async function getInventoryAlerts(limit = 5) {
    try {
        const configured = typeof isSupabaseConfigured === 'function' ? isSupabaseConfigured() : false;
        if (!configured) return { success: true, data: getMockInventoryAlerts() };

        // Buscamos lotes con stock menor o igual a 10
        const { data, error } = await supabaseClient
            .from('batches')
            .select(`quantity_available, products (name)`)
            .lte('quantity_available', 10)
            .gt('quantity_available', 0) 
            .order('quantity_available', { ascending: true })
            .limit(limit);
        
        if (error) throw error;

        return {
            success: true,
            data: data.map(batch => ({
                title: `Stock bajo: ${batch.products?.name || 'Producto'}`,
                subtitle: `Quedan ${batch.quantity_available} unidades`,
                type: 'warning'
            }))
        };
    } catch (error) {
        return handleSupabaseError(error, 'getInventoryAlerts');
    }
}

// 4. Obtener Productos Top (Con filtro de tiempo y corrección de tipos)
async function getTopProducts(limit = 5, period = 'week') {
    try {
        const configured = typeof isSupabaseConfigured === 'function' ? isSupabaseConfigured() : false;
        
        // Si no hay Supabase, devolvemos datos falsos para prueba
        if (!configured) return { success: true, data: [] }; 

        // Llamada a la función SQL actualizada con el parámetro 'time_period'
        const { data, error } = await supabaseClient.rpc('get_top_products', { 
            limit_count: limit,
            time_period: period 
        });

        if (error) throw error;

        return {
            success: true,
            data: data.map((item, index) => ({
                rank: index + 1,
                name: item.product_name,
                sales: `${item.total_sold} ventas`,
                amount: parseFloat(item.total_revenue)
            }))
        };
    } catch (error) {
        return handleSupabaseError(error, 'getTopProducts');
    }
}

// --- SECCIÓN 3: MÓDULO DE VENTAS ---

// 5. Obtener Listado de Ventas Completo (Paginado y Filtrado)
async function getSalesList(page = 1, pageSize = 10, filters = {}) {
    try {
        const configured = typeof isSupabaseConfigured === 'function' ? isSupabaseConfigured() : false;
        if (!configured) return { success: true, data: [], total: 0 };

        // Llamada a la función RPC para obtener lista filtrada
        const { data, error } = await supabaseClient.rpc('get_sales_list', {
            p_page_number: page,
            p_page_size: pageSize,
            p_search: filters.search || null,
            p_start_date: filters.startDate || null,
            p_end_date: filters.endDate || null
        });

        if (error) throw error;

        // Si no hay datos, el totalCount es 0
        const totalCount = data.length > 0 ? data[0].total_count : 0;

        return {
            success: true,
            data: data.map(sale => ({
                id: sale.id,
                code: sale.sale_code,
                customer: sale.customer_name,
                paymentMethod: sale.payment_method || 'No especificado',
                date: sale.sale_date, // Formato YYYY-MM-DD devuelto por SQL
                total: parseFloat(sale.total_sale)
            })),
            total: parseInt(totalCount)
        };

    } catch (error) {
        return handleSupabaseError(error, 'getSalesList');
    }
}

// --- SECCIÓN 4: REALTIME SUBSCRIPTION ---

/**
 * Se suscribe a cambios en las tablas clave y ejecuta callbacks específicos.
 */
function subscribeToDashboard(callbacks) {
    const configured = typeof isSupabaseConfigured === 'function' ? isSupabaseConfigured() : false;
    if (!configured) return;

    const channel = supabaseClient.channel('dashboard-realtime');

    channel
        // Escuchar cambios en VENTAS
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'sales' },
            (payload) => {
                console.log('Cambio en ventas detectado:', payload);
                if (callbacks.onSalesChange) callbacks.onSalesChange();
            }
        )
        // Escuchar cambios en ÓRDENES
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'orders' },
            (payload) => {
                if (callbacks.onOrdersChange) callbacks.onOrdersChange();
            }
        )
        // Escuchar cambios en INVENTARIO
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'batches' },
            (payload) => {
                if (callbacks.onInventoryChange) callbacks.onInventoryChange();
            }
        )
        // Escuchar cambios en CLIENTES
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'customers' },
            (payload) => {
                if (callbacks.onCustomersChange) callbacks.onCustomersChange();
            }
        )
        .subscribe();
        
    console.log('📡 Dashboard suscrito a cambios en tiempo real');
    return channel;
}

// --- UTILS & MOCKS DE RESPALDO ---
function mockLogin(c) {
    if (c.email === 'admin@swam.com') return { success: true, role: 'admin', full_name: 'Admin Mock' };
    return { success: true, role: 'client', full_name: 'Client Mock' };
}
function getMockDashboardData() { return { success: true, dailySales: 0, activeOrders: 0, activeCustomers: 0, productsInStock: 0 }; }
function getMockRecentSales() { return []; }
function getMockInventoryAlerts() { return []; }

// Exportar al objeto global `api`
(function(window) {
    window.api = {
        registerUser,
        loginUser,
        logoutUser,
        resetPassword,
        verifySession,
        signInWithGoogle, 
        handleOAuthRedirect,
        // Funciones de datos
        getDashboardData,
        getRecentSales,
        getInventoryAlerts,
        getTopProducts,
        getSalesList, // <--- Función exportada para el módulo de ventas
        subscribeToDashboard
    };
})(window);