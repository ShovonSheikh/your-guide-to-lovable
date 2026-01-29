import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RUPANTOR_API_URL = "https://payment.rupantorpay.com/api";

// Rate limiting configuration
const RATE_LIMIT = 10;
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute

// Database-backed rate limiting to persist across function restarts
async function checkAndUpdateRateLimit(
  supabase: any,
  identifier: string,
  action: string
): Promise<{ allowed: boolean; remaining: number }> {
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
  
  try {
    // Check existing rate limit record within the current window
    const { data: existingRecord, error: selectError } = await supabase
      .from('rate_limits')
      .select('id, count, window_start')
      .eq('action', action)
      .eq('identifier', identifier)
      .gte('window_start', windowStart)
      .order('window_start', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (selectError) {
      console.error("Rate limit check error:", selectError);
      // Allow request on error to prevent blocking legitimate users
      return { allowed: true, remaining: RATE_LIMIT };
    }

    if (existingRecord) {
      // Record exists within window
      if (existingRecord.count >= RATE_LIMIT) {
        return { allowed: false, remaining: 0 };
      }
      
      // Increment count
      await supabase
        .from('rate_limits')
        .update({ 
          count: existingRecord.count + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingRecord.id);
      
      return { allowed: true, remaining: RATE_LIMIT - existingRecord.count - 1 };
    }
    
    // No record exists, create a new one
    await supabase
      .from('rate_limits')
      .insert({
        action,
        identifier,
        count: 1,
        window_start: new Date().toISOString()
      });
    
    return { allowed: true, remaining: RATE_LIMIT - 1 };
  } catch (error) {
    console.error("Rate limit error:", error);
    // Allow request on error to prevent blocking legitimate users
    return { allowed: true, remaining: RATE_LIMIT };
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    // Database-backed rate limiting
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
    const rateLimit = await checkAndUpdateRateLimit(supabase, clientIP, 'create_tip');
    
    if (!rateLimit.allowed) {
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

    // Helper to update goal progress and send milestone notifications
    const updateGoalProgress = async (creatorId: string, tipAmount: number, supporterName: string, creatorName: string, creatorEmail: string) => {
      try {
        // Fetch active goal
        const { data: goals } = await supabase
          .from('funding_goals')
          .select('*')
          .eq('profile_id', creatorId)
          .eq('is_active', true)
          .limit(1);

        if (!goals || goals.length === 0) return;

        const goal = goals[0];
        if (!goal.target_amount || goal.target_amount <= 0) return;

        // Calculate progress
        const oldAmount = goal.current_amount || 0;
        const newAmount = oldAmount + tipAmount;

        const oldPercentage = (oldAmount / goal.target_amount) * 100;
        const newPercentage = (newAmount / goal.target_amount) * 100;

        // Update goal amount
        await supabase
          .from('funding_goals')
          .update({
            current_amount: newAmount,
            updated_at: new Date().toISOString()
          })
          .eq('id', goal.id);

        console.log(`Goal updated: ${oldAmount} -> ${newAmount} (${oldPercentage.toFixed(1)}% -> ${newPercentage.toFixed(1)}%)`);

        // Check for milestones (25, 50, 75, 100)
        let milestoneCrossed: number | null = null;
        let milestoneType: string | null = null;

        if (oldPercentage < 100 && newPercentage >= 100) {
          milestoneCrossed = 100;
          milestoneType = 'goal_milestone_100';
        } else if (oldPercentage < 75 && newPercentage >= 75 && newPercentage < 100) {
          milestoneCrossed = 75;
          milestoneType = 'goal_milestone_75';
        } else if (oldPercentage < 50 && newPercentage >= 50 && newPercentage < 75) {
          milestoneCrossed = 50;
          milestoneType = 'goal_milestone_50';
        } else if (oldPercentage < 25 && newPercentage >= 25 && newPercentage < 50) {
          milestoneCrossed = 25;
          milestoneType = 'goal_milestone_25';
        }

        if (milestoneCrossed && milestoneType) {
          console.log(`Goal milestone reached: ${milestoneCrossed}%`);

          // Insert database notification
          await supabase.from('notifications').insert({
            profile_id: creatorId,
            type: milestoneType,
            title: milestoneCrossed === 100 ? '🎉 Goal Achieved!' : `🎯 Goal Progress: ${milestoneCrossed}%`,
            message: `${goal.title} reached ${milestoneCrossed}%`,
            data: {
              goal_id: goal.id,
              goal_title: goal.title,
              milestone: milestoneCrossed,
              current_amount: newAmount,
              target_amount: goal.target_amount,
              percentage: newPercentage
            }
          });

          // Send email notification
          await supabase.functions.invoke('send-email-notification', {
            body: {
              profile_id: creatorId, // Send to creator based on ID
              type: milestoneType,
              data: {
                goal_title: goal.title,
                milestone: milestoneCrossed,
                current_amount: newAmount,
                target_amount: goal.target_amount,
                percentage: newPercentage,
                first_name: creatorName,
                url: `https://tipkoro.com/dashboard`
              },
            },
          });
          console.log(`Milestone email sent: ${milestoneType}`);
        }
      } catch (err) {
        console.error("Error updating goal progress:", err);
      }
    };

    // Define background tasks
    const processPostTipActions = async () => {
      // 1. Send email notification to creator
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
        console.log("Creator email notification failed (non-critical):", notifError);
      }

      // 2. Send confirmation email to supporter
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

      // 3. Update goal progress
      if (creator_profile) {
        await updateGoalProgress(
          creator_id,
          parsedAmount,
          supporter_name,
          creator_profile.first_name || creator_profile.username || 'Creator',
          creator.email
        );
      }
    };

    // Execute background tasks without awaiting (fire-and-forget)
    // This allows the response to be returned immediately while tasks run in background
    processPostTipActions().catch(e => console.error("Background task error:", e));

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
