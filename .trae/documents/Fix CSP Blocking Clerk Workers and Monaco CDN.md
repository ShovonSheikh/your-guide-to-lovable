## Root Cause
The admin page is failing because our deployed **Content-Security-Policy** is too restrictive:
- **Clerk** tries to create a Web Worker from a `blob:` URL (e.g. `blob:https://tipkoro.com/...`). Because `worker-src` isn’t set, the browser falls back to `script-src`, and `blob:` is not allowed → worker creation is blocked.
- **Monaco Editor** (via `@monaco-editor/react`) loads `https://cdn.jsdelivr.net/npm/monaco-editor@.../vs/loader.js`, but `cdn.jsdelivr.net` is not allowed in `script-src` → Monaco initialization fails.

The CSP is currently defined in [vercel.json](file:///c:/Users/User/OneDrive/Documents/Antigravity/your-guide-to-lovable/vercel.json#L1-L25).

## Fix (Minimal Surface Area)
1. Update the CSP string in `vercel.json` to add:
   - `worker-src 'self' blob:` (so Clerk + Monaco workers can be created).
   - `script-src` add `https://cdn.jsdelivr.net` (so Monaco’s loader can load).
2. (Optional hardening, still minimal) Add explicit `script-src-elem` mirroring `script-src` so only script tags need the extra origin, not all script contexts.

## Verification
After redeploy:
- Open `/admin/email-templates` and confirm:
  - No CSP errors for `blob:` workers.
  - No CSP errors for loading `loader.js` from jsDelivr.
  - Monaco editor loads and is usable.
- Confirm Clerk stays authenticated (no repeated token refresh failures).

## Notes (Not Primary Root Cause)
- “Multiple GoTrueClient instances detected” is a Supabase warning about creating multiple auth clients; it’s usually not fatal. If you still see auth/storage weirdness after the CSP fix, we can consolidate Supabase client creation to a single shared instance as a follow-up change.