
# Implementation Plan: Streamer Mode UX, Notices Display, Payout Storage & Alert URL Persistence

## Issue Summary

| # | Issue | Root Cause |
|---|-------|------------|
| 1 | Streamer Mode UI is confusing | Settings appear as flat list, too many options visible at once |
| 2 | Notices not showing anywhere | `NoticeBar` component exists but isn't imported/used in Home or Dashboard |
| 3 | No saved payout method suggestion | Finance page doesn't use localStorage to remember last withdrawal details |
| 4 | Streamer Mode URL changes on toggle | `enableStreamerMode` generates new token every time instead of preserving existing |

---

## Task 1: Improve Streamer Mode Settings Organization

The current implementation shows all settings in one long list. This will be reorganized into clear tabs.

### Changes to `src/components/StreamerSettings.tsx`:

**Current Structure (confusing):**
- Emergency Mute card
- Main toggle card
- Tip-to-Play Sounds card
- GIF Alerts card
- Alert Settings card (contains 15+ settings mixed together)
- OBS Setup Guide card

**New Structure (organized with Tabs):**

```
[Emergency Controls Banner - always visible when enabled]

[Main Toggle Card]
  - Enable/Disable toggle
  - Alert URL (when enabled)
  - Preview/Regenerate buttons

[Tabs: Basic | Sounds | Visuals | Advanced]

Tab: Basic
  - Animation Style
  - Alert Duration slider
  - Minimum Amount for Alert
  - Show Message toggle

Tab: Sounds  
  - Sound Enabled toggle
  - Default Alert Sound (upload/preview)
  - Tip-to-Play Sounds section
  - TTS Settings section

Tab: Visuals
  - Default Alert Media (emoji/gif/none)
  - GIF Alerts section
  - Position settings

Tab: Advanced
  - Custom CSS
  - OBS Setup Guide
```

**Implementation:**
- Add Tabs component from shadcn/ui
- Group related settings into each tab
- Add clear descriptions for each setting
- Move OBS guide to Advanced tab

---

## Task 2: Display Notices on Home and Dashboard

The `NoticeBar` component and `useNotices` hook exist but aren't used anywhere.

### Changes Required:

**1. `src/pages/Home.tsx`:**
```typescript
import { NoticeBar } from "@/components/NoticeBar";
import { useNotices } from "@/hooks/useNotices";

function Index() {
  const { notices } = useNotices('home');
  
  return (
    <>
      <TopNavbar />
      <div className="h-20" />
      
      {/* Add notices at top of content */}
      <div className="container max-w-[1280px] px-6">
        <NoticeBar notices={notices} />
      </div>
      
      {/* Hero Section */}
      ...
    </>
  );
}
```

**2. `src/pages/Dashboard.tsx`:**
```typescript
import { NoticeBar } from "@/components/NoticeBar";
import { useNotices } from "@/hooks/useNotices";

// Inside component:
const { notices } = useNotices('dashboard');

// In render, after header:
<NoticeBar notices={notices} />
```

**3. Update `src/pages/admin/AdminAdmins.tsx` - Add new permissions:**

The `permissionLabels` array needs to include the two new permissions:
```typescript
const permissionLabels = [
  // ... existing ones ...
  { key: 'can_manage_notices', label: 'Notices', icon: Bell },
  { key: 'can_manage_pages', label: 'Pages', icon: FileText },
];
```

Also update the `AdminRole` interface to include these fields.

---

## Task 3: Remember Last Payout Method in localStorage

### Changes to `src/pages/Finance.tsx`:

**On mount - load saved payout details:**
```typescript
useEffect(() => {
  const savedMethod = localStorage.getItem('lastPayoutMethod');
  const savedNumber = localStorage.getItem('lastPayoutNumber');
  
  if (savedMethod) setPayoutMethod(savedMethod);
  if (savedNumber) setPayoutDetails(savedNumber);
}, []);
```

**On successful withdrawal - save to localStorage:**
```typescript
const handleWithdraw = async () => {
  // ... existing logic ...
  
  // After successful withdrawal:
  localStorage.setItem('lastPayoutMethod', payoutMethod);
  localStorage.setItem('lastPayoutNumber', payoutDetails);
  
  // Clear form as before
  setWithdrawAmount('');
  // But DON'T clear payout method and details - keep them for next time
};
```

**UI hint for returning users:**
Add a small badge/hint if using saved method:
```typescript
{localStorage.getItem('lastPayoutMethod') && payoutMethod === localStorage.getItem('lastPayoutMethod') && (
  <p className="text-xs text-muted-foreground flex items-center gap-1">
    <Check className="w-3 h-3" /> Using your last payout method
  </p>
)}
```

---

## Task 4: Preserve Streamer Mode Alert Token

The current `enableStreamerMode` function in `useStreamerSettings.ts` always generates a new token:

```typescript
const enableStreamerMode = async () => {
  const newToken = generateToken(); // Always new!
  // ...
};
```

### Fix in `src/hooks/useStreamerSettings.ts`:

**Change `enableStreamerMode` to preserve existing token:**

```typescript
const enableStreamerMode = async () => {
  if (!profile?.id) return { error: 'No profile' };

  setSaving(true);
  
  // Check if settings already exist with a token
  const existingToken = settings?.alert_token;
  const tokenToUse = existingToken || generateToken();
  
  const { data, error } = await supabase
    .from('streamer_settings')
    .upsert({
      profile_id: profile.id,
      is_enabled: true,
      alert_token: tokenToUse, // Use existing or new
      // ... keep other defaults only for new records
    }, { 
      onConflict: 'profile_id',
      // Only update is_enabled if record exists
    })
    .select()
    .single();
  
  // ...
};
```

**Better approach - separate enable from create:**

```typescript
const enableStreamerMode = async () => {
  if (!profile?.id) return { error: 'No profile' };

  setSaving(true);
  
  // If settings already exist, just toggle is_enabled
  if (settings) {
    const { data, error } = await supabase
      .from('streamer_settings')
      .update({ is_enabled: true })
      .eq('profile_id', profile.id)
      .select()
      .single();
    
    // Handle response...
    setSettings(data as StreamerSettings);
    toast({ title: "Streamer Mode Enabled!" });
    setSaving(false);
    return { data };
  }
  
  // First time - create new settings with new token
  const newToken = generateToken();
  const { data, error } = await supabase
    .from('streamer_settings')
    .insert({
      profile_id: profile.id,
      is_enabled: true,
      alert_token: newToken,
      // ... all default values
    })
    .select()
    .single();
  
  // Handle response...
};
```

This ensures:
- First enable: Creates new settings with a new token
- Subsequent enables: Just toggles `is_enabled`, keeps same token
- Token only changes when user clicks "Regenerate URL" explicitly

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/StreamerSettings.tsx` | Reorganize into Tabs (Basic, Sounds, Visuals, Advanced) |
| `src/pages/Home.tsx` | Import and display `NoticeBar` with `useNotices('home')` |
| `src/pages/Dashboard.tsx` | Import and display `NoticeBar` with `useNotices('dashboard')` |
| `src/pages/admin/AdminAdmins.tsx` | Add `can_manage_notices` and `can_manage_pages` to permission toggles |
| `src/pages/Finance.tsx` | Save/restore payout method from localStorage |
| `src/hooks/useStreamerSettings.ts` | Preserve existing token when re-enabling streamer mode |

---

## Implementation Order

1. **Fix token persistence** (useStreamerSettings.ts) - Most critical, causes OBS setup issues
2. **Add notices display** (Home.tsx, Dashboard.tsx) - Quick win
3. **Add permission toggles** (AdminAdmins.tsx) - Required for complete RBAC
4. **Save payout method** (Finance.tsx) - UX improvement
5. **Reorganize Streamer Settings** (StreamerSettings.tsx) - Larger UI refactor

---

## Technical Notes

### Token Persistence Logic
```
First Toggle ON  → Generate new token → Save to DB
Toggle OFF       → Set is_enabled=false → Keep token
Toggle ON again  → Set is_enabled=true → Same token  
Regenerate URL   → Generate new token → Replace in DB
```

### localStorage Keys for Finance
- `lastPayoutMethod`: e.g., "bkash-personal"
- `lastPayoutNumber`: e.g., "01712345678"

### Notice Display Priority
The `useNotices` hook already orders by priority descending and filters by:
- `is_active = true`
- `starts_at <= now()`
- `ends_at IS NULL OR ends_at > now()`
