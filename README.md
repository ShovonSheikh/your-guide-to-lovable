# 🚀 Lovable - AI-Powered Web App Builder

Build beautiful, production-ready web applications using natural language. Just describe what you want, and Lovable creates it for you.

---

## 🎯 What is Lovable?

Lovable is an AI editor that creates and modifies web applications in real-time. Simply chat with the AI, and watch your app come to life in the preview panel on the right side of your screen.

---

## 🛠️ Tech Stack

Your Lovable project is built with modern, production-ready technologies:

| Technology | Purpose |
|------------|---------|
| **React 18** | UI library |
| **TypeScript** | Type-safe JavaScript |
| **Vite** | Fast build tool |
| **Tailwind CSS** | Utility-first styling |
| **shadcn/ui** | Beautiful, accessible components |
| **React Router** | Client-side routing |
| **TanStack Query** | Data fetching & caching |

---

## 💬 How to Use Lovable

### Basic Workflow

1. **Describe your vision** - Tell the AI what you want to build in plain language
2. **Watch it build** - See real-time changes in the preview panel
3. **Iterate** - Request modifications, fixes, or new features
4. **Publish** - Deploy your app with one click

### Example Prompts

```
"Create a landing page for a coffee shop with a hero section and menu"
"Add a contact form with email validation"
"Make the navigation sticky and add a mobile hamburger menu"
"Change the color scheme to dark blue and gold"
```

### Tips for Best Results

| Tip | Example |
|-----|---------|
| **Be specific** | "Add a call-to-action button in the hero section" vs "Add a button" |
| **Iterate in steps** | Build features one at a time for better results |
| **Reference elements** | "Make the header match the footer style" |
| **Share context** | Upload images or describe your brand |

---

## ☁️ Lovable Cloud

Enable **Lovable Cloud** for backend functionality:

- 🗄️ **Database** - PostgreSQL for data persistence
- 🔐 **Authentication** - User login/signup with email or social providers
- 📁 **File Storage** - Store images, documents, and more
- ⚡ **Edge Functions** - Server-side logic for APIs, payments, emails

> Just ask: *"Add user authentication"* or *"Create a database for products"*

---

## 🔗 Integrations

| Integration | Purpose |
|-------------|---------|
| **GitHub** | Sync code, version control |
| **Stripe** | Payment processing |
| **OpenAI** | AI features in your app |
| **ElevenLabs** | Voice & audio generation |
| **Firecrawl** | Web scraping |

---

## 📱 Preview & Testing

- **Desktop/Mobile views** - Toggle device previews
- **Live reload** - Changes appear instantly
- **Console logs** - Debug issues in real-time
- **Network requests** - Monitor API calls

---

## 🌐 Publishing Your App

1. Click the **Publish** button (or go to Share → Publish)
2. Get a free `*.lovable.app` subdomain
3. Optionally connect a custom domain via **Project → Settings → Domains**

Read more: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

---

## 💻 Local Development

Want to work locally? Clone this repo and push changes:

```sh
# Clone the repository
git clone <YOUR_GIT_URL>

# Navigate to the project
cd <YOUR_PROJECT_NAME>

# Install dependencies
npm i

# Start dev server
npm run dev
```

**Requirements:** Node.js & npm - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

---

## 🎨 Customization

All styling is managed through:

| File | Purpose |
|------|---------|
| `src/index.css` | Design system tokens (colors, spacing) |
| `tailwind.config.ts` | Tailwind configuration |
| `src/components/ui/` | shadcn component library |

---

## 📁 Project Structure

```
├── src/
│   ├── components/     # Reusable UI components
│   │   └── ui/         # shadcn components
│   ├── pages/          # Route pages
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Utilities
│   └── assets/         # Images, fonts
├── public/             # Static assets
└── supabase/           # Backend (when Cloud enabled)
    └── functions/      # Edge functions
```

---

## 📚 Resources

- 📖 [Documentation](https://docs.lovable.dev)
- 💬 [Discord Community](https://discord.gg/lovable)
- 📝 [Feature Updates](https://docs.lovable.dev/changelog)

---

**Happy building!** 🎉 Just start chatting to create something amazing.
