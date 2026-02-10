import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-clerk-user-id",
};

serve(async (req) => {
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

    // Verify user exists
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, first_name, email")
      .eq("user_id", clerkUserId)
      .single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: "Profile not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { amount } = await req.json();

    if (!amount || amount < 10 || amount > 100000) {
      return new Response(
        JSON.stringify({ error: "Amount must be between 10 and 100,000" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check dummy payments mode
    const { data: dummyConfig } = await supabase
      .from("platform_config")
      .select("value")
      .eq("key", "dummy_payments")
      .maybeSingle();

    const isDummy = !!(dummyConfig?.value as any)?.enabled;

    if (isDummy) {
      // In dummy mode, directly credit the balance
      const txnId = `dummy_deposit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

      const { data: result, error: rpcError } = await supabase.rpc("process_token_deposit", {
        p_profile_id: profile.id,
        p_amount: amount,
        p_reference_id: txnId,
        p_description: `Token deposit (dummy) - ৳${amount}`,
      });

      if (rpcError) {
        console.error("RPC error:", rpcError);
        return new Response(
          JSON.stringify({ error: "Failed to process deposit" }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, dummy: true, new_balance: (result as any)?.new_balance }),
        { headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Real payment: create RupantorPay checkout
    const rupantorApiKey = Deno.env.get("RUPANTOR_API_KEY");
    const rupantorClientHost = Deno.env.get("RUPANTOR_CLIENT_HOST");

    if (!rupantorApiKey || !rupantorClientHost) {
      return new Response(
        JSON.stringify({ error: "Payment gateway not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const successUrl = `https://tipkoro.lovable.app/deposit?status=success`;
    const cancelUrl = `https://tipkoro.lovable.app/deposit?status=failed`;

    const checkoutResponse = await fetch("https://payment.rupantorpay.com/api/payment/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": rupantorApiKey,
        "X-CLIENT": rupantorClientHost,
      },
      body: JSON.stringify({
        fullname: profile.first_name || "TipKoro User",
        email: profile.email || "",
        amount,
        successUrl,
        cancelUrl,
        metadata: {
          payment_type: "token_deposit",
          profile_id: profile.id,
        },
      }),
    });

    const checkoutData = await checkoutResponse.json();

    if (!checkoutResponse.ok || !checkoutData.payment_url) {
      console.error("Checkout error:", checkoutData);
      return new Response(
        JSON.stringify({ error: "Failed to create payment" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    return new Response(
      JSON.stringify({ payment_url: checkoutData.payment_url }),
      { headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in deposit-tokens:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
