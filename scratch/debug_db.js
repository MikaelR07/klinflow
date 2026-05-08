import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://heqxpcrguaopiimsuqmk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlcXhwY3JndWFvcGlpbXN1cW1rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzNjM2NjgsImV4cCI6MjA5MTkzOTY2OH0.vGES_grqNJDhSJJPvodzAEn02uF7wScNIOk9AhIbczI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function check() {
  const { data: profiles } = await supabase.from('profiles').select('id, name, phone, company_name').eq('phone', '0712345678');
  console.log('Mikael Profile:', profiles);
  
  if (profiles && profiles.length > 0) {
    const { data: configs } = await supabase.from('agent_configurations').select('*').eq('agent_id', profiles[0].id);
    console.log('Mikael Configs:', configs);
  }
}

check();
