import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkColumns() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error:', error);
    return;
  }

  if (data && data.length > 0) {
    console.log('Columns:', Object.keys(data[0]));
  } else {
    console.log('No data found, trying to get schema info...');
    const { data: cols, error: colError } = await supabase.rpc('get_table_columns', { table_name: 'profiles' });
    if (colError) console.error('Col Error:', colError);
    else console.log('Columns from RPC:', cols);
  }
}

checkColumns();
