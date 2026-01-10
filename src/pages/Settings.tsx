import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { Navigate, useSearchParams } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";
import { TopNavbar } from "@/components/TopNavbar";
import { MainFooter } from "@/components/MainFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { User, Link as LinkIcon, Bell, Shield, CreditCard } from "lucide-react";

const tabs = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'links', label: 'Social Links', icon: LinkIcon },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'billing', label: 'Billing', icon: CreditCard },
];

export default function Settings() {
  const { isSignedIn, isLoaded } = useUser();
  const { profile, loading, updateProfile } = useProfile();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'profile';
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    username: '',
    bio: '',
    twitter: '',
    instagram: '',
    youtube: '',
    facebook: '',
    other_link: ''
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        username: profile.username || '',
        bio: profile.bio || '',
        twitter: profile.twitter || '',
        instagram: profile.instagram || '',
        youtube: profile.youtube || '',
        facebook: profile.facebook || '',
        other_link: profile.other_link || ''
      });
    }
  }, [profile]);

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/" replace />;
  }

  const handleSave = async () => {
    setIsSubmitting(true);

    const cleanLink = (link: string) => {
      if (!link) return null;
      return link.replace(/^https?:\/\//, '').trim() || null;
    };

    const result = await updateProfile({
      first_name: formData.first_name || null,
      last_name: formData.last_name || null,
      username: formData.username.toLowerCase() || null,
      bio: formData.bio || null,
      twitter: cleanLink(formData.twitter),
      instagram: cleanLink(formData.instagram),
      youtube: cleanLink(formData.youtube),
      facebook: cleanLink(formData.facebook),
      other_link: cleanLink(formData.other_link)
    });

    if (result.error) {
      toast({
        title: "Error",
        description: result.error.includes('duplicate')
          ? "This username is already taken."
          : result.error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Saved!",
        description: "Your settings have been updated.",
      });
    }

    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <TopNavbar />
      <div className="h-24" />

      <main className="container max-w-4xl py-8 px-4">
        <h1 className="text-3xl font-display font-bold mb-8">Settings</h1>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Tabs */}
          <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 md:w-48 flex-shrink-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSearchParams({ tab: tab.id })}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  currentTab === tab.id
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1">
            {currentTab === 'profile' && (
              <div className="tipkoro-card space-y-6">
                <h2 className="text-xl font-semibold">Profile Information</h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="tipkoro-label">First Name</label>
                    <Input
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      className="tipkoro-input"
                    />
                  </div>
                  <div>
                    <label className="tipkoro-label">Last Name</label>
                    <Input
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      className="tipkoro-input"
                    />
                  </div>
                </div>

                <div>
                  <label className="tipkoro-label">Username</label>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-sm">tipkoro.com/</span>
                    <Input
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className="tipkoro-input flex-1"
                    />
                  </div>
                </div>

                <div>
                  <label className="tipkoro-label">Bio</label>
                  <Textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    className="tipkoro-input min-h-[100px]"
                    maxLength={300}
                  />
                  <p className="text-xs text-muted-foreground mt-1">{formData.bio.length}/300</p>
                </div>

                <Button onClick={handleSave} disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            )}

            {currentTab === 'links' && (
              <div className="tipkoro-card space-y-6">
                <h2 className="text-xl font-semibold">Social Links</h2>
                <p className="text-sm text-muted-foreground">
                  Add your social media links. You don't need to include "https://".
                </p>
                
                <div className="space-y-4">
                  <div>
                    <label className="tipkoro-label">Twitter/X</label>
                    <Input
                      value={formData.twitter}
                      onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                      placeholder="twitter.com/username"
                      className="tipkoro-input"
                    />
                  </div>
                  <div>
                    <label className="tipkoro-label">Instagram</label>
                    <Input
                      value={formData.instagram}
                      onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                      placeholder="instagram.com/username"
                      className="tipkoro-input"
                    />
                  </div>
                  <div>
                    <label className="tipkoro-label">YouTube</label>
                    <Input
                      value={formData.youtube}
                      onChange={(e) => setFormData({ ...formData, youtube: e.target.value })}
                      placeholder="youtube.com/@channel"
                      className="tipkoro-input"
                    />
                  </div>
                  <div>
                    <label className="tipkoro-label">Facebook</label>
                    <Input
                      value={formData.facebook}
                      onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                      placeholder="facebook.com/page"
                      className="tipkoro-input"
                    />
                  </div>
                  <div>
                    <label className="tipkoro-label">Other Link</label>
                    <Input
                      value={formData.other_link}
                      onChange={(e) => setFormData({ ...formData, other_link: e.target.value })}
                      placeholder="yourwebsite.com"
                      className="tipkoro-input"
                    />
                  </div>
                </div>

                <Button onClick={handleSave} disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            )}

            {currentTab === 'notifications' && (
              <div className="tipkoro-card">
                <h2 className="text-xl font-semibold mb-4">Notification Settings</h2>
                <p className="text-muted-foreground">Coming soon...</p>
              </div>
            )}

            {currentTab === 'security' && (
              <div className="tipkoro-card">
                <h2 className="text-xl font-semibold mb-4">Security Settings</h2>
                <p className="text-muted-foreground">Manage your account security through Clerk settings.</p>
              </div>
            )}

            {currentTab === 'billing' && (
              <div className="tipkoro-card">
                <h2 className="text-xl font-semibold mb-4">Billing & Subscription</h2>
                {profile?.account_type === 'creator' ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-secondary/50 rounded-xl">
                      <p className="font-medium">Creator Plan</p>
                      <p className="text-sm text-muted-foreground">৳150/month</p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Billing is automatically deducted from your tips each month.
                    </p>
                  </div>
                ) : (
                  <p className="text-muted-foreground">You're on the free Supporter plan.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      <MainFooter />
    </div>
  );
}
