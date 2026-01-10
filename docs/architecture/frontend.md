# Frontend Architecture

The TipKoro frontend is a modern single-page application (SPA) built with React and Vite.

## Core Technologies

- **Framework:** [React](https://react.dev/) is used for building the user interface from components.
- **Build Tool:** [Vite](https://vitejs.dev/) provides a fast and lean development experience.
- **Language:** The codebase is written in [TypeScript](https://www.typescriptlang.org/) for type safety and improved developer experience.

## Styling

- **CSS Framework:** [Tailwind CSS](https://tailwindcss.com/) is used for utility-first styling.
- **Component Library:** [shadcn/ui](https://ui.shadcn.com/) provides a set of accessible and customizable components.

## Routing

- **Library:** [React Router](https://reactrouter.com/) is used to handle all client-side routing.
- **Pages:** The main pages of the application are located in the `src/pages` directory. The routing is defined in `src/App.tsx`.

## State Management

- **Remote State:** [TanStack Query](https://tanstack.com/query/latest) (formerly React Query) is used for managing server state, including caching, refetching, and optimistic updates.
- **Local State:** For local component state, React's built-in `useState` and `useReducer` hooks are used. For more complex global state, React's Context API is used.

## Directory Structure

The `src` directory contains the majority of the frontend code:

- **`src/components`**: Reusable UI components.
- **`src/pages`**: The main pages of the application.
- **`src/hooks`**: Custom React hooks.
- **`src/lib`**: Utility functions and API helpers.
- **`src/integrations`**: Code for integrating with third-party services like Supabase.
- **`src/main.tsx`**: The entry point of the application.
- **`src/App.tsx`**: The root component, which defines the application's routing.
