import { createClient } from '@supabase/supabase-js';

const getEnv = (key) => {
  // Support both Vite (import.meta.env) and Node/standard (process.env)
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env[key];
  }
  return process.env[key];
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY');

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[CleanFlow] Supabase env vars not set. ' +
    'Create a .env.local file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
  );
}

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    })
  : null;

export const phoneToEmail = (phone) => {
  const clean = (phone || '').replace(/\D/g, ''); 
  let normalized = clean;
  if (clean.length === 10 && clean.startsWith('0')) {
    normalized = '254' + clean.slice(1);
  }
  return `${normalized.replace('+', '')}@cleanflow.ke`;
};

export const sanitizeProfile = (profile) => {
  const { pin, role, ...safe } = profile;
  return safe;
};
