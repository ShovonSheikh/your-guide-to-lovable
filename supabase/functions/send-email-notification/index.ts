import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailNotificationRequest {
  profile_id?: string;
  email?: string; // Direct email for non-registered supporters
  type: 'tip_received' | 'tip_sent' | 'withdrawal_submitted' | 'withdrawal_processing' | 'withdrawal_completed' | 'withdrawal_rejected' | 'promotion' | 'welcome_creator' | 'welcome_user' | 'weekly_summary' | 'withdrawal_otp' | 'verification_approved' | 'verification_rejected';
  data?: {
    amount?: number;
    supporter_name?: string;
    creator_name?: string;
    message?: string;
    reason?: string;
    tip_id?: string;
    url?: string;
    // Welcome email data
    username?: string;
    // Weekly summary data
    week_tips_count?: number;
    week_earnings?: number;
    new_supporters?: number;
    previous_week_earnings?: number;
    top_supporters?: Array<{ name: string; amount: number }>;
    // OTP data
    otp_code?: string;
    withdrawal_amount?: number;
    first_name?: string;
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
    case 'withdrawal_otp':
      return 'TipKoro Finance <finance@tipkoro.com>';
    case 'promotion':
    case 'weekly_summary':
      return 'TipKoro <hello@tipkoro.com>';
    case 'welcome_creator':
    case 'welcome_user':
    case 'verification_approved':
    case 'verification_rejected':
      return 'TipKoro Team <welcome@tipkoro.com>';
    default:
      return 'TipKoro Support <support@tipkoro.com>';
  }
}

// Warm-themed email templates matching TipKoro website
function getEmailContent(type: string, data: EmailNotificationRequest['data'] = {}): { subject: string; html: string } {
  // Email-safe font stacks with proper fallbacks
  const fontSans = "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
  const fontDisplay = "'Bricolage Grotesque', Georgia, 'Times New Roman', serif";

  const baseStyle = `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Bricolage+Grotesque:wght@600;700&display=swap');
    </style>
    <style>
      /* Reset styles for email clients */
      body, table, td, p, a, li, blockquote { 
        -webkit-text-size-adjust: 100%; 
        -ms-text-size-adjust: 100%; 
      }
      table, td { 
        mso-table-lspace: 0pt; 
        mso-table-rspace: 0pt; 
      }
      img { 
        -ms-interpolation-mode: bicubic; 
        border: 0; 
        height: auto; 
        line-height: 100%; 
        outline: none; 
        text-decoration: none; 
      }
      
      body { 
        font-family: ${fontSans}; 
        background-color: #F5F1E8; 
        color: #1F1C18; 
        margin: 0; 
        padding: 0; 
        line-height: 1.65; 
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }
      .wrapper { 
        background-color: #F5F1E8; 
        padding: 48px 20px; 
      }
      .container { 
        max-width: 560px; 
        margin: 0 auto; 
      }
      .header { 
        text-align: center; 
        padding: 24px 0 36px 0; 
      }
      .logo-row {
        display: inline-block;
        text-align: center;
      }
      .logo-heart {
        font-size: 26px;
        vertical-align: middle;
        margin-right: 6px;
      }
      .logo { 
        color: #1F1C18; 
        font-family: ${fontDisplay}; 
        font-size: 28px; 
        font-weight: 700; 
        letter-spacing: -0.5px;
        vertical-align: middle;
      }
      .logo-subtitle { 
        color: #7A7469; 
        font-size: 13px; 
        margin-top: 8px;
        letter-spacing: 0.3px;
      }
      .card { 
        background: #FEFDFB; 
        border: 1px solid #E5E0D5; 
        border-radius: 20px; 
        padding: 44px 36px; 
        margin-bottom: 24px; 
        box-shadow: 0 4px 32px -8px rgba(31, 28, 24, 0.08);
      }
      .emoji-icon {
        display: block;
        width: 76px;
        height: 76px;
        margin: 0 auto 24px auto;
        background: #FEF7E0;
        border-radius: 50%;
        text-align: center;
        line-height: 76px;
        font-size: 34px;
        box-shadow: 0 4px 16px -4px rgba(249, 194, 60, 0.2);
      }
      .emoji-icon.success { 
        background: #D9F7E4; 
        box-shadow: 0 4px 16px -4px rgba(34, 197, 94, 0.15);
      }
      .emoji-icon.error { 
        background: #FEE6E6; 
        box-shadow: 0 4px 16px -4px rgba(239, 68, 68, 0.15);
      }
      .emoji-icon.info { 
        background: #E3F4FD; 
        box-shadow: 0 4px 16px -4px rgba(59, 130, 246, 0.15);
      }
      .title { 
        color: #1F1C18; 
        font-family: ${fontDisplay}; 
        font-size: 26px; 
        font-weight: 700; 
        margin: 0 0 10px 0; 
        text-align: center;
        letter-spacing: -0.3px;
      }
      .subtitle { 
        color: #7A7469; 
        font-size: 15px; 
        text-align: center; 
        margin: 0 0 28px 0;
        line-height: 1.5;
      }
      .amount-box { 
        background: #FEF7E0; 
        border: 1px solid #F5E6B8; 
        border-radius: 16px; 
        padding: 32px 28px; 
        text-align: center; 
        margin: 28px 0; 
      }
      .amount { 
        color: #1F1C18; 
        font-family: ${fontDisplay}; 
        font-size: 48px; 
        font-weight: 700; 
        margin: 0;
        letter-spacing: -1px;
      }
      .amount-label { 
        color: #7A7469; 
        font-size: 14px; 
        margin-top: 8px;
        font-weight: 500;
      }
      .message { 
        color: #4A453D; 
        font-size: 15px; 
        line-height: 1.75; 
        margin: 24px 0; 
      }
      .quote { 
        font-style: italic; 
        color: #1F1C18; 
        padding: 20px 24px; 
        background: #F0EBE0; 
        border-left: 4px solid #F9C23C; 
        border-radius: 0 12px 12px 0; 
        margin: 28px 0; 
        font-size: 15px;
        line-height: 1.7;
      }
      .button { 
        display: inline-block; 
        background: #1F1C18; 
        color: #FFFFFF !important; 
        padding: 16px 40px; 
        border-radius: 12px; 
        text-decoration: none; 
        font-weight: 600; 
        font-size: 15px; 
        margin-top: 28px; 
        box-shadow: 0 4px 16px -4px rgba(31, 28, 24, 0.25);
        letter-spacing: 0.2px;
      }
      .button:hover { background: #2D2A25; }
      .button-container { text-align: center; }
      .info-row { 
        display: flex; 
        justify-content: space-between; 
        padding: 16px 0; 
        border-bottom: 1px solid #E5E0D5; 
      }
      .info-label { color: #7A7469; font-size: 14px; }
      .info-value { color: #1F1C18; font-size: 14px; font-weight: 600; }
      .divider { 
        height: 1px; 
        background: #E5E0D5; 
        margin: 32px 0; 
      }
      .status-badge { 
        display: inline-block; 
        padding: 8px 16px; 
        border-radius: 24px; 
        font-size: 13px; 
        font-weight: 600; 
        margin-top: 10px;
        letter-spacing: 0.2px;
      }
      .status-pending { background: #FEF3C7; color: #92400E; }
      .status-processing { background: #DBEAFE; color: #1E40AF; }
      .status-completed { background: #DCFCE7; color: #166534; }
      .status-rejected { background: #FEE2E2; color: #991B1B; }
      .footer { 
        background: #1F1C18; 
        border-radius: 20px; 
        text-align: center; 
        padding: 36px 28px; 
        color: #A8A29E; 
        font-size: 13px; 
      }
      .footer-links { margin-bottom: 20px; }
      .footer-links a { 
        color: #D6D3D1; 
        text-decoration: none; 
        margin: 0 16px; 
        font-weight: 500;
        letter-spacing: 0.2px;
      }
      .footer-links a:hover { color: #F9C23C; }
      .footer p { margin: 10px 0; color: #78716C; }
      .footer-brand {
        font-family: ${fontDisplay};
        font-size: 20px;
        font-weight: 700;
        color: #F9C23C;
        margin-bottom: 18px;
        letter-spacing: -0.3px;
      }
      .payment-badges {
        margin-top: 18px;
        color: #78716C;
        font-size: 11px;
        letter-spacing: 0.5px;
      }
      .unsubscribe { 
        color: #57534E; 
        font-size: 11px; 
        margin-top: 24px; 
        padding-top: 20px;
        border-top: 1px solid rgba(255,255,255,0.08);
      }
      .unsubscribe a { color: #A8A29E; text-decoration: underline; }
      .highlight { color: #D97706; font-weight: 600; }
      .ref-code { 
        color: #7A7469; 
        font-size: 12px; 
        font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Mono', 'Droid Sans Mono', monospace;
        background: #EBE6DA;
        padding: 6px 12px;
        border-radius: 8px;
        display: inline-block;
        margin-top: 10px;
        letter-spacing: 0.5px;
      }
    </style>
  `;

  const footerHtml = `
    <div class="footer">
      <div class="footer-brand">💛 TipKoro</div>
      <div class="footer-links">
        <a href="https://tipkoro.com">Home</a>
        <a href="https://tipkoro.com/explore">Explore</a>
        <a href="https://tipkoro.com/dashboard">Dashboard</a>
      </div>
      <p>© ${new Date().getFullYear()} TipKoro. Support creators you love.</p>
      <div class="payment-badges">
        Powered by bKash • Nagad • Rocket
      </div>
      <p class="unsubscribe">
        You're receiving this because you have an account on TipKoro.<br>
        <a href="https://tipkoro.com/settings">Manage preferences</a>
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
                  <div class="logo-row">
                    <span class="logo-heart">💛</span>
                    <span class="logo">TipKoro</span>
                  </div>
                  <div class="logo-subtitle">Creator Support Platform</div>
                </div>
                <div class="card">
                  <div class="emoji-icon">💰</div>
                  <h1 class="title">You received a tip!</h1>
                  <p class="subtitle">Someone just showed their appreciation for your work</p>
                  
                  <div class="amount-box">
                    <p class="amount">৳${data.amount}</p>
                    <p class="amount-label">from ${data.supporter_name === 'Anonymous' ? 'an anonymous supporter' : data.supporter_name}</p>
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
                  <div class="logo-row">
                    <span class="logo-heart">💛</span>
                    <span class="logo">TipKoro</span>
                  </div>
                  <div class="logo-subtitle">Creator Support Platform</div>
                </div>
                <div class="card">
                  <div class="emoji-icon" style="background: #FEE2E2;">❤️</div>
                  <h1 class="title">Thank you for your support!</h1>
                  <p class="subtitle">Your generosity helps creators keep doing what they love</p>
                  
                  <div class="amount-box">
                    <p class="amount">৳${data.amount}</p>
                    <p class="amount-label">sent to ${data.creator_name || 'a creator'}</p>
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
                  <div class="logo-row">
                    <span class="logo-heart">💛</span>
                    <span class="logo">TipKoro</span>
                  </div>
                  <div class="logo-subtitle">Creator Support Platform</div>
                </div>
                <div class="card">
                  <div class="emoji-icon">📤</div>
                  <h1 class="title">Withdrawal Request Submitted</h1>
                  <p class="subtitle">We've received your withdrawal request</p>
                  
                  <div class="amount-box">
                    <p class="amount">৳${data.amount}</p>
                    <span class="status-badge status-pending">Pending Review</span>
                  </div>
                  
                  <div class="divider"></div>
                  
                  <p class="message">
                    Your withdrawal request has been submitted and is now under review. We'll process it within <span class="highlight">3-5 business days</span> and notify you once it's completed.
                  </p>
                  
                  <p style="text-align: center;">
                    <span class="ref-code">Ref: ${new Date().toISOString().split('T')[0]}-${Math.random().toString(36).substring(2, 8).toUpperCase()}</span>
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
                  <div class="logo-row">
                    <span class="logo-heart">💛</span>
                    <span class="logo">TipKoro</span>
                  </div>
                  <div class="logo-subtitle">Creator Support Platform</div>
                </div>
                <div class="card">
                  <div class="emoji-icon info">⏳</div>
                  <h1 class="title">Withdrawal Being Processed</h1>
                  <p class="subtitle">Good news! Your withdrawal has been approved</p>
                  
                  <div class="amount-box">
                    <p class="amount">৳${data.amount}</p>
                    <span class="status-badge status-processing">Processing</span>
                  </div>
                  
                  <div class="divider"></div>
                  
                  <p class="message">
                    Your withdrawal has been approved and is now being processed. The funds will be sent to your registered payment method within <span class="highlight">1-2 business days</span>.
                  </p>
                  
                  <p class="message" style="font-size: 13px; color: #7A7469; text-align: center;">
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
                  <div class="logo-row">
                    <span class="logo-heart">💛</span>
                    <span class="logo">TipKoro</span>
                  </div>
                  <div class="logo-subtitle">Creator Support Platform</div>
                </div>
                <div class="card">
                  <div class="emoji-icon success">🎉</div>
                  <h1 class="title">Withdrawal Complete!</h1>
                  <p class="subtitle">Your funds have been sent successfully</p>
                  
                  <div class="amount-box">
                    <p class="amount">৳${data.amount}</p>
                    <span class="status-badge status-completed">Completed</span>
                  </div>
                  
                  <div class="divider"></div>
                  
                  <p class="message">
                    Great news! Your withdrawal has been completed and the funds have been sent to your registered payment method. Please allow up to <span class="highlight">24 hours</span> for the amount to reflect in your account.
                  </p>
                  
                  <p class="message" style="font-size: 13px; color: #7A7469; text-align: center;">
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
                  <div class="logo-row">
                    <span class="logo-heart">💛</span>
                    <span class="logo">TipKoro</span>
                  </div>
                  <div class="logo-subtitle">Creator Support Platform</div>
                </div>
                <div class="card">
                  <div class="emoji-icon error">❌</div>
                  <h1 class="title">Withdrawal Rejected</h1>
                  <p class="subtitle">We couldn't process your withdrawal request</p>
                  
                  <div class="amount-box" style="background: #FEF2F2; border-color: rgba(239, 68, 68, 0.2);">
                    <p class="amount">৳${data.amount}</p>
                    <span class="status-badge status-rejected">Rejected</span>
                  </div>
                  
                  <div class="divider"></div>
                  
                  ${data.reason ? `
                    <div class="quote" style="background: #FEF2F2; border-left-color: #EF4444;">
                      <strong>Reason:</strong> ${data.reason}
                    </div>
                  ` : ''}
                  
                  <p class="message">
                    Unfortunately, your withdrawal request has been rejected. The amount has been returned to your available balance. You can submit a new withdrawal request after addressing the issue above.
                  </p>
                  
                  <p class="message" style="font-size: 13px; color: #7A7469; text-align: center;">
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

    case 'welcome_creator':
      return {
        subject: `🎉 Welcome to TipKoro, ${data.creator_name || 'Creator'}!`,
        html: `
          <!DOCTYPE html>
          <html>
          <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">${baseStyle}</head>
          <body>
            <div class="wrapper">
              <div class="container">
                <div class="header">
                  <div class="logo-row">
                    <span class="logo-heart">💛</span>
                    <span class="logo">TipKoro</span>
                  </div>
                  <div class="logo-subtitle">Creator Support Platform</div>
                </div>
                <div class="card">
                  <div class="emoji-icon success">🎉</div>
                  <h1 class="title">Welcome to TipKoro!</h1>
                  <p class="subtitle">Your creator account is now active</p>
                  
                  ${data.username ? `
                    <div class="amount-box" style="background: #DCFCE7; border-color: rgba(22, 163, 74, 0.25);">
                      <p style="color: #166534; font-size: 14px; margin: 0 0 8px 0;">Your TipKoro Page</p>
                      <p class="amount" style="font-size: 28px;">tipkoro.com/${data.username}</p>
                    </div>
                  ` : ''}
                  
                  <div class="divider"></div>
                  
                  <p class="message" style="font-size: 16px; text-align: center; font-weight: 500;">
                    Here's how to get started:
                  </p>
                  
                  <div style="background: #F4F0E8; border-radius: 12px; padding: 20px; margin: 16px 0;">
                    <div style="display: flex; align-items: flex-start; gap: 12px; margin-bottom: 16px;">
                      <span style="background: #F9C23C; color: #1F1C18; width: 24px; height: 24px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: 600; font-size: 14px;">1</span>
                      <div>
                        <p style="margin: 0; font-weight: 600; color: #1F1C18;">Complete your profile</p>
                        <p style="margin: 4px 0 0 0; font-size: 14px; color: #7A7469;">Add a bio, profile picture, and social links</p>
                      </div>
                    </div>
                    <div style="display: flex; align-items: flex-start; gap: 12px; margin-bottom: 16px;">
                      <span style="background: #F9C23C; color: #1F1C18; width: 24px; height: 24px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: 600; font-size: 14px;">2</span>
                      <div>
                        <p style="margin: 0; font-weight: 600; color: #1F1C18;">Share your page</p>
                        <p style="margin: 4px 0 0 0; font-size: 14px; color: #7A7469;">Add your TipKoro link to your social media bios</p>
                      </div>
                    </div>
                    <div style="display: flex; align-items: flex-start; gap: 12px;">
                      <span style="background: #F9C23C; color: #1F1C18; width: 24px; height: 24px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: 600; font-size: 14px;">3</span>
                      <div>
                        <p style="margin: 0; font-weight: 600; color: #1F1C18;">Start receiving tips</p>
                        <p style="margin: 4px 0 0 0; font-size: 14px; color: #7A7469;">Your supporters can now tip you directly!</p>
                      </div>
                    </div>
                  </div>
                  
                  <div class="button-container">
                    <a href="https://tipkoro.com/dashboard" class="button">Go to Dashboard</a>
                  </div>
                </div>
                ${footerHtml}
              </div>
            </div>
          </body>
          </html>
        `
      };

    case 'welcome_user':
      return {
        subject: `👋 Welcome to TipKoro, ${data.first_name || 'there'}!`,
        html: `
          <!DOCTYPE html>
          <html>
          <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">${baseStyle}</head>
          <body>
            <div class="wrapper">
              <div class="container">
                <div class="header">
                  <div class="logo-row">
                    <span class="logo-heart">💛</span>
                    <span class="logo">TipKoro</span>
                  </div>
                  <div class="logo-subtitle">Creator Support Platform</div>
                </div>
                <div class="card">
                  <div class="emoji-icon">👋</div>
                  <h1 class="title">Welcome to TipKoro!</h1>
                  <p class="subtitle">Hi ${data.first_name || 'there'}, thanks for joining our community.</p>
                  
                  <p class="message" style="text-align: center; margin: 24px 0;">
                    TipKoro is Bangladesh's creator support platform where fans can directly support their favorite creators through bKash, Nagad, and Rocket.
                  </p>
                  
                  <div class="divider"></div>
                  
                  <p class="message" style="font-size: 16px; text-align: center; font-weight: 500;">
                    What would you like to do?
                  </p>
                  
                  <div style="display: flex; gap: 12px; margin: 20px 0;">
                    <div style="flex: 1; background: #F4F0E8; border-radius: 12px; padding: 20px; text-align: center;">
                      <span style="font-size: 32px; display: block; margin-bottom: 8px;">💛</span>
                      <p style="font-weight: 600; color: #1F1C18; margin: 0 0 4px 0;">Support Creators</p>
                      <p style="font-size: 13px; color: #7A7469; margin: 0;">Send tips to your favorite creators</p>
                    </div>
                    <div style="flex: 1; background: #F4F0E8; border-radius: 12px; padding: 20px; text-align: center;">
                      <span style="font-size: 32px; display: block; margin-bottom: 8px;">🎨</span>
                      <p style="font-weight: 600; color: #1F1C18; margin: 0 0 4px 0;">Become a Creator</p>
                      <p style="font-size: 13px; color: #7A7469; margin: 0;">Start receiving tips from fans</p>
                    </div>
                  </div>
                  
                  <div class="button-container">
                    <a href="https://tipkoro.com/explore" class="button">Explore Creators</a>
                  </div>
                </div>
                ${footerHtml}
              </div>
            </div>
          </body>
          </html>
        `
      };

    case 'weekly_summary':
      const earnings = data.week_earnings || 0;
      const prevEarnings = data.previous_week_earnings || 0;
      const changePercent = prevEarnings > 0 ? Math.round(((earnings - prevEarnings) / prevEarnings) * 100) : 0;
      const changeText = changePercent > 0 ? `+${changePercent}%` : changePercent < 0 ? `${changePercent}%` : 'same';
      const changeColor = changePercent > 0 ? '#16A34A' : changePercent < 0 ? '#DC2626' : '#7A7469';

      return {
        subject: `📊 Your Weekly TipKoro Summary${earnings > 0 ? ` - ৳${earnings} earned!` : ''}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">${baseStyle}</head>
          <body>
            <div class="wrapper">
              <div class="container">
                <div class="header">
                  <div class="logo-row">
                    <span class="logo-heart">💛</span>
                    <span class="logo">TipKoro</span>
                  </div>
                  <div class="logo-subtitle">Creator Support Platform</div>
                </div>
                <div class="card">
                  <div class="emoji-icon">📊</div>
                  <h1 class="title">Your Weekly Summary</h1>
                  <p class="subtitle">Here's how you did this week</p>
                  
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 24px 0;">
                    <div class="amount-box" style="padding: 20px;">
                      <p style="color: #7A7469; font-size: 13px; margin: 0 0 4px 0;">Earnings</p>
                      <p class="amount" style="font-size: 32px;">৳${earnings}</p>
                      ${prevEarnings > 0 ? `<p style="color: ${changeColor}; font-size: 13px; font-weight: 600; margin: 4px 0 0 0;">${changeText} vs last week</p>` : ''}
                    </div>
                    <div class="amount-box" style="padding: 20px;">
                      <p style="color: #7A7469; font-size: 13px; margin: 0 0 4px 0;">Tips Received</p>
                      <p class="amount" style="font-size: 32px;">${data.week_tips_count || 0}</p>
                    </div>
                  </div>
                  
                  ${(data.new_supporters && data.new_supporters > 0) ? `
                    <div style="background: #DCFCE7; border-radius: 12px; padding: 16px; text-align: center; margin: 16px 0;">
                      <span style="font-size: 24px;">🎊</span>
                      <p style="margin: 8px 0 0 0; color: #166534; font-weight: 600;">${data.new_supporters} new supporter${data.new_supporters > 1 ? 's' : ''} this week!</p>
                    </div>
                  ` : ''}
                  
                  ${(data.top_supporters && data.top_supporters.length > 0) ? `
                    <div class="divider"></div>
                    <h3 style="font-family: 'Bricolage Grotesque', Georgia, 'Times New Roman', serif; color: #1F1C18; font-size: 17px; font-weight: 700; margin: 0 0 14px 0; letter-spacing: -0.2px;">Top Supporters This Week</h3>
                    <div style="background: #F0EBE0; border-radius: 14px; padding: 18px;">
                      ${data.top_supporters.map((s, i) => `
                        <div style="display: flex; justify-content: space-between; padding: 10px 0; ${i < data.top_supporters!.length - 1 ? 'border-bottom: 1px solid #E5E0D5;' : ''}">
                          <span style="color: #1F1C18; font-weight: 500;">${i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'} ${s.name}</span>
                          <span style="color: #7A7469; font-weight: 600;">৳${s.amount}</span>
                        </div>
                      `).join('')}
                    </div>
                  ` : ''}
                  
                  ${earnings === 0 ? `
                    <div class="divider"></div>
                    <p class="message" style="text-align: center;">
                      No tips this week? Don't worry! Try sharing your TipKoro page on social media to reach more supporters.
                    </p>
                  ` : ''}
                  
                  <div class="button-container">
                    <a href="https://tipkoro.com/dashboard" class="button">View Full Dashboard</a>
                  </div>
                </div>
                ${footerHtml}
              </div>
            </div>
          </body>
          </html>
        `
      };

    case 'verification_approved':
      return {
        subject: `✅ Congratulations! Your Account is Verified`,
        html: `
          <!DOCTYPE html>
          <html>
          <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">${baseStyle}</head>
          <body>
            <div class="wrapper">
              <div class="container">
                <div class="header">
                  <div class="logo-row">
                    <span class="logo-heart">💛</span>
                    <span class="logo">TipKoro</span>
                  </div>
                  <div class="logo-subtitle">Creator Support Platform</div>
                </div>
                <div class="card">
                  <div class="emoji-icon success">✅</div>
                  <h1 class="title">You're Verified!</h1>
                  <p class="subtitle">Congratulations ${data.creator_name || 'Creator'}, your account has been verified.</p>
                  
                  <div style="background: #DCFCE7; border-radius: 16px; padding: 24px; text-align: center; margin: 28px 0;">
                    <p style="font-size: 18px; font-weight: 600; color: #166534; margin: 0;">Your profile now displays the verified badge ✓</p>
                  </div>
                  
                  <p class="message" style="text-align: center;">
                    This badge builds trust with your supporters and shows them you're a genuine creator.
                  </p>
                  
                  <div class="button-container">
                    <a href="https://tipkoro.com/${data.username || 'dashboard'}" class="button">View Your Profile</a>
                  </div>
                </div>
                ${footerHtml}
              </div>
            </div>
          </body>
          </html>
        `
      };

    case 'verification_rejected':
      return {
        subject: `❌ Verification Request Declined`,
        html: `
          <!DOCTYPE html>
          <html>
          <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">${baseStyle}</head>
          <body>
            <div class="wrapper">
              <div class="container">
                <div class="header">
                  <div class="logo-row">
                    <span class="logo-heart">💛</span>
                    <span class="logo">TipKoro</span>
                  </div>
                  <div class="logo-subtitle">Creator Support Platform</div>
                </div>
                <div class="card">
                  <div class="emoji-icon error">❌</div>
                  <h1 class="title">Verification Declined</h1>
                  <p class="subtitle">Hi ${data.creator_name || 'Creator'}, unfortunately we couldn't verify your account at this time.</p>
                  
                  ${data.reason ? `
                    <div class="quote" style="background: #FEF2F2; border-left-color: #EF4444;">
                      <strong>Reason:</strong> ${data.reason}
                    </div>
                  ` : ''}
                  
                  <p class="message" style="text-align: center;">
                    You can submit a new verification request with updated documents from your settings page.
                  </p>
                  
                  <div class="button-container">
                    <a href="https://tipkoro.com/settings?tab=verification" class="button">Try Again</a>
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
                  <div class="logo-row">
                    <span class="logo-heart">💛</span>
                    <span class="logo">TipKoro</span>
                  </div>
                  <div class="logo-subtitle">Creator Support Platform</div>
                </div>
                <div class="card">
                  <div class="emoji-icon">🔔</div>
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

    const requestBody = await req.json();
    const { profile_id, email: directEmail, type, data }: EmailNotificationRequest = requestBody;

    console.log(`[EMAIL] Received request - type: ${type}, profile_id: ${profile_id}, email: ${directEmail}`);
    console.log(`[EMAIL] Request data:`, JSON.stringify(data));

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

    // Try to fetch custom template from database
    let subject: string;
    let html: string;
    
    const { data: customTemplate } = await supabase
      .from('platform_config')
      .select('value')
      .eq('key', `email_template_${type}`)
      .maybeSingle();

    if (customTemplate?.value && typeof customTemplate.value === 'object') {
      const template = customTemplate.value as { subject?: string; html?: string };
      if (template.subject && template.html) {
        // Use custom template with variable replacement
        subject = template.subject;
        html = template.html;
        
        // Replace all {{variable}} placeholders with actual data
        const replacements: Record<string, string> = {
          amount: String(data?.amount || ''),
          supporter_name: data?.supporter_name || '',
          creator_name: data?.creator_name || '',
          message: data?.message || '',
          reason: data?.reason || '',
          username: data?.username || '',
          first_name: data?.first_name || '',
          week_tips_count: String(data?.week_tips_count || ''),
          week_earnings: String(data?.week_earnings || ''),
          new_supporters: String(data?.new_supporters || ''),
          previous_week_earnings: String(data?.previous_week_earnings || ''),
          otp_code: data?.otp_code || '',
          withdrawal_amount: String(data?.withdrawal_amount || ''),
        };
        
        for (const [key, value] of Object.entries(replacements)) {
          const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
          subject = subject.replace(regex, value);
          html = html.replace(regex, value);
        }
        
        // Handle simple {{#if var}}...{{/if}} blocks
        const ifRegex = /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g;
        html = html.replace(ifRegex, (_, varName, content) => {
          return replacements[varName] ? content : '';
        });
        
        console.log(`[EMAIL] Using custom template for ${type}`);
      } else {
        // Fall back to default template
        const defaultContent = getEmailContent(type, data);
        subject = defaultContent.subject;
        html = defaultContent.html;
      }
    } else {
      // Fall back to default template
      const defaultContent = getEmailContent(type, data);
      subject = defaultContent.subject;
      html = defaultContent.html;
    }

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
