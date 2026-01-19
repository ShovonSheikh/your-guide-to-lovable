import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ShareImageParams {
  amount: string;
  creatorName: string;
  supporterName?: string;
  message?: string;
  displayName: string;
  username?: string;
  isCreator: boolean;
}

// Generate SVG for the share image
function generateSVG(params: ShareImageParams): string {
  const { amount, supporterName, message, displayName, username, isCreator } = params;
  
  const statusText = isCreator ? 'I received a tip!' : 'I sent a tip!';
  const fromToText = isCreator ? 'from' : 'to';
  
  // Escape HTML entities
  const escapeHtml = (str: string) => {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  const safeSupporterName = supporterName ? escapeHtml(supporterName) : '';
  const safeMessage = message ? escapeHtml(message) : '';
  const safeDisplayName = escapeHtml(displayName);
  const safeUsername = username ? escapeHtml(username) : '';

  // Calculate vertical positions
  let yPos = 180;
  
  return `
<svg width="600" height="600" viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1a1a2e"/>
      <stop offset="100%" style="stop-color:#16213e"/>
    </linearGradient>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&amp;display=swap');
      .dm-sans { font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif; }
    </style>
  </defs>
  
  <!-- Background -->
  <rect width="600" height="600" fill="url(#bgGradient)"/>
  
  <!-- Decorative circles -->
  <circle cx="550" cy="70" r="75" fill="rgba(251, 191, 36, 0.1)"/>
  <circle cx="-25" cy="480" r="100" fill="rgba(251, 191, 36, 0.08)"/>
  
  <!-- Heart emoji -->
  <text x="300" y="120" text-anchor="middle" font-size="60">💛</text>
  
  <!-- TipKoro branding -->
  <text x="300" y="165" text-anchor="middle" fill="#FBBF24" font-size="24" font-weight="bold" class="dm-sans">TipKoro</text>
  
  <!-- Status text -->
  <text x="300" y="210" text-anchor="middle" fill="#FFFFFF" font-size="20" class="dm-sans">${statusText}</text>
  
  <!-- Amount -->
  <text x="300" y="270" text-anchor="middle" fill="#FBBF24" font-size="48" font-weight="bold" class="dm-sans">৳${amount || '0'}</text>
  
  ${safeSupporterName ? `
  <!-- From/To text -->
  <text x="300" y="310" text-anchor="middle" fill="#a0aec0" font-size="14" class="dm-sans">${fromToText}</text>
  <text x="300" y="340" text-anchor="middle" fill="#FFFFFF" font-size="22" font-weight="bold" class="dm-sans">${safeSupporterName}</text>
  ` : ''}
  
  ${safeMessage ? `
  <!-- Message -->
  <text x="300" y="${safeSupporterName ? '390' : '340'}" text-anchor="middle" fill="#a0aec0" font-size="14" font-style="italic" class="dm-sans">"${safeMessage.substring(0, 50)}${safeMessage.length > 50 ? '...' : ''}"</text>
  ` : ''}
  
  <!-- User info -->
  <text x="300" y="500" text-anchor="middle" fill="#FFFFFF" font-size="20" font-weight="bold" class="dm-sans">${safeDisplayName}</text>
  ${safeUsername ? `
  <text x="300" y="530" text-anchor="middle" fill="#FBBF24" font-size="14" class="dm-sans">tipkoro.com/${safeUsername}</text>
  ` : ''}
  
  <!-- Footer -->
  <text x="300" y="575" text-anchor="middle" fill="#64748b" font-size="12" class="dm-sans">Support creators with TipKoro</text>
</svg>`;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const params: ShareImageParams = await req.json();
    
    // Generate SVG
    const svg = generateSVG(params);
    
    // Return SVG directly - can be converted to PNG client-side if needed
    // Or use a PNG conversion service
    return new Response(svg, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'image/svg+xml',
      },
    });
  } catch (error) {
    console.error('Error generating share image:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
