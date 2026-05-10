import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: 'apps/client/.env' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const { data, error } = await supabase.from('bookings').select('id, user_id, agent_id, booking_type, status').order('created_at', { ascending: false }).limit(5);
  console.log("Recent Bookings:");
  console.log(data);
  if (error) console.error(error);
}
run();
