import { create } from 'zustand';

export type OmniTrayEdge = 'left' | 'right' | 'bottom';

interface OmniTrayState {
  isOpen: boolean;
  activeEdge: OmniTrayEdge | null;
  proximityLevels: Record<OmniTrayEdge, number>; // 0-1
  open: (edge: OmniTrayEdge) => void;
  close: () => void;
  setProximity: (edge: OmniTrayEdge, level: number) => void;
}

export const useOmniTray = create<OmniTrayState>((set) => ({
  isOpen: false,
  activeEdge: null,
  proximityLevels: { left: 0, right: 0, bottom: 0 },
  open: (edge) => set({ isOpen: true, activeEdge: edge }),
  close: () => set({ isOpen: false, activeEdge: null }),
  setProximity: (edge, level) =>
    set((state) => ({
      proximityLevels: { ...state.proximityLevels, [edge]: level },
    })),
}));
