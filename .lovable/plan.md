
# Fix Plan: Ticket Navigation and Cross-Account Visibility

## Issues Identified

| # | Issue | Root Cause |
|---|-------|------------|
| 1 | Back arrow navigates to `/support/tickets` instead of `/settings?tab=my-tickets` | Line 147 in `SupportTicketDetail.tsx` has wrong route |
| 2 | Tickets from one account visible to another account (admin) | RLS policy "Admins can manage all tickets" with `is_admin()` allows all admins to see ALL tickets. The `useTickets` hook doesn't filter client-side. |

---

## Part 1: Fix Back Arrow Navigation

**File: `src/pages/SupportTicketDetail.tsx` (Line 147)**

```typescript
// Current (line 147):
onClick={() => navigate('/support/tickets')}

// Fixed:
onClick={() => navigate('/settings?tab=my-tickets')}
```

---

## Part 2: Fix Cross-Account Ticket Visibility

The problem is architectural. The current RLS setup:
- `is_admin()` returns `true` for any user with `is_admin = true` on their profile
- This means creator-admin accounts can see ALL tickets, not just their own

### Solution: Client-Side Filtering in `useTickets` Hook

The RLS policies are working as designed (admins need full access for the admin panel). The issue is that the user-facing `useTickets` hook should only show tickets belonging to the current user.

**File: `src/hooks/useTickets.ts` - Update `fetchTickets` function**

```typescript
const fetchTickets = useCallback(async () => {
  if (!profile) {
    setLoading(false);
    return;
  }
  
  setLoading(true);
  try {
    // Explicitly filter by profile_id OR guest_email to only get user's own tickets
    // This prevents admins from seeing other users' tickets in their personal dashboard
    const { data, error } = await supabase
      .from('support_tickets')
      .select('*')
      .or(`profile_id.eq.${profile.id},guest_email.eq.${profile.email}`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    setTickets((data || []) as SupportTicket[]);
  } catch (error) {
    console.error('Error fetching tickets:', error);
  } finally {
    setLoading(false);
  }
}, [supabase, profile]);
```

This change:
- Explicitly filters tickets by `profile_id` matching the current user's profile OR `guest_email` matching the current user's email
- Even if the user is an admin (and RLS allows them to see all tickets), the query will only return their own tickets
- The `useAdminTickets` hook (used in the admin panel) remains unchanged and continues to fetch all tickets

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/SupportTicketDetail.tsx` | Update back button navigation from `/support/tickets` to `/settings?tab=my-tickets` |
| `src/hooks/useTickets.ts` | Add explicit filter in `fetchTickets` to only get tickets matching the user's `profile_id` or `guest_email` |

---

## Implementation Details

### Navigation Fix (SupportTicketDetail.tsx)

**Before:**
```tsx
<Button
  variant="ghost"
  size="icon"
  onClick={() => navigate('/support/tickets')}
>
  <ArrowLeft className="w-5 h-5" />
</Button>
```

**After:**
```tsx
<Button
  variant="ghost"
  size="icon"
  onClick={() => navigate('/settings?tab=my-tickets')}
>
  <ArrowLeft className="w-5 h-5" />
</Button>
```

### Query Filter Fix (useTickets.ts)

**Before:**
```typescript
const fetchTickets = useCallback(async () => {
  setLoading(true);
  try {
    const { data, error } = await supabase
      .from('support_tickets')
      .select('*')
      .order('created_at', { ascending: false });
    // ...
  }
}, [supabase]);
```

**After:**
```typescript
const fetchTickets = useCallback(async () => {
  if (!profile) {
    setLoading(false);
    return;
  }
  
  setLoading(true);
  try {
    // Filter to only return tickets belonging to the current user
    const { data, error } = await supabase
      .from('support_tickets')
      .select('*')
      .or(`profile_id.eq.${profile.id},guest_email.eq.${profile.email}`)
      .order('created_at', { ascending: false });
    // ...
  }
}, [supabase, profile]);
```

---

## Why This Approach?

1. **RLS stays intact**: Admins still need full access via `is_admin()` for the admin panel (`/admin/support`)
2. **User dashboard is secure**: The `useTickets` hook (for `/settings?tab=my-tickets`) explicitly queries only the user's tickets
3. **No database migration needed**: This is purely a frontend fix
4. **Two separate hooks for two purposes**:
   - `useTickets` - For regular users viewing their own tickets
   - `useAdminTickets` - For admins managing all tickets

---

## Summary

| Priority | Task | Complexity |
|----------|------|------------|
| 1 | Fix back button navigation | Low (1 line change) |
| 2 | Add explicit filter in `fetchTickets` | Low (add OR filter) |
