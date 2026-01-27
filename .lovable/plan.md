

# Project Status & Streamer Mode Implementation Plan

## Part 1: Current Status Summary

After a comprehensive review of the TipKoro codebase, here's the current state:

### Completed Features
All core features are implemented and working:
- User authentication (Clerk) with Supabase sync
- Creator onboarding with payment integration
- Tip payment flow (RupantorPay)
- Dashboard with real earnings stats
- Real-time tips feed with Supabase Realtime
- Withdrawal system with PIN + OTP verification
- Full Admin Panel with CRUD operations
- Email notification system with templates
- Funding goals with milestone tracking
- Maintenance Mode with whitelist
- Identity verification flow
- Security hardening (RLS policies, storage policies)

### Outstanding Items

| Priority | Item | Description |
|----------|------|-------------|
| **High** | Subscription Renewal | `active_until` is set during signup but there's no automated billing renewal when subscriptions expire |
| **Medium** | Duplicate Supabase Clients | Console shows "Multiple GoTrueClient instances" warning - should consolidate to single client |
| **Low** | Update PROJECT_STATUS.md | Document is outdated - many features marked as "missing" are now implemented |
| **Pre-launch** | Production Keys | Switch Clerk from development to production keys |

The automated monthly billing requires external infrastructure (payment gateway recurring API or scheduled jobs) that may be outside current scope.

---

## Part 2: Streamer Mode Feature

A "Streamer Mode" will allow creators to display animated tip notifications on their screen during livestreams - similar to Twitch alerts.

### Feature Overview

```text
┌─────────────────────────────────────────────────────────────────┐
│                      STREAMER MODE                              │
├─────────────────────────────────────────────────────────────────┤
│  Creator enables "Streamer Mode" in Settings/Dashboard         │
│  │                                                              │
│  ▼                                                              │
│  Gets a unique "Alert URL" (e.g., /alerts/abc123)              │
│  │                                                              │
│  ▼                                                              │
│  Opens URL in OBS Browser Source (transparent overlay)          │
│  │                                                              │
│  ▼                                                              │
│  When tip received → Real-time notification appears             │
│  │                                                              │
│  ▼                                                              │
│  Shows: Animation + Sound + Supporter Name + Amount + Message   │
└─────────────────────────────────────────────────────────────────┘
```

### Database Changes

**New Table: `streamer_settings`**

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `profile_id` | uuid | FK to profiles |
| `is_enabled` | boolean | Toggle streamer mode on/off |
| `alert_token` | text | Unique token for alert URL |
| `alert_duration` | integer | Duration in seconds (default: 5) |
| `alert_sound` | text | Sound effect URL (null = default) |
| `alert_animation` | text | Animation type (slide, bounce, fade, pop) |
| `min_amount_for_alert` | numeric | Minimum tip amount to trigger alert |
| `show_message` | boolean | Whether to show tip messages |
| `custom_css` | text | Optional custom CSS for advanced users |
| `created_at` | timestamp | - |
| `updated_at` | timestamp | - |

**RLS Policies:**
- Users can SELECT/UPDATE their own settings
- Public can SELECT with valid `alert_token` (for alert page)

### Frontend Components

**1. Streamer Settings Panel (Settings Page)**
- Toggle to enable/disable streamer mode
- Copy alert URL button
- Preview button to test alerts
- Configuration options:
  - Alert duration (3s, 5s, 7s, 10s)
  - Animation style dropdown
  - Minimum tip amount for alerts
  - Show/hide message toggle
  - Sound on/off toggle

**2. Alert Overlay Page (`/alerts/:token`)**
- Transparent background page (for OBS Browser Source)
- Connects to Supabase Realtime
- Listens for new tips for the associated creator
- Displays animated alert when tip arrives:
  ```text
  ┌────────────────────────────────────────┐
  │    🎉  NEW TIP!  🎉                    │
  │                                        │
  │    [Avatar] Omar Ali                   │
  │    tipped ৳500!                        │
  │                                        │
  │    "Love your content, keep going!"   │
  └────────────────────────────────────────┘
  ```
- Animations: fade-in, slide from top/bottom, bounce, pop
- Auto-dismisses after configured duration

**3. Dashboard Quick Action (Optional)**
- Add "Streamer Mode" button to DashboardQuickActions
- Quick access to copy alert URL

### Technical Implementation Details

**Alert Token Generation:**
- Generate unique token on first enable (e.g., `nanoid(12)`)
- Token is used in URL: `/alerts/abc123xyz456`
- Can regenerate token if compromised

**Real-time Connection:**
- Alert page subscribes to tips table with filter: `creator_id=eq.{profile_id}`
- Only triggers for `payment_status = 'completed'`
- Respects `min_amount_for_alert` setting

**Animation & Styling:**
- CSS animations using Tailwind/Framer Motion
- Pre-built animation presets
- Custom CSS field for advanced creators
- Sound effects using Web Audio API

### Files to Create/Modify

**New Files:**
1. `src/pages/StreamerAlert.tsx` - Alert overlay page
2. `src/components/StreamerSettings.tsx` - Settings component
3. `src/components/AlertPreview.tsx` - Preview component
4. `src/hooks/useStreamerSettings.ts` - Settings hook
5. `src/hooks/useAlertSubscription.ts` - Realtime subscription hook

**Modified Files:**
1. `src/App.tsx` - Add `/alerts/:token` route
2. `src/pages/Settings.tsx` - Add Streamer Mode tab (creators only)
3. `src/components/DashboardQuickActions.tsx` - Add streamer mode button
4. Database migration for `streamer_settings` table

### User Flow

1. **Enable Streamer Mode:**
   - Creator goes to Settings → Streamer Mode tab
   - Clicks "Enable Streamer Mode"
   - System generates unique alert token
   - Shows alert URL and "Copy" button

2. **Configure Alerts:**
   - Choose animation style
   - Set alert duration
   - Set minimum tip amount for alerts
   - Toggle message display
   - Preview alerts with "Test Alert" button

3. **Use in OBS:**
   - Copy alert URL
   - In OBS: Add Browser Source
   - Paste URL, set dimensions (e.g., 400x200)
   - Position overlay on stream

4. **Live Streaming:**
   - When a tip comes in, alert automatically appears
   - Animation plays, sound plays (optional)
   - Auto-dismisses after duration

### Security Considerations

- Alert token should be regenerable if leaked
- Rate limit alert page to prevent abuse
- No sensitive data exposed (just supporter name, amount, message)
- Token-based access instead of authentication (for OBS compatibility)

### Implementation Order

1. Database: Create `streamer_settings` table with RLS
2. Backend: Alert token generation logic
3. Frontend: Settings component with enable/disable toggle
4. Frontend: Alert overlay page with realtime subscription
5. Frontend: Animations and styling
6. Integration: Add to Settings page and Dashboard
7. Polish: Sound effects, preview functionality, copy URL button

---

## Recommended Next Steps

### Immediate (This Session)
1. **Implement Streamer Mode** - The new feature you proposed

### Future Considerations
1. **Subscription Renewal** - Requires scheduled job + payment gateway recurring API
2. **Consolidate Supabase Clients** - Fix the duplicate client warning
3. **Update Documentation** - Refresh PROJECT_STATUS.md with current state

Would you like me to proceed with implementing the Streamer Mode feature?

