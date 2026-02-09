# Mailbox Backend Implementation

## Overview
Implement backend functionality for mailbox folder sections (Sent, Drafts, Outbox, Trash).

## Tasks

### Database Schema
- [ ] Create `outbound_emails` table for sent/draft/outbox emails
  - `id`, `mailbox_id`, `to_addresses`, `cc_addresses`, `bcc_addresses`
  - `subject`, `html_body`, `text_body`, `attachments`
  - `status` enum: `draft`, `queued`, `sent`, `failed`
  - `scheduled_at`, `sent_at`, `created_at`, `updated_at`
- [ ] Add `is_deleted` flag to `outbound_emails` for trash functionality
- [ ] Create indexes for common queries (mailbox_id, status, is_deleted)

### API/Edge Functions
- [ ] Create `save-draft` function to save/update draft emails
- [ ] Create `send-email` function to queue emails for sending
- [ ] Create `get-outbound-emails` function with folder filtering
- [ ] Update `delete-email` to handle soft-delete for trash

### Frontend Integration
- [ ] Filter `inbound_emails` by `is_deleted` for Inbox vs Trash
- [ ] Fetch `outbound_emails` filtered by status for Sent/Drafts/Outbox
- [ ] Add "Move to Trash" / "Restore" actions
- [ ] Add "Empty Trash" bulk action
- [ ] Update compose sheet to support saving drafts

### Nice-to-Have
- [ ] Scheduled sending (queue with `scheduled_at`)
- [ ] Retry failed sends with exponential backoff
- [ ] Email search across all folders

---

# Token Economy System (Major Feature)

## Overview
Overhaul the site economy where supporters deposit tokens (1 token = 1 BDT). Tokens are used for tipping creators and making withdrawals.

## Tasks

### Database Schema
- [ ] Create `token_balances` table (user_id, balance, created_at, updated_at)
- [ ] Create `token_transactions` table for audit trail
  - `id`, `user_id`, `type` (deposit, tip, withdrawal, refund)
  - `amount`, `balance_before`, `balance_after`
  - `reference_id` (tip_id, withdrawal_id, payment_id)
  - `created_at`
- [ ] Update `tips` table to deduct from supporter balance instead of direct payment
- [ ] Update `withdrawals` to convert token balance to BDT

### Deposit Flow
- [ ] Create deposit page for supporters to buy tokens
- [ ] Integrate payment gateway for token purchases
- [ ] Credit tokens to balance after successful payment
- [ ] Show token balance in user dashboard/navbar

### Tipping Flow
- [ ] Check sufficient token balance before tipping
- [ ] Deduct tokens from supporter balance
- [ ] Credit tokens to creator balance
- [ ] Show "Insufficient balance" with deposit prompt

### Withdrawal Flow
- [ ] Allow creators to request withdrawal of token balance
- [ ] Convert tokens to BDT (1:1) for payout
- [ ] Deduct tokens from creator balance on approval

### UI Updates
- [ ] Display token balance prominently in navbar
- [ ] Add "Buy Tokens" CTA throughout the site
- [ ] Update tip flow to show token deduction
- [ ] Transaction history page
