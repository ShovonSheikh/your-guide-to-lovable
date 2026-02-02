
# Comprehensive Platform Enhancement Plan

## Overview

This plan addresses 6 simultaneous improvements to the TipKoro platform:

1. **Move Withdrawal Security Rate Limiting to Database** - Replace in-memory storage with persistent database-backed rate limiting
2. **Add Support Email Templates** - Integrate support ticket emails into the customizable template system
3. **Improve Email Template Dropdown UX** - Make the crowded selector more scannable with categories
4. **Add CSV Export for Earnings** - Allow creators to download their tip history
5. **Prepare for Percentage-Based Fees** - Add database configuration for future fee model transition
6. **Connect Push Notification Infrastructure** - Wire up the existing `push_subscriptions` table

---

## 1. Database-Backed Withdrawal Rate Limiting

### Current Problem
The `withdrawal-security` edge function uses in-memory rate limiting:
```typescript
const rateLimitMap = new Map<string, { attempts: number; lastAttempt: number }>();
```

This resets when the function cold-starts, allowing attackers to bypass limits by waiting for function restarts.

### Solution
Reuse the existing database-backed pattern from `create-tip`:

**File: `supabase/functions/withdrawal-security/index.ts`**

Replace the in-memory logic (lines 18-56) with database calls:

```typescript
// Database-backed rate limiting (same pattern as create-tip)
const RATE_LIMIT = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

async function checkAndUpdateRateLimit(
  supabase: any,
  identifier: string,
  action: string
): Promise<{ allowed: boolean; remaining: number }> {
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
  
  const { data: existingRecord } = await supabase
    .from('rate_limits')
    .select('id, count, window_start')
    .eq('action', action)
    .eq('identifier', identifier)
    .gte('window_start', windowStart)
    .order('window_start', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingRecord) {
    if (existingRecord.count >= RATE_LIMIT) {
      return { allowed: false, remaining: 0 };
    }
    await supabase
      .from('rate_limits')
      .update({ count: existingRecord.count + 1, updated_at: new Date().toISOString() })
      .eq('id', existingRecord.id);
    return { allowed: true, remaining: RATE_LIMIT - existingRecord.count - 1 };
  }
  
  await supabase
    .from('rate_limits')
    .insert({ action, identifier, count: 1, window_start: new Date().toISOString() });
  return { allowed: true, remaining: RATE_LIMIT - 1 };
}

async function recordFailedAttempt(supabase: any, profileId: string): Promise<void> {
  await checkAndUpdateRateLimit(supabase, profileId, 'withdrawal_pin_verify');
}

async function resetRateLimit(supabase: any, profileId: string): Promise<void> {
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
  await supabase
    .from('rate_limits')
    .delete()
    .eq('action', 'withdrawal_pin_verify')
    .eq('identifier', profileId)
    .gte('window_start', windowStart);
}
```

Update all calls to use `supabase` parameter and `await`.

---

## 2. Support Email Templates

### Current State
The `send-support-email` edge function has hardcoded HTML templates for:
- `ticket_created`
- `new_reply`
- `ticket_closed`

These are not editable by admins and don't match the design system of other emails.

### Solution

**A. Add Support Email Types to Admin Panel**

**File: `src/pages/admin/AdminEmailTemplates.tsx`**

Add to `EMAIL_TYPES` array (around line 22):
```typescript
{ id: 'support_ticket_created', label: 'Support: Ticket Created', description: 'Sent when a support ticket is created' },
{ id: 'support_new_reply', label: 'Support: New Reply', description: 'Sent when admin replies to a ticket' },
{ id: 'support_ticket_closed', label: 'Support: Ticket Closed', description: 'Sent when a support ticket is closed' },
```

Add to `DYNAMIC_VARIABLES`:
```typescript
support_ticket_created: [
  { name: 'name', description: 'User name', example: 'John' },
  { name: 'ticket_number', description: 'Ticket reference', example: 'TK-20260202-A1B2' },
  { name: 'subject', description: 'Ticket subject', example: 'Payment Issue' },
  { name: 'ticket_url', description: 'Link to ticket', example: 'https://tipkoro.com/support/ticket/xxx' },
],
support_new_reply: [
  { name: 'ticket_number', description: 'Ticket reference', example: 'TK-20260202-A1B2' },
  { name: 'message_preview', description: 'Preview of reply', example: 'Thank you for contacting us...' },
  { name: 'ticket_url', description: 'Link to ticket', example: 'https://tipkoro.com/support/ticket/xxx' },
],
support_ticket_closed: [
  { name: 'ticket_number', description: 'Ticket reference', example: 'TK-20260202-A1B2' },
  { name: 'subject', description: 'Ticket subject', example: 'Payment Issue' },
],
```

Add to `DEFAULT_TEMPLATES` with the TipKoro design system (matching existing templates).

**B. Update Edge Function to Use Custom Templates**

**File: `supabase/functions/send-support-email/index.ts`**

Modify to fetch templates from `platform_config`:
```typescript
// Fetch custom template
const templateKey = `email_template_support_${type}`;
const { data: customTemplate } = await supabase
  .from('platform_config')
  .select('value')
  .eq('key', templateKey)
  .maybeSingle();

let emailHtml = '';
let emailSubject = '';

if (customTemplate?.value) {
  const template = customTemplate.value as { subject: string; html: string };
  emailSubject = replaceVariables(template.subject, variables);
  emailHtml = replaceVariables(template.html, variables);
} else {
  // Fallback to hardcoded defaults (existing switch statement)
}
```

---

## 3. Improve Email Template Dropdown UX

### Current Problem
The dropdown has 16+ items in a flat list, making it hard to find specific templates.

### Solution
Group templates by category with visual separators.

**File: `src/pages/admin/AdminEmailTemplates.tsx`**

Replace flat `EMAIL_TYPES` with categorized structure:

```typescript
const EMAIL_CATEGORIES = [
  {
    label: 'User & Creator',
    types: [
      { id: 'welcome_user', label: 'Welcome User', description: '...' },
      { id: 'welcome_creator', label: 'Welcome Creator', description: '...' },
    ]
  },
  {
    label: 'Tips',
    types: [
      { id: 'tip_received', label: 'Tip Received', description: '...' },
      { id: 'tip_sent', label: 'Tip Sent', description: '...' },
    ]
  },
  {
    label: 'Withdrawals',
    types: [
      { id: 'withdrawal_submitted', ... },
      { id: 'withdrawal_processing', ... },
      { id: 'withdrawal_completed', ... },
      { id: 'withdrawal_rejected', ... },
      { id: 'withdrawal_otp', ... },
    ]
  },
  {
    label: 'Verification',
    types: [
      { id: 'verification_approved', ... },
      { id: 'verification_rejected', ... },
    ]
  },
  {
    label: 'Funding Goals',
    types: [
      { id: 'goal_milestone_25', ... },
      { id: 'goal_milestone_50', ... },
      { id: 'goal_milestone_75', ... },
      { id: 'goal_milestone_100', ... },
    ]
  },
  {
    label: 'Support',
    types: [
      { id: 'support_ticket_created', ... },
      { id: 'support_new_reply', ... },
      { id: 'support_ticket_closed', ... },
    ]
  },
  {
    label: 'Other',
    types: [
      { id: 'weekly_summary', ... },
    ]
  }
];
```

Update the Select component to use grouped items:
```tsx
<SelectContent className="max-h-[400px]">
  {EMAIL_CATEGORIES.map((category) => (
    <React.Fragment key={category.label}>
      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50 sticky top-0">
        {category.label}
      </div>
      {category.types.map(type => (
        <SelectItem key={type.id} value={type.id}>
          {type.label}
        </SelectItem>
      ))}
    </React.Fragment>
  ))}
</SelectContent>
```

---

## 4. CSV Export for Earnings

### Implementation

**File: `src/pages/Finance.tsx`**

Add export functionality:

```typescript
import { Download } from 'lucide-react';

// Add state
const [exporting, setExporting] = useState(false);

// Add export function
const handleExportCSV = async () => {
  if (!profile?.id) return;
  setExporting(true);
  
  try {
    // Fetch all completed tips (no limit)
    const { data: tips, error } = await supabase
      .from('tips')
      .select('id, supporter_name, supporter_email, amount, currency, message, is_anonymous, payment_method, transaction_id, created_at')
      .eq('creator_id', profile.id)
      .eq('payment_status', 'completed')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    if (!tips || tips.length === 0) {
      toast({ title: 'No Data', description: 'No tips to export yet.' });
      return;
    }
    
    // Build CSV
    const headers = ['Date', 'Supporter Name', 'Amount', 'Currency', 'Message', 'Payment Method', 'Transaction ID'];
    const rows = tips.map(tip => [
      format(new Date(tip.created_at), 'yyyy-MM-dd HH:mm:ss'),
      tip.is_anonymous ? 'Anonymous' : tip.supporter_name,
      tip.amount,
      tip.currency || 'BDT',
      `"${(tip.message || '').replace(/"/g, '""')}"`, // Escape quotes
      tip.payment_method || '',
      tip.transaction_id || '',
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tipkoro-earnings-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast({ title: 'Exported!', description: `${tips.length} tips exported to CSV.` });
  } catch (err) {
    console.error('Export error:', err);
    toast({ title: 'Error', description: 'Failed to export data.', variant: 'destructive' });
  } finally {
    setExporting(false);
  }
};
```

Add button in the "Earnings History" section header:
```tsx
<div className="flex items-center justify-between mb-6">
  <h2 className="text-xl font-semibold flex items-center gap-2">
    <Calendar className="w-5 h-5" />
    Earnings History
  </h2>
  <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={exporting}>
    {exporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
    Export CSV
  </Button>
</div>
```

---

## 5. Percentage-Based Fee Preparation

### Current State
The platform uses a fixed ৳150/month fee stored in `platform_config`:
```json
{ "key": "creator_account_fee", "value": { "amount": 150, "currency": "BDT" } }
```

### Solution
Add configuration to support both fixed and percentage-based models.

**A. Database Migration**

Add new config entries:
```sql
INSERT INTO platform_config (key, value, description) VALUES
('fee_model', '{"type": "fixed"}', 'Fee model: fixed or percentage'),
('percentage_fee', '{"rate": 15, "min_amount": 0}', 'Percentage-based fee settings (rate in %)');
```

**B. Update `usePlatformConfig.ts`**

```typescript
interface PlatformConfig {
  // Existing...
  fee_model: { type: 'fixed' | 'percentage' };
  percentage_fee: { rate: number; min_amount: number };
}

const DEFAULT_CONFIG: PlatformConfig = {
  // Existing...
  fee_model: { type: 'fixed' },
  percentage_fee: { rate: 15, min_amount: 0 },
};
```

**C. Update Finance.tsx fee calculation**

```typescript
const { config } = usePlatformConfig();

// Calculate fee based on model
let creatorFee = 150; // Default
if (config.fee_model.type === 'percentage') {
  creatorFee = Math.max(
    config.percentage_fee.min_amount,
    Math.round(totalReceived * (config.percentage_fee.rate / 100))
  );
} else {
  creatorFee = config.creator_account_fee.amount;
}

// Available balance formula stays the same
const availableBalance = Math.max(0, totalReceived - creatorFee - pendingWithdrawalsTotal);
```

**D. Update withdrawal validation trigger**

The database trigger `check_withdrawal_amount()` also needs updating to support percentage fees:

```sql
CREATE OR REPLACE FUNCTION public.check_withdrawal_amount()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public' AS $function$
DECLARE
  total_received NUMERIC;
  pending_withdrawals NUMERIC;
  creator_fee NUMERIC;
  available_balance NUMERIC;
  fee_model JSONB;
  fixed_fee JSONB;
  percentage_fee JSONB;
BEGIN
  -- Fetch fee configuration
  SELECT value INTO fee_model FROM platform_config WHERE key = 'fee_model';
  SELECT value INTO fixed_fee FROM platform_config WHERE key = 'creator_account_fee';
  SELECT value INTO percentage_fee FROM platform_config WHERE key = 'percentage_fee';
  
  -- Get total received
  SELECT COALESCE(p.total_received, 0) INTO total_received
  FROM profiles p WHERE p.id = NEW.profile_id;
  
  -- Calculate fee based on model
  IF (fee_model->>'type') = 'percentage' THEN
    creator_fee := GREATEST(
      COALESCE((percentage_fee->>'min_amount')::NUMERIC, 0),
      ROUND(total_received * (COALESCE((percentage_fee->>'rate')::NUMERIC, 15) / 100))
    );
  ELSE
    creator_fee := COALESCE((fixed_fee->>'amount')::NUMERIC, 150);
  END IF;
  
  -- Calculate pending withdrawals
  SELECT COALESCE(SUM(amount), 0) INTO pending_withdrawals
  FROM withdrawal_requests
  WHERE profile_id = NEW.profile_id
    AND status IN ('pending', 'processing')
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);
  
  available_balance := total_received - creator_fee - pending_withdrawals;
  
  IF NEW.amount > available_balance THEN
    RAISE EXCEPTION 'Insufficient balance. Available: %, Requested: %', available_balance, NEW.amount;
  END IF;
  
  RETURN NEW;
END;
$function$;
```

---

## 6. Push Notification Infrastructure

### Current State
- `push_subscriptions` table exists with RLS policies
- No code is using it

### Solution

**A. Create Edge Function for Sending Push Notifications**

**File: `supabase/functions/send-push-notification/index.ts`**

```typescript
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PushRequest {
  profile_id: string;
  title: string;
  body: string;
  url?: string;
  icon?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
  const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  if (!vapidPublicKey || !vapidPrivateKey) {
    return new Response(
      JSON.stringify({ error: "VAPID keys not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  webpush.setVapidDetails(
    "mailto:support@tipkoro.com",
    vapidPublicKey,
    vapidPrivateKey
  );

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const { profile_id, title, body, url, icon }: PushRequest = await req.json();

  // Fetch subscriptions for this profile
  const { data: subscriptions, error } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .eq('profile_id', profile_id);

  if (error || !subscriptions?.length) {
    return new Response(
      JSON.stringify({ success: true, sent: 0 }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const payload = JSON.stringify({
    title,
    body,
    icon: icon || '/favicon.ico',
    data: { url: url || 'https://tipkoro.com/dashboard' },
  });

  let sent = 0;
  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload
      );
      sent++;
    } catch (err) {
      console.error("Push failed:", err);
      // Remove invalid subscription
      if (err.statusCode === 410) {
        await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
      }
    }
  }

  return new Response(
    JSON.stringify({ success: true, sent }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
```

**B. Add Service Worker Registration**

**File: `src/hooks/usePushNotifications.ts`**

```typescript
import { useCallback, useEffect, useState } from 'react';
import { useProfile } from './useProfile';
import { supabase } from '@/integrations/supabase/client';

export function usePushNotifications() {
  const { profile } = useProfile();
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsSupported('serviceWorker' in navigator && 'PushManager' in window);
    checkSubscription();
  }, [profile?.id]);

  const checkSubscription = async () => {
    if (!profile?.id) return;
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    setIsSubscribed(!!subscription);
    setIsLoading(false);
  };

  const subscribe = useCallback(async () => {
    if (!profile?.id || !isSupported) return;
    
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: import.meta.env.VITE_VAPID_PUBLIC_KEY,
    });
    
    const { endpoint, keys } = subscription.toJSON();
    await supabase.from('push_subscriptions').insert({
      profile_id: profile.id,
      endpoint,
      p256dh: keys?.p256dh || '',
      auth: keys?.auth || '',
    });
    
    setIsSubscribed(true);
  }, [profile?.id, isSupported]);

  const unsubscribe = useCallback(async () => {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await subscription.unsubscribe();
      await supabase.from('push_subscriptions').delete().eq('endpoint', subscription.endpoint);
    }
    setIsSubscribed(false);
  }, []);

  return { isSupported, isSubscribed, isLoading, subscribe, unsubscribe };
}
```

**C. Update Service Worker**

**File: `public/sw.js`** (add push handler):

```javascript
self.addEventListener('push', (event) => {
  const data = event.data?.json() || { title: 'TipKoro', body: 'You have a notification!' };
  
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || '/favicon.ico',
      badge: '/favicon.ico',
      data: data.data,
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/dashboard';
  event.waitUntil(clients.openWindow(url));
});
```

**D. Add Toggle in Settings**

Add a "Push Notifications" toggle in the Notifications tab of Settings, using `usePushNotifications()`.

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `supabase/functions/withdrawal-security/index.ts` | Modify | Database-backed rate limiting |
| `supabase/functions/send-support-email/index.ts` | Modify | Use custom templates |
| `supabase/functions/send-push-notification/index.ts` | Create | Push notification sending |
| `src/pages/admin/AdminEmailTemplates.tsx` | Modify | Categories + support templates |
| `src/pages/Finance.tsx` | Modify | CSV export + percentage fee |
| `src/hooks/usePlatformConfig.ts` | Modify | Fee model config |
| `src/hooks/usePushNotifications.ts` | Create | Push subscription hook |
| `public/sw.js` | Modify | Push event handling |
| `supabase/config.toml` | Modify | Add send-push-notification |
| Database migration | Create | Fee model config + trigger update |

---

## Testing Checklist

1. **Withdrawal Security**: Try failed PIN attempts, verify they persist across function restarts
2. **Support Emails**: Create ticket, reply as admin, close ticket - verify emails sent with custom templates
3. **Email Dropdown**: Verify categories display correctly and selection works
4. **CSV Export**: Download CSV, open in Excel/Sheets, verify data integrity
5. **Percentage Fee**: Change fee model in database, verify Finance page calculates correctly
6. **Push Notifications**: Subscribe, trigger a tip, verify notification appears

---

## Technical Notes

- VAPID keys already exist in Supabase secrets (`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`)
- The percentage fee system is prepared but defaults to fixed mode - no breaking changes
- Database-backed rate limiting uses the existing `rate_limits` table with service_role access
- Push notifications require browser permission - graceful fallback if denied
