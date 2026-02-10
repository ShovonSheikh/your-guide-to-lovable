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

    // Determine payment type from metadata or check both tables
    const paymentType = payload.metadata?.payment_type || payload.payment_type;

    if (paymentType === 'token_deposit') {
      // Handle token deposit
      const profileId = payload.metadata?.profile_id;
      if (profileId && verifiedStatus === 'completed') {
        const { error: rpcError } = await supabase.rpc("process_token_deposit", {
          p_profile_id: profileId,
          p_amount: parseFloat(verifiedAmount),
          p_reference_id: transactionId,
          p_description: `Token deposit - ৳${verifiedAmount}`,
        });
        if (rpcError) {
          console.error("Error processing token deposit:", rpcError);
        } else {
          console.log(`Token deposit processed: ${profileId} +${verifiedAmount}`);
        }
      }
      console.log(`Token deposit webhook processed: ${transactionId} -> ${verifiedStatus}`);
    } else if (paymentType === 'tip') {
      // Handle tip payment
      const { data: existingTip } = await supabase
        .from('tips')
        .select('id')
        .eq('transaction_id', transactionId)
        .maybeSingle();

      if (existingTip) {
        const { error: updateError } = await supabase
          .from('tips')
          .update({
            payment_status: verifiedStatus,
            payment_method: paymentMethod,
            amount: verifiedAmount ? parseFloat(verifiedAmount) : null,
          })
          .eq('transaction_id', transactionId);

        if (updateError) {
          console.error("Error updating tip from webhook:", updateError);
        } else if (verifiedStatus === 'completed') {
          // Increment creator stats on successful tip
          const tip = await supabase.from('tips').select('creator_id, supporter_email, supporter_name, amount').eq('id', existingTip.id).single();
          if (tip.data) {
            await supabase.rpc('increment_creator_stats', {
              creator_profile_id: tip.data.creator_id,
              tip_amount: tip.data.amount,
              is_new_supporter: true // Simplified - could check if truly new
            });

            // Helper to update goal progress and send milestone notifications
            const updateGoalProgress = async (creatorId: string, tipAmount: number) => {
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

                  // Get creator details for email
                  const { data: creator } = await supabase
                    .from('profiles')
                    .select('first_name, username, email')
                    .eq('id', creatorId)
                    .single();

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
                      profile_id: creatorId,
                      type: milestoneType,
                      data: {
                        goal_title: goal.title,
                        milestone: milestoneCrossed,
                        current_amount: newAmount,
                        target_amount: goal.target_amount,
                        percentage: newPercentage,
                        first_name: creator?.first_name || creator?.username || 'Creator',
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

            // Run async update
            updateGoalProgress(tip.data.creator_id, tip.data.amount);
          }
        }
      }
      console.log(`Tip webhook processed: ${transactionId} -> ${verifiedStatus}`);
    } else {
      // Handle creator signup payment (default)
      const { data: existingRecord } = await supabase
        .from('creator_signups')
        .select('id')
        .eq('transaction_id', transactionId)
        .maybeSingle();

      if (existingRecord) {
        const { error: updateError } = await supabase
          .from('creator_signups')
          .update({
            payment_status: verifiedStatus,
            payment_method: paymentMethod,
            amount: verifiedAmount ? parseFloat(verifiedAmount) : null,
          })
          .eq('transaction_id', transactionId);

        if (updateError) {
          console.error("Error updating creator signup from webhook:", updateError);
        }
      } else {
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
          console.error("Error inserting creator signup from webhook:", insertError);
        }
      }
      console.log(`Creator signup webhook processed: ${transactionId} -> ${verifiedStatus}`);
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
