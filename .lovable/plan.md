
# Fix Email Threading: Use RFC 2822 Message-ID

## Problem Identified

Email replies are not threading properly because we're storing the wrong identifier:

**Currently stored in `inbound_emails.message_id`:**
```
8a268355-93d5-4afe-a85f-805174321a06
```

**What email clients expect for threading (RFC 2822 Message-ID):**
```
<CAEWTXuPfN=LzECjDJtgY9Vu03kgFvJnJUSHTt6TW@mail.gmail.com>
```

The `In-Reply-To` and `References` headers must contain the original email's RFC 2822 `Message-ID` (with angle brackets), not Resend's internal UUID.

## Root Cause

In `resend-inbound-webhook/index.ts`, we store:
```typescript
message_id: emailData.email_id,  // This is Resend's UUID, not the email's Message-ID
```

But Resend's Receiving API returns the actual `message_id` separately:
```json
{
  "id": "4ef9a417-02e9-4d39-ad75-9611e0fcc33c",
  "message_id": "<CAExample123@mail.gmail.com>",
  ...
}
```

## Solution

### 1. Update Inbound Webhook to Store Correct Message-ID

**File:** `supabase/functions/resend-inbound-webhook/index.ts`

When fetching the full email content from Resend's API, also extract and store the actual `message_id`:

```typescript
// Current code fetches:
htmlBody = fullEmail.html || htmlBody;
textBody = fullEmail.text || textBody;

// Add extraction of the RFC 2822 message_id:
const actualMessageId = fullEmail.message_id || null;
```

Then store it properly:
```typescript
// Change this:
message_id: emailData.email_id,

// To this (prioritize RFC 2822 message_id, fallback to email_id):
message_id: actualMessageId || `<${emailData.email_id}@resend.dev>`,
```

If `actualMessageId` is available (from the full email fetch), use it. If not available, wrap the UUID in angle brackets to at least follow RFC 2822 format.

### 2. Update Database Schema (Optional but Recommended)

Add a separate column to distinguish between Resend's internal ID and the email's Message-ID:

```sql
-- Add column to store Resend's email_id separately
ALTER TABLE inbound_emails ADD COLUMN IF NOT EXISTS resend_email_id text;
```

This allows us to:
- Keep `message_id` for the RFC 2822 Message-ID (used for threading)
- Store `resend_email_id` for Resend API calls (fetching content, etc.)

### 3. Update send-reply-email to Handle Both Formats

**File:** `supabase/functions/send-reply-email/index.ts`

Add a helper to ensure proper format:
```typescript
function ensureMessageIdFormat(messageId: string): string {
  // If already has angle brackets, return as-is
  if (messageId.startsWith('<') && messageId.endsWith('>')) {
    return messageId;
  }
  // Wrap in angle brackets for RFC 2822 compliance
  return `<${messageId}>`;
}
```

Use it when setting headers:
```typescript
if (in_reply_to) {
  headers["In-Reply-To"] = ensureMessageIdFormat(in_reply_to);
  
  const references: string[] = [];
  if (originalEmail?.message_id) {
    references.push(ensureMessageIdFormat(originalEmail.message_id));
  }
  // ...
  if (references.length > 0) {
    headers["References"] = references.join(" ");
  }
}
```

## Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/resend-inbound-webhook/index.ts` | Extract and store actual `message_id` from Resend API response |
| `supabase/functions/send-reply-email/index.ts` | Add helper to ensure RFC 2822 format with angle brackets |
| Database migration | Add `resend_email_id` column (optional) |

## Technical Details

### Email Threading Standards (RFC 2822)

Email clients thread messages using:
1. **`Message-ID`** - Unique identifier for each email, format: `<unique-id@domain>`
2. **`In-Reply-To`** - Contains the `Message-ID` of the email being replied to
3. **`References`** - Contains chain of `Message-ID`s in the conversation thread
4. **`Subject`** - Should start with `Re:` for replies

All `Message-ID` values MUST be enclosed in angle brackets `<>`.

### Why Current Implementation Fails

1. Resend's `email_id` is a UUID without angle brackets
2. Email clients (Gmail, Outlook) look for `In-Reply-To` matching the original `Message-ID`
3. Since we're sending a UUID instead of `<id@domain>` format, clients don't recognize it as a reply
4. Result: Reply appears as a separate conversation instead of threading

## Testing

After implementation:
1. Receive a new test email in the mailbox
2. Check database - `message_id` should have angle brackets format
3. Reply to the email from admin panel
4. Verify in sender's email client that reply appears in the same thread
5. Check email headers in sender's client to confirm `In-Reply-To` and `References` are correct
