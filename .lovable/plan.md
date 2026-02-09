

# Email Alert Rules with Browser Push Notifications

## Overview

Add a system where you (the admin) can define rules that trigger browser push notifications when inbound emails match specific criteria. For example: "Notify me when an email arrives from `payments@rupantor.com`" or "Notify me when the subject contains `urgent`".

---

## How It Works

```text
Inbound Email Arrives (Resend webhook)
         |
         v
  resend-inbound-webhook saves email to DB
         |
         v
  Check email against alert rules in "email_alert_rules" table
         |
         v
  For each matching rule, call send-push-notification
  for the admin who created the rule
         |
         v
  Admin gets browser push notification with email subject/sender
```

---

## Part 1: Database Table

### New table: `email_alert_rules`

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid (PK) | Auto-generated |
| `profile_id` | uuid (FK to profiles) | Admin who created the rule |
| `name` | text | Human-readable label (e.g., "Payment alerts") |
| `match_type` | text | One of: `from_address`, `subject`, `body`, `any` |
| `match_value` | text | The string to match (e.g., "payments@rupantor.com" or "urgent") |
| `match_mode` | text | One of: `exact`, `contains` (default: `contains`) |
| `is_active` | boolean | Enable/disable without deleting |
| `created_at` | timestamptz | Auto-generated |

This table will be created via a migration SQL statement executed through the Supabase dashboard or a migration file.

---

## Part 2: Backend Changes

### Modify: `supabase/functions/resend-inbound-webhook/index.ts`

After successfully inserting the email (line 272), add logic to:

1. Query all active rules from `email_alert_rules`
2. For each rule, check if the email matches:
   - `from_address` -- match against `fromAddress`
   - `subject` -- match against `emailData.subject`
   - `body` -- match against `textBody`
   - `any` -- match against all three fields
3. For matching rules, call the existing `send-push-notification` edge function internally (via Supabase function invoke or direct HTTP call) with:
   - `profile_id` from the rule
   - `title`: "New Email Alert: [rule name]"
   - `body`: "From: [sender] - [subject]"
   - `url`: "/admin/mailbox"
   - `tag`: "email_alert"

This keeps the logic self-contained -- no new edge function needed.

---

## Part 3: Admin UI

### New section in Admin Mailbox: "Email Alerts" tab or button

**File: `src/components/admin/EmailAlertRulesDialog.tsx`** (new)

A dialog/sheet accessible from the Admin Mailbox page with:

- **List of existing rules** with toggle switches (active/inactive)
- **"Add Rule" form** with:
  - **Name** -- text input (e.g., "Payment notifications")
  - **Match Type** -- dropdown: "Sender Email", "Subject", "Body Content", "Any Field"
  - **Match Mode** -- dropdown: "Contains" (default), "Exact Match"
  - **Match Value** -- text input (e.g., "payments@rupantor.com" or "urgent")
- **Delete button** per rule
- **Push notification subscription prompt** -- if the admin hasn't enabled push notifications yet, show a button to subscribe (using the existing `usePushNotifications` hook)

### Modify: `src/pages/admin/AdminMailbox.tsx`

Add a "Bell" icon button in the mailbox header (next to Compose and Mass Email) that opens the EmailAlertRulesDialog.

---

## Part 4: Push Notification Prerequisite

The existing `usePushNotifications` hook and service worker (`sw.js`) handle subscription and display. The EmailAlertRulesDialog will:

1. Check if push notifications are supported and subscribed
2. If not, show a prominent "Enable Push Notifications" button before allowing rule creation
3. Use the existing `subscribe()` function from the hook

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/admin/EmailAlertRulesDialog.tsx` | UI for managing email alert rules |

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/resend-inbound-webhook/index.ts` | Add rule-matching and push notification trigger after email insert |
| `src/pages/admin/AdminMailbox.tsx` | Add "Email Alerts" button in header |

## Database Changes

| Change | Details |
|--------|---------|
| New table `email_alert_rules` | Created via SQL migration with RLS policies allowing admin access |

---

## Technical Details

### Rule Matching Logic (in resend-inbound-webhook)

```typescript
// After email is saved successfully...
const { data: rules } = await supabase
  .from('email_alert_rules')
  .select('*')
  .eq('is_active', true);

for (const rule of rules || []) {
  let matches = false;
  const value = rule.match_value.toLowerCase();
  const isExact = rule.match_mode === 'exact';

  const checkMatch = (field: string) => {
    const lower = field.toLowerCase();
    return isExact ? lower === value : lower.includes(value);
  };

  switch (rule.match_type) {
    case 'from_address':
      matches = checkMatch(fromAddress);
      break;
    case 'subject':
      matches = checkMatch(emailData.subject || '');
      break;
    case 'body':
      matches = checkMatch(textBody || '');
      break;
    case 'any':
      matches = checkMatch(fromAddress) ||
                checkMatch(emailData.subject || '') ||
                checkMatch(textBody || '');
      break;
  }

  if (matches) {
    // Fire push notification (fire-and-forget)
    await fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({
        profile_id: rule.profile_id,
        title: `Email Alert: ${rule.name}`,
        body: `From: ${fromName || fromAddress} — ${emailData.subject || '(No Subject)'}`,
        url: '/admin/mailbox',
        tag: 'email_alert',
      }),
    });
  }
}
```

### RLS Policy for `email_alert_rules`

```sql
-- Only admins can manage their own alert rules
CREATE POLICY "Admins can manage own alert rules"
ON email_alert_rules
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = email_alert_rules.profile_id
    AND profiles.is_admin = true
    AND profiles.clerk_user_id = current_setting('request.headers')::json->>'x-clerk-user-id'
  )
);
```

---

## Testing Checklist

1. Create an alert rule for a specific sender address
2. Send a test email from that address to a TipKoro mailbox
3. Verify browser push notification appears
4. Test "contains" vs "exact" matching
5. Test subject and body matching
6. Toggle rule inactive and verify no notification fires
7. Delete a rule and verify it's removed

