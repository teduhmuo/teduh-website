// Service worker for Teduh order-alert push notifications.
// Runs independently of the alert page's tab — Chrome/Firefox keep this
// alive in the background so a push can wake up and show a notification
// even if the alert tab itself has been frozen or isn't the focused window.

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: 'New order!', body: event.data ? event.data.text() : '' };
  }

  const title = data.title || '🔔 New order at Teduh';
  const options = {
    body: data.body || '',
    tag: data.tag || 'teduh-order',
    requireInteraction: true, // stays on screen until dismissed
    data: { url: data.url || '/alert/' },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/alert/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('/alert/') && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
    })
  );
});
