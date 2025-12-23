"use client"

import { useState } from "react"
import { AlertTriangle, RotateCcw } from "lucide-react"
import { Button } from "./ui/button"

interface DemoBannerProps {
  onReset?: () => void
}

export function DemoBanner({ onReset }: DemoBannerProps) {
  const [isResetting, setIsResetting] = useState(false)

  const handleReset = async () => {
    setIsResetting(true)
    try {
      apiService.resetDemoData()
      if (onReset) {
        onReset()
      }
      // Reload the page to reset all state
      window.location.reload()
    } catch (error) {
      console.error('Failed to reset demo data:', error)
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center text-orange-800">
          <AlertTriangle className="h-5 w-5 mr-2" />
          <span>
            <strong>Demo Mode:</strong> This is a demonstration version with sample data.
            All features are available without authentication.
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleReset}
          disabled={isResetting}
          className="border-orange-300 text-orange-700 hover:bg-orange-100"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          {isResetting ? 'Resetting...' : 'Reset Demo'}
        </Button>
      </div>
    </div>
  )
}