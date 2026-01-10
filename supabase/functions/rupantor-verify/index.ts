import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RUPANTOR_API_URL = "https://payment.rupantorpay.com/api";

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { transaction_id, payment_method, payment_amount } = await req.json();

    console.log("Verifying transaction:", transaction_id);

    if (!transaction_id) {
      return new Response(
        JSON.stringify({ error: "transaction_id is required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('RUPANTOR_API_KEY');
    const clientHost = Deno.env.get('RUPANTOR_CLIENT_HOST');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!apiKey || !clientHost) {
      console.error("Missing RUPANTOR_API_KEY or RUPANTOR_CLIENT_HOST");
      return new Response(
        JSON.stringify({ error: "Payment gateway not configured" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify with Rupantor Pay
    const verifyResponse = await fetch(`${RUPANTOR_API_URL}/payment/verify-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': apiKey,
        'X-CLIENT': clientHost,
      },
      body: JSON.stringify({ transaction_id }),
    });

    const verifyData = await verifyResponse.json();
    console.log("Rupantor verify response:", verifyData);

    // Check for completed status - handle both string and boolean responses
    const isCompleted = verifyData.status === "COMPLETED" || verifyData.status === true || verifyData.status === 1;

    if (isCompleted) {
      // Initialize Supabase client with service role
      const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

      // Insert or update the signup record
      const { data: existingRecord, error: fetchError } = await supabase
        .from('creator_signups')
        .select('id')
        .eq('transaction_id', transaction_id)
        .maybeSingle();

      if (existingRecord) {
        // Update existing record
        const { error: updateError } = await supabase
          .from('creator_signups')
          .update({
            payment_status: 'completed',
            payment_method: verifyData.payment_method || payment_method,
            amount: parseFloat(verifyData.amount) || payment_amount,
            email: verifyData.email,
          })
          .eq('transaction_id', transaction_id);

        if (updateError) {
          console.error("Error updating record:", updateError);
        }
      } else {
        // Insert new record
        const { error: insertError } = await supabase
          .from('creator_signups')
          .insert({
            transaction_id,
            payment_status: 'completed',
            payment_method: verifyData.payment_method || payment_method,
            amount: parseFloat(verifyData.amount) || payment_amount,
            email: verifyData.email,
            currency: verifyData.currency || 'BDT',
          });

        if (insertError) {
          console.error("Error inserting record:", insertError);
        }
      }

      console.log("Payment verified and recorded for:", transaction_id);
    }

    return new Response(
      JSON.stringify({
        verified: isCompleted,
        transaction_id,
        status: verifyData.status,
        amount: verifyData.amount,
        payment_method: verifyData.payment_method,
        email: verifyData.email,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error in rupantor-verify:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
