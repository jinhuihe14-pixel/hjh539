import { create } from 'zustand'
import type { NetworkStatus } from '../types'

interface NetworkStore extends NetworkStatus {
  maxReconnectAttempts: number
  reconnectInterval: number
  isReconnecting: boolean

  setOnline: () => void
  setOffline: () => void
  addPendingData: (data: any) => void
  clearPendingData: () => void
  resetReconnectAttempts: () => void
  incrementReconnectAttempts: () => boolean
  startReconnect: () => void
  stopReconnect: () => void
  getPendingDataCount: () => number
  fillMissingData: () => void
}

let reconnectTimer: number | null = null

export const useNetworkStore = create<NetworkStore>((set, get) => ({
  isOnline: true,
  lastOnlineTime: Date.now(),
  reconnectAttempts: 0,
  maxReconnectAttempts: 10,
  reconnectInterval: 3000,
  isReconnecting: false,
  pendingData: [],

  setOnline: () => {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
    set({
      isOnline: true,
      lastOnlineTime: Date.now(),
      reconnectAttempts: 0,
      isReconnecting: false,
    })
  },

  setOffline: () => {
    set({ isOnline: false })
    get().startReconnect()
  },

  addPendingData: (data) => {
    set((state) => ({
      pendingData: [
        ...state.pendingData,
        { time: Date.now(), data },
      ].slice(-1000),
    }))
  },

  clearPendingData: () => set({ pendingData: [] }),

  resetReconnectAttempts: () => set({ reconnectAttempts: 0 }),

  incrementReconnectAttempts: () => {
    const { reconnectAttempts, maxReconnectAttempts } = get()
    const next = reconnectAttempts + 1
    if (next >= maxReconnectAttempts) {
      set({ isReconnecting: false, reconnectAttempts: next })
      return false
    }
    set({ reconnectAttempts: next })
    return true
  },

  startReconnect: () => {
    if (reconnectTimer || get().isOnline) return

    set({ isReconnecting: true })

    const attemptReconnect = () => {
      const canContinue = get().incrementReconnectAttempts()
      if (!canContinue) {
        set({ isReconnecting: false })
        return
      }

      const isOnline = Math.random() > 0.3
      if (isOnline) {
        get().setOnline()
        get().fillMissingData()
      } else {
        reconnectTimer = window.setTimeout(attemptReconnect, get().reconnectInterval)
      }
    }

    reconnectTimer = window.setTimeout(attemptReconnect, get().reconnectInterval)
  },

  stopReconnect: () => {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
    set({ isReconnecting: false })
  },

  getPendingDataCount: () => get().pendingData.length,

  fillMissingData: () => {
    const { pendingData } = get()
    if (pendingData.length === 0) return

    console.log(`补全 ${pendingData.length} 条离线期间的数据`)
    set({ pendingData: [] })
  },
}))

export function simulateNetworkOffline() {
  useNetworkStore.getState().setOffline()
}

export function simulateNetworkOnline() {
  useNetworkStore.getState().setOnline()
}
