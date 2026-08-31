import { MfeBaseEvent, MfeDomain, MFE_DRAG_MIME_TYPES } from './mfeEventTypes';

export type EventCallback<T = any> = (event: MfeBaseEvent<T>) => void;

export class EnterpriseEventBus {
  private listeners: Map<string, Set<EventCallback>> = new Map();
  private domainListeners: Map<MfeDomain, Set<EventCallback>> = new Map();
  private eventHistory: MfeBaseEvent[] = [];
  private deadLetterQueue: MfeBaseEvent[] = [];
  private maxHistoryLength: number = 200;

  /**
   * Publish an event to the Event-Bus
   */
  public publish<T>(
    eventType: string,
    sourceDomain: MfeDomain,
    payload: T,
    targetDomain: MfeDomain = '*'
  ): MfeBaseEvent<T> {
    const event: MfeBaseEvent<T> = {
      eventId: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      eventType,
      sourceDomain,
      targetDomain,
      timestamp: Date.now(),
      version: '1.0',
      payload,
    };

    // Store in history
    this.eventHistory.push(event);
    if (this.eventHistory.length > this.maxHistoryLength) {
      this.eventHistory.shift();
    }

    let recipientCount = 0;

    // 1. Notify exact eventType listeners
    const callbacks = this.listeners.get(eventType);
    if (callbacks && callbacks.size > 0) {
      recipientCount += callbacks.size;
      callbacks.forEach((cb) => {
        try {
          cb(event);
        } catch (err) {
          console.error(`[EventBus] Error in listener for ${eventType}:`, err);
        }
      });
    }

    // 2. Notify domain-specific listeners
    if (targetDomain !== '*') {
      const targetCallbacks = this.domainListeners.get(targetDomain);
      if (targetCallbacks && targetCallbacks.size > 0) {
        recipientCount += targetCallbacks.size;
        targetCallbacks.forEach((cb) => {
          try {
            cb(event);
          } catch (err) {
            console.error(`[EventBus] Error in domain listener (${targetDomain}):`, err);
          }
        });
      }
    }

    // 3. Notify wildcard listeners
    const wildcardCallbacks = this.listeners.get('*');
    if (wildcardCallbacks && wildcardCallbacks.size > 0) {
      recipientCount += wildcardCallbacks.size;
      wildcardCallbacks.forEach((cb) => {
        try {
          cb(event);
        } catch (err) {
          console.error(`[EventBus] Error in wildcard listener for ${eventType}:`, err);
        }
      });
    }

    // Dead Letter tracking if no subscribers
    if (recipientCount === 0) {
      this.deadLetterQueue.push(event);
      if (this.deadLetterQueue.length > 50) {
        this.deadLetterQueue.shift();
      }
    }

    return event;
  }

  /**
   * Subscribe to a specific event type
   */
  public subscribe<T = any>(eventType: string, callback: EventCallback<T>): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(callback as EventCallback);

    return () => {
      this.unsubscribe(eventType, callback as EventCallback);
    };
  }

  /**
   * Subscribe to all events targeted at or originating from a specific MFE Domain
   */
  public subscribeDomain<T = any>(domain: MfeDomain, callback: EventCallback<T>): () => void {
    if (!this.domainListeners.has(domain)) {
      this.domainListeners.set(domain, new Set());
    }
    this.domainListeners.get(domain)!.add(callback as EventCallback);

    return () => {
      const callbacks = this.domainListeners.get(domain);
      if (callbacks) {
        callbacks.delete(callback as EventCallback);
      }
    };
  }

  public unsubscribe(eventType: string, callback: EventCallback): void {
    const callbacks = this.listeners.get(eventType);
    if (callbacks) {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        this.listeners.delete(eventType);
      }
    }
  }

  /**
   * Replay the last matching event from history for late-subscribing components.
   */
  public replayLastEvent<T = any>(eventType: string, callback: EventCallback<T>): boolean {
    for (let i = this.eventHistory.length - 1; i >= 0; i--) {
      const event = this.eventHistory[i];
      if (event.eventType === eventType) {
        try {
          callback(event as MfeBaseEvent<T>);
          return true;
        } catch (e) {
          console.error(`[EventBus] Error in replay handler for ${eventType}:`, e);
        }
      }
    }
    return false;
  }

  /**
   * Request-response RPC pattern with correlationId and timeout.
   */
  public request<TReq = any, TRes = any>(
    requestEventType: string,
    responseEventType: string,
    sourceDomain: MfeDomain,
    payload: TReq,
    timeoutMs: number = 5000
  ): Promise<TRes> {
    return new Promise((resolve, reject) => {
      const correlationId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      let timer: any = null;

      const unsub = this.subscribe(responseEventType, (event) => {
        if (event.correlationId === correlationId) {
          if (timer) clearTimeout(timer);
          unsub();
          resolve(event.payload);
        }
      });

      timer = setTimeout(() => {
        unsub();
        reject(new Error(`[EventBus] Request timeout after ${timeoutMs}ms for ${requestEventType} -> ${responseEventType}`));
      }, timeoutMs);

      const reqEvent = this.publish(requestEventType, sourceDomain, payload);
      reqEvent.correlationId = correlationId;
    });
  }

  /**
   * Helper for standard HTML5 Drag & Drop payload packaging
   */
  public static setDragData(e: React.DragEvent | DragEvent, type: keyof typeof MFE_DRAG_MIME_TYPES, payload: any): void {
    const mime = MFE_DRAG_MIME_TYPES[type];
    if (e.dataTransfer) {
      e.dataTransfer.setData(mime, JSON.stringify(payload));
      e.dataTransfer.setData('text/plain', JSON.stringify(payload));
      e.dataTransfer.effectAllowed = 'copyMove';
    }
  }

  /**
   * Helper for extracting dropped Drag & Drop payload safely
   */
  public static getDragData<T = any>(e: React.DragEvent | DragEvent, type: keyof typeof MFE_DRAG_MIME_TYPES): T | null {
    const mime = MFE_DRAG_MIME_TYPES[type];
    if (!e.dataTransfer) return null;
    const raw = e.dataTransfer.getData(mime) || e.dataTransfer.getData('text/plain');
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  public getHistory(): ReadonlyArray<MfeBaseEvent> {
    return [...this.eventHistory];
  }

  public getDeadLetters(): ReadonlyArray<MfeBaseEvent> {
    return [...this.deadLetterQueue];
  }

  public clearHistory(): void {
    this.eventHistory = [];
    this.deadLetterQueue = [];
  }
}

// Global Singleton instance
export const globalEventBus = new EnterpriseEventBus();

// Attach to window object for cross-MFE / DevTools access
if (typeof window !== 'undefined') {
  (window as any).__ENTERPRISE_EVENT_BUS__ = globalEventBus;
}
