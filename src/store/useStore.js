import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

// ========== Zustand Store — single source of truth ==========

const useStore = create(
  subscribeWithSelector((set, get) => ({
    // --- Data ---
    rawData: [],           // full dataset
    filteredData: [],       // current filtered view

    // --- Time ---
    timeRange: [null, null], // [start, end]

    // --- Selection ---
    selectedDate: null,     // clicked date point
    selectedMetric: 'weight', // focused metric: weight | calDiff | sleep

    // --- Analysis Results ---
    correlations: null,     // { matrix: number[][], labels: string[] }
    regression: null,       // { slope, intercept, r2 }

    // --- UI State ---
    loading: false,
    error: null,

    // --- Actions ---
    setRawData: (data) => set({ rawData: data, filteredData: data }),

    setTimeRange: (range) => {
      set({ timeRange: range })
      const { rawData } = get()
      if (!range[0] || !range[1] || !rawData.length) return
      const filtered = rawData.filter(d => d.date >= range[0] && d.date <= range[1])
      set({ filteredData: filtered })
    },

    setSelectedDate: (date) => set({ selectedDate: date }),
    setSelectedMetric: (metric) => set({ selectedMetric: metric }),

    setCorrelations: (data) => set({ correlations: data }),
    setRegression: (data) => set({ regression: data }),

    setLoading: (loading) => set({ loading }),
    setError: (error) => set({ error }),

    // Reset all
    reset: () => set({
      timeRange: [null, null],
      selectedDate: null,
      correlations: null,
      regression: null,
      error: null,
    }),
  }))
)

export default useStore
