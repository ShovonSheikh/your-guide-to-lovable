# Custom Receiving Domains

> Receive emails using your own domain.

Besides [using Resend-managed domains](/dashboard/receiving/introduction), you can also receive emails using your own custom domain, such as `yourdomain.tld`.

Here's how to receive emails using a *new* custom domain.

## 1. Add the DNS record

First, [verify your domain](/dashboard/domains/introduction).

Receiving emails requires an extra [MX record](https://resend.com/knowledge-base/how-do-i-avoid-conflicting-with-my-mx-records) to work. You'll need to add this record to your DNS provider.

1. Go to the [Domains](https://resend.com/domains) page
2. Copy the MX record
3. Paste the MX record into your domain's DNS service

<img alt="Add DNS records for Receiving Emails" src="https://mintcdn.com/resend/1QlhxulUFE6jxYM_/images/inbound-custom-domain-dns.jpg?fit=max&auto=format&n=1QlhxulUFE6jxYM_&q=85&s=0bb3258dbd1e9fc5efeb9ead53b219a2" data-og-width="2020" width="2020" data-og-height="1252" height="1252" data-path="images/inbound-custom-domain-dns.jpg" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/resend/1QlhxulUFE6jxYM_/images/inbound-custom-domain-dns.jpg?w=280&fit=max&auto=format&n=1QlhxulUFE6jxYM_&q=85&s=a882e60e9e04b274a3c4aea87c1b724a 280w, https://mintcdn.com/resend/1QlhxulUFE6jxYM_/images/inbound-custom-domain-dns.jpg?w=560&fit=max&auto=format&n=1QlhxulUFE6jxYM_&q=85&s=fc842eded7a8e998f7c60229274fbb9b 560w, https://mintcdn.com/resend/1QlhxulUFE6jxYM_/images/inbound-custom-domain-dns.jpg?w=840&fit=max&auto=format&n=1QlhxulUFE6jxYM_&q=85&s=092bab71a2d0346a0f33adf203bd2d7a 840w, https://mintcdn.com/resend/1QlhxulUFE6jxYM_/images/inbound-custom-domain-dns.jpg?w=1100&fit=max&auto=format&n=1QlhxulUFE6jxYM_&q=85&s=5ee81468e5e7d2fcd7750de5c56da2d1 1100w, https://mintcdn.com/resend/1QlhxulUFE6jxYM_/images/inbound-custom-domain-dns.jpg?w=1650&fit=max&auto=format&n=1QlhxulUFE6jxYM_&q=85&s=74c4533ed87b3e90cbea2c2f44592e16 1650w, https://mintcdn.com/resend/1QlhxulUFE6jxYM_/images/inbound-custom-domain-dns.jpg?w=2500&fit=max&auto=format&n=1QlhxulUFE6jxYM_&q=85&s=924697ee58c2aeed93bffdedb8d20bd6 2500w" />

<Info>
  If you already have existing MX records for your domain (because you're already
  using it for a real inbox, for example), we recommend that you
  create a subdomain (e.g. `subdomain.yourdomain.tld`) and add the MX record
  there. This way, you can use Resend for receiving emails without affecting
  your existing email service. Note that you will *not* receive emails at Resend
  if the required `MX` record is not the lowest priority value for the domain.

  Alternatively, you can configure your email service to forward emails to an address
  that's configured in Resend or forward them directly to the SMTP server address
  that appears in the receiving `MX` record.
</Info>

## 2. Configure webhooks

Next, create a new webhook endpoint to receive email events.

1. Go to the [Webhooks](https://resend.com/webhooks) page
2. Click "Add Webhook"
3. Enter the URL of your webhook endpoint
4. Select the event type `email.received`
5. Click "Add"

<img alt="Add Webhook for Receiving Emails" src="https://mintcdn.com/resend/1QlhxulUFE6jxYM_/images/inbound-webhook-setup.jpg?fit=max&auto=format&n=1QlhxulUFE6jxYM_&q=85&s=55ae3e35788d91065d59ff4ddebff7e6" data-og-width="1110" width="1110" data-og-height="1016" height="1016" data-path="images/inbound-webhook-setup.jpg" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/resend/1QlhxulUFE6jxYM_/images/inbound-webhook-setup.jpg?w=280&fit=max&auto=format&n=1QlhxulUFE6jxYM_&q=85&s=c1ab7b7abe91256abe3c6279e6c5fc54 280w, https://mintcdn.com/resend/1QlhxulUFE6jxYM_/images/inbound-webhook-setup.jpg?w=560&fit=max&auto=format&n=1QlhxulUFE6jxYM_&q=85&s=056e826ed3f8973769fbcf95e0a4f865 560w, https://mintcdn.com/resend/1QlhxulUFE6jxYM_/images/inbound-webhook-setup.jpg?w=840&fit=max&auto=format&n=1QlhxulUFE6jxYM_&q=85&s=1525d4904fe88bd251197962d9945180 840w, https://mintcdn.com/resend/1QlhxulUFE6jxYM_/images/inbound-webhook-setup.jpg?w=1100&fit=max&auto=format&n=1QlhxulUFE6jxYM_&q=85&s=bcf3794f7fb2061f779ab89e9ca18a74 1100w, https://mintcdn.com/resend/1QlhxulUFE6jxYM_/images/inbound-webhook-setup.jpg?w=1650&fit=max&auto=format&n=1QlhxulUFE6jxYM_&q=85&s=758330d8589abab096d404aa1dba48d6 1650w, https://mintcdn.com/resend/1QlhxulUFE6jxYM_/images/inbound-webhook-setup.jpg?w=2500&fit=max&auto=format&n=1QlhxulUFE6jxYM_&q=85&s=461272d7946d358ef8d6459576e11f48 2500w" />

## 3. Receive email events

In your application, create a new route that can accept `POST` requests.

For example, here's how you can add an API route in a Next.js application:

```js app/api/events/route.ts theme={"theme":{"light":"github-light","dark":"vesper"}}
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export const POST = async (request: NextRequest) => {
  const event = await request.json();

  if (event.type === 'email.received') {
    return NextResponse.json(event);
  }

  return NextResponse.json({});
};
```

Once you receive the email event, you can process the email body and attachments. We also recommend implementing [webhook request verification](/webhooks/verify-webhooks-requests) to secure your webhook endpoint.

```json  theme={"theme":{"light":"github-light","dark":"vesper"}}
{
  "type": "email.received",
  "created_at": "2024-02-22T23:41:12.126Z",
  "data": {
    "email_id": "56761188-7520-42d8-8898-ff6fc54ce618",
    "created_at": "2024-02-22T23:41:11.894719+00:00",
    "from": "Acme <onboarding@resend.dev>",
    "to": ["delivered@resend.dev"],
    "bcc": [],
    "cc": [],
    "message_id": "<example+123>",
    "subject": "Sending this example",
    "attachments": [
      {
        "id": "2a0c9ce0-3112-4728-976e-47ddcd16a318",
        "filename": "avatar.png",
        "content_type": "image/png",
        "content_disposition": "inline",
        "content_id": "img001"
      }
    ]
  }
}
```

## Enabling receiving for an existing domain

If you already have a verified domain, you can enable receiving by using the toggle in the receiving section of the domain details page.

<img alt="Enable Receiving Emails for a verified domain" src="https://mintcdn.com/resend/cxinN79qDVOa7Vo6/images/inbound-enable-receiving.jpg?fit=max&auto=format&n=cxinN79qDVOa7Vo6&q=85&s=43ea9fce84b46236ce4d58efc6004a24" data-og-width="1982" width="1982" data-og-height="1232" height="1232" data-path="images/inbound-enable-receiving.jpg" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/resend/cxinN79qDVOa7Vo6/images/inbound-enable-receiving.jpg?w=280&fit=max&auto=format&n=cxinN79qDVOa7Vo6&q=85&s=3c76eb84c02f6d0a5a890204bae236a9 280w, https://mintcdn.com/resend/cxinN79qDVOa7Vo6/images/inbound-enable-receiving.jpg?w=560&fit=max&auto=format&n=cxinN79qDVOa7Vo6&q=85&s=b79868ee661c6149b78eb181bc40597a 560w, https://mintcdn.com/resend/cxinN79qDVOa7Vo6/images/inbound-enable-receiving.jpg?w=840&fit=max&auto=format&n=cxinN79qDVOa7Vo6&q=85&s=db77934a0b485d02862fb1098b9f494d 840w, https://mintcdn.com/resend/cxinN79qDVOa7Vo6/images/inbound-enable-receiving.jpg?w=1100&fit=max&auto=format&n=cxinN79qDVOa7Vo6&q=85&s=df953f7ff8d363d4942757a7036f45e3 1100w, https://mintcdn.com/resend/cxinN79qDVOa7Vo6/images/inbound-enable-receiving.jpg?w=1650&fit=max&auto=format&n=cxinN79qDVOa7Vo6&q=85&s=ea0d5b5de643c3265e4ae5c3e6569c1b 1650w, https://mintcdn.com/resend/cxinN79qDVOa7Vo6/images/inbound-enable-receiving.jpg?w=2500&fit=max&auto=format&n=cxinN79qDVOa7Vo6&q=85&s=c6ce33152b38b091ea3e93b1f74495b9 2500w" />

After enabling receiving, you'll see a modal showing the MX record that you need to add to your DNS provider to start receiving emails.

Once you add the MX record, confirm by clicking the "I've added the record" button and wait for the receiving record to show as "verified".

## FAQ

<AccordionGroup>
  <Accordion title="What happens if I already have MX records for my domain?">
    If you already have existing MX records for your domain, we recommend that you
    create a subdomain (e.g. `subdomain.yourdomain.tld`) and add the MX record
    there.

    That's because emails will usually only be delivered to the MX record with the lowest
    priority value. Therefore, if you add Resend's MX record to your root domain alongside existing MX records,
    it will either not receive any emails at all (if the existing MX records have a lower priority),
    or it will interfere with your existing email service (if Resend's MX record has a lower priority). If you
    use the same priority, email delivery will be unpredictable and may hit either Resend or your existing email
    service.

    If you still want to use the same domain both in for Resend and your day-to-day
    email service, you can also set up forwarding rules in your existing email service
    to forward emails to an address that's configured in Resend or forward them directly
    to the SMTP server address that appears in the receiving `MX` record.
  </Accordion>

  <Accordion title="I have already verified my domain for sending. Do I need to verify it again for receiving?">
    No, you do not need to verify your entire domain again. If you already have a
    verified domain for sending, you can simply enable receiving for that domain,
    add the required MX record to your DNS provider, and click "I've added the record"
    to start verifying *only* the MX record.
  </Accordion>
</AccordionGroup>


---

> To find navigation and other pages in this documentation, fetch the llms.txt file at: https://resend.com/docs/llms.txt
