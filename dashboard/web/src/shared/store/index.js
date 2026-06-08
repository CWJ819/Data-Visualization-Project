import { create } from 'zustand'

export const useStore = create((set) => ({
  selectedPeriod: null,
  setSelectedPeriod: (p) => set({ selectedPeriod: p }),

  activeStar: null,
  setActiveStar: (s) => set({ activeStar: s }),

  highlightRupture: null,
  setHighlightRupture: (y) => set({ highlightRupture: y }),
}))
