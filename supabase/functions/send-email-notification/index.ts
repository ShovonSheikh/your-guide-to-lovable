import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailNotificationRequest {
  profile_id?: string;
  email?: string; // Direct email for non-registered supporters
  type: 'tip_received' | 'tip_sent' | 'withdrawal_submitted' | 'withdrawal_processing' | 'withdrawal_completed' | 'withdrawal_rejected' | 'promotion' | 'welcome_creator' | 'welcome_user' | 'weekly_summary' | 'withdrawal_otp' | 'verification_approved' | 'verification_rejected' | 'goal_milestone_50' | 'goal_milestone_75' | 'goal_milestone_100';
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
    // Goal milestone data
    goal_title?: string;
    milestone?: number;
    current_amount?: number;
    target_amount?: number;
    percentage?: number;
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
    case 'goal_milestone_50':
    case 'goal_milestone_75':
    case 'goal_milestone_100':
      return 'TipKoro Notifications <notifications@tipkoro.com>';
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
      .header { 
        text-align: center; 
        padding: 24px 0 36px 0; 
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
      }
      .emoji-icon.success { 
        background: #D9F7E4; 
      }
      .emoji-icon.error { 
        background: #FEE6E6; 
      }
      .emoji-icon.info { 
        background: #E3F4FD; 
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
        letter-spacing: 0.2px;
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

  // Table-based wrapper for proper email client centering
  const wrapperStart = `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #F5F1E8;">
      <tr>
        <td align="center" style="padding: 48px 20px;">
          <table width="560" cellpadding="0" cellspacing="0" border="0" style="max-width: 560px; width: 100%;">
            <tr>
              <td>
  `;

  const wrapperEnd = `
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;

  const headerHtml = `
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td align="center" style="padding: 24px 0 36px 0;">
          <span style="font-size: 26px; vertical-align: middle; margin-right: 6px;">💛</span>
          <span style="color: #1F1C18; font-family: ${fontDisplay}; font-size: 28px; font-weight: 700; letter-spacing: -0.5px; vertical-align: middle;">TipKoro</span>
          <div style="color: #7A7469; font-size: 13px; margin-top: 8px; letter-spacing: 0.3px;">Creator Support Platform</div>
        </td>
      </tr>
    </table>
  `;

  const cardStart = `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: #FEFDFB; border: 1px solid #E5E0D5; border-radius: 20px; margin-bottom: 24px;">
      <tr>
        <td style="padding: 44px 36px;">
  `;

  const cardEnd = `
        </td>
      </tr>
    </table>
  `;

  const footerHtml = `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: #1F1C18; border-radius: 20px;">
      <tr>
        <td align="center" style="padding: 36px 28px;">
          <div style="font-family: ${fontDisplay}; font-size: 20px; font-weight: 700; color: #F9C23C; margin-bottom: 18px; letter-spacing: -0.3px;">💛 TipKoro</div>
          <div style="margin-bottom: 20px;">
            <a href="https://tipkoro.com" style="color: #D6D3D1; text-decoration: none; margin: 0 16px; font-weight: 500; letter-spacing: 0.2px;">Home</a>
            <a href="https://tipkoro.com/explore" style="color: #D6D3D1; text-decoration: none; margin: 0 16px; font-weight: 500; letter-spacing: 0.2px;">Explore</a>
            <a href="https://tipkoro.com/dashboard" style="color: #D6D3D1; text-decoration: none; margin: 0 16px; font-weight: 500; letter-spacing: 0.2px;">Dashboard</a>
          </div>
          <p style="margin: 10px 0; color: #78716C; font-size: 13px;">© ${new Date().getFullYear()} TipKoro. Support creators you love.</p>
          <div style="margin-top: 18px; color: #78716C; font-size: 11px; letter-spacing: 0.5px;">
            Powered by bKash • Nagad • Rocket
          </div>
          <p style="color: #57534E; font-size: 11px; margin-top: 24px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.08);">
            You're receiving this because you have an account on TipKoro.<br>
            <a href="https://tipkoro.com/settings" style="color: #A8A29E; text-decoration: underline;">Manage preferences</a>
          </p>
        </td>
      </tr>
    </table>
  `;

  // Helper for amount box (table-based)
  const amountBox = (amount: string | number, label: string, badgeHtml?: string, customBg?: string) => `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: ${customBg || '#FEF7E0'}; border: 1px solid ${customBg ? 'rgba(239, 68, 68, 0.2)' : '#F5E6B8'}; border-radius: 16px; margin: 28px 0;">
      <tr>
        <td align="center" style="padding: 32px 28px;">
          <p style="color: #1F1C18; font-family: ${fontDisplay}; font-size: 48px; font-weight: 700; margin: 0; letter-spacing: -1px;">${amount}</p>
          <p style="color: #7A7469; font-size: 14px; margin-top: 8px; font-weight: 500;">${label}</p>
          ${badgeHtml || ''}
        </td>
      </tr>
    </table>
  `;

  // Helper for quote block (table-based)
  const quoteBlock = (text: string, isError?: boolean) => `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 28px 0;">
      <tr>
        <td style="font-style: italic; color: #1F1C18; padding: 20px 24px; background: ${isError ? '#FEF2F2' : '#F0EBE0'}; border-left: 4px solid ${isError ? '#EF4444' : '#F9C23C'}; border-radius: 0 12px 12px 0; font-size: 15px; line-height: 1.7;">
          ${text}
        </td>
      </tr>
    </table>
  `;

  // Helper for divider
  const divider = `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 32px 0;">
      <tr>
        <td style="height: 1px; background: #E5E0D5;"></td>
      </tr>
    </table>
  `;

  // Helper for centered button
  const buttonHtml = (text: string, url: string) => `
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td align="center" style="padding-top: 28px;">
          <a href="${url}" style="display: inline-block; background: #1F1C18; color: #FFFFFF; padding: 16px 40px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 15px; letter-spacing: 0.2px;">${text}</a>
        </td>
      </tr>
    </table>
  `;

  switch (type) {
    case 'tip_received':
      return {
        subject: `💰 You received ৳${data.amount} on TipKoro!`,
        html: `
          <!DOCTYPE html>
          <html>
          <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">${baseStyle}</head>
          <body style="margin: 0; padding: 0; background-color: #F5F1E8;">
            ${wrapperStart}
              ${headerHtml}
              ${cardStart}
                <div style="display: block; width: 76px; height: 76px; margin: 0 auto 24px auto; background: #FEF7E0; border-radius: 50%; text-align: center; line-height: 76px; font-size: 34px;">💰</div>
                <h1 style="color: #1F1C18; font-family: ${fontDisplay}; font-size: 26px; font-weight: 700; margin: 0 0 10px 0; text-align: center; letter-spacing: -0.3px;">You received a tip!</h1>
                <p style="color: #7A7469; font-size: 15px; text-align: center; margin: 0 0 28px 0; line-height: 1.5;">Someone just showed their appreciation for your work</p>
                
                ${amountBox(`৳${data.amount}`, data.supporter_name === 'Anonymous' ? 'from an anonymous supporter' : `from ${data.supporter_name}`)}
                
                ${data.message ? quoteBlock(`"${data.message}"`) : ''}
                
                ${buttonHtml('View Your Dashboard', 'https://tipkoro.com/dashboard')}
              ${cardEnd}
              ${footerHtml}
            ${wrapperEnd}
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
          <body style="margin: 0; padding: 0; background-color: #F5F1E8;">
            ${wrapperStart}
              ${headerHtml}
              ${cardStart}
                <div style="display: block; width: 76px; height: 76px; margin: 0 auto 24px auto; background: #FEE2E2; border-radius: 50%; text-align: center; line-height: 76px; font-size: 34px;">❤️</div>
                <h1 style="color: #1F1C18; font-family: ${fontDisplay}; font-size: 26px; font-weight: 700; margin: 0 0 10px 0; text-align: center; letter-spacing: -0.3px;">Thank you for your support!</h1>
                <p style="color: #7A7469; font-size: 15px; text-align: center; margin: 0 0 28px 0; line-height: 1.5;">Your generosity helps creators keep doing what they love</p>
                
                ${amountBox(`৳${data.amount}`, `sent to ${data.creator_name || 'a creator'}`)}
                
                ${data.message ? quoteBlock(`Your message: "${data.message}"`) : ''}
                
                <p style="color: #4A453D; font-size: 15px; line-height: 1.75; margin: 24px 0; text-align: center;">
                  You're making a difference! Your support directly helps creators continue their amazing work.
                </p>
                
                ${buttonHtml('Discover More Creators', 'https://tipkoro.com/explore')}
              ${cardEnd}
              ${footerHtml}
            ${wrapperEnd}
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
          <body style="margin: 0; padding: 0; background-color: #F5F1E8;">
            ${wrapperStart}
              ${headerHtml}
              ${cardStart}
                <div style="display: block; width: 76px; height: 76px; margin: 0 auto 24px auto; background: #FEF7E0; border-radius: 50%; text-align: center; line-height: 76px; font-size: 34px;">📤</div>
                <h1 style="color: #1F1C18; font-family: ${fontDisplay}; font-size: 26px; font-weight: 700; margin: 0 0 10px 0; text-align: center; letter-spacing: -0.3px;">Withdrawal Request Submitted</h1>
                <p style="color: #7A7469; font-size: 15px; text-align: center; margin: 0 0 28px 0; line-height: 1.5;">We've received your withdrawal request</p>
                
                ${amountBox(`৳${data.amount}`, '', `<span style="display: inline-block; padding: 8px 16px; border-radius: 24px; font-size: 13px; font-weight: 600; margin-top: 10px; background: #FEF3C7; color: #92400E;">Pending Review</span>`)}
                
                ${divider}
                
                <p style="color: #4A453D; font-size: 15px; line-height: 1.75; margin: 24px 0;">
                  Your withdrawal request has been submitted and is now under review. We'll process it within <span style="color: #D97706; font-weight: 600;">3-5 business days</span> and notify you once it's completed.
                </p>
                
                <p style="text-align: center;">
                  <span style="color: #7A7469; font-size: 12px; font-family: monospace; background: #EBE6DA; padding: 6px 12px; border-radius: 8px; display: inline-block; margin-top: 10px;">Ref: ${new Date().toISOString().split('T')[0]}-${Math.random().toString(36).substring(2, 8).toUpperCase()}</span>
                </p>
                
                ${buttonHtml('View Finance', 'https://tipkoro.com/finance')}
              ${cardEnd}
              ${footerHtml}
            ${wrapperEnd}
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
          <body style="margin: 0; padding: 0; background-color: #F5F1E8;">
            ${wrapperStart}
              ${headerHtml}
              ${cardStart}
                <div style="display: block; width: 76px; height: 76px; margin: 0 auto 24px auto; background: #E3F4FD; border-radius: 50%; text-align: center; line-height: 76px; font-size: 34px;">⏳</div>
                <h1 style="color: #1F1C18; font-family: ${fontDisplay}; font-size: 26px; font-weight: 700; margin: 0 0 10px 0; text-align: center; letter-spacing: -0.3px;">Withdrawal Being Processed</h1>
                <p style="color: #7A7469; font-size: 15px; text-align: center; margin: 0 0 28px 0; line-height: 1.5;">Good news! Your withdrawal has been approved</p>
                
                ${amountBox(`৳${data.amount}`, '', `<span style="display: inline-block; padding: 8px 16px; border-radius: 24px; font-size: 13px; font-weight: 600; margin-top: 10px; background: #DBEAFE; color: #1E40AF;">Processing</span>`)}
                
                ${divider}
                
                <p style="color: #4A453D; font-size: 15px; line-height: 1.75; margin: 24px 0;">
                  Your withdrawal has been approved and is now being processed. The funds will be sent to your registered payment method within <span style="color: #D97706; font-weight: 600;">1-2 business days</span>.
                </p>
                
                <p style="font-size: 13px; color: #7A7469; text-align: center; margin: 16px 0;">
                  We'll send you another email once the transfer is complete.
                </p>
                
                ${buttonHtml('View Finance', 'https://tipkoro.com/finance')}
              ${cardEnd}
              ${footerHtml}
            ${wrapperEnd}
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
          <body style="margin: 0; padding: 0; background-color: #F5F1E8;">
            ${wrapperStart}
              ${headerHtml}
              ${cardStart}
                <div style="display: block; width: 76px; height: 76px; margin: 0 auto 24px auto; background: #D9F7E4; border-radius: 50%; text-align: center; line-height: 76px; font-size: 34px;">🎉</div>
                <h1 style="color: #1F1C18; font-family: ${fontDisplay}; font-size: 26px; font-weight: 700; margin: 0 0 10px 0; text-align: center; letter-spacing: -0.3px;">Withdrawal Complete!</h1>
                <p style="color: #7A7469; font-size: 15px; text-align: center; margin: 0 0 28px 0; line-height: 1.5;">Your funds have been sent successfully</p>
                
                ${amountBox(`৳${data.amount}`, '', `<span style="display: inline-block; padding: 8px 16px; border-radius: 24px; font-size: 13px; font-weight: 600; margin-top: 10px; background: #DCFCE7; color: #166534;">Completed</span>`)}
                
                ${divider}
                
                <p style="color: #4A453D; font-size: 15px; line-height: 1.75; margin: 24px 0;">
                  Great news! Your withdrawal has been completed and the funds have been sent to your registered payment method. Please allow up to <span style="color: #D97706; font-weight: 600;">24 hours</span> for the amount to reflect in your account.
                </p>
                
                <p style="font-size: 13px; color: #7A7469; text-align: center; margin: 16px 0;">
                  If you don't see the funds within 24 hours, please contact our support team.
                </p>
                
                ${buttonHtml('View Finance', 'https://tipkoro.com/finance')}
              ${cardEnd}
              ${footerHtml}
            ${wrapperEnd}
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
          <body style="margin: 0; padding: 0; background-color: #F5F1E8;">
            ${wrapperStart}
              ${headerHtml}
              ${cardStart}
                <div style="display: block; width: 76px; height: 76px; margin: 0 auto 24px auto; background: #FEE6E6; border-radius: 50%; text-align: center; line-height: 76px; font-size: 34px;">❌</div>
                <h1 style="color: #1F1C18; font-family: ${fontDisplay}; font-size: 26px; font-weight: 700; margin: 0 0 10px 0; text-align: center; letter-spacing: -0.3px;">Withdrawal Rejected</h1>
                <p style="color: #7A7469; font-size: 15px; text-align: center; margin: 0 0 28px 0; line-height: 1.5;">We couldn't process your withdrawal request</p>
                
                ${amountBox(`৳${data.amount}`, '', `<span style="display: inline-block; padding: 8px 16px; border-radius: 24px; font-size: 13px; font-weight: 600; margin-top: 10px; background: #FEE2E2; color: #991B1B;">Rejected</span>`, '#FEF2F2')}
                
                ${divider}
                
                ${data.reason ? quoteBlock(`<strong>Reason:</strong> ${data.reason}`, true) : ''}
                
                <p style="color: #4A453D; font-size: 15px; line-height: 1.75; margin: 24px 0;">
                  Unfortunately, your withdrawal request has been rejected. The amount has been returned to your available balance. You can submit a new withdrawal request after addressing the issue above.
                </p>
                
                <p style="font-size: 13px; color: #7A7469; text-align: center; margin: 16px 0;">
                  If you believe this is an error or need assistance, please contact our support team.
                </p>
                
                ${buttonHtml('View Finance', 'https://tipkoro.com/finance')}
              ${cardEnd}
              ${footerHtml}
            ${wrapperEnd}
          </body>
          </html>
        `
      };

    case 'withdrawal_otp':
      return {
        subject: `🔐 Your TipKoro Withdrawal Verification Code`,
        html: `
          <!DOCTYPE html>
          <html>
          <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">${baseStyle}</head>
          <body style="margin: 0; padding: 0; background-color: #F5F1E8;">
            ${wrapperStart}
              ${headerHtml}
              ${cardStart}
                <div style="display: block; width: 76px; height: 76px; margin: 0 auto 24px auto; background: #E3F4FD; border-radius: 50%; text-align: center; line-height: 76px; font-size: 34px;">🔐</div>
                <h1 style="color: #1F1C18; font-family: ${fontDisplay}; font-size: 26px; font-weight: 700; margin: 0 0 10px 0; text-align: center; letter-spacing: -0.3px;">Withdrawal Verification</h1>
                <p style="color: #7A7469; font-size: 15px; text-align: center; margin: 0 0 28px 0; line-height: 1.5;">Use this code to verify your withdrawal of ৳${data.withdrawal_amount || 0}</p>
                
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: #F4F0E8; border-radius: 16px; margin: 28px 0;">
                  <tr>
                    <td align="center" style="padding: 32px 28px;">
                      <p style="color: #7A7469; font-size: 13px; margin: 0 0 12px 0;">Your verification code</p>
                      <p style="color: #1F1C18; font-family: 'SF Mono', 'Monaco', monospace; font-size: 42px; font-weight: 700; margin: 0; letter-spacing: 8px;">${data.otp_code || '------'}</p>
                      <p style="color: #7A7469; font-size: 13px; margin: 12px 0 0 0;">Expires in 10 minutes</p>
                    </td>
                  </tr>
                </table>
                
                ${divider}
                
                <p style="color: #4A453D; font-size: 15px; line-height: 1.75; margin: 24px 0;">
                  If you didn't request this withdrawal, please <span style="color: #D97706; font-weight: 600;">change your withdrawal PIN immediately</span> and contact our support team.
                </p>
                
                <p style="font-size: 13px; color: #7A7469; text-align: center; margin: 16px 0;">
                  For security, never share this code with anyone.
                </p>
              ${cardEnd}
              ${footerHtml}
            ${wrapperEnd}
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
          <body style="margin: 0; padding: 0; background-color: #F5F1E8;">
            ${wrapperStart}
              ${headerHtml}
              ${cardStart}
                <div style="display: block; width: 76px; height: 76px; margin: 0 auto 24px auto; background: #D9F7E4; border-radius: 50%; text-align: center; line-height: 76px; font-size: 34px;">🎉</div>
                <h1 style="color: #1F1C18; font-family: ${fontDisplay}; font-size: 26px; font-weight: 700; margin: 0 0 10px 0; text-align: center; letter-spacing: -0.3px;">Welcome to TipKoro!</h1>
                <p style="color: #7A7469; font-size: 15px; text-align: center; margin: 0 0 28px 0; line-height: 1.5;">Your creator account is now active</p>
                
                ${data.username ? `
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: #DCFCE7; border: 1px solid rgba(22, 163, 74, 0.25); border-radius: 16px; margin: 28px 0;">
                    <tr>
                      <td align="center" style="padding: 32px 28px;">
                        <p style="color: #166534; font-size: 14px; margin: 0 0 8px 0;">Your TipKoro Page</p>
                        <p style="color: #1F1C18; font-family: ${fontDisplay}; font-size: 28px; font-weight: 700; margin: 0;">tipkoro.com/${data.username}</p>
                      </td>
                    </tr>
                  </table>
                ` : ''}
                
                ${divider}
                
                <p style="font-size: 16px; text-align: center; font-weight: 500; color: #4A453D; margin: 24px 0;">
                  Here's how to get started:
                </p>
                
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: #F4F0E8; border-radius: 12px; margin: 16px 0;">
                  <tr>
                    <td style="padding: 20px;">
                      <table width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td width="36" valign="top">
                            <div style="background: #F9C23C; color: #1F1C18; width: 24px; height: 24px; border-radius: 50%; text-align: center; line-height: 24px; font-weight: 600; font-size: 14px;">1</div>
                          </td>
                          <td style="padding-bottom: 16px;">
                            <p style="margin: 0; font-weight: 600; color: #1F1C18;">Complete your profile</p>
                            <p style="margin: 4px 0 0 0; font-size: 14px; color: #7A7469;">Add a bio, profile picture, and social links</p>
                          </td>
                        </tr>
                        <tr>
                          <td width="36" valign="top">
                            <div style="background: #F9C23C; color: #1F1C18; width: 24px; height: 24px; border-radius: 50%; text-align: center; line-height: 24px; font-weight: 600; font-size: 14px;">2</div>
                          </td>
                          <td style="padding-bottom: 16px;">
                            <p style="margin: 0; font-weight: 600; color: #1F1C18;">Share your page</p>
                            <p style="margin: 4px 0 0 0; font-size: 14px; color: #7A7469;">Add your TipKoro link to your social media bios</p>
                          </td>
                        </tr>
                        <tr>
                          <td width="36" valign="top">
                            <div style="background: #F9C23C; color: #1F1C18; width: 24px; height: 24px; border-radius: 50%; text-align: center; line-height: 24px; font-weight: 600; font-size: 14px;">3</div>
                          </td>
                          <td>
                            <p style="margin: 0; font-weight: 600; color: #1F1C18;">Start receiving tips</p>
                            <p style="margin: 4px 0 0 0; font-size: 14px; color: #7A7469;">Your supporters can now tip you directly!</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
                
                ${buttonHtml('Go to Dashboard', 'https://tipkoro.com/dashboard')}
              ${cardEnd}
              ${footerHtml}
            ${wrapperEnd}
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
          <body style="margin: 0; padding: 0; background-color: #F5F1E8;">
            ${wrapperStart}
              ${headerHtml}
              ${cardStart}
                <div style="display: block; width: 76px; height: 76px; margin: 0 auto 24px auto; background: #FEF7E0; border-radius: 50%; text-align: center; line-height: 76px; font-size: 34px;">👋</div>
                <h1 style="color: #1F1C18; font-family: ${fontDisplay}; font-size: 26px; font-weight: 700; margin: 0 0 10px 0; text-align: center; letter-spacing: -0.3px;">Welcome to TipKoro!</h1>
                <p style="color: #7A7469; font-size: 15px; text-align: center; margin: 0 0 28px 0; line-height: 1.5;">Hi ${data.first_name || 'there'}, thanks for joining our community.</p>
                
                <p style="color: #4A453D; font-size: 15px; line-height: 1.75; text-align: center; margin: 24px 0;">
                  TipKoro is Bangladesh's creator support platform where fans can directly support their favorite creators through bKash, Nagad, and Rocket.
                </p>
                
                ${divider}
                
                <p style="font-size: 16px; text-align: center; font-weight: 500; color: #4A453D; margin: 24px 0;">
                  What would you like to do?
                </p>
                
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 20px 0;">
                  <tr>
                    <td width="49%" valign="top">
                      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: #F4F0E8; border-radius: 12px;">
                        <tr>
                          <td align="center" style="padding: 20px;">
                            <span style="font-size: 32px; display: block; margin-bottom: 8px;">💛</span>
                            <p style="font-weight: 600; color: #1F1C18; margin: 0 0 4px 0;">Support Creators</p>
                            <p style="font-size: 13px; color: #7A7469; margin: 0;">Send tips to your favorite creators</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                    <td width="2%"></td>
                    <td width="49%" valign="top">
                      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: #F4F0E8; border-radius: 12px;">
                        <tr>
                          <td align="center" style="padding: 20px;">
                            <span style="font-size: 32px; display: block; margin-bottom: 8px;">🎨</span>
                            <p style="font-weight: 600; color: #1F1C18; margin: 0 0 4px 0;">Become a Creator</p>
                            <p style="font-size: 13px; color: #7A7469; margin: 0;">Start receiving tips from fans</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
                
                ${buttonHtml('Explore Creators', 'https://tipkoro.com/explore')}
              ${cardEnd}
              ${footerHtml}
            ${wrapperEnd}
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
          <body style="margin: 0; padding: 0; background-color: #F5F1E8;">
            ${wrapperStart}
              ${headerHtml}
              ${cardStart}
                <div style="display: block; width: 76px; height: 76px; margin: 0 auto 24px auto; background: #FEF7E0; border-radius: 50%; text-align: center; line-height: 76px; font-size: 34px;">📊</div>
                <h1 style="color: #1F1C18; font-family: ${fontDisplay}; font-size: 26px; font-weight: 700; margin: 0 0 10px 0; text-align: center; letter-spacing: -0.3px;">Your Weekly Summary</h1>
                <p style="color: #7A7469; font-size: 15px; text-align: center; margin: 0 0 28px 0; line-height: 1.5;">Here's how you did this week</p>
                
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 24px 0;">
                  <tr>
                    <td width="49%" valign="top">
                      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: #FEF7E0; border: 1px solid #F5E6B8; border-radius: 16px;">
                        <tr>
                          <td align="center" style="padding: 20px;">
                            <p style="color: #7A7469; font-size: 13px; margin: 0 0 4px 0;">Earnings</p>
                            <p style="color: #1F1C18; font-family: ${fontDisplay}; font-size: 32px; font-weight: 700; margin: 0;">৳${earnings}</p>
                            ${prevEarnings > 0 ? `<p style="color: ${changeColor}; font-size: 13px; font-weight: 600; margin: 4px 0 0 0;">${changeText} vs last week</p>` : ''}
                          </td>
                        </tr>
                      </table>
                    </td>
                    <td width="2%"></td>
                    <td width="49%" valign="top">
                      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: #FEF7E0; border: 1px solid #F5E6B8; border-radius: 16px;">
                        <tr>
                          <td align="center" style="padding: 20px;">
                            <p style="color: #7A7469; font-size: 13px; margin: 0 0 4px 0;">Tips Received</p>
                            <p style="color: #1F1C18; font-family: ${fontDisplay}; font-size: 32px; font-weight: 700; margin: 0;">${data.week_tips_count || 0}</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
                
                ${(data.new_supporters && data.new_supporters > 0) ? `
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: #DCFCE7; border-radius: 12px; margin: 16px 0;">
                    <tr>
                      <td align="center" style="padding: 16px;">
                        <span style="font-size: 24px;">🎊</span>
                        <p style="margin: 8px 0 0 0; color: #166534; font-weight: 600;">${data.new_supporters} new supporter${data.new_supporters > 1 ? 's' : ''} this week!</p>
                      </td>
                    </tr>
                  </table>
                ` : ''}
                
                ${(data.top_supporters && data.top_supporters.length > 0) ? `
                  ${divider}
                  <h3 style="font-family: ${fontDisplay}; color: #1F1C18; font-size: 17px; font-weight: 700; margin: 0 0 14px 0; letter-spacing: -0.2px;">Top Supporters This Week</h3>
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: #F0EBE0; border-radius: 14px;">
                    <tr>
                      <td style="padding: 18px;">
                        ${data.top_supporters.map((s, i) => `
                          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="${i < data.top_supporters!.length - 1 ? 'border-bottom: 1px solid #E5E0D5;' : ''}">
                            <tr>
                              <td style="padding: 10px 0; color: #1F1C18; font-weight: 500;">${i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'} ${s.name}</td>
                              <td align="right" style="padding: 10px 0; color: #7A7469; font-weight: 600;">৳${s.amount}</td>
                            </tr>
                          </table>
                        `).join('')}
                      </td>
                    </tr>
                  </table>
                ` : ''}
                
                ${earnings === 0 ? `
                  ${divider}
                  <p style="color: #4A453D; font-size: 15px; line-height: 1.75; text-align: center; margin: 24px 0;">
                    No tips this week? Don't worry! Try sharing your TipKoro page on social media to reach more supporters.
                  </p>
                ` : ''}
                
                ${buttonHtml('View Full Dashboard', 'https://tipkoro.com/dashboard')}
              ${cardEnd}
              ${footerHtml}
            ${wrapperEnd}
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
          <body style="margin: 0; padding: 0; background-color: #F5F1E8;">
            ${wrapperStart}
              ${headerHtml}
              ${cardStart}
                <div style="display: block; width: 76px; height: 76px; margin: 0 auto 24px auto; background: #D9F7E4; border-radius: 50%; text-align: center; line-height: 76px; font-size: 34px;">✅</div>
                <h1 style="color: #1F1C18; font-family: ${fontDisplay}; font-size: 26px; font-weight: 700; margin: 0 0 10px 0; text-align: center; letter-spacing: -0.3px;">You're Verified!</h1>
                <p style="color: #7A7469; font-size: 15px; text-align: center; margin: 0 0 28px 0; line-height: 1.5;">Congratulations ${data.creator_name || 'Creator'}, your account has been verified.</p>
                
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: #DCFCE7; border-radius: 16px; margin: 28px 0;">
                  <tr>
                    <td align="center" style="padding: 24px;">
                      <p style="font-size: 18px; font-weight: 600; color: #166534; margin: 0;">Your profile now displays the verified badge ✓</p>
                    </td>
                  </tr>
                </table>
                
                <p style="color: #4A453D; font-size: 15px; line-height: 1.75; text-align: center; margin: 24px 0;">
                  This badge builds trust with your supporters and shows them you're a genuine creator.
                </p>
                
                ${buttonHtml('View Your Profile', `https://tipkoro.com/${data.username || 'dashboard'}`)}
              ${cardEnd}
              ${footerHtml}
            ${wrapperEnd}
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
          <body style="margin: 0; padding: 0; background-color: #F5F1E8;">
            ${wrapperStart}
              ${headerHtml}
              ${cardStart}
                <div style="display: block; width: 76px; height: 76px; margin: 0 auto 24px auto; background: #FEE6E6; border-radius: 50%; text-align: center; line-height: 76px; font-size: 34px;">❌</div>
                <h1 style="color: #1F1C18; font-family: ${fontDisplay}; font-size: 26px; font-weight: 700; margin: 0 0 10px 0; text-align: center; letter-spacing: -0.3px;">Verification Declined</h1>
                <p style="color: #7A7469; font-size: 15px; text-align: center; margin: 0 0 28px 0; line-height: 1.5;">Hi ${data.creator_name || 'Creator'}, unfortunately we couldn't verify your account at this time.</p>
                
                ${data.reason ? quoteBlock(`<strong>Reason:</strong> ${data.reason}`, true) : ''}
                
                <p style="color: #4A453D; font-size: 15px; line-height: 1.75; text-align: center; margin: 24px 0;">
                  You can submit a new verification request with updated documents from your settings page.
                </p>
                
                ${buttonHtml('Try Again', 'https://tipkoro.com/settings?tab=verification')}
              ${cardEnd}
              ${footerHtml}
            ${wrapperEnd}
          </body>
          </html>
        `
      };

    case 'goal_milestone_50':
      return {
        subject: `🎯 Halfway There! ${data.goal_title || 'Your Goal'} is 50% Funded`,
        html: `
          <!DOCTYPE html>
          <html>
          <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">${baseStyle}</head>
          <body style="margin: 0; padding: 0; background-color: #F5F1E8;">
            ${wrapperStart}
              ${headerHtml}
              ${cardStart}
                <div style="display: block; width: 76px; height: 76px; margin: 0 auto 24px auto; background: #FEF7E0; border-radius: 50%; text-align: center; line-height: 76px; font-size: 34px;">🎯</div>
                <h1 style="color: #1F1C18; font-family: ${fontDisplay}; font-size: 26px; font-weight: 700; margin: 0 0 10px 0; text-align: center; letter-spacing: -0.3px;">Halfway There! 50% 🎉</h1>
                <p style="color: #7A7469; font-size: 15px; text-align: center; margin: 0 0 28px 0; line-height: 1.5;">Amazing progress on "${data.goal_title || 'your goal'}"!</p>
                
                ${amountBox(`৳${data.current_amount || 0}`, `of ৳${data.target_amount || 0} goal`)}
                
                <p style="color: #4A453D; font-size: 15px; line-height: 1.75; text-align: center; margin: 24px 0;">
                  You're making great progress! Keep sharing your page to reach your goal faster.
                </p>
                
                ${buttonHtml('View Progress', 'https://tipkoro.com/dashboard')}
              ${cardEnd}
              ${footerHtml}
            ${wrapperEnd}
          </body>
          </html>
        `
      };

    case 'goal_milestone_75':
      return {
        subject: `🔥 Almost There! ${data.goal_title || 'Your Goal'} is 75% Funded`,
        html: `
          <!DOCTYPE html>
          <html>
          <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">${baseStyle}</head>
          <body style="margin: 0; padding: 0; background-color: #F5F1E8;">
            ${wrapperStart}
              ${headerHtml}
              ${cardStart}
                <div style="display: block; width: 76px; height: 76px; margin: 0 auto 24px auto; background: #FEF3C7; border-radius: 50%; text-align: center; line-height: 76px; font-size: 34px;">🔥</div>
                <h1 style="color: #1F1C18; font-family: ${fontDisplay}; font-size: 26px; font-weight: 700; margin: 0 0 10px 0; text-align: center; letter-spacing: -0.3px;">Almost There! 75% 🔥</h1>
                <p style="color: #7A7469; font-size: 15px; text-align: center; margin: 0 0 28px 0; line-height: 1.5;">You're so close to completing "${data.goal_title || 'your goal'}"!</p>
                
                ${amountBox(`৳${data.current_amount || 0}`, `of ৳${data.target_amount || 0} goal`)}
                
                <p style="color: #4A453D; font-size: 15px; line-height: 1.75; text-align: center; margin: 24px 0;">
                  Only 25% to go! Your supporters are rallying behind you. Keep the momentum going!
                </p>
                
                ${buttonHtml('View Progress', 'https://tipkoro.com/dashboard')}
              ${cardEnd}
              ${footerHtml}
            ${wrapperEnd}
          </body>
          </html>
        `
      };

    case 'goal_milestone_100':
      return {
        subject: `🎉 Goal Achieved! ${data.goal_title || 'Your Goal'} is 100% Funded!`,
        html: `
          <!DOCTYPE html>
          <html>
          <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">${baseStyle}</head>
          <body style="margin: 0; padding: 0; background-color: #F5F1E8;">
            ${wrapperStart}
              ${headerHtml}
              ${cardStart}
                <div style="display: block; width: 76px; height: 76px; margin: 0 auto 24px auto; background: #D9F7E4; border-radius: 50%; text-align: center; line-height: 76px; font-size: 34px;">🎉</div>
                <h1 style="color: #1F1C18; font-family: ${fontDisplay}; font-size: 26px; font-weight: 700; margin: 0 0 10px 0; text-align: center; letter-spacing: -0.3px;">Goal Achieved! 🎊</h1>
                <p style="color: #7A7469; font-size: 15px; text-align: center; margin: 0 0 28px 0; line-height: 1.5;">Congratulations! "${data.goal_title || 'Your goal'}" is fully funded!</p>
                
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: #DCFCE7; border: 1px solid #86EFAC; border-radius: 16px; margin: 28px 0;">
                  <tr>
                    <td align="center" style="padding: 32px 28px;">
                      <p style="color: #166534; font-family: ${fontDisplay}; font-size: 48px; font-weight: 700; margin: 0; letter-spacing: -1px;">৳${data.current_amount || 0}</p>
                      <p style="color: #166534; font-size: 14px; margin-top: 8px; font-weight: 500;">Goal Complete! 🎯</p>
                    </td>
                  </tr>
                </table>
                
                <p style="color: #4A453D; font-size: 15px; line-height: 1.75; text-align: center; margin: 24px 0;">
                  Your amazing community helped you reach this milestone. Time to celebrate and maybe set a new goal!
                </p>
                
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td align="center" style="padding-top: 28px;">
                      <a href="https://tipkoro.com/dashboard" style="display: inline-block; background: #166534; color: #FFFFFF; padding: 16px 40px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 15px; letter-spacing: 0.2px;">Celebrate & Set New Goal</a>
                    </td>
                  </tr>
                </table>
              ${cardEnd}
              ${footerHtml}
            ${wrapperEnd}
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
          <body style="margin: 0; padding: 0; background-color: #F5F1E8;">
            ${wrapperStart}
              ${headerHtml}
              ${cardStart}
                <div style="display: block; width: 76px; height: 76px; margin: 0 auto 24px auto; background: #FEF7E0; border-radius: 50%; text-align: center; line-height: 76px; font-size: 34px;">🔔</div>
                <h1 style="color: #1F1C18; font-family: ${fontDisplay}; font-size: 26px; font-weight: 700; margin: 0 0 10px 0; text-align: center; letter-spacing: -0.3px;">You have a notification</h1>
                <p style="color: #7A7469; font-size: 15px; text-align: center; margin: 0 0 28px 0; line-height: 1.5;">Check your dashboard for more details</p>
                
                ${buttonHtml('Visit Dashboard', 'https://tipkoro.com/dashboard')}
              ${cardEnd}
              ${footerHtml}
            ${wrapperEnd}
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
          supporter_name: data?.supporter_name || 'Anonymous',
          creator_name: data?.creator_name || '',
          message: data?.message || '',
          reason: data?.reason || '',
          username: data?.username || '',
          first_name: data?.first_name || profileData?.first_name || '',
          week_tips_count: String(data?.week_tips_count || '0'),
          week_earnings: String(data?.week_earnings || '0'),
          new_supporters: String(data?.new_supporters || '0'),
          previous_week_earnings: String(data?.previous_week_earnings || '0'),
          otp_code: data?.otp_code || '',
          withdrawal_amount: String(data?.withdrawal_amount || ''),
          // Goal milestone variables
          goal_title: data?.goal_title || '',
          milestone: String(data?.milestone || ''),
          current_amount: String(data?.current_amount || ''),
          target_amount: String(data?.target_amount || ''),
          percentage: String(Math.round(data?.percentage || 0)),
          // Additional variables
          tip_id: data?.tip_id || '',
          url: data?.url || '',
        };
        
        console.log(`[EMAIL] Using custom template for ${type}`);
        console.log(`[EMAIL] Replacements available:`, Object.keys(replacements).join(', '));
        
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
