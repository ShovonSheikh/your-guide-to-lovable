# Backend Architecture

The TipKoro backend is powered by Supabase, which provides a suite of tools for building a scalable and secure backend without managing servers.

## Supabase

We use the following Supabase features:

- **PostgreSQL Database:** A full-featured PostgreSQL database for storing all application data.
- **Serverless Functions:** TypeScript-based functions for handling business logic.
- **Authentication:** While we use Clerk for the user-facing authentication, Supabase's authentication is used for securing access to the database.

## Serverless Functions

The core backend logic is encapsulated in serverless functions located in the `supabase/functions` directory. Each function serves a specific purpose:

- **`clerk-webhook`:** Syncs user data from Clerk to our Supabase database. When a user is created, updated, or deleted in Clerk, this function updates the `profiles` table accordingly.
- **`complete-signup`:** Handles the second step of the creator onboarding process. It validates and stores the creator's profile information in the database.
- **`rupantor-checkout`:** Creates a new payment session with Rupantor Pay.
- **`rupantor-webhook`:** A webhook that listens for payment success notifications from Rupantor Pay. It securely verifies the payment and updates the `creator_signups` table.
- **`rupantor-verify`:** Used to verify the status of a payment with Rupantor Pay.

## Database

The database schema is managed through migrations located in the `supabase/migrations` directory. The key tables are:

- **`profiles`:** Stores public user profile information. This table is kept in sync with Clerk.
- **`creator_signups`:** A temporary table to track the creator signup process.
- **`tips`:** Stores information about each tip, including the amount, sender, and recipient.

The database is secured using PostgreSQL's Row Level Security (RLS) policies.
