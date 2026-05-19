import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from './database.types';

export * from './database.types';

const getEnv = (key: string): string | undefined => {
  if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
    return (import.meta as any).env[key];
  }
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key];
  }
  return undefined;
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY');

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

let supabaseInstance: SupabaseClient<Database>;

if (!(globalThis as any).__supabaseInstance) {
  if (isSupabaseConfigured) {
    (globalThis as any).__supabaseInstance = createClient<Database>(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    });
  } else {
    (globalThis as any).__supabaseInstance = null as unknown as SupabaseClient<Database>;
  }
}

export const supabase: SupabaseClient<Database> = (globalThis as any).__supabaseInstance;

export const phoneToEmail = (phone: string): string => {
  const clean = (phone || '').replace(/\D/g, ''); 
  let normalized = clean;
  if (clean.length === 10 && clean.startsWith('0')) {
    normalized = '254' + clean.slice(1);
  }
  return `${normalized.replace('+', '')}@klinflow.ke`;
};

export const sanitizeProfile = (profile: Database['public']['Tables']['profiles']['Row']): Partial<Database['public']['Tables']['profiles']['Row']> => {
  const { role, ...safe } = profile;
  return safe;
};
