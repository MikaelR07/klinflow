import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function run() {
  console.log('--- PROFILES (limit 5) ---');
  const { data: profiles } = await supabase.from('profiles').select('id, role, agent_account_type, company_id').limit(10);
  console.log(profiles);

  console.log('\n--- COMPANIES (limit 5) ---');
  const { data: companies } = await supabase.from('companies').select('*').limit(5);
  console.log(companies);
  
  console.log('\n--- USER COMPANIES (limit 5) ---');
  const { data: userCompanies } = await supabase.from('user_companies').select('*').limit(5);
  console.log(userCompanies);
}
run();
