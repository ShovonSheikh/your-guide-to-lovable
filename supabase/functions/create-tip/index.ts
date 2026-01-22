import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RUPANTOR_API_URL = "https://payment.rupantorpay.com/api";

// Simple in-memory rate limiting (per IP, 10 requests per minute)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10;
const RATE_LIMIT_WINDOW = 60000; // 1 minute

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return false;
  }
  
  if (record.count >= RATE_LIMIT) {
    return true;
  }
  
  record.count++;
  return false;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
    if (isRateLimited(clientIP)) {
      return new Response(
        JSON.stringify({ error: "Too many requests. Please try again later." }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const {
      transaction_id,
      creator_id,
      supporter_name,
      supporter_email,
      amount,
      message,
      is_anonymous,
      payment_method,
    } = await req.json();

    console.log("Creating tip for transaction:", transaction_id);

    // Validate required fields
    if (!transaction_id || !creator_id || !supporter_name || !supporter_email || !amount) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate transaction_id format (basic check)
    if (typeof transaction_id !== 'string' || transaction_id.length < 5 || transaction_id.length > 100) {
      return new Response(
        JSON.stringify({ error: "Invalid transaction ID format" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate creator_id is UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(creator_id)) {
      return new Response(
        JSON.stringify({ error: "Invalid creator ID format" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate supporter_name
    if (typeof supporter_name !== 'string' || supporter_name.length < 1 || supporter_name.length > 100) {
      return new Response(
        JSON.stringify({ error: "Supporter name must be 1-100 characters" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(supporter_email) || supporter_email.length > 254) {
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate amount
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount < 1 || parsedAmount > 1000000) {
      return new Response(
        JSON.stringify({ error: "Amount must be between 1 and 1,000,000" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate message (optional, but if provided, limit length)
    if (message && (typeof message !== 'string' || message.length > 500)) {
      return new Response(
        JSON.stringify({ error: "Message must be 500 characters or less" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('RUPANTOR_API_KEY');
    const clientHost = Deno.env.get('RUPANTOR_CLIENT_HOST');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase configuration");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if tip already exists for this transaction (prevent duplicates)
    const { data: existingTip } = await supabase
      .from('tips')
      .select('id')
      .eq('transaction_id', transaction_id)
      .maybeSingle();

    if (existingTip) {
      return new Response(
        JSON.stringify({ success: true, message: "Tip already recorded" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the creator exists
    const { data: creator, error: creatorError } = await supabase
      .from('profiles')
      .select('id, account_type, total_received, total_supporters, email')
      .eq('id', creator_id)
      .maybeSingle();

    if (creatorError || !creator) {
      return new Response(
        JSON.stringify({ error: "Creator not found" }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prevent self-tipping: check if supporter email matches creator email
    if (creator.email && supporter_email.toLowerCase() === creator.email.toLowerCase()) {
      return new Response(
        JSON.stringify({ error: "You cannot tip yourself" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // For non-dummy transactions, verify with Rupantor API
    const isDummyPayment = transaction_id.startsWith('dummy_');
    
    if (!isDummyPayment && apiKey && clientHost) {
      try {
        console.log("Verifying payment with Rupantor API:", transaction_id);
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

        const isCompleted = verifyData.status === "COMPLETED" || verifyData.status === true || verifyData.status === 1;
        
        if (!isCompleted) {
          console.error("Payment not verified:", verifyData);
          return new Response(
            JSON.stringify({ error: "Payment not verified" }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } catch (verifyError) {
        console.error("Error verifying payment:", verifyError);
        return new Response(
          JSON.stringify({ error: "Payment verification failed" }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Insert the tip
    const { data: tip, error: insertError } = await supabase
      .from('tips')
      .insert({
        transaction_id,
        creator_id,
        supporter_name,
        supporter_email,
        amount: parsedAmount,
        message: message || null,
        is_anonymous: is_anonymous || false,
        payment_status: 'completed',
        payment_method: payment_method || null,
      })
      .select('id')
      .single();

    if (insertError) {
      console.error("Error inserting tip:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to record tip" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Note: Creator stats (total_received, total_supporters) are updated 
    // by the database trigger 'update_creator_stats_on_tip' which correctly
    // handles unique supporter counting based on email

    console.log("Tip created successfully:", tip.id);

    // Get creator profile for name
    const { data: creator_profile } = await supabase
      .from('profiles')
      .select('first_name, username')
      .eq('id', creator_id)
      .single();

    // Send email notification to creator
    try {
      await supabase.functions.invoke('send-email-notification', {
        body: {
          profile_id: creator_id,
          type: 'tip_received',
          data: {
            amount: parsedAmount,
            supporter_name: is_anonymous ? 'Anonymous' : supporter_name,
            message: message || null,
            tip_id: tip.id,
          },
        },
      });
      console.log("Email notification sent to creator");
    } catch (notifError) {
      // Don't fail the tip creation if notification fails
      console.log("Creator email notification failed (non-critical):", notifError);
    }

    // Send confirmation email to supporter
    try {
      await supabase.functions.invoke('send-email-notification', {
        body: {
          email: supporter_email, // Direct email for non-registered supporters
          type: 'tip_sent',
          data: {
            amount: parsedAmount,
            creator_name: creator_profile?.first_name || creator_profile?.username || 'a creator',
            message: message || null,
          },
        },
      });
      console.log("Confirmation email sent to supporter");
    } catch (notifError) {
      console.log("Supporter email notification failed (non-critical):", notifError);
    }

    return new Response(
      JSON.stringify({ success: true, tip_id: tip.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error in create-tip:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
