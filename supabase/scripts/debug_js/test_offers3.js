import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
// We will use anon key but since we suspect RLS is the issue, we can't use anon key.
// But we don't have the service role key!
// Let me just check if the user is filtering the offers out in MyOffers.jsx
