import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseWithAuth } from "@/hooks/useSupabaseWithAuth";
import { toast } from "@/hooks/use-toast";

export interface FundingGoal {
  id: string;
  profile_id: string;
  title: string;
  description: string | null;
  target_amount: number;
  current_amount: number;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateFundingGoalInput {
  profile_id: string;
  title: string;
  description?: string;
  target_amount: number;
  end_date?: string | null;
}

export interface UpdateFundingGoalInput {
  title?: string;
  description?: string | null;
  target_amount?: number;
  current_amount?: number;
  is_active?: boolean;
  end_date?: string | null;
}

export function useFundingGoals(profileId: string | null | undefined) {
  const supabaseAuth = useSupabaseWithAuth();
  const [goals, setGoals] = useState<FundingGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGoals = useCallback(async () => {
    if (!profileId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from("funding_goals")
      .select("*")
      .eq("profile_id", profileId)
      .order("created_at", { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
      console.error("Error fetching funding goals:", fetchError);
    } else {
      setGoals((data as FundingGoal[]) || []);
    }

    setLoading(false);
  }, [profileId]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const createGoal = async (input: CreateFundingGoalInput): Promise<FundingGoal | null> => {
    const { data, error: createError } = await supabaseAuth
      .from("funding_goals")
      .insert({
        profile_id: input.profile_id,
        title: input.title,
        description: input.description || null,
        target_amount: input.target_amount,
        end_date: input.end_date || null,
      })
      .select()
      .single();

    if (createError) {
      toast({
        title: "Error",
        description: "Failed to create funding goal.",
        variant: "destructive",
      });
      console.error("Error creating funding goal:", createError);
      return null;
    }

    toast({ title: "Goal created!", description: "Your funding goal is now live." });
    await fetchGoals();
    return data as FundingGoal;
  };

  const updateGoal = async (id: string, input: UpdateFundingGoalInput): Promise<boolean> => {
    const { error: updateError } = await supabaseAuth
      .from("funding_goals")
      .update(input)
      .eq("id", id);

    if (updateError) {
      toast({
        title: "Error",
        description: "Failed to update funding goal.",
        variant: "destructive",
      });
      console.error("Error updating funding goal:", updateError);
      return false;
    }

    toast({ title: "Goal updated!", description: "Your changes have been saved." });
    await fetchGoals();
    return true;
  };

  const deleteGoal = async (id: string): Promise<boolean> => {
    const { error: deleteError } = await supabaseAuth
      .from("funding_goals")
      .delete()
      .eq("id", id);

    if (deleteError) {
      toast({
        title: "Error",
        description: "Failed to delete funding goal.",
        variant: "destructive",
      });
      console.error("Error deleting funding goal:", deleteError);
      return false;
    }

    toast({ title: "Goal deleted", description: "The funding goal has been removed." });
    await fetchGoals();
    return true;
  };

  const toggleGoalActive = async (id: string, isActive: boolean): Promise<boolean> => {
    return updateGoal(id, { is_active: isActive });
  };

  return {
    goals,
    activeGoals: goals.filter(g => g.is_active),
    loading,
    error,
    createGoal,
    updateGoal,
    deleteGoal,
    toggleGoalActive,
    refetch: fetchGoals,
  };
}

// Hook for public viewing of goals (any profile)
export function usePublicFundingGoals(profileId: string | null | undefined) {
  const [goals, setGoals] = useState<FundingGoal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPublicGoals() {
      if (!profileId) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("funding_goals")
        .select("*")
        .eq("profile_id", profileId)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      setGoals((data as FundingGoal[]) || []);
      setLoading(false);
    }

    fetchPublicGoals();
  }, [profileId]);

  return { goals, loading };
}
