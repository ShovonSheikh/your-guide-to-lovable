

# Audit: Token Economy Compatibility with Existing Features

## Issues Found

### 1. CRITICAL: No Rollback if create-tip Fails After Token Transfer

In `CreatorProfile.tsx`, the token transfer (RPC) and the `create-tip` edge function call happen sequentially. If the token transfer succeeds but `create-tip` fails (network error, timeout, edge function crash), the tokens are permanently deducted from the supporter but:
- No tip is recorded in the database
- No emails are sent
- No streamer alert fires
- No funding goal progress
- The user still gets navigated to the success page (since we don't check the response)

**Fix**: Check the `create-tip` response for errors. If it fails, attempt a token refund via `process_token_deposit` (crediting back the sender). Show an error toast instead of navigating to the success page.

### 2. SPEED: Tip-to-Alert Latency is Too High for Live Streaming

The user's core vision: a fan sees a funny moment on stream and wants to instantly play a sound. Current flow:

```
User clicks "Send Tip"
  -> RPC: process_token_transfer (~200-500ms)
  -> Edge Function: create-tip (~500-1500ms)  
  -> Navigate to success page
```

The streamer alert fires when `create-tip` inserts into the `tips` table (via Supabase Realtime). So the total latency from click to alert is ~700-2000ms. The supporter also sees "Processing..." for the entire duration.

**Fix**: After the token transfer succeeds, fire `create-tip` as a background call (don't await it). Navigate to the success page immediately. The tip insertion (and therefore the streamer alert) still happens within ~500ms of the click, but the supporter isn't blocked waiting for it.

This reduces perceived latency for the supporter to ~200-500ms (just the RPC), and the streamer alert fires ~500ms later when create-tip completes in the background.

### 3. BUG: Funding Goals Get Updated Twice Per Tip

Two separate systems both increment `funding_goals.current_amount`:
- The database trigger `update_funding_goal_on_tip` (fires on INSERT to `tips`)
- The edge function's `updateGoalProgress()` in `processPostTipActions` background code

This means every tip doubles the goal progress. This bug existed before the token economy but is still present.

**Fix**: Remove the `updateGoalProgress` call from the `create-tip` edge function. The database trigger already handles it correctly, including milestone notifications.

### 4. MINOR: Anonymous Tipping Not Supported in Token Flow

The old RupantorPay flow allowed non-logged-in users to tip (anonymous supporters). The token flow requires `isSignedIn` and a `userProfile.id`. This is by design since tokens require an account, but it means the "anonymous tip" checkbox/option is no longer shown. The `is_anonymous` field is hardcoded to `false`.

**Fix**: Add an "Send as Anonymous" toggle to the token tip form. Pass it through to `create-tip`. The supporter still needs to be logged in (for token balance), but their name can be hidden from the creator.

---

## What Already Works Correctly

- **Streamer alerts**: Triggered by Supabase Realtime on `tips` INSERT with `payment_status = 'completed'`. Works for token tips since create-tip inserts with that status.
- **Creator/Supporter emails**: Sent by create-tip's background tasks. Token tips are not blocked by payment verification.
- **Creator stats** (total_received, total_supporters): Updated by the `update_creator_stats_on_tip` database trigger on INSERT.
- **Tip-to-Play sound matching**: StreamerAlert checks `tip.amount` against `tip_sounds.trigger_amount`. Amount-based matching works regardless of payment method.
- **Success page**: Token tips correctly skip RupantorPay verification and display the share card.
- **Duplicate prevention**: create-tip checks for existing `transaction_id` before inserting.

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/CreatorProfile.tsx` | 1. Check create-tip response for errors and refund tokens on failure. 2. Fire create-tip as background (don't await). 3. Add anonymous toggle. |
| `supabase/functions/create-tip/index.ts` | Remove `updateGoalProgress` from `processPostTipActions` to prevent double goal updates (DB trigger handles it). |

## Technical Details

### CreatorProfile.tsx handleTip changes

```typescript
// After successful token transfer:

// Store tip data for success page FIRST
localStorage.setItem('tipkoro_tip_data', JSON.stringify({...}));

// Fire create-tip in background (don't await) for speed
supabase.functions.invoke('create-tip', {
  body: { transaction_id: tokenTxnId, creator_id: creator.id, ... }
}).then(({ error }) => {
  if (error) {
    console.error("Background create-tip failed:", error);
    // Attempt refund
    supabaseAuth.rpc('process_token_deposit', {
      p_profile_id: userProfile.id,
      p_amount: amount,
      p_reference_id: `refund_${tokenTxnId}`,
      p_description: 'Auto-refund: tip recording failed'
    });
  }
}).catch(console.error);

// Navigate immediately after token transfer
navigate(`/payments/tips/success?transactionId=...`);
```

### create-tip edge function changes

Remove the `updateGoalProgress` helper function and its call in `processPostTipActions`. The database trigger `update_funding_goal_on_tip` already handles:
- Incrementing `funding_goals.current_amount`
- Detecting milestone crossings (50%, 75%, 100%)
- Inserting milestone notifications

Keep the email notifications in processPostTipActions (those are not duplicated).

