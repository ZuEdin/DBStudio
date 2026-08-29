/**
 * Local P2P / LAN CRDT Collaboration Service
 * Decoupled & Offline-First:
 * - Uses native BroadcastChannel for zero-latency multi-tab sync
 * - Manages awareness presence & field locking
 * - Prepares WebRTC Data Channel contracts for local subnet/LAN sync
 */

import { PeerPresence, FieldLockState, CrdtOperationMessage } from '../types/crdtContracts';

export class CrdtLocalPeerSimulator {
  private static channelName = 'dbstudio_crdt_channel';
  private static broadcastChannel: BroadcastChannel | null = null;
  private static localPeerId: string = `peer_${Math.random().toString(36).substring(2, 9)}`;
  private static localUserName: string = 'Lokaler Bearbeiter (Tab 1)';
  private static localUserRole: 'Architect' | 'SiteManager' | 'Estimator' | 'Developer' = 'Developer';
  private static localColor: string = '#6366f1';
  private static peers: Map<string, PeerPresence> = new Map();
  private static locks: Map<string, FieldLockState> = new Map();
  private static listeners: ((peers: PeerPresence[], locks: FieldLockState[]) => void)[] = [];

  public static initialize(userName?: string) {
    if (userName) this.localUserName = userName;

    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      if (!this.broadcastChannel) {
        this.broadcastChannel = new BroadcastChannel(this.channelName);
        this.broadcastChannel.onmessage = (event) => {
          this.handleIncomingMessage(event.data);
        };
      }
    }

    // Register local presence
    this.broadcastPresence('tables_designer');
  }

  public static getLocalPeer(): PeerPresence {
    return {
      peerId: this.localPeerId,
      userName: this.localUserName,
      userRole: this.localUserRole,
      color: this.localColor,
      activeView: 'table_designer',
      lastActive: Date.now(),
    };
  }

  public static setLocalUserInfo(name: string, role: 'Architect' | 'SiteManager' | 'Estimator' | 'Developer', color?: string) {
    this.localUserName = name;
    this.localUserRole = role;
    if (color) this.localColor = color;
    this.broadcastPresence('designer');
  }

  public static broadcastPresence(activeView: string, activeFieldId?: string) {
    const presence = this.getLocalPeer();
    presence.activeView = activeView;
    presence.activeFieldId = activeFieldId;

    const msg: CrdtOperationMessage = {
      type: 'AWARENESS_HEARTBEAT',
      originPeerId: this.localPeerId,
      timestamp: Date.now(),
      payload: presence,
    };

    this.postMessage(msg);
  }

  public static acquireFieldLock(tableId: string, fieldId: string): boolean {
    const existing = this.locks.get(`${tableId}_${fieldId}`);
    if (existing && existing.lockedByPeerId !== this.localPeerId && existing.expiresAt > Date.now()) {
      return false; // Locked by another peer
    }

    const newLock: FieldLockState = {
      tableId,
      fieldId,
      lockedByPeerId: this.localPeerId,
      lockedByUserName: this.localUserName,
      lockedAt: Date.now(),
      expiresAt: Date.now() + 30000, // 30s auto-expire
    };

    this.locks.set(`${tableId}_${fieldId}`, newLock);

    const msg: CrdtOperationMessage = {
      type: 'FIELD_LOCK_ACQUIRE',
      originPeerId: this.localPeerId,
      timestamp: Date.now(),
      payload: newLock,
    };

    this.postMessage(msg);
    this.notifySubscribers();
    return true;
  }

  public static releaseFieldLock(tableId: string, fieldId: string) {
    this.locks.delete(`${tableId}_${fieldId}`);
    const msg: CrdtOperationMessage = {
      type: 'FIELD_LOCK_RELEASE',
      originPeerId: this.localPeerId,
      timestamp: Date.now(),
      payload: { tableId, fieldId },
    };
    this.postMessage(msg);
    this.notifySubscribers();
  }

  public static subscribe(callback: (peers: PeerPresence[], locks: FieldLockState[]) => void) {
    this.listeners.push(callback);
    callback(Array.from(this.peers.values()), Array.from(this.locks.values()));
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  private static postMessage(msg: CrdtOperationMessage) {
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(msg);
      } catch (err) {
        console.warn('BroadcastChannel postMessage failed:', err);
      }
    }
  }

  private static handleIncomingMessage(msg: CrdtOperationMessage) {
    if (!msg || msg.originPeerId === this.localPeerId) return;

    if (msg.type === 'AWARENESS_HEARTBEAT') {
      const presence: PeerPresence = msg.payload;
      this.peers.set(presence.peerId, presence);
    } else if (msg.type === 'FIELD_LOCK_ACQUIRE') {
      const lock: FieldLockState = msg.payload;
      this.locks.set(`${lock.tableId}_${lock.fieldId}`, lock);
    } else if (msg.type === 'FIELD_LOCK_RELEASE') {
      const { tableId, fieldId } = msg.payload;
      this.locks.delete(`${tableId}_${fieldId}`);
    }

    // Clean expired peers (> 60s)
    const now = Date.now();
    for (const [id, peer] of this.peers.entries()) {
      if (now - peer.lastActive > 60000) {
        this.peers.delete(id);
      }
    }

    this.notifySubscribers();
  }

  private static notifySubscribers() {
    const peersList = Array.from(this.peers.values());
    const locksList = Array.from(this.locks.values());
    this.listeners.forEach((l) => l(peersList, locksList));
  }
}
