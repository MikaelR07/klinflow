import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321',
  process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlZmF1bHQiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjQxNjA5NiwiZXhwIjoxOTMyMDExNDI2fQ.wGj9GfXpP-6P7ZJ8aO-ZJ8aO-ZJ8aO-ZJ8aO-ZJ8aM'
);

async function run() {
  const { data, error } = await supabase.rpc('get_table_columns', { table_name: 'fulfillment_orders' });
  if (error) console.log(error);
  
  // if rpc fails, we can just select 1 row and print keys
  const { data: d1 } = await supabase.from('fulfillment_orders').select('*').limit(1);
  if (d1 && d1.length > 0) console.log('fulfillment_orders:', Object.keys(d1[0]));
  
  const { data: d2 } = await supabase.from('rfqs').select('*').limit(1);
  if (d2 && d2.length > 0) console.log('rfqs:', Object.keys(d2[0]));

  const { data: d3 } = await supabase.from('rfq_offers').select('*').limit(1);
  if (d3 && d3.length > 0) console.log('rfq_offers:', Object.keys(d3[0]));
}
run();
