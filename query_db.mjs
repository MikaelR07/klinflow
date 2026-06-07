import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://heqxpcrguaopiimsuqmk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlcXhwY3JndWFvcGlpbXN1cW1rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzNjM2NjgsImV4cCI6MjA5MTkzOTY2OH0.vGES_grqNJDhSJJPvodzAEn02uF7wScNIOk9AhIbczI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: bData, error: bErr } = await supabase.from('bookings').select('id, user_id, agent_id, waste_type, status, is_group_pickup, created_at').order('created_at', { ascending: false }).limit(3);
  console.log("Bookings:", bData);
  if (bErr) console.error("Error bookings:", bErr);

  const { data: aData, error: aErr } = await supabase.from('agent_configurations').select('agent_id, accepted_materials').limit(3);
  console.log("Agent configs:", aData);
  if (aErr) console.error("Error agents:", aErr);
}
check();
