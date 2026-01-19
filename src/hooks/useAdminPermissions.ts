import { useState, useEffect } from 'react';
import { useSupabase } from './useSupabase';
import { useUser } from '@clerk/clerk-react';

export interface AdminPermissions {
  canViewDashboard: boolean;
  canManageUsers: boolean;
  canManageCreators: boolean;
  canManageVerifications: boolean;
  canManageWithdrawals: boolean;
  canViewTips: boolean;
  canManageMailbox: boolean;
  canManageSettings: boolean;
  canManageAdmins: boolean;
  isSuperAdmin: boolean;
}

const defaultPermissions: AdminPermissions = {
  canViewDashboard: false,
  canManageUsers: false,
  canManageCreators: false,
  canManageVerifications: false,
  canManageWithdrawals: false,
  canViewTips: false,
  canManageMailbox: false,
  canManageSettings: false,
  canManageAdmins: false,
  isSuperAdmin: false,
};

export function useAdminPermissions() {
  const supabase = useSupabase();
  const { user } = useUser();
  const [permissions, setPermissions] = useState<AdminPermissions>(defaultPermissions);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPermissions = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('admin_roles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching admin permissions:', error);
        }

        if (data) {
          const perms: AdminPermissions = {
            canViewDashboard: data.can_view_dashboard,
            canManageUsers: data.can_manage_users,
            canManageCreators: data.can_manage_creators,
            canManageVerifications: data.can_manage_verifications,
            canManageWithdrawals: data.can_manage_withdrawals,
            canViewTips: data.can_view_tips,
            canManageMailbox: data.can_manage_mailbox,
            canManageSettings: data.can_manage_settings,
            canManageAdmins: data.can_manage_admins,
            isSuperAdmin: data.can_manage_admins && 
                          data.can_manage_users && 
                          data.can_manage_creators && 
                          data.can_manage_verifications &&
                          data.can_manage_withdrawals &&
                          data.can_view_tips &&
                          data.can_manage_mailbox &&
                          data.can_manage_settings,
          };
          setPermissions(perms);
        } else {
          // No admin_roles record found - check if user is admin in profiles (fallback)
          const { data: profile } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('user_id', user.id)
            .maybeSingle();

          if (profile?.is_admin) {
            // User is admin but no roles record - grant full access as fallback
            setPermissions({
              canViewDashboard: true,
              canManageUsers: true,
              canManageCreators: true,
              canManageVerifications: true,
              canManageWithdrawals: true,
              canViewTips: true,
              canManageMailbox: true,
              canManageSettings: true,
              canManageAdmins: true,
              isSuperAdmin: true,
            });
          } else {
            setPermissions(defaultPermissions);
          }
        }
      } catch (error) {
        console.error('Error in useAdminPermissions:', error);
        setPermissions(defaultPermissions);
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, [supabase, user?.id]);

  return { permissions, loading };
}

// Permission key mapping for nav items
export const permissionMap: Record<string, keyof AdminPermissions> = {
  dashboard: 'canViewDashboard',
  users: 'canManageUsers',
  creators: 'canManageCreators',
  verifications: 'canManageVerifications',
  withdrawals: 'canManageWithdrawals',
  tips: 'canViewTips',
  mailbox: 'canManageMailbox',
  settings: 'canManageSettings',
  admins: 'canManageAdmins',
};
