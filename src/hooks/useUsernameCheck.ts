import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UsernameCheckResult {
  isChecking: boolean;
  isAvailable: boolean | null;
  error: string | null;
}

export function useUsernameCheck(username: string, currentUserId?: string): UsernameCheckResult {
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkUsername = useCallback(async (usernameToCheck: string) => {
    if (!usernameToCheck || usernameToCheck.length < 3) {
      setIsAvailable(null);
      setError(usernameToCheck.length > 0 && usernameToCheck.length < 3 ? 'Username must be at least 3 characters' : null);
      return;
    }

    // Validate format
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(usernameToCheck)) {
      setIsAvailable(false);
      setError('Only letters, numbers, and underscores allowed');
      return;
    }

    setIsChecking(true);
    setError(null);

    try {
      const { data, error: queryError } = await supabase
        .from('profiles')
        .select('id, user_id')
        .eq('username', usernameToCheck.toLowerCase())
        .maybeSingle();

      if (queryError) throw queryError;

      // Available if no user has it, or if it's the current user's username
      const available = !data || (currentUserId && data.user_id === currentUserId);
      setIsAvailable(available);
      setError(available ? null : 'Username is already taken');
    } catch (err: any) {
      console.error('Username check error:', err);
      setError('Error checking username');
      setIsAvailable(null);
    } finally {
      setIsChecking(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      checkUsername(username);
    }, 400); // Debounce 400ms

    return () => clearTimeout(timer);
  }, [username, checkUsername]);

  return { isChecking, isAvailable, error };
}
