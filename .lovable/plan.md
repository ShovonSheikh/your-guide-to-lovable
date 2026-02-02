
# Implementation Plan: Creator Downgrade Option & Public Notices Page with Visibility Control

## Overview

This plan addresses two feature requests:
1. **Creator-to-Supporter Downgrade**: Allow creators to downgrade their account back to a supporter account
2. **Public Notices Page**: Create a dedicated `/notices` page showing all public announcements with admin-controlled visibility

---

## Part 1: Creator Account Downgrade Feature

### Current State
- The Billing tab in Settings shows upgrade options for supporters
- For creators, it only shows subscription details with no downgrade option

### Changes Required

**File: `src/pages/Settings.tsx` - BillingTab Component (Lines 437-559)**

Add a downgrade section for creators with:
1. Clear warning about what they'll lose
2. Confirmation dialog with double-confirmation
3. Database update to change `account_type` from 'creator' to 'supporter'

```tsx
// Add inside the creator section of BillingTab
<div className="pt-6 border-t border-border">
  <div className="p-4 bg-destructive/5 rounded-xl border border-destructive/20">
    <h4 className="font-medium mb-2 text-destructive">Downgrade Account</h4>
    <p className="text-sm text-muted-foreground mb-4">
      Switch back to a free Supporter account. You will lose:
    </p>
    <ul className="text-sm text-muted-foreground space-y-1 mb-4">
      <li>• Your creator page</li>
      <li>• Ability to receive tips</li>
      <li>• Access to earnings dashboard</li>
      <li>• Streamer Mode features</li>
    </ul>
    <Button 
      variant="outline" 
      className="border-destructive text-destructive hover:bg-destructive/10"
      onClick={() => setDowngradeDialogOpen(true)}
    >
      Downgrade to Supporter
    </Button>
  </div>
</div>
```

**Downgrade Confirmation Dialog:**
- Requires typing "DOWNGRADE" to confirm
- Shows final warning about data retention
- Updates profile `account_type` to 'supporter'
- Redirects to dashboard with success message

**Important Notes:**
- Tips received and withdrawal history are preserved
- Creator subscription record remains for billing history
- User can upgrade again later if they choose

---

## Part 2: Public Notices Page

### Database Schema Update

Add a new column `is_public` to the `notices` table to control visibility:

**SQL Migration:**
```sql
ALTER TABLE public.notices 
ADD COLUMN is_public boolean NOT NULL DEFAULT false;

-- Update RLS policy for public access
DROP POLICY IF EXISTS "Public can view active notices" ON public.notices;

CREATE POLICY "Public can view active public notices" ON public.notices
FOR SELECT
USING (
  is_active = true 
  AND is_public = true 
  AND starts_at <= now() 
  AND (ends_at IS NULL OR ends_at > now())
);

-- Also need policy for showing on home/dashboard (existing behavior)
CREATE POLICY "Show notices on home and dashboard" ON public.notices
FOR SELECT
USING (
  is_active = true 
  AND (show_on_home = true OR show_on_dashboard = true)
  AND starts_at <= now() 
  AND (ends_at IS NULL OR ends_at > now())
);
```

### Frontend Changes

**1. New Page: `src/pages/Notices.tsx`**

A public page at `/notices` showing all notices marked as `is_public = true`:

```tsx
export default function Notices() {
  usePageTitle('Announcements');
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch public notices (is_public = true)
  useEffect(() => {
    const fetchPublicNotices = async () => {
      const { data, error } = await supabase
        .from('notices')
        .select('*')
        .eq('is_public', true)
        .eq('is_active', true)
        .lte('starts_at', new Date().toISOString())
        .order('created_at', { ascending: false });
      
      if (!error) {
        const activeNotices = (data || []).filter(notice => 
          !notice.ends_at || new Date(notice.ends_at) > new Date()
        );
        setNotices(activeNotices);
      }
      setLoading(false);
    };
    fetchPublicNotices();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <TopNavbar />
      <main className="container max-w-3xl py-12 px-4">
        <h1 className="text-4xl font-display font-bold mb-2">Announcements</h1>
        <p className="text-muted-foreground mb-8">
          Stay updated with the latest news and updates from TipKoro
        </p>
        
        {loading ? (
          <Spinner />
        ) : notices.length === 0 ? (
          <EmptyState message="No announcements yet" />
        ) : (
          <div className="space-y-4">
            {notices.map(notice => (
              <NoticeCard key={notice.id} notice={notice} />
            ))}
          </div>
        )}
      </main>
      <MainFooter />
    </div>
  );
}
```

**2. Update Admin Notices UI: `src/pages/admin/AdminNotices.tsx`**

Add the `is_public` toggle to the create/edit dialog:

```tsx
// In formData state
const [formData, setFormData] = useState({
  // ... existing fields
  is_public: false,  // NEW
});

// In Dialog content
<div className="flex items-center justify-between">
  <div>
    <Label htmlFor="is_public">Show on Public Notices Page</Label>
    <p className="text-xs text-muted-foreground">
      Make this visible on /notices page
    </p>
  </div>
  <Switch
    id="is_public"
    checked={formData.is_public}
    onCheckedChange={(v) => setFormData({ ...formData, is_public: v })}
  />
</div>
```

**3. Add Route: `src/App.tsx`**

```tsx
import Notices from "./pages/Notices";

// Add route
<Route path="/notices" element={<Notices />} />
```

**4. Optional: Add link in Footer/Navbar**

Add a link to `/notices` in the MainFooter under "Resources" section.

---

## Files to Modify/Create

| File | Changes |
|------|---------|
| `src/pages/Settings.tsx` | Add downgrade section and confirmation dialog to BillingTab |
| `src/pages/Notices.tsx` | **NEW** - Public notices page |
| `src/pages/admin/AdminNotices.tsx` | Add `is_public` toggle in create/edit form |
| `src/App.tsx` | Add `/notices` route |
| `src/components/MainFooter.tsx` | Add link to /notices in Resources section |
| `src/hooks/useNotices.ts` | Update to handle `is_public` filtering for public page |
| **Database Migration** | Add `is_public` column and update RLS policies |

---

## Implementation Priority

| Priority | Task | Complexity |
|----------|------|------------|
| 1 | Add `is_public` column to notices table | Low (migration) |
| 2 | Update Admin Notices UI with toggle | Low |
| 3 | Create public Notices page | Medium |
| 4 | Add downgrade feature to BillingTab | Medium |
| 5 | Add footer link to notices | Low |

---

## Technical Notes

### Downgrade Flow
1. User clicks "Downgrade to Supporter" button
2. Confirmation dialog opens with warning and input field
3. User types "DOWNGRADE" to confirm
4. Profile `account_type` updated from 'creator' to 'supporter'
5. Toast notification shown
6. Page reloads to reflect new account status

### Notice Visibility Logic

| Field | Purpose |
|-------|---------|
| `is_active` | Master toggle - notice is completely hidden if false |
| `show_on_home` | Shows in NoticeBar on Home page |
| `show_on_dashboard` | Shows in NoticeBar on Dashboard |
| `is_public` **(NEW)** | Shows on dedicated /notices page |

A notice can be:
- Only on Home/Dashboard (like temporary alerts)
- Only on /notices page (like blog-style announcements)
- Both (important announcements everywhere)
- Neither (draft/archived)

### Data Preservation on Downgrade
- Tips received remain in database
- Withdrawal history preserved
- Creator subscription record kept for audit
- Profile data (bio, social links) preserved
- User can re-upgrade anytime
