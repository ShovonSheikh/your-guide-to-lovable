import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface SupportEmailRequest {
  type: 'ticket_created' | 'new_reply' | 'ticket_closed';
  ticket_id: string;
  ticket_number: string;
  email: string;
  subject: string;
  name?: string;
  message_preview?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: SupportEmailRequest = await req.json();
    const { type, ticket_number, email, subject, name, message_preview } = data;

    const baseUrl = "https://tipkoro.com";
    const ticketUrl = `${baseUrl}/support/ticket/${data.ticket_id}`;

    let emailSubject = "";
    let emailHtml = "";

    const headerStyle = `
      background: linear-gradient(135deg, #D4AF37 0%, #F5D675 100%);
      padding: 32px;
      text-align: center;
    `;

    const containerStyle = `
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      max-width: 600px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    `;

    const bodyStyle = `
      padding: 32px;
      color: #333333;
    `;

    const buttonStyle = `
      display: inline-block;
      background: linear-gradient(135deg, #D4AF37 0%, #C9A431 100%);
      color: #1a1a1a;
      padding: 14px 28px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      margin: 16px 0;
    `;

    const footerStyle = `
      background: #f5f5f5;
      padding: 24px;
      text-align: center;
      color: #666666;
      font-size: 14px;
    `;

    switch (type) {
      case 'ticket_created':
        emailSubject = `Ticket ${ticket_number} Created - ${subject}`;
        emailHtml = `
          <div style="${containerStyle}">
            <div style="${headerStyle}">
              <h1 style="color: #1a1a1a; margin: 0; font-size: 24px;">Support Ticket Created</h1>
            </div>
            <div style="${bodyStyle}">
              <p>Hi ${name || 'there'},</p>
              <p>Thank you for contacting TipKoro support. Your ticket has been created and our team will review it shortly.</p>
              
              <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0 0 8px 0;"><strong>Ticket Number:</strong> ${ticket_number}</p>
                <p style="margin: 0;"><strong>Subject:</strong> ${subject}</p>
              </div>

              <p>We typically respond within 24 hours. You'll receive an email notification when we reply.</p>

              <div style="text-align: center;">
                <a href="${ticketUrl}" style="${buttonStyle}">View Ticket</a>
              </div>
            </div>
            <div style="${footerStyle}">
              <p style="margin: 0;">TipKoro Support Team</p>
              <p style="margin: 8px 0 0 0; font-size: 12px;">Made with ❤️ in Bangladesh</p>
            </div>
          </div>
        `;
        break;

      case 'new_reply':
        emailSubject = `New Reply on Ticket ${ticket_number}`;
        emailHtml = `
          <div style="${containerStyle}">
            <div style="${headerStyle}">
              <h1 style="color: #1a1a1a; margin: 0; font-size: 24px;">New Reply on Your Ticket</h1>
            </div>
            <div style="${bodyStyle}">
              <p>Hi there,</p>
              <p>Our support team has replied to your ticket <strong>${ticket_number}</strong>.</p>
              
              ${message_preview ? `
                <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #D4AF37;">
                  <p style="margin: 0; color: #666;">${message_preview}${message_preview.length >= 200 ? '...' : ''}</p>
                </div>
              ` : ''}

              <div style="text-align: center;">
                <a href="${ticketUrl}" style="${buttonStyle}">View Full Reply</a>
              </div>
            </div>
            <div style="${footerStyle}">
              <p style="margin: 0;">TipKoro Support Team</p>
            </div>
          </div>
        `;
        break;

      case 'ticket_closed':
        emailSubject = `Ticket ${ticket_number} Closed`;
        emailHtml = `
          <div style="${containerStyle}">
            <div style="${headerStyle}">
              <h1 style="color: #1a1a1a; margin: 0; font-size: 24px;">Ticket Closed</h1>
            </div>
            <div style="${bodyStyle}">
              <p>Hi there,</p>
              <p>Your support ticket <strong>${ticket_number}</strong> regarding "<em>${subject}</em>" has been closed.</p>
              
              <p>We hope we were able to help resolve your issue. If you need further assistance, feel free to create a new ticket.</p>

              <div style="text-align: center;">
                <a href="${baseUrl}/support" style="${buttonStyle}">Contact Support</a>
              </div>

              <p style="color: #666; font-size: 14px; margin-top: 24px;">
                Thank you for using TipKoro. Your feedback helps us improve!
              </p>
            </div>
            <div style="${footerStyle}">
              <p style="margin: 0;">TipKoro Support Team</p>
              <p style="margin: 8px 0 0 0; font-size: 12px;">Made with ❤️ in Bangladesh</p>
            </div>
          </div>
        `;
        break;

      default:
        throw new Error(`Unknown email type: ${type}`);
    }

    // Use fetch to call Resend API directly
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "TipKoro Support <support@tipkoro.com>",
        to: [email],
        subject: emailSubject,
        html: emailHtml,
      }),
    });

    if (!res.ok) {
      const errorData = await res.text();
      console.error("Resend API error:", errorData);
      throw new Error(`Failed to send email: ${errorData}`);
    }

    const emailResponse = await res.json();
    console.log("Support email sent:", emailResponse);

    return new Response(JSON.stringify({ success: true, id: emailResponse.id }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-support-email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
