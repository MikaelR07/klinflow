import { serve } from "https://deno.land/std@0.131.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import webpush from "https://esm.sh/web-push"
import { getEnv, validateEnv } from '../_shared/env.ts'
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

// ── ENVIRONMENT VARIABLES ──
validateEnv(['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'VAPID_PUBLIC_KEY', 'VAPID_PRIVATE_KEY'])

const SUPABASE_URL = getEnv('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = getEnv('SUPABASE_SERVICE_ROLE_KEY')
const VAPID_PUBLIC_KEY = getEnv('VAPID_PUBLIC_KEY')
const VAPID_PRIVATE_KEY = getEnv('VAPID_PRIVATE_KEY')

// Initialize Supabase Client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// Initialize Web Push
webpush.setVapidDetails(
  'mailto:support@klinflow.ke',
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
)

const NotificationPayloadSchema = z.object({
  notification: z.object({
    id: z.string().optional(),
    title: z.string(),
    body: z.string(),
    metadata: z.any().optional().nullable()
  }),
  target_user: z.string().uuid().optional().nullable(),
  target_role: z.string().optional().nullable()
});

serve(async (req) => {
  // ── AUTH CHECK (Internal Only) ──
  // Only allow requests with the service role key (sent by the DB trigger)
  const authHeader = req.headers.get('Authorization')
  if (!authHeader || !authHeader.includes(SUPABASE_SERVICE_ROLE_KEY)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  try {
    const body = await req.json();
    const parseResult = NotificationPayloadSchema.safeParse(body);
    
    if (!parseResult.success) {
      throw new Error(`Invalid push notification payload: ${parseResult.error.message}`);
    }
    
    const { notification, target_user, target_role } = parseResult.data;
    console.log(`[PushEngine] Processing: ${notification.title} for ${target_user || target_role}`)

    let targetUserIds: string[] = []

    // ── TARGETING LOGIC ──
    if (target_user) {
      targetUserIds = [target_user]
    } else if (target_role && target_role !== 'all') {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, agent_account_type, company_id')
        .eq('role', target_role)
      
      let allRoleIds = profiles?.map(p => p.id) || [];
      
      // Material Filtering for Agents
      if (target_role === 'agent' && notification.metadata?.wasteType) {
         const wasteType = notification.metadata.wasteType;
         const { data: configs } = await supabase.from('agent_configurations').select('agent_id, accepted_materials');
         
         const validConfigMap = new Map();
         if (configs) {
             configs.forEach((c: any) => {
                 validConfigMap.set(c.agent_id, c.accepted_materials);
             });
         }
         
         allRoleIds = profiles?.filter(p => {
             const targetAgentId = (p.agent_account_type === 'fleet_driver' && p.company_id) ? p.company_id : p.id;
             const accepted = validConfigMap.get(targetAgentId) || [];
             if (accepted.length === 0) return true; // default: accept all
             return accepted.includes(wasteType);
         }).map(p => p.id) || [];
      }
      
      targetUserIds = allRoleIds;
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
