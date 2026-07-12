import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '/home/mikael/Desktop/Coding/Klinflow/apps/client/.env' });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
  console.log("Checking User Bookings");
  const { data: { users }, error: authErr } = await supabase.auth.admin.listUsers();
  // We can't use admin without service role, but wait, we have user context.
}
run();
