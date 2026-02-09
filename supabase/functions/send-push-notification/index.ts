import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "https://esm.sh/web-push@3.6.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface PushRequest {
  profile_id: string;
  title: string;
  body: string;
  url?: string;
  icon?: string;
  tag?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");
    const vapidSubject = Deno.env.get("VAPID_SUBJECT") || "mailto:support@tipkoro.com";
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!vapidPublicKey || !vapidPrivateKey) {
      console.error("VAPID keys not configured");
      return new Response(
        JSON.stringify({ error: "Push notifications not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Configure web-push with VAPID details
    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { profile_id, title, body, url, icon, tag }: PushRequest = await req.json();

    if (!profile_id || !title || !body) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: profile_id, title, body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[Push] Sending notification to profile: ${profile_id}, title: "${title}"`);

    // Fetch subscriptions for this profile
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('id, endpoint, p256dh, auth')
      .eq('profile_id', profile_id);

    if (error) {
      console.error("[Push] Error fetching subscriptions:", error);
      return new Response(
        JSON.stringify({ error: "Failed to fetch subscriptions" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log("[Push] No push subscriptions found for profile:", profile_id);
      return new Response(
        JSON.stringify({ success: true, sent: 0, message: "No push subscriptions found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[Push] Found ${subscriptions.length} subscription(s) for profile`);

    const payload = JSON.stringify({
      title,
      body,
      icon: icon || '/favicon.ico',
      badge: '/favicon.ico',
      url: url || '/dashboard',
      tag: tag || 'tipkoro-notification',
      data: {
        url: url || '/dashboard',
        type: tag || 'general',
      },
    });

    let sent = 0;
    const failedEndpoints: string[] = [];

    for (const sub of subscriptions) {
      try {
        // Create the proper Web Push subscription object
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        };

        console.log(`[Push] Sending to endpoint: ${sub.endpoint.substring(0, 50)}...`);

        // Use web-push library for proper VAPID auth and encryption
        await webpush.sendNotification(pushSubscription, payload);
        sent++;
        console.log(`[Push] Successfully sent to subscription ${sub.id}`);
      } catch (err: any) {
        console.error(`[Push] Error for ${sub.endpoint}:`, err.message || err);

        // Check if subscription is expired/invalid (410 Gone or 404 Not Found)
        if (err.statusCode === 410 || err.statusCode === 404) {
          failedEndpoints.push(sub.id);
          console.log(`[Push] Marking subscription ${sub.id} for removal (status: ${err.statusCode})`);
        }
      }
    }

    // Remove invalid subscriptions
    if (failedEndpoints.length > 0) {
      console.log(`[Push] Removing ${failedEndpoints.length} invalid subscription(s)`);
      await supabase
        .from('push_subscriptions')
        .delete()
        .in('id', failedEndpoints);
    }

    console.log(`[Push] Sent: ${sent}/${subscriptions.length}, Removed: ${failedEndpoints.length}`);

    return new Response(
      JSON.stringify({
        success: true,
        sent,
        total: subscriptions.length,
        removed: failedEndpoints.length
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[Push] Error in send-push-notification:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
