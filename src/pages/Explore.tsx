import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { TopNavbar } from "@/components/TopNavbar";
import { MainFooter } from "@/components/MainFooter";
import { Avatar } from "@/components/Avatar";
import { supabase } from "@/integrations/supabase/client";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Search, Users, Heart } from "lucide-react";
import { Input } from "@/components/ui/input";
import SEO from "@/components/SEO";

interface Creator {
  id: string;
  username: string;
  first_name: string | null;
  last_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  is_verified: boolean;
  total_supporters: number;
}

export default function Explore() {
  usePageTitle("Explore Creators");
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchCreators();
  }, []);

  const fetchCreators = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, first_name, last_name, bio, avatar_url, is_verified, total_supporters')
        .eq('account_type', 'creator')
        .eq('onboarding_status', 'completed')
        .not('username', 'is', null)
        .order('total_supporters', { ascending: false });

      if (error) throw error;
      setCreators(data || []);
    } catch (error) {
      console.error('Error fetching creators:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCreators = creators.filter(creator => {
    const searchLower = search.toLowerCase();
    const name = `${creator.first_name || ''} ${creator.last_name || ''}`.toLowerCase();
    return (
      name.includes(searchLower) ||
      (creator.username?.toLowerCase().includes(searchLower)) ||
      (creator.bio?.toLowerCase().includes(searchLower))
    );
  });

  return (
    <>
      <SEO 
        title="Explore Bangladeshi Creators"
        description="Discover talented Bangladeshi creators on TipKoro. Support YouTubers, streamers, artists, writers, and more with tips via bKash, Nagad, Rocket."
        keywords="Bangladeshi creators, support creators Bangladesh, bKash tips, Nagad tips, YouTubers Bangladesh, streamers Bangladesh"
        url="https://tipkoro.com/explore"
      />
      <div className="min-h-screen bg-background">
        <TopNavbar />
        <div className="h-24" />

      <main className="container max-w-6xl py-8 px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-display font-bold mb-4">
            Explore Creators
          </h1>
          <p className="text-xl text-muted-foreground max-w-xl mx-auto">
            Discover talented Bangladeshi creators and show them your support
          </p>
        </div>

        {/* Search */}
        <div className="max-w-md mx-auto mb-12">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search creators..."
              className="tipkoro-input pl-12"
            />
          </div>
        </div>

        {/* Creators Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-pulse text-muted-foreground">Loading creators...</div>
          </div>
        ) : filteredCreators.length === 0 ? (
          <div className="text-center py-20">
            <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-xl font-medium mb-2">
              {search ? 'No creators found' : 'No creators yet'}
            </p>
            <p className="text-muted-foreground">
              {search ? 'Try a different search term' : 'Be the first creator on TipKoro!'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCreators.map((creator) => (
              <Link
                key={creator.id}
                to={`/${creator.username}`}
                className="tipkoro-card flex flex-col items-center text-center hover:shadow-tipkoro-hover hover:-translate-y-1 transition-all duration-300"
              >
                <Avatar size="x-large" image={creator.avatar_url || undefined}>
                  {(creator.first_name?.[0] || creator.username?.[0] || '?').toUpperCase()}
                </Avatar>
                <h3 className="mt-4 font-semibold text-lg">
                  {creator.first_name} {creator.last_name}
                </h3>
                <p className="text-sm text-muted-foreground">@{creator.username}</p>
                {creator.bio && (
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                    {creator.bio}
                  </p>
                )}
                <div className="flex items-center gap-1 mt-4 text-sm text-muted-foreground">
                  <Heart className="w-4 h-4" />
                  <span>{creator.total_supporters} supporters</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

        <MainFooter />
      </div>
    </>
  );
}
