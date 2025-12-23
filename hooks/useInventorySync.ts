// ============================================================================
// hooks/useInventorySync.ts
// Mock real-time inventory synchronization hook for Toolbox Demo
// ============================================================================
import { useEffect, useCallback, useRef, useState } from 'react'
import env from '../lib/env'

interface InventoryChangeEvent {
  type: 'update' | 'insert' | 'remove' | 'create' | 'delete' | 'checkout' | 'po_received'
  itemNo?: string
  quantity?: number
  poId?: string
}

interface UseInventorySyncOptions {
  onInventoryChange?: (event: InventoryChangeEvent) => void
  onItemChange?: (data: any) => void
  onCheckout?: (data: any) => void
  onLogCreated?: (data: any) => void
  onPOChange?: (event: any) => void
  enabled?: boolean
}

export function useInventorySync(options: UseInventorySyncOptions = {}) {
  const {
    onInventoryChange,
    onItemChange,
    onCheckout,
    onLogCreated,
    onPOChange,
    enabled = true
  } = options

  const [isConnected, setIsConnected] = useState(true) // Always "connected" in demo mode
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Mock polling behavior - simulate periodic inventory checks
  useEffect(() => {
    if (!enabled || !env.DEMO_MODE) return

    // Simulate periodic inventory refresh (every 30 seconds in demo)
    intervalRef.current = setInterval(() => {
      // Randomly trigger inventory change events for demo purposes
      if (Math.random() < 0.1) { // 10% chance every 30 seconds
        const mockEvent: InventoryChangeEvent = {
          type: 'update',
          itemNo: `DEMO-${Math.floor(Math.random() * 1000)}`,
          quantity: Math.floor(Math.random() * 10) + 1
        }
        console.log('📦 [Demo] Mock inventory change:', mockEvent)
        onInventoryChange?.(mockEvent)
      }
    }, 30000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [enabled, onInventoryChange])

  // Listen for checkout events from localStorage (simulates real-time updates)
  useEffect(() => {
    if (!enabled) return

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'demo-transactions' && e.newValue) {
        try {
          const transactions = JSON.parse(e.newValue)
          const latestTransaction = transactions[transactions.length - 1]

          if (latestTransaction) {
            console.log('📦 [Demo] Checkout detected:', latestTransaction)
            onCheckout?.(latestTransaction)
            onLogCreated?.(latestTransaction)
          }
        } catch (error) {
          console.warn('📦 [Demo] Error parsing demo transactions:', error)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [enabled, onCheckout, onLogCreated])

  // Mock PO changes (less frequent)
  useEffect(() => {
    if (!enabled || !env.DEMO_MODE) return

    const poInterval = setInterval(() => {
      if (Math.random() < 0.05) { // 5% chance every 60 seconds
        const mockPOEvent = {
          type: 'po_received',
          poId: `PO-${Date.now()}`,
          status: 'received'
        }
        console.log('📦 [Demo] Mock PO change:', mockPOEvent)
        onPOChange?.(mockPOEvent)
      }
    }, 60000)

    return () => clearInterval(poInterval)
  }, [enabled, onPOChange])

  // Manual refresh trigger (mock implementation)
  const triggerRefresh = useCallback(() => {
    console.log('📦 [Demo] Manual refresh triggered')
    // Simulate an immediate inventory refresh
    const mockEvent: InventoryChangeEvent = {
      type: 'update',
      itemNo: 'REFRESH_TRIGGERED',
      quantity: 0
    }
    onInventoryChange?.(mockEvent)
  }, [onInventoryChange])

  return {
    isConnected,
    triggerRefresh
  }
}
