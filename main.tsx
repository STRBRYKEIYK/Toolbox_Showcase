import React from "react"
import ReactDOM from "react-dom/client"
import App from "./app/page"
import { ThemeProvider } from "./components/theme-provider"
import { ErrorBoundary } from "./components/error-boundary"
import { LoadingProvider } from "./components/loading-context"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"
import "./app/globals.css"

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark" storageKey="toolbox-theme">
        <LoadingProvider>
          <TooltipPrimitive.Provider delayDuration={300} skipDelayDuration={500}>
            <App />
          </TooltipPrimitive.Provider>
        </LoadingProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)
