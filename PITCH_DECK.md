# TipKoro — Pitch Deck

> **Bangladesh's First Creator Tipping & Streamer Alert Platform**

---

## Slide 1: Cover

**TipKoro**
*Support your favorite creators, instantly!*

- 🇧🇩 100% Bangladeshi
- Live at [tipkoro.com](https://tipkoro.com)

---

## Slide 2: The Problem

### Bangladeshi Creators Can't Monetize Their Audience

| Pain Point | Impact |
|---|---|
| **No local tipping platform** | Creators rely on PayPal (unavailable in BD) or bank transfers |
| **Live stream interaction is dead** | No way for fans to trigger sounds/visuals during streams like Twitch/YouTube has in the West |
| **Payment friction kills impulse** | By the time a fan completes a payment gateway flow, the funny moment on stream is gone |
| **Creator verification is manual** | No trust layer — supporters don't know if a page is real |

> *"I wanted to tip my favorite Bangladeshi streamer during a funny moment, but the payment took 2 minutes. The moment was gone."*

---

## Slide 3: The Solution

### TipKoro — Instant Token-Based Tipping + Streamer Alerts

**Pre-loaded Token Wallet** → Fans deposit once via bKash/Nagad/Rocket, then tip instantly with zero payment friction.

**Core Features:**
- ⚡ **Instant Token Tips** — Sub-second tip delivery (200-500ms)
- 🔊 **Streamer Alerts** — Custom sounds, GIFs, and animations triggered by tip amounts
- 📧 **Email Notifications** — Both creator and supporter get real-time email confirmations
- 🎯 **Funding Goals** — Public progress bars with milestone notifications
- ✅ **Identity Verification** — ID-based creator verification for trust
- 📊 **Creator Dashboard** — Real-time analytics, earnings charts, supporter tracking
- 🔗 **Embeddable Widgets** — Drop a tip button on any website
- 🎨 **Shareable Cards** — Dynamic OG images for social sharing

---

## Slide 4: How It Works

```
Fan deposits ৳500 via bKash/Nagad/Rocket
         ↓
Tokens added to wallet instantly
         ↓
Fan visits creator's TipKoro page
         ↓
Clicks "Send ৳100 Tip" → ~300ms
         ↓
✅ Tokens transferred atomically
✅ Streamer alert plays on stream
✅ Creator gets email notification
✅ Fan sees success page + share card
```

**Key Innovation:** Token transfer is a single atomic database operation — no external API call needed at tip time. This is what makes sub-second tipping possible.

---

## Slide 5: Traction (Live Data)

| Metric | Value |
|---|---|
| **Total Users** | 4 |
| **Creators Onboarded** | 3 |
| **Completed Tips** | 42 |
| **Total Volume Processed** | ৳20,586 |
| **Average Tip Size** | ৳490 |
| **Largest Single Tip** | ৳15,000 |
| **Unique Supporters** | 2 |
| **Active Funding Goals** | 1 |
| **Platform Live Since** | January 22, 2026 |

> 📊 *All numbers are live from production database as of February 2026.*

### Monthly Breakdown

| Month | Tips | Volume |
|---|---|---|
| Jan 2026 | 42 | ৳20,586 |

*Note: Platform is in early beta with controlled onboarding. These metrics reflect organic usage, not paid acquisition.*

---

## Slide 6: Market Opportunity

### Bangladesh Creator Economy

| Data Point | Value |
|---|---|
| Internet users in Bangladesh | 130M+ |
| Active social media users | 55M+ |
| YouTube channels with 100K+ subs | 2,000+ |
| Facebook gaming streamers | 10,000+ |
| Mobile financial services users (bKash/Nagad) | 200M+ accounts |

### TAM → SAM → SOM

- **TAM:** $2B — Southeast Asian creator economy
- **SAM:** $200M — Bangladeshi digital creator monetization
- **SOM:** $5M — Direct tipping on Bangladeshi content (Year 3 target)

### Why Now?

1. **MFS penetration** — bKash/Nagad have made digital payments ubiquitous
2. **Creator boom** — BD YouTube/Facebook creators growing 40% YoY
3. **No incumbent** — Zero local competitors in creator tipping
4. **Streaming culture** — Facebook Gaming is massive in Bangladesh

---

## Slide 7: Product Architecture

### Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript + Tailwind CSS |
| Backend | Supabase (Postgres + Edge Functions) |
| Auth | Clerk (social + email login) |
| Payments | RupantorPay (bKash, Nagad, Rocket) |
| Email | Resend (transactional emails) |
| Hosting | Vercel (global CDN) |
| Real-time | Supabase Realtime (WebSocket) |

### Security

- **Atomic token operations** — SECURITY DEFINER RPC functions prevent race conditions
- **Row Level Security** — Every table has RLS policies
- **Rate limiting** — Database-backed rate limiting on tip creation
- **Withdrawal 2FA** — PIN + OTP for payouts
- **Identity verification** — ID front/back + selfie verification
- **Admin role system** — Granular permissions (13 permission flags)

---

## Slide 8: Streamer Mode Deep Dive

### The "Twitch Alerts for Bangladesh" Feature

```
Creator enables Streamer Mode
         ↓
Gets a unique overlay URL: /alerts/{token}
         ↓
Adds as Browser Source in OBS/Streamlabs
         ↓
Fan tips ৳200 → alert plays on stream in <500ms
```

**Capabilities:**
- 🎵 Amount-based sound triggers (e.g., ৳100 = funny horn, ৳500 = epic fanfare)
- 🎬 GIF animations from curated library
- 📝 Supporter message overlay
- ⏱ Configurable alert duration
- 🔇 Emergency mute toggle
- 🎨 Custom CSS support
- 🔊 Text-to-Speech with voice/pitch/rate control

**Why This Matters:** In live streaming, timing is everything. A fan sees a funny moment and wants to react *right now*. With pre-loaded tokens, the tip → alert pipeline is under 500ms. With traditional payment gateways, it's 60-120 seconds — the moment is gone.

---

## Slide 9: Revenue Model

### Platform Fee on Token Deposits

| Revenue Stream | Model |
|---|---|
| **Deposit fee** | X% on every token deposit via bKash/Nagad/Rocket |
| **Creator subscription** | Monthly fee for creator accounts (currently promotional/free) |
| **Withdrawal fee** | Configurable percentage on creator payouts |
| **Premium features** | Higher alert customization, priority support |

### Unit Economics (Projected)

| Metric | Value |
|---|---|
| Avg deposit size | ৳500 |
| Platform fee (3%) | ৳15 per deposit |
| Avg tips per depositor/month | 5 |
| Deposits per active user/month | 2 |
| Revenue per active user/month | ৳30 |
| Break-even active users | ~3,000 |

---

## Slide 10: Competitive Landscape

| Feature | TipKoro | Ko-fi | Buy Me a Coffee | StreamElements |
|---|---|---|---|---|
| 🇧🇩 bKash/Nagad/Rocket | ✅ | ❌ | ❌ | ❌ |
| Pre-loaded tokens | ✅ | ❌ | ❌ | ✅ (virtual currency) |
| Sub-second tipping | ✅ | ❌ | ❌ | ✅ |
| Streamer alerts | ✅ | ❌ | ❌ | ✅ |
| Identity verification | ✅ | ❌ | ❌ | ❌ |
| Bangla-first UX | ✅ | ❌ | ❌ | ❌ |
| Local payment methods | ✅ | ❌ | ❌ | ❌ |
| 0% platform fee (promo) | ✅ | ✅ (0%) | ❌ (5%) | ❌ |

**Moat:** Local payment integration + streamer alert infrastructure + first-mover in BD market.

---

## Slide 11: Go-to-Market Strategy

### Phase 1: Gaming Streamers (Now - Q2 2026)
- Target Facebook Gaming streamers in BD (10,000+ active)
- Free onboarding with promotional pricing
- Partner with 10 top streamers for launch content

### Phase 2: YouTube Creators (Q3 2026)
- Expand to YouTube educators, entertainers, vloggers
- Embeddable tip widgets for YouTube video descriptions
- Integration with YouTube Super Chat as alternative

### Phase 3: Platform Expansion (Q4 2026+)
- Facebook Page integration
- TikTok creator support
- API for third-party integrations
- Mobile app (React Native)

### Growth Channels
1. **Creator referrals** — Creators promote their TipKoro page to their audience
2. **Streamer overlay visibility** — Every alert on stream is organic marketing
3. **Social sharing** — Dynamic share cards after every tip
4. **Community building** — Discord/Facebook group for BD creators

---

## Slide 12: Team

> *[Add team member details here]*

| Role | Name | Background |
|---|---|---|
| Founder & CEO | [Name] | [Background] |
| Co-founder & CTO | [Name] | [Background] |
| [Additional roles] | [Names] | [Backgrounds] |

---

## Slide 13: The Ask

### Seeking: Pre-Seed / Accelerator Support

| Item | Details |
|---|---|
| **Funding target** | [৳X / $X] |
| **Use of funds** | 40% Engineering, 30% Growth, 20% Operations, 10% Legal |
| **Timeline** | 18-month runway |
| **Key milestones** | 500 creators, 5,000 active supporters, ৳5M monthly volume |

### What We Need Beyond Capital
- **Mentorship** on scaling marketplace dynamics
- **Connections** to BD gaming/streaming communities
- **Payment partner** introductions (bKash/Nagad business APIs)
- **Legal guidance** on fintech regulations in Bangladesh

---

## Slide 14: Vision

> **"Every Bangladeshi creator deserves to be supported by their community — instantly, transparently, and with zero friction."**

TipKoro is building the infrastructure for Bangladesh's creator economy. Starting with tipping and streamer alerts, expanding to subscriptions, merchandise, and creator tools.

### 3-Year Targets

| Year | Creators | Monthly Volume | Revenue |
|---|---|---|---|
| 2026 | 500 | ৳5M | ৳150K |
| 2027 | 5,000 | ৳50M | ৳2.5M |
| 2028 | 25,000 | ৳250M | ৳15M |

---

## Contact

- **Website:** [tipkoro.com](https://tipkoro.com)
- **Email:** [contact email]
- **Demo:** [tipkoro.com/explore](https://tipkoro.com/explore)

---

*Last updated: February 2026*
*Data sourced from live production database*
