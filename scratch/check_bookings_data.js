const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkBookings() {
  const { data, error } = await supabase
    .from('bookings')
    .select('id, agent_id, status, updated_at, fee')
    .in('status', ['completed', 'cancelled', 'confirmed', 'in_progress', 'picked_up'])
    .limit(10);

  if (error) {
    console.error(error);
  } else {
    console.log('Sample Bookings:', data);
  }
}

checkBookings();
