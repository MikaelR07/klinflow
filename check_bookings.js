import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const { data, error } = await supabase
    .from('bookings')
    .insert({
      user_id: '416b6870-7303-4608-9715-b5800a0f3fc9',
      agent_id: '416b6870-7303-4608-9715-b5800a0f3fc9',
      waste_type: 'Plastic',
      bags: 1,
      status: 'pending',
      is_market_trade: true,
      total_price: 100,
      preferred_date: new Date().toISOString().split('T')[0]
    });
  
  console.log("Error details:", JSON.stringify(error, null, 2));
}
run();
