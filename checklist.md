# TipKoro Launch Checklist

## Pre-Launch Checklist

### 🔐 Authentication & Security

- [ ] **Clerk Production Keys**
  - [ ] Switch from Clerk development to production instance
  - [ ] Update `VITE_CLERK_PUBLISHABLE_KEY` in Lovable environment
  - [ ] Update `CLERK_WEBHOOK_SECRET` in Supabase secrets
  - [ ] Verify webhook endpoint in Clerk dashboard points to production URL

- [ ] **Supabase Secrets Verified**
  - [ ] `SUPABASE_URL` - Correct production URL
  - [ ] `SUPABASE_ANON_KEY` - Production anon key
  - [ ] `SUPABASE_SERVICE_ROLE_KEY` - Production service role key
  - [ ] `RESEND_API_KEY` - Valid Resend API key
  - [ ] `RUPANTOR_API_KEY` - Production RupantorPay API key
  - [ ] `RUPANTOR_CLIENT_HOST` - Set to `tipkoro.com`
  - [ ] `CLERK_WEBHOOK_SECRET` - Production webhook secret
  - [ ] `VAPID_PUBLIC_KEY` & `VAPID_PRIVATE_KEY` - For push notifications

### 📧 Email Configuration

- [ ] **Resend Domain Verification**
  - [ ] Domain `tipkoro.com` verified in Resend dashboard
  - [ ] SPF record configured
  - [ ] DKIM record configured
  - [ ] DMARC record configured (recommended)
  - [ ] All sender addresses working:
    - [ ] `notifications@tipkoro.com`
    - [ ] `finance@tipkoro.com`
    - [ ] `welcome@tipkoro.com`
    - [ ] `hello@tipkoro.com`
    - [ ] `support@tipkoro.com`

- [ ] **Email Testing**
  - [ ] Send test tip → verify `tip_received` email delivered
  - [ ] Submit test withdrawal → verify `withdrawal_submitted` email
  - [ ] Test OTP email → verify `withdrawal_otp` email
  - [ ] Check emails not going to spam folder

### 🌐 Domain & DNS

- [ ] **Custom Domain Setup**
  - [ ] A record for `@` pointing to `185.158.133.1`
  - [ ] A record for `www` pointing to `185.158.133.1`
  - [ ] TXT record `_lovable` with verification value
  - [ ] SSL certificate provisioned (automatic)
  - [ ] Both `tipkoro.com` and `www.tipkoro.com` resolve correctly
  - [ ] Primary domain set (other redirects to primary)

- [ ] **DNS Propagation**
  - [ ] Check with [DNSChecker.org](https://dnschecker.org)
  - [ ] Wait up to 72 hours if needed

### 💳 Payment Gateway

- [ ] **RupantorPay Configuration**
  - [ ] Production API key configured
  - [ ] Webhook URL updated to `https://tipkoro.com` endpoints
  - [ ] Success/cancel URLs use production domain
  - [ ] Test payment flow end-to-end
  - [ ] Verify webhook receives payment confirmations

- [ ] **Payment Testing**
  - [ ] Complete a real ৳10 test tip
  - [ ] Verify tip appears in database
  - [ ] Verify creator stats updated
  - [ ] Verify email notifications sent

### 📊 Database & Backend

- [ ] **Database Ready**
  - [ ] All migrations applied
  - [ ] RLS policies in place for all tables
  - [ ] Indexes created for frequently queried columns
  - [ ] No test data in production database

- [ ] **Edge Functions Deployed**
  - [ ] All functions showing in Supabase dashboard
  - [ ] No deployment errors in logs
  - [ ] Test each critical function:
    - [ ] `clerk-webhook`
    - [ ] `create-tip`
    - [ ] `send-email-notification`
    - [ ] `withdrawal-security`
    - [ ] `rupantor-webhook`

### 🔄 Scheduled Jobs

- [ ] **Weekly Summary Scheduler**
  - [ ] GitHub Actions workflow created (`.github/workflows/weekly-summary.yml`)
  - [ ] `SUPABASE_ANON_KEY` added to GitHub repository secrets
  - [ ] Test manual trigger via GitHub Actions UI
  - [ ] Verify cron schedule correct (Friday 10 AM Dhaka time)

### 👤 Admin Setup

- [ ] **Super Admin Account**
  - [ ] Create admin user in Clerk
  - [ ] Set `is_admin: true` in profiles table
  - [ ] Add entry to `admin_roles` with `can_manage_admins: true`
  - [ ] Test admin panel access

- [ ] **Platform Configuration**
  - [ ] Default email templates created in `platform_config`
  - [ ] Share image template configured
  - [ ] Minimum tip amount set
  - [ ] Platform fee percentage configured

### 🎨 Frontend & SEO

- [ ] **Meta Tags**
  - [ ] Title tags on all pages
  - [ ] Meta descriptions on all pages
  - [ ] Open Graph tags configured
  - [ ] Twitter card tags configured
  - [ ] Favicon uploaded

- [ ] **SEO Files**
  - [ ] `robots.txt` allows indexing
  - [ ] `sitemap.xml` generated and accessible
  - [ ] `llms.txt` for AI crawlers

- [ ] **Performance**
  - [ ] Images optimized
  - [ ] Lazy loading enabled
  - [ ] No console errors in production

### 📱 Cross-Browser Testing

- [ ] **Desktop Browsers**
  - [ ] Chrome
  - [ ] Firefox
  - [ ] Safari
  - [ ] Edge

- [ ] **Mobile Testing**
  - [ ] iOS Safari
  - [ ] Android Chrome
  - [ ] Responsive design works on all screen sizes

### 🧪 Final Testing Scenarios

- [ ] **New User Flow**
  - [ ] Sign up as supporter
  - [ ] Browse explore page
  - [ ] View creator profile
  - [ ] Send a tip (complete payment)
  - [ ] Receive confirmation email

- [ ] **Creator Onboarding**
  - [ ] Sign up and choose "Become a Creator"
  - [ ] Complete payment (৳150)
  - [ ] Fill profile details
  - [ ] Dashboard loads correctly
  - [ ] Receive welcome email

- [ ] **Withdrawal Flow**
  - [ ] Creator sets withdrawal PIN
  - [ ] Submits withdrawal request
  - [ ] Receives OTP email
  - [ ] Completes verification
  - [ ] Request appears in admin panel

- [ ] **Admin Operations**
  - [ ] View dashboard analytics
  - [ ] Process withdrawal (approve/reject)
  - [ ] Review verification request
  - [ ] Reply to inbound email

---

## Launch Day

### 🚀 Go-Live Steps

1. [ ] Final code review and approval
2. [ ] Click "Publish" in Lovable
3. [ ] Verify custom domain is active
4. [ ] Test critical flows one more time
5. [ ] Monitor edge function logs for errors
6. [ ] Check email delivery in Resend dashboard

### 📢 Post-Launch Monitoring

- [ ] **First 24 Hours**
  - [ ] Monitor Supabase dashboard for errors
  - [ ] Check edge function logs hourly
  - [ ] Review email delivery rates
  - [ ] Respond to any user-reported issues

- [ ] **First Week**
  - [ ] Verify weekly summary job runs (Friday)
  - [ ] Check database performance
  - [ ] Review error logs daily
  - [ ] Gather user feedback

---

## Emergency Contacts

| Service | Dashboard | Support |
|---------|-----------|---------|
| Lovable | lovable.dev | Discord community |
| Supabase | supabase.com/dashboard | support@supabase.io |
| Clerk | dashboard.clerk.com | support@clerk.dev |
| Resend | resend.com | support@resend.com |
| RupantorPay | rupantorpay.com | (contact info) |

---

## Rollback Plan

If critical issues are discovered:

1. **Frontend Issues**
   - Use Lovable's version history to restore previous state
   - Or revert via GitHub to last stable commit

2. **Database Issues**
   - Check Supabase point-in-time recovery
   - Have backup SQL ready for critical tables

3. **Edge Function Issues**
   - Redeploy previous version from Git history
   - Check function logs for error details

---

## Success Metrics

Track these metrics in the first month:

- [ ] Number of creator signups
- [ ] Number of tips processed
- [ ] Total transaction volume
- [ ] Email delivery rate
- [ ] User-reported bugs
- [ ] Page load performance
