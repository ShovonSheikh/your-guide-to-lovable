
# Navbar Redesign + Comprehensive Security Enhancement Plan

## Overview

This plan covers two main areas:
1. **Navbar Redesign** - Remap to 4 buttons (How it Works, Pricing, Support, More dropdown) + remove Announcements from footer
2. **Security Hardening** - Add comprehensive security headers, input sanitization, and rate limiting indicators

---

## Part 1: Navbar & Footer Redesign

### Desktop Navbar Changes

**Current layout (4 buttons):**
- How it Works
- Pricing
- Explore
- Support

**New layout (4 buttons with dropdown):**
- How it Works
- Pricing  
- Support
- **More** (dropdown containing: Explore Creators, Notices, About, Contact, Trust & Security)

### Mobile Menu Changes

The mobile menu will show all items in a flat list with a "More" section at the bottom containing the secondary links.

### Footer Changes

**Remove from Resources section:**
- "Announcements" link (currently at line 77-78 in MainFooter.tsx)

The footer will retain all other links (FAQs, Trust & Security, Support, Status).

---

## Part 2: Security Enhancements

### A. Security Headers (vercel.json)

Add comprehensive HTTP security headers that protect against common attacks:

```json
{
  "headers": [
    {
      "source": "/((?!_next|api|payments|.*clerk.*).*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "SAMEORIGIN" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" },
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.clerk.accounts.dev https://challenges.cloudflare.com https://*.supabase.co https://www.googletagmanager.com https://www.google-analytics.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.clerk.accounts.dev https://*.clerk.dev https://api.resend.com https://*.rupantor.com; frame-src https://*.clerk.accounts.dev https://challenges.cloudflare.com https://*.rupantor.com; frame-ancestors 'self';"
        }
      ]
    }
  ]
}
```

**Security headers explained:**
| Header | Purpose |
|--------|---------|
| `X-Content-Type-Options: nosniff` | Prevents MIME-type sniffing attacks |
| `X-Frame-Options: SAMEORIGIN` | Prevents clickjacking by disallowing embedding in iframes |
| `X-XSS-Protection: 1; mode=block` | Enables browser's XSS filter |
| `Referrer-Policy: strict-origin-when-cross-origin` | Controls referrer information leakage |
| `Permissions-Policy` | Disables unnecessary browser features |
| `Content-Security-Policy` | Controls which resources can be loaded |

**CSP Exclusions (as requested):**
- Payment gateway redirects (RupantorPay) - allowed in `frame-src` and `connect-src`
- Clerk authentication components - allowed in `script-src`, `connect-src`, `frame-src`

### B. Input Sanitization Enhancement

Currently DOMPurify is used in:
- `Authenticity.tsx` - Markdown rendering
- `ComposeEmailSheet.tsx` - Email HTML content
- `AdminEmailTemplates.tsx` - Template preview

**Add DOMPurify to all user-generated content display:**

1. **Support ticket messages** (`TicketChat.tsx`) - Sanitize message content before rendering
2. **Creator bio/tagline display** (`CreatorProfile.tsx`) - Sanitize profile text
3. **Tip messages display** (`RecentSupporters.tsx`, `RecentTipsList.tsx`) - Sanitize supporter messages
4. **Notices content** (`Notices.tsx`) - Sanitize notice content

### C. Rate Limiting UI Indicators

Add visual feedback when users hit rate limits:

1. **Withdrawal PIN attempts** - Show remaining attempts count
2. **Tip creation** - Show "Too many requests, please wait" message
3. **Support ticket creation** - Rate limit indicator

**Implementation:**
Create a reusable `RateLimitBanner` component:

```typescript
interface RateLimitBannerProps {
  remaining: number;
  total: number;
  action: string;
}
```

This will display warnings like:
- "2 attempts remaining before temporary lockout"
- "Rate limit exceeded. Please try again in X minutes."

### D. Security Indicator Badge

Add a small security badge/indicator to reassure users on sensitive pages:

**Pages to add indicator:**
- Finance page (withdrawal area)
- Settings > Security tab
- Tip payment page (before redirect)

The badge will show: "🔒 Secured with encryption" with a tooltip explaining the security measures.

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/TopNavbar.tsx` | Remap to 4 buttons with More dropdown |
| `src/components/MainFooter.tsx` | Remove Announcements link |
| `vercel.json` | Add security headers |
| `src/components/TicketChat.tsx` | Add DOMPurify sanitization |
| `src/pages/CreatorProfile.tsx` | Sanitize bio/tagline display |
| `src/components/RecentSupporters.tsx` | Sanitize tip messages |
| `src/components/RecentTipsList.tsx` | Sanitize tip messages |
| `src/pages/Notices.tsx` | Sanitize notice content |
| `src/components/WithdrawalVerificationDialog.tsx` | Add rate limit UI feedback |

## New Components

| File | Purpose |
|------|---------|
| `src/components/RateLimitBanner.tsx` | Reusable rate limit warning component |
| `src/components/SecurityBadge.tsx` | Security indicator badge for sensitive areas |

---

## Technical Details

### CSP Policy Breakdown

```text
default-src 'self'                     → Only load resources from same origin by default
script-src 'self' 'unsafe-inline'...   → Allow scripts from self, inline (React needs this), 
                                          Clerk, Cloudflare, Supabase, Google Analytics
style-src 'self' 'unsafe-inline'       → Allow styles from self and inline (Tailwind needs this)
img-src 'self' data: blob: https:      → Allow images from anywhere (creator avatars, external)
font-src 'self' data:                  → Allow fonts from self and data URIs
connect-src 'self' https://*.supabase.co wss://*.supabase.co...  
                                        → Allow API calls to Supabase, Clerk, Resend, RupantorPay
frame-src https://*.clerk.accounts.dev...  
                                        → Allow iframes for Clerk auth and payment gateway
frame-ancestors 'self'                 → Only allow embedding by same origin
```

### Dropdown Menu Structure

```text
┌─────────────────────────────────────────────────────────────┐
│  🧡 TipKoro  │ How it Works │ Pricing │ Support │ More ▼   │
└─────────────────────────────────────────────────────────────┘
                                                    │
                                                    ▼
                                          ┌──────────────────┐
                                          │ Explore Creators │
                                          │ Notices          │
                                          │ ─────────────    │
                                          │ About            │
                                          │ Contact          │
                                          │ Trust & Security │
                                          └──────────────────┘
```

---

## Testing Checklist

1. **Navbar**: Verify all 4 main buttons work, dropdown opens correctly on desktop
2. **Mobile menu**: Verify all links accessible and touch-friendly (min 44x44px)
3. **Footer**: Confirm Announcements link removed
4. **Security headers**: Use [securityheaders.com](https://securityheaders.com) to verify headers are applied
5. **CSP**: Test that Clerk auth, Supabase calls, and payment gateway still work
6. **Input sanitization**: Try XSS payloads in tip messages - should be sanitized
7. **Rate limit UI**: Trigger rate limit and verify warning displays

---

## Security Measures Summary

| Layer | Protection |
|-------|------------|
| HTTP Headers | CSP, XSS Protection, Clickjacking prevention, MIME sniffing prevention |
| Input Handling | DOMPurify sanitization on all user-generated content |
| Rate Limiting | Visual feedback for remaining attempts, lockout warnings |
| UI Indicators | Security badges on sensitive pages (Finance, Settings) |

### What's NOT affected (as requested):
- ✅ Payment gateway redirects (RupantorPay) - CSP allows frames and connections
- ✅ Clerk authentication components - CSP allows scripts, styles, frames from Clerk domains
