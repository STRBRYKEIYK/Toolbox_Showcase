"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import {
  X, Wifi, WifiOff, CreditCard, UserCheck,
  ShoppingCart, FileText, CheckCircle2, ChevronRight, ChevronLeft,
  Package, ArrowRight, AlertCircle, Check
} from "lucide-react"
import { Button } from "../components/ui/button"
import { Card, CardContent } from "../components/ui/card"
import { Input } from "../components/ui/input"
import { Badge } from "../components/ui/badge"
import { Textarea } from "../components/ui/textarea"
import type { CartItem } from "../app/page"
import { getDemoEmployees, addDemoTransaction, simulatePayment } from "../lib/mock-data"
import env from "../lib/env"

interface CheckoutModalProps {
  isOpen: boolean
  onClose: () => void
  items: CartItem[]
  onConfirmCheckout: (employee: any, purpose?: string) => void
  isCommitting?: boolean
}

type WizardStep = 1 | 2 | 3 | 4

const WIZARD_STEPS = env.DEMO_MODE ? [
  { step: 1, title: "Review Order", icon: ShoppingCart, description: "Verify your items" },
  { step: 2, title: "Purpose", icon: FileText, description: "Add checkout reason" },
  { step: 3, title: "Payment", icon: CreditCard, description: "Process payment" },
  { step: 4, title: "Confirm", icon: CheckCircle2, description: "Employee verification" },
] as const : [
  { step: 1, title: "Review Order", icon: ShoppingCart, description: "Verify your items" },
  { step: 2, title: "Purpose", icon: FileText, description: "Add checkout reason" },
  { step: 3, title: "Confirm", icon: CheckCircle2, description: "Employee verification" },
] as const

export function CheckoutModal({ isOpen, onClose, items, onConfirmCheckout, isCommitting = false }: CheckoutModalProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>(1)
  const [employees, setEmployees] = useState<any[]>([])
  const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null)
  const [userInput, setUserInput] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [purpose, setPurpose] = useState("")
  const [savingToInventory, setSavingToInventory] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'digital'>('card')
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)

  // Load employees when modal opens
  useEffect(() => {
    if (isOpen) {
      setEmployees(getDemoEmployees())
    }
  }, [isOpen])

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(1)
      setSelectedEmployee(null)
      setUserInput("")
      setError(null)
      setPurpose("")
      setSavingToInventory(false)
    }
  }, [isOpen])

  // Demo: Manual input just selects the first employee for simplicity
  const handleManualInput = (value: string) => {
    setUserInput(value)
    setError(null)
    if (value.trim().length === 0) {
      setSelectedEmployee(null)
      return
    }
    // For demo, just pick the first employee
    setSelectedEmployee(employees[0] || null)
  }

  // Mock save to inventory for demo
  const saveToEmployeeInventory = async (employee: any, checkoutItems: CartItem[], purpose?: string) => {
    setSavingToInventory(true)
    try {
      // Simulate saving and logging transaction
      checkoutItems.forEach(item => {
        addDemoTransaction({
          username: employee.name || employee.fullName,
          details: `Checked out ${item.name} x${item.quantity}`,
          purpose: purpose || 'Inventory checkout',
          id_number: employee.id,
          id_barcode: employee.id,
          item_no: item.id,
          log_date: new Date().toISOString().slice(0, 10),
          log_time: new Date().toLocaleTimeString('en-US', { hour12: false })
        })
      })
      return { success: true, message: 'Mock inventory updated' }
    } catch (error: any) {
      return { success: false, message: error.message, error }
    } finally {
      setSavingToInventory(false)
    }
  }

  const handleConfirm = async () => {
    if (!selectedEmployee) {
      setError("Please select an employee.")
      return
    }

    if (env.DEMO_MODE) {
      // Process payment in demo mode (mock)
      setIsProcessingPayment(true)
      try {
        const paymentResult = await simulatePayment(0, paymentMethod)
        if (!paymentResult.success) {
          setError(paymentResult.error || 'Payment failed')
          return
        }
        console.log('Payment successful:', paymentResult.transactionId)
      } catch (error) {
        setError('Payment processing failed')
        return
      } finally {
        setIsProcessingPayment(false)
      }
    }

    try {
      setSavingToInventory(true)
      const inventoryResult = await saveToEmployeeInventory(
        selectedEmployee,
        items,
        purpose.trim() || undefined
      )

      if (!inventoryResult.success) {
        console.warn("[CheckoutModal] Inventory tracking failed:", inventoryResult.message)
      }

      onConfirmCheckout(selectedEmployee, purpose.trim() || undefined)
      console.log("✅ Checkout completed successfully!")
    } catch (error) {
      console.error("[CheckoutModal] Checkout failed:", error)
      setError(`Checkout failed: ${(error as Error).message}`)
    } finally {
      setSavingToInventory(false)
    }
  }

  const goToNextStep = () => {
    if (currentStep < 4) {
      setCurrentStep((prev) => (prev + 1) as WizardStep)
    }
  }

  const goToPrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as WizardStep)
      setError(null)
    }
  }

  const goToStep = (step: WizardStep) => {
    // Can only go to completed steps or current step
    if (step <= currentStep) {
      setCurrentStep(step)
      setError(null)
    }
  }

  const canProceedToNext = () => {
    switch (currentStep) {
      case 1:
        return items.length > 0
      case 2:
        return true // Purpose is optional
      case 3:
        return env.DEMO_MODE ? true : !!selectedEmployee // Payment step always proceeds in demo
      case 4:
        return env.DEMO_MODE ? !!selectedEmployee : false // Employee verification in demo
      default:
        return false
    }
  }

  if (!isOpen) return null

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const totalValue = items.reduce((sum, item) => sum + item.quantity * 10, 0)
  const apiConfig = { isConnected: false }

  // Step Indicator Component - Clickable steps
  const StepIndicator = () => (
    <div className="px-8 py-6 border-b border-border">
      <div className="flex items-center justify-center">
        {WIZARD_STEPS.map((step, index) => {
          const Icon = step.icon
          const isActive = currentStep === step.step
          const isCompleted = currentStep > step.step
          const isClickable = step.step <= currentStep

          return (
            <div key={step.step} className="flex items-center">
              {/* Step Circle & Content */}
              <button
                type="button"
                onClick={() => isClickable && goToStep(step.step as WizardStep)}
                disabled={!isClickable || isCommitting}
                className={`
                  flex items-center gap-3 transition-all duration-200 px-4
                  ${isClickable && !isCommitting ? 'cursor-pointer' : 'cursor-default'}
                  ${isClickable && !isActive ? 'hover:opacity-80' : ''}
                `}
              >
                {/* Circle */}
                <div className={`
                  relative flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-200
                  ${isActive
                    ? 'border-secondary bg-secondary text-secondary-foreground'
                    : isCompleted
                      ? 'border-success bg-success text-success-foreground'
                      : 'border-border bg-muted text-muted-foreground'
                  }
                `}>
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </div>

                {/* Text */}
                <div className="hidden md:block text-left">
                  <p className={`text-sm font-medium leading-tight ${
                    isActive ? 'text-foreground' : isCompleted ? 'text-success' : 'text-muted-foreground'
                  }`}>
                    {step.title}
                  </p>
                  <p className="text-xs text-muted-foreground leading-tight">
                    {step.description}
                  </p>
                </div>
              </button>

              {/* Connector Line */}
              {index < WIZARD_STEPS.length - 1 && (
                <div className="mx-4 hidden sm:block">
                  <div className={`h-0.5 w-8 rounded-full transition-colors duration-200 ${
                    currentStep > step.step ? 'bg-success' : 'bg-border'
                  }`} />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )

  return createPortal(
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6">
      <Card className="w-full max-w-7xl industrial-card metallic-texture shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-border bg-muted/30">
          <div>
            <h2 className="text-2xl font-bold text-card-foreground">Checkout</h2>
            <p className="text-sm text-muted-foreground">Step {currentStep} of 4 — {WIZARD_STEPS[(currentStep - 1) as number]?.title ?? ''}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isCommitting}
            className="h-10 w-10 p-0 rounded-lg hover:bg-muted"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Step Indicator */}
        <StepIndicator />

        {/* Content */}
        <CardContent className="p-8 max-h-[75vh] overflow-y-auto">
          {/* Step 1: Review Order */}
          {currentStep === 1 && (
            <div className="space-y-5">
              {/* API Status Banner */}
              <div className={`flex items-center justify-between p-3 rounded-lg border ${
                apiConfig.isConnected
                  ? 'bg-success/10 border-success/30'
                  : 'bg-amber-500/10 border-amber-500/30'
              }`}>
                <div className="flex items-center gap-2">
                  {apiConfig.isConnected ? (
                    <Wifi className="w-4 h-4 text-success" />
                  ) : (
                    <WifiOff className="w-4 h-4 text-amber-500" />
                  )}
                  <span className={`text-sm font-medium ${
                    apiConfig.isConnected ? 'text-success' : 'text-amber-600 dark:text-amber-400'
                  }`}>
                    {apiConfig.isConnected ? 'Connected to Server' : 'Offline Mode'}
                  </span>
                </div>
                <Badge variant="outline" className={`text-xs ${
                  apiConfig.isConnected
                    ? 'border-success/50 text-success'
                    : 'border-amber-500/50 text-amber-600 dark:text-amber-400'
                }`}>
                  {apiConfig.isConnected ? 'Synced' : 'Local Only'}
                </Badge>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-foreground flex items-center gap-2 text-sm">
                    <Package className="w-4 h-4 text-secondary" />
                    Items in Cart
                  </h3>
                  <Badge variant="secondary" className="text-xs">
                    {items.length} {items.length === 1 ? 'item' : 'items'}
                  </Badge>
                </div>

                <div className="rounded-lg border border-border/50 divide-y divide-border/50 max-h-[35vh] overflow-y-auto">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 px-3 py-2 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center justify-center w-7 h-7 rounded-md bg-secondary/10 text-secondary font-semibold text-xs shrink-0">
                        {item.quantity}×
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-card-foreground text-sm truncate leading-tight">
                          {item.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate leading-tight">
                          {item.brand} • {item.itemType}
                          <span className="ml-2 text-[10px] opacity-70">
                            ({item.balance} → {Math.max(0, item.balance - item.quantity)})
                          </span>
                        </p>
                      </div>
                      <p className="text-sm font-medium text-foreground shrink-0">
                        ₱{(item.quantity * 10).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <Card className="border-secondary/30 bg-secondary/5">
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Quantity</span>
                      <span className="font-medium text-foreground">{totalItems} pcs</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Unique Products</span>
                      <span className="font-medium text-foreground">{items.length}</span>
                    </div>
                    <div className="h-px bg-border my-2" />
                    <div className="flex justify-between items-center">
                      <span className="text-base font-semibold text-foreground">Total Value</span>
                      <span className="text-xl font-bold text-secondary">₱{totalValue.toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 2: Purpose */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="text-center py-2">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-secondary/10 mb-4">
                  <FileText className="w-7 h-7 text-secondary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  What's this checkout for?
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Help us understand why these items are needed (optional)
                </p>
              </div>

              <div className="space-y-3">
                <Textarea
                  placeholder="e.g., Equipment maintenance, Project materials, Emergency repair..."
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="min-h-[100px] resize-none bg-input border-border focus:border-secondary focus:ring-secondary/20"
                  maxLength={255}
                  disabled={isCommitting}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>This helps with inventory tracking and reporting</span>
                  <span>{purpose.length}/255</span>
                </div>
              </div>

              {/* Quick Suggestions */}
              <div className="space-y-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Quick Select
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Maintenance Work",
                    "Project Requirement",
                    "Equipment Repair",
                    "Stock Replenishment",
                    "Emergency Use",
                    "Customer Request"
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => setPurpose(suggestion)}
                      className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${
                        purpose === suggestion
                          ? 'bg-secondary text-secondary-foreground border-secondary'
                          : 'bg-card border-border text-muted-foreground hover:border-secondary hover:text-secondary'
                      }`}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Payment (Demo) */}
          {currentStep === 3 && (
            <div className="space-y-5">
              {/* Payment Processing */}
              <div className="space-y-4">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-secondary/10 mb-3">
                    <CreditCard className="w-6 h-6 text-secondary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">
                    Payment Processing
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Select payment method and process transaction
                  </p>
                </div>

                {/* Payment Method Selection */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-foreground">Payment Method</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: 'card', label: 'Credit Card', icon: CreditCard },
                      { value: 'cash', label: 'Cash', icon: Package },
                      { value: 'digital', label: 'Digital Wallet', icon: Wifi }
                    ].map((method) => (
                      <button
                        key={method.value}
                        type="button"
                        onClick={() => setPaymentMethod(method.value as any)}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          paymentMethod === method.value
                            ? 'border-secondary bg-secondary/5 text-secondary'
                            : 'border-border bg-card text-muted-foreground hover:border-secondary/50'
                        }`}
                      >
                        <method.icon className="w-6 h-6 mx-auto mb-2" />
                        <div className="text-sm font-medium">{method.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Order Summary */}
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Total Items:</span>
                    <span className="font-medium">{items.reduce((sum, item) => sum + item.quantity, 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Payment Method:</span>
                    <span className="font-medium capitalize">{paymentMethod}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between text-lg font-semibold">
                    <span>Total Amount:</span>
                    <span>$0.00 (Demo)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Employee Verification (Demo) */}
          {currentStep === 4 && (
            <div className="space-y-5">
              {/* Employee Identification */}
              <div className="space-y-4">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-secondary/10 mb-3">
                    <UserCheck className="w-6 h-6 text-secondary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">
                    Employee Verification
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Enter employee ID number
                  </p>
                </div>

                {/* Input Field */}
                <div className="space-y-2">
                  <div className="relative">
                    <Input
                      placeholder="Enter employee ID number..."
                      value={userInput}
                      onChange={(e) => handleManualInput(e.target.value)}
                      className="h-12 text-center text-lg font-mono bg-input border-border focus:border-secondary"
                      disabled={isCommitting}
                      autoComplete="off"
                    />
                  </div>
                </div>

                {/* Error Display */}
                {error && (
                  <Card className="border-destructive/30 bg-destructive/10">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 mt-0.5 shrink-0 text-destructive" />
                        <div>
                          <p className="text-sm font-medium text-destructive">
                            Verification Failed
                          </p>
                          <p className="text-xs mt-1 text-destructive/80">
                            {error}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Selected Employee */}
                {selectedEmployee && (
                  <Card className="bg-success/10 border-success/30">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-success text-success-foreground font-bold text-lg overflow-hidden shrink-0">
                          {selectedEmployee.name ? selectedEmployee.name[0] : 'E'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-success truncate">
                            {selectedEmployee.name}
                          </p>
                          <p className="text-sm text-success/80 truncate">
                            {selectedEmployee.department}
                          </p>
                          <p className="text-xs text-success/70 mt-1">
                            ID: {selectedEmployee.id}
                          </p>
                        </div>
                        <CheckCircle2 className="w-6 h-6 text-success shrink-0" />
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Order Summary Mini */}
              <Card className="border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between text-sm mb-3">
                    <span className="font-medium text-foreground">Order Summary</span>
                    <Badge variant="outline" className="text-xs">{items.length} items</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Total Value</span>
                    <span className="text-lg font-bold text-secondary">₱{totalValue.toFixed(2)}</span>
                  </div>
                  {purpose && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <p className="text-xs text-muted-foreground">Purpose:</p>
                      <p className="text-sm text-foreground mt-0.5">{purpose}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between gap-4 px-8 py-6 border-t border-border bg-muted/30">
          <Button
            variant="outline"
            onClick={currentStep === 1 ? onClose : goToPrevStep}
            disabled={isCommitting}
            className="min-w-[120px] h-12"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            {currentStep === 1 ? 'Cancel' : 'Back'}
          </Button>

          <div className="flex items-center gap-1">
            {(env.DEMO_MODE ? [1, 2, 3, 4] : [1, 2, 3]).map((step) => (
              <div
                key={step}
                className={`w-2 h-2 rounded-full transition-colors ${
                  step === currentStep ? 'bg-secondary' : step < currentStep ? 'bg-success' : 'bg-muted-foreground/30'
                }`}
              />
            ))}
          </div>

          {currentStep < (env.DEMO_MODE ? 4 : 3) ? (
            <Button
              onClick={goToNextStep}
              disabled={!canProceedToNext()}
              className="min-w-[120px] h-12 bg-secondary hover:bg-secondary/90 text-secondary-foreground"
            >
              Continue
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleConfirm}
              disabled={!selectedEmployee || isCommitting || savingToInventory || isProcessingPayment}
              className="min-w-40 h-12 bg-success hover:bg-success/90 text-success-foreground"
            >
              {(isProcessingPayment || isCommitting || savingToInventory) ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  {isProcessingPayment ? 'Processing Payment...' : 'Processing...'}
                </>
              ) : (
                <>
                  Confirm Checkout
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          )}
        </div>
      </Card>
    </div>,
    document.body
  )
}