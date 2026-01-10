import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    console.log("Rupantor webhook received:", payload);

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const adminWebhookUrl = Deno.env.get('ADMIN_WEBHOOK_URL');
    const rupantorApiKey = Deno.env.get('RUPANTOR_API_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase configuration");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const transactionId = payload.transaction_id || payload.transactionId;
    const paymentMethod = payload.payment_method || payload.paymentMethod;
    const amount = payload.amount;

    if (!transactionId) {
      console.error("Missing transaction_id in webhook payload");
      return new Response(
        JSON.stringify({ error: "Missing transaction_id" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // SECURITY: Verify the transaction with Rupantor API instead of trusting webhook data
    // This prevents attackers from sending fake webhook payloads
    let verifiedStatus = 'pending';
    let verifiedAmount = amount;
    
    if (rupantorApiKey) {
      try {
        console.log("Verifying transaction with Rupantor API:", transactionId);
        const verifyResponse = await fetch("https://api.rupantorpay.com/api/v1/verify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            api_key: rupantorApiKey,
            transaction_id: transactionId,
          }),
        });

        const verifyData = await verifyResponse.json();
        console.log("Rupantor verification response:", verifyData);

        // Trust the verified status from API, not the webhook payload
        const isVerified = verifyData.status === true || verifyData.status === 1;
        if (isVerified && verifyData.transaction_status === "COMPLETED") {
          verifiedStatus = 'completed';
          verifiedAmount = verifyData.amount || amount;
        } else if (verifyData.transaction_status === "FAILED" || verifyData.transaction_status === "ERROR") {
          verifiedStatus = 'failed';
        }
        // If verification fails or status is pending, keep as 'pending'
      } catch (verifyError) {
        console.error("Failed to verify with Rupantor API:", verifyError);
        // On verification failure, don't update status - keep as pending for safety
        return new Response(
          JSON.stringify({ error: "Verification failed" }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      console.warn("RUPANTOR_API_KEY not set - cannot verify webhook, rejecting for security");
      return new Response(
        JSON.stringify({ error: "Webhook verification not configured" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if record exists
    const { data: existingRecord } = await supabase
      .from('creator_signups')
      .select('id')
      .eq('transaction_id', transactionId)
      .maybeSingle();

    if (existingRecord) {
      // Update existing record with VERIFIED status
      const { error: updateError } = await supabase
        .from('creator_signups')
        .update({
          payment_status: verifiedStatus,
          payment_method: paymentMethod,
          amount: verifiedAmount ? parseFloat(verifiedAmount) : null,
        })
        .eq('transaction_id', transactionId);

      if (updateError) {
        console.error("Error updating from webhook:", updateError);
      }
    } else {
      // Insert new record with VERIFIED status
      const { error: insertError } = await supabase
        .from('creator_signups')
        .insert({
          transaction_id: transactionId,
          payment_status: verifiedStatus,
          payment_method: paymentMethod,
          amount: verifiedAmount ? parseFloat(verifiedAmount) : null,
          email: payload.email,
        });

      if (insertError) {
        console.error("Error inserting from webhook:", insertError);
      }
    }

    console.log(`Webhook processed and verified: ${transactionId} -> ${verifiedStatus}`);

    // Fire admin webhook if configured and payment completed
    if (adminWebhookUrl && verifiedStatus === 'completed') {
      try {
        await fetch(adminWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'payment.completed',
            timestamp: new Date().toISOString(),
            data: {
              transaction_id: transactionId,
              payment_method: paymentMethod,
              amount: verifiedAmount,
              email: payload.email,
            }
          }),
        });
        console.log("Admin webhook fired successfully");
      } catch (webhookError) {
        console.error("Failed to fire admin webhook:", webhookError);
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error in rupantor-webhook:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
