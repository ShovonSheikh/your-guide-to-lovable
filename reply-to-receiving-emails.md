# Reply to Receiving Emails

> Reply to Receiving emails in the same thread.

Email clients thread emails by using the `message_id` metadata.

If you want to reply to an email, you should add the `In-Reply-To` header set to the `message_id` of the received email. We also recommend setting the subject to start with `Re:` so that email clients can group the replies together.

Here's an example of replying to an email in a Next.js application:

```ts app/api/events/route.ts theme={"theme":{"light":"github-light","dark":"vesper"}}
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend('re_xxxxxxxxx');

export const POST = async (request: NextRequest) => {
  const event = await request.json();

  if (event.type === 'email.received') {
    const { data, error } = await resend.emails.send({
      from: 'Acme <onboarding@resend.dev>',
      to: ['delivered@resend.dev'],
      subject: `Re: ${event.data.subject}`,
      html: '<p>Thanks for your email!</p>',
      headers: {
        'In-Reply-To': event.data.message_id,
      },
      attachments,
    });

    return NextResponse.json(data);
  }

  return NextResponse.json({});
};
```

If you're replying multiple times within the same thread, make sure to also append
the previous `message_id`s to the `References` header, separated by spaces.
This helps email clients maintain the correct threading structure.

```js  theme={"theme":{"light":"github-light","dark":"vesper"}}
const previousReferences = ['<msg_id1@domain.com>', '<msg_id2@domain.com>'];

const { data, error } = await resend.emails.send({
  from: 'Acme <onboarding@resend.dev>',
  to: ['delivered@resend.dev'],
  subject: `Re: ${event.data.subject}`,
  html: '<p>Thanks for your email!</p>',
  headers: {
    'In-Reply-To': event.data.message_id,
    'References': [...previousReferences, event.data.message_id].join(' '),
  },
  attachments,
});
```


---

> To find navigation and other pages in this documentation, fetch the llms.txt file at: https://resend.com/docs/llms.txt
