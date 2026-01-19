-- Insert admin_roles for user 'swagcoders' with full access (super admin)
INSERT INTO public.admin_roles (
  user_id,
  can_view_dashboard,
  can_manage_users,
  can_manage_creators,
  can_manage_verifications,
  can_manage_withdrawals,
  can_view_tips,
  can_manage_mailbox,
  can_manage_settings,
  can_manage_admins
) VALUES (
  'user_38KXAJirNJzKoEe30Kadu70TiNx',
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  true
) ON CONFLICT (user_id) DO UPDATE SET
  can_view_dashboard = true,
  can_manage_users = true,
  can_manage_creators = true,
  can_manage_verifications = true,
  can_manage_withdrawals = true,
  can_view_tips = true,
  can_manage_mailbox = true,
  can_manage_settings = true,
  can_manage_admins = true,
  updated_at = now();