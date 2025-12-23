"use client"

import React, { useEffect, useState } from 'react'
import { useToast } from '../hooks/use-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
import { 
  Search, 
  RefreshCw, 
  ShoppingCart, 
  FileText, 
  Package, 
  Settings, 
  HelpCircle,
  Keyboard,
  X
} from 'lucide-react'

interface KeyboardShortcut {
  key: string
  ctrlKey?: boolean
  altKey?: boolean
  shiftKey?: boolean
  action: () => void
  description: string
}

interface KeyboardShortcutsProps {
  shortcuts?: KeyboardShortcut[]
  enabled?: boolean
  onViewChange?: (view: string) => void
  onRefreshData?: () => void
  onSearch?: (query: string) => void
  cartItemCount?: number
}

// Quick Actions Dialog Component
function QuickActionsDialog({ 
  isOpen, 
  onClose, 
  onViewChange, 
  onRefreshData, 
  onSearch,
  cartItemCount = 0 
}: {
  isOpen: boolean
  onClose: () => void
  onViewChange?: (view: string) => void
  onRefreshData?: () => void
  onSearch?: (query: string) => void
  cartItemCount?: number
}) {
  const [searchQuery, setSearchQuery] = useState('')

  const actions = [
    {
      id: 'search',
      label: 'Search Items',
      description: 'Focus the search bar',
      icon: Search,
      shortcut: '/',
      action: () => {
        onClose()
        const searchInput = document.querySelector('input[type="text"], input[placeholder*="search" i]') as HTMLInputElement
        if (searchInput) {
          searchInput.focus()
        }
      }
    },
    {
      id: 'refresh',
      label: 'Refresh Data',
      description: 'Reload inventory data',
      icon: RefreshCw,
      shortcut: 'Ctrl+R',
      action: () => {
        onClose()
        onRefreshData?.()
      }
    },
    {
      id: 'cart',
      label: 'View Cart',
      description: `View your cart (${cartItemCount} items)`,
      icon: ShoppingCart,
      shortcut: 'Ctrl+Shift+C',
      action: () => {
        onClose()
        onViewChange?.('cart')
      }
    },
    {
      id: 'items',
      label: 'Browse Items',
      description: 'Switch to items view',
      icon: Package,
      shortcut: 'Alt+1',
      action: () => {
        onClose()
        onViewChange?.('dashboard')
      }
    },
    {
      id: 'logs',
      label: 'View Logs',
      description: 'Check activity logs',
      icon: FileText,
      shortcut: 'Alt+2',
      action: () => {
        onClose()
        onViewChange?.('logs')
      }
    },
    {
      id: 'settings',
      label: 'Settings',
      description: 'Open settings dialog',
      icon: Settings,
      shortcut: 'Alt+3',
      action: () => {
        onClose()
        // Could trigger settings dialog
        console.log('Settings dialog - coming soon!')
      }
    },
    {
      id: 'shortcuts',
      label: 'Keyboard Shortcuts',
      description: 'View all shortcuts',
      icon: Keyboard,
      shortcut: 'Shift+?',
      action: () => {
        onClose()
        // Could open a shortcuts help dialog
        console.log('Keyboard shortcuts help - coming soon!')
      }
    }
  ]

  const filteredActions = actions.filter(action =>
    action.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    action.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-slate-800 border-slate-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Keyboard className="w-5 h-5 text-blue-400" />
            Quick Actions
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Input
            placeholder="Search actions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-slate-700/50 border-slate-600 text-white"
            autoFocus
          />

          <div className="max-h-80 overflow-y-auto space-y-2">
            {filteredActions.map((action) => {
              const Icon = action.icon
              return (
                <Button
                  key={action.id}
                  variant="ghost"
                  className="w-full justify-start h-auto p-3 text-left hover:bg-slate-700/50"
                  onClick={action.action}
                >
                  <div className="flex items-center gap-3 w-full">
                    <Icon className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-white font-medium">{action.label}</span>
                        <Badge variant="secondary" className="text-xs ml-2">
                          {action.shortcut}
                        </Badge>
                      </div>
                      <p className="text-slate-400 text-sm mt-0.5">{action.description}</p>
                    </div>
                  </div>
                </Button>
              )
            })}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-700">
            <p className="text-xs text-slate-500">
              Press <kbd className="px-1 py-0.5 bg-slate-700 rounded text-xs">Esc</kbd> to close
            </p>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4 mr-1" />
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

const defaultShortcuts: KeyboardShortcut[] = [
  {
    key: '/',
    description: 'Focus search',
    action: () => {
      const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement
      if (searchInput) {
        searchInput.focus()
      }
    }
  },
  {
    key: 'Escape',
    description: 'Clear focus',
    action: () => {
      const activeElement = document.activeElement as HTMLElement
      if (activeElement) {
        activeElement.blur()
      }
    }
  },
  {
    key: 'k',
    ctrlKey: true,
    description: 'Quick actions',
    action: () => {
      console.log('Quick actions - Command palette coming soon!')
    }
  }
]

export function KeyboardShortcuts({ 
  shortcuts = defaultShortcuts, 
  enabled = true,
  onViewChange,
  onRefreshData,
  onSearch,
  cartItemCount = 0
}: KeyboardShortcutsProps) {
  const { toast } = useToast()
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false)

  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (event: KeyboardEvent) => {
      // Handle "/" for search focus (only when not in input fields)
      if (event.key === '/' && !event.ctrlKey && !event.metaKey && 
          !(event.target instanceof HTMLInputElement) && 
          !(event.target instanceof HTMLTextAreaElement)) {
        event.preventDefault()
        const searchInput = document.querySelector('input[type="text"], input[placeholder*="search" i]') as HTMLInputElement
        if (searchInput) {
          searchInput.focus()
          toast({
            title: "Search Focused",
            description: "Type to search items...",
            duration: 2000,
          })
        }
      }

      // Handle "Escape" to clear focus
      if (event.key === 'Escape') {
        event.preventDefault()
        const activeElement = document.activeElement as HTMLElement
        if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
          activeElement.blur()
          toast({
            title: "Focus Cleared",
            description: "Input focus removed",
            duration: 2000,
          })
        }
      }

      // Handle "Ctrl+K" for quick actions
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault()
        setIsQuickActionsOpen(true)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [enabled, toast])

  return (
    <QuickActionsDialog
      isOpen={isQuickActionsOpen}
      onClose={() => setIsQuickActionsOpen(false)}
      onViewChange={onViewChange}
      onRefreshData={onRefreshData}
      onSearch={onSearch}
      cartItemCount={cartItemCount}
    />
  )
}

// Hook for easier keyboard shortcut management
export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[], enabled = true) {
  return <KeyboardShortcuts shortcuts={shortcuts} enabled={enabled} />
}

// Predefined common shortcuts
export const commonShortcuts = {
  search: (action: () => void): KeyboardShortcut => ({
    key: 'k',
    ctrlKey: true,
    action,
    description: 'Open search (Ctrl+K)'
  }),
  
  escape: (action: () => void): KeyboardShortcut => ({
    key: 'Escape',
    action,
    description: 'Close modal/clear search (Esc)'
  }),
  
  refresh: (action: () => void): KeyboardShortcut => ({
    key: 'r',
    ctrlKey: true,
    action,
    description: 'Refresh data (Ctrl+R)'
  }),
  
  addToCart: (action: () => void): KeyboardShortcut => ({
    key: 'a',
    ctrlKey: true,
    action,
    description: 'Add selected item to cart (Ctrl+A)'
  }),
  
  viewCart: (action: () => void): KeyboardShortcut => ({
    key: 'c',
    ctrlKey: true,
    shiftKey: true,
    action,
    description: 'View cart (Ctrl+Shift+C)'
  }),
  
  help: (action: () => void): KeyboardShortcut => ({
    key: '?',
    shiftKey: true,
    action,
    description: 'Show keyboard shortcuts (Shift+?)'
  })
}