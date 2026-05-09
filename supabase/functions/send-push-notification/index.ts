import { serve } from "https://deno.land/std@0.131.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import webpush from "https://esm.sh/web-push"

// ── ENVIRONMENT VARIABLES ──
// These must be set in your Supabase Dashboard under Settings > Edge Functions
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')!
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')!

// Initialize Supabase Client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// Initialize Web Push
webpush.setVapidDetails(
  'mailto:support@cleanflow.ke',
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
)

serve(async (req) => {
  // ── AUTH CHECK (Internal Only) ──
  // Only allow requests with the service role key (sent by the DB trigger)
  const authHeader = req.headers.get('Authorization')
  if (!authHeader || !authHeader.includes(SUPABASE_SERVICE_ROLE_KEY)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  try {
    const { notification, target_user, target_role } = await req.json()
    console.log(`[PushEngine] Processing: ${notification.title} for ${target_user || target_role}`)

    let targetUserIds: string[] = []

    // ── TARGETING LOGIC ──
    if (target_user) {
      targetUserIds = [target_user]
    } else if (target_role && target_role !== 'all') {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', target_role)
      targetUserIds = profiles?.map(p => p.id) || []
    } else if (target_role === 'all') {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id')
      targetUserIds = profiles?.map(p => p.id) || []
    }

    if (targetUserIds.length === 0) {
      return new Response(JSON.stringify({ message: "No targets" }), { status: 200 })
    }

    // ── FETCH SUBSCRIPTIONS ──
    const { data: subs, error: subError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .in('user_id', targetUserIds)

    if (subError || !subs || subs.length === 0) {
      return new Response(JSON.stringify({ message: "No active subscriptions found" }), { status: 200 })
    }

    // ── DISPATCH PUSHES ──
    const results = await Promise.all(subs.map(async (sub) => {
      try {
        await webpush.sendNotification({
          endpoint: sub.endpoint,
          keys: { auth: sub.auth, p256dh: sub.p256dh }
        }, JSON.stringify({
          title: notification.title,
          body: notification.body,
          icon: '/logo192.png',
          badge: '/logo192.png',
          sound: 'default',
          data: { 
            url: '/settings/notifications',
            notificationId: notification.id
          }
        }))
        return { success: true, endpoint: sub.endpoint }
      } catch (err: any) {
        console.error(`[PushEngine] Error for ${sub.endpoint}:`, err.message)
        
        // ── AUTO-CLEANUP ──
        // If the subscription is expired or invalid (404/410), remove it from our DB
        if (err.statusCode === 410 || err.statusCode === 404) {
          await supabase.from('push_subscriptions').delete().eq('id', sub.id)
        }
        return { success: false, endpoint: sub.endpoint, error: err.message }
      }
    }))

    return new Response(JSON.stringify({ 
      success: true, 
      sent_count: results.filter(r => r.success).length,
      failed_count: results.filter(r => !r.success).length 
    }), { 
      headers: { "Content-Type": "application/json" } 
    })

  } catch (err: any) {
    console.error(`[PushEngine] Critical Failure:`, err.message)
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 500, 
      headers: { "Content-Type": "application/json" } 
    })
  }
})
