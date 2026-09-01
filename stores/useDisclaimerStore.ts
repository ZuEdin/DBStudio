import { create } from 'zustand';

export type DisclaimerStatus = 'unconfirmed' | 'session' | 'persistent';

interface DisclaimerStore {
  status: DisclaimerStatus;
  acceptedAt: string | null;
  isModalOpen: boolean;
  actionTitle: string;
  pendingAction: (() => void) | null;

  // Actions
  init: () => void;
  openModal: (actionTitle?: string, onConfirmed?: () => void) => void;
  closeModal: () => void;
  acceptDisclaimer: (mode: 'persistent' | 'session') => void;
  revokeDisclaimer: () => void;
  requireConfirmation: (actionTitle: string, onConfirmed: () => void) => void;
  isAccepted: () => boolean;
}

const STORAGE_KEY_PERSISTENT = 'dbstudio_code_disclaimer_accepted';
const STORAGE_KEY_TIMESTAMP = 'dbstudio_code_disclaimer_timestamp';
const STORAGE_KEY_SESSION = 'dbstudio_session_disclaimer_accepted';

export const useDisclaimerStore = create<DisclaimerStore>((set, get) => ({
  status: 'unconfirmed',
  acceptedAt: null,
  isModalOpen: false,
  actionTitle: 'Code-Generierung & Export',
  pendingAction: null,

  init: () => {
    try {
      const persistent = localStorage.getItem(STORAGE_KEY_PERSISTENT);
      const timestamp = localStorage.getItem(STORAGE_KEY_TIMESTAMP);
      if (persistent === 'true') {
        set({ status: 'persistent', acceptedAt: timestamp || new Date().toISOString() });
        return;
      }

      const session = sessionStorage.getItem(STORAGE_KEY_SESSION);
      if (session === 'true') {
        set({ status: 'session', acceptedAt: new Date().toISOString() });
        return;
      }

      set({ status: 'unconfirmed', acceptedAt: null });
    } catch {
      set({ status: 'unconfirmed', acceptedAt: null });
    }
  },

  isAccepted: () => {
    try {
      const persistent = localStorage.getItem(STORAGE_KEY_PERSISTENT);
      if (persistent === 'true') return true;

      const session = sessionStorage.getItem(STORAGE_KEY_SESSION);
      if (session === 'true') return true;

      const currentStatus = get().status;
      return currentStatus === 'persistent' || currentStatus === 'session';
    } catch {
      return false;
    }
  },

  openModal: (actionTitle = 'Code-Generierung & Export', onConfirmed) => {
    set({
      isModalOpen: true,
      actionTitle,
      pendingAction: onConfirmed || null,
    });
  },

  closeModal: () => {
    set({
      isModalOpen: false,
      pendingAction: null,
    });
  },

  acceptDisclaimer: (mode: 'persistent' | 'session') => {
    const timestamp = new Date().toISOString();
    try {
      if (mode === 'persistent') {
        localStorage.setItem(STORAGE_KEY_PERSISTENT, 'true');
        localStorage.setItem(STORAGE_KEY_TIMESTAMP, timestamp);
        sessionStorage.removeItem(STORAGE_KEY_SESSION);
      } else {
        sessionStorage.setItem(STORAGE_KEY_SESSION, 'true');
        localStorage.removeItem(STORAGE_KEY_PERSISTENT);
        localStorage.removeItem(STORAGE_KEY_TIMESTAMP);
      }
    } catch (e) {
      console.warn('Storage error while saving disclaimer:', e);
    }

    const { pendingAction } = get();
    set({
      status: mode,
      acceptedAt: timestamp,
      isModalOpen: false,
      pendingAction: null,
    });

    if (pendingAction) {
      try {
        pendingAction();
      } catch (err) {
        console.error('Error running confirmed action:', err);
      }
    }
  },

  revokeDisclaimer: () => {
    try {
      localStorage.removeItem(STORAGE_KEY_PERSISTENT);
      localStorage.removeItem(STORAGE_KEY_TIMESTAMP);
      sessionStorage.removeItem(STORAGE_KEY_SESSION);
    } catch (e) {
      console.warn('Storage error while revoking disclaimer:', e);
    }
    set({
      status: 'unconfirmed',
      acceptedAt: null,
      isModalOpen: false,
      pendingAction: null,
    });
  },

  requireConfirmation: (actionTitle: string, onConfirmed: () => void) => {
    if (get().isAccepted()) {
      onConfirmed();
    } else {
      get().openModal(actionTitle, onConfirmed);
    }
  },
}));
