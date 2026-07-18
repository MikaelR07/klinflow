import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://heqxpcrguaopiimsuqmk.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlcXhwY3JndWFvcGlpbXN1cW1rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzNjM2NjgsImV4cCI6MjA5MTkzOTY2OH0.vGES_grqNJDhSJJPvodzAEn02uF7wScNIOk9AhIbczI'
const supabase = createClient(supabaseUrl, supabaseKey)

async function check() {
  const { data, error } = await supabase.from('profiles').select('id, name, service_profile').order('updated_at', { ascending: false }).limit(2)
  console.log(JSON.stringify(data, null, 2))
}

check()
