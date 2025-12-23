"use client"

import { useState, useEffect } from "react"
import { Lightbulb, X, ChevronLeft, ChevronRight, Sparkles } from "lucide-react"
import { Button } from "./ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog"
import { Badge } from "./ui/badge"

interface Tip {
  id: string
  title: string
  content: string
  category: 'basic' | 'advanced' | 'productivity' | 'troubleshooting'
  icon?: string
}

const tipsAndTricks: Tip[] = [
  {
    id: 'barcode-scanning',
    title: 'Barcode Scanning',
    content: 'Use your keyboard or barcode scanner to quickly add items to cart. The system automatically detects barcode input and searches for matching products.',
    category: 'basic'
  },
  {
    id: 'bulk-operations',
    title: 'Bulk Operations',
    content: 'Select multiple items using the checkboxes, then use bulk actions to add all selected items to cart at once or export them.',
    category: 'productivity'
  },
  {
    id: 'offline-mode',
    title: 'Offline Mode',
    content: 'The toolbox works offline! Your cart and recent data are automatically saved locally and synced when connection is restored.',
    category: 'advanced'
  },
  {
    id: 'search-shortcuts',
    title: 'Search Shortcuts',
    content: 'Press "/" to quickly focus the search bar. Use smart suggestions to find items by name, brand, or category.',
    category: 'productivity'
  },
  {
    id: 'cart-persistence',
    title: 'Cart Recovery',
    content: 'Never lose your cart! The system automatically saves your cart state and offers recovery options if something goes wrong.',
    category: 'basic'
  },
  {
    id: 'employee-logs',
    title: 'Activity Logs',
    content: 'View detailed employee activity logs with filtering options. Use "has details" filter to find transactions with additional information.',
    category: 'advanced'
  },
  {
    id: 'theme-toggle',
    title: 'Theme Switching',
    content: 'Switch between light and dark themes using the theme toggle button. Your preference is automatically saved.',
    category: 'basic'
  },
  {
    id: 'keyboard-navigation',
    title: 'Keyboard Navigation',
    content: 'Use keyboard shortcuts: "/" for search, "Escape" to clear focus, and "Ctrl+K" for quick actions menu.',
    category: 'productivity'
  }
]

interface TipsAndTricksProps {
  className?: string
  variant?: 'floating' | 'inline' | 'banner'
}

export function TipsAndTricks({ className = "", variant = 'floating' }: TipsAndTricksProps) {
  const [currentTipIndex, setCurrentTipIndex] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [viewedTips, setViewedTips] = useState<Set<string>>(new Set())
  const [isPaused, setIsPaused] = useState(false)
  const [progress, setProgress] = useState(0)

  // Auto-rotate tips for both variants when not paused
  useEffect(() => {
    if ((variant === 'inline' && !isPaused) || (variant === 'banner' && !isPaused) || (variant === 'floating' && isOpen && !isPaused)) {
      const interval = setInterval(() => {
        setCurrentTipIndex(prev => (prev + 1) % tipsAndTricks.length)
      }, variant === 'inline' ? 8000 : variant === 'banner' ? 6000 : 10000) // Inline: 8s, Banner: 6s, Floating: 10s

      return () => clearInterval(interval)
    }
    return () => {} // Return empty cleanup function when not rotating
  }, [variant, isOpen, isPaused])

  // Progress bar animation
  useEffect(() => {
    if ((variant === 'inline' && !isPaused) || (variant === 'banner' && !isPaused) || (variant === 'floating' && isOpen && !isPaused)) {
      const duration = variant === 'inline' ? 8000 : variant === 'banner' ? 6000 : 10000
      const interval = 100 // Update every 100ms
      const steps = duration / interval
      let currentStep = 0

      const progressInterval = setInterval(() => {
        currentStep++
        setProgress((currentStep / steps) * 100)
        
        if (currentStep >= steps) {
          currentStep = 0
          setProgress(0)
        }
      }, interval)

      return () => clearInterval(progressInterval)
    } else {
      setProgress(0)
    }
    return () => {}
  }, [variant, isOpen, isPaused, currentTipIndex])

  // Save viewed tips to localStorage
  const markTipAsViewed = (tipId: string) => {
    const newViewedTips = new Set(viewedTips)
    newViewedTips.add(tipId)
    setViewedTips(newViewedTips)
    localStorage.setItem('toolbox-viewed-tips', JSON.stringify([...newViewedTips]))
  }

  const currentTip = tipsAndTricks[currentTipIndex]
  const isLastTip = currentTipIndex === tipsAndTricks.length - 1
  const isFirstTip = currentTipIndex === 0

  const nextTip = () => {
    if (!isLastTip) {
      setCurrentTipIndex(prev => prev + 1)
      setProgress(0)
    }
  }

  const prevTip = () => {
    if (!isFirstTip) {
      setCurrentTipIndex(prev => prev - 1)
      setProgress(0)
    }
  }

  const getCategoryColor = (category: Tip['category']) => {
    switch (category) {
      case 'basic': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'advanced': return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
      case 'productivity': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'troubleshooting': return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30'
    }
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (open && currentTip) {
      markTipAsViewed(currentTip.id)
    }
  }

  if (variant === 'floating') {
    return (
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={`h-8 px-2 text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all ${className}`}
          >
            <Lightbulb className="w-4 h-4" />
            <span className="hidden sm:inline ml-1.5 text-xs">Tips</span>
          </Button>
        </DialogTrigger>
        <DialogContent 
          className="sm:max-w-md bg-slate-800 border-slate-700"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <Sparkles className="w-5 h-5 text-yellow-400" />
              Tips & Tricks
              <Badge variant="secondary" className="ml-auto text-xs">
                {currentTipIndex + 1} of {tipsAndTricks.length}
              </Badge>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {currentTip && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge className={`text-xs px-2 py-0.5 border ${getCategoryColor(currentTip.category)}`}>
                    {currentTip.category}
                  </Badge>
                  {/* Auto-advance indicator */}
                  <div className="flex-1 ml-2">
                    <div className="w-full bg-slate-700 rounded-full h-1">
                      <div 
                        className="bg-blue-500 h-1 rounded-full transition-all duration-100 ease-linear"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-white">{currentTip.title}</h3>
                <p className="text-slate-300 leading-relaxed">{currentTip.content}</p>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-slate-700">
              <Button
                variant="ghost"
                size="sm"
                onClick={prevTip}
                disabled={isFirstTip}
                className="text-slate-400 hover:text-white disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>

              <div className="flex gap-1">
                {tipsAndTricks.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentTipIndex ? 'bg-blue-500' : 'bg-slate-600'
                    }`}
                  />
                ))}
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={nextTip}
                disabled={isLastTip}
                className="text-slate-400 hover:text-white disabled:opacity-50"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // Banner variant for header - compact auto-advancing tip display
  if (variant === 'banner') {
    return (
      <div 
        className={`flex items-center gap-3 text-sm ${className}`}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></div>
        {currentTip && (
          <span className="text-slate-300">
            <strong className="text-white">Pro Tip:</strong> {currentTip.content}
          </span>
        )}
      </div>
    )
  }

  // Inline variant for start page - compact single tip display
  return (
    <div 
      className={`space-y-3 ${className}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-yellow-400" />
          <h3 className="text-sm font-medium text-white">Quick Tip</h3>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              prevTip()
              if (currentTip) markTipAsViewed(currentTip.id)
            }}
            disabled={isFirstTip}
            className="h-6 w-6 p-0 text-slate-400 hover:text-white hover:bg-slate-700/50 disabled:opacity-50"
          >
            <ChevronLeft className="w-3 h-3" />
          </Button>
          <span className="text-xs text-slate-500">
            {currentTipIndex + 1} of {tipsAndTricks.length}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              nextTip()
              if (currentTip) markTipAsViewed(currentTip.id)
            }}
            disabled={isLastTip}
            className="h-6 w-6 p-0 text-slate-400 hover:text-white hover:bg-slate-700/50 disabled:opacity-50"
          >
            <ChevronRight className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {currentTip && (
        <div className="p-3 rounded-lg bg-slate-700/30 border border-slate-600/20">
          <div className="flex items-start gap-3">
            <div className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 ${getCategoryColor(currentTip.category).split(' ')[0]}`}>
              <Lightbulb className="w-3 h-3 text-current" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-medium text-white text-sm">{currentTip.title}</h4>
                {/* Progress bar for inline variant */}
                <div className="w-16 ml-2">
                  <div className="w-full bg-slate-600 rounded-full h-0.5">
                    <div 
                      className="bg-blue-400 h-0.5 rounded-full transition-all duration-100 ease-linear"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">{currentTip.content}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Hook to get random tip for notifications
export function useRandomTip() {
  const getRandomTip = () => {
    const randomIndex = Math.floor(Math.random() * tipsAndTricks.length)
    return tipsAndTricks[randomIndex]
  }

  return { getRandomTip, tipsAndTricks }
}