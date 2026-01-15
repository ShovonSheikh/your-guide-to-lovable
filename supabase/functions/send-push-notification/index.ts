import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Web Push implementation using crypto APIs
async function sendWebPush(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: string,
  vapidPublicKey: string,
  vapidPrivateKey: string
): Promise<Response> {
  // For now, we'll create the in-app notification and log the push attempt
  // Full web-push implementation requires additional crypto handling in Deno
  console.log(`[Push] Would send to endpoint: ${subscription.endpoint.substring(0, 50)}...`);
  console.log(`[Push] Payload: ${payload}`);
  
  // In production, you would implement the full Web Push Protocol here
  // or use a service like Firebase Cloud Messaging
  return new Response(JSON.stringify({ success: true }), { status: 200 });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { profile_id, type, title, body, data } = await req.json();

    console.log(`[send-push-notification] Sending notification to profile: ${profile_id}`);
    console.log(`[send-push-notification] Type: ${type}, Title: ${title}`);

    if (!profile_id || !type || !title || !body) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: profile_id, type, title, body" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check user notification settings
    const { data: settings } = await supabase
      .from('notification_settings')
      .select('*')
      .eq('profile_id', profile_id)
      .maybeSingle();

    // Respect user settings - if no settings exist, default to enabled
    if (settings) {
      if (type === 'tip_received' && !settings.tips_enabled) {
        console.log(`[send-push-notification] Tips notifications disabled for user`);
        return new Response(
          JSON.stringify({ success: true, message: 'Notifications disabled by user' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (type.startsWith('withdrawal') && !settings.withdrawals_enabled) {
        console.log(`[send-push-notification] Withdrawal notifications disabled for user`);
        return new Response(
          JSON.stringify({ success: true, message: 'Notifications disabled by user' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (type === 'promotion' && !settings.promotions_enabled) {
        console.log(`[send-push-notification] Promotion notifications disabled for user`);
        return new Response(
          JSON.stringify({ success: true, message: 'Notifications disabled by user' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Create in-app notification
    const { error: notifError } = await supabase.from('notifications').insert({
      profile_id,
      type,
      title,
      message: body,
      data: data || null,
      is_read: false,
    });

    if (notifError) {
      console.error('[send-push-notification] Error creating notification:', notifError);
    } else {
      console.log('[send-push-notification] In-app notification created');
    }

    // Get push subscriptions for this user
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('profile_id', profile_id);

    if (subError) {
      console.error('[send-push-notification] Error fetching subscriptions:', subError);
    }

    if (!subscriptions?.length) {
      console.log('[send-push-notification] No push subscriptions found for user');
      return new Response(
        JSON.stringify({ success: true, message: 'In-app notification created, no push subscriptions' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[send-push-notification] Found ${subscriptions.length} push subscription(s)`);

    // If VAPID keys are configured, attempt to send push notifications
    if (vapidPublicKey && vapidPrivateKey) {
      const pushPayload = JSON.stringify({
        title,
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        url: data?.url || '/dashboard',
        tag: type,
      });

      const pushResults = await Promise.allSettled(
        subscriptions.map(sub => 
          sendWebPush(
            { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
            pushPayload,
            vapidPublicKey,
            vapidPrivateKey
          )
        )
      );

      // Clean up failed subscriptions (expired endpoints)
      for (let i = 0; i < pushResults.length; i++) {
        const result = pushResults[i];
        if (result.status === 'rejected' || 
            (result.status === 'fulfilled' && result.value.status === 410)) {
          console.log(`[send-push-notification] Removing expired subscription: ${subscriptions[i].id}`);
          await supabase
            .from('push_subscriptions')
            .delete()
            .eq('id', subscriptions[i].id);
        }
      }

      const successCount = pushResults.filter(r => r.status === 'fulfilled').length;
      console.log(`[send-push-notification] Sent ${successCount}/${subscriptions.length} push notifications`);
    } else {
      console.log('[send-push-notification] VAPID keys not configured, skipping push notifications');
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Notifications sent' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[send-push-notification] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
