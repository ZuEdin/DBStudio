// DB Studio Pro - Service Worker & Background Sync Manager
const CACHE_NAME = 'db-studio-pro-v1';
const SYNC_TAG = 'db-studio-outbox-sync';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Background Sync Event Handler
self.addEventListener('sync', (event) => {
  if (event.tag === SYNC_TAG) {
    event.waitUntil(handleBackgroundSync());
  }
});

async function handleBackgroundSync() {
  console.log('[ServiceWorker] Background Sync Triggered:', SYNC_TAG);
  
  // Notify all open client windows via BroadcastChannel or postMessage
  try {
    const channel = new BroadcastChannel('db-studio-sync');
    channel.postMessage({ type: 'BACKGROUND_SYNC_TRIGGERED', timestamp: Date.now() });
  } catch (e) {
    // BroadcastChannel might not be supported in some worker environments
  }

  const allClients = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
  for (const client of allClients) {
    client.postMessage({
      type: 'BACKGROUND_SYNC_TRIGGERED',
      timestamp: Date.now(),
      tag: SYNC_TAG,
    });
  }
}

// Listen to messages from main app
self.addEventListener('message', (event) => {
  if (event.data?.type === 'REQUEST_BACKGROUND_SYNC') {
    if ('sync' in self.registration) {
      self.registration.sync.register(SYNC_TAG).catch(console.error);
    }
  }
});
