import { Database } from '../packages/supabase/src/database.types';

type Insert = Database['public']['Tables']['notifications']['Insert'];
const test: Insert = {
  title: 'test',
  body: 'test',
  type: 'test',
  target_role: 'test',
  target_user: null,
};
console.log(test);
