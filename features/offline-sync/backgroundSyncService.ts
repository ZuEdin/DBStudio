type BackgroundSyncCallback = () => Promise<void> | void;

export class BackgroundSyncService {
  private static readonly SYNC_TAG = 'db-studio-outbox-sync';
  private static isRegistered = false;
  private static registration: ServiceWorkerRegistration | null = null;
  private static callbacks: Set<BackgroundSyncCallback> = new Set();
  private static broadcastChannel: BroadcastChannel | null = null;

  /**
   * Initializes the Service Worker and Background Sync listeners
   */
  public static async init(onSyncTriggered?: BackgroundSyncCallback): Promise<boolean> {
    if (onSyncTriggered) {
      this.callbacks.add(onSyncTriggered);
    }

    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return false;
    }

    // Set up BroadcastChannel
    try {
      if (typeof BroadcastChannel !== 'undefined' && !this.broadcastChannel) {
        this.broadcastChannel = new BroadcastChannel('db-studio-sync');
        this.broadcastChannel.onmessage = (event) => {
          if (event.data?.type === 'BACKGROUND_SYNC_TRIGGERED') {
            this.triggerCallbacks();
          }
        };
      }
    } catch {
      // BroadcastChannel fallback
    }

    // Listen to messages from active service worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data?.type === 'BACKGROUND_SYNC_TRIGGERED') {
        this.triggerCallbacks();
      }
    });

    // Listen to visibilitychange and online events
    window.addEventListener('online', () => {
      this.triggerCallbacks();
    });

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        this.triggerCallbacks();
      }
    });

    try {
      const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      this.registration = reg;
      this.isRegistered = true;

      // Register initial sync tag if supported
      await this.requestBackgroundSync();
      return true;
    } catch (err) {
      console.warn('[BackgroundSync] Service Worker Registration failed or not supported in current environment', err);
      return false;
    }
  }

  /**
   * Request the browser to perform a background sync when network is available
   */
  public static async requestBackgroundSync(): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    // Check if Background Sync API is supported
    if (this.registration && 'sync' in this.registration) {
      try {
        await (this.registration as any).sync.register(this.SYNC_TAG);
        return true;
      } catch (err) {
        console.warn('[BackgroundSync] Sync registration error:', err);
      }
    }

    // Fallback: Notify active service worker via message
    if (navigator.serviceWorker?.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'REQUEST_BACKGROUND_SYNC',
        tag: this.SYNC_TAG,
      });
    }

    return false;
  }

  /**
   * Check if the Background Sync API (SyncManager) is natively supported
   */
  public static isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return 'serviceWorker' in navigator && 'SyncManager' in window;
  }

  public static isServiceWorkerActive(): boolean {
    return this.isRegistered && !!this.registration;
  }

  public static onSync(callback: BackgroundSyncCallback): () => void {
    this.callbacks.add(callback);
    return () => {
      this.callbacks.delete(callback);
    };
  }

  private static triggerCallbacks() {
    this.callbacks.forEach((cb) => {
      try {
        const result = cb();
        if (result instanceof Promise) {
          result.catch(console.error);
        }
      } catch (err) {
        console.error('[BackgroundSync] Callback execution error:', err);
      }
    });
  }
}
