# Resend - Get Received Email Content

> **Important**: Webhooks do not include the actual HTML or Plain Text body of the email. You must call the received emails API to retrieve them.

This design choice supports large payloads in serverless environments that have limited request body sizes.

## API Endpoint

```
GET https://api.resend.com/emails/{email_id}
```

## Headers

```
Authorization: Bearer re_xxxxxxxxx
```

## Example Response

```json
{
  "object": "email",
  "id": "email_id_here",
  "from": "sender@example.com",
  "to": ["recipient@example.com"],
  "subject": "Hello World",
  "html": "<p>This is the HTML body</p>",
  "text": "This is the plain text body",
  "headers": {
    "Message-ID": "<abc123@example.com>",
    "Date": "Mon, 20 Jan 2025 10:00:00 +0000"
  }
}
```

## Usage in Edge Function (Deno)

```typescript
const resendApiKey = Deno.env.get('RESEND_API_KEY');

const emailResponse = await fetch(
  `https://api.resend.com/emails/${emailData.email_id}`,
  {
    headers: {
      'Authorization': `Bearer ${resendApiKey}`,
    },
  }
);

const fullEmail = await emailResponse.json();
console.log(fullEmail.html);  // HTML body
console.log(fullEmail.text);  // Plain text body
```

## Reference

- [Resend Receiving Emails Docs](https://resend.com/docs/dashboard/webhooks/receiving-emails)
- [Retrieve Received Email API](https://resend.com/docs/api-reference/emails/retrieve-received-email)
