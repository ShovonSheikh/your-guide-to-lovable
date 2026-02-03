## Root Cause
- The site is sending a strict `Content-Security-Policy` header from [vercel.json](file:///c:/Users/User/OneDrive/Documents/Antigravity/your-guide-to-lovable/vercel.json#L1-L25).
- `style-src 'self' 'unsafe-inline'` blocks your Google Fonts stylesheet requests (your app imports Google Fonts via `@import` in [index.css](file:///c:/Users/User/OneDrive/Documents/Antigravity/your-guide-to-lovable/src/index.css#L1)).
- `font-src 'self' data:` blocks the font files that the Google stylesheet points to on `fonts.gstatic.com`.
- `script-src` does not allow `https://clerk.tipkoro.com`, so Clerk’s loader script is blocked and the app crashes with `failed_to_load_clerk_js`.

## Fix (Server Headers)
1. Update the CSP string in [vercel.json](file:///c:/Users/User/OneDrive/Documents/Antigravity/your-guide-to-lovable/vercel.json#L12-L15) to allow the specific external origins you’re using:
   - Add `https://fonts.googleapis.com` to `style-src` (and optionally also define `style-src-elem`).
   - Add `https://fonts.gstatic.com` to `font-src`.
   - Add `https://clerk.tipkoro.com` to `script-src` (and optionally also define `script-src-elem`).
   - Add `https://clerk.tipkoro.com` to `connect-src` (Clerk makes XHR/fetch calls) and to `frame-src` if Clerk uses frames under the custom domain.
2. Keep the rest of the directives unchanged to minimize behavior changes.

## Optional Hardening (If You Want to Avoid Allowing Google Fonts)
- Replace `@import` Google Fonts with locally hosted fonts (download `.woff2` or use a font package already adopted in the repo) and then remove `fonts.googleapis.com`/`fonts.gstatic.com` from the CSP.

## Verification
- Redeploy (so Vercel picks up `vercel.json` header changes).
- Confirm in browser DevTools:
  - No CSP errors for `fonts.googleapis.com` and `fonts.gstatic.com`.
  - No CSP errors for `clerk.tipkoro.com` and Clerk loads (no `failed_to_load_clerk_js*` errors).
  - Sign-in/sign-up flows render correctly.

If you confirm this plan, I’ll apply the `vercel.json` CSP update and then validate with a local build + a quick browser check after deployment.