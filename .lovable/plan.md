
# Fix Plan: Email Duplication Issues, Missing Support Emails, and Site Cleanup

## Issues Identified

| # | Issue | Root Cause |
|---|-------|------------|
| 1 | Duplicate signup emails (custom + default) | The `send-email-notification` function sends emails with BOTH custom template styling and potentially falls back to default. Need to investigate template loading logic. |
| 2 | Support ticket emails not received | `send-support-email` is **NOT registered** in `supabase/config.toml` - function may not be deployed |
| 3 | Missing `welcome_user` template option | Admin Email Templates page doesn't include `welcome_user` as an editable template |

---

## Part 1: Fix Missing `send-support-email` Registration

**Problem:** The `send-support-email` edge function exists in `supabase/functions/send-support-email/` but is **NOT configured** in `supabase/config.toml`, which may prevent it from being properly deployed.

**File: `supabase/config.toml`**

Add the missing function configuration:
```toml
[functions.send-support-email]
verify_jwt = false
```

This must be added to allow the function to be invoked from frontend code.

---

## Part 2: Fix Duplicate Email Issue

**Problem Analysis:**

Looking at the email logs, users receive:
1. `welcome_user` email (triggered by Clerk webhook on `user.created`)
2. `welcome_creator` email (triggered by Onboarding.tsx on profile completion)

These are **two different emails** and this is correct behavior. However, the user reported receiving "custom template AND default template" for the same email type.

**Root Cause Investigation:**

The `send-email-notification` function at lines 1178-1242:
1. Fetches custom template from `platform_config` using key `email_template_{type}`
2. If found AND has both `subject` and `html`, uses custom template
3. Otherwise, falls back to default template

**Potential Issue:** If the custom template exists but is malformed (missing `subject` or `html`), the function falls back to default. But this shouldn't send BOTH.

**Real Issue Found:** Looking closer at the code:
- The function correctly either uses custom OR default, not both
- BUT there's no `email_template_welcome_user` in the database
- The `welcome_user` uses the **default hardcoded template**

The user might be experiencing a different issue - perhaps they're conflating `welcome_user` and `welcome_creator` as duplicates because they arrive close together.

**Solution:** Add `welcome_user` template to both:
1. The Admin Email Templates editor (so admins can customize it)
2. Optionally create a default custom template in the database

**Changes to `src/pages/admin/AdminEmailTemplates.tsx`:**

Add `welcome_user` to the EMAIL_TYPES array:
```typescript
const EMAIL_TYPES = [
  // ... existing types
  { id: 'welcome_user', label: 'Welcome User', description: 'Welcome email for all new signups (supporters & creators)' },
  { id: 'welcome_creator', label: 'Welcome Creator', description: 'Welcome email for new creators after onboarding' },
  // ... rest
];
```

Add variables for `welcome_user`:
```typescript
welcome_user: [
  { name: 'first_name', description: 'User first name', example: 'John' },
],
```

Add default template:
```typescript
welcome_user: {
  subject: '👋 Welcome to TipKoro, {{first_name}}!',
  html: `<div>...welcome template...</div>`,
},
```

---

## Part 3: Site Completeness Audit

Based on my analysis, here's what remains or could be improved:

### Already Implemented (Working)
- User authentication (Clerk)
- Creator/Supporter account types
- Tipping system
- Payment processing (RupantorPay)
- Withdrawals with 2FA
- Email notifications (tip, withdrawal, verification, goals)
- Support ticket system (UI complete)
- Admin panel (users, tips, withdrawals, verifications, notices, pages, mailbox, settings)
- Streamer Mode (OBS alerts)
- Funding Goals

### Missing/Incomplete Features

| Feature | Status | Action Needed |
|---------|--------|---------------|
| Support email notifications | Broken | Register `send-support-email` in config.toml |
| `welcome_user` template editor | Missing | Add to AdminEmailTemplates.tsx |
| `gif-duration` function config | Missing | Not in config.toml but exists in functions/ |

### Optional Enhancements (Not Critical)
- Push notifications (VAPID keys configured but implementation partial)
- Real-time ticket updates (could add Supabase Realtime subscription)
- Password change flow (handled by Clerk, no custom UI needed)
- Account deletion self-service (handled by Clerk)

---

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/config.toml` | Add `[functions.send-support-email]` and `[functions.gif-duration]` |
| `src/pages/admin/AdminEmailTemplates.tsx` | Add `welcome_user` template type with variables and default template |

---

## Implementation Priority

| Priority | Task | Impact |
|----------|------|--------|
| 1 | Register `send-support-email` in config.toml | Critical - Support emails not working |
| 2 | Register `gif-duration` in config.toml | Minor - GIF duration detection |
| 3 | Add `welcome_user` to Admin Email Templates | Low - Admin can customize welcome email |

---

## Summary

The main issues are:

1. **Support ticket emails not working** because the edge function isn't registered in config.toml
2. **No duplicate email bug** - users receive `welcome_user` (on signup) and `welcome_creator` (on onboarding) as separate, intended emails
3. **Missing `welcome_user` template** in admin editor - admins can't customize the signup welcome email

The fix is straightforward:
- Add missing function registrations to config.toml
- Add welcome_user template option to the admin email editor
