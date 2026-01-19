import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreatorWeeklyData {
  profile_id: string;
  email: string;
  first_name: string | null;
  username: string | null;
  week_tips_count: number;
  week_earnings: number;
  new_supporters: number;
  previous_week_earnings: number;
  top_supporters: Array<{ name: string; amount: number }>;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('[WEEKLY-SUMMARY] Starting weekly summary job...');

    // Calculate date ranges
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);
    weekStart.setHours(0, 0, 0, 0);
    
    const prevWeekStart = new Date(weekStart);
    prevWeekStart.setDate(prevWeekStart.getDate() - 7);

    const weekStartISO = weekStart.toISOString();
    const prevWeekStartISO = prevWeekStart.toISOString();
    const nowISO = now.toISOString();

    console.log(`[WEEKLY-SUMMARY] Week range: ${weekStartISO} to ${nowISO}`);
    console.log(`[WEEKLY-SUMMARY] Prev week range: ${prevWeekStartISO} to ${weekStartISO}`);

    // Get all active creators
    const { data: creators, error: creatorsError } = await supabase
      .from('profiles')
      .select('id, email, first_name, username')
      .eq('account_type', 'creator')
      .eq('onboarding_status', 'completed')
      .not('email', 'is', null);

    if (creatorsError) {
      console.error('[WEEKLY-SUMMARY] Error fetching creators:', creatorsError);
      throw creatorsError;
    }

    console.log(`[WEEKLY-SUMMARY] Found ${creators?.length || 0} active creators`);

    if (!creators || creators.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No active creators found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let emailsSent = 0;
    let emailsFailed = 0;

    for (const creator of creators) {
      try {
        // Get this week's tips
        const { data: weekTips } = await supabase
          .from('tips')
          .select('amount, supporter_name, payment_status')
          .eq('creator_id', creator.id)
          .eq('payment_status', 'completed')
          .gte('created_at', weekStartISO)
          .lt('created_at', nowISO);

        // Get previous week's tips for comparison
        const { data: prevWeekTips } = await supabase
          .from('tips')
          .select('amount')
          .eq('creator_id', creator.id)
          .eq('payment_status', 'completed')
          .gte('created_at', prevWeekStartISO)
          .lt('created_at', weekStartISO);

        // Calculate stats
        const weekTipsCount = weekTips?.length || 0;
        const weekEarnings = weekTips?.reduce((sum, t) => sum + t.amount, 0) || 0;
        const prevWeekEarnings = prevWeekTips?.reduce((sum, t) => sum + t.amount, 0) || 0;

        // Get new supporters (unique supporters who gave their first tip this week)
        const { data: allTimeTips } = await supabase
          .from('tips')
          .select('supporter_name, created_at')
          .eq('creator_id', creator.id)
          .eq('payment_status', 'completed')
          .order('created_at', { ascending: true });

        const supporterFirstTip: Record<string, string> = {};
        allTimeTips?.forEach(tip => {
          if (!supporterFirstTip[tip.supporter_name]) {
            supporterFirstTip[tip.supporter_name] = tip.created_at;
          }
        });

        const newSupporters = Object.entries(supporterFirstTip).filter(
          ([_, firstDate]) => new Date(firstDate) >= weekStart && new Date(firstDate) < now
        ).length;

        // Get top 3 supporters this week
        const supporterTotals: Record<string, number> = {};
        weekTips?.forEach(tip => {
          supporterTotals[tip.supporter_name] = (supporterTotals[tip.supporter_name] || 0) + tip.amount;
        });

        const topSupporters = Object.entries(supporterTotals)
          .map(([name, amount]) => ({ name, amount }))
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 3);

        // Only send if there was some activity or it's been a while
        // For now, send to all creators weekly regardless of activity
        console.log(`[WEEKLY-SUMMARY] Creator ${creator.username}: ${weekTipsCount} tips, ৳${weekEarnings} earned`);

        // Send summary email via send-email-notification function
        const { error: emailError } = await supabase.functions.invoke('send-email-notification', {
          body: {
            profile_id: creator.id,
            type: 'weekly_summary',
            data: {
              creator_name: creator.first_name || 'Creator',
              week_tips_count: weekTipsCount,
              week_earnings: weekEarnings,
              new_supporters: newSupporters,
              previous_week_earnings: prevWeekEarnings,
              top_supporters: topSupporters.length > 0 ? topSupporters : undefined,
            },
          },
        });

        if (emailError) {
          console.error(`[WEEKLY-SUMMARY] Failed to send email to ${creator.email}:`, emailError);
          emailsFailed++;
        } else {
          console.log(`[WEEKLY-SUMMARY] Email sent to ${creator.email}`);
          emailsSent++;
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (creatorError) {
        console.error(`[WEEKLY-SUMMARY] Error processing creator ${creator.id}:`, creatorError);
        emailsFailed++;
      }
    }

    console.log(`[WEEKLY-SUMMARY] Job complete. Sent: ${emailsSent}, Failed: ${emailsFailed}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: emailsSent,
        failed: emailsFailed,
        total: creators.length
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("[WEEKLY-SUMMARY] Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
