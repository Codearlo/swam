/* public/shared/scripts/api.js */

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
        
        const { data: authData, error: authError } = await supabaseClient.auth.signUp({
            email: userData.email,
            password: userData.password,
            options: {
                data: {
                    full_name: userData.full_name
                }
            }
        });

        if (authError) {
            throw authError;
        }

        if (!authData.user) {
            throw new Error('No se pudo crear el usuario');
        }

        // ¡CORREGIDO! Insertar en la nueva tabla 'profiles'
        const { error: insertError } = await supabaseClient
            .from('profiles')
            .insert({
                id: authData.user.id, // El UUID de auth.users
                full_name: userData.full_name,
                email: userData.email,
                role: 'client' // Rol por defecto
            });

        if (insertError) {
            console.warn('Error al insertar en tabla profiles:', insertError);
        }
        
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
        console.error('Error en registerUser:', error);
        return {
            success: false,
            error: error.message || 'Error al registrar usuario'
        };
    }
}

// FUNCIÓN PARA VERIFICAR SESIÓN (Ej. confirmación de email, si la activaras)
async function verifySession() {
    try {
        const configured = typeof isSupabaseConfigured === 'function' ? isSupabaseConfigured() : false;

        if (!configured) {
            console.log('Modo MOCK - Sesión verificada.');
            const mockName = 'Usuario Confirmado';
            setAuthData('mock_verified_token', 'client', mockName);
            return { success: true, full_name: mockName };
        }

        const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
        
        if (sessionError || !session) {
            return { success: false, error: 'Sesión no encontrada.' };
        }
        
        // ¡CORREGIDO! Consultar la nueva tabla 'profiles'
        const { data: userProfile, error: profileError } = await supabaseClient
            .from('profiles')
            .select('full_name, role')
            .eq('id', session.user.id) // Usar el UUID
            .single();
            
        if (profileError || !userProfile) {
             return handleSupabaseError(profileError || new Error('Perfil de usuario no encontrado.'), 'verifySession');
        }

        setAuthData(session.access_token, userProfile.role, userProfile.full_name);

        return {
            success: true,
            full_name: userProfile.full_name
        };

    } catch (error) {
        return handleSupabaseError(error, 'verifySession');
    }
}

async function loginUser(credentials) {
    try {
        const configured = typeof isSupabaseConfigured === 'function' ? isSupabaseConfigured() : false;
        
        if (!configured) {
            // ... (MOCK login se mantiene igual)
            console.log('Modo MOCK - Login simulado');
            if (credentials.email === 'admin@swam.com') {
                return { success: true, token: 'mock_admin_token_123', role: 'admin', full_name: 'Admin User' };
            } else if (credentials.email === 'client@swam.com') {
                return { success: true, token: 'mock_client_token_456', role: 'client', full_name: 'Client User' };
            }
            return { success: false, error: 'Credenciales inválidas.' };
        }

        const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password
        });

        if (authError) {
            return { success: false, error: 'Credenciales inválidas. Inténtalo de nuevo.' };
        }

        // ¡CORREGIDO! Consultar la nueva tabla 'profiles'
        const { data: userProfile, error: userError } = await supabaseClient
            .from('profiles')
            .select('id, full_name, role')
            .eq('id', authData.user.id) // Usar el UUID
            .single();

        if (userError || !userProfile) {
            return handleSupabaseError(userError || new Error('Perfil no encontrado'), 'loginUser');
        }

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

// NUEVA FUNCIÓN: Inicio de sesión con Google (OAuth)
async function signInWithGoogle() {
    try {
        const configured = typeof isSupabaseConfigured === 'function' ? isSupabaseConfigured() : false;
        
        if (!configured) {
            return { success: true, url: window.location.origin + '/public/auth/oauth-redirect/oauth-redirect.html#access_token=mock_oauth_token' };
        }

        const { data, error } = await supabaseClient.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/public/auth/oauth-redirect/oauth-redirect.html`,
                skipBrowserRedirect: false,
            }
        });

        if (error) {
            throw error;
        }

        return { success: true, url: data.url };
    } catch (error) {
        return handleSupabaseError(error, 'signInWithGoogle');
    }
}

// ¡ESTA ES LA FUNCIÓN QUE DABA EL ERROR!
async function handleOAuthRedirect() {
    try {
        const configured = typeof isSupabaseConfigured === 'function' ? isSupabaseConfigured() : false;
        if (!configured) {
             const mockName = 'Google User';
             const userRole = 'client';
             setAuthData('mock_oauth_token', userRole, mockName);
             return { success: true, role: userRole };
        }
        
        const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
        
        if (sessionError || !session) {
            return { success: false, error: 'Sesión no encontrada (OAuth).' };
        }

        const user = session.user;
        const fullName = user.user_metadata.full_name || user.email.split('@')[0];
        let userRole = 'client';

        // ¡CORREGIDO! Consultar la nueva tabla 'profiles'
        // Esto ya no fallará, porque la tabla 'profiles' SÍ usa UUID.
        let { data: userProfile, error: fetchError } = await supabaseClient
            .from('profiles')
            .select('role, full_name')
            .eq('id', user.id) // Buscar por UUID
            .single();

        if (fetchError && fetchError.code === 'PGRST116') { // No rows found (Nuevo usuario)
             console.log('Nuevo usuario OAuth. Insertando en profiles...');
            // ¡CORREGIDO! Insertar en la nueva tabla 'profiles'
            const { error: insertError } = await supabaseClient
                .from('profiles')
                .insert([{
                    id: user.id, // El UUID de auth.users
                    full_name: fullName,
                    email: user.email,
                    role: userRole
                }]);

            if (insertError) {
                // Si la inserción falla (ej. RLS), lanza el error
                throw insertError;
            }
        } else if (fetchError) {
            // Si falla la consulta
            return handleSupabaseError(fetchError, 'handleOAuthRedirect - Fetch Profile');
        } else {
            userRole = userProfile.role; // Usar el rol existente
        }

        setAuthData(session.access_token, userRole, fullName);

        return {
            success: true,
            role: userRole
        };

    } catch (error) {
        // El error 'invalid input syntax for type bigint' ya NO debería ocurrir
        // El error 'violates row-level security policy' (RLS) SÍ será capturado aquí
        return handleSupabaseError(error, 'handleOAuthRedirect');
    }
}

async function logoutUser() {
    // ... (Esta función se mantiene igual, es correcta)
    try {
        const configured = typeof isSupabaseConfigured === 'function' ? isSupabaseConfigured() : false;
        if (!configured) return { success: true };
        const { error } = await supabaseClient.auth.signOut();
        if (error) return handleSupabaseError(error, 'logoutUser');
        return { success: true };
    } catch (error) {
        return handleSupabaseError(error, 'logoutUser');
    }
}

async function resetPassword(email) {
    // ... (Esta función se mantiene igual, es correcta)
    try {
        const configured = typeof isSupabaseConfigured === 'function' ? isSupabaseConfigured() : false;
        if (!configured) {
            return { success: true, message: 'Enlace simulado enviado.' };
        }
        const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/public/auth/reset-password/reset-password.html`
        });
        if (error) return handleSupabaseError(error, 'resetPassword');
        return { success: true, message: 'Se ha enviado un enlace de recuperación a tu email.' };
    } catch (error) {
        return handleSupabaseError(error, 'resetPassword');
    }
}

// --- FUNCIONES DEL DASHBOARD (Se mantienen igual) ---

async function getDashboardData() {
    try {
        const configured = typeof isSupabaseConfigured === 'function' ? isSupabaseConfigured() : false;
        if (!configured) {
            return getMockDashboardData();
        }
        const [salesResult, ordersResult, customersResult, productsResult] = await Promise.all([
            getDailySales(),
            getActiveOrders(),
            getActiveCustomers(),
            getProductsInStock()
        ]);
        return {
            success: true,
            dailySales: salesResult.total || 0,
            activeOrders: ordersResult.count || 0,
            activeCustomers: customersResult.count || 0,
            productsInStock: productsResult.count || 0
        };
    } catch (error) {
        return handleSupabaseError(error, 'getDashboardData');
    }
}
async function getDailySales() {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabaseClient.from('sales').select('total_sale').eq('sale_date', today);
    if (error) return { total: 0 };
    const total = data.reduce((sum, sale) => sum + parseFloat(sale.total_sale), 0);
    return { total };
}
async function getActiveOrders() {
    const { count, error } = await supabaseClient.from('orders').select('*', { count: 'exact', head: true }).in('status', ['ordered', 'shipped', 'in_transit']);
    return { count: count || 0 };
}
async function getActiveCustomers() {
    const { count, error } = await supabaseClient.from('customers').select('*', { count: 'exact', head: true }).eq('is_active', true);
    return { count: count || 0 };
}
async function getProductsInStock() {
    const { data, error } = await supabaseClient.from('batches').select('product_id, quantity_available').gt('quantity_available', 0);
    if (error) return { count: 0 };
    const uniqueProducts = new Set(data.map(batch => batch.product_id));
    return { count: uniqueProducts.size };
}
async function getRecentSales(limit = 5) {
    const configured = typeof isSupabaseConfigured === 'function' ? isSupabaseConfigured() : false;
    if (!configured) {
        return { success: true, data: getMockRecentSales() };
    }
    const { data, error } = await supabaseClient
        .from('sales')
        .select(`id, sale_code, total_sale, sale_date, customers (full_name)`)
        .order('sale_date', { ascending: false })
        .limit(limit);
    if (error) return handleSupabaseError(error, 'getRecentSales');
    return {
        success: true,
        data: data.map(sale => ({
            code: sale.sale_code,
            customer: sale.customers?.full_name || 'Cliente Anónimo',
            amount: parseFloat(sale.total_sale),
            status: 'completed'
        }))
    };
}
async function getInventoryAlerts(limit = 10) {
    const configured = typeof isSupabaseConfigured === 'function' ? isSupabaseConfigured() : false;
    if (!configured) {
        return { success: true, data: getMockInventoryAlerts() };
    }
    const { data, error } = await supabaseClient
        .from('batches')
        .select(`quantity_available, products (name)`)
        .lte('quantity_available', 10)
        .order('quantity_available', { ascending: true })
        .limit(limit);
    if (error) return handleSupabaseError(error, 'getInventoryAlerts');
    return {
        success: true,
        data: data.map(batch => ({
            title: `${batch.quantity_available === 0 ? 'Agotado' : 'Stock bajo'}: ${batch.products?.name}`,
            subtitle: `Quedan ${batch.quantity_available} unidades`,
            type: batch.quantity_available === 0 ? 'error' : 'warning'
        }))
    };
}
function getMockDashboardData() {
    return { success: true, dailySales: 2450.00, activeOrders: 12, activeCustomers: 156, productsInStock: 342 };
}
function getMockRecentSales() {
    return [
        { code: 'VNT-001', customer: 'Juan Pérez', amount: 450.00, status: 'completed' },
        { code: 'VNT-002', customer: 'María García', amount: 1200.00, status: 'completed' },
        { code: 'VNT-003', customer: 'Carlos López', amount: 780.00, status: 'pending' }
    ];
}
function getMockInventoryAlerts() {
    return [
        { title: 'Stock bajo: Teclado Mecánico', subtitle: 'Quedan 5 unidades', type: 'warning' },
        { title: 'Agotado: Mouse Pad RGB', subtitle: '0 unidades disponibles', type: 'error' },
        { title: 'Stock bajo: Webcam HD', subtitle: 'Quedan 3 unidades', type: 'warning' }
    ];
}

(function(window) {
    window.api = {
        registerUser,
        loginUser,
        logoutUser,
        resetPassword,
        getDashboardData,
        getRecentSales,
        getInventoryAlerts,
        verifySession,
        signInWithGoogle, 
        handleOAuthRedirect 
    };
})(window);