import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('apps/client/.env.local', 'utf-8');
const matchUrl = env.match(/VITE_SUPABASE_URL=(.*)/);
const matchKey = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/);

const supabase = createClient(matchUrl[1].trim(), matchKey[1].trim());

async function check() {
  const { data, error } = await supabase.storage.getBucket('swarms');
  console.log('Bucket swarms:', data, error);
}

check();
