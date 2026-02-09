import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Webhook } from "https://esm.sh/svix@1.15.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ResendInboundEmail {
  created_at: string;
  email_id: string;
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  reply_to?: string[];
  subject: string;
  html: string;
  text: string;
  attachments?: {
    filename: string;
    content_type: string;
    size: number;
  }[];
  headers: Record<string, string>;
}

interface ResendWebhookEvent {
  type: string;
  created_at: string;
  data: ResendInboundEmail;
}

function parseEmailAddress(email: string): { address: string; name: string | null } {
  // Parse formats like "John Doe <john@example.com>" or "john@example.com"
  const match = email.match(/^(?:(.+?)\s*)?<(.+?)>$/);
  if (match) {
    return { name: match[1] || null, address: match[2] };
  }
  return { address: email, name: null };
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const webhookSecret = Deno.env.get('RESEND_WEBHOOK_SECRET');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (!resendApiKey) {
      console.error("[Inbound Email] RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "RESEND_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ============================
    // WEBHOOK SIGNATURE VERIFICATION
    // ============================
    const rawPayload = await req.text();
    
    if (webhookSecret) {
      const svixId = req.headers.get('svix-id');
      const svixTimestamp = req.headers.get('svix-timestamp');
      const svixSignature = req.headers.get('svix-signature');

      if (!svixId || !svixTimestamp || !svixSignature) {
        console.error("[Inbound Email] Missing Svix signature headers");
        return new Response(
          JSON.stringify({ error: "Missing signature headers" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      try {
        const wh = new Webhook(webhookSecret);
        wh.verify(rawPayload, {
          'svix-id': svixId,
          'svix-timestamp': svixTimestamp,
          'svix-signature': svixSignature,
        });
        console.log("[Inbound Email] Webhook signature verified successfully");
      } catch (err) {
        console.error("[Inbound Email] Webhook signature verification failed:", err);
        return new Response(
          JSON.stringify({ error: "Invalid webhook signature" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else {
      console.warn("[Inbound Email] RESEND_WEBHOOK_SECRET not configured - signature verification skipped");
    }
    // ============================

    console.log("[Inbound Email] Raw payload received");

    const event: ResendWebhookEvent = JSON.parse(rawPayload);

    console.log("[Inbound Email] Received webhook event:", event.type);
    console.log("[Inbound Email] Email data keys:", Object.keys(event.data || {}));

    // Only process email.received events
    if (event.type !== 'email.received') {
      console.log("[Inbound Email] Ignoring non-email.received event:", event.type);
      return new Response(
        JSON.stringify({ success: true, message: "Event type ignored" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const emailData = event.data;

    // Fetch full email content from Resend API (webhooks don't include body)
    // Add retry logic with delay as email may not be immediately available
    let htmlBody = emailData.html || null;
    let textBody = emailData.text || null;
    let actualMessageId: string | null = null; // RFC 2822 Message-ID for threading

    const fetchEmailContent = async (retries = 3, delayMs = 2000): Promise<void> => {
      for (let attempt = 1; attempt <= retries; attempt++) {
        console.log(`[Inbound Email] Fetching email content, attempt ${attempt}/${retries} for:`, emailData.email_id);

        const emailContentResponse = await fetch(
          `https://api.resend.com/emails/receiving/${emailData.email_id}`,
          {
            headers: {
              'Authorization': `Bearer ${resendApiKey}`,
            },
          }
        );

        if (emailContentResponse.ok) {
          const fullEmail = await emailContentResponse.json();
          console.log("[Inbound Email] Full email fetched, has html:", !!fullEmail.html, "has text:", !!fullEmail.text, "has message_id:", !!fullEmail.message_id);
          htmlBody = fullEmail.html || htmlBody;
          textBody = fullEmail.text || textBody;
          // Extract the RFC 2822 Message-ID for proper email threading
          actualMessageId = fullEmail.message_id || null;
          return; // Success, exit retry loop
        } else {
          const errorText = await emailContentResponse.text();
          console.error(`[Inbound Email] Attempt ${attempt} failed:`, emailContentResponse.status, errorText);

          // If not the last attempt and error is 404 (not found yet), wait and retry
          if (attempt < retries && emailContentResponse.status === 404) {
            console.log(`[Inbound Email] Email not ready, waiting ${delayMs}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, delayMs));
          }
        }
      }
      console.warn("[Inbound Email] All retries exhausted, proceeding without email body");
    };

    await fetchEmailContent();

    // Extract sender info
    const { address: fromAddress, name: fromName } = parseEmailAddress(emailData.from);

    console.log("[Inbound Email] Processing email from:", fromAddress, "to:", emailData.to);

    // Find the receiving mailbox (first recipient that matches our domain)
    const receivingAddress = emailData.to.find(addr => {
      const { address } = parseEmailAddress(addr);
      return address.endsWith('@tipkoro.com');
    });

    if (!receivingAddress) {
      console.log("[Inbound Email] No @tipkoro.com recipient found");
      return new Response(
        JSON.stringify({ success: false, message: "No valid recipient found" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { address: mailboxAddress } = parseEmailAddress(receivingAddress);
    console.log("[Inbound Email] Mailbox address:", mailboxAddress);

    // Find or create mailbox
    let { data: mailbox, error: mailboxError } = await supabase
      .from('mailboxes')
      .select('id')
      .eq('email_address', mailboxAddress)
      .maybeSingle();

    if (!mailbox) {
      // Create new mailbox
      const displayName = mailboxAddress.split('@')[0];
      const { data: newMailbox, error: createError } = await supabase
        .from('mailboxes')
        .insert({
          email_address: mailboxAddress,
          display_name: displayName.charAt(0).toUpperCase() + displayName.slice(1)
        })
        .select('id')
        .single();

      if (createError) {
        console.error("[Inbound Email] Failed to create mailbox:", createError);
        return new Response(
          JSON.stringify({ error: "Failed to create mailbox" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      mailbox = newMailbox;
    }

    // Parse recipients
    const toAddresses = emailData.to.map(addr => {
      const parsed = parseEmailAddress(addr);
      return { address: parsed.address, name: parsed.name };
    });

    const ccAddresses = emailData.cc?.map(addr => {
      const parsed = parseEmailAddress(addr);
      return { address: parsed.address, name: parsed.name };
    }) || null;

    const bccAddresses = emailData.bcc?.map(addr => {
      const parsed = parseEmailAddress(addr);
      return { address: parsed.address, name: parsed.name };
    }) || null;

    // Insert the email
    // Use RFC 2822 message_id for threading, fallback to formatted email_id
    const threadingMessageId = actualMessageId || `<${emailData.email_id}@resend.dev>`;
    
    const { error: insertError } = await supabase
      .from('inbound_emails')
      .insert({
        mailbox_id: mailbox.id,
        message_id: threadingMessageId, // RFC 2822 format for email threading
        resend_email_id: emailData.email_id, // Resend's internal ID for API calls
        from_address: fromAddress,
        from_name: fromName,
        to_addresses: toAddresses,
        cc_addresses: ccAddresses,
        bcc_addresses: bccAddresses,
        subject: emailData.subject || '(No Subject)',
        html_body: htmlBody,
        text_body: textBody,
        attachments: emailData.attachments || null,
        received_at: emailData.created_at,
        is_read: false,
        is_deleted: false
      });

    if (insertError) {
      // Check for duplicate
      if (insertError.code === '23505') { // Unique constraint violation
        console.log("[Inbound Email] Duplicate email ignored:", emailData.email_id);
        return new Response(
          JSON.stringify({ success: true, message: "Email already processed" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.error("[Inbound Email] Failed to insert email:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to save email" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[Inbound Email] Email saved successfully to mailbox:", mailboxAddress);

    // ============================
    // EMAIL ALERT RULES - Push Notifications
    // ============================
    try {
      const { data: rules } = await supabase
        .from('email_alert_rules')
        .select('*')
        .eq('is_active', true);

      for (const rule of rules || []) {
        let matches = false;
        const value = rule.match_value.toLowerCase();
        const isExact = rule.match_mode === 'exact';

        const checkMatch = (field: string) => {
          const lower = field.toLowerCase();
          return isExact ? lower === value : lower.includes(value);
        };

        switch (rule.match_type) {
          case 'from_address':
            matches = checkMatch(fromAddress);
            break;
          case 'subject':
            matches = checkMatch(emailData.subject || '');
            break;
          case 'body':
            matches = checkMatch(textBody || '');
            break;
          case 'any':
            matches = checkMatch(fromAddress) ||
                      checkMatch(emailData.subject || '') ||
                      checkMatch(textBody || '');
            break;
        }

        if (matches) {
          console.log(`[Inbound Email] Alert rule matched: "${rule.name}" for profile ${rule.profile_id}`);
          // Fire-and-forget push notification
          fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({
              profile_id: rule.profile_id,
              title: `Email Alert: ${rule.name}`,
              body: `From: ${fromName || fromAddress} — ${emailData.subject || '(No Subject)'}`,
              url: '/admin/mailbox',
              tag: 'email_alert',
            }),
          }).catch(err => console.error('[Inbound Email] Push notification failed:', err));
        }
      }
    } catch (alertError) {
      console.error("[Inbound Email] Error checking alert rules:", alertError);
      // Don't fail the webhook response for alert rule errors
    }
    // ============================

    return new Response(
      JSON.stringify({ success: true, message: "Email received and stored" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[Inbound Email] Error processing webhook:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
