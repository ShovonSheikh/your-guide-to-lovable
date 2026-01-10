# TipKoro Waiting List Landing Page

A responsive, mobile-first landing page for TipKoro — a Bangladeshi-focused creator support platform similar to Ko-fi/BuyMeACoffee.

[Go To Project in "Shovon" Profile](https://lovable.dev/projects/5ece1490-d039-4aa8-8ed2-a44e9b3b8e78)

## Features

- **Hero Section**: Promo badge, headline, CTA with payment methods
- **Billing Timeline**: Visual representation of the Early Creator Offer
- **Two-Step Signup Flow**: Payment → Details form
- **Success State**: Confirmation card with confetti animation
- **Why TipKoro**: Feature cards highlighting platform benefits
- **Creator Highlights**: Testimonials from creators

## Early Creator Offer — Promo Credit Logic

### How It Works

1. **Month 1 (Paid)**: Creator pays ৳150 to activate their account
2. **Month 2 (Free)**: Complimentary — no charge
3. **Month 3 (Free)**: Complimentary — no charge  
4. **Month 4+ (Recurring)**: Automatic billing starts at ৳150/month

### Backend Metadata Structure

When a user signs up, store the following metadata:

```typescript
interface CreatorPromoMetadata {
  promo: boolean;              // true for Early Creator Offer signups
  signup_date: Date;           // Date of initial payment
  active_until: Date;          // signup_date + 3 months
  billing_start: Date;         // signup_date + 3 months (when billing resumes)
  payment_id: string;          // Transaction ID from Rupantor Pay
  first_month_paid: boolean;   // true after successful payment
}
```

### Clerk User Profile Fields

```typescript
interface CreatorProfile {
  username: string;            // Unique creator handle
  firstName: string;
  lastName: string;
  email: string;
  bio: string;                 // Max 200 characters
  category: string;            // Creator category
  socialLinks: {
    twitter?: string;
    instagram?: string;
    youtube?: string;
    other?: string;
  };
  payoutMethod: 'bkash' | 'nagad' | 'rocket' | 'card' | 'crypto';
  phone?: string;
}
```

## Payment Integration

### Rupantor Pay API

**Base URL**: `https://payment.rupantorpay.com/api`

#### Create Checkout Session

```bash
POST /payment/checkout
Headers:
  Content-Type: application/json
  X-API-KEY: <YOUR_API_KEY>
  X-CLIENT: <YOUR_HOST>

Body:
{
  "fullname": "John Doe",
  "email": "john@example.com",
  "amount": 150,
  "success_url": "https://tipkoro.com/join?step=details",
  "cancel_url": "https://tipkoro.com/join?step=payment&cancelled=true",
  "webhook_url": "https://api.tipkoro.com/webhooks/rupantor",
  "meta_data": {
    "signup_type": "early_creator_offer",
    "promo_months": 2
  }
}
```

#### Verify Payment

```bash
POST /payment/verify-payment
Body: { "transaction_id": "OVKPXW165414" }
```

## Webhook Payload (Admin Notification)

When a new creator signs up, send webhook to admin:

```typescript
interface SignupWebhookPayload {
  event: 'creator.signup.completed';
  timestamp: string;
  creator: {
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    category: string;
    bio: string;
    payoutMethod: string;
  };
  payment: {
    transaction_id: string;
    amount: number;
    currency: 'BDT';
    method: string;
    status: 'COMPLETED';
  };
  promo: {
    type: 'early_creator_offer';
    free_months: 2;
    billing_starts: string; // ISO date
  };
  clerk_user_id: string;
}
```

## Tech Stack

- React 19 + TypeScript
- Tailwind CSS (custom beige theme)
- Vite
- shadcn/ui components

## Design System

The app uses a warm beige theme with:
- **Background**: `hsl(40, 33%, 96%)`
- **Accent (Gold)**: `hsl(45, 92%, 62%)`
- **Primary (Dark)**: `hsl(30, 10%, 12%)`
- **Success (Green)**: `hsl(142, 52%, 45%)`

Fonts:
- Display: Bricolage Grotesque
- Body: DM Sans

## Local Development

```bash
npm install
npm run dev
```

## Environment Variables (for production)

```env
RUPANTOR_API_KEY=<your_api_key>
RUPANTOR_CLIENT_HOST=tipkoro.com
CLERK_SECRET_KEY=<clerk_secret>
ADMIN_WEBHOOK_URL=<admin_webhook_endpoint>
```
