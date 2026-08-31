import { create } from 'zustand';
import { NotationStyle } from '../types/erDesignerTypes';
import { Table } from '../../../types/index';

interface ERDiagramState {
  // Visual notation style
  notationStyle: NotationStyle;
  setNotationStyle: (style: NotationStyle) => void;

  // Linter Health Metrics
  linterScore: number;
  linterIssuesCount: number;
  setLinterReport: (score: number, issuesCount: number) => void;

  // Drawers & Modals
  isLinterOpen: boolean;
  setIsLinterOpen: (open: boolean) => void;
  isDbmlOpen: boolean;
  setIsDbmlOpen: (open: boolean) => void;
  toggleDbmlOpen: () => void;
  isSqlReverseModalOpen: boolean;
  setIsSqlReverseModalOpen: (open: boolean) => void;
  isSchemaDiffModalOpen: boolean;
  setIsSchemaDiffModalOpen: (open: boolean) => void;
  isMockDataModalOpen: boolean;
  setIsMockDataModalOpen: (open: boolean) => void;
  isDataDictionaryModalOpen: boolean;
  setIsDataDictionaryModalOpen: (open: boolean) => void;
  isEnumManagerModalOpen: boolean;
  setIsEnumManagerModalOpen: (open: boolean) => void;
  selectedTableForConstraints: Table | null;
  setSelectedTableForConstraints: (table: Table | null) => void;

  // Canvas View Controls
  snapToGrid: boolean;
  setSnapToGrid: (snap: boolean) => void;
  toggleSnapToGrid: () => void;
  showMinimap: boolean;
  setShowMinimap: (show: boolean) => void;
  toggleMinimap: () => void;

  // Event & Layout action trigger
  actionTrigger: { action: string; payload?: any; timestamp: number } | null;
  triggerAction: (action: string, payload?: any) => void;
}

export const useERDiagramStore = create<ERDiagramState>((set) => ({
  notationStyle: 'crows_foot',
  setNotationStyle: (style) => set({ notationStyle: style }),

  linterScore: 100,
  linterIssuesCount: 0,
  setLinterReport: (score, issuesCount) => set({ linterScore: score, linterIssuesCount: issuesCount }),

  isLinterOpen: false,
  setIsLinterOpen: (open) => set({ isLinterOpen: open }),
  isDbmlOpen: false,
  setIsDbmlOpen: (open) => set({ isDbmlOpen: open }),
  toggleDbmlOpen: () => set((state) => ({ isDbmlOpen: !state.isDbmlOpen })),
  isSqlReverseModalOpen: false,
  setIsSqlReverseModalOpen: (open) => set({ isSqlReverseModalOpen: open }),
  isSchemaDiffModalOpen: false,
  setIsSchemaDiffModalOpen: (open) => set({ isSchemaDiffModalOpen: open }),
  isMockDataModalOpen: false,
  setIsMockDataModalOpen: (open) => set({ isMockDataModalOpen: open }),
  isDataDictionaryModalOpen: false,
  setIsDataDictionaryModalOpen: (open) => set({ isDataDictionaryModalOpen: open }),
  isEnumManagerModalOpen: false,
  setIsEnumManagerModalOpen: (open) => set({ isEnumManagerModalOpen: open }),
  selectedTableForConstraints: null,
  setSelectedTableForConstraints: (table) => set({ selectedTableForConstraints: table }),

  snapToGrid: true,
  setSnapToGrid: (snap) => set({ snapToGrid: snap }),
  toggleSnapToGrid: () => set((state) => ({ snapToGrid: !state.snapToGrid })),
  showMinimap: true,
  setShowMinimap: (show) => set({ showMinimap: show }),
  toggleMinimap: () => set((state) => ({ showMinimap: !state.showMinimap })),

  actionTrigger: null,
  triggerAction: (action, payload) => set({ actionTrigger: { action, payload, timestamp: Date.now() } }),
}));
