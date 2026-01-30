
# Implementation Plan: Pricing Update, Noticeboard, Auth Redirect, Fee Naming, Authenticity Page & Streamer Mode Cleanup

## Overview

This plan addresses 6 requirements:
1. Update pricing section with clearer messaging about fixed fee and future commitment
2. Improve Streamer Mode settings page for clarity
3. Add admin Noticeboard with CRUD and new RBAC permission
4. Fix sign-in/sign-up redirect to dashboard
5. Standardize fee naming across the site
6. Add admin-editable Authenticity page with new RBAC permission

---

## 1. Update Pricing Section with Clear Fee Commitment

### Current State
- Pricing is mentioned in multiple places: Home.tsx, About.tsx, Finance.tsx, FAQSection.tsx, TermsOfService.tsx, SEO.tsx
- Some places say "platform fee", others say "creator account fee", "monthly fee"
- No mention of the 20% max percentage commitment

### Changes Required

**Files to modify:**
- `src/pages/Home.tsx` - Update pricing section
- `src/components/FAQSection.tsx` - Update FAQ answer
- `src/pages/TermsOfService.tsx` - Add pricing commitment clause
- `src/pages/Finance.tsx` - Update fee description

**Pricing Section Enhancement (Home.tsx):**
Add a new info box below the Creator pricing card explaining:
- "The ৳150/month is a **fixed flat fee** - not a percentage"
- "Whether you earn ৳1,000 or ৳1,00,000, you pay the same ৳150"
- Small note: "TipKoro reserves the right to transition to percentage-based pricing in the future. However, we commit that this percentage will **never exceed 20%** of your earnings."

**Terms of Service Update:**
Add new section "11. Pricing Commitment":
- Fixed fee guarantee at ৳150/month currently
- Commitment to maximum 20% cap if percentage model is adopted
- Advance notice of any pricing changes

---

## 2. Improve Streamer Mode Settings Page Clarity

### Current Issues
- Too many sections crammed together
- Not clear what each setting does
- Emergency controls mixed with regular settings

### Changes Required

**File: `src/components/StreamerSettings.tsx`**

Reorganize into clear sections with better headings and explanations:

1. **Quick Start Section** (when disabled)
   - Clear 3-step guide with visual indicators
   - "Enable Streamer Mode" as prominent CTA

2. **Control Panel** (when enabled)
   - Emergency Mute at the top (already good)
   - Alert URL section with OBS setup guide link

3. **Organized Settings Tabs:**
   - **Basic** - Animation, duration, minimum amount
   - **Sounds** - Enable/disable, tip-to-play sounds, TTS
   - **Visuals** - GIFs, emoji, media type
   - **Advanced** - Custom CSS

4. **Better Labels:**
   - Add tooltips/descriptions for complex settings
   - Group related settings together
   - Add visual separators

---

## 3. Add Admin Noticeboard with CRUD

### Database Changes

**New Table: `notices`**
```sql
CREATE TABLE public.notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info', -- 'info', 'warning', 'success', 'error'
  is_active BOOLEAN DEFAULT true,
  show_on_home BOOLEAN DEFAULT false,
  show_on_dashboard BOOLEAN DEFAULT false,
  priority INTEGER DEFAULT 0, -- Higher = more important
  starts_at TIMESTAMPTZ DEFAULT now(),
  ends_at TIMESTAMPTZ, -- NULL = no expiry
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**RLS Policies:**
- Admins with `can_manage_notices` can CRUD
- Public can SELECT where `is_active = true` and within date range

**Admin Roles Table Update:**
```sql
ALTER TABLE public.admin_roles 
ADD COLUMN can_manage_notices BOOLEAN NOT NULL DEFAULT false;
```

### Frontend Changes

**New Files:**
- `src/pages/admin/AdminNotices.tsx` - CRUD interface for notices
- `src/components/NoticeBar.tsx` - Display component for notices
- `src/hooks/useNotices.ts` - Hook to fetch active notices

**Modified Files:**
- `src/pages/admin/AdminLayout.tsx` - Add "Notices" nav item
- `src/hooks/useAdminPermissions.ts` - Add `canManageNotices` permission
- `src/pages/Home.tsx` - Display home page notices
- `src/pages/Dashboard.tsx` - Display dashboard notices

**Admin Interface Features:**
- List all notices with status indicators
- Create/Edit form with:
  - Title, Content (rich text or markdown)
  - Type selector (info/warning/success/error)
  - Active toggle
  - Show on Home/Dashboard toggles
  - Priority field
  - Date range (optional end date)
- Delete confirmation

---

## 4. Fix Sign-in/Sign-up Redirect to Dashboard

### Current State
```tsx
// main.tsx
<ClerkProvider 
  afterSignInUrl="/complete-profile"
  afterSignUpUrl="/complete-profile"
>
```

The issue: Users are always sent to `/complete-profile` which checks if onboarding is done and redirects. But this causes a flash/delay.

### Solution

Per Clerk documentation for React apps, use the `signInFallbackRedirectUrl` and `signUpFallbackRedirectUrl` props instead of `afterSignInUrl`/`afterSignUpUrl`:

**Option 1: Keep current flow (recommended)**
The current flow is actually correct:
- `/complete-profile` checks onboarding status
- If completed, redirects to `/dashboard`
- If not completed, shows onboarding

The issue might be that the redirect in `CompleteProfile.tsx` happens client-side after render.

**Improvement: Use `signInForceRedirectUrl` and `signUpForceRedirectUrl`**

```tsx
// main.tsx
<ClerkProvider 
  publishableKey={clerkPublishableKey} 
  afterSignOutUrl="/"
  signInForceRedirectUrl="/complete-profile"
  signUpForceRedirectUrl="/complete-profile"
>
```

**Alternative: Use Clerk's routing detection**

The `CompleteProfile` component already handles the logic correctly. The perceived issue might be loading state. Optimize the loading check:

```tsx
// CompleteProfile.tsx - Ensure faster redirect
useEffect(() => {
  if (profile && profile.onboarding_status === 'completed') {
    window.location.replace('/dashboard'); // Force immediate redirect
  }
}, [profile]);
```

---

## 5. Standardize Fee Naming Across Site

### Current Inconsistencies Found:
| Location | Current Name |
|----------|--------------|
| Home.tsx | "Platform fee" |
| Finance.tsx | "Creator Account Fee" |
| FAQSection.tsx | "flat fee" |
| AdminDashboard.tsx | "Creator Account Fee" |
| AdminSettings.tsx | "Creator Account Fee" |
| Onboarding.tsx | "Platform Fee" |

### Standardized Name: **"Creator Fee"**

Short, clear, and consistent. Alternative: "TipKoro Fee"

**Files to Update:**
- `src/pages/Home.tsx` - Line 221
- `src/pages/Finance.tsx` - Lines 143, 328, 414, 486-488
- `src/components/FAQSection.tsx` - Line 16
- `src/pages/admin/AdminDashboard.tsx` - Line 254
- `src/pages/admin/AdminSettings.tsx` - Lines 89, 96
- `src/components/Onboarding.tsx` - Lines 341, 346
- `src/pages/TermsOfService.tsx` - Line 56
- Any other occurrences

---

## 6. Add Admin-Editable Authenticity Page

### Database Changes

**New Table: `pages`** (for any future admin-editable pages)
```sql
CREATE TABLE public.pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL, -- 'authenticity', 'about', etc.
  title TEXT NOT NULL,
  content TEXT NOT NULL, -- Markdown content
  meta_description TEXT,
  is_published BOOLEAN DEFAULT true,
  updated_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Seed default authenticity page
INSERT INTO pages (slug, title, content, meta_description) VALUES (
  'authenticity',
  'Our Commitment to Trust & Security',
  '## Your Money is Safe

TipKoro is built on trust. Here''s how we protect your earnings:

### Secure Payment Processing
All transactions are processed through RupantorPay, a licensed payment gateway in Bangladesh.

### Quick Withdrawals
Request withdrawals anytime. We process them within 3-5 business days.

### Verified Creators
We verify creator identities to prevent fraud and protect supporters.

### Data Protection
Your personal information is encrypted and never sold to third parties.

### Contact Us
Questions about security? Email us at security@tipkoro.com',
  'Learn about TipKoro''s commitment to security, trust, and protecting creator earnings in Bangladesh.'
);
```

**RLS Policies:**
- Public can SELECT where `is_published = true`
- Admins with `can_manage_pages` can CRUD

**Admin Roles Table Update:**
```sql
ALTER TABLE public.admin_roles 
ADD COLUMN can_manage_pages BOOLEAN NOT NULL DEFAULT false;
```

### Frontend Changes

**New Files:**
- `src/pages/Authenticity.tsx` - Public page rendering markdown content
- `src/pages/admin/AdminPages.tsx` - CRUD interface for pages
- `src/hooks/usePages.ts` - Hook to fetch page content

**Modified Files:**
- `src/App.tsx` - Add `/authenticity` route
- `src/pages/admin/AdminLayout.tsx` - Add "Pages" nav item
- `src/hooks/useAdminPermissions.ts` - Add `canManagePages` permission
- `src/components/MainFooter.tsx` - Add link to Authenticity page

**Admin Interface:**
- List all editable pages
- Edit page with:
  - Title
  - Content (Markdown editor or textarea)
  - Meta description for SEO
  - Published toggle
- Preview functionality

---

## Implementation Order

| Priority | Task | Complexity | Files |
|----------|------|------------|-------|
| 1 | Fix auth redirect | Low | main.tsx |
| 2 | Standardize fee naming | Low | 8+ files |
| 3 | Update pricing section | Medium | Home.tsx, FAQSection.tsx, TermsOfService.tsx |
| 4 | Add Noticeboard | High | New DB table, 3 new files, 4 modified |
| 5 | Add Authenticity page | High | New DB table, 3 new files, 4 modified |
| 6 | Improve Streamer Settings | Medium | StreamerSettings.tsx |

---

## Summary of Database Migrations

```sql
-- Migration: Add notices and pages tables with RBAC

-- 1. Notices table
CREATE TABLE public.notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  is_active BOOLEAN DEFAULT true,
  show_on_home BOOLEAN DEFAULT false,
  show_on_dashboard BOOLEAN DEFAULT false,
  priority INTEGER DEFAULT 0,
  starts_at TIMESTAMPTZ DEFAULT now(),
  ends_at TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Pages table
CREATE TABLE public.pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  meta_description TEXT,
  is_published BOOLEAN DEFAULT true,
  updated_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Add new permissions
ALTER TABLE public.admin_roles 
ADD COLUMN can_manage_notices BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN can_manage_pages BOOLEAN NOT NULL DEFAULT false;

-- 4. RLS for notices
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active notices"
ON public.notices FOR SELECT
USING (
  is_active = true 
  AND starts_at <= now() 
  AND (ends_at IS NULL OR ends_at > now())
);

CREATE POLICY "Admins can manage notices"
ON public.notices FOR ALL
USING (is_admin());

-- 5. RLS for pages
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published pages"
ON public.pages FOR SELECT
USING (is_published = true);

CREATE POLICY "Admins can manage pages"
ON public.pages FOR ALL
USING (is_admin());

-- 6. Seed default authenticity page
INSERT INTO public.pages (slug, title, content, meta_description) VALUES (
  'authenticity',
  'Our Commitment to Trust & Security',
  '## Your Money is Safe with TipKoro

TipKoro is built on a foundation of trust. As a creator, your earnings are our top priority. Here is how we ensure your money stays safe:

### Secure Payment Processing
All transactions are processed through **RupantorPay**, a licensed and regulated payment gateway in Bangladesh. Every payment is encrypted end-to-end.

### Quick & Reliable Withdrawals
Request a withdrawal anytime through your dashboard. We process all withdrawal requests within **3-5 business days** to your bKash, Nagad, or Rocket wallet.

### Verified Creator Program
We verify creator identities through our verification system. This protects both creators and supporters from fraud.

### Data Protection
Your personal information is encrypted and stored securely. We **never sell** your data to third parties.

### 2-Factor Withdrawal Security
Withdrawals require both your secret PIN and a one-time verification code sent to your email. This ensures only you can access your funds.

### Transparent Pricing
We charge a simple, fixed **Creator Fee** - currently ৳150/month. No hidden fees, no surprise deductions.

---

Have questions about security? Contact us at **security@tipkoro.com**',
  'Learn about TipKoro commitment to security, trust, and protecting creator earnings in Bangladesh.'
);
```

---

## Files Summary

**New Files to Create:**
1. `src/pages/admin/AdminNotices.tsx`
2. `src/pages/admin/AdminPages.tsx`
3. `src/pages/Authenticity.tsx`
4. `src/components/NoticeBar.tsx`
5. `src/hooks/useNotices.ts`
6. `src/hooks/usePages.ts`

**Files to Modify:**
1. `src/main.tsx` - Auth redirect props
2. `src/App.tsx` - Add routes
3. `src/pages/Home.tsx` - Pricing update, notice display
4. `src/pages/Dashboard.tsx` - Notice display
5. `src/pages/Finance.tsx` - Fee naming
6. `src/pages/TermsOfService.tsx` - Pricing commitment section
7. `src/components/FAQSection.tsx` - Fee naming
8. `src/components/MainFooter.tsx` - Authenticity link
9. `src/components/Onboarding.tsx` - Fee naming
10. `src/components/StreamerSettings.tsx` - UX improvements
11. `src/pages/admin/AdminLayout.tsx` - New nav items
12. `src/pages/admin/AdminSettings.tsx` - Fee naming
13. `src/pages/admin/AdminDashboard.tsx` - Fee naming
14. `src/pages/admin/AdminAdmins.tsx` - New permission checkboxes
15. `src/hooks/useAdminPermissions.ts` - New permissions
16. `src/components/SEO.tsx` - Fee naming in default description
