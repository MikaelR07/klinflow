
import { createClient } from '@supabase/supabase-api-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, role, agent_account_type, company_id')
    .eq('agent_account_type', 'fleet_driver')
    .limit(5);

  console.log('Fleet Drivers:', JSON.stringify(data, null, 2));
  
  if (data?.[0]?.company_id) {
    const { data: company } = await supabase
      .from('profiles')
      .select('id, name')
      .eq('id', data[0].company_id)
      .single();
    console.log('Linked Company Admin:', JSON.stringify(company, null, 2));
  }
}

check();
