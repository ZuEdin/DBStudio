import { PrintReportEventPayload } from '../types/report';
import {
  FormBeforeSavePayload,
  FormAfterSavePayload,
  FormSubformRowChangePayload,
  FormValidationFailedPayload,
  FormFieldChangePayload,
  FormRecordChangePayload,
  FormPrintPayload,
} from '../types/form';

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

  // Form Lifecycle Helper Methods
  public publishFormBeforeSave(payload: FormBeforeSavePayload): FormBeforeSavePayload {
    this.publish('FORM_BEFORE_SAVE', payload);
    return payload;
  }

  public publishFormAfterSave(payload: FormAfterSavePayload): void {
    this.publish('FORM_AFTER_SAVE', payload);
  }

  public publishFormSubformRowChange(payload: FormSubformRowChangePayload): void {
    this.publish('FORM_SUBFORM_ROW_CHANGE', payload);
  }

  public publishFormValidationFailed(payload: FormValidationFailedPayload): void {
    this.publish('FORM_VALIDATION_FAILED', payload);
  }

  public publishFormFieldChange(payload: FormFieldChangePayload): void {
    this.publish('FORM_FIELD_CHANGE', payload);
  }

  public publishFormRecordChange(payload: FormRecordChangePayload): void {
    this.publish('FORM_RECORD_CHANGE', payload);
  }

  public publishFormPrint(payload: FormPrintPayload): void {
    this.publish('FORM_PRINT', payload);
  }
}

export const eventBus = new GlobalEventBus();
