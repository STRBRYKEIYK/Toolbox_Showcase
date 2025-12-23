"use client"

import React from "react"
import { AlertTriangle, RefreshCw } from "lucide-react"
import { Button } from "./ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error | undefined
  errorInfo?: React.ErrorInfo | undefined
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{
    error?: Error | undefined
    resetError: () => void
  }>
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error details for debugging
    console.error("[ErrorBoundary] Error caught:", error)
    console.error("[ErrorBoundary] Error info:", errorInfo)
    
    // Update state with error info
    this.setState({
      error,
      errorInfo,
    })

    // Log to external service in production
    const isProduction = typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    if (isProduction) {
      // Replace with your error tracking service
      console.error("Production error:", {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
      })
    }
  }

  resetError = () => {
    this.setState({ 
      hasError: false, 
      error: undefined as Error | undefined, 
      errorInfo: undefined as React.ErrorInfo | undefined 
    })
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback
        return <FallbackComponent error={this.state.error as Error | undefined} resetError={this.resetError} />
      }

      // Default fallback UI - Minimalist Flat Illustration with Retro Vibes
      return (
        <div className="flex items-center justify-center min-h-screen industrial-gradient p-6">
          <Card className="max-w-lg w-full industrial-card metallic-texture shadow-xl border-0">
            <CardHeader className="text-center pb-6">
              <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="w-8 h-8 text-destructive" />
                </div>
              </div>
              <CardTitle className="text-2xl font-light text-foreground mb-2">
                Something went wrong
              </CardTitle>
              <p className="text-muted-foreground text-sm leading-relaxed">
                An unexpected error occurred. This might be a temporary issue.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {typeof window !== 'undefined' && window.location.hostname === 'localhost' && this.state.error && (
                <details className="bg-muted/30 rounded-lg p-4 border border-border/50">
                  <summary className="cursor-pointer text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-destructive"></div>
                    Error Details (Development)
                  </summary>
                  <div className="bg-card border border-border/30 p-3 rounded text-xs font-mono overflow-auto max-h-32 space-y-2">
                    <div className="text-destructive">
                      <strong>Error:</strong> {this.state.error.message}
                    </div>
                    <div className="text-muted-foreground">
                      <strong>Stack:</strong>
                      <pre className="whitespace-pre-wrap mt-1 text-xs leading-relaxed">
                        {this.state.error.stack}
                      </pre>
                    </div>
                  </div>
                </details>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={this.resetError}
                  className="flex-1 retro-button border-0 shadow-sm"
                  variant="outline"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                <Button
                  onClick={() => window.location.reload()}
                  className="flex-1 retro-button border-0 shadow-sm"
                >
                  Reload Page
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

// Hook version for functional components
export function useErrorHandler() {
  return (error: Error, errorInfo?: React.ErrorInfo) => {
    console.error("[useErrorHandler] Error:", error)
    if (errorInfo) {
      console.error("[useErrorHandler] Error info:", errorInfo)
    }
    
    // Could integrate with error reporting service here
    const isProduction = typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    if (isProduction) {
      console.error("Production error from hook:", {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      })
    }
  }
}

// Wrapper component for async operations
interface AsyncErrorBoundaryProps {
  children: React.ReactNode
  onError?: (error: Error) => void
}

export function AsyncErrorBoundary({ children, onError }: AsyncErrorBoundaryProps) {
  const handleError = useErrorHandler()

  React.useEffect(() => {
    // Handle unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error("[AsyncErrorBoundary] Unhandled promise rejection:", event.reason)
      handleError(new Error(event.reason))
      if (onError) {
        onError(new Error(event.reason))
      }
    }

    window.addEventListener('unhandledrejection', handleUnhandledRejection)
    
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [handleError, onError])

  return <ErrorBoundary>{children}</ErrorBoundary>
}