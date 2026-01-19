import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

async function sendEmailViaResend(params: {
  from: string;
  to: string[];
  subject: string;
  html?: string;
  text?: string;
  headers?: Record<string, string>;
}) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Resend API error: ${error}`);
  }

  return await response.json();
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-clerk-user-id",
};

interface ReplyEmailRequest {
  from_address: string; // The mailbox address to send from
  to_address: string; // The recipient (original sender)
  subject: string;
  html_body?: string;
  text_body?: string;
  in_reply_to?: string; // Original message ID for threading
  original_email_id: string; // ID of the email being replied to
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const clerkUserId = req.headers.get("x-clerk-user-id");
    if (!clerkUserId) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Verify user is admin
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("user_id", clerkUserId)
      .single();

    if (profileError || !profile?.is_admin) {
      return new Response(
        JSON.stringify({ error: "Forbidden - Admin access required" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { 
      from_address, 
      to_address, 
      subject, 
      html_body, 
      text_body, 
      in_reply_to,
      original_email_id 
    }: ReplyEmailRequest = await req.json();

    // Validate required fields
    if (!from_address || !to_address || !subject || (!html_body && !text_body)) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Verify the from_address is a valid mailbox
    const { data: mailbox, error: mailboxError } = await supabase
      .from("mailboxes")
      .select("id, display_name")
      .eq("email_address", from_address)
      .single();

    if (mailboxError || !mailbox) {
      return new Response(
        JSON.stringify({ error: "Invalid sender mailbox" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Build email headers for threading
    const headers: Record<string, string> = {};
    if (in_reply_to) {
      headers["In-Reply-To"] = in_reply_to;
      headers["References"] = in_reply_to;
    }

    // Format the from address with display name
    const formattedFrom = mailbox.display_name 
      ? `${mailbox.display_name} <${from_address}>`
      : from_address;

    // Send the email via Resend
    const emailResponse = await sendEmailViaResend({
      from: formattedFrom,
      to: [to_address],
      subject: subject,
      html: html_body || undefined,
      text: text_body || undefined,
      headers: Object.keys(headers).length > 0 ? headers : undefined,
    });

    console.log("Reply email sent successfully:", emailResponse);

    // Log the sent email (optional: you could store sent emails in a separate table)
    await supabase.from("email_logs").insert({
      email_type: "reply",
      recipient_email: to_address,
      status: "sent",
      resend_id: emailResponse.id || null,
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message_id: emailResponse.id,
        from: formattedFrom,
        to: to_address,
        subject: subject
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error sending reply email:", error);
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
