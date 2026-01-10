const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const envCheck = {
    SUPABASE_URL: Deno.env.get('SUPABASE_URL') ? `SET (${Deno.env.get('SUPABASE_URL')?.length} chars)` : 'NOT SET',
    SUPABASE_ANON_KEY: Deno.env.get('SUPABASE_ANON_KEY') ? `SET (${Deno.env.get('SUPABASE_ANON_KEY')?.length} chars)` : 'NOT SET',
    SUPABASE_SERVICE_ROLE_KEY: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ? `SET (${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')?.length} chars)` : 'NOT SET',
    CLERK_WEBHOOK_SECRET: Deno.env.get('CLERK_WEBHOOK_SECRET') ? `SET (${Deno.env.get('CLERK_WEBHOOK_SECRET')?.length} chars)` : 'NOT SET',
    RUPANTOR_API_KEY: Deno.env.get('RUPANTOR_API_KEY') ? `SET (${Deno.env.get('RUPANTOR_API_KEY')?.length} chars)` : 'NOT SET',
  };

  console.log('Environment check:', envCheck);

  return new Response(JSON.stringify(envCheck, null, 2), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
