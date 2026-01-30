-- Migration: Add notices and pages tables with RBAC for noticeboard and authenticity page

-- 1. Create notices table for admin noticeboard
CREATE TABLE public.notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info', -- 'info', 'warning', 'success', 'error'
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

-- 2. Create pages table for admin-editable pages (authenticity, etc.)
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

-- 3. Add new RBAC permissions to admin_roles
ALTER TABLE public.admin_roles 
ADD COLUMN can_manage_notices BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN can_manage_pages BOOLEAN NOT NULL DEFAULT false;

-- 4. Enable RLS for notices
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

-- 5. Enable RLS for pages
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published pages"
ON public.pages FOR SELECT
USING (is_published = true);

CREATE POLICY "Admins can manage pages"
ON public.pages FOR ALL
USING (is_admin());

-- 6. Add updated_at triggers
CREATE TRIGGER update_notices_updated_at
BEFORE UPDATE ON public.notices
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pages_updated_at
BEFORE UPDATE ON public.pages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Seed default authenticity page
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
We charge a simple, fixed **Creator Fee** of ৳150/month. No hidden fees, no surprise deductions.

---

Have questions about security? Contact us at **security@tipkoro.com**',
  'Learn about TipKoro commitment to security, trust, and protecting creator earnings in Bangladesh.'
);