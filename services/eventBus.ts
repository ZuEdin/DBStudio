import { PrintReportEventPayload } from '../types/report';

export type EventHandler<T = any> = (payload: T) => void;

class GlobalEventBus {
  private listeners: Map<string, Set<EventHandler>> = new Map();

  public subscribe<T = any>(eventType: string, handler: EventHandler<T>): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(handler);

    // Return unsubscribe function
    return () => {
      const handlers = this.listeners.get(eventType);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          this.listeners.delete(eventType);
        }
      }
    };
  }

  public publish<T = any>(eventType: string, payload: T): void {
    const handlers = this.listeners.get(eventType);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(payload);
        } catch (err) {
          console.error(`[EventBus] Error executing listener for event '${eventType}':`, err);
        }
      });
    }

    // Also dispatch to standard window CustomEvent for cross-iframe / DOM listeners
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent(`mfe:${eventType}`, {
          detail: payload,
          bubbles: true,
        })
      );
    }
  }

  // Helper for Report Print Events
  public publishPrintReport(payload: PrintReportEventPayload): void {
    this.publish('PRINT_REPORT', payload);
  }
}

export const eventBus = new GlobalEventBus();
