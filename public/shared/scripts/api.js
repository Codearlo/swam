/* public/shared/scripts/api.js */

async function registerUser(userData) {
    try {
        const configured = typeof isSupabaseConfigured === 'function' ? isSupabaseConfigured() : false;
        
        if (!configured) {
            console.log('Modo MOCK - Registro simulado. Simula necesidad de verificación.');
            // En modo MOCK, simulamos éxito en el envío del correo
            return {
                success: true,
                needsEmailVerification: true, // Simular que se necesita verificación
                message: 'Verificación simulada enviada. Redirigiendo al login...'
            };
        }

        const { data: authData, error: authError } = await supabaseClient.auth.signUp({
            email: userData.email,
            password: userData.password,
            options: {
                data: {
                    full_name: userData.full_name
                },
                emailRedirectTo: `${window.location.origin}/public/auth/confirm-email/confirm-email.html` // NUEVA URL DE REDIRECCIÓN
            }
        });

        if (authError) {
            throw authError;
        }

        if (!authData.user) {
            throw new Error('No se pudo crear el usuario');
        }

        if (authData.session) {
            // Esto solo ocurre si la confirmación de email está DESACTIVADA en Supabase
            const { error: insertError } = await supabaseClient
                .from('users')
                .insert([{
                    id: authData.user.id,
                    full_name: userData.full_name,
                    email: userData.email,
                    role: 'client',
                    is_active: true,
                    created_at: new Date().toISOString()
                }]);

            if (insertError) {
                console.warn('Error al insertar en tabla users:', insertError);
            }

            return {
                success: true,
                token: authData.session.access_token,
                role: 'client',
                full_name: userData.full_name,
                user_id: authData.user.id
            };
        } else {
            // Esto ocurre si la confirmación de email está ACTIVADA en Supabase (flujo deseado)
            return {
                success: true,
                needsEmailVerification: true,
                message: 'Se ha enviado un enlace de verificación a tu email.'
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

// FUNCIÓN PARA VERIFICAR SESIÓN TRAS CLIC EN EL CORREO
async function verifySession() {
    try {
        const configured = typeof isSupabaseConfigured === 'function' ? isSupabaseConfigured() : false;

        if (!configured) {
            console.log('Modo MOCK - Sesión verificada y establecida.');
            // MOCK: Simular éxito de sesión y devolver datos de un usuario logueado
            const mockName = 'Usuario Confirmado';
            setAuthData('mock_verified_token', 'client', mockName);
            return {
                success: true,
                full_name: mockName
            };
        }

        // 1. Obtener la sesión (Supabase lo maneja automáticamente con el hash de la URL)
        const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
        
        if (sessionError || !session) {
            return {
                success: false,
                error: 'Sesión no encontrada o token inválido. (Error: ' + (sessionError?.message || 'Token Missing') + ')'
            };
        }
        
        // 2. Obtener datos del perfil de usuario de la tabla 'users'
        // MODIFICACIÓN CLAVE: Consultar por 'email' en lugar de 'id' para evitar el error de BIGINT.
        const { data: userProfile, error: profileError } = await supabaseClient
            .from('users')
            .select('full_name, role')
            .eq('email', session.user.email) // <--- USAMOS EMAIL
            .single();
            
        if (profileError || !userProfile) {
             return handleSupabaseError(profileError || new Error('Perfil de usuario no encontrado después de la verificación.'), 'verifySession');
        }

        // 3. Almacenar datos de autenticación del usuario
        setAuthData(session.access_token, userProfile.role, userProfile.full_name);

        return {
            success: true,
            full_name: userProfile.full_name
        };

    } catch (error) {
        // Devuelve el error de la base de datos si ocurre, para depuración
        return handleSupabaseError(error, 'verifySession');
    }
}

async function loginUser(credentials) {
    try {
        const configured = typeof isSupabaseConfigured === 'function' ? isSupabaseConfigured() : false;
        
        if (!configured) {
            console.log('Modo MOCK - Login simulado');
            
            if (credentials.email === 'admin@swam.com' && credentials.password === '123456') {
                return {
                    success: true,
                    token: 'mock_admin_token_123',
                    role: 'admin',
                    full_name: 'Admin User'
                };
            } else if (credentials.email === 'client@swam.com' && credentials.password === '123456') {
                return {
                    success: true,
                    token: 'mock_client_token_456',
                    role: 'client',
                    full_name: 'Client User'
                };
            } else {
                return {
                    success: false,
                    error: 'Credenciales inválidas. Inténtalo de nuevo.'
                };
            }
        }

        const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password
        });

        if (authError) {
            return {
                success: false,
                error: 'Credenciales inválidas. Inténtalo de nuevo.'
            };
        }

        const { data: user, error: userError } = await supabaseClient
            .from('users')
            .select('id, full_name, role, is_active')
            .eq('email', credentials.email)
            .single();

        if (userError || !user) {
            return handleSupabaseError(userError || new Error('Usuario no encontrado'), 'loginUser');
        }

        if (!user.is_active) {
            return {
                success: false,
                error: 'Tu cuenta está desactivada. Contacta al administrador.'
            };
        }

        await supabaseClient
            .from('users')
            .update({ last_login: new Date().toISOString() })
            .eq('id', user.id);

        return {
            success: true,
            token: authData.session.access_token,
            role: user.role,
            full_name: user.full_name,
            user_id: user.id
        };

    } catch (error) {
        return handleSupabaseError(error, 'loginUser');
    }
}

async function logoutUser() {
    try {
        const configured = typeof isSupabaseConfigured === 'function' ? isSupabaseConfigured() : false;
        
        if (!configured) {
            return { success: true };
        }

        const { error } = await supabaseClient.auth.signOut();
        
        if (error) {
            return handleSupabaseError(error, 'logoutUser');
        }

        return { success: true };

    } catch (error) {
        return handleSupabaseError(error, 'logoutUser');
    }
}

async function resetPassword(email) {
    try {
        const configured = typeof isSupabaseConfigured === 'function' ? isSupabaseConfigured() : false;
        
        if (!configured) {
            console.log('Modo MOCK - Recuperación simulada');
            return {
                success: true,
                message: 'Se ha enviado un enlace de recuperación a tu email.'
            };
        }

        const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/public/auth/reset-password/reset-password.html`
        });

        if (error) {
            return handleSupabaseError(error, 'resetPassword');
        }

        return {
            success: true,
            message: 'Se ha enviado un enlace de recuperación a tu email.'
        };

    } catch (error) {
        return handleSupabaseError(error, 'resetPassword');
    }
}

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
    
    const { data, error } = await supabaseClient
        .from('sales')
        .select('total_sale')
        .eq('sale_date', today);

    if (error) return { total: 0 };

    const total = data.reduce((sum, sale) => sum + parseFloat(sale.total_sale), 0);
    return { total };
}

async function getActiveOrders() {
    const { count, error } = await supabaseClient
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .in('status', ['ordered', 'shipped', 'in_transit']);

    return { count: count || 0 };
}

async function getActiveCustomers() {
    const { count, error } = await supabaseClient
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

    return { count: count || 0 };
}

async function getProductsInStock() {
    const { data, error } = await supabaseClient
        .from('batches')
        .select('product_id, quantity_available')
        .gt('quantity_available', 0);

    if (error) return { count: 0 };

    const uniqueProducts = new Set(data.map(batch => batch.product_id));
    return { count: uniqueProducts.size };
}

async function getRecentSales(limit = 5) {
    const configured = typeof isSupabaseConfigured === 'function' ? isSupabaseConfigured() : false;
    
    if (!configured) {
        return {
            success: true,
            data: getMockRecentSales()
        };
    }

    const { data, error } = await supabaseClient
        .from('sales')
        .select(`
            id,
            sale_code,
            total_sale,
            sale_date,
            customers (full_name)
        `)
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
        return {
            success: true,
            data: getMockInventoryAlerts()
        };
    }

    const { data, error } = await supabaseClient
        .from('batches')
        .select(`
            quantity_available,
            products (name)
        `)
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
    return {
        success: true,
        dailySales: 2450.00,
        activeOrders: 12,
        activeCustomers: 156,
        productsInStock: 342
    };
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

window.api = {
    registerUser,
    loginUser,
    logoutUser,
    resetPassword,
    getDashboardData,
    getRecentSales,
    getInventoryAlerts,
    verifySession
};