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
  timestamp?: string;
  trxId?: string;
  verified?: boolean;
  avatarUrl?: string;
}

// Escape HTML entities
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Generate SVG for the share image
function generateSVG(params: ShareImageParams): string {
  const { amount, creatorName, message, timestamp, isCreator, trxId, verified, avatarUrl } = params;
  
  const statusText = isCreator ? 'You received a tip!' : `You just supported`;
  const displayMessage = message ? escapeHtml(message) : 'Thanks for being awesome!';
  const safeCreatorName = escapeHtml(creatorName);
  const displayTimestamp = timestamp || new Date().toLocaleString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  // Verified badge SVG (checkmark in circle)
  const verifiedBadge = verified ? `
    <g transform="translate(${300 + (safeCreatorName.length * 7)}, ${isCreator ? 195 : 220})">
      <circle cx="0" cy="0" r="12" fill="#22c55e"/>
      <path d="M-5 0 L-2 3 L5 -4" stroke="white" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
  ` : '';

  // Transaction ID display
  const trxIdDisplay = trxId ? `
    <rect x="${300 - (trxId.length * 4)}" y="${isCreator ? '465' : '485'}" width="${trxId.length * 8 + 20}" height="24" rx="12" fill="#f0ebe0"/>
    <text x="300" y="${isCreator ? '482' : '502'}" text-anchor="middle" font-family="monospace" font-size="11" fill="#8a7a6a">ID: ${escapeHtml(trxId)}</text>
  ` : '';

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="600" height="600" viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#f5e6d3"/>
      <stop offset="100%" style="stop-color:#e8d4b8"/>
    </linearGradient>
    <filter id="cardShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="10" stdDeviation="20" flood-opacity="0.15"/>
    </filter>
    <filter id="logoShadow" x="-50%" y="-50%" width="200%" height="200%">
      <feDropShadow dx="0" dy="4" stdDeviation="10" flood-opacity="0.1"/>
    </filter>
    <clipPath id="logoClip">
      <circle cx="300" cy="125" r="35"/>
    </clipPath>
  </defs>
  
  <!-- Background -->
  <rect width="600" height="600" fill="url(#bgGradient)"/>
  
  <!-- Decorative confetti pieces -->
  <rect x="60" y="30" width="30" height="12" rx="6" fill="#f4c790" transform="rotate(-25 75 36)"/>
  <rect x="100" y="50" width="25" height="10" rx="5" fill="#b8d4c8" transform="rotate(30 112 55)"/>
  <rect x="150" y="40" width="32" height="11" rx="5" fill="#f4d0a0" transform="rotate(-15 166 45)"/>
  
  <rect x="470" y="35" width="28" height="10" rx="5" fill="#b8d4c8" transform="rotate(30 484 40)"/>
  <rect x="520" y="55" width="30" height="10" rx="5" fill="#f4c790" transform="rotate(-30 535 60)"/>
  
  <rect x="40" y="150" width="26" height="10" rx="5" fill="#b8d4c8" transform="rotate(20 53 155)"/>
  <rect x="50" y="420" width="30" height="11" rx="5" fill="#f4c790" transform="rotate(-35 65 425)"/>
  <rect x="80" y="480" width="28" height="10" rx="5" fill="#b8d4c8" transform="rotate(15 94 485)"/>
  
  <rect x="530" y="200" width="25" height="10" rx="5" fill="#f4d0a0" transform="rotate(-20 542 205)"/>
  <rect x="520" y="450" width="32" height="11" rx="5" fill="#f4d0a0" transform="rotate(-20 536 455)"/>
  <rect x="510" y="380" width="27" height="10" rx="5" fill="#b8d4c8" transform="rotate(30 523 385)"/>
  
  <!-- Small decorative dots -->
  <circle cx="30" cy="120" r="5" fill="#f4c790"/>
  <circle cx="560" cy="210" r="4" fill="#b8d4c8"/>
  <circle cx="90" cy="300" r="6" fill="#d4af37"/>
  <circle cx="555" cy="320" r="5" fill="#e8d4b8"/>
  
  <!-- Stars -->
  <polygon points="190,48 193,56 202,56 195,61 198,70 190,64 182,70 185,61 178,56 187,56" fill="#d4af37" opacity="0.8"/>
  <polygon points="420,35 422,41 429,41 424,45 426,52 420,48 414,52 416,45 411,41 418,41" fill="#d4af37" opacity="0.6" transform="scale(0.7) translate(180 20)"/>
  <polygon points="520,75 523,83 532,83 525,88 528,97 520,91 512,97 515,88 508,83 517,83" fill="#d4af37" opacity="0.9"/>
  <polygon points="70,450 73,458 82,458 75,463 78,472 70,466 62,472 65,463 58,458 67,458" fill="#d4af37" opacity="0.85"/>
  <polygon points="530,500 533,508 542,508 535,513 538,522 530,516 522,522 525,513 518,508 527,508" fill="#d4af37" opacity="0.8"/>
  
  <!-- Logo circle -->
  <circle cx="300" cy="125" r="35" fill="white" filter="url(#logoShadow)"/>
  ${avatarUrl 
    ? `<image href="${escapeHtml(avatarUrl)}" x="270" y="95" width="60" height="60" clip-path="url(#logoClip)"/>`
    : `<image href="https://i.ibb.co.com/hF035hX2/2026-01-16-21-27-58-your-guide-to-lovable-Antigravity-tip-share-image-guide-txt-removebg-preview.png" x="270" y="95" width="60" height="60" clip-path="url(#logoClip)"/>`
  }
  
  <!-- Main card -->
  <rect x="75" y="145" width="450" height="400" rx="30" fill="white" filter="url(#cardShadow)"/>
  
  <!-- Card content -->
  ${isCreator ? `
  <text x="300" y="210" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="32" font-weight="600" fill="#2d1810">${statusText}</text>
  ` : `
  <text x="300" y="195" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="28" font-weight="600" fill="#2d1810">${statusText}</text>
  <text x="300" y="235" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="32" font-weight="600" fill="#2d1810">${safeCreatorName}!</text>
  `}
  
  <!-- Verified badge -->
  ${verifiedBadge}
  
  <!-- Amount -->
  <text x="300" y="${isCreator ? '300' : '320'}" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="64" font-weight="600" fill="#d4a24a">৳${amount || '0'}</text>
  
  <!-- Message -->
  <text x="300" y="${isCreator ? '370' : '390'}" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="18" fill="#2d1810">Message: ${displayMessage.length > 40 ? displayMessage.slice(0, 40) + '...' : displayMessage}</text>
  
  <!-- Timestamp -->
  <text x="300" y="${isCreator ? '430' : '450'}" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="500" fill="#5a4a3a">${escapeHtml(displayTimestamp)}</text>
  
  <!-- Transaction ID -->
  ${trxIdDisplay}
  
  <!-- Footer branding -->
  <text x="300" y="575" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="13" fill="#8a7a6a">Support creators with TipKoro</text>
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
    
    return new Response(svg, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=31536000',
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
