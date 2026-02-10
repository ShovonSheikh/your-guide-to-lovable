import { useState, useEffect, useCallback } from "react";
import { useProfile } from "@/hooks/useProfile";
import { useSupabase } from "@/hooks/useSupabase";

export function useTokenBalance() {
  const { profile } = useProfile();
  const supabase = useSupabase();
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const fetchBalance = useCallback(async () => {
    if (!profile?.id) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("token_balances")
        .select("balance")
        .eq("profile_id", profile.id)
        .maybeSingle();

      if (!error && data) {
        setBalance(data.balance);
      }
    } catch (err) {
      console.error("Error fetching token balance:", err);
    } finally {
      setLoading(false);
    }
  }, [profile?.id, supabase]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  return { balance, loading, refetch: fetchBalance };
}
