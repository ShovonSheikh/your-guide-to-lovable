# Project Context

This file documents the changes made to the project, why they were made, and the current state of the project. This is meant to help anyone who takes over this project understand what's been done.

---

## Latest Update: January 16, 2026

### Issue Fixed: Vercel 404 Routing Error

**Problem:**  
After deploying to Vercel, certain routes like `/payments/creator/success` returned 404 errors:
```
404: NOT_FOUND
Code: NOT_FOUND
```

**Root Cause:**  
The project is a **Vite + React SPA** using **React Router** for client-side routing. When deployed to Vercel:
- Vercel tried to find physical files matching the URL path (e.g., `/payments/creator/success`)
- Since these are client-side routes (not actual files), Vercel returned 404
- The app works in development because Vite dev server handles this automatically

**Solution:**  
Created `vercel.json` at the project root with rewrite rules to serve `index.html` for all non-API routes:
```json
{
  "rewrites": [
    { "source": "/((?!api/).*)", "destination": "/index.html" }
  ],
  "routes": [
    { "handle": "filesystem" },
    { "src": "/(.*)", "dest": "/index.html" }
  ]
}
```

**Files Changed:**
- `vercel.json` (NEW) - Vercel routing configuration

---

## Project Overview

### Tech Stack
- **Frontend:** Vite + React + TypeScript
- **Routing:** React Router DOM
- **Styling:** Tailwind CSS
- **Backend:** Supabase (Auth, Database, Storage, Edge Functions)
- **Deployment:** Vercel

### Key Routes & Pages

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | `Home.tsx` | Landing page |
| `/explore` | `Explore.tsx` | Browse creators |
| `/dashboard` | `Dashboard.tsx` | User dashboard |
| `/settings` | `Settings.tsx` | User settings |
| `/finance` | `Finance.tsx` | Financial overview |
| `/payments/creator/success` | `CreatorPaymentSuccess.tsx` | Creator fee payment success |
| `/payments/creator/failed` | `CreatorPaymentFailed.tsx` | Creator fee payment failed |
| `/payments/tips/success` | `TipPaymentSuccess.tsx` | Tip payment success |
| `/payments/tips/failed` | `TipPaymentFailed.tsx` | Tip payment failed |
| `/admin/*` | `AdminLayout.tsx` | Admin panel routes |
| `/:username` | `CreatorProfile.tsx` | Creator public profile |

### Directory Structure
```
├── src/
│   ├── components/     # Reusable UI components
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Utilities, API functions
│   ├── pages/          # Page components
│   │   ├── admin/      # Admin panel pages
│   │   └── payments/   # Payment status pages
│   └── App.tsx         # Main routing configuration
├── supabase/
│   └── functions/      # Supabase Edge Functions
├── public/             # Static assets
├── vercel.json         # Vercel deployment config
└── package.json        # Dependencies
```

---

## What Needs to Be Done

1. **Test Vercel Deployment** - After pushing changes, verify the payment routes work correctly
2. **Push Notification Debugging** - Previous conversation mentioned `SyntaxError: Invalid key usage` in edge function logs (may need VAPID key fix)
3. **Monitor Payment Flow** - Ensure creator registration and tip payments complete successfully

---

## Deployment Notes

- **Production URL:** https://tipkoro.com
- **Vercel Project:** Linked to GitHub repository
- **Auto-Deploy:** Pushing to main branch triggers automatic deployment

---

## How to Handle Future Route Issues

If you add new client-side routes and they return 404 on Vercel:
1. Ensure the route is defined in `src/App.tsx`
2. The `vercel.json` rewrite rules should handle it automatically
3. If you add API routes, place them in `/api` directory (they won't be rewritten)

---

*Last updated: January 16, 2026*
