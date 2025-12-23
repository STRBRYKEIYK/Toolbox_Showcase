import { useEffect, useState, useCallback, useRef } from 'react'
import env from '../lib/env'

interface RealtimeEventData {
  [key: string]: any
}

interface RealtimeEvent {
  event: string
  data: RealtimeEventData
  timestamp: number
}

// Mock polling manager for Toolbox Demo
class ToolboxPollingManager {
  private isReady = false
  private eventListeners: Map<string, ((data: any) => void)[]> = new Map()

  constructor(_apiUrl: string) { /* apiUrl unused in demo mode */ }

  initialize() {
    if (this.isReady) return
    this.isReady = true
    console.log('📡 [Demo] Mock polling manager initialized')
  }

  private notifyListeners(event: string, data: any) {
    const listeners = this.eventListeners.get(event) || []
    listeners.forEach(callback => {
      try {
        callback(data)
      } catch (error) {
        console.error(`[Toolbox] Error in event listener for ${event}:`, error)
      }
    })
  }

  subscribeToUpdates(event: string, callback: (data: any) => void) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, [])
    }
    this.eventListeners.get(event)!.push(callback)

    return () => {
      const listeners = this.eventListeners.get(event) || []
      const index = listeners.indexOf(callback)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }

  disconnect() {/* No-op in demo mode */}

  get isSocketConnected() {
    return true // Always "connected" in demo mode
  }

  // Mock method to simulate events for demo purposes
  simulateEvent(event: string, data: any) {
    console.log(`📡 [Demo] Simulating event: ${event}`, data)
    this.notifyListeners(event, data)
  }
}

// Create a singleton instance
let toolboxPollingManager: ToolboxPollingManager | null = null

export function getToolboxPollingManager(apiUrl: string) {
  if (!toolboxPollingManager) {
    toolboxPollingManager = new ToolboxPollingManager(apiUrl)
  }
  return toolboxPollingManager
}

/**
 * Hook to subscribe to a single real-time event
 * @param event - Event name to listen for
 * @param callback - Callback function to handle event
 * @param deps - Dependencies array (like useEffect)
 */
export function useRealtimeEvent(
  event: string,
  callback: (data: RealtimeEventData) => void,
  deps: any[] = [],
  apiUrl?: string
) {
  useEffect(() => {
    const manager = getToolboxPollingManager(apiUrl || 'http://localhost:3000')

    if (!manager.isSocketConnected) {
      manager.initialize()
    }

    const unsubscribe = manager.subscribeToUpdates(event, callback)

    return () => {
      unsubscribe()
    }
  }, [event, apiUrl, ...deps])
}

/**
 * Hook to subscribe to multiple real-time events
 * @param eventHandlers - Object mapping event names to handlers
 */
export function useRealtimeEvents(
  eventHandlers: Record<string, (data: RealtimeEventData) => void>,
  deps: any[] = [],
  apiUrl?: string
) {
  useEffect(() => {
    const manager = getToolboxPollingManager(apiUrl || 'http://localhost:3000')

    if (!manager.isSocketConnected) {
      manager.initialize()
    }

    const unsubscribers = Object.entries(eventHandlers).map(([event, handler]) => {
      return manager.subscribeToUpdates(event, handler)
    })

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe())
    }
  }, [eventHandlers, apiUrl, ...deps])
}

/**
 * Hook to get all events of a specific type as state
 * @param event - Event name to collect
 * @param maxEvents - Maximum number of events to keep (default: 50)
 */
export function useRealtimeEventHistory(
  event: string,
  maxEvents = 50,
  apiUrl?: string
) {
  const [events, setEvents] = useState<RealtimeEvent[]>([])

  useRealtimeEvent(event, (data) => {
    setEvents(prev => {
      const newEvents = [{ event, data, timestamp: Date.now() }, ...prev]
      return newEvents.slice(0, maxEvents)
    })
  }, [], apiUrl)

  const clearEvents = useCallback(() => {
    setEvents([])
  }, [])

  return { events, clearEvents }
}

/**
 * Hook to track connection status
 */
export function useConnectionStatus(apiUrl?: string) {
  const [status, setStatus] = useState({
    connected: true, // Always connected in demo mode
    error: null as string | null
  })

  // In demo mode, always show as connected
  useEffect(() => {
    setStatus({ connected: true, error: null })
  }, [apiUrl])

  return status
}

/**
 * Hook for Item real-time updates
 * Automatically refreshes data when updates occur
 */
export function useItemRealtime(
  onUpdate?: (update: { type: string; data: any }) => void,
  apiUrl?: string
) {
  const [lastUpdate, setLastUpdate] = useState<any>(null)

  // Simulate occasional item updates in demo mode
  useEffect(() => {
    if (!env.DEMO_MODE) return

    const interval = setInterval(() => {
      if (Math.random() < 0.05) { // 5% chance every 30 seconds
        const mockData = {
          id: `DEMO-${Math.floor(Math.random() * 1000)}`,
          name: `Demo Item ${Math.floor(Math.random() * 100)}`,
          quantity: Math.floor(Math.random() * 50) + 1
        }

        const updateType = ['updated', 'created', 'inventory_updated'][Math.floor(Math.random() * 3)]
        console.log(`📦 [Demo] Mock item ${updateType}:`, mockData)

        setLastUpdate({ type: updateType, data: mockData, timestamp: Date.now() })
        onUpdate?.({ type: updateType, data: mockData })
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [onUpdate])

  return lastUpdate
}

/**
 * Hook for Transaction real-time updates
 */
export function useTransactionRealtime(
  onUpdate?: (update: { type: string; data: any }) => void,
  apiUrl?: string
) {
  const [lastUpdate, setLastUpdate] = useState<any>(null)

  // Listen for checkout transactions from localStorage
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'demo-transactions' && e.newValue) {
        try {
          const transactions = JSON.parse(e.newValue)
          const latestTransaction = transactions[transactions.length - 1]

          if (latestTransaction) {
            console.log('💰 [Demo] Transaction detected:', latestTransaction)
            setLastUpdate({ type: 'created', data: latestTransaction, timestamp: Date.now() })
            onUpdate?.({ type: 'created', data: latestTransaction })
          }
        } catch (error) {
          console.warn('💰 [Demo] Error parsing demo transactions:', error)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [onUpdate])

  return lastUpdate
}

/**
 * Hook to auto-refresh data when specific events occur
 * @param events - Array of event names that should trigger refresh
 * @param refreshFn - Function to call when refresh is needed
 * @param options - Options for debouncing, etc.
 */
export function useAutoRefresh(
  events: string[],
  refreshFn: () => void,
  options: { debounce?: number; enabled?: boolean } = {},
  apiUrl?: string
) {
  const { debounce = 500, enabled = true } = options
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const debouncedRefresh = useCallback(() => {
    if (!enabled) return

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      console.log('🔄 [Demo] Auto-refresh triggered')
      refreshFn()
    }, debounce)
  }, [refreshFn, debounce, enabled])

  // Simulate events triggering refresh in demo mode
  useEffect(() => {
    if (!enabled || !env.DEMO_MODE) return

    const manager = getToolboxPollingManager(apiUrl || 'http://localhost:3000')
    if (!manager.isSocketConnected) {
      manager.initialize()
    }

    // Simulate random events for demo purposes
    const interval = setInterval(() => {
      if (Math.random() < 0.1 && events.length > 0) { // 10% chance every 20 seconds
        const randomEvent = events[Math.floor(Math.random() * events.length)]
        manager.simulateEvent(randomEvent, { demo: true, timestamp: Date.now() })
      }
    }, 20000)

    const unsubscribers = events.map(event => {
      return manager.subscribeToUpdates(event, debouncedRefresh)
    })

    return () => {
      clearInterval(interval)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      unsubscribers.forEach(unsubscribe => unsubscribe())
    }
  }, [events, debouncedRefresh, enabled, apiUrl])
}