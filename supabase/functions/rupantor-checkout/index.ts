import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { 
      fullname, 
      email, 
      amount = 150, 
      successUrl, 
      cancelUrl, 
      reference_id,
      payment_type = 'creator_fee', // 'creator_fee' or 'tip'
      creator_id,
      supporter_name,
      message
    } = await req.json();

    console.log("Creating checkout for:", { fullname, email, amount, payment_type });

    // Validate required fields
    if (!fullname || !email) {
      return new Response(
        JSON.stringify({ error: "fullname and email are required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate amount based on payment type
    if (payment_type === 'creator_fee') {
      if (amount !== 150) {
        return new Response(
          JSON.stringify({ error: "Creator account fee must be ৳150" }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else if (payment_type === 'tip') {
      if (!creator_id) {
        return new Response(
          JSON.stringify({ error: "creator_id is required for tips" }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (amount < 10 || amount > 100000) {
        return new Response(
          JSON.stringify({ error: "Tip amount must be between ৳10 and ৳100,000" }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const apiKey = Deno.env.get('RUPANTOR_API_KEY');
    const clientHost = Deno.env.get('RUPANTOR_CLIENT_HOST');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');

    if (!apiKey || !clientHost) {
      console.error("Missing RUPANTOR_API_KEY or RUPANTOR_CLIENT_HOST");
      return new Response(
        JSON.stringify({ error: "Payment gateway not configured" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build webhook URL
    const webhookUrl = `${supabaseUrl}/functions/v1/rupantor-webhook`;

    // Build metadata based on payment type
    const metadata: Record<string, any> = {
      payment_type,
      plan: payment_type === 'creator_fee' ? 'month_1' : undefined,
    };

    if (payment_type === 'creator_fee') {
      metadata.signup_type = 'creator_promo';
      metadata.reference_id = reference_id || null;
    } else if (payment_type === 'tip') {
      metadata.creator_id = creator_id;
      metadata.supporter_name = supporter_name || fullname;
      metadata.supporter_email = email;
      metadata.message = message || null;
    }

    // Call Rupantor Pay checkout API
    const checkoutResponse = await fetch(`${RUPANTOR_API_URL}/payment/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': apiKey,
        'X-CLIENT': clientHost,
      },
      body: JSON.stringify({
        fullname,
        email,
        amount,
        success_url: successUrl,
        cancel_url: cancelUrl,
        webhook_url: webhookUrl,
        meta_data: metadata
      }),
    });

    const checkoutData = await checkoutResponse.json();
    console.log("Rupantor checkout response:", checkoutData);

    // Check for success: status can be true (boolean) or 1 (number)
    const isSuccess = checkoutData.status === true || checkoutData.status === 1;
    if (!isSuccess || !checkoutData.payment_url) {
      console.error("Checkout failed:", checkoutData);
      return new Response(
        JSON.stringify({ error: checkoutData.message || "Failed to create payment link" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        payment_url: checkoutData.payment_url,
        message: checkoutData.message
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error in rupantor-checkout:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});