## Root Cause
- `/admin/*` pages are lazy-loaded.
- The app has a single top-level `Suspense` boundary in [App.tsx](file:///c:/Users/User/OneDrive/Documents/Antigravity/your-guide-to-lovable/src/App.tsx#L81-L145). When you navigate from **Admin Dashboard → Mailbox** and the next chunk isn’t loaded yet, React suspends and the top-level fallback replaces the whole route tree.
- That makes it look like the whole admin UI “refreshes” and the sidebar disappears during the transition.

## Fix
- Add a closer `Suspense` boundary inside [AdminLayout.tsx](file:///c:/Users/User/OneDrive/Documents/Antigravity/your-guide-to-lovable/src/pages/admin/AdminLayout.tsx) around the `<Outlet />`.
- Use a small in-layout loader fallback (spinner) so only the **main content** shows loading while the **sidebar/header stay visible**.

## Verification
- Start the app, go to `/admin`.
- Navigate to `/admin/mailbox` and `/admin` back and forth:
  - Sidebar should remain visible during loading.
  - Only the main content area should show the loader.
- Build to ensure no TypeScript errors.
