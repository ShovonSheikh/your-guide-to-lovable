import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { supabase } from '@/integrations/supabase/client';

interface MaintenanceState {
  isMaintenanceMode: boolean;
  canBypass: boolean;
  message: string;
  loading: boolean;
}

export function useMaintenanceMode(): MaintenanceState {
  const { user, isLoaded } = useUser();
  const [state, setState] = useState<MaintenanceState>({
    isMaintenanceMode: false,
    canBypass: false,
    message: '',
    loading: true,
  });

  useEffect(() => {
    if (!isLoaded) return;
    
    const checkMaintenanceMode = async () => {
      try {
        // Fetch maintenance config
        const { data: configData } = await supabase
          .from('platform_config')
          .select('key, value')
          .in('key', ['maintenance_mode', 'maintenance_message']);

        let isEnabled = false;
        let message = 'We are currently performing scheduled maintenance. Please check back soon!';

        configData?.forEach((item) => {
          if (item.key === 'maintenance_mode') {
            const val = item.value as { enabled: boolean };
            isEnabled = val?.enabled || false;
          } else if (item.key === 'maintenance_message') {
            const val = item.value as { message: string };
            message = val?.message || message;
          }
        });

        // If maintenance is not enabled, no need to check bypass
        if (!isEnabled) {
          setState({
            isMaintenanceMode: false,
            canBypass: true,
            message: '',
            loading: false,
          });
          return;
        }

        // Check if user can bypass (admin or whitelisted)
        let canBypass = false;
        if (user?.id) {
          const { data: bypassData } = await supabase.rpc('can_bypass_maintenance', {
            clerk_user_id: user.id,
          });
          canBypass = bypassData === true;
        }

        setState({
          isMaintenanceMode: isEnabled,
          canBypass,
          message,
          loading: false,
        });
      } catch (error) {
        console.error('Error checking maintenance mode:', error);
        setState((prev) => ({ ...prev, loading: false }));
      }
    };

    checkMaintenanceMode();
  }, [user?.id, isLoaded]);

  return state;
}
