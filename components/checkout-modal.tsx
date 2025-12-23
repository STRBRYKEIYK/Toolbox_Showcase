"use client"

import { useState, useEffect, useCallback } from "react"
import { 
  X, Wifi, WifiOff, Scan, CreditCard, UserCheck, 
  ShoppingCart, FileText, CheckCircle2, ChevronRight, ChevronLeft,
  Package, ArrowRight, AlertCircle, Check
} from "lucide-react"
import { Button } from "../components/ui/button"
import { Card, CardContent } from "../components/ui/card"
import { Input } from "../components/ui/input"
import { Badge } from "../components/ui/badge"
import { Textarea } from "../components/ui/textarea"
// import { apiService } from "../lib/api_service"
// import * as mainapiService from "../../src/utils/api/api-service"
import { getDemoEmployees, addDemoTransaction, simulatePayment } from "../lib/mock-data"
import type { CartItem } from "../app/page"
import type { Employee } from "../lib/Services/employees.service"
// import Swal from 'sweetalert2' // Not needed in demo mode
import env from "../lib/env"

interface ValidationDetailNotAssigned {
  item_no: any;
  item_name: string;
  checkout_qty: number;
  required_qty: number;
  status: 'not_assigned';
  message: string;
  debug_info: any;
}
  // Barcode scanner input is not used in demo mode
  useEffect(() => {
    if (!isOpen || inputMethod !== 'barcode' || currentStep !== 3) return
    // Barcode scanning logic is omitted in demo mode
  }, [isOpen, inputMethod, employees, currentStep])
interface ExpectedConsumable {
  item_no: any;
  item_name: string;
  total_required: number;
  unit: string;
  assignments: any[];
}

interface CheckoutModalProps {
  isOpen: boolean
  onClose: () => void
  items: CartItem[]
  onConfirmCheckout: (employee: Employee, purpose?: string) => void
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
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [inputMethod, setInputMethod] = useState<'barcode' | 'manual'>('barcode')
  const [userInput, setUserInput] = useState("")
  const [isScanning, setIsScanning] = useState(false)
  // const [loadingEmployees, setLoadingEmployees] = useState(false) // Not used in demo mode
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

  // Notify GlobalBarcodeListener about checkout modal state
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('checkout-modal-state', { 
      detail: { isOpen } 
    }))
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

  // Listen for barcode scanner input (only on step 3)
  useEffect(() => {
    if (!isOpen || inputMethod !== 'barcode' || currentStep !== 3) return

    let barcodeBuffer = ""
    let lastKeyTime = Date.now()

    const handleKeyDown = (event: KeyboardEvent) => {
      const currentTime = Date.now()

      if (currentTime - lastKeyTime > 100) {
        barcodeBuffer = ""
      }
      return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <Card className="w-full max-w-7xl industrial-card metallic-texture shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-border bg-muted/30">
              <div>
                <h2 className="text-2xl font-bold text-card-foreground">Checkout</h2>
                <p className="text-sm text-muted-foreground">Step {currentStep} of 3 — {WIZARD_STEPS[(currentStep - 1) as number]?.title ?? ''}</p>
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
              {/* ...existing content for steps... */}
            </CardContent>
            {/* Footer Navigation */}
            <div className="flex items-center justify-between gap-4 px-8 py-6 border-t border-border bg-muted/30">
              <Button
                variant="outline"
                onClick={Number(currentStep) === 1 ? onClose : goToPrevStep}
                disabled={isCommitting}
                className="min-w-[120px] h-12"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                {Number(currentStep) === 1 ? 'Cancel' : 'Back'}
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
        </div>
      )
      setSelectedEmployee(null)
      console.warn("[CheckoutModal] No employee found for barcode:", barcode)
    }

    setIsScanning(false)
  }

  const handleManualInput = (value: string) => {
    setUserInput(value)
    setError(null)

    if (value.trim().length === 0) {
      setSelectedEmployee(null)
      return
    }

    // Only search when we have enough characters (at least 3)
    if (value.trim().length < 3) {
      setSelectedEmployee(null)
      return
    }

    // Debug: Log what we're searching for and available employees
    console.log("[CheckoutModal] Searching for ID:", value.trim())

    // Find employee by idNumber (try exact match first, then partial match)
    let employee = employees.find(emp => emp.idNumber === value.trim())

    // If no exact match, try case-insensitive match
    if (!employee) {
      employee = employees.find(emp =>
        emp.idNumber?.toLowerCase() === value.trim().toLowerCase()
      )
    }

    // Also try matching by idBarcode in case user entered barcode in manual mode
    if (!employee) {
      employee = employees.find(emp => emp.idBarcode === value.trim())
    }

    if (employee) {
      console.log("[CheckoutModal] Found employee:", employee.fullName, "Status:", employee.status)
      // Check if employee is disabled/inactive
      if (employee.status !== 'Active') {
        setError(`⚠️ Employee ID is DISABLED: ${employee.firstName} ${employee.lastName}'s ID has been deactivated. Please report to HR Department to resolve this issue.`)
        setSelectedEmployee(null)
        console.warn("[CheckoutModal] Employee found but DISABLED:", employee.firstName, employee.lastName, "Status:", employee.status)
        return
      }

      setSelectedEmployee(employee)
      setError(null)
      console.log("[CheckoutModal] Employee found by ID:", employee.firstName, employee.lastName)
    } else {
      setSelectedEmployee(null)
      // Show error when ID is long enough but not found
      if (value.trim().length >= 5) {
        setError(`No employee found with ID number: ${value.trim()}. Please check the ID and try again.`)
        console.warn("[CheckoutModal] No employee found for ID:", value.trim())
      }
    }
  }

  /**
   * Save checkout items to employee inventory
   */
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
      setError("Please scan a barcode or enter a valid employee ID.")
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
      console.log("[CheckoutModal] Starting validation for:", selectedEmployee.fullName)

      // ============================================================================
      // STEP 1: Get employee's total expected consumables from ALL assignments
      // ============================================================================
      console.log('📋 Step 1: Fetching employee assignments...')

      // Mock expected consumables for demo
      const totalExpectedConsumables = {} as Record<string, ExpectedConsumable>
      // console.log('📊 Total expected consumables:', totalExpectedConsumables)

      // ============================================================================
      // STEP 2: Validate each checkout item against expected consumables
      // ============================================================================
      console.log('📊 Step 2: Validating checkout items...')

      const validation: { isValid: boolean; errors: string[]; warnings: string[]; details: ValidationDetail[] } = { isValid: true, errors: [], warnings: [], details: [] }

      items.forEach(checkoutItem => {
        // ✅ FIXED: Normalize values for comparison (handles numbers, strings, null)
        const normalizeString = (value: any): string => {
          if (value === null || value === undefined) return ''
          return String(value).toLowerCase().trim()
        }

        const normalizeNumber = (value: any): number | null => {
          if (value === null || value === undefined) return null
          const num = typeof value === 'number' ? value : parseInt(value)
          return isNaN(num) ? null : num
        }

        const checkoutItemName = normalizeString(checkoutItem.name)
        const checkoutItemIdStr = normalizeString(checkoutItem.id)
        const checkoutItemIdNum = normalizeNumber(checkoutItem.id)

        console.log(`\n🔍 Checking checkout item:`)
        console.log(`   Name: "${checkoutItem.name}"`)
        console.log(`   ID: ${checkoutItem.id} (type: ${typeof checkoutItem.id})`)
        console.log(`   Normalized name: "${checkoutItemName}"`)
        console.log(`   Normalized ID (str): "${checkoutItemIdStr}"`)
        console.log(`   Normalized ID (num): ${checkoutItemIdNum}`)

        // ✅ FIXED: Check if this material exists in expected consumables
        let expectedConsumable = null
        let matchType = null

        // Try matching against all expected consumables
        for (const key in totalExpectedConsumables) {
          const expected = totalExpectedConsumables[key]
          if (!expected) continue

          // Normalize expected values
          const expectedItemNoStr = normalizeString(expected.item_no)
          const expectedItemNoNum = normalizeNumber(expected.item_no)
          const expectedItemName = normalizeString(expected.item_name)

          console.log(`\n   📋 Comparing with expected consumable:`)
          console.log(`      Name: "${expected.item_name}"`)
          console.log(`      item_no: ${expected.item_no} (type: ${typeof expected.item_no})`)

          // ✅ STRATEGY 1: Match by item_no (number comparison)
          if (checkoutItemIdNum !== null && expectedItemNoNum !== null) {
            if (checkoutItemIdNum === expectedItemNoNum) {
              expectedConsumable = expected
              matchType = 'item_no (number)'
              console.log(`      ✅ MATCH by item_no number: ${checkoutItemIdNum} === ${expectedItemNoNum}`)
              break
            }
          }

          // ✅ STRATEGY 2: Match by item_no (string comparison)
          if (checkoutItemIdStr && expectedItemNoStr) {
            if (checkoutItemIdStr === expectedItemNoStr) {
              expectedConsumable = expected
              matchType = 'item_no (string)'
              console.log(`      ✅ MATCH by item_no string: "${checkoutItemIdStr}" === "${expectedItemNoStr}"`)
              break
            }
          }

          // ✅ STRATEGY 3: Match by item_name (case-insensitive, trimmed)
          if (checkoutItemName && expectedItemName) {
            if (checkoutItemName === expectedItemName) {
              expectedConsumable = expected
              matchType = 'item_name'
              console.log(`      ✅ MATCH by item_name: "${checkoutItemName}" === "${expectedItemName}"`)
              break
            }
          }

          console.log(`      ❌ No match`)
        }

        if (!expectedConsumable) {
          // Item not in expected consumables - reject checkout
          validation.isValid = false
          validation.errors.push(
            `❌ ${checkoutItem.name}: Not assigned to any casting for this employee`
          )
          validation.details.push({
            item_no: checkoutItem.id,
            item_name: checkoutItem.name,
            checkout_qty: checkoutItem.quantity,
            required_qty: 0,
            status: 'not_assigned',
            message: 'Item not assigned in any subphase',
            debug_info: {
              checkout_id: checkoutItem.id,
              checkout_id_type: typeof checkoutItem.id,
              checkout_name: checkoutItem.name,
              expected_consumables_keys: Object.keys(totalExpectedConsumables),
              all_expected_item_nos: Object.values(totalExpectedConsumables).map(e => ({
                item_no: e.item_no,
                item_no_type: typeof e.item_no,
                item_name: e.item_name
              }))
            }
          })

          console.log(`   ❌ NOT FOUND in expected consumables`)
          console.log(`   Available expected consumables:`, Object.values(totalExpectedConsumables).map(e => ({
            item_no: e.item_no,
            item_name: e.item_name
          })))
          return
        }

        // ✅ Item exists in expected consumables
        console.log(`   ✅ MATCHED via ${matchType}`)
        console.log(`   Required: ${expectedConsumable.total_required} ${expectedConsumable.unit}`)
        console.log(`   Checkout: ${checkoutItem.quantity} ${expectedConsumable.unit}`)

        // Check if checkout quantity matches or is within required
        if (checkoutItem.quantity > expectedConsumable.total_required) {
          validation.isValid = false
          const excess = checkoutItem.quantity - expectedConsumable.total_required
          validation.errors.push(
            `❌ ${checkoutItem.name}: Checkout quantity (${checkoutItem.quantity}) exceeds required (${expectedConsumable.total_required}) by ${excess.toFixed(2)} ${expectedConsumable.unit}`
          )
          validation.details.push({
            item_no: expectedConsumable.item_no,
            item_name: expectedConsumable.item_name,
            unit: expectedConsumable.unit,
            checkout_qty: checkoutItem.quantity,
            required_qty: expectedConsumable.total_required,
            excess: excess,
            status: 'exceeds',
            assignments: expectedConsumable.assignments
          })
        } else if (checkoutItem.quantity < expectedConsumable.total_required) {
          // Still short
          const shortfall = expectedConsumable.total_required - checkoutItem.quantity
          validation.warnings.push(
            `⚠️ ${checkoutItem.name}: Checkout quantity (${checkoutItem.quantity}) is less than required (${expectedConsumable.total_required}) by ${shortfall.toFixed(2)} ${expectedConsumable.unit}`
          )
          validation.details.push({
            item_no: expectedConsumable.item_no,
            item_name: expectedConsumable.item_name,
            unit: expectedConsumable.unit,
            checkout_qty: checkoutItem.quantity,
            required_qty: expectedConsumable.total_required,
            shortfall: shortfall,
            status: 'insufficient',
            assignments: expectedConsumable.assignments
          })
        } else {
          // Exact match ✅
          validation.details.push({
            item_no: expectedConsumable.item_no,
            item_name: expectedConsumable.item_name,
            unit: expectedConsumable.unit,
            checkout_qty: checkoutItem.quantity,
            required_qty: expectedConsumable.total_required,
            status: 'exact_match',
            assignments: expectedConsumable.assignments
          })
        }
      })

      console.log('📊 Validation results:', validation)

      // ============================================================================
      // STEP 3: Handle validation errors with SweetAlert2
      // ============================================================================
      if (!validation.isValid) {
        // Build error details HTML
        const errorDetailsHtml = validation.details
          .filter(detail => detail.status === 'not_assigned' || detail.status === 'exceeds')
          .map(detail => {
            if (detail.status === 'not_assigned') {
              return `
                <div style="background: #fee; border: 2px solid #fcc; border-radius: 8px; padding: 16px; margin-bottom: 16px; text-align: left;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                    <h5 style="margin: 0; color: #c00; font-weight: 600;">${detail.item_name}</h5>
                    <span style="background: #c00; color: white; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: bold;">NOT ASSIGNED</span>
                  </div>
                  <p style="margin: 8px 0; font-size: 14px;">⚠️ <strong>This consumable material is not assigned to any assigned work for this employee.</strong></p>
                  <ol style="font-size: 12px; color: #666; margin: 8px 0; padding-left: 20px;">
                    <li style="margin-bottom: 8px;">▶︎ Ask the Operations Department to verify if this person is allowed to check out consumable materials.</li>
                    <li style="margin-bottom: 8px;">▶︎ Only employees with assigned tasks are allowed to checkout items.</li>
                    <li>▶︎ If there are no available options, contact the authorized personnel assistant or the IT Department regarding the issue.</li>
                  </ol>
                </div>
              `
            } else {
              // exceeds status
              const assignmentsHtml = detail.assignments && detail.assignments.length > 0 ? `
                <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #fcc;">
                  <p style="font-size: 12px; font-weight: 600; margin-bottom: 8px;">Required in ${detail.assignments.length} assigned work(s):</p>
                  ${detail.assignments.map(assignment => `
                    <div style="font-size: 11px; color: #666; margin-left: 12px;">
                      • ${assignment.item_name} → ${assignment.phase_name} → ${assignment.subphase_name}
                      <span style="font-weight: 600; margin-left: 4px;">(${assignment.quantity} ${detail.unit})</span>
                    </div>
                  `).join('')}
                </div>
              ` : ''

              return `
                <div style="background: #fee; border: 2px solid #fcc; border-radius: 8px; padding: 16px; margin-bottom: 16px; text-align: left;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                    <h5 style="margin: 0; color: #c00; font-weight: 600;">${detail.item_name}</h5>
                    <span style="background: #c00; color: white; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: bold;">EXCEEDS REQUIRED</span>
                  </div>
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px; font-size: 14px;">
                    <div>
                      <span style="color: #666;">Required Total:</span>
                      <span style="font-weight: 600; margin-left: 8px;">${detail.required_qty} ${detail.unit}</span>
                    </div>
                    <div>
                      <span style="color: #666;">Checkout Amount:</span>
                      <span style="font-weight: 600; color: #c00; margin-left: 8px;">${detail.checkout_qty} ${detail.unit}</span>
                    </div>
                    <div style="grid-column: span 2;">
                      <span style="color: #666;">Excess:</span>
                      <span style="font-weight: 600; color: #c00; margin-left: 8px;">+${detail.excess.toFixed(2)} ${detail.unit}</span>
                    </div>
                  </div>
                  ${assignmentsHtml}
                </div>
              `
            }
          }).join('')

        const result = await Swal.fire({
          icon: 'error',
          title: '❌ VALIDATION FAILED',
          html: `
            <div style="text-align: left; font-family: 'Geist Sans', system-ui, sans-serif;">
              <p style="color: #64748b; margin-bottom: 20px; font-size: 15px; line-height: 1.5;">Cannot proceed with checkout due to validation errors</p>

              <!-- Employee Info -->
              <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 20px; position: relative; overflow: hidden;">
                <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(45deg, rgba(255,255,255,0.1) 0%, transparent 50%, rgba(0,0,0,0.02) 100%); pointer-events: none;"></div>
                <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 12px; position: relative; z-index: 1;">
                  <div style="width: 48px; height: 48px; border-radius: 12px; background: linear-gradient(135deg, #ed8936 0%, #dd6b20 100%); display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(237, 137, 54, 0.3);">
                    <svg style="width: 24px; height: 24px; color: white;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                    </svg>
                  </div>
                  <div>
                    <span style="font-weight: 600; font-size: 18px; color: #1e293b; display: block; line-height: 1.2;">${selectedEmployee.fullName}</span>
                    <span style="font-size: 13px; color: #64748b; font-weight: 500;">Employee Verification</span>
                  </div>
                </div>
                <div style="position: relative; z-index: 1;">
                  <p style="font-size: 13px; color: #64748b; margin: 0; line-height: 1.4;">
                    <span style="font-weight: 600; color: #475569;">ID:</span> ${selectedEmployee.idNumber} •
                    <span style="font-weight: 600; color: #475569; margin-left: 8px;">Barcode:</span> ${selectedEmployee.idBarcode}
                  </p>
                </div>
              </div>

              <!-- Error Summary -->
              <div style="margin-bottom: 20px;">
                <h4 style="color: #dc2626; font-weight: 600; margin-bottom: 16px; font-size: 16px; display: flex; align-items: center; gap: 8px;">
                  <div style="width: 20px; height: 20px; border-radius: 6px; background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); display: flex; align-items: center; justify-content: center;">
                    <span style="color: white; font-size: 12px; font-weight: bold;">!</span>
                  </div>
                  Validation Errors (${validation.errors.length})
                </h4>
                <div style="background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); border: 1px solid #fecaca; border-radius: 12px; padding: 16px; position: relative; overflow: hidden;">
                  <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(45deg, rgba(255,255,255,0.1) 0%, transparent 50%, rgba(220,38,38,0.02) 100%); pointer-events: none;"></div>
                  <div style="position: relative; z-index: 1;">
                    ${validation.errors.map((error, idx) => `
                      <div style="display: flex; gap: 12px; margin-bottom: 12px; font-size: 14px; align-items: flex-start;">
                        <span style="color: #dc2626; font-weight: 700; background: rgba(220,38,38,0.1); border-radius: 6px; padding: 2px 8px; font-size: 12px; flex-shrink: 0; margin-top: 1px;">${idx + 1}</span>
                        <span style="color: #1e293b; line-height: 1.4;">${error}</span>
                      </div>
                    `).join('')}
                  </div>
                </div>
              </div>

              <!-- Detailed Breakdown -->
              <div>
                <h4 style="font-weight: 600; margin-bottom: 16px; font-size: 16px; color: #1e293b; display: flex; align-items: center; gap: 8px;">
                  <div style="width: 20px; height: 20px; border-radius: 6px; background: linear-gradient(135deg, #4a5568 0%, #374151 100%); display: flex; align-items: center; justify-content: center;">
                    <span style="color: white; font-size: 12px; font-weight: bold;">📊</span>
                  </div>
                  Detailed Breakdown
                </h4>
                ${errorDetailsHtml}
              </div>
            </div>
          `,
          width: '900px',
          showCancelButton: true,
          confirmButtonText: 'Close',
          cancelButtonText: 'Continue Anyway',
          confirmButtonColor: '#64748b',
          cancelButtonColor: '#f59e0b',
          customClass: {
            popup: 'swal-wide industrial-card metallic-texture',
            htmlContainer: 'swal-html-container',
            confirmButton: 'retro-button',
            cancelButton: 'retro-button'
          },
          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #e2e8f0 100%)',
          backdrop: 'rgba(15, 23, 42, 0.8)'
        })

        if (result.isConfirmed) {
          // User clicked Close
          setSavingToInventory(false)
          return
        }
        // User clicked Continue Anyway, proceed with checkout despite errors
      }

      // ============================================================================
      // STEP 4: Show warnings if any with SweetAlert2
      // ============================================================================
      if (validation.warnings.length > 0) {
        const result = await Swal.fire({
          icon: 'warning',
          title: '⚠️ CHECKOUT WARNING',
          html: `
            <div style="text-align: left; font-family: 'Geist Sans', system-ui, sans-serif;">
              <div style="margin-bottom: 20px;">
                <p style="font-size: 15px; color: #64748b; margin-bottom: 16px; line-height: 1.5;">
                  Some materials have quantity discrepancies but checkout can proceed
                </p>

                <!-- Employee Info -->
                <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 20px; position: relative; overflow: hidden;">
                  <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(45deg, rgba(255,255,255,0.1) 0%, transparent 50%, rgba(0,0,0,0.02) 100%); pointer-events: none;"></div>
                  <div style="display: flex; align-items: center; gap: 12px; position: relative; z-index: 1;">
                    <div style="width: 40px; height: 40px; border-radius: 10px; background: linear-gradient(135deg, #ed8936 0%, #dd6b20 100%); display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(237, 137, 54, 0.3);">
                      <svg style="width: 20px; height: 20px; color: white;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                      </svg>
                    </div>
                    <div>
                      <p style="font-weight: 600; font-size: 16px; color: #1e293b; margin: 0; line-height: 1.2;">${selectedEmployee.fullName}</p>
                      <p style="font-size: 12px; color: #64748b; margin: 4px 0 0 0;">Employee Verification</p>
                    </div>
                  </div>
                </div>
              </div>

              <div style="margin-bottom: 20px;">
                <h4 style="font-weight: 600; margin-bottom: 16px; font-size: 16px; color: #1e293b; display: flex; align-items: center; gap: 8px;">
                  <div style="width: 20px; height: 20px; border-radius: 6px; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); display: flex; align-items: center; justify-content: center;">
                    <span style="color: white; font-size: 12px; font-weight: bold;">⚠️</span>
                  </div>
                  Quantity Issues (${validation.warnings.length})
                </h4>

                <div style="background: linear-gradient(135deg, #fefce8 0%, #fef3c7 100%); border: 1px solid #fde68a; border-radius: 12px; padding: 16px; margin-bottom: 16px; position: relative; overflow: hidden;">
                  <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(45deg, rgba(255,255,255,0.1) 0%, transparent 50%, rgba(245,158,11,0.02) 100%); pointer-events: none;"></div>
                  <div style="position: relative; z-index: 1;">
                    ${validation.warnings.map((w, i) => `
                      <div style="margin-bottom: 12px; font-size: 14px; color: #1e293b; line-height: 1.4; display: flex; gap: 12px; align-items: flex-start;">
                        <span style="color: #f59e0b; font-weight: 700; background: rgba(245,158,11,0.1); border-radius: 6px; padding: 2px 8px; font-size: 12px; flex-shrink: 0; margin-top: 1px;">${i + 1}</span>
                        <span>${w}</span>
                      </div>
                    `).join('')}
                  </div>
                </div>
              </div>

              <!-- Status Summary -->
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px;">
                <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 1px solid #bbf7d0; border-radius: 12px; padding: 16px; position: relative; overflow: hidden;">
                  <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(45deg, rgba(255,255,255,0.1) 0%, transparent 50%, rgba(34,197,94,0.02) 100%); pointer-events: none;"></div>
                  <div style="position: relative; z-index: 1; display: flex; align-items: center; gap: 12px;">
                    <div style="width: 24px; height: 24px; border-radius: 8px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); display: flex; align-items: center; justify-content: center;">
                      <span style="color: white; font-size: 14px; font-weight: bold;">✓</span>
                    </div>
                    <span style="font-weight: 600; color: #065f46; font-size: 14px;">Materials Assigned</span>
                  </div>
                </div>

                <div style="background: linear-gradient(135deg, #fefce8 0%, #fef3c7 100%); border: 1px solid #fde68a; border-radius: 12px; padding: 16px; position: relative; overflow: hidden;">
                  <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(45deg, rgba(255,255,255,0.1) 0%, transparent 50%, rgba(245,158,11,0.02) 100%); pointer-events: none;"></div>
                  <div style="position: relative; z-index: 1; display: flex; align-items: center; gap: 12px;">
                    <div style="width: 24px; height: 24px; border-radius: 8px; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); display: flex; align-items: center; justify-content: center;">
                      <span style="color: white; font-size: 14px; font-weight: bold;">⚠️</span>
                    </div>
                    <span style="font-weight: 600; color: #92400e; font-size: 14px;">Quantity Mismatch</span>
                  </div>
                </div>
              </div>

              <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px;">
                <p style="margin: 0; font-weight: 600; color: #1e293b; font-size: 15px;">Proceed with checkout despite warnings?</p>
              </div>
            </div>
          `,
          showCancelButton: true,
          confirmButtonText: 'Yes, Proceed',
          cancelButtonText: 'Cancel',
          confirmButtonColor: '#10b981',
          cancelButtonColor: '#64748b',
          width: '700px',
          customClass: {
            popup: 'industrial-card metallic-texture',
            htmlContainer: 'swal-html-container',
            confirmButton: 'retro-button',
            cancelButton: 'retro-button'
          },
          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #e2e8f0 100%)',
          backdrop: 'rgba(15, 23, 42, 0.8)'
        })

        if (!result.isConfirmed) {
          setSavingToInventory(false)
          return
        }
      }

      // ============================================================================
      // STEP 5: Proceed with checkout
      // ============================================================================
      console.log('✅ Validation passed! Proceeding with checkout...')

      const inventoryResult = await saveToEmployeeInventory(
        selectedEmployee,
        items,
        purpose.trim() || undefined
      )

      if (!inventoryResult.success) {
        console.warn("[CheckoutModal] Inventory tracking failed:", inventoryResult.message)
      }

      onConfirmCheckout(selectedEmployee, purpose.trim() || undefined)

      if (inventoryResult.success) {
        console.log("✅ Checkout completed successfully!")
      }

    } catch (error) {
      console.error("[CheckoutModal] Validation failed:", error)
      
      // Show error with SweetAlert2
      await Swal.fire({
        icon: 'error',
        title: 'Validation Failed',
        html: `
          <div style="text-align: center; font-family: 'Geist Sans', system-ui, sans-serif;">
            <div style="width: 64px; height: 64px; border-radius: 16px; background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; box-shadow: 0 4px 16px rgba(220, 38, 38, 0.3);">
              <svg style="width: 32px; height: 32px; color: white;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/>
              </svg>
            </div>
            <p style="color: #dc2626; font-size: 18px; font-weight: 600; margin-bottom: 12px;">Validation Error</p>
            <p style="color: #64748b; font-size: 15px; line-height: 1.5; margin-bottom: 0;">
              ${(error as Error).message}
            </p>
          </div>
        `,
        confirmButtonColor: '#10b981',
        customClass: {
          popup: 'industrial-card metallic-texture',
          confirmButton: 'retro-button'
        },
        background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 50%, #fecaca 100%)',
        backdrop: 'rgba(15, 23, 42, 0.8)',
        width: '400px'
      })
      
      setError(`Validation failed: ${(error as Error).message}`)
    } finally {
      setSavingToInventory(false)
    }
  }

  const goToNextStep = useCallback(() => {
    if (currentStep < 3) {
      setCurrentStep((prev) => (prev + 1) as WizardStep)
    }
  }, [currentStep])

  const goToPrevStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as WizardStep)
      setError(null)
    }
  }, [currentStep])

  const goToStep = useCallback((step: WizardStep) => {
    // Can only go to completed steps or current step
    if (step <= currentStep) {
      setCurrentStep(step)
      setError(null)
    }
  }, [currentStep])

  const canProceedToNext = useCallback(() => {
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
  }, [currentStep, items.length, selectedEmployee])

  if (!isOpen) return null

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const totalValue = items.reduce((sum, item) => sum + item.quantity * 10, 0)
  // const apiConfig = apiService.getConfig()
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

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6">
      <Card className="w-full max-w-7xl industrial-card metallic-texture shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-border bg-muted/30">
          <div>
            <h2 className="text-2xl font-bold text-card-foreground">Checkout</h2>
            <p className="text-sm text-muted-foreground">Step {currentStep} of 3 — {WIZARD_STEPS[(currentStep - 1) as number]?.title ?? ''}</p>
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

{/* Step 3: Payment (Demo) or Confirmation (Production) */}
          {currentStep === 3 && (
            env.DEMO_MODE ? (
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
            ) : (
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
                      Scan your ID badge or enter ID number
                    </p>
                </div>

                {/* Input Method Toggle */}
                <div className="flex justify-center">
                  <div className="inline-flex p-1 rounded-lg bg-muted">
                    <button
                      type="button"
                      onClick={() => {
                        setInputMethod('barcode')
                        setUserInput("")
                        setSelectedEmployee(null)
                        setError(null)
                      }}
                      className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                        inputMethod === 'barcode'
                          ? 'bg-card text-secondary shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Scan className="w-4 h-4" />
                      Scan Barcode
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setInputMethod('manual')
                        setUserInput("")
                        setSelectedEmployee(null)
                        setError(null)
                      }}
                      className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                        inputMethod === 'manual'
                          ? 'bg-card text-secondary shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <CreditCard className="w-4 h-4" />
                      Enter ID
                    </button>
                  </div>
                </div>

                {/* Input Field */}
                <div className="space-y-2">
                  <div className="relative">
                    <Input
                      placeholder={inputMethod === 'barcode' ? "Scan or type barcode..." : "Enter employee ID number..."}
                      value={userInput}
                      onChange={(e) => {
                        const value = e.target.value
                        setUserInput(value)
                        if (inputMethod === 'barcode') {
                          if (value.trim().length > 3) {
                            handleBarcodeScanned(value.trim())
                          } else {
                            setSelectedEmployee(null)
                          }
                        } else {
                          handleManualInput(value)
                        }
                      }}
                      className="h-12 text-center text-lg font-mono bg-input border-border focus:border-secondary"
                      disabled={isCommitting}
                      autoComplete="off"
                    />
                    {isScanning && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <div className="w-5 h-5 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                  
                  {inputMethod === 'barcode' && !selectedEmployee && !error && (
                    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                      <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                      Ready to scan...
                    </div>
                  )}
                </div>

                {/* Loading State */}
                {loadingEmployees && (
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <div className="w-4 h-4 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
                    Loading employees...
                  </div>
                )}

                {/* Error Display */}
                {error && (
                  <Card className={`border ${
                    error.includes('DISABLED')
                      ? 'bg-amber-500/10 border-amber-500/30'
                      : 'bg-destructive/10 border-destructive/30'
                  }`}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className={`w-5 h-5 mt-0.5 shrink-0 ${
                          error.includes('DISABLED') ? 'text-amber-500' : 'text-destructive'
                        }`} />
                        <div>
                          <p className={`text-sm font-medium ${
                            error.includes('DISABLED') ? 'text-amber-600 dark:text-amber-400' : 'text-destructive'
                          }`}>
                            {error.includes('DISABLED') ? 'ID Deactivated' : 'Verification Failed'}
                          </p>
                          <p className={`text-xs mt-1 ${
                            error.includes('DISABLED') ? 'text-amber-600/80 dark:text-amber-400/80' : 'text-destructive/80'
                          }`}>
                            {error.replace('⚠️ Employee ID is DISABLED: ', '')}
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
                          {selectedEmployee.profilePicture ? (
                            <img
                              src={selectedEmployee.profilePicture}
                              alt={`${selectedEmployee.firstName} ${selectedEmployee.lastName}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                // Fallback to initials if image fails to load
                                const img = e.target as HTMLImageElement;
                                img.style.display = 'none';
                                if (img.parentElement) {
                                  img.parentElement.innerHTML = `${selectedEmployee.firstName[0]}${selectedEmployee.lastName[0]}`;
                                }
                              }}
                            />
                          ) : (
                            `${selectedEmployee.firstName[0]}${selectedEmployee.lastName[0]}`
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-success truncate">
                            {selectedEmployee.firstName} {selectedEmployee.middleName && selectedEmployee.middleName + ' '}{selectedEmployee.lastName}
                          </p>
                          <p className="text-sm text-success/80 truncate">
                            {selectedEmployee.position} • {selectedEmployee.department}
                          </p>
                          <p className="text-xs text-success/70 mt-1">
                            ID: {selectedEmployee.idNumber}
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

          {/* Step 4: Confirmation & Employee ID (Demo only) */}
          {env.DEMO_MODE && currentStep === 4 && (
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
                    Scan your ID badge or enter ID number
                  </p>
                </div>

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
              disabled={!selectedEmployee || isCommitting || loadingEmployees || savingToInventory || isProcessingPayment}
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
    </div>
  )
}