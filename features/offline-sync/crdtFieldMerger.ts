import { CrdtFieldMergeResult } from './outboxTypes';

export interface FieldMergeContext {
  clientPayload: Record<string, any>;
  serverPayload: Record<string, any>;
  basePayload?: Record<string, any>;
  clientTimestamps?: Record<string, number>;
  serverTimestamps?: Record<string, number>;
  clientDefaultTime?: number;
  serverDefaultTime?: number;
}

/**
 * CRDT Field-Level Merger (LWW-Register per Field & Disjoint Column Auto-Merge)
 * Automatically resolves conflicts without user dialog if modified fields are disjoint,
 * or using deterministic Last-Write-Wins timestamps per column.
 */
export class CrdtFieldMerger {
  /**
   * Perform field-level 3-way merge between base, client, and server payloads
   */
  public static mergeFields(context: FieldMergeContext): CrdtFieldMergeResult {
    const {
      clientPayload,
      serverPayload,
      basePayload = {},
      clientTimestamps = {},
      serverTimestamps = {},
      clientDefaultTime = Date.now(),
      serverDefaultTime = Date.now(),
    } = context;

    const mergedPayload: Record<string, any> = {};
    const resolvedFields: CrdtFieldMergeResult['resolvedFields'] = [];
    const conflictingFields: string[] = [];
    const auditNotes: string[] = [];

    // Collect all field keys
    const allKeys = Array.from(
      new Set([
        ...Object.keys(basePayload),
        ...Object.keys(clientPayload),
        ...Object.keys(serverPayload),
      ])
    ).filter(
      (k) =>
        k !== '_serverSnapshot' &&
        k !== 'serverVersion' &&
        k !== 'id' &&
        k !== '__timestamps'
    );

    // Track ID if present
    if (clientPayload.id || serverPayload.id || basePayload.id) {
      mergedPayload.id = clientPayload.id || serverPayload.id || basePayload.id;
    }

    for (const key of allKeys) {
      const baseVal = basePayload[key];
      const clientVal = clientPayload[key];
      const serverVal = serverPayload[key];

      const clientChanged = !this.isEqual(clientVal, baseVal);
      const serverChanged = !this.isEqual(serverVal, baseVal);

      // Case 1: Neither changed -> preserve base
      if (!clientChanged && !serverChanged) {
        mergedPayload[key] = baseVal !== undefined ? baseVal : clientVal;
        continue;
      }

      // Case 2: Only client changed field (disjoint column modification)
      if (clientChanged && !serverChanged) {
        mergedPayload[key] = clientVal;
        resolvedFields.push({
          fieldName: key,
          chosenSource: 'client',
          clientTimestamp: clientTimestamps[key] || clientDefaultTime,
          value: clientVal,
        });
        auditNotes.push(`Spalte "${key}": Lokal geändert ➔ Automatisch übernommen (Server unberührt).`);
        continue;
      }

      // Case 3: Only server changed field (disjoint column modification)
      if (!clientChanged && serverChanged) {
        mergedPayload[key] = serverVal;
        resolvedFields.push({
          fieldName: key,
          chosenSource: 'server',
          serverTimestamp: serverTimestamps[key] || serverDefaultTime,
          value: serverVal,
        });
        auditNotes.push(`Spalte "${key}": Auf Server geändert ➔ Automatisch übernommen (Lokal unberührt).`);
        continue;
      }

      // Case 4: Both changed to EXACT same value -> seamless convergence
      if (this.isEqual(clientVal, serverVal)) {
        mergedPayload[key] = clientVal;
        resolvedFields.push({
          fieldName: key,
          chosenSource: 'client',
          value: clientVal,
        });
        auditNotes.push(`Spalte "${key}": Beide Seiten änderten auf identischen Wert ➔ Automatisch konvergiert.`);
        continue;
      }

      // Case 5: Both changed to DIFFERENT values on the SAME column!
      // Check column-specific Lamport / LWW timestamp
      const clientTime = clientTimestamps[key] || clientDefaultTime;
      const serverTime = serverTimestamps[key] || serverDefaultTime;

      // If timestamps differ by more than threshold (> 1000ms), LWW wins automatically
      if (Math.abs(clientTime - serverTime) > 1000) {
        if (clientTime > serverTime) {
          mergedPayload[key] = clientVal;
          resolvedFields.push({
            fieldName: key,
            chosenSource: 'client',
            clientTimestamp: clientTime,
            serverTimestamp: serverTime,
            value: clientVal,
          });
          auditNotes.push(`Spalte "${key}": Kollision ➔ LWW-Regel: Lokaler Zeitstempel (${new Date(clientTime).toLocaleTimeString()}) gewinnt gegen Server (${new Date(serverTime).toLocaleTimeString()}).`);
        } else {
          mergedPayload[key] = serverVal;
          resolvedFields.push({
            fieldName: key,
            chosenSource: 'server',
            clientTimestamp: clientTime,
            serverTimestamp: serverTime,
            value: serverVal,
          });
          auditNotes.push(`Spalte "${key}": Kollision ➔ LWW-Regel: Server-Zeitstempel (${new Date(serverTime).toLocaleTimeString()}) gewinnt gegen Lokal (${new Date(clientTime).toLocaleTimeString()}).`);
        }
      } else {
        // Strict simultaneous collision on same column -> requires manual resolution or fallback
        conflictingFields.push(key);
        mergedPayload[key] = clientVal; // provisional
        auditNotes.push(`Spalte "${key}": Echter Versionskonflikt (beide gleichzeitig geändert mit unterschiedlichen Werten).`);
      }
    }

    const autoResolved = conflictingFields.length === 0;

    return {
      mergedPayload,
      autoResolved,
      resolvedFields,
      conflictingFields,
      auditNotes,
    };
  }

  private static isEqual(a: any, b: any): boolean {
    if (a === b) return true;
    if (a === undefined && b === undefined) return true;
    if (a === null && b === null) return true;
    if (typeof a === 'object' && typeof b === 'object' && a !== null && b !== null) {
      return JSON.stringify(a) === JSON.stringify(b);
    }
    return false;
  }
}
