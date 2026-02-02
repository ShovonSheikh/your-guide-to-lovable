
# Implementation Plan: Supporter Upgrade Flow, Support Page Refactor & Chat Message Alignment Fix

## Issues Identified

| # | Issue | Root Cause |
|---|-------|------------|
| 1 | "Become a creator" button redirects to `/signup` (wrong destination) | `SupporterDashboard.tsx` links to `/signup` instead of `/settings?tab=billing` |
| 2 | Billing page lacks upgrade flow for supporters | Settings billing tab only shows "You're on the free Supporter plan" with no action button |
| 3 | Support page has tabs when it should only show ticket form | `Support.tsx` has two tabs (New Ticket + Find Ticket) instead of form only |
| 4 | User tickets should be in Settings, not `/support/tickets` | Need to add "My Tickets" tab to Settings page |
| 5 | Admin chat messages showing on wrong side | `TicketChat.tsx` uses `sender_type === 'user'` to determine alignment, but admin panel also needs reverse logic |

---

## Part 1: Fix "Become a Creator" Button Navigation

The current CTA in `SupporterDashboard.tsx` links to `/signup` which doesn't exist:

```tsx
// Lines 150 and 303 - Current:
<Link to="/signup">

// Should be:
<Link to="/settings?tab=billing">
```

**Changes to `src/components/SupporterDashboard.tsx`:**
- Update both "Get Started" button links (lines 150 and 303) to navigate to `/settings?tab=billing`

---

## Part 2: Enhance Billing Tab for Supporter Upgrade

The current billing tab for supporters shows minimal content with no upgrade option. We need a comprehensive upgrade page.

**Changes to `src/pages/Settings.tsx` - Billing Tab (Supporter View):**

Add:
1. **Prominent "Become a Creator" upgrade button** - links to payment
2. **Benefits section** - list of creator features:
   - Custom creator page (tipkoro.com/username)
   - Receive unlimited tips
   - Earnings dashboard
   - Withdraw to bKash, Nagad, Rocket
   - Funding goals
   - Streamer Mode (OBS alerts)
3. **Current plan status** - "Supporter (Free)"
4. **Pricing info** - ৳150/month Creator Fee with explanation

**New Component: Upgrade Section**
```tsx
{profile?.account_type === 'supporter' && (
  <div className="space-y-6">
    {/* Current Plan */}
    <div className="p-4 bg-secondary/50 rounded-xl">
      <p className="text-sm text-muted-foreground mb-1">Current Plan</p>
      <p className="text-xl font-bold">Supporter (Free)</p>
    </div>

    {/* Upgrade CTA */}
    <div className="p-6 bg-gradient-to-br from-accent/10 to-primary/5 rounded-xl border border-accent/20">
      <h3 className="text-xl font-bold mb-2">Upgrade to Creator</h3>
      <p className="text-muted-foreground mb-4">
        Start receiving tips from your supporters
      </p>
      <Button onClick={handleUpgrade} className="w-full">
        Upgrade for ৳150/month
      </Button>
    </div>

    {/* Benefits List */}
    <div className="space-y-3">
      <h3 className="font-semibold">Creator Benefits</h3>
      <ul className="space-y-2">
        {benefits.map((benefit) => (
          <li className="flex items-center gap-2">
            <Check className="w-4 h-4 text-success" />
            <span>{benefit}</span>
          </li>
        ))}
      </ul>
    </div>

    {/* Pricing Info */}
    <div className="p-4 bg-secondary/30 rounded-xl">
      <h4 className="font-medium mb-2">Pricing</h4>
      <p className="text-sm text-muted-foreground">
        ৳150/month flat fee. No percentage taken from tips.
        TipKoro commits to never exceeding 20% if we change to percentage-based pricing.
      </p>
    </div>
  </div>
)}
```

**Payment Flow:**
- The upgrade button initiates the same payment flow as onboarding (`createCreatorCheckout`)
- After successful payment at `/payments/creator/success`:
  - Update profile `account_type` to 'creator'
  - Update `onboarding_status` to 'completed' (already completed)
  - Show success message
  - Redirect to dashboard

**Changes to `src/pages/payments/CreatorPaymentSuccess.tsx`:**
- Add logic to handle upgrade flow (existing supporters becoming creators)
- Update profile account_type to 'creator' on success
- Ensure proper redirect back to dashboard

---

## Part 3: Refactor Support Page - Only Show Ticket Form

**Changes to `src/pages/Support.tsx`:**
- Remove Tabs component
- Show only the TicketForm component
- Keep the Quick Help section
- For logged-in users, add a link to view tickets in Settings

**New Structure:**
```tsx
<main className="flex-1 py-12">
  <div className="container max-w-[1000px] px-6">
    <div className="text-center mb-12">
      <h1>How can we help?</h1>
      <p>...</p>
    </div>

    {/* Just the ticket form */}
    <TicketForm />

    {/* Link for logged-in users */}
    {profile && (
      <div className="text-center mt-6">
        <Button variant="link" onClick={() => navigate('/settings?tab=my-tickets')}>
          View your existing tickets
        </Button>
      </div>
    )}

    {/* Quick Help Section */}
    ...
  </div>
</main>
```

---

## Part 4: Add "My Tickets" Tab to Settings Page

**Changes to `src/pages/Settings.tsx`:**

1. Add new tab to the tabs array:
```tsx
const tabs = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'links', label: 'Social Links', icon: LinkIcon },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'my-tickets', label: 'My Tickets', icon: MessageSquare }, // NEW
  { id: 'streamer', label: 'Streamer Mode', icon: Video, creatorOnly: true },
  { id: 'verification', label: 'Verification', icon: BadgeCheck, creatorOnly: true },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'billing', label: 'Billing', icon: CreditCard },
];
```

2. Add MyTicketsTab component:
```tsx
function MyTicketsTab() {
  const navigate = useNavigate();
  const { tickets, loading } = useTickets();
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTickets = useMemo(() => {
    // Filter by status and search
  }, [tickets, statusFilter, searchQuery]);

  return (
    <div className="space-y-6">
      <div className="tipkoro-card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">My Support Tickets</h2>
          <Button onClick={() => navigate('/support')}>New Ticket</Button>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-4">
          <Input placeholder="Search..." ... />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="waiting_reply">Awaiting Reply</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </Select>
        </div>

        {/* Ticket List */}
        {filteredTickets.map(ticket => (
          <Card onClick={() => navigate(`/support/ticket/${ticket.id}`)}>
            ...
          </Card>
        ))}
      </div>
    </div>
  );
}
```

3. Add tab content render:
```tsx
{currentTab === 'my-tickets' && (
  <MyTicketsTab />
)}
```

---

## Part 5: Fix Admin Chat Message Alignment

The issue: In `TicketChat.tsx`, messages are aligned based on `sender_type === 'user'`:
- User messages go right
- Admin messages go left

But in the admin panel, we want the OPPOSITE:
- Admin's own messages should be on the right
- User messages should be on the left

**Changes to `src/components/TicketChat.tsx`:**

The component receives `isAdmin` prop but doesn't use it for alignment. Update the alignment logic:

```tsx
// Current (line 162):
const isUser = msg.sender_type === 'user';

// Fixed:
// If viewing as admin, admin messages should be on right (like "self")
// If viewing as user, user messages should be on right (like "self")
const isSelf = isAdmin 
  ? msg.sender_type === 'admin' 
  : msg.sender_type === 'user';
```

Then update the alignment classes:
```tsx
// Line 178-180:
className={cn(
  'flex flex-col gap-1 max-w-[80%]',
  isSelf ? 'ml-auto items-end' : 'mr-auto items-start'
)}

// Line 190-194:
className={cn(
  'rounded-2xl px-4 py-2.5',
  isSelf
    ? 'bg-primary text-primary-foreground rounded-br-md'
    : 'bg-secondary rounded-bl-md'
)}
```

Also update the sender name display:
```tsx
// Line 184-186:
<span className="font-medium">
  {isSelf ? 'You' : (isAdmin ? msg.sender_name : `${msg.sender_name} (Support)`)}
</span>
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/SupporterDashboard.tsx` | Change `/signup` links to `/settings?tab=billing` |
| `src/pages/Settings.tsx` | Add upgrade flow to billing tab, add My Tickets tab |
| `src/pages/Support.tsx` | Remove tabs, show only ticket form |
| `src/components/TicketChat.tsx` | Fix message alignment based on `isAdmin` prop |

---

## Implementation Order

| Priority | Task | Complexity |
|----------|------|------------|
| 1 | Fix TicketChat message alignment | Low |
| 2 | Fix SupporterDashboard button links | Low |
| 3 | Refactor Support page (remove tabs) | Low |
| 4 | Add My Tickets tab to Settings | Medium |
| 5 | Enhance Billing tab with upgrade flow | Medium |

---

## Technical Notes

### Upgrade Payment Flow

The upgrade flow will reuse the existing `createCreatorCheckout` from `lib/api.ts`:

```typescript
// In Settings.tsx billing tab
const handleUpgrade = async () => {
  setUpgrading(true);
  try {
    // Create pending subscription
    await supabase.from('creator_subscriptions').insert({
      profile_id: profile.id,
      amount: PLATFORM_FEE,
      payment_status: 'pending',
    });

    // Redirect to payment
    const result = await createCreatorCheckout({
      fullname: `${profile.first_name} ${profile.last_name}`,
      email: profile.email,
      reference_id: profile.id,
    });

    if (result.payment_url) {
      window.location.href = result.payment_url;
    }
  } catch (error) {
    toast({ title: "Error", variant: "destructive" });
  }
  setUpgrading(false);
};
```

### Creator Payment Success Handler

The `CreatorPaymentSuccess.tsx` page needs to handle both:
1. New user onboarding (redirect to `/complete-profile`)
2. Existing supporter upgrade (update account_type, redirect to `/dashboard`)

```typescript
// After verifying payment
if (profile.onboarding_status === 'completed') {
  // This is an upgrade, not onboarding
  await updateProfile({ account_type: 'creator' });
  navigate('/dashboard');
} else {
  // This is onboarding
  await updateProfile({ onboarding_status: 'profile' });
  navigate('/complete-profile');
}
```

### Ticket Status Filter Options

The status filter in My Tickets tab will include:
- All Statuses
- Open
- In Progress
- Awaiting Reply
- Resolved
- Closed
