import { useState, useEffect, useCallback } from 'react';
import { useProfile } from './useProfile';
import { useSupabaseWithAuth } from './useSupabaseWithAuth';
import { toast } from './use-toast';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
  data?: any;
}

interface NotificationSettings {
  tips_enabled: boolean;
  withdrawals_enabled: boolean;
  promotions_enabled: boolean;
}

// VAPID public key - this should match the one in your edge function
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const outputArray = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function useNotifications() {
  const { profile } = useProfile();
  const supabase = useSupabaseWithAuth();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [settings, setSettings] = useState<NotificationSettings>({
    tips_enabled: true,
    withdrawals_enabled: true,
    promotions_enabled: true,
  });

  // Check notification permission
  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!profile?.id) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('profile_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      setNotifications(data || []);
      setUnreadCount(data?.filter(n => !n.is_read).length || 0);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [profile?.id, supabase]);

  // Fetch notification settings
  const fetchSettings = useCallback(async () => {
    if (!profile?.id) return;

    try {
      const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('profile_id', profile.id)
        .maybeSingle();

      if (!error && data) {
        setSettings({
          tips_enabled: data.tips_enabled ?? true,
          withdrawals_enabled: data.withdrawals_enabled ?? true,
          promotions_enabled: data.promotions_enabled ?? true,
        });
      }
    } catch (err) {
      // Settings might not exist yet, use defaults
    }
  }, [profile?.id, supabase]);

  // Check if subscribed to push
  const checkSubscription = useCallback(async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (err) {
      console.error('Error checking subscription:', err);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    fetchSettings();
    checkSubscription();
  }, [fetchNotifications, fetchSettings, checkSubscription]);

  // Request notification permission
  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      toast({
        title: 'Not Supported',
        description: 'Your browser does not support notifications.',
        variant: 'destructive',
      });
      return false;
    }

    const result = await Notification.requestPermission();
    setPermission(result);
    return result === 'granted';
  }, []);

  // Subscribe to push notifications
  const subscribe = useCallback(async () => {
    if (!profile?.id || !VAPID_PUBLIC_KEY) {
      toast({
        title: 'Error',
        description: 'Push notifications are not configured.',
        variant: 'destructive',
      });
      return false;
    }

    try {
      // Request permission first
      if (permission !== 'granted') {
        const granted = await requestPermission();
        if (!granted) return false;
      }

      // Register service worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      const subscriptionJSON = subscription.toJSON();

      // Save subscription to database
      const { error } = await supabase.from('push_subscriptions').upsert({
        profile_id: profile.id,
        endpoint: subscriptionJSON.endpoint!,
        p256dh: subscriptionJSON.keys!.p256dh,
        auth: subscriptionJSON.keys!.auth,
      }, { onConflict: 'profile_id,endpoint' });

      if (error) throw error;

      setIsSubscribed(true);
      toast({
        title: 'Notifications Enabled',
        description: 'You will now receive push notifications.',
      });
      return true;
    } catch (err) {
      console.error('Error subscribing to push:', err);
      toast({
        title: 'Error',
        description: 'Failed to enable notifications.',
        variant: 'destructive',
      });
      return false;
    }
  }, [profile?.id, permission, requestPermission, supabase]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async () => {
    if (!profile?.id) return false;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();

        // Remove from database
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('profile_id', profile.id)
          .eq('endpoint', subscription.endpoint);
      }

      setIsSubscribed(false);
      toast({
        title: 'Notifications Disabled',
        description: 'You will no longer receive push notifications.',
      });
      return true;
    } catch (err) {
      console.error('Error unsubscribing:', err);
      return false;
    }
  }, [profile?.id, supabase]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  }, [supabase]);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    if (!profile?.id) return;

    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('profile_id', profile.id)
        .eq('is_read', false);

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  }, [profile?.id, supabase]);

  // Update notification settings
  const updateSettings = useCallback(async (newSettings: Partial<NotificationSettings>) => {
    if (!profile?.id) return false;

    try {
      const { error } = await supabase
        .from('notification_settings')
        .upsert({
          profile_id: profile.id,
          ...settings,
          ...newSettings,
        }, { onConflict: 'profile_id' });

      if (error) throw error;

      setSettings(prev => ({ ...prev, ...newSettings }));
      return true;
    } catch (err) {
      console.error('Error updating settings:', err);
      return false;
    }
  }, [profile?.id, settings, supabase]);

  return {
    notifications,
    unreadCount,
    loading,
    permission,
    isSubscribed,
    settings,
    requestPermission,
    subscribe,
    unsubscribe,
    markAsRead,
    markAllAsRead,
    updateSettings,
    refetch: fetchNotifications,
  };
}
