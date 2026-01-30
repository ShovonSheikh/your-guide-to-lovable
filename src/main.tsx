import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ClerkProvider } from "@clerk/clerk-react";

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string;

createRoot(document.getElementById("root")!).render(
<ClerkProvider 
    publishableKey={clerkPublishableKey} 
    afterSignOutUrl="/"
    signInForceRedirectUrl="/complete-profile"
    signUpForceRedirectUrl="/complete-profile"
  >
    <App />
  </ClerkProvider>
);
