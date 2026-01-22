import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-clerk-user-id",
};

interface SecurityRequest {
  action: 'set-pin' | 'verify-pin' | 'send-otp' | 'verify-otp' | 'change-pin' | 'set-pin-after-otp';
  pin?: string;
  otp?: string;
  new_pin?: string;
  withdrawal_amount?: number;
}

// Rate limiting map (in production, use Redis or database)
const rateLimitMap = new Map<string, { attempts: number; lastAttempt: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 60 * 60 * 1000; // 1 hour

function checkRateLimit(profileId: string): { allowed: boolean; remainingAttempts: number } {
  const now = Date.now();
  const record = rateLimitMap.get(profileId);
  
  if (!record) {
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS };
  }
  
  // Reset if lockout period passed
  if (now - record.lastAttempt > LOCKOUT_DURATION) {
    rateLimitMap.delete(profileId);
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS };
  }
  
  if (record.attempts >= MAX_ATTEMPTS) {
    return { allowed: false, remainingAttempts: 0 };
  }
  
  return { allowed: true, remainingAttempts: MAX_ATTEMPTS - record.attempts };
}

function recordFailedAttempt(profileId: string): void {
  const record = rateLimitMap.get(profileId);
  if (record) {
    record.attempts++;
    record.lastAttempt = Date.now();
  } else {
    rateLimitMap.set(profileId, { attempts: 1, lastAttempt: Date.now() });
  }
}

function resetRateLimit(profileId: string): void {
  rateLimitMap.delete(profileId);
}

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const clerkUserId = req.headers.get("x-clerk-user-id");
    if (!clerkUserId) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - No user ID provided" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, email, first_name, withdrawal_pin_hash")
      .eq("user_id", clerkUserId)
      .single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: "Profile not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { action, pin, otp, new_pin, withdrawal_amount }: SecurityRequest = await req.json();

    // Check rate limiting
    const rateLimit = checkRateLimit(profile.id);
    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({ 
          error: "Too many failed attempts. Please try again in 1 hour.",
          locked: true 
        }),
        { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    switch (action) {
      case 'set-pin': {
        if (!pin || pin.length !== 6 || !/^\d{6}$/.test(pin)) {
          return new Response(
            JSON.stringify({ error: "PIN must be exactly 6 digits" }),
            { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        // Check if PIN already exists
        if (profile.withdrawal_pin_hash) {
          return new Response(
            JSON.stringify({ error: "PIN already set. Use change-pin action to update." }),
            { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        // Hash the PIN (use sync version as Workers not available in Deno Deploy)
        const salt = bcrypt.genSaltSync(10);
        const hashedPin = bcrypt.hashSync(pin, salt);

        // Store the hashed PIN
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ 
            withdrawal_pin_hash: hashedPin,
            withdrawal_pin_set_at: new Date().toISOString()
          })
          .eq("id", profile.id);

        if (updateError) {
          console.error("Error setting PIN:", updateError);
          return new Response(
            JSON.stringify({ error: "Failed to set PIN" }),
            { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, message: "Withdrawal PIN set successfully" }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      case 'verify-pin': {
        if (!pin || pin.length !== 6) {
          return new Response(
            JSON.stringify({ error: "Invalid PIN format" }),
            { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        if (!profile.withdrawal_pin_hash) {
          return new Response(
            JSON.stringify({ error: "No PIN set. Please set a PIN first." }),
            { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        const isValid = bcrypt.compareSync(pin, profile.withdrawal_pin_hash);

        if (!isValid) {
          recordFailedAttempt(profile.id);
          const remaining = rateLimit.remainingAttempts - 1;
          return new Response(
            JSON.stringify({ 
              error: "Incorrect PIN", 
              remaining_attempts: remaining,
              locked: remaining <= 0
            }),
            { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        // Reset rate limit on success
        resetRateLimit(profile.id);

        return new Response(
          JSON.stringify({ success: true, verified: true }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      case 'send-otp': {
        if (!profile.email) {
          return new Response(
            JSON.stringify({ error: "No email associated with profile" }),
            { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        // Check for existing unexpired OTP
        const { data: existingOtps } = await supabase
          .from("withdrawal_otps")
          .select("created_at")
          .eq("profile_id", profile.id)
          .eq("used", false)
          .gte("expires_at", new Date().toISOString())
          .order("created_at", { ascending: false })
          .limit(1);

        // Rate limit OTP sending (1 per 60 seconds)
        if (existingOtps && existingOtps.length > 0) {
          const lastSent = new Date(existingOtps[0].created_at).getTime();
          const timeSince = Date.now() - lastSent;
          if (timeSince < 60000) {
            return new Response(
              JSON.stringify({ 
                error: "Please wait before requesting another code",
                wait_seconds: Math.ceil((60000 - timeSince) / 1000)
              }),
              { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
            );
          }
        }

        // Generate and hash OTP (use sync version as Workers not available in Deno Deploy)
        const otpCode = generateOTP();
        const otpSalt = bcrypt.genSaltSync(10);
        const hashedOtp = bcrypt.hashSync(otpCode, otpSalt);
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Mark all existing OTPs as used
        await supabase
          .from("withdrawal_otps")
          .update({ used: true })
          .eq("profile_id", profile.id)
          .eq("used", false);

        // Store new OTP
        const { error: insertError } = await supabase
          .from("withdrawal_otps")
          .insert({
            profile_id: profile.id,
            otp_hash: hashedOtp,
            expires_at: expiresAt.toISOString(),
          });

        if (insertError) {
          console.error("Error storing OTP:", insertError);
          return new Response(
            JSON.stringify({ error: "Failed to generate verification code" }),
            { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        // Send OTP via email using send-email-notification function
        try {
          await supabase.functions.invoke('send-email-notification', {
            body: {
              profile_id: profile.id,
              type: 'withdrawal_otp',
              data: {
                otp_code: otpCode,
                withdrawal_amount: withdrawal_amount,
                first_name: profile.first_name,
              },
            },
          });
        } catch (emailError) {
          console.error("Error sending OTP email:", emailError);
          // Don't fail the request if email fails - user can request again
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: "Verification code sent to your email",
            expires_in_seconds: 600
          }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      case 'verify-otp': {
        if (!otp || otp.length !== 6) {
          return new Response(
            JSON.stringify({ error: "Invalid OTP format" }),
            { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        // Get the latest unused OTP
        const { data: otpRecords, error: otpError } = await supabase
          .from("withdrawal_otps")
          .select("*")
          .eq("profile_id", profile.id)
          .eq("used", false)
          .gte("expires_at", new Date().toISOString())
          .order("created_at", { ascending: false })
          .limit(1);

        if (otpError || !otpRecords || otpRecords.length === 0) {
          return new Response(
            JSON.stringify({ error: "No valid verification code found. Please request a new one." }),
            { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        const otpRecord = otpRecords[0];

        // Check attempts
        if (otpRecord.attempts >= 3) {
          await supabase
            .from("withdrawal_otps")
            .update({ used: true })
            .eq("id", otpRecord.id);

          return new Response(
            JSON.stringify({ error: "Too many incorrect attempts. Please request a new code." }),
            { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        const isValid = bcrypt.compareSync(otp, otpRecord.otp_hash);

        if (!isValid) {
          // Increment attempts
          await supabase
            .from("withdrawal_otps")
            .update({ attempts: otpRecord.attempts + 1 })
            .eq("id", otpRecord.id);

          return new Response(
            JSON.stringify({ 
              error: "Incorrect verification code",
              remaining_attempts: 3 - (otpRecord.attempts + 1)
            }),
            { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        // Mark OTP as used
        await supabase
          .from("withdrawal_otps")
          .update({ used: true })
          .eq("id", otpRecord.id);

        return new Response(
          JSON.stringify({ success: true, verified: true }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      case 'change-pin': {
        if (!pin || !new_pin) {
          return new Response(
            JSON.stringify({ error: "Both current and new PIN are required" }),
            { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        if (new_pin.length !== 6 || !/^\d{6}$/.test(new_pin)) {
          return new Response(
            JSON.stringify({ error: "New PIN must be exactly 6 digits" }),
            { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        if (!profile.withdrawal_pin_hash) {
          return new Response(
            JSON.stringify({ error: "No PIN set. Use set-pin action instead." }),
            { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        // Verify current PIN
        const isCurrentValid = bcrypt.compareSync(pin, profile.withdrawal_pin_hash);
        if (!isCurrentValid) {
          recordFailedAttempt(profile.id);
          return new Response(
            JSON.stringify({ 
              error: "Current PIN is incorrect",
              remaining_attempts: rateLimit.remainingAttempts - 1
            }),
            { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        // Hash new PIN (use sync version as Workers not available in Deno Deploy)
        const salt = bcrypt.genSaltSync(10);
        const hashedNewPin = bcrypt.hashSync(new_pin, salt);

        // Update PIN
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ 
            withdrawal_pin_hash: hashedNewPin,
            withdrawal_pin_set_at: new Date().toISOString()
          })
          .eq("id", profile.id);

        if (updateError) {
          return new Response(
            JSON.stringify({ error: "Failed to update PIN" }),
            { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        resetRateLimit(profile.id);

        return new Response(
          JSON.stringify({ success: true, message: "Withdrawal PIN updated successfully" }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      case 'set-pin-after-otp': {
        // This action allows setting a new PIN after OTP verification
        // Used when changing PIN via OTP flow (forgot PIN or change PIN)
        if (!new_pin || new_pin.length !== 6 || !/^\d{6}$/.test(new_pin)) {
          return new Response(
            JSON.stringify({ error: "New PIN must be exactly 6 digits" }),
            { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        // Verify that OTP was recently verified (within last 10 minutes)
        const { data: recentOtps, error: otpCheckError } = await supabase
          .from("withdrawal_otps")
          .select("*")
          .eq("profile_id", profile.id)
          .eq("used", true)
          .order("created_at", { ascending: false })
          .limit(1);

        if (otpCheckError || !recentOtps || recentOtps.length === 0) {
          return new Response(
            JSON.stringify({ error: "Please verify with OTP first" }),
            { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        const lastOtp = recentOtps[0];
        const otpUsedTime = new Date(lastOtp.created_at).getTime();
        const tenMinutesAgo = Date.now() - 10 * 60 * 1000;

        if (otpUsedTime < tenMinutesAgo) {
          return new Response(
            JSON.stringify({ error: "OTP verification expired. Please verify again." }),
            { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        // Hash new PIN
        const salt = bcrypt.genSaltSync(10);
        const hashedNewPin = bcrypt.hashSync(new_pin, salt);

        // Update PIN
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ 
            withdrawal_pin_hash: hashedNewPin,
            withdrawal_pin_set_at: new Date().toISOString()
          })
          .eq("id", profile.id);

        if (updateError) {
          return new Response(
            JSON.stringify({ error: "Failed to update PIN" }),
            { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, message: "Withdrawal PIN set successfully" }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: "Invalid action" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
    }
  } catch (error: any) {
    console.error("Error in withdrawal-security:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
