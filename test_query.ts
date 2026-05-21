import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function test() {
  const { data, error } = await supabase.from('rfq_offers').select('id, rfqs(id)').limit(1);
  console.log("rfqs(id) result:", JSON.stringify({data, error}, null, 2));

  const { data: d2, error: e2 } = await supabase.from('rfq_offers').select('id, rfq:rfqs(id)').limit(1);
  console.log("rfq:rfqs(id) result:", JSON.stringify({data: d2, error: e2}, null, 2));
  
  const { data: d3, error: e3 } = await supabase.from('rfq_offers').select('id, rfq:rfq_id(id)').limit(1);
  console.log("rfq:rfq_id(id) result:", JSON.stringify({data: d3, error: e3}, null, 2));
}
test();
