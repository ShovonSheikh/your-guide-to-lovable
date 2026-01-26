# TipKoro

A creator support platform built for Bangladesh, allowing fans to tip their favorite creators using local payment methods (bKash, Nagad, Rocket). Think "Buy Me a Coffee" but designed specifically for the Bangladeshi market.

🌐 **Website:** [tipkoro.com](https://tipkoro.com)

---

## ✨ Features

### For Creators

- **Personalized Profile Page** – Get your own public tipping page at `tipkoro.com/your-username`
- **Dashboard** – Track earnings, view recent tips, and manage your account
- **Funding Goals** – Create goals with milestone tracking to engage your supporters
- **Withdrawal System** – Request payouts via bKash, Nagad, Rocket, or bank transfer
- **Verification Badge** – Get verified to build trust with your audience
- **Share Tools** – QR codes, embed widgets, and bio link tools for promotion

### For Supporters

- **Easy Tipping** – Support your favorite creators with a few clicks
- **Local Payments** – Pay with bKash, Nagad, or Rocket
- **Donation History** – Track your past donations when logged in
- **Anonymous Tips** – Option to tip anonymously

---

## 🛠 Tech Stack

| Category | Technology |
|----------|------------|
| Frontend | React 19, TypeScript, Vite |
| Styling | Tailwind CSS, shadcn/ui |
| Auth | Clerk |
| Database | Supabase (PostgreSQL) |
| Payments | RupantorPay |
| Email | Resend |
| State | TanStack Query |

---

## 📁 Project Structure

```
tipkoro/
├── src/
│   ├── components/           # Reusable UI components
│   │   ├── ui/              # shadcn/ui primitives
│   │   ├── admin/           # Admin-specific components
│   │   └── icons/           # Custom icons
│   ├── pages/               # Route pages
│   │   ├── admin/           # Admin panel
│   │   └── payments/        # Payment result pages
│   ├── hooks/               # Custom React hooks
│   ├── integrations/        # Third-party integrations
│   └── lib/                 # Utility functions
├── supabase/
│   ├── functions/           # Edge Functions (Deno runtime)
│   └── migrations/          # Database schema changes
├── public/                  # Static assets
└── docs/                    # Documentation site
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- npm or bun
- Supabase CLI (optional, for local DB)

### Installation

```bash
# Clone repository
git clone <repo-url>
cd tipkoro

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Fill in your API keys

# Start dev server
npm run dev
```

### Environment Variables

Create a `.env` file with the following variables:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
```

---

## 💳 Payment Flow

TipKoro uses RupantorPay for processing payments through local Bangladeshi payment methods:

1. Supporter fills out the tip form on a creator's profile
2. Payment session is created via RupantorPay
3. Supporter completes payment on RupantorPay's secure page
4. Webhook confirms payment and creates the tip record
5. Both creator and supporter receive confirmation emails

---

## 🔒 Security Features

- **Two-Factor Withdrawals** – PIN + OTP verification for all payout requests
- **Clerk Authentication** – Secure user authentication and session management
- **Row Level Security** – Database-level access controls via Supabase RLS

---

## 📧 Email Notifications

TipKoro sends transactional emails for:

- Welcome messages (new users and creators)
- Tip received/sent confirmations
- Withdrawal status updates
- Goal milestone achievements (50%, 75%, 100%)
- Weekly creator summaries

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📚 Resources

- [Supabase Docs](https://supabase.com/docs)
- [Clerk Docs](https://clerk.com/docs)
- [Resend Docs](https://resend.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

## 📄 License

This project is proprietary. All rights reserved.

---

<p align="center">
  Made with ❤️ in Bangladesh
</p>
