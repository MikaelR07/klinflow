import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'https://heqxpcrguaopiimsuqmk.supabase.co',
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || ''
);

async function run() {
  // Try to find transactions related to amount 816 or resulting in 581.4
  const { data, error } = await supabase
    .from('wallet_transactions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20);
  console.log("Wallet Transactions:", data);

  const { data: userWallets } = await supabase
    .from('user_wallets')
    .select('*')
    .limit(20);
  console.log("User Wallets:", userWallets);
}
run();
