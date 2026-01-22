// Clerk webhook handler — adapted to your current "profiles" table schema
import { Webhook } from "https://esm.sh/svix@1.15.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, svix-id, svix-timestamp, svix-signature',
  'Content-Type': 'application/json',
};

console.info('Clerk webhook function starting');

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const CLERK_WEBHOOK_SECRET = Deno.env.get('CLERK_WEBHOOK_SECRET')!;

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !CLERK_WEBHOOK_SECRET) {
      console.error('Missing required environment variables');
      return new Response(JSON.stringify({ error: 'Server not configured' }), { status: 500, headers: corsHeaders });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Verify Svix signature
    const svixId = req.headers.get('svix-id');
    const svixTimestamp = req.headers.get('svix-timestamp');
    const svixSignature = req.headers.get('svix-signature');

    if (!svixId || !svixTimestamp || !svixSignature) {
      console.error('Missing svix headers');
      return new Response(JSON.stringify({ error: 'Missing webhook signature headers' }), { status: 401, headers: corsHeaders });
    }

    const rawBody = await req.text();
    const wh = new Webhook(CLERK_WEBHOOK_SECRET);

    let payload: any;
    try {
      payload = wh.verify(rawBody, {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      }) as any;
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 401, headers: corsHeaders });
    }

    console.info('Webhook event type:', payload.type);

    // Helper to generate a unique username
    const generateUsername = (userData: any): string | null => {
      // Priority 1: Clerk username if set
      if (userData.username) {
        return userData.username;
      }
      
      // Priority 2: Email prefix
      const email = userData.email_addresses?.[0]?.email_address;
      if (email) {
        const prefix = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
        return prefix || null;
      }
      
      // Priority 3: First name + random suffix
      if (userData.first_name) {
        const cleanName = userData.first_name.toLowerCase().replace(/[^a-z0-9]/g, '');
        const suffix = Math.random().toString(36).substring(2, 6);
        return `${cleanName}${suffix}`;
      }
      
      // Priority 4: Random username
      return `user${Math.random().toString(36).substring(2, 8)}`;
    };

    // Helper to map Clerk user object to your profiles columns
    const mapClerkToProfile = (userData: any) => {
      const email = userData.email_addresses?.[0]?.email_address || null;
      const username = generateUsername(userData);
      
      console.log('Mapping Clerk user to profile:', {
        clerkId: userData.id,
        clerkUsername: userData.username,
        email,
        generatedUsername: username,
      });
      
      return {
        user_id: userData.id, // store Clerk ID in user_id column
        email,
        first_name: userData.first_name || null,
        last_name: userData.last_name || null,
        username,
        bio: null,
        avatar_url: userData.image_url || null,
        // Set onboarding_status to account_type step - user must choose account type
        onboarding_status: 'account_type',
        // DO NOT set account_type here - let user choose during onboarding
        // keep social fields if Clerk provides (Clerk may not)
        twitter: userData.twitter || null,
        instagram: userData.instagram || null,
        youtube: userData.youtube || null,
        facebook: userData.facebook || null,
        other_link: userData.other_link || null,
        is_verified: false,
      };
    };

    // user.created — insert or upsert
    if (payload.type === 'user.created') {
      const userData = payload.data;
      const profile = mapClerkToProfile(userData);

      // Upsert by user_id to be idempotent
      const { data: upserted, error: upsertError } = await supabase
        .from('profiles')
        .upsert(profile, { onConflict: 'user_id' })
        .select()
        .single()
        ;

      if (upsertError) {
        console.error('Error upserting profile:', upsertError);
        return new Response(JSON.stringify({ error: upsertError.message }), { status: 500, headers: corsHeaders });
      }

      console.info('Profile upserted:', upserted);

      // Send welcome email to new users
      try {
        const { error: emailError } = await supabase.functions.invoke('send-email-notification', {
          body: {
            email: profile.email,
            type: 'welcome_user',
            data: { 
              first_name: profile.first_name || 'there',
            },
          },
        });
        if (emailError) {
          console.warn('Welcome email failed (non-critical):', emailError);
        } else {
          console.info('Welcome email sent to:', profile.email);
        }
      } catch (e) {
        console.warn('Welcome email failed (non-critical):', e);
      }

      return new Response(JSON.stringify({ success: true, profile: upserted }), { status: 200, headers: corsHeaders });
    }

    // user.updated — update existing profile by user_id
    if (payload.type === 'user.updated') {
      const userData = payload.data;
      const userId = userData.id;
      const updates = {
        email: userData.email_addresses?.[0]?.email_address || null,
        username: userData.username || null,
        first_name: userData.first_name || null,
        last_name: userData.last_name || null,
        avatar_url: userData.image_url || null,
      };

      const { error: updateError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', userId);

      if (updateError) {
        console.error('Error updating profile:', updateError);
        return new Response(JSON.stringify({ error: updateError.message }), { status: 500, headers: corsHeaders });
      }

      console.info('Profile updated for user_id:', userId);
      return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });
    }

    // user.deleted — delete profile by user_id
    if (payload.type === 'user.deleted') {
      const userId = payload.data.id;

      // Attempt delete
      const { data: deletedRows, error: deleteError } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', userId)
        .select();

      if (deleteError) {
        console.error('Error deleting profile:', deleteError);
        return new Response(JSON.stringify({ error: deleteError.message }), { status: 500, headers: corsHeaders });
      }

      if (!deletedRows || deletedRows.length === 0) {
        console.warn('No profile found to delete for user_id:', userId);
        return new Response(JSON.stringify({ success: false, message: 'Profile not found', user_id: userId }), { status: 404, headers: corsHeaders });
      }

      console.info('Profile deleted for user_id:', userId);
      return new Response(JSON.stringify({ success: true, deleted: true, rowsDeleted: deletedRows.length, deletedProfile: deletedRows[0] }), { status: 200, headers: corsHeaders });
    }

    // Unhandled event
    return new Response(JSON.stringify({ message: 'Event not handled' }), { status: 200, headers: corsHeaders });
  } catch (err: any) {
    console.error('Webhook handler error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Unknown error' }), { status: 500, headers: corsHeaders });
  }
});