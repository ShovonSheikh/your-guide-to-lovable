import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-clerk-user-id',
};

interface MassEmailRequest {
  audience: 'all' | 'creators' | 'supporters';
  subject: string;
  htmlBody: string;
}

// Helper function to send email via Resend API
async function sendEmail(
  apiKey: string,
  from: string,
  to: string,
  subject: string,
  html: string
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      return { success: false, error: `${response.status} ${errorData}` };
    }

    const data = await response.json();
    return { success: true, id: data.id };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY')!;
    const resendFrom = Deno.env.get('RESEND_FROM') || 'TipKoro <hello@tipkoro.com>';

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const getEmailDomain = (email: string) => {
      const at = email.lastIndexOf('@');
      return at >= 0 ? email.slice(at + 1) : '';
    };

    // Verify admin status via Clerk user ID header
    const clerkUserId = req.headers.get('x-clerk-user-id');
    if (!clerkUserId) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Missing user ID' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, is_admin')
      .eq('user_id', clerkUserId)
      .single();

    if (profileError || !profile?.is_admin) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { audience, subject, htmlBody }: MassEmailRequest = await req.json();

    // Validate required fields
    if (!audience || !subject || !htmlBody) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: audience, subject, htmlBody' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build query based on audience
    let query = supabase
      .from('profiles')
      .select('id, email, first_name')
      .not('email', 'is', null);

    if (audience === 'creators') {
      query = query.eq('account_type', 'creator').eq('onboarding_status', 'completed');
    } else if (audience === 'supporters') {
      query = query.eq('account_type', 'supporter');
    }
    // 'all' gets everyone with an email

    const { data: recipients, error: recipientError } = await query;

    if (recipientError) {
      console.error('Error fetching recipients:', recipientError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch recipients' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!recipients || recipients.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          summary: { sent: 0, failed: 0, skipped: 0, total: 0 },
          message: 'No recipients found for the selected audience'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Filter out invalid emails
    const validRecipients = recipients.filter(r => r.email && r.email.includes('@'));
    console.info('Mass email recipients prepared', {
      audience,
      total: recipients.length,
      valid: validRecipients.length,
      skipped: recipients.length - validRecipients.length,
      from: resendFrom,
    });
    
    let sent = 0;
    let failed = 0;
    const skipped = recipients.length - validRecipients.length;
    const errors: string[] = [];

    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
    const minDelayMs = 550;

    for (let i = 0; i < validRecipients.length; i++) {
      const recipient = validRecipients[i];

      const personalizedSubject = subject.replace(/\{\{first_name\}\}/g, recipient.first_name || 'there');
      const personalizedBody = htmlBody.replace(/\{\{first_name\}\}/g, recipient.first_name || 'there');

      const result = await sendEmail(
        resendApiKey,
        resendFrom,
        recipient.email,
        personalizedSubject,
        personalizedBody
      );

      await supabase.from('email_logs').insert({
        recipient_email: recipient.email,
        email_type: `mass_email_${audience}`,
        status: result.success ? 'sent' : 'failed',
        resend_id: result.id || null,
        error_message: result.error || null,
      });

      if (result.success) sent++;
      else {
        failed++;
        if (result.error) errors.push(result.error);
        console.warn('Mass email send failed', {
          audience,
          recipient_id: recipient.id,
          recipient_domain: getEmailDomain(recipient.email),
          error: result.error,
        });
      }

      if (i < validRecipients.length - 1) {
        await sleep(minDelayMs);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        summary: {
          sent,
          failed,
          skipped,
          total: recipients.length,
        },
        message: `Successfully sent ${sent} emails. Failed: ${failed}. Skipped (invalid email): ${skipped}.`,
        errors: errors.slice(0, 5), // Return first 5 errors for debugging
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Mass email error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
