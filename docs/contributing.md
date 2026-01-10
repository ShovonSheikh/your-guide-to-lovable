# Contributing

We are excited that you are interested in contributing to TipKoro! This guide will provide you with all the information you need to get started.

## Development Environment Setup

To get the project running locally, you will need to have [Node.js](https://nodejs.org/) (version 20 or higher) and [npm](https://www.npmjs.com/) installed on your machine.

### 1. Clone the Repository

```bash
git clone <repository-url>
cd tipkoro
```

### 2. Install Dependencies

Install the project dependencies using npm:

```bash
npm install
```

### 3. Environment Variables

The project uses environment variables for configuration. You will need to create a `.env` file in the root of the project. A `.env.example` file is provided with all the required variables.

You will need to create a project on [Supabase](https://supabase.com/) and [Clerk](https://clerk.com/) to get the required API keys.

### 4. Set up Supabase

The backend is managed by Supabase. You will need to have the [Supabase CLI](https://supabase.com/docs/guides/cli) installed and configured.

To run the Supabase services locally, use the following command:

```bash
supabase start
```

To apply the database migrations, run:

```bash
supabase db reset
```

## Running the Application

Once you have set up your environment, you can run the application in development mode:

```bash
npm run dev
```

This will start the Vite development server, and you can view the application at `http://localhost:5173`.

## Contribution Workflow

We follow a standard GitHub flow for contributions:

1.  **Fork the repository** and create a new branch for your feature or bug fix.
2.  **Make your changes** and ensure that the code lints correctly (`npm run lint`).
3.  **Commit your changes** with a clear and descriptive commit message.
4.  **Push your branch** to your fork.
5.  **Open a pull request** to the `main` branch of the original repository.

We will review your pull request as soon as possible. Thank you for your contribution!
