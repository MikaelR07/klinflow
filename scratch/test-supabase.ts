import { createClient } from '@supabase/supabase-js';
import { Database } from '../packages/supabase/src/database.types';

const supabase = createClient<Database>('https://xyz', 'xyz');

const test = async () => {
  const { data, error } = await supabase.from('notifications').insert({
    title: 'test',
    body: 'test',
    type: 'test',
    target_role: 'test',
    target_user: null,
  });
  console.log(data);
};
