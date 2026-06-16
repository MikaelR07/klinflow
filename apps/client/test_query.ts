import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '/home/mikael/Desktop/Coding/Klinflow/apps/client/.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase
    .from('user_wallets')
    .select(`
      user_id,
      cash_balance,
      profiles!inner (
        name,
        role,
        avatar_url
      )
    `)
    .eq('profiles.role', 'seller')
    .order('cash_balance', { ascending: false })
    .limit(5);

  console.log("Error:", error);
  console.log("Data:", JSON.stringify(data, null, 2));
}

test();
