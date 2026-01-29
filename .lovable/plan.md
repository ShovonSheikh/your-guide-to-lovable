
# Advanced Streamer Alert System, Build Fix & Footer Cleanup

## Part 1: Build Error Fix (Critical)

The `EdgeRuntime` error in `create-tip/index.ts` needs fixing. In Supabase Edge Functions (Deno), `EdgeRuntime` is not a global - it was incorrectly assumed from Vercel's runtime.

**Fix**: Replace `EdgeRuntime.waitUntil` with a proper Deno approach - just fire the async function without awaiting it.

```typescript
// Before (broken):
if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime.waitUntil) {
  EdgeRuntime.waitUntil(processPostTipActions());
}

// After (working):
processPostTipActions().catch(e => console.error("Background task error:", e));
```

---

## Part 2: What Was Done in Recent Commits (Streamer Mode)

### Commit 1: Base Streamer Mode
- Created `streamer_settings` table with core columns (is_enabled, alert_token, animation, duration)
- Implemented `/alerts/:token` overlay page with Supabase Realtime
- Added settings UI in the Settings page

### Commit 2: Custom Sound Upload
- Created `alert-sounds` storage bucket
- Added upload/delete functions in `useStreamerSettings.ts`
- UI for uploading MP3/WAV/OGG files (max 5MB)

### Commit 3: TTS Support + Explore Fix
- Added `tts_enabled`, `tts_voice`, `tts_rate`, `tts_pitch` columns
- Implemented Web Speech API in `StreamerAlert.tsx`
- Fixed RLS policy for `public_profiles` view

---

## Part 3: Advanced Alert System Implementation

### 3.1 Amount-Based Sounds (Tip to Play)

**Database Changes:**
Create a `tip_sounds` table for preset sounds that creators can configure:

```sql
CREATE TABLE public.tip_sounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  trigger_amount NUMERIC NOT NULL, -- e.g., 20, 50, 100
  sound_url TEXT NOT NULL,         -- from approved list
  display_name TEXT NOT NULL,      -- "Funny Pop", "Hype Horn"
  cooldown_seconds INTEGER DEFAULT 10,
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for quick lookups
CREATE INDEX idx_tip_sounds_profile_amount ON tip_sounds(profile_id, trigger_amount);
```

**Approved Sounds List (Hardcoded in UI):**
Pre-approved sounds from royalty-free sources:
- ৳20 → "Pop" (2s) - Light notification sound
- ৳50 → "Meme Horn" (3s) - MLG air horn clip
- ৳100 → "Dramatic" (4s) - Orchestral hit
- ৳200 → "Hype" (4s) - Crowd cheer
- ৳500+ → "Epic" (5s) - Victory fanfare

**Logic:**
- When tip arrives, check `tip_sounds` for matching `trigger_amount`
- If match found and cooldown not active, play the specific sound
- Track last play time per sound to enforce cooldowns
- Fallback to default alert sound if no match

### 3.2 GIF Support (Controlled)

**Database Changes:**
Add approved GIF presets (admin-curated):

```sql
CREATE TABLE public.approved_gifs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  category TEXT, -- 'celebration', 'hype', 'funny'
  duration_seconds INTEGER DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed with safe GIFs from Giphy CDN
INSERT INTO approved_gifs (name, url, category, duration_seconds) VALUES
  ('Party', 'https://media.giphy.com/...', 'celebration', 3),
  ('Confetti', 'https://media.giphy.com/...', 'celebration', 4),
  ('Money Rain', 'https://media.giphy.com/...', 'hype', 5);
```

**Streamer Settings Extension:**
Add columns to `streamer_settings`:
```sql
ALTER TABLE streamer_settings ADD COLUMN gif_enabled BOOLEAN DEFAULT false;
ALTER TABLE streamer_settings ADD COLUMN gif_position TEXT DEFAULT 'center'; -- 'center', 'top-left', 'top-right'
ALTER TABLE streamer_settings ADD COLUMN gif_scale NUMERIC DEFAULT 1.0; -- 1.0 = normal, 1.5 = larger for big tips
```

**Logic:**
- Creator selects GIF from approved list (dropdown in settings)
- Position: center (default), corner options for smaller tips
- Bigger tips → scale up GIF slightly (e.g., 1.2x for ৳100+, 1.5x for ৳500+)
- Duration respects the GIF's preset (3-5 seconds max)

### 3.3 Smart Combination Logic

Create tiers that combine sound + GIF + TTS intelligently:

| Tip Amount | Sound | GIF | TTS | Visual Effect |
|------------|-------|-----|-----|---------------|
| ৳1-49      | Default beep | Small emoji | No | Standard |
| ৳50-99     | Custom sound | Small GIF | No | Standard |
| ৳100-199   | Custom sound | Medium GIF | Optional | Slight glow |
| ৳200-499   | Hype sound | Large GIF | Yes | Glow + border |
| ৳500+      | Epic sound | XL GIF | Yes | Full effects |

**Implementation:**
- Add `getTierForAmount(amount)` function in `StreamerAlert.tsx`
- Apply CSS classes based on tier (glow, scale, border)
- Queue logic to prevent overlapping alerts

### 3.4 Alert Queue System

**Implementation in StreamerAlert.tsx:**
```typescript
const alertQueue = useRef<TipData[]>([]);
const isProcessing = useRef(false);

const addToQueue = (tip: TipData) => {
  alertQueue.current.push(tip);
  processQueue();
};

const processQueue = async () => {
  if (isProcessing.current || alertQueue.current.length === 0) return;
  isProcessing.current = true;
  
  const tip = alertQueue.current.shift();
  await showAlert(tip);
  
  // Wait for alert duration + 500ms buffer
  await new Promise(r => setTimeout(r, (settings.alert_duration * 1000) + 500));
  
  isProcessing.current = false;
  processQueue(); // Process next in queue
};
```

### 3.5 Safety Controls

**Database:**
Add emergency controls to `streamer_settings`:
```sql
ALTER TABLE streamer_settings ADD COLUMN emergency_mute BOOLEAN DEFAULT false;
ALTER TABLE streamer_settings ADD COLUMN sounds_paused BOOLEAN DEFAULT false;
ALTER TABLE streamer_settings ADD COLUMN gifs_paused BOOLEAN DEFAULT false;
```

**UI Controls:**
- "Emergency Mute All" button (red, prominent)
- Individual toggles for sounds/GIFs/TTS
- All controls save instantly

### 3.6 Tip Page Preview (UX)

On the creator's tip page (CreatorProfile.tsx), show what happens at each amount:

```text
Tip ৳50 → Plays "Funny Pop" 🔊
Tip ৳100 → Plays "Hype Horn" + Shows GIF 🎬
Tip ৳500 → Plays "Epic" + GIF + TTS 🎤
```

Small preview button next to each (plays 1 second of sound, muted GIF).

---

## Part 4: Footer Cleanup

**Remove (non-existent):**
- Product → "For Creators" (covered by home page section)
- Company → "Blog", "Careers"
- Resources → "Help Center", "Community"
- Legal → "Licenses"
- Social icons (no accounts yet)

**Keep:**
- Product → How it Works, Pricing, Explore Creators
- Company → About, Contact
- Resources → FAQs (link to home FAQ section), Status
- Legal → Terms, Privacy, Cookie Policy
- Payment methods badges

---

## Part 5: Trust & Backers Advice (Non-Technical)

### Building Trust for Your Platform

**1. Display Trust Signals:**
- Add "Secured by..." badges (payment gateway logos)
- Show total tips processed counter on homepage
- Add testimonials from early creators
- Display "Powered by Supabase" infrastructure badge

**2. Legal Entity:**
- Register as a business (Trade License in Bangladesh)
- Display registration number in footer
- Create a dedicated "Security" or "Trust" page explaining:
  - How payments are processed (through RupantorPay)
  - How funds are held and transferred
  - What happens if something goes wrong

**3. Creator Verification:**
- Your existing verification system helps
- Display "Verified Creator" badges prominently
- Consider adding social proof (linked YouTube/Facebook)

### Finding Backers/Investors

**At your age (18.5), focus on:**

1. **Local Startup Programs:**
   - Grameenphone Accelerator (GP Accelerator)
   - Startup Bangladesh (government initiative)
   - Biniyog Briddhi (angel investor network)
   - BASIS (software association) startup programs

2. **Online Platforms:**
   - AngelList (create a profile)
   - LinkedIn (connect with BD tech investors)
   - ProductHunt (for visibility)

3. **Build Traction First:**
   - Get 10-20 active creators using the platform
   - Track metrics (tips processed, creator growth)
   - This data speaks louder than pitches

4. **Document Everything:**
   - Create a pitch deck (Canva has templates)
   - Record a demo video
   - Write your story (young founder solving local problem)

**Key Message for Investors:**
"TipKoro solves the payment barrier that blocks Bangladeshi creators from international platforms like Ko-fi and Patreon by using local payment methods."

---

## Implementation Order

| Priority | Task | Complexity |
|----------|------|------------|
| 1 | Fix EdgeRuntime build error | 5 min |
| 2 | Footer cleanup | 10 min |
| 3 | Amount-based sounds (tip_sounds table) | 30 min |
| 4 | Alert queue system | 20 min |
| 5 | Safety controls | 15 min |
| 6 | GIF support with presets | 30 min |
| 7 | Smart tier combination | 20 min |
| 8 | Tip page preview | 15 min |

Total estimated time: ~2.5 hours

---

## Files to Create/Modify

**New Files:**
- Migration: `supabase/migrations/[timestamp]_advanced_alerts.sql`

**Modified Files:**
- `supabase/functions/create-tip/index.ts` - Remove EdgeRuntime
- `src/components/MainFooter.tsx` - Remove dead links
- `src/pages/StreamerAlert.tsx` - Queue, tiers, GIF support
- `src/components/StreamerSettings.tsx` - Amount-based sound config, emergency controls
- `src/hooks/useStreamerSettings.ts` - New state management
- `src/pages/CreatorProfile.tsx` - Tip preview hints
