

# Fix Token Tip Success Page + Add Avatar URL Preview Field

## Problem 1: Token tips don't show the success page

After sending a token-based tip from `CreatorProfile.tsx`, the code only shows a toast message and never navigates to the tip success page (`/payments/tips/success`). The previous RupantorPay flow naturally redirected to this page, but the token flow bypasses it entirely.

### Root Cause

In `CreatorProfile.tsx` (handleTip function), after the token transfer and tip creation succeed, it only calls `toast()` and resets the form. It never:
1. Stores tip data in `localStorage` (which `TipPaymentSuccess.tsx` reads)
2. Navigates to `/payments/tips/success` with the proper query parameters

### Fix: `src/pages/CreatorProfile.tsx`

After a successful token tip:
1. Store tip data in `localStorage` under `tipkoro_tip_data` (matching what `TipPaymentSuccess.tsx` expects):
   - `creator_id`, `supporter_name`, `supporter_email`, `amount`, `message`
2. Navigate to `/payments/tips/success?transactionId={tokenTxnId}&paymentMethod=Tokens&paymentAmount={amount}`

### Fix: `src/pages/payments/TipPaymentSuccess.tsx`

The success page currently calls `verifyPayment()` and then `create-tip` again. For token-based tips (where `transactionId` starts with `token_`), both steps have already been done. The fix:

1. Detect token transactions by checking if `transactionId` starts with `token_`
2. For token transactions, skip the `verifyPayment()` call and the `create-tip` call (both already completed in `CreatorProfile.tsx`)
3. Still fetch creator info and display the success UI with the share card as normal

---

## Problem 2: No avatar URL input in Share Image Editor

The "Test Values" section in the share image editor has fields for creator name, tip amount, message, transaction ID, and verified status -- but no field for the `avatarUrl` variable, making it impossible to preview how avatar images render in the template.

### Fix: `src/pages/admin/AdminShareImage.tsx`

Add a new input field for "Avatar URL" in the Test Values card, wired to `previewValues.avatarUrl`. Place it alongside the existing fields (e.g., in a new row or alongside the verified field).

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/CreatorProfile.tsx` | After successful token tip: store tip data in localStorage, navigate to success page |
| `src/pages/payments/TipPaymentSuccess.tsx` | Skip verifyPayment + create-tip for `token_` transactions, go straight to success display |
| `src/pages/admin/AdminShareImage.tsx` | Add avatarUrl input field in Test Values section |

## Implementation Details

### CreatorProfile.tsx changes (handleTip function)

After the successful `create-tip` call, before the toast:

```typescript
// Store tip data for the success page
localStorage.setItem('tipkoro_tip_data', JSON.stringify({
  creator_id: creator!.id,
  supporter_name: fullName,
  supporter_email: email,
  amount,
  message: message || null,
}));

// Navigate to success page
navigate(`/payments/tips/success?transactionId=${encodeURIComponent(tokenTxnId)}&paymentMethod=Tokens&paymentAmount=${amount}`);
return; // Don't show toast, the success page handles the UX
```

### TipPaymentSuccess.tsx changes (handleVerification function)

```typescript
const isTokenPayment = transactionId.startsWith('token_');

if (isTokenPayment) {
  // Token tips are already verified and recorded in CreatorProfile.tsx
  // Just display the success UI
  setTipData(tipInfo);
  // Fetch creator info...
  setVerified(true);
  setVerifying(false);
  return;
}

// ... existing RupantorPay verification flow unchanged
```

### AdminShareImage.tsx changes (Test Values card)

Add after the "Creator Verified" input:

```jsx
<div className="space-y-1">
  <Label className="text-xs">Avatar URL</Label>
  <Input
    value={previewValues.avatarUrl}
    onChange={(e) => setPreviewValues(prev => ({ ...prev, avatarUrl: e.target.value }))}
    className="h-8 text-sm"
    placeholder="https://example.com/avatar.png"
  />
</div>
```

