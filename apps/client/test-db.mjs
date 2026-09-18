import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const envFile = fs.existsSync('.env') ? fs.readFileSync('.env', 'utf8') : ''
const urlMatch = envFile.match(/VITE_SUPABASE_URL=(.*)/)
const keyMatch = envFile.match(/VITE_SUPABASE_ANON_KEY=(.*)/)

const client = createClient(urlMatch[1], keyMatch[1])

async function run() {
  const { data: user } = await client.from('profiles').select('*').eq('role', 'seller').limit(1)
  const userId = user[0].id
  
  const { data: txns } = await client.rpc('get_agent_wallet_transactions', {
    p_user_id: userId,
    p_limit: 50
  })
  
  const refIds = txns.filter(t => t.transaction_type === 'payout').map(t => t.reference_id).filter(Boolean)
  console.log("Ref IDs:", refIds)
  
  if (refIds.length > 0) {
     const { data: fo } = await client.from('fulfillment_orders').select('id, assigned_agent_id').in('id', refIds)
     console.log("Fulfillment orders:", fo)
  }
}
run()
