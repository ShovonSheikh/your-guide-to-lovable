

# Plan: Mass Email Sender Selection, Token Economy Confirmation, and Global Loader Optimization

## 1. Mass Email: Selectable Sender Address

### Problem
The mass email feature uses a hardcoded `RESEND_FROM` env variable (`TipKoro <hello@tipkoro.com>`). You want to choose which mailbox to send from.

### Changes

**Frontend: `src/components/admin/MassEmailDialog.tsx`**
- Add a mailbox selector dropdown (same pattern as `ComposeEmailSheet`)
- Fetch mailboxes from the `mailboxes` table on mount
- Pass the selected `from_address` in the request body to the edge function

**Backend: `supabase/functions/send-mass-email/index.ts`**
- Accept an optional `from_address` field in the request body
- If provided, use it as the sender instead of `RESEND_FROM`
- Validate the address exists in the `mailboxes` table for security (prevents spoofing arbitrary addresses)

---

## 2. Token Economy Status: Confirmed Complete

After reviewing the codebase, the token economy is **fully implemented**:

- **Database**: `token_balances`, `token_transactions` tables and all 3 RPC functions (`process_token_deposit`, `process_token_transfer`, `process_token_withdrawal`) are live
- **Deposit flow**: `deposit-tokens` edge function with dummy/real payment support is working
- **Token tipping**: `CreatorProfile.tsx` has "Pay with Tokens" flow using `process_token_transfer` RPC, then records via `create-tip`
- **Withdrawal integration**: `AdminWithdrawalDetail.tsx`, `AdminWithdrawals.tsx`, `Settings.tsx`, and `Onboarding.tsx` all call `process_token_withdrawal`
- **UI**: `useTokenBalance` hook, `/deposit` page, `/transactions` page, navbar balance badge -- all present
- **Mailbox backend**: `outbound_emails` table, draft saving in `ComposeEmailSheet`, folder switching in `AdminMailbox` -- all present

**No token economy changes needed.**

---

## 3. Build Error Fix: `send-push-notification`

### Problem
`npm:web-push@3.6.7` import fails in Deno/Lovable build. Deno npm specifiers require explicit config.

### Fix
**`supabase/functions/send-push-notification/index.ts`**
- Change `import webpush from "npm:web-push@3.6.7"` to `import webpush from "https://esm.sh/web-push@3.6.7"` (esm.sh works natively in Deno without config)

---

## 4. Global Loader Optimization

### Problems
- **Laggy fadeout on PC**: The `filter: blur(32px)` transition is GPU-heavy and causes visible stuttering on desktop browsers. The scale + blur combo creates a "Thanos snap" effect.
- **Too slow**: Total loader lifecycle is ~3.5 seconds (1500ms fake load + 800ms calm + 1200ms fade + 300ms buffer).

### Fix

**`src/contexts/GlobalLoaderContext.tsx`**
- Reduce fake load time: 1500ms to 600ms
- Remove calm phase: 800ms to 0ms (go straight to exit)
- Reduce unmount buffer: 1500ms to 600ms (matching the new 500ms animation)

**`src/components/GlobalLoader.tsx`**
- Remove `filter: blur(32px)` transition entirely (this is the "Thanos snap" culprit)
- Remove `transform: scale(1.05)` (causes layout repaints)
- Keep only a simple `opacity` fade: 500ms duration with `ease-out`
- Use `will-change: opacity` for GPU-optimized compositing
- Fade the spinner faster (200ms)

**Result**: Clean, smooth 500ms opacity fade. Total lifecycle drops from ~3.5s to ~1.2s.

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/admin/MassEmailDialog.tsx` | Add mailbox selector dropdown |
| `supabase/functions/send-mass-email/index.ts` | Accept + validate `from_address` |
| `supabase/functions/send-push-notification/index.ts` | Fix `web-push` import to use esm.sh |
| `src/contexts/GlobalLoaderContext.tsx` | Shorten all timers |
| `src/components/GlobalLoader.tsx` | Remove blur/scale, use simple opacity fade |

## Files to Deploy

| Edge Function |
|--------------|
| `send-mass-email` |
| `send-push-notification` |

