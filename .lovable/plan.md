

# Implement Mailbox Backend + Token Economy System

## Overview

This plan implements both features from `MAILBOX_TODO.md`:
1. **Mailbox Backend** -- Outbound emails table, Sent/Drafts/Outbox/Trash folder functionality
2. **Token Economy** -- Token balances, deposits, token-based tipping, and withdrawal from token balance

---

## Part 1: Mailbox Backend

### 1A. Database: `outbound_emails` table

Create a new table to store composed/sent/draft emails:

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | default gen_random_uuid() |
| mailbox_id | uuid FK | references mailboxes(id) |
| to_addresses | text | recipient email |
| cc_addresses | text | nullable |
| bcc_addresses | text | nullable |
| subject | text | |
| html_body | text | nullable |
| text_body | text | nullable |
| status | text | `draft`, `queued`, `sent`, `failed` |
| is_deleted | boolean | default false (for trash) |
| scheduled_at | timestamptz | nullable, for future send |
| sent_at | timestamptz | nullable |
| created_at / updated_at | timestamptz | auto |
| created_by | uuid | profile_id of admin who composed |

RLS: Admin-only for all operations. Indexes on `(mailbox_id, status, is_deleted)`.

### 1B. Update `send-email` Edge Function

After successfully sending via Resend, insert a record into `outbound_emails` with `status = 'sent'` and `sent_at = now()`. This makes all sent emails appear in the Sent folder automatically.

### 1C. Update `send-reply-email` Edge Function

Same as above -- log outbound replies into `outbound_emails` with `status = 'sent'`.

### 1D. Frontend: Folder Switching Logic

Currently `AdminMailbox.tsx` has folder pills (Inbox/Sent/Drafts/Outbox/Trash) but all folders just show inbound emails. Update:

- **Inbox**: `inbound_emails` where `is_deleted = false` (already works)
- **Sent**: `outbound_emails` where `status = 'sent'` and `is_deleted = false`
- **Drafts**: `outbound_emails` where `status = 'draft'` and `is_deleted = false`
- **Outbox**: `outbound_emails` where `status = 'queued'` and `is_deleted = false`
- **Trash**: Both `inbound_emails` and `outbound_emails` where `is_deleted = true`

### 1E. Compose Sheet: Save as Draft

Add a "Save Draft" button to `ComposeEmailSheet.tsx`. When clicked, insert/update a record in `outbound_emails` with `status = 'draft'`. When sending, if editing a draft, update the existing record to `status = 'sent'`.

### 1F. Trash Actions

- **Move to Trash**: Set `is_deleted = true` on inbound or outbound email (already works for inbound)
- **Restore**: Set `is_deleted = false`
- **Empty Trash**: Bulk delete all `is_deleted = true` records (hard delete)

### 1G. Email Viewer for Outbound

Adapt the `EmailViewerComponent` to display outbound emails (show "To" instead of "From" as primary, show sent date, etc.)

---

## Part 2: Token Economy System

### 2A. Database Tables

**`token_balances`**

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| profile_id | uuid | unique, FK to profiles |
| balance | numeric | default 0, CHECK >= 0 |
| created_at / updated_at | timestamptz | |

RLS: Users can read their own balance. Service role manages updates.

**`token_transactions`**

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| profile_id | uuid | FK to profiles |
| type | text | `deposit`, `tip_sent`, `tip_received`, `withdrawal`, `refund` |
| amount | numeric | positive for credits, negative for debits |
| balance_before | numeric | |
| balance_after | numeric | |
| reference_id | text | tip_id, withdrawal_id, or payment transaction_id |
| description | text | human-readable note |
| created_at | timestamptz | |

RLS: Users can read their own transactions.

### 2B. Database Function: `process_token_transfer`

A `SECURITY DEFINER` function that atomically:
1. Checks supporter has sufficient balance
2. Deducts from supporter's `token_balances`
3. Credits to creator's `token_balances`
4. Inserts two `token_transactions` records (debit + credit)
5. Returns success/failure

This prevents race conditions and ensures consistency.

### 2C. Database Function: `process_token_deposit`

A `SECURITY DEFINER` function that:
1. Creates or updates `token_balances` for the user
2. Adds the deposit amount
3. Inserts a `token_transactions` record

### 2D. Database Function: `process_token_withdrawal`

A `SECURITY DEFINER` function that:
1. Checks creator has sufficient balance
2. Deducts from creator's `token_balances`
3. Inserts a `token_transactions` record
4. Called when admin approves a withdrawal

### 2E. Edge Function: `deposit-tokens`

New edge function that:
1. Accepts amount and payment method
2. Creates a RupantorPay checkout for token purchase
3. Returns payment URL

### 2F. Edge Function: `deposit-webhook` (or update `rupantor-webhook`)

On successful payment verification for a deposit:
1. Call `process_token_deposit` RPC
2. Send confirmation email
3. Send push notification

### 2G. Update `create-tip` Edge Function

Add a new flow path for token-based tipping:
- If supporter is logged in and has token balance, use `process_token_transfer` instead of RupantorPay
- If insufficient balance, return error with balance info so frontend can prompt deposit
- Keep existing RupantorPay flow as fallback for anonymous/guest tips

### 2H. Update Withdrawal Flow

When admin marks withdrawal as "completed":
- Call `process_token_withdrawal` to deduct from creator's token balance
- This fixes the existing balance accuracy gap

### 2I. New Page: `/deposit`

A deposit page where supporters/creators can:
- See current token balance
- Choose deposit amount (preset buttons: 100, 500, 1000, custom)
- Select payment method
- Proceed to RupantorPay checkout

### 2J. New Page: `/transactions`

Transaction history page showing:
- Filterable list of all token transactions
- Type badges (deposit, tip sent, tip received, withdrawal)
- Running balance column
- Date range filter

### 2K. UI Updates

- **Navbar**: Show token balance badge next to user avatar (for logged-in users)
- **Tip Form** (`CreatorProfile.tsx`): Add "Pay with Tokens" option for logged-in supporters with sufficient balance
- **Dashboard**: Show token balance card
- **Finance Page**: Replace gross `total_received` with actual token balance from `token_balances`

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/pages/Deposit.tsx` | Token deposit page |
| `src/pages/Transactions.tsx` | Transaction history page |
| `src/hooks/useTokenBalance.ts` | Hook to fetch/subscribe to token balance |
| `supabase/functions/deposit-tokens/index.ts` | Create deposit checkout |

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/send-email/index.ts` | Log sent emails to `outbound_emails` |
| `supabase/functions/send-reply-email/index.ts` | Log replies to `outbound_emails` |
| `supabase/functions/create-tip/index.ts` | Add token-based tipping path |
| `supabase/functions/rupantor-webhook/index.ts` | Handle deposit payment confirmations |
| `src/pages/admin/AdminMailbox.tsx` | Folder-aware fetching from both tables |
| `src/components/admin/ComposeEmailSheet.tsx` | Add Save Draft button, draft editing |
| `src/pages/CreatorProfile.tsx` | Add "Pay with Tokens" option |
| `src/pages/Finance.tsx` | Show token balance, link to transactions |
| `src/pages/Dashboard.tsx` | Show token balance card |
| `src/components/TopNavbar.tsx` | Show token balance in navbar |
| `src/App.tsx` | Add routes for `/deposit` and `/transactions` |

## Database Changes

| Change | Details |
|--------|---------|
| New table `outbound_emails` | Stores sent/draft/queued/failed outbound emails |
| New table `token_balances` | One row per user with current balance |
| New table `token_transactions` | Full audit trail of all token movements |
| New function `process_token_transfer` | Atomic tip transfer between balances |
| New function `process_token_deposit` | Credit tokens after payment |
| New function `process_token_withdrawal` | Deduct tokens on withdrawal approval |
| Indexes | On mailbox_id/status/is_deleted and profile_id/type/created_at |

---

## Implementation Order

1. Database migrations (all 3 tables + 3 functions + indexes + RLS)
2. Mailbox backend (outbound_emails logging in send-email/send-reply-email)
3. Mailbox frontend (folder switching, draft saving, trash actions)
4. Token balance hook + deposit edge function
5. Token deposit page + webhook handling
6. Token-based tipping (create-tip update + CreatorProfile UI)
7. Token withdrawal integration
8. Transaction history page
9. Navbar/Dashboard balance display
10. Fix the build error (send-push-notification web-push import)

---

## Build Error Fix

The current build error with `npm:web-push@3.6.7` in `send-push-notification/index.ts` will also be fixed by adding the import to the Deno config or switching to an esm.sh import.

