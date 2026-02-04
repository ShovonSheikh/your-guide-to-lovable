
# Comprehensive Plan: Mobile Editor Fix, Mass Email Feature, and Performance Optimization

## Overview

This plan covers three main areas:
1. **Mobile Editor Fix** - Change Monaco Editor to Textarea on mobile for email templates and share card pages
2. **Mass Email Feature** - Add ability to send bulk emails to all users, creators only, or supporters only  
3. **Performance Optimization** - Make the site feel fast with lazy loading, prefetching, and optimized rendering

---

## Part 1: Mobile Editor Switch (Textarea on Mobile)

### Current State
- `AdminShareImage.tsx` - Already has mobile detection and uses Textarea on mobile (lines 561-567, 597-603)
- `AdminEmailTemplates.tsx` - Uses Monaco Editor on all devices (lines 873-889)

### Changes Required

**File: `src/pages/admin/AdminEmailTemplates.tsx`**

Update the HTML Body editor section to conditionally render Textarea on mobile:

```typescript
// Replace Monaco Editor with conditional rendering (around line 872-890)
<div>
  <Label>HTML Body</Label>
  <div className="mt-1 border rounded-lg overflow-hidden">
    {isMobile ? (
      <Textarea
        value={htmlCode}
        onChange={(e) => {
          setHtmlCode(e.target.value);
          setHasChanges(true);
        }}
        className="min-h-[400px] font-mono text-xs border-0 rounded-none resize-none focus-visible:ring-0"
        placeholder="Enter HTML template..."
      />
    ) : (
      <Editor
        height="400px"
        defaultLanguage="html"
        value={htmlCode}
        onChange={(value) => {
          setHtmlCode(value || '');
          setHasChanges(true);
        }}
        theme="vs-dark"
        options={{
          minimap: { enabled: false },
          fontSize: 13,
          lineNumbers: 'on',
          wordWrap: 'on',
          automaticLayout: true,
        }}
      />
    )}
  </div>
</div>
```

The `isMobile` hook is already imported in `AdminEmailTemplates.tsx` (line 18).

---

## Part 2: Mass Email Feature

### New Edge Function: `send-mass-email`

Create a new edge function to handle bulk email sending with the following capabilities:
- Send to all users, only creators, or only supporters
- Use email templates from platform_config or custom content
- Rate limiting to prevent abuse
- Background processing for large batches

**File: `supabase/functions/send-mass-email/index.ts`**

```typescript
// Key features:
// 1. Accept audience: 'all' | 'creators' | 'supporters'
// 2. Accept template_id (for existing templates) OR custom subject/body
// 3. Query profiles based on audience filter
// 4. Send emails in batches (to respect Resend limits)
// 5. Log results to email_logs table
// 6. Return progress/summary
```

### New Admin UI Component: `MassEmailDialog.tsx`

Create a dialog component for composing and sending mass emails:

**File: `src/components/admin/MassEmailDialog.tsx`**

Features:
- Audience selector with radio buttons:
  - All Users (creators + supporters)
  - Creators Only
  - Supporters Only
- Subject line input
- HTML body editor (Textarea for simplicity, or Monaco on desktop)
- Preview section showing how many recipients will receive the email
- Progress indicator during sending
- Confirmation dialog before sending

### Integration in AdminEmailTemplates

Add a "Send Mass Email" button next to the existing save button:

```typescript
<Button variant="outline" onClick={() => setMassEmailOpen(true)}>
  <Send className="w-4 h-4 mr-2" />
  Send Mass Email
</Button>
```

---

## Part 3: Performance Optimization ("Make the Site Feel Fast")

### A. Lazy Loading Routes

**File: `src/App.tsx`**

Implement code splitting with React.lazy for all routes:

```typescript
import React, { lazy, Suspense } from 'react';
import { Spinner } from '@/components/ui/spinner';

// Lazy load all pages
const Home = lazy(() => import('./pages/Home'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Explore = lazy(() => import('./pages/Explore'));
const Finance = lazy(() => import('./pages/Finance'));
const Settings = lazy(() => import('./pages/Settings'));
// ... all other pages

// Admin pages (especially heavy due to Monaco Editor)
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminEmailTemplates = lazy(() => import('./pages/admin/AdminEmailTemplates'));
const AdminShareImage = lazy(() => import('./pages/admin/AdminShareImage'));
// ... all other admin pages

// Fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <Spinner className="w-8 h-8" />
  </div>
);

// Wrap routes in Suspense
<Suspense fallback={<PageLoader />}>
  <Routes>
    <Route path="/" element={<Home />} />
    {/* ... all routes */}
  </Routes>
</Suspense>
```

**Benefits:**
- Reduces initial bundle size by ~60-70%
- Admin pages (with Monaco Editor) only load when accessed
- Faster first contentful paint

### B. Prefetching Critical Resources

**File: `index.html`**

Add preload hints for critical resources:

```html
<!-- Preload fonts -->
<link rel="preload" href="/fonts/dm-sans-400.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/bricolage-grotesque-700.woff2" as="font" type="font/woff2" crossorigin>

<!-- Preconnect to external services -->
<link rel="preconnect" href="https://wwrkisbnpsmbkofqgndq.supabase.co">
<link rel="preconnect" href="https://clerk.accounts.dev">

<!-- DNS prefetch for analytics -->
<link rel="dns-prefetch" href="https://www.google-analytics.com">
```

### C. Image Optimization

**File: `src/pages/Home.tsx`** (and other pages with images)

Add loading="lazy" and proper sizing to images:

```typescript
<img 
  src={creator.avatar} 
  alt={creator.name}
  loading="lazy"
  decoding="async"
  width={48}
  height={48}
  className="rounded-full"
/>
```

### D. React Query Optimization

**File: `src/App.tsx`**

Optimize QueryClient configuration:

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
```

### E. Debounce Search/Filter Inputs

Create a custom hook for debounced values:

**File: `src/hooks/useDebounce.ts`**

```typescript
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
```

### F. CSS Performance

**File: `src/index.css`**

Add will-change hints for animated elements:

```css
/* Optimize animations */
.animate-fade-in,
.animate-slide-up,
.animate-scale-in {
  will-change: opacity, transform;
}

/* Optimize scrolling */
.scroll-smooth {
  scroll-behavior: smooth;
}

@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `supabase/functions/send-mass-email/index.ts` | Edge function for bulk email sending |
| `src/components/admin/MassEmailDialog.tsx` | UI for composing and sending mass emails |
| `src/hooks/useDebounce.ts` | Debounce hook for performance |

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/admin/AdminEmailTemplates.tsx` | Conditional Textarea on mobile, add mass email button |
| `src/App.tsx` | Lazy loading for all routes, QueryClient optimization |
| `index.html` | Preload/preconnect hints |
| `src/index.css` | CSS performance optimizations |

---

## Technical Details

### Mass Email Edge Function Flow

```text
1. Admin selects audience (all/creators/supporters)
2. Admin composes email (subject + HTML body)
3. Frontend calls send-mass-email edge function
4. Edge function:
   a. Validates admin permissions
   b. Queries profiles based on audience filter
   c. Filters for users with valid emails
   d. Sends emails in batches of 50 (Resend batch limit)
   e. Logs each attempt to email_logs
   f. Returns summary: sent, failed, skipped
```

### Lazy Loading Bundle Impact

Current bundle loads:
- Monaco Editor (~1.5MB) - only needed for admin template pages
- Recharts (~400KB) - only needed for dashboard/finance
- Heavy admin components - only needed for admins

After lazy loading:
- Initial load: ~200KB (core React + routing)
- Home page: +150KB
- Admin pages: +1.5MB+ (loaded on demand)

### Performance Metrics Goals

| Metric | Current (est.) | Target |
|--------|---------------|--------|
| First Contentful Paint | ~2.5s | <1.5s |
| Largest Contentful Paint | ~4s | <2.5s |
| Time to Interactive | ~5s | <3s |
| Total Bundle Size | ~3MB | <500KB initial |

---

## Testing Checklist

1. **Mobile Editor**: Test email template editing on mobile - should show Textarea
2. **Mass Email**: Test sending to each audience type, verify emails received
3. **Lazy Loading**: Verify pages load on demand, check network tab for chunks
4. **Performance**: Run Lighthouse audit before/after changes
5. **User Experience**: Navigate through the app - should feel snappy
