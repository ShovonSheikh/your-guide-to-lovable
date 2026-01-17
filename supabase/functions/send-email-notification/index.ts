import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailNotificationRequest {
  profile_id?: string;
  email?: string; // Direct email for non-registered supporters
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

// Role-based sender emails
function getSenderEmail(type: string): string {
  switch (type) {
    case 'tip_received':
    case 'tip_sent':
      return 'TipKoro Notifications <notifications@tipkoro.com>';
    case 'withdrawal_submitted':
    case 'withdrawal_processing':
    case 'withdrawal_completed':
    case 'withdrawal_rejected':
      return 'TipKoro Finance <finance@tipkoro.com>';
    case 'promotion':
      return 'TipKoro <hello@tipkoro.com>';
    default:
      return 'TipKoro Support <support@tipkoro.com>';
  }
}

// Professional email templates
function getEmailContent(type: string, data: EmailNotificationRequest['data'] = {}): { subject: string; html: string } {
  const baseStyle = `
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0a0a0b; color: #ffffff; margin: 0; padding: 0; line-height: 1.6; }
      .wrapper { background-color: #0a0a0b; padding: 40px 20px; }
      .container { max-width: 600px; margin: 0 auto; }
      .header { text-align: center; padding: 32px 0; }
      .logo { color: #FBBF24; font-size: 28px; font-weight: bold; letter-spacing: -0.5px; }
      .logo-subtitle { color: #64748b; font-size: 12px; margin-top: 4px; }
      .card { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; padding: 40px 32px; margin-bottom: 24px; }
      .emoji { font-size: 56px; margin-bottom: 20px; display: block; text-align: center; }
      .title { color: #ffffff; font-size: 24px; font-weight: 600; margin: 0 0 8px 0; text-align: center; }
      .subtitle { color: #94a3b8; font-size: 16px; text-align: center; margin: 0 0 24px 0; }
      .amount-box { background: rgba(251, 191, 36, 0.1); border: 1px solid rgba(251, 191, 36, 0.3); border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0; }
      .amount { color: #FBBF24; font-size: 42px; font-weight: 700; margin: 0; }
      .amount-label { color: #94a3b8; font-size: 14px; margin-top: 4px; }
      .message { color: #cbd5e1; font-size: 15px; line-height: 1.7; margin: 20px 0; }
      .quote { font-style: italic; color: #94a3b8; padding: 16px 20px; background: rgba(255,255,255,0.03); border-left: 3px solid #FBBF24; border-radius: 0 8px 8px 0; margin: 20px 0; }
      .button { display: inline-block; background: #FBBF24; color: #0a0a0b !important; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; margin-top: 24px; }
      .button:hover { background: #f59e0b; }
      .button-container { text-align: center; }
      .info-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.08); }
      .info-label { color: #64748b; font-size: 14px; }
      .info-value { color: #ffffff; font-size: 14px; font-weight: 500; }
      .footer { text-align: center; padding: 32px 20px; color: #64748b; font-size: 12px; }
      .footer-links { margin-bottom: 16px; }
      .footer-links a { color: #94a3b8; text-decoration: none; margin: 0 12px; }
      .footer-links a:hover { color: #FBBF24; }
      .divider { height: 1px; background: rgba(255,255,255,0.1); margin: 24px 0; }
      .status-badge { display: inline-block; padding: 6px 12px; border-radius: 20px; font-size: 13px; font-weight: 500; }
      .status-processing { background: rgba(59, 130, 246, 0.2); color: #60a5fa; }
      .status-completed { background: rgba(34, 197, 94, 0.2); color: #4ade80; }
      .status-rejected { background: rgba(239, 68, 68, 0.2); color: #f87171; }
      .unsubscribe { color: #475569; font-size: 11px; margin-top: 16px; }
      .unsubscribe a { color: #64748b; }
    </style>
  `;

  const footerHtml = `
    <div class="footer">
      <div class="footer-links">
        <a href="https://tipkoro.com">Home</a>
        <a href="https://tipkoro.com/explore">Explore</a>
        <a href="https://tipkoro.com/dashboard">Dashboard</a>
      </div>
      <p>© ${new Date().getFullYear()} TipKoro. Support creators you love.</p>
      <p class="unsubscribe">
        You're receiving this because you have an account on TipKoro.<br>
        <a href="https://tipkoro.com/settings?tab=notifications">Manage notification preferences</a>
      </p>
    </div>
  `;

  switch (type) {
    case 'tip_received':
      return {
        subject: `💰 You received ৳${data.amount} on TipKoro!`,
        html: `
          <!DOCTYPE html>
          <html>
          <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">${baseStyle}</head>
          <body>
            <div class="wrapper">
              <div class="container">
                <div class="header">
                  <div class="logo">TipKoro</div>
                  <div class="logo-subtitle">Creator Support Platform</div>
                </div>
                <div class="card">
                  <span class="emoji">💰</span>
                  <h1 class="title">You received a tip!</h1>
                  <p class="subtitle">Someone just showed their appreciation for your work</p>
                  
                  <div class="amount-box">
                    <p class="amount">৳${data.amount}</p>
                    <p class="amount-label">Received from ${data.supporter_name === 'Anonymous' ? 'an anonymous supporter' : data.supporter_name}</p>
                  </div>
                  
                  ${data.message ? `
                    <div class="quote">"${data.message}"</div>
                  ` : ''}
                  
                  <div class="button-container">
                    <a href="https://tipkoro.com/dashboard" class="button">View Your Dashboard</a>
                  </div>
                </div>
                ${footerHtml}
              </div>
            </div>
          </body>
          </html>
        `
      };

    case 'tip_sent':
      return {
        subject: `❤️ Your tip of ৳${data.amount} was sent successfully!`,
        html: `
          <!DOCTYPE html>
          <html>
          <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">${baseStyle}</head>
          <body>
            <div class="wrapper">
              <div class="container">
                <div class="header">
                  <div class="logo">TipKoro</div>
                  <div class="logo-subtitle">Creator Support Platform</div>
                </div>
                <div class="card">
                  <span class="emoji">❤️</span>
                  <h1 class="title">Thank you for your support!</h1>
                  <p class="subtitle">Your generosity helps creators keep doing what they love</p>
                  
                  <div class="amount-box">
                    <p class="amount">৳${data.amount}</p>
                    <p class="amount-label">Sent to ${data.creator_name || 'a creator'}</p>
                  </div>
                  
                  ${data.message ? `
                    <div class="quote">Your message: "${data.message}"</div>
                  ` : ''}
                  
                  <p class="message" style="text-align: center;">
                    You're making a difference! Your support directly helps creators continue their amazing work.
                  </p>
                  
                  <div class="button-container">
                    <a href="https://tipkoro.com/explore" class="button">Discover More Creators</a>
                  </div>
                </div>
                ${footerHtml}
              </div>
            </div>
          </body>
          </html>
        `
      };

    case 'withdrawal_submitted':
      return {
        subject: `📤 Withdrawal Request Received - ৳${data.amount}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">${baseStyle}</head>
          <body>
            <div class="wrapper">
              <div class="container">
                <div class="header">
                  <div class="logo">TipKoro</div>
                  <div class="logo-subtitle">Creator Support Platform</div>
                </div>
                <div class="card">
                  <span class="emoji">📤</span>
                  <h1 class="title">Withdrawal Request Submitted</h1>
                  <p class="subtitle">We've received your withdrawal request</p>
                  
                  <div class="amount-box">
                    <p class="amount">৳${data.amount}</p>
                    <p class="amount-label">Pending Review</p>
                  </div>
                  
                  <div class="divider"></div>
                  
                  <p class="message">
                    Your withdrawal request has been submitted and is now under review. We'll process it within <strong>3-5 business days</strong> and notify you once it's completed.
                  </p>
                  
                  <p class="message" style="font-size: 13px; color: #64748b;">
                    Transaction Reference: ${new Date().toISOString().split('T')[0]}-${Math.random().toString(36).substring(2, 8).toUpperCase()}
                  </p>
                  
                  <div class="button-container">
                    <a href="https://tipkoro.com/finance" class="button">View Finance</a>
                  </div>
                </div>
                ${footerHtml}
              </div>
            </div>
          </body>
          </html>
        `
      };

    case 'withdrawal_processing':
      return {
        subject: `⏳ Withdrawal Processing - ৳${data.amount}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">${baseStyle}</head>
          <body>
            <div class="wrapper">
              <div class="container">
                <div class="header">
                  <div class="logo">TipKoro</div>
                  <div class="logo-subtitle">Creator Support Platform</div>
                </div>
                <div class="card">
                  <span class="emoji">⏳</span>
                  <h1 class="title">Withdrawal Being Processed</h1>
                  <p class="subtitle">Good news! Your withdrawal has been approved</p>
                  
                  <div class="amount-box">
                    <p class="amount">৳${data.amount}</p>
                    <span class="status-badge status-processing">Processing</span>
                  </div>
                  
                  <div class="divider"></div>
                  
                  <p class="message">
                    Your withdrawal has been approved and is now being processed. The funds will be sent to your registered payment method within <strong>1-2 business days</strong>.
                  </p>
                  
                  <p class="message" style="font-size: 13px; color: #64748b;">
                    We'll send you another email once the transfer is complete.
                  </p>
                  
                  <div class="button-container">
                    <a href="https://tipkoro.com/finance" class="button">View Finance</a>
                  </div>
                </div>
                ${footerHtml}
              </div>
            </div>
          </body>
          </html>
        `
      };

    case 'withdrawal_completed':
      return {
        subject: `🎉 Withdrawal Complete! ৳${data.amount} Sent`,
        html: `
          <!DOCTYPE html>
          <html>
          <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">${baseStyle}</head>
          <body>
            <div class="wrapper">
              <div class="container">
                <div class="header">
                  <div class="logo">TipKoro</div>
                  <div class="logo-subtitle">Creator Support Platform</div>
                </div>
                <div class="card">
                  <span class="emoji">🎉</span>
                  <h1 class="title">Withdrawal Complete!</h1>
                  <p class="subtitle">Your funds have been sent successfully</p>
                  
                  <div class="amount-box">
                    <p class="amount">৳${data.amount}</p>
                    <span class="status-badge status-completed">Completed</span>
                  </div>
                  
                  <div class="divider"></div>
                  
                  <p class="message">
                    Great news! Your withdrawal has been completed and the funds have been sent to your registered payment method. Please allow up to 24 hours for the amount to reflect in your account.
                  </p>
                  
                  <p class="message" style="font-size: 13px; color: #64748b;">
                    If you don't see the funds within 24 hours, please contact our support team.
                  </p>
                  
                  <div class="button-container">
                    <a href="https://tipkoro.com/finance" class="button">View Finance</a>
                  </div>
                </div>
                ${footerHtml}
              </div>
            </div>
          </body>
          </html>
        `
      };

    case 'withdrawal_rejected':
      return {
        subject: `❌ Withdrawal Request Rejected - ৳${data.amount}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">${baseStyle}</head>
          <body>
            <div class="wrapper">
              <div class="container">
                <div class="header">
                  <div class="logo">TipKoro</div>
                  <div class="logo-subtitle">Creator Support Platform</div>
                </div>
                <div class="card">
                  <span class="emoji">❌</span>
                  <h1 class="title">Withdrawal Rejected</h1>
                  <p class="subtitle">We couldn't process your withdrawal request</p>
                  
                  <div class="amount-box">
                    <p class="amount">৳${data.amount}</p>
                    <span class="status-badge status-rejected">Rejected</span>
                  </div>
                  
                  <div class="divider"></div>
                  
                  ${data.reason ? `
                    <div class="quote">
                      <strong>Reason:</strong> ${data.reason}
                    </div>
                  ` : ''}
                  
                  <p class="message">
                    Unfortunately, your withdrawal request has been rejected. The amount has been returned to your available balance. You can submit a new withdrawal request after addressing the issue above.
                  </p>
                  
                  <p class="message" style="font-size: 13px; color: #64748b;">
                    If you believe this is an error or need assistance, please contact our support team.
                  </p>
                  
                  <div class="button-container">
                    <a href="https://tipkoro.com/finance" class="button">View Finance</a>
                  </div>
                </div>
                ${footerHtml}
              </div>
            </div>
          </body>
          </html>
        `
      };

    default:
      return {
        subject: '🔔 TipKoro Notification',
        html: `
          <!DOCTYPE html>
          <html>
          <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">${baseStyle}</head>
          <body>
            <div class="wrapper">
              <div class="container">
                <div class="header">
                  <div class="logo">TipKoro</div>
                  <div class="logo-subtitle">Creator Support Platform</div>
                </div>
                <div class="card">
                  <span class="emoji">🔔</span>
                  <h1 class="title">You have a notification</h1>
                  <p class="subtitle">Check your dashboard for more details</p>
                  
                  <div class="button-container">
                    <a href="https://tipkoro.com/dashboard" class="button">Visit Dashboard</a>
                  </div>
                </div>
                ${footerHtml}
              </div>
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

    const { profile_id, email: directEmail, type, data }: EmailNotificationRequest = await req.json();

    if (!type || (!profile_id && !directEmail)) {
      return new Response(
        JSON.stringify({ error: "Missing profile_id/email or type" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let recipientEmail = directEmail;
    let profileData: { email: string; first_name: string | null; last_name: string | null } | null = null;

    // If profile_id provided, fetch profile data
    if (profile_id) {
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

      recipientEmail = profile.email;
      profileData = profile;

      // Check notification settings only for registered users
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

      // Create in-app notification for registered users
      const notificationTitle = type === 'tip_received' 
        ? `You received ৳${data?.amount}!`
        : type === 'tip_sent'
          ? `Your tip was sent!`
          : type === 'withdrawal_submitted'
            ? 'Withdrawal submitted'
            : type === 'withdrawal_processing'
              ? 'Withdrawal processing'
              : type === 'withdrawal_completed'
                ? 'Withdrawal complete!'
                : type === 'withdrawal_rejected'
                  ? 'Withdrawal rejected'
                  : 'Notification';

      await supabase.from('notifications').insert({
        profile_id,
        type,
        title: notificationTitle,
        message: `${data?.amount ? `৳${data.amount}` : ''} ${data?.supporter_name || data?.creator_name || ''}`.trim() || notificationTitle,
        data: data || {},
        is_read: false,
      });
    }

    if (!recipientEmail) {
      return new Response(
        JSON.stringify({ error: "No email address found" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get email content
    const { subject, html } = getEmailContent(type, data);

    // Send email via Resend REST API
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: getSenderEmail(type),
        to: [recipientEmail],
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

    console.log(`Email sent successfully to ${recipientEmail} for type: ${type}`);

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
