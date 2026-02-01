## Root Causes (What’s happening)
- **Admin ticket detail shows “No messages yet”** because [AdminSupportDetail.tsx](file:///c:/Users/User/OneDrive/Documents/Antigravity/your-guide-to-lovable/src/pages/admin/AdminSupportDetail.tsx) reads `ticket_messages` using the static Supabase client ([client.ts](file:///c:/Users/User/OneDrive/Documents/Antigravity/your-guide-to-lovable/src/integrations/supabase/client.ts)), which does not inject `x-clerk-user-id`. Your RLS policies depend on that header.
- **“My tickets” looks empty / missing** because [useTickets.ts](file:///c:/Users/User/OneDrive/Documents/Antigravity/your-guide-to-lovable/src/hooks/useTickets.ts) memoizes `fetchTickets` with `[]` deps but now closes over a dynamic `supabase` client (header changes when Clerk becomes ready). This can freeze in an unauthenticated client.
- **“Find Ticket → Search” causes continuous requests** because [SupportTicketDetail.tsx](file:///c:/Users/User/OneDrive/Documents/Antigravity/your-guide-to-lovable/src/pages/SupportTicketDetail.tsx) includes `getTicket` / `getMessages` in `useEffect` deps, but those functions are not memoized in [useTickets.ts](file:///c:/Users/User/OneDrive/Documents/Antigravity/your-guide-to-lovable/src/hooks/useTickets.ts), so the effect re-triggers repeatedly.
- **No filter on user ticket list**: [SupportTickets.tsx](file:///c:/Users/User/OneDrive/Documents/Antigravity/your-guide-to-lovable/src/pages/SupportTickets.tsx) lists tickets but has no search/status filter.

## Implementation Plan
### 1) Fix admin ticket detail message loading
- Update [AdminSupportDetail.tsx](file:///c:/Users/User/OneDrive/Documents/Antigravity/your-guide-to-lovable/src/pages/admin/AdminSupportDetail.tsx) to use `const supabase = useSupabase()` (instead of the static client) for message queries + polling.
- Add error handling for the message query so RLS failures don’t silently render empty conversations.

### 2) Fix “My tickets” loading correctness
- In [useTickets.ts](file:///c:/Users/User/OneDrive/Documents/Antigravity/your-guide-to-lovable/src/hooks/useTickets.ts), update `fetchTickets` and admin `fetchTickets` to include `supabase` in their `useCallback` dependency arrays so they always use the correct header-injecting client.

### 3) Stop the continuous request loop after Search
- Memoize `getTicket`, `getMessages`, `getTicketByNumber`, `sendMessage`, `createTicket`, etc. in [useTickets.ts](file:///c:/Users/User/OneDrive/Documents/Antigravity/your-guide-to-lovable/src/hooks/useTickets.ts) using `useCallback` (with correct deps).
- This stabilizes the functions so [SupportTicketDetail.tsx](file:///c:/Users/User/OneDrive/Documents/Antigravity/your-guide-to-lovable/src/pages/SupportTicketDetail.tsx) effects run once per `ticketId` (plus the intended polling interval).

### 4) Add user ticket list filtering
- Enhance [SupportTickets.tsx](file:///c:/Users/User/OneDrive/Documents/Antigravity/your-guide-to-lovable/src/pages/SupportTickets.tsx) to include:
  - Status filter dropdown (open / in progress / waiting reply / resolved / closed)
  - Search box (ticket number + subject)

### 5) Verify
- Run through these flows locally:
  - Create ticket → open ticket detail → ensure no request spam
  - Open admin ticket detail → messages visible
  - My Tickets list shows tickets + filtering works

## Optional DB Backfill (if you have old tickets with no messages)
- If some tickets were created before the “initial message” trigger existed, I’ll provide an idempotent SQL snippet to backfill missing `ticket_messages` rows from `support_tickets.initial_message`.