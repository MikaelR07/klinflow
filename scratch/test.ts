import { supabase } from './packages/core/src/lib/supabaseClient';
supabase.from('profiles').update({ name: 'test' }).eq('id', '123');
