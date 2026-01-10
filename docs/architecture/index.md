# Architecture Overview

This section provides a high-level overview of the technical architecture of TipKoro, which is built using a modern, decoupled approach.

## Tech Stack

- **Frontend:** A responsive web application built with [React](https://react.dev/) and [Vite](https://vitejs.dev/).
- **Backend:** Serverless functions and database powered by [Supabase](https://supabase.com/).
- **Authentication:** User management and authentication handled by [Clerk](https://clerk.com/).
- **Styling:** A combination of [Tailwind CSS](https://tailwindcss.com/) and [shadcn/ui](https://ui.shadcn.com/) for a modern and consistent look and feel.
- **Payment Processing:** Secure payments are handled by our partner, [Rupantor Pay](https://rupantor.com/).

## Diagram

```mermaid
graph TD
    A[User's Browser] --> B{Frontend (React/Vite)};
    B --> C{Clerk (Authentication)};
    B --> D{Supabase (Backend)};
    D --> E[Supabase DB];
    D --> F[Serverless Functions];
    F --> G{Rupantor Pay (Payments)};
    F --> C;

    subgraph Frontend
        B
    end

    subgraph Backend
        D
    end

    subgraph External Services
        C
        G
    end
```

This diagram shows the main components of the TipKoro architecture. The user interacts with the React frontend, which in turn communicates with Clerk for authentication and Supabase for backend data and logic. The serverless functions in Supabase handle business logic, such as payment processing via Rupantor Pay.
