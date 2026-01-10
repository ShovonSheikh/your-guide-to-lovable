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
    const {
      transaction_id,
      username,
      first_name,
      last_name,
      email,
      bio,
      category,
      twitter,
      instagram,
      youtube,
      other_link,
      payout_method,
      phone,
    } = await req.json();

    console.log("Completing signup for transaction:", transaction_id);

    // Validate required fields
    if (!transaction_id || !username || !first_name || !last_name || !email || !bio || !category || !payout_method) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate username format
    if (!/^[a-zA-Z0-9_]{3,30}$/.test(username)) {
      return new Response(
        JSON.stringify({ error: "Invalid username format" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate name lengths
    if (first_name.length > 100) {
      return new Response(
        JSON.stringify({ error: "First name must be 100 characters or less" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (last_name.length > 100) {
      return new Response(
        JSON.stringify({ error: "Last name must be 100 characters or less" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate bio length
    if (bio.length > 200) {
      return new Response(
        JSON.stringify({ error: "Bio must be 200 characters or less" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate category length
    if (category.length > 50) {
      return new Response(
        JSON.stringify({ error: "Category must be 50 characters or less" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate URL format for social links
    const urlPattern = /^https?:\/\/.+/;
    
    if (twitter && (twitter.length > 500 || !urlPattern.test(twitter))) {
      return new Response(
        JSON.stringify({ error: "Invalid Twitter URL" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (instagram && (instagram.length > 500 || !urlPattern.test(instagram))) {
      return new Response(
        JSON.stringify({ error: "Invalid Instagram URL" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (youtube && (youtube.length > 500 || !urlPattern.test(youtube))) {
      return new Response(
        JSON.stringify({ error: "Invalid YouTube URL" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (other_link && (other_link.length > 500 || !urlPattern.test(other_link))) {
      return new Response(
        JSON.stringify({ error: "Invalid URL format for other link" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate phone format (optional, but if provided must be valid)
    if (phone && (phone.length > 20 || !/^[+\d\s()-]+$/.test(phone))) {
      return new Response(
        JSON.stringify({ error: "Invalid phone number format" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate payout_method
    const validPayoutMethods = ['bkash', 'nagad', 'rocket', 'bank'];
    if (!validPayoutMethods.includes(payout_method)) {
      return new Response(
        JSON.stringify({ error: "Invalid payout method" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const adminWebhookUrl = Deno.env.get('ADMIN_WEBHOOK_URL');

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase configuration");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if transaction exists and is completed
    const { data: existingRecord, error: fetchError } = await supabase
      .from('creator_signups')
      .select('*')
      .eq('transaction_id', transaction_id)
      .maybeSingle();

    if (fetchError) {
      console.error("Error fetching record:", fetchError);
      return new Response(
        JSON.stringify({ error: "Failed to verify payment" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!existingRecord || existingRecord.payment_status !== 'completed') {
      return new Response(
        JSON.stringify({ error: "Payment not verified" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if username is already taken
    const { data: usernameCheck } = await supabase
      .from('creator_signups')
      .select('id')
      .eq('username', username)
      .neq('transaction_id', transaction_id)
      .maybeSingle();

    if (usernameCheck) {
      return new Response(
        JSON.stringify({ error: "Username already taken" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate promo dates: signup_date + 3 months
    const signupDate = new Date();
    const activeUntil = new Date(signupDate);
    activeUntil.setMonth(activeUntil.getMonth() + 3);
    const billingStart = new Date(activeUntil);

    // Update the record with profile data
    const { error: updateError } = await supabase
      .from('creator_signups')
      .update({
        username,
        first_name,
        last_name,
        email,
        bio,
        category,
        twitter: twitter || null,
        instagram: instagram || null,
        youtube: youtube || null,
        other_link: other_link || null,
        payout_method,
        phone: phone || null,
        promo: true,
        signup_date: signupDate.toISOString(),
        active_until: activeUntil.toISOString(),
        billing_start: billingStart.toISOString(),
      })
      .eq('transaction_id', transaction_id);

    if (updateError) {
      console.error("Error updating profile:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to save profile" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("Signup completed for:", username);

    // Fire admin webhook
    if (adminWebhookUrl) {
      try {
        await fetch(adminWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'signup.completed',
            timestamp: new Date().toISOString(),
            data: {
              transaction_id,
              username,
              email,
              first_name,
              last_name,
              category,
              payout_method,
              payment_method: existingRecord.payment_method,
              amount: existingRecord.amount,
              promo: true,
              active_until: activeUntil.toISOString(),
              billing_start: billingStart.toISOString(),
            }
          }),
        });
        console.log("Admin webhook fired for signup completion");
      } catch (webhookError) {
        console.error("Failed to fire admin webhook:", webhookError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        username,
        active_until: activeUntil.toISOString(),
        billing_start: billingStart.toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error in complete-signup:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
