import React from "react";
import { useUser } from "@clerk/clerk-react";
import { Navigate } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Onboarding } from "@/components/Onboarding";

export default function CompleteProfile() {
  usePageTitle("Complete Your Profile");
  const { isSignedIn, isLoaded } = useUser();
  const { profile, loading: profileLoading } = useProfile();

  if (!isLoaded || profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/" replace />;
  }

  // If onboarding is completed, redirect to dashboard
  if (profile && profile.onboarding_status === 'completed') {
    return <Navigate to="/dashboard" replace />;
  }

  return <Onboarding />;
}
