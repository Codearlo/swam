/* public/shared/scripts/supabase-client.js */

const SUPABASE_URL = 'https://tu-proyecto.supabase.co'; 
const SUPABASE_ANON_KEY = 'tu-anon-key-aqui';

let supabaseClient = null;

if (typeof supabase !== 'undefined') {
    try {
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } catch (error) {
        console.warn('Supabase en modo MOCK');
    }
}

function handleSupabaseError(error, context = '') {
    console.error(`Error en ${context}:`, error);
    return {
        success: false,
        error: error.message || 'Error desconocido'
    };
}

function isSupabaseConfigured() {
    return SUPABASE_URL !== 'https://xqaprtldorhjmmzhouop.supabase.co' && 
           SUPABASE_ANON_KEY !== 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxYXBydGxkb3Joam1temhvdW9wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzNjk2NzcsImV4cCI6MjA3Nzk0NTY3N30.BlfqUApdPFB6jUJZaRjecVztpGFe_G2DsqBOIlivXkg' &&
           supabaseClient !== null;
}

window.supabaseClient = supabaseClient;
window.handleSupabaseError = handleSupabaseError;
window.isSupabaseConfigured = isSupabaseConfigured;

console.log('🔌 Supabase:', isSupabaseConfigured() ? 'PRODUCCIÓN' : 'MOCK');