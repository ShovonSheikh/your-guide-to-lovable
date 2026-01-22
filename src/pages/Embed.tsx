import { useParams, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Heart, ExternalLink } from "lucide-react";

interface CreatorData {
  id: string;
  username: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  is_verified: boolean;
}

export default function Embed() {
  const { username } = useParams<{ username: string }>();
  const [creator, setCreator] = useState<CreatorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function fetchCreator() {
      if (!username) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("public_profiles")
        .select("id, username, first_name, last_name, avatar_url, bio, is_verified")
        .eq("username", username.toLowerCase())
        .eq("account_type", "creator")
        .eq("onboarding_status", "completed")
        .maybeSingle();

      if (error || !data) {
        setNotFound(true);
      } else {
        setCreator(data as CreatorData);
      }
      setLoading(false);
    }

    fetchCreator();
  }, [username]);

  if (loading) {
    return (
      <div className="w-full h-full min-h-[160px] flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50">
        <div className="animate-pulse flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-amber-200" />
          <div className="space-y-2">
            <div className="w-24 h-4 bg-amber-200 rounded" />
            <div className="w-16 h-3 bg-amber-100 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !creator) {
    return (
      <div className="w-full h-full min-h-[160px] flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <p className="text-sm text-gray-500">Creator not found</p>
      </div>
    );
  }

  const profileUrl = `${window.location.origin}/${creator.username}`;
  const displayName = creator.first_name && creator.last_name 
    ? `${creator.first_name} ${creator.last_name}` 
    : creator.username;

  return (
    <div className="w-full h-full min-h-[160px] p-4 bg-gradient-to-br from-amber-50 to-orange-50 font-sans">
      <a 
        href={profileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-4 p-4 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow border border-amber-100 no-underline"
      >
        {/* Avatar */}
        <div className="shrink-0">
          {creator.avatar_url ? (
            <img 
              src={creator.avatar_url} 
              alt={displayName}
              className="w-14 h-14 rounded-full object-cover border-2 border-amber-200"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xl font-bold">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="font-semibold text-gray-900 truncate">{displayName}</p>
            {creator.is_verified && (
              <svg className="w-4 h-4 text-amber-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
              </svg>
            )}
          </div>
          <p className="text-sm text-gray-500 truncate">@{creator.username}</p>
        </div>

        {/* CTA */}
        <div className="shrink-0 flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-medium text-sm shadow-md">
          <Heart className="w-4 h-4" />
          Support
          <ExternalLink className="w-3 h-3 opacity-70" />
        </div>
      </a>

      {/* Powered by */}
      <div className="mt-2 text-center">
        <a 
          href={window.location.origin}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] text-amber-600/60 hover:text-amber-600 no-underline"
        >
          Powered by TipKoro
        </a>
      </div>
    </div>
  );
}
