import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: 'apps/client/.env' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const { data, error } = await supabase.from('bookings').select('id, user_id, agent_id, waste_type, status, is_group_pickup, created_at').order('created_at', { ascending: false }).limit(5);
  console.log("Bookings:", data);
  if (error) console.error("Error:", error);
}
check();
