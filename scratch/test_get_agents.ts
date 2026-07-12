import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'dummy';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase.rpc('get_nearby_agents_dynamic', {
    p_lat: -1.2635,
    p_lng: 36.8048,
    p_max_results: 15,
    p_max_radius_km: 50
  });

  console.log('Error:', error);
  console.log('Data count:', data?.length);
  if (data && data.length > 0) {
    console.log('Sample agent is_hub_active:', data[0].is_hub_active);
    console.log('Sample agent role:', data[0].role);
    console.log('Sample agent location:', data[0].location);
    console.log('Sample agent hub_location:', data[0].hub_location);
  }
}

test();
