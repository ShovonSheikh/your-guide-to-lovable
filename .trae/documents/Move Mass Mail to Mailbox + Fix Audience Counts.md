## Root Cause
- The “Mass Mail” UI is currently only mounted on **Email Templates**: [AdminEmailTemplates.tsx](file:///c:/Users/User/OneDrive/Documents/Antigravity/your-guide-to-lovable/src/pages/admin/AdminEmailTemplates.tsx)
- The audience selector *looks wrong* because it only counts profiles where `profiles.email IS NOT NULL`:
  - Both the UI count and the send function filter out rows with `email = NULL`: [MassEmailDialog.tsx:L61-L70](file:///c:/Users/User/OneDrive/Documents/Antigravity/your-guide-to-lovable/src/components/admin/MassEmailDialog.tsx#L61-L70), [send-mass-email/index.ts:L95-L107](file:///c:/Users/User/OneDrive/Documents/Antigravity/your-guide-to-lovable/supabase/functions/send-mass-email/index.ts#L95-L107)
  - So if you have 9 profiles but 3 supporters have `email = NULL`, you’ll see exactly what you reported: All=6, Creators=6, Supporters=0.

## Changes
### 1) Move “Mass Mail” button to Mailbox page
- Remove the “Mass Email/Mass Mail” button + dialog mount from **Email Templates**.
- Add the button next to “Compose” in **Mailbox** desktop + mobile headers: [AdminMailbox.tsx:L839-L872](file:///c:/Users/User/OneDrive/Documents/Antigravity/your-guide-to-lovable/src/pages/admin/AdminMailbox.tsx#L839-L872)
- Mount `MassEmailDialog` in **Mailbox** and manage its `open` state there.

### 2) Fix the “user selector” counts to match your expected 9 total users
- Update `MassEmailDialog` to fetch **two counts** per audience:
  - **Total selected** (all matching profiles, regardless of email)
  - **Deliverable recipients** (profiles with a usable email)
- Update the UI text to display both, e.g.
  - “9 selected • 6 will receive • 3 missing email”
- Keep sending behavior consistent: only deliver to valid emails, but now the selector is truthful and explains why.

### 3) Prevent the issue from happening to new/returning users
- Add a small self-healing step during profile load: if a logged-in user’s `profiles.email` is missing but Clerk has an email, update the profile.
  - This won’t magically fix old users who never log in, but it prevents future drift and fixes active supporters automatically.

## Verification
- Confirm “Mass Mail” no longer appears on Email Templates and appears on Mailbox.
- Open Mass Mail on Mailbox and confirm counts show (Total / Will receive / Missing email).
- Run a test send to “Supporters Only” after fixing missing emails (or after those users log in once) and confirm it reaches expected recipients.
