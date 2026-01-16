import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailNotificationRequest {
  profile_id: string;
  type: 'tip_received' | 'tip_sent' | 'withdrawal_submitted' | 'withdrawal_processing' | 'withdrawal_completed' | 'withdrawal_rejected' | 'promotion';
  data?: {
    amount?: number;
    supporter_name?: string;
    creator_name?: string;
    message?: string;
    reason?: string;
    tip_id?: string;
    url?: string;
  };
}

// Email templates for different notification types
function getEmailContent(type: string, data: EmailNotificationRequest['data'] = {}): { subject: string; html: string } {
  const baseStyle = `
    <style>
      body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0a0a0b; color: #ffffff; margin: 0; padding: 0; }
      .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
      .card { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; padding: 32px; }
      .header { text-align: center; margin-bottom: 24px; }
      .logo { color: #FBBF24; font-size: 24px; font-weight: bold; }
      .emoji { font-size: 48px; margin-bottom: 16px; }
      .title { color: #ffffff; font-size: 24px; font-weight: bold; margin: 0 0 8px 0; }
      .amount { color: #FBBF24; font-size: 36px; font-weight: bold; }
      .message { color: #a0aec0; font-size: 16px; line-height: 1.6; margin: 16px 0; }
      .quote { font-style: italic; color: #cbd5e0; padding: 12px; background: rgba(255,255,255,0.05); border-radius: 8px; }
      .button { display: inline-block; background: #FBBF24; color: #0a0a0b; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 24px; }
      .footer { text-align: center; color: #64748b; font-size: 12px; margin-top: 32px; }
    </style>
  `;

  switch (type) {
    case 'tip_received':
      return {
        subject: `You received ৳${data.amount} on TipKoro! 💰`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>${baseStyle}</head>
          <body>
            <div class="container">
              <div class="card">
                <div class="header">
                  <div class="emoji">💰</div>
                  <div class="logo">TipKoro</div>
                </div>
                <h1 class="title" style="text-align: center;">You received a tip!</h1>
                <p class="amount" style="text-align: center;">৳${data.amount}</p>
                <p class="message" style="text-align: center;">
                  ${data.supporter_name === 'Anonymous' ? 'Someone' : data.supporter_name} just sent you a tip!
                </p>
                ${data.message ? `<div class="quote">"${data.message}"</div>` : ''}
                <div style="text-align: center;">
                  <a href="https://tipkoro.lovable.app/dashboard" class="button">View Dashboard</a>
                </div>
              </div>
              <p class="footer">TipKoro - Support Creators You Love</p>
            </div>
          </body>
          </html>
        `
      };

    case 'tip_sent':
      return {
        subject: `Your tip of ৳${data.amount} was sent! ❤️`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>${baseStyle}</head>
          <body>
            <div class="container">
              <div class="card">
                <div class="header">
                  <div class="emoji">❤️</div>
                  <div class="logo">TipKoro</div>
                </div>
                <h1 class="title" style="text-align: center;">Thank you for your support!</h1>
                <p class="amount" style="text-align: center;">৳${data.amount}</p>
                <p class="message" style="text-align: center;">
                  You just supported ${data.creator_name || 'a creator'}. Your generosity means the world!
                </p>
                ${data.message ? `<div class="quote">Your message: "${data.message}"</div>` : ''}
                <div style="text-align: center;">
                  <a href="https://tipkoro.lovable.app/explore" class="button">Discover More Creators</a>
                </div>
              </div>
              <p class="footer">TipKoro - Support Creators You Love</p>
            </div>
          </body>
          </html>
        `
      };

    case 'withdrawal_submitted':
      return {
        subject: `Withdrawal request submitted - ৳${data.amount}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>${baseStyle}</head>
          <body>
            <div class="container">
              <div class="card">
                <div class="header">
                  <div class="emoji">📤</div>
                  <div class="logo">TipKoro</div>
                </div>
                <h1 class="title" style="text-align: center;">Withdrawal Request Received</h1>
                <p class="amount" style="text-align: center;">৳${data.amount}</p>
                <p class="message" style="text-align: center;">
                  Your withdrawal request has been submitted and is being processed.
                  We'll notify you once it's completed.
                </p>
                <div style="text-align: center;">
                  <a href="https://tipkoro.lovable.app/finance" class="button">View Finance</a>
                </div>
              </div>
              <p class="footer">TipKoro - Support Creators You Love</p>
            </div>
          </body>
          </html>
        `
      };

    case 'withdrawal_processing':
      return {
        subject: `Withdrawal processing - ৳${data.amount}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>${baseStyle}</head>
          <body>
            <div class="container">
              <div class="card">
                <div class="header">
                  <div class="emoji">⏳</div>
                  <div class="logo">TipKoro</div>
                </div>
                <h1 class="title" style="text-align: center;">Withdrawal Being Processed</h1>
                <p class="amount" style="text-align: center;">৳${data.amount}</p>
                <p class="message" style="text-align: center;">
                  Your withdrawal is being processed. This usually takes 1-3 business days.
                </p>
                <div style="text-align: center;">
                  <a href="https://tipkoro.lovable.app/finance" class="button">View Finance</a>
                </div>
              </div>
              <p class="footer">TipKoro - Support Creators You Love</p>
            </div>
          </body>
          </html>
        `
      };

    case 'withdrawal_completed':
      return {
        subject: `Withdrawal complete! ৳${data.amount} sent 🎉`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>${baseStyle}</head>
          <body>
            <div class="container">
              <div class="card">
                <div class="header">
                  <div class="emoji">🎉</div>
                  <div class="logo">TipKoro</div>
                </div>
                <h1 class="title" style="text-align: center;">Withdrawal Complete!</h1>
                <p class="amount" style="text-align: center;">৳${data.amount}</p>
                <p class="message" style="text-align: center;">
                  Great news! Your withdrawal has been completed and the funds have been sent to your account.
                </p>
                <div style="text-align: center;">
                  <a href="https://tipkoro.lovable.app/finance" class="button">View Finance</a>
                </div>
              </div>
              <p class="footer">TipKoro - Support Creators You Love</p>
            </div>
          </body>
          </html>
        `
      };

    case 'withdrawal_rejected':
      return {
        subject: `Withdrawal request rejected`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>${baseStyle}</head>
          <body>
            <div class="container">
              <div class="card">
                <div class="header">
                  <div class="emoji">❌</div>
                  <div class="logo">TipKoro</div>
                </div>
                <h1 class="title" style="text-align: center;">Withdrawal Rejected</h1>
                <p class="amount" style="text-align: center;">৳${data.amount}</p>
                <p class="message" style="text-align: center;">
                  Unfortunately, your withdrawal request was rejected.
                </p>
                ${data.reason ? `<div class="quote">Reason: ${data.reason}</div>` : ''}
                <p class="message" style="text-align: center;">
                  Please contact support if you have any questions.
                </p>
                <div style="text-align: center;">
                  <a href="https://tipkoro.lovable.app/finance" class="button">View Finance</a>
                </div>
              </div>
              <p class="footer">TipKoro - Support Creators You Love</p>
            </div>
          </body>
          </html>
        `
      };

    default:
      return {
        subject: 'TipKoro Notification',
        html: `
          <!DOCTYPE html>
          <html>
          <head>${baseStyle}</head>
          <body>
            <div class="container">
              <div class="card">
                <div class="header">
                  <div class="emoji">🔔</div>
                  <div class="logo">TipKoro</div>
                </div>
                <h1 class="title" style="text-align: center;">Notification</h1>
                <p class="message" style="text-align: center;">
                  You have a new notification from TipKoro.
                </p>
                <div style="text-align: center;">
                  <a href="https://tipkoro.lovable.app/dashboard" class="button">Visit TipKoro</a>
                </div>
              </div>
              <p class="footer">TipKoro - Support Creators You Love</p>
            </div>
          </body>
          </html>
        `
      };
  }
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { profile_id, type, data }: EmailNotificationRequest = await req.json();

    if (!profile_id || !type) {
      return new Response(
        JSON.stringify({ error: "Missing profile_id or type" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user profile and notification settings
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email, first_name, last_name')
      .eq('id', profile_id)
      .single();

    if (profileError || !profile?.email) {
      console.error("Profile not found or no email:", profileError);
      return new Response(
        JSON.stringify({ success: false, message: "Profile not found or no email" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check notification settings
    const { data: settings } = await supabase
      .from('notification_settings')
      .select('*')
      .eq('profile_id', profile_id)
      .maybeSingle();

    // Respect user settings
    if (settings) {
      if ((type === 'tip_received' || type === 'tip_sent') && !settings.tips_enabled) {
        console.log("Tip notifications disabled for user");
        return new Response(
          JSON.stringify({ success: true, message: "Notifications disabled" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (type.startsWith('withdrawal') && !settings.withdrawals_enabled) {
        console.log("Withdrawal notifications disabled for user");
        return new Response(
          JSON.stringify({ success: true, message: "Notifications disabled" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (type === 'promotion' && !settings.promotions_enabled) {
        console.log("Promotion notifications disabled for user");
        return new Response(
          JSON.stringify({ success: true, message: "Notifications disabled" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Get email content
    const { subject, html } = getEmailContent(type, data);

    // Create in-app notification
    const notificationTitle = subject.split(' - ')[0] || subject;
    await supabase.from('notifications').insert({
      profile_id,
      type,
      title: notificationTitle,
      message: `${data?.amount ? `৳${data.amount}` : ''} ${data?.supporter_name || data?.creator_name || ''}`.trim() || notificationTitle,
      data: data || {},
      is_read: false,
    });

    // Send email via Resend REST API
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: "TipKoro <onboarding@resend.dev>", // Use verified domain in production
        to: [profile.email],
        subject,
        html,
      }),
    });

    const emailData = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error("Resend API error:", emailData);
      return new Response(
        JSON.stringify({ error: "Failed to send email", details: emailData }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }


    return new Response(
      JSON.stringify({ success: true, emailId: emailData?.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in send-email-notification:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
