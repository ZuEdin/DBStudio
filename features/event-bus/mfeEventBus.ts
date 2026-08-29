import { MfeBaseEvent, MfeDomain } from './mfeEventTypes';

type EventCallback<T = any> = (event: MfeBaseEvent<T>) => void;

class EnterpriseEventBus {
  private listeners: Map<string, Set<EventCallback>> = new Map();
  private eventHistory: MfeBaseEvent[] = [];
  private maxHistoryLength: number = 50;

  public publish<T>(
    eventType: string,
    sourceDomain: MfeDomain,
    payload: T,
    targetDomain: MfeDomain = '*'
  ): MfeBaseEvent<T> {
    const event: MfeBaseEvent<T> = {
      eventId: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
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

    // Notify listeners
    const callbacks = this.listeners.get(eventType);
    if (callbacks) {
      callbacks.forEach((cb) => {
        try {
          cb(event);
        } catch (err) {
          console.error(`[EventBus] Error in listener for ${eventType}:`, err);
        }
      });
    }

    // Also notify wildcard listeners
    const wildcardCallbacks = this.listeners.get('*');
    if (wildcardCallbacks) {
      wildcardCallbacks.forEach((cb) => {
        try {
          cb(event);
        } catch (err) {
          console.error(`[EventBus] Error in wildcard listener for ${eventType}:`, err);
        }
      });
    }

    return event;
  }

  public subscribe<T = any>(eventType: string, callback: EventCallback<T>): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(callback as EventCallback);

    return () => {
      this.unsubscribe(eventType, callback as EventCallback);
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

  public getHistory(): ReadonlyArray<MfeBaseEvent> {
    return [...this.eventHistory];
  }
}

// Global Singleton
export const globalEventBus = new EnterpriseEventBus();
