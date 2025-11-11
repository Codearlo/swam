/* public/shared/scripts/supabase-client.js */

const SUPABASE_URL = 'https://xqaprtldorhjmmzhouop.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxYXBydGxkb3Joam1temhvdW9wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzNjk2NzcsImV4cCI6MjA3Nzk0NTY3N30.BlfqUApdPFB6jUJZaRjecVztpGFe_G2DsqBOIlivXkg';

let supabaseClient = null;

if (typeof supabase !== 'undefined' && SUPABASE_URL && SUPABASE_ANON_KEY) {
    try {
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('✅ Supabase configurado correctamente');
    } catch (error) {
        console.warn('⚠️ Error al configurar Supabase:', error);
        supabaseClient = null;
    }
} else {
    console.warn('⚠️ Supabase no disponible - Modo MOCK');
}

function handleSupabaseError(error, context = '') {
    console.error(`Error en ${context}:`, error);
    return {
        success: false,
        error: error.message || 'Error desconocido'
    };
}

function isSupabaseConfigured() {
    return supabaseClient !== null && SUPABASE_URL && SUPABASE_ANON_KEY;
}

window.supabaseClient = supabaseClient;
window.handleSupabaseError = handleSupabaseError;
window.isSupabaseConfigured = isSupabaseConfigured;

console.log('🔌 Supabase:', isSupabaseConfigured() ? 'PRODUCCIÓN' : 'MOCK');