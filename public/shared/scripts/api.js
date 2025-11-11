/* public/shared/scripts/api.js */

async function registerUser(userData) {
    try {
        const configured = typeof isSupabaseConfigured === 'function' ? isSupabaseConfigured() : false;
        
        if (!configured) {
            console.log('Modo MOCK - Registro simulado');
            return {
                success: true,
                token: 'mock_token_' + Date.now(),
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
            return handleSupabaseError(authError, 'registerUser - Auth');
        }

        const { data: user, error: insertError } = await supabaseClient
            .from('users')
            .insert([{
                full_name: userData.full_name,
                email: userData.email,
                password_hash: 'handled_by_auth',
                role: 'client',
                is_active: true
            }])
            .select()
            .single();

        if (insertError) {
            await supabaseClient.auth.admin.deleteUser(authData.user.id);
            return handleSupabaseError(insertError, 'registerUser - Insert');
        }

        return {
            success: true,
            token: authData.session?.access_token || 'mock_token',
            role: user.role || 'client',
            full_name: user.full_name,
            user_id: user.id
        };

    } catch (error) {
        return handleSupabaseError(error, 'registerUser');
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
    getInventoryAlerts
};