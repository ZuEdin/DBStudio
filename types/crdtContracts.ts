/**
 * CRDT & P2P Collaboration Contracts
 * Decoupled data contracts for local network (LAN) and multi-tab live sync:
 * - Yjs Doc representation
 * - Awareness State & Remote Peer Presence
 * - Field & Form Component Locking
 * - Vector Clocks & State Vectors
 */

export interface PeerPresence {
  peerId: string;
  userName: string;
  userRole: 'Architect' | 'SiteManager' | 'Estimator' | 'Developer';
  color: string;
  activeView: string;
  activeEntityId?: string;
  activeFieldId?: string;
  lastActive: number;
}

export interface FieldLockState {
  fieldId: string;
  tableId: string;
  lockedByPeerId: string;
  lockedByUserName: string;
  lockedAt: number;
  expiresAt: number;
}

export interface CrdtOperationMessage {
  type: 'SYNC_UPDATE' | 'AWARENESS_HEARTBEAT' | 'FIELD_LOCK_ACQUIRE' | 'FIELD_LOCK_RELEASE';
  originPeerId: string;
  timestamp: number;
  payload: any;
}
