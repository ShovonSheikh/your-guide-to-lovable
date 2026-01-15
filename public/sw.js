// TipKoro Service Worker for Push Notifications
// Handles push events, notification clicks, and background sync

const CACHE_NAME = 'tipkoro-v1';
const APP_URL = self.location.origin;

self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(clients.claim());
});

// Handle push events
self.addEventListener('push', (event) => {
  console.log('[SW] Push received:', event);

  let data = {
    title: 'TipKoro',
    body: 'You have a new notification',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    url: '/dashboard',
    tag: 'tipkoro-notification',
    data: {},
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      data = { ...data, ...payload };
    } catch (e) {
      console.log('[SW] Failed to parse push data, using text:', e);
      data.body = event.data.text();
    }
  }

  // Customize notification based on type
  const options = {
    body: data.body,
    icon: data.icon || '/favicon.ico',
    badge: data.badge || '/favicon.ico',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/dashboard',
      type: data.tag || 'general',
      dateOfArrival: Date.now(),
      ...data.data,
    },
    tag: data.tag || 'tipkoro-notification',
    renotify: true,
    requireInteraction: false,
    silent: false,
    actions: getActionsForType(data.tag),
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Get notification actions based on type
function getActionsForType(type) {
  switch (type) {
    case 'tip_received':
      return [
        { action: 'view', title: 'View Dashboard', icon: '/favicon.ico' },
        { action: 'dismiss', title: 'Dismiss' },
      ];
    case 'withdrawal_approved':
    case 'withdrawal_rejected':
    case 'withdrawal_processing':
      return [
        { action: 'view', title: 'View Finances', icon: '/favicon.ico' },
        { action: 'dismiss', title: 'Dismiss' },
      ];
    case 'promotion':
      return [
        { action: 'view', title: 'Learn More', icon: '/favicon.ico' },
        { action: 'dismiss', title: 'Dismiss' },
      ];
    default:
      return [
        { action: 'view', title: 'View', icon: '/favicon.ico' },
        { action: 'dismiss', title: 'Dismiss' },
      ];
  }
}

// Get URL based on notification type
function getUrlForNotification(notification) {
  const type = notification.data?.type || notification.tag;
  const customUrl = notification.data?.url;

  // If custom URL is provided, use it
  if (customUrl && customUrl !== '/dashboard') {
    return customUrl;
  }

  // Otherwise, route based on type
  switch (type) {
    case 'tip_received':
      return '/dashboard';
    case 'withdrawal_approved':
    case 'withdrawal_rejected':
    case 'withdrawal_processing':
      return '/dashboard?tab=finances';
    case 'promotion':
      return '/dashboard';
    default:
      return customUrl || '/dashboard';
  }
}

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event);

  const notification = event.notification;
  const action = event.action;

  notification.close();

  // Handle dismiss action
  if (action === 'dismiss') {
    return;
  }

  // Get the URL to open
  const urlToOpen = new URL(getUrlForNotification(notification), APP_URL).href;

  console.log('[SW] Opening URL:', urlToOpen);

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if there's already a window open with our app
      for (const client of windowClients) {
        if (client.url.startsWith(APP_URL) && 'focus' in client) {
          // Navigate existing window and focus it
          return client.navigate(urlToOpen).then(() => client.focus());
        }
      }
      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed:', event.notification.tag);
});

// Handle push subscription change (e.g., when token expires)
self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('[SW] Push subscription changed');

  event.waitUntil(
    self.registration.pushManager.subscribe({
      userVisibleOnly: true,
      // The applicationServerKey should match your VAPID public key
      // This will be set when the user re-subscribes from the app
    }).then((subscription) => {
      console.log('[SW] New subscription:', subscription.endpoint);
      // The app will need to update the subscription in the database
      // This is handled by the useNotifications hook when the user visits the site
    }).catch((error) => {
      console.error('[SW] Failed to resubscribe:', error);
    })
  );
});
