/* public/shared/scripts/api.js */

async function registerUser(userData) {
    try {
        const configured = typeof isSupabaseConfigured === 'function' ? isSupabaseConfigured() : false;
        
        if (!configured) {
            console.log('Modo MOCK - Registro simulado. Simula auto-login.');
            // En modo MOCK, simulamos éxito en el registro y auto-login
            return {
                success: true,
                needsEmailVerification: false, 
                message: 'Registro simulado exitoso. Auto-login.',
                role: 'client',
                full_name: userData.full_name
            };
        }
        
        // **IMPORTANTE**: Para que el registro sea SIN VERIFICACIÓN, 
        // debe tener la opción "Disable email confirmation" ACTIVADA en Supabase > Auth > Settings
        
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

        // Siempre insertamos o actualizamos en la tabla 'users' al registrar.
        const { error: insertError } = await supabaseClient
            .from('users')
            .upsert({
                id: authData.user.id,
                full_name: userData.full_name,
                email: userData.email,
                role: 'client',
                is_active: true,
                created_at: new Date().toISOString()
            }, { onConflict: 'id' });

        if (insertError) {
            console.warn('Error al insertar/actualizar en tabla users:', insertError);
        }
        
        // Si hay sesión, el login fue exitoso (Supabase con confirmación deshabilitada).
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
            // Si NO hay sesión, significa que se envió un correo de confirmación (Supabase lo tiene activo)
            // Le indicamos al front que el proceso requirió verificación.
            return {
                success: false, 
                needsEmailVerification: true,
                error: 'Registro exitoso, pero requiere verificación de email. Por favor, revisa tu correo o cambia la configuración de Supabase.'
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

// FUNCIÓN PARA VERIFICAR SESIÓN TRAS CLIC EN EL CORREO (Se mantiene para consistencia, aunque no se usa en el nuevo flujo)
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

        const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
        
        if (sessionError || !session) {
            return {
                success: false,
                error: 'Sesión no encontrada o token inválido. (Error: ' + (sessionError?.message || 'Token Missing') + ')'
            };
        }
        
        const { data: userProfile, error: profileError } = await supabaseClient
            .from('users')
            .select('full_name, role')
            .eq('email', session.user.email)
            .single();
            
        if (profileError || !userProfile) {
             return handleSupabaseError(profileError || new Error('Perfil de usuario no encontrado después de la verificación.'), 'verifySession');
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

// NUEVA FUNCIÓN: Inicio de sesión con Google (OAuth)
async function signInWithGoogle() {
    try {
        const configured = typeof isSupabaseConfigured === 'function' ? isSupabaseConfigured() : false;
        
        if (!configured) {
            // MOCK: Simular redirección
            return { success: true, url: window.location.origin + '/public/auth/oauth-redirect/oauth-redirect.html#access_token=mock_oauth_token' };
        }

        // Supabase redirige automáticamente al proveedor.
        const { data, error } = await supabaseClient.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/public/auth/oauth-redirect/oauth-redirect.html`, // Redirección a una página de manejo
                skipBrowserRedirect: false,
            }
        });

        if (error) {
            throw error;
        }

        return { success: true, url: data.url }; // Devuelve la URL de redirección
    } catch (error) {
        return handleSupabaseError(error, 'signInWithGoogle');
    }
}

// NUEVA FUNCIÓN: Maneja la redirección de OAuth
async function handleOAuthRedirect() {
    try {
        const configured = typeof isSupabaseConfigured === 'function' ? isSupabaseConfigured() : false;
        if (!configured) {
             // MOCK: Simular inicio de sesión exitoso
             const mockName = 'Google User';
             const userRole = 'client';
             setAuthData('mock_oauth_token', userRole, mockName);
             return { success: true, role: userRole };
        }
        
        // Supabase Auth se encarga de procesar el token en el hash de la URL al llamar getSession().
        const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
        
        if (sessionError || !session) {
            return {
                success: false,
                error: 'Sesión no encontrada o token inválido después de OAuth.'
            };
        }

        const user = session.user;
        const fullName = user.user_metadata.full_name || user.email.split('@')[0];
        let userRole = 'client';

        // 1. Intentar obtener el perfil existente
        let { data: userProfile, error: fetchError } = await supabaseClient
            .from('users')
            .select('role, full_name')
            .eq('id', user.id)
            .single();

        if (fetchError && fetchError.code === 'PGRST116') { // No rows found (Nuevo usuario)
             console.log('Nuevo usuario OAuth. Insertando...');
            // 2. Insertar nuevo usuario si no existe
            const { error: insertError } = await supabaseClient
                .from('users')
                .insert([{
                    id: user.id,
                    full_name: fullName,
                    email: user.email,
                    role: userRole,
                    is_active: true,
                    created_at: new Date().toISOString()
                }]);

            if (insertError) {
                console.warn('Error al insertar en tabla users (OAuth):', insertError);
            }
        } else if (fetchError) {
            return handleSupabaseError(fetchError, 'handleOAuthRedirect - Fetch Profile');
        } else {
            userRole = userProfile.role; // Usar el rol existente
        }

        // 3. Almacenar datos de autenticación
        setAuthData(session.access_token, userRole, fullName);

        return {
            success: true,
            role: userRole
        };

    } catch (error) {
        return handleSupabaseError(error, 'handleOAuthRedirect');
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
// ... (resto de funciones)
}

// ... (resto de funciones)

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