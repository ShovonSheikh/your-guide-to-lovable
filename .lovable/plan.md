# Deposit Guard + Creator Signup Gateway + Backend Speed

## Overview

Three changes are needed:

1. **Deposit page** must block users whose onboarding is not completed
2. **Creator signup payment** must use the live RupantorPay gateway (not tokens) since new users won't have tokens yet
3. **create-tip edge function** should be optimized for speed by removing unnecessary sequential operations

---

## 1. Deposit Page: Require Completed Onboarding

**File:** `src/pages/Deposit.tsx`

Currently the page only checks `isSignedIn`. It needs to also check `profile.onboarding_status === 'completed'`. If onboarding is not complete, show a message directing the user to complete their profile first, with a link to `/complete-profile`.

**Changes:**

- After loading profile, check `profile?.onboarding_status !== 'completed'`
- If incomplete, render a card saying "Complete your profile first" with a button linking to `/complete-profile`

---

## 2. Creator Signup: Use Live Gateway Instead of Tokens

**File:** `src/components/Onboarding.tsx`

The `handlePayment` function (lines 101-167) currently deducts the creator fee from the user's token balance via `process_token_withdrawal`. This is wrong because new creators signing up won't have tokens yet. The creator fee should use the RupantorPay gateway (or dummy mode) like before.

**Changes to `handlePayment`:**

- Replace the token withdrawal logic with a call to `createCreatorCheckout()` from `src/lib/api.ts`
- This redirects the user to RupantorPay (or dummy success URL)
- On return to `/payments/creator/success`, the existing flow handles verification and subscription creation

**Changes to the payment step UI (lines 344-419):**

- Remove the "Token Balance" display and insufficient balance warning
- Remove the `tokenBalance < PLATFORM_FEE` disabled condition
- Change button text from "Pay from Tokens" to "Pay & Continue"
- Add name/email fields (pre-filled from Clerk user data) since the gateway needs them
- Remove the token-related imports (`useTokenBalance`, `Coins`, `Wallet`)

**File:** `src/pages/payments/CreatorPaymentSuccess.tsx`

Need to verify this page correctly creates the `creator_subscriptions` record and advances onboarding to `'profile'` step after gateway payment succeeds. This existing flow should work as-is since it was the original path before the token economy was added.

---

## 3. Speed Optimization: create-tip Edge Function

**File:** `supabase/functions/create-tip/index.ts`

Current bottlenecks in the critical path (before response is sent):

- Rate limit check: DB query (~50-100ms)
- Duplicate check: DB query (~50ms)
- Creator lookup: DB query (~50ms)
- Payment verification: External API call (~500-1000ms) -- already skipped for token payments
- Tip insert: DB write (~50ms)
- Creator profile fetch for name: DB query (~50ms)

**Optimizations:**

1. **Parallelize independent queries**: Run the duplicate check, creator lookup, and rate limit check concurrently using `Promise.all` instead of sequentially
2. **Skip redundant creator profile fetch**: The creator name is already fetched in the creator verification step -- reuse it instead of fetching again (lines 290-294)
3. **Remove the second `profiles` SELECT** (lines 290-294) since `creator` already has the data from line 199-203. Just add `first_name, username` to the initial select

These changes reduce the critical path from ~5 sequential DB calls to ~3 (with 2 parallelized), saving ~100-200ms per tip.

---

## Files to Modify


| File                                     | Changes                                                 |
| ---------------------------------------- | ------------------------------------------------------- |
| `src/pages/Deposit.tsx`                  | Add onboarding completion guard                         |
| `src/components/Onboarding.tsx`          | Replace token payment with RupantorPay gateway checkout |
| `supabase/functions/create-tip/index.ts` | Parallelize DB queries, remove redundant profile fetch  |


---

## Technical Details

### Deposit.tsx guard

```tsx
// After profile loads, before the deposit form:
if (profile && profile.onboarding_status !== 'completed') {
  return (
    // ... shell with navbar ...
    <div className="tipkoro-card text-center">
      <h2>Complete Your Profile First</h2>
      <p>You need to finish setting up your account before depositing tokens.</p>
      <Link to="/complete-profile">
        <Button>Complete Profile</Button>
      </Link>
    </div>
  );
}
```

### Onboarding.tsx handlePayment replacement

```tsx
const handlePayment = async () => {
  setIsLoading(true);
  try {
    const result = await createCreatorCheckout({
      fullname: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Creator',
      email: user?.primaryEmailAddress?.emailAddress || profile?.email || '',
    });

    if (result.error) {
      toast({ title: "Payment failed", description: result.error, variant: "destructive" });
      return;
    }

    if (result.payment_url) {
      window.location.href = result.payment_url;
    }
  } catch (error: any) {
    toast({ title: "Error", description: error.message, variant: "destructive" });
  } finally {
    setIsLoading(false);
  }
};
```

### create-tip parallelization

```typescript
// Before (sequential ~150-300ms):
const rateLimit = await checkAndUpdateRateLimit(...);
const { data: existingTip } = await supabase.from('tips')...
const { data: creator } = await supabase.from('profiles')...

// After (parallel ~50-100ms):
const [rateLimit, { data: existingTip }, { data: creator }] = await Promise.all([
  checkAndUpdateRateLimit(supabase, clientIP, 'create_tip'),
  supabase.from('tips').select('id').eq('transaction_id', transaction_id).maybeSingle(),
  supabase.from('profiles').select('id, account_type, total_received, total_supporters, email, first_name, username').eq('id', creator_id).maybeSingle(),
]);
```

Then remove the second `profiles` SELECT (lines 290-294) and use `creator.first_name` / `creator.username` directly in the email notification.