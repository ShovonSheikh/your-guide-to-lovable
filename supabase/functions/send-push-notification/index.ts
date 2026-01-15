import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode as base64UrlEncode } from "https://deno.land/std@0.168.0/encoding/base64url.ts";
import { decode as base64Decode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper to convert base64url to Uint8Array
function base64UrlToUint8Array(base64UrlString: string): Uint8Array {
  const padding = '='.repeat((4 - (base64UrlString.length % 4)) % 4);
  const base64 = (base64UrlString + padding).replace(/-/g, '+').replace(/_/g, '/');
  return base64Decode(base64);
}

// Helper to convert Uint8Array to base64url
function uint8ArrayToBase64Url(uint8Array: Uint8Array): string {
  return base64UrlEncode(uint8Array);
}

// Create VAPID JWT token
async function createVapidJwt(
  audience: string,
  subject: string,
  vapidPrivateKey: string,
  vapidPublicKey: string,
  expiration: number
): Promise<string> {
  const header = {
    typ: 'JWT',
    alg: 'ES256',
  };

  const payload = {
    aud: audience,
    exp: expiration,
    sub: subject,
  };

  const headerB64 = uint8ArrayToBase64Url(new TextEncoder().encode(JSON.stringify(header)));
  const payloadB64 = uint8ArrayToBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  const unsignedToken = `${headerB64}.${payloadB64}`;

  // Import the private key as JWK
  // VAPID private key is 32 bytes (the "d" parameter)
  // VAPID public key is 65 bytes (04 + x + y, where x and y are 32 bytes each)
  const publicKeyBytes = base64UrlToUint8Array(vapidPublicKey);

  // Extract x and y from public key (skip the 0x04 prefix)
  const x = publicKeyBytes.slice(1, 33);
  const y = publicKeyBytes.slice(33, 65);

  const jwk = {
    kty: 'EC',
    crv: 'P-256',
    d: vapidPrivateKey, // Already base64url encoded
    x: uint8ArrayToBase64Url(x),
    y: uint8ArrayToBase64Url(y),
  };

  const cryptoKey = await crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );

  // Sign the token
  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    cryptoKey,
    new TextEncoder().encode(unsignedToken)
  );

  // Convert signature from DER to raw format (64 bytes)
  const signatureB64 = uint8ArrayToBase64Url(new Uint8Array(signature));

  return `${unsignedToken}.${signatureB64}`;
}

// Encrypt the push payload using ECDH + AES-GCM
async function encryptPayload(
  payload: string,
  p256dhKey: string,
  authSecret: string
): Promise<{ ciphertext: Uint8Array; salt: Uint8Array; localPublicKey: Uint8Array }> {
  // Generate local key pair
  const localKeyPair = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveBits']
  );

  // Export local public key
  const localPublicKeyRaw = await crypto.subtle.exportKey('raw', localKeyPair.publicKey);
  const localPublicKey = new Uint8Array(localPublicKeyRaw);

  // Import subscriber's public key
  const subscriberPublicKeyBytes = base64UrlToUint8Array(p256dhKey);
  const subscriberPublicKey = await crypto.subtle.importKey(
    'raw',
    subscriberPublicKeyBytes,
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    []
  );

  // Derive shared secret
  const sharedSecretBits = await crypto.subtle.deriveBits(
    { name: 'ECDH', public: subscriberPublicKey },
    localKeyPair.privateKey,
    256
  );
  const sharedSecret = new Uint8Array(sharedSecretBits);

  // Auth secret
  const authSecretBytes = base64UrlToUint8Array(authSecret);

  // Generate salt
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // HKDF to derive IKM
  const authInfo = new TextEncoder().encode('Content-Encoding: auth\0');
  const ikmKey = await crypto.subtle.importKey('raw', sharedSecret, 'HKDF', false, ['deriveBits']);
  const ikmBits = await crypto.subtle.deriveBits(
    { name: 'HKDF', salt: authSecretBytes, info: authInfo, hash: 'SHA-256' },
    ikmKey,
    256
  );
  const ikm = new Uint8Array(ikmBits);

  // Create context for key derivation
  const keyLabel = new TextEncoder().encode('Content-Encoding: aes128gcm\0');
  const nonceLabel = new TextEncoder().encode('Content-Encoding: nonce\0');

  // Derive content encryption key
  const prkKey = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits']);
  const cekBits = await crypto.subtle.deriveBits(
    { name: 'HKDF', salt: salt, info: keyLabel, hash: 'SHA-256' },
    prkKey,
    128
  );
  const cek = new Uint8Array(cekBits);

  // Derive nonce
  const nonceBits = await crypto.subtle.deriveBits(
    { name: 'HKDF', salt: salt, info: nonceLabel, hash: 'SHA-256' },
    prkKey,
    96
  );
  const nonce = new Uint8Array(nonceBits);

  // Add padding delimiter
  const payloadBytes = new TextEncoder().encode(payload);
  const paddedPayload = new Uint8Array(payloadBytes.length + 1);
  paddedPayload.set(payloadBytes);
  paddedPayload[payloadBytes.length] = 2; // Padding delimiter

  // Encrypt with AES-GCM
  const aesKey = await crypto.subtle.importKey('raw', cek, 'AES-GCM', false, ['encrypt']);
  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: nonce },
    aesKey,
    paddedPayload
  );
  const ciphertext = new Uint8Array(encryptedBuffer);

  return { ciphertext, salt, localPublicKey };
}

// Build the encrypted body in aes128gcm format
function buildEncryptedBody(
  ciphertext: Uint8Array,
  salt: Uint8Array,
  localPublicKey: Uint8Array
): Uint8Array {
  const recordSize = 4096;
  const header = new Uint8Array(86 + ciphertext.length);

  // Salt (16 bytes)
  header.set(salt, 0);

  // Record size (4 bytes, big-endian)
  const recordSizeView = new DataView(header.buffer, 16, 4);
  recordSizeView.setUint32(0, recordSize, false);

  // Key ID length (1 byte)
  header[20] = localPublicKey.length;

  // Key ID (local public key, 65 bytes)
  header.set(localPublicKey, 21);

  // Ciphertext
  header.set(ciphertext, 86);

  return header;
}

// Send Web Push notification
async function sendWebPush(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: string,
  vapidPublicKey: string,
  vapidPrivateKey: string,
  vapidSubject: string
): Promise<Response> {
  try {
    // Parse endpoint URL to get audience
    const endpointUrl = new URL(subscription.endpoint);
    const audience = `${endpointUrl.protocol}//${endpointUrl.host}`;

    // Create VAPID JWT (valid for 12 hours)
    const expiration = Math.floor(Date.now() / 1000) + 43200;
    const vapidJwt = await createVapidJwt(audience, vapidSubject, vapidPrivateKey, vapidPublicKey, expiration);

    // Encrypt the payload
    const { ciphertext, salt, localPublicKey } = await encryptPayload(
      payload,
      subscription.p256dh,
      subscription.auth
    );

    // Build encrypted body
    const body = buildEncryptedBody(ciphertext, salt, localPublicKey);

    // Send the push message
    const response = await fetch(subscription.endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `vapid t=${vapidJwt}, k=${vapidPublicKey}`,
        'Content-Type': 'application/octet-stream',
        'Content-Encoding': 'aes128gcm',
        'TTL': '86400', // 24 hours
        'Urgency': 'high',
      },
      body: body,
    });

    console.log(`[Push] Response status: ${response.status} for endpoint: ${subscription.endpoint.substring(0, 50)}...`);

    return response;
  } catch (error) {
    console.error('[Push] Error sending push:', error);
    throw error;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { profile_id, type, title, body, data } = await req.json();

    console.log(`[send-push-notification] Sending notification to profile: ${profile_id}`);
    console.log(`[send-push-notification] Type: ${type}, Title: ${title}`);

    if (!profile_id || !type || !title || !body) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: profile_id, type, title, body" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');
    const vapidSubject = Deno.env.get('VAPID_SUBJECT') || 'mailto:support@tipkoro.com';

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check user notification settings
    const { data: settings } = await supabase
      .from('notification_settings')
      .select('*')
      .eq('profile_id', profile_id)
      .maybeSingle();

    // Respect user settings - if no settings exist, default to enabled
    if (settings) {
      if (type === 'tip_received' && !settings.tips_enabled) {
        console.log(`[send-push-notification] Tips notifications disabled for user`);
        return new Response(
          JSON.stringify({ success: true, message: 'Notifications disabled by user' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (type.startsWith('withdrawal') && !settings.withdrawals_enabled) {
        console.log(`[send-push-notification] Withdrawal notifications disabled for user`);
        return new Response(
          JSON.stringify({ success: true, message: 'Notifications disabled by user' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (type === 'promotion' && !settings.promotions_enabled) {
        console.log(`[send-push-notification] Promotion notifications disabled for user`);
        return new Response(
          JSON.stringify({ success: true, message: 'Notifications disabled by user' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Create in-app notification
    const { error: notifError } = await supabase.from('notifications').insert({
      profile_id,
      type,
      title,
      message: body,
      data: data || null,
      is_read: false,
    });

    if (notifError) {
      console.error('[send-push-notification] Error creating notification:', notifError);
    } else {
      console.log('[send-push-notification] In-app notification created');
    }

    // Get push subscriptions for this user
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('profile_id', profile_id);

    if (subError) {
      console.error('[send-push-notification] Error fetching subscriptions:', subError);
    }

    if (!subscriptions?.length) {
      console.log('[send-push-notification] No push subscriptions found for user');
      return new Response(
        JSON.stringify({ success: true, message: 'In-app notification created, no push subscriptions' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[send-push-notification] Found ${subscriptions.length} push subscription(s)`);

    // If VAPID keys are configured, send push notifications
    if (vapidPublicKey && vapidPrivateKey) {
      const pushPayload = JSON.stringify({
        title,
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        url: data?.url || '/dashboard',
        tag: type,
        data: data || {},
      });

      const pushResults = await Promise.allSettled(
        subscriptions.map(sub =>
          sendWebPush(
            { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
            pushPayload,
            vapidPublicKey,
            vapidPrivateKey,
            vapidSubject
          )
        )
      );

      // Clean up failed subscriptions (expired endpoints - 404, 410)
      for (let i = 0; i < pushResults.length; i++) {
        const result = pushResults[i];
        if (result.status === 'rejected') {
          console.log(`[send-push-notification] Push failed for subscription ${subscriptions[i].id}:`, result.reason);
        } else if (result.status === 'fulfilled') {
          const status = result.value.status;
          if (status === 404 || status === 410) {
            console.log(`[send-push-notification] Removing expired subscription: ${subscriptions[i].id}`);
            await supabase
              .from('push_subscriptions')
              .delete()
              .eq('id', subscriptions[i].id);
          } else if (status >= 400) {
            console.log(`[send-push-notification] Push error (${status}) for subscription ${subscriptions[i].id}`);
          }
        }
      }

      const successCount = pushResults.filter(
        r => r.status === 'fulfilled' && r.value.status >= 200 && r.value.status < 300
      ).length;
      console.log(`[send-push-notification] Sent ${successCount}/${subscriptions.length} push notifications`);
    } else {
      console.log('[send-push-notification] VAPID keys not configured, skipping push notifications');
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Notifications sent' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[send-push-notification] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
