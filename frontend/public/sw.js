// Service Worker for Suraksha push notifications

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    console.error("Error parsing push notification payload:", e);
  }

  const title = data.title || "🚨 Emergency SOS Alert";
  const options = {
    body: data.body || "A trusted contact is in danger and needs help!",
    icon: "/favicon.svg",
    badge: "/favicon.svg",
    sound: "/sounds/sos-alert.wav",
    vibrate: [1000, 500, 1000, 500, 1000, 500, 1000, 500, 1000, 500, 1000, 500, 1000],
    data: {
      url: data.url || "/"
    },
    requireInteraction: true,
    tag: "sos-emergency-notification",
    renotify: true
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      // Find if there is an active tab we can reuse
      for (let client of windowClients) {
        const urlMatches = client.url.startsWith(self.location.origin);
        if (urlMatches && "focus" in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // Otherwise, open a new tab/window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
