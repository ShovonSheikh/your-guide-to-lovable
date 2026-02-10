import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

// Ensure Message-ID follows RFC 2822 format with angle brackets
function ensureMessageIdFormat(messageId: string): string {
  if (!messageId) return '';
  // If already has angle brackets, return as-is
  if (messageId.startsWith('<') && messageId.endsWith('>')) {
    return messageId;
  }
  // Wrap in angle brackets for RFC 2822 compliance
  return `<${messageId}>`;
}

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
  from_address: string;
  to_address: string;
  subject: string;
  html_body?: string;
  text_body?: string;
  in_reply_to?: string;
  original_email_id: string;
}

const handler = async (req: Request): Promise<Response> => {
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

    if (!from_address || !to_address || !subject || (!html_body && !text_body)) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

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

    // Build proper email threading headers
    // Get the original email to find its message_id and any existing references
    const { data: originalEmail } = await supabase
      .from("inbound_emails")
      .select("message_id")
      .eq("id", original_email_id)
      .single();

    const headers: Record<string, string> = {};
    
    if (in_reply_to) {
      // Ensure proper RFC 2822 format for threading headers
      headers["In-Reply-To"] = ensureMessageIdFormat(in_reply_to);
      
      // Build References header for proper threading
      const references: string[] = [];
      
      // Add the original message_id to references (already in RFC 2822 format from DB)
      if (originalEmail?.message_id) {
        references.push(ensureMessageIdFormat(originalEmail.message_id));
      }
      
      // If in_reply_to is different from original, add it too
      if (in_reply_to && in_reply_to !== originalEmail?.message_id) {
        const formattedInReplyTo = ensureMessageIdFormat(in_reply_to);
        if (!references.includes(formattedInReplyTo)) {
          references.push(formattedInReplyTo);
        }
      }
      
      if (references.length > 0) {
        headers["References"] = references.join(" ");
      }
    }

    const formattedFrom = mailbox.display_name 
      ? `${mailbox.display_name} <${from_address}>`
      : from_address;

    const emailResponse = await sendEmailViaResend({
      from: formattedFrom,
      to: [to_address],
      subject: subject,
      html: html_body || undefined,
      text: text_body || undefined,
      headers: Object.keys(headers).length > 0 ? headers : undefined,
    });

    console.log("Reply email sent successfully:", emailResponse);

    // Get admin profile_id for created_by
    const { data: adminProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", clerkUserId)
      .single();

    // Log to outbound_emails for Sent folder
    await supabase.from("outbound_emails").insert({
      mailbox_id: mailbox.id,
      to_addresses: to_address,
      subject: subject,
      html_body: html_body || null,
      text_body: text_body || null,
      status: "sent",
      sent_at: new Date().toISOString(),
      resend_id: emailResponse.id || null,
      in_reply_to: in_reply_to || null,
      created_by: adminProfile?.id || null,
    });

    // Log the sent email
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