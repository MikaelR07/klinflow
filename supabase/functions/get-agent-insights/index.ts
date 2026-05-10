import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { agent_id } = await req.json()

    // 1. Analyze Market Trends (Most popular material today)
    const { data: popularMaterial } = await supabase
      .from('bookings')
      .select('waste_type')
      .eq('status', 'pending')
      .limit(50)

    const materialCounts = popularMaterial?.reduce((acc: any, curr: any) => {
      acc[curr.waste_type] = (acc[curr.waste_type] || 0) + 1
      return acc
    }, {})

    const topMaterial = Object.entries(materialCounts || {})
      .sort(([, a]: any, [, b]: any) => b - a)[0]?.[0] || 'Recyclables'

    // 2. Check for High Value Bids in Marketplace
    const { count: highValueBids } = await supabase
      .from('marketplace_offers')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')

    // 3. Construct a Dynamic AI Insight
    let insight = {
      title: '📈 Market Pulse',
      message: `Demand for ${topMaterial} is surging in your sector. Focus on high-volume pickups to maximize today's earnings.`,
      action: 'Check Market',
      target: '/sourcing'
    }

    if (highValueBids && highValueBids > 5) {
      insight = {
        title: '🤝 Marketplace Surge',
        message: `There are ${highValueBids} active bids waiting for stock. Check the marketplace to offload your current inventory.`,
        action: 'View Bids',
        target: '/trades'
      }
    }

    return new Response(
      JSON.stringify({ insight }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
