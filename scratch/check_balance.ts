import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://heqxpcrguaopiimsuqmk.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '...'; // I will use the one from .env

// Wait, I can just run it using Vite's tsx or ts-node if I load env vars.
