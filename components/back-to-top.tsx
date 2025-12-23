"use client"

import React, { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { ChevronUp } from 'lucide-react'

export function BackToTop() {
  const [isVisible, setIsVisible] = useState(false)

  // Show button when page is scrolled down
  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setIsVisible(true)
      } else {
        setIsVisible(false)
      }
    }

    window.addEventListener('scroll', toggleVisibility)
    return () => window.removeEventListener('scroll', toggleVisibility)
  }, [])

  // Scroll to top smoothly
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  if (!isVisible) {
    return null
  }

  return (
    <Button
      onClick={scrollToTop}
      className="fixed bottom-6 right-6 z-40 h-12 w-12 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-600 shadow-lg transition-all duration-300 hover:scale-110"
      size="sm"
      aria-label="Back to top"
    >
      <ChevronUp className="h-5 w-5 text-white" />
    </Button>
  )
}