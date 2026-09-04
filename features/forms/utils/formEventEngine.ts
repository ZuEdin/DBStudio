import { Form, FormEventHandler, Table } from '../../../types';
import { evaluateFormFormula } from './formCalculationEngine';
import { useUIStore } from '../../../stores/useUIStore';
import { eventBus } from '../../../services/eventBus';

export interface FormEventExecutionContext {
  event: 'OnCurrent' | 'BeforeUpdate' | 'AfterUpdate' | 'OnChange' | 'OnClick' | 'OnDelete';
  form: Form;
  currentRecord: Record<string, any>;
  sourceTable?: Table;
  changedFieldId?: string;
  allTables?: Table[];
  allForms?: Form[];
}

export interface FormEventExecutionResult {
  cancelSave: boolean;
  cancelReason?: string;
  updatedRecord: Record<string, any>;
  hasChanges: boolean;
  executedHandlers: {
    handlerId: string;
    name?: string;
    actionType: string;
    success: boolean;
    message?: string;
  }[];
}

/**
 * Evaluates a condition expression against a form record.
 * Supports syntax like: "[Status] == 'Freigegeben'", "[Betrag] > 1000", "[Menge] != 0", etc.
 */
export function evaluateEventCondition(
  conditionExpr: string | undefined,
  record: Record<string, any>,
  table?: Table
): boolean {
  if (!conditionExpr || !conditionExpr.trim()) return true;

  try {
    let replaced = conditionExpr;
    // Replace field placeholders [FieldName] or [FieldId]
    if (table?.fields) {
      table.fields.forEach((f) => {
        const val = record[f.name] !== undefined ? record[f.name] : record[f.id];
        const formattedVal =
          typeof val === 'string' ? JSON.stringify(val) : val !== undefined && val !== null ? val : 'null';
        replaced = replaced.replaceAll(`[${f.name}]`, String(formattedVal));
        replaced = replaced.replaceAll(`[${f.id}]`, String(formattedVal));
      });
    }

    // Replace any remaining [key] with record[key]
    Object.keys(record).forEach((k) => {
      const val = record[k];
      const formattedVal =
        typeof val === 'string' ? JSON.stringify(val) : val !== undefined && val !== null ? val : 'null';
      replaced = replaced.replaceAll(`[${k}]`, String(formattedVal));
    });

    // Handle basic logical operators safely
    // eslint-disable-next-line no-new-func
    const fn = new Function(`return Boolean(${replaced});`);
    return fn();
  } catch (err) {
    console.warn('Condition evaluation error:', conditionExpr, err);
    return false;
  }
}

/**
 * Executes all matching event handlers for a specific form lifecycle event.
 */
export function executeFormEventHandlers(
  context: FormEventExecutionContext
): FormEventExecutionResult {
  const { event, form, currentRecord, sourceTable, changedFieldId } = context;
  const handlers = form.eventHandlers || [];
  
  const result: FormEventExecutionResult = {
    cancelSave: false,
    updatedRecord: { ...currentRecord },
    hasChanges: false,
    executedHandlers: [],
  };

  const matchingHandlers = handlers.filter((h) => {
    if (h.enabled === false) return false;
    if (h.event !== event) return false;
    if (event === 'OnChange' && h.triggerFieldId && changedFieldId) {
      // Check if triggerFieldId matches changed field ID or name
      const field = sourceTable?.fields?.find((f) => f.id === h.triggerFieldId);
      if (h.triggerFieldId !== changedFieldId && field?.name !== changedFieldId) {
        return false;
      }
    }
    return true;
  });

  for (const handler of matchingHandlers) {
    // Check condition if configured
    if (handler.conditionExpr) {
      const conditionPassed = evaluateEventCondition(handler.conditionExpr, result.updatedRecord, sourceTable);
      if (!conditionPassed) continue;
    }

    try {
      switch (handler.actionType) {
        case 'set_field_value': {
          if (handler.targetFieldId && handler.valueExpr) {
            const targetField = sourceTable?.fields?.find((f) => f.id === handler.targetFieldId);
            const targetKey = targetField?.name || handler.targetFieldId;

            let computedValue: any = handler.valueExpr;
            // If it's a formula, evaluate it
            if (handler.valueExpr.startsWith('=')) {
              computedValue = evaluateFormFormula(
                handler.valueExpr.substring(1),
                result.updatedRecord,
                { subforms: {} }
              );
            } else if (handler.valueExpr.includes('[') && handler.valueExpr.includes(']')) {
              computedValue = evaluateFormFormula(
                handler.valueExpr,
                result.updatedRecord,
                { subforms: {} }
              );
            }

            result.updatedRecord[targetKey] = computedValue;
            result.hasChanges = true;
            result.executedHandlers.push({
              handlerId: handler.id,
              name: handler.name,
              actionType: 'set_field_value',
              success: true,
              message: `Feld "${targetKey}" auf "${computedValue}" gesetzt.`,
            });
          }
          break;
        }

        case 'toast': {
          if (handler.toastMessage) {
            const msg = handler.toastMessage.replace(/\[(\w+)\]/g, (_, k) => result.updatedRecord[k] ?? '');
            useUIStore.getState().addToast(msg, handler.toastType || 'info');
            result.executedHandlers.push({
              handlerId: handler.id,
              name: handler.name,
              actionType: 'toast',
              success: true,
              message: `Toast angezeigt: ${msg}`,
            });
          }
          break;
        }

        case 'cancel_save': {
          result.cancelSave = true;
          result.cancelReason = handler.cancelReason || 'Speichervorgang durch Formular-Ereignisregel abgebrochen.';
          useUIStore.getState().addToast(result.cancelReason, 'error');
          result.executedHandlers.push({
            handlerId: handler.id,
            name: handler.name,
            actionType: 'cancel_save',
            success: true,
            message: `Speichern abgebrochen: ${result.cancelReason}`,
          });
          break;
        }

        case 'open_form': {
          if (handler.targetId) {
            useUIStore.getState().setCurrentView({ type: 'form_view', formId: handler.targetId });
            eventBus.publish('FORM_NAVIGATE', {
              targetFormId: handler.targetId,
              filterField: handler.targetFilterFieldId,
              filterValue: handler.targetFilterValueExpr
                ? evaluateFormFormula(handler.targetFilterValueExpr, result.updatedRecord, { subforms: {} })
                : undefined,
            });
            result.executedHandlers.push({
              handlerId: handler.id,
              name: handler.name,
              actionType: 'open_form',
              success: true,
              message: `Formular ${handler.targetId} geöffnet.`,
            });
          }
          break;
        }

        case 'open_report': {
          if (handler.targetId) {
            useUIStore.getState().setCurrentView({ type: 'report_view', reportId: handler.targetId });
            eventBus.publish('REPORT_NAVIGATE', {
              targetReportId: handler.targetId,
            });
            result.executedHandlers.push({
              handlerId: handler.id,
              name: handler.name,
              actionType: 'open_report',
              success: true,
              message: `Bericht ${handler.targetId} aufgerufen.`,
            });
          }
          break;
        }

        case 'webhook': {
          if (handler.webhookUrl) {
            eventBus.publish('WEBHOOK_DISPATCH_TRIGGER', {
              url: handler.webhookUrl,
              event: `form.${event.toLowerCase()}`,
              payload: {
                formId: form.id,
                formName: form.name,
                record: result.updatedRecord,
                timestamp: Date.now(),
              },
            });
            result.executedHandlers.push({
              handlerId: handler.id,
              name: handler.name,
              actionType: 'webhook',
              success: true,
              message: `Webhook an ${handler.webhookUrl} ausgelöst.`,
            });
          }
          break;
        }

        case 'macro':
        case 'js_script': {
          if (handler.jsCode) {
            try {
              // eslint-disable-next-line no-new-func
              const scriptFn = new Function('record', 'form', 'table', 'toast', handler.jsCode);
              scriptFn(
                result.updatedRecord,
                form,
                sourceTable,
                (m: string, t?: any) => useUIStore.getState().addToast(m, t)
              );
              result.executedHandlers.push({
                handlerId: handler.id,
                name: handler.name,
                actionType: handler.actionType,
                success: true,
                message: 'Benutzerdefiniertes Skript erfolgreich ausgeführt.',
              });
            } catch (err: any) {
              result.executedHandlers.push({
                handlerId: handler.id,
                name: handler.name,
                actionType: handler.actionType,
                success: false,
                message: `Skriptfehler: ${err.message}`,
              });
            }
          }
          break;
        }

        default:
          break;
      }
    } catch (err: any) {
      console.error('Error executing form event handler:', handler, err);
      result.executedHandlers.push({
        handlerId: handler.id,
        name: handler.name,
        actionType: handler.actionType,
        success: false,
        message: err.message,
      });
    }
  }

  return result;
}
