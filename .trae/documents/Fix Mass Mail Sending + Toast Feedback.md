## What’s happening
- The Edge Function `send-mass-email` uses `from: "TipKoro <hello@mail.tipkoro.com>"`, but Resend rejects it because `mail.tipkoro.com` isn’t a verified domain. You want `hello@tipkoro.com`.
- Resend also rate-limits you to **2 requests/second**. The function currently sends a batch using `Promise.all(...)`, which bursts requests and triggers 429s.
- The UI shows a success toast because it treats any `success: true` response as “sent”, even when `summary.sent = 0` and `summary.failed > 0`.

## Fixes
### 1) Use the correct sender
- Update `send-mass-email` to send from `TipKoro <hello@tipkoro.com>`.
- Optionally read the sender from an env var (e.g. `RESEND_FROM`) with a safe default.

### 2) Respect Resend rate limits
- Replace the `Promise.all` burst with a throttled sender:
  - Send sequentially with a small delay (~550ms) between requests, or
  - Implement a simple rate limiter (2 req/s) across the loop.
- Keep the existing summary (sent/failed/skipped/total) but failures should now be real failures, not rate-limit bursts.

### 3) Make the UI toast truthful
- In `MassEmailDialog`, change toast behavior:
  - If `sent > 0 && failed === 0` → success toast.
  - If `sent > 0 && failed > 0` → warning/destructive toast (partial success) and show counts.
  - If `sent === 0 && failed > 0` → destructive toast with first error message.

### 4) Improve Edge Function logging
- Add structured logs for:
  - selected audience + recipient counts
  - per-recipient failures with status code/name (avoid dumping full email HTML)
  - rate-limit responses (status 429) + message

## Verification
- Trigger Mass Mail to 9 recipients.
- Confirm:
  - No Resend “domain not verified” error.
  - No 429 spam (or greatly reduced) due to throttling.
  - UI toast shows failure/partial failure appropriately.
