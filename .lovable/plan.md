
# Implementation Plan: Announcements Access, Navbar Update, and Streamer Tip Options

## Overview

This plan addresses three feature requests:
1. **Prominent Announcements Access**: Add a visible link to `/notices` from Homepage and Dashboard (not just footer)
2. **Restore Navbar Links**: Bring back "How it Works" and "Pricing" for signed-in users
3. **Streamer Tip Options on Creator Profile**: Show special tipping options when a creator has Streamer Mode enabled with tip-to-play sounds

---

## Part 1: Add Prominent Announcements Link

### Current State
- `/notices` page exists but only linked in the footer
- No prominent access from Homepage or Dashboard

### Changes Required

**File: `src/pages/Home.tsx`**

Add an Announcements banner/link in the main content area, possibly:
- After the NoticeBar section
- A subtle link card that says "View All Announcements" pointing to `/notices`

```tsx
// After NoticeBar section (around line 62)
<div className="flex justify-center">
  <Link 
    to="/notices" 
    className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
  >
    <Bell className="w-4 h-4" />
    View all announcements
  </Link>
</div>
```

**File: `src/pages/Dashboard.tsx`**

Add a similar link after the NoticeBar on the Dashboard:

```tsx
// After NoticeBar (around line 60)
<div className="flex justify-end mb-4">
  <Link to="/notices" className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
    <Bell className="w-4 h-4" />
    All Announcements
  </Link>
</div>
```

---

## Part 2: Restore Navbar Links for Signed-In Users

### Current State
- Lines 61-76 in `TopNavbar.tsx` hide "How it Works" and "Pricing" when `isSignedIn` is true

### Changes Required

**File: `src/components/TopNavbar.tsx`**

Remove the `!isSignedIn &&` condition so these links are always visible:

```tsx
// Change from (lines 60-76):
{!isSignedIn && (
  <>
    <button onClick={() => scrollToSection("how")}>How it Works</button>
    <button onClick={() => scrollToSection("pricing")}>Pricing</button>
  </>
)}

// To:
<button onClick={() => scrollToSection("how")}>How it Works</button>
<button onClick={() => scrollToSection("pricing")}>Pricing</button>
```

Also update the mobile menu (lines 148-160) to remove the same condition.

---

## Part 3: Streamer Tip Options on Creator Profile

### Concept
When a creator has Streamer Mode enabled with "Tip-to-Play" rules configured, show supporters special tipping options on their public profile. This encourages specific tip amounts that trigger sounds/visuals on the creator's stream.

### Database Query
We need to fetch:
1. Check if creator has streamer mode enabled (`streamer_settings.is_enabled = true`)
2. Fetch their `tip_sounds` to show available trigger amounts

The RLS policy "Public can view tip sounds for enabled creators" already allows this:
```sql
USING (profile_id IN (
  SELECT profile_id FROM streamer_settings WHERE is_enabled = true
))
```

### Frontend Changes

**File: `src/pages/CreatorProfile.tsx`**

1. Add state and fetch for streamer options:

```tsx
const [streamerTipOptions, setStreamerTipOptions] = useState<{
  isStreamerEnabled: boolean;
  tipSounds: { trigger_amount: number; display_name: string }[];
}>({ isStreamerEnabled: false, tipSounds: [] });

// In useEffect, after fetching creator:
const fetchStreamerOptions = async () => {
  if (!data?.id) return;
  
  // Check if streamer mode is enabled
  const { data: streamerSettings } = await supabase
    .from('streamer_settings')
    .select('is_enabled')
    .eq('profile_id', data.id)
    .eq('is_enabled', true)
    .maybeSingle();
  
  if (streamerSettings?.is_enabled) {
    // Fetch tip sounds
    const { data: sounds } = await supabase
      .from('tip_sounds')
      .select('trigger_amount, display_name')
      .eq('profile_id', data.id)
      .eq('is_enabled', true)
      .order('trigger_amount', { ascending: true });
    
    setStreamerTipOptions({
      isStreamerEnabled: true,
      tipSounds: sounds || []
    });
  }
};
fetchStreamerOptions();
```

2. Add a "Special Tips" section in the tip card UI:

```tsx
{/* Special Streamer Tips Section */}
{streamerTipOptions.isStreamerEnabled && streamerTipOptions.tipSounds.length > 0 && (
  <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
    <div className="flex items-center gap-2 mb-3">
      <Sparkles className="w-4 h-4 text-purple-500" />
      <span className="text-sm font-semibold text-purple-600">Tip-to-Play Sounds</span>
    </div>
    <p className="text-xs text-muted-foreground mb-3">
      These amounts trigger special sounds & visuals on {creator?.first_name}'s stream!
    </p>
    <div className="flex flex-wrap gap-2">
      {streamerTipOptions.tipSounds.map((sound) => (
        <button
          key={sound.trigger_amount}
          onClick={() => {
            setSelectedAmount(sound.trigger_amount);
            setCustomAmount('');
          }}
          className={cn(
            "px-3 py-2 rounded-lg text-sm font-medium transition-all border",
            selectedAmount === sound.trigger_amount
              ? "bg-purple-500 text-white border-purple-500"
              : "bg-secondary/50 hover:bg-purple-500/10 border-purple-500/30"
          )}
        >
          <span className="block">৳{sound.trigger_amount}</span>
          <span className="text-[10px] opacity-80">{sound.display_name}</span>
        </button>
      ))}
    </div>
  </div>
)}
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/TopNavbar.tsx` | Remove `!isSignedIn &&` condition for "How it Works" and "Pricing" (desktop + mobile) |
| `src/pages/Home.tsx` | Add "View all announcements" link after NoticeBar |
| `src/pages/Dashboard.tsx` | Add "All Announcements" link after NoticeBar |
| `src/pages/CreatorProfile.tsx` | Add streamer tip options fetch and UI section |

---

## Implementation Priority

| Priority | Task | Complexity |
|----------|------|------------|
| 1 | Restore "How it Works" and "Pricing" in navbar | Low |
| 2 | Add Announcements link to Home/Dashboard | Low |
| 3 | Add Streamer Tip Options to Creator Profile | Medium |

---

## Technical Notes

### Streamer Tip Options Flow
1. When a supporter visits a creator's profile
2. System checks if creator has `streamer_settings.is_enabled = true`
3. If enabled, fetches `tip_sounds` for that creator
4. Displays special "Tip-to-Play" section with buttons for each configured amount
5. Clicking a button pre-selects that amount in the tip form
6. When supporter pays that exact amount, the creator's stream overlay plays the sound/visual

### RLS Compatibility
- `streamer_settings` has policy: "Public can view streamer settings by token" - uses `alert_token IS NOT NULL AND is_enabled = true`
- `tip_sounds` has policy: "Public can view tip sounds for enabled creators" - checks if creator has streamer mode enabled
- Both allow public read access when streamer mode is active

### UI/UX Considerations
- The "Tip-to-Play" section appears prominently above the regular tip amounts
- Uses a distinct gradient background (purple/pink) to stand out
- Each button shows the amount AND the sound name (e.g., "৳50 - Meme Horn")
- Clicking a special tip button pre-selects that amount
- Regular tip amounts remain available below for flexibility
