"use client"

import { useEffect, useRef, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from './ui/dialog'
import { Input } from './ui/input'
import { Button } from './ui/button'
import type { Product } from '../lib/barcode-scanner'
import { apiService } from '../lib/api_service'

interface BulkLineItem {
  product: Product
  quantity: number
}

interface BarcodeModalProps {
  open: boolean
  initialValue?: string
  products?: Product[]
  onClose: () => void
  onConfirm: (payload: { barcode?: string; quantity?: number } | { items: BulkLineItem[] }) => void
}

export default function BarcodeModal({ open, initialValue = '', products = [], onClose, onConfirm }: BarcodeModalProps) {
  const [barcode, setBarcode] = useState(initialValue)
  const [quantity, setQuantity] = useState<number>(1)
  const hiddenInputRef = useRef<HTMLInputElement | null>(null)
  const [lineItems, setLineItems] = useState<BulkLineItem[]>([])

  const isAvailable = (p?: Product | null, additionalQty = 1) => {
    if (!p) return false
    const status = (p.status || '').toString().toLowerCase()
    if (status.includes('out')) return false
    if (typeof p.balance === 'number') {
      if (p.balance <= 0) return false
      const existingInQueue = lineItems.find(li => String(li.product.id) === String(p.id))
      const currentQtyInQueue = existingInQueue ? existingInQueue.quantity : 0
      const totalRequested = currentQtyInQueue + additionalQty
      if (totalRequested > p.balance) return false
    }
    return true
  }

  useEffect(() => {
    setBarcode(initialValue)
    if (open) {
      setTimeout(() => hiddenInputRef.current?.focus(), 50)
    }
  }, [open, initialValue])

  useEffect(() => {
    setLineItems(prev => {
      if (prev && prev.length > 0) {
        if (!products || products.length === 0) return prev
        const next = [...prev]
        products.forEach(p => {
          if (!isAvailable(p)) return
          const exists = next.find(x => String(x.product.id) === String(p.id))
          if (!exists) next.push({ product: p, quantity: 1 })
        })
        return next
      }

      if (products && products.length > 0) {
        return products.filter(p => isAvailable(p)).map(p => ({ product: p, quantity: 1 }))
      }

      return []
    })
  }, [products])

  useEffect(() => {
    const handler = (e: Event) => {
      try {
        const detail = (e as CustomEvent).detail || {}
        const li = detail.item
        if (!li || !li.product) return

        const p = li.product as Product
        if (p.status === 'out-of-stock' || (typeof p.balance === 'number' && p.balance <= 0)) {
          console.warn(`[barcode-modal] Skipped queuing out-of-stock item: ${p.name}`)
          return
        }

        setLineItems(prev => {
          const idx = prev.findIndex(x => String(x.product.id) === String(p.id))
          if (idx !== -1) {
            const next = [...prev]
            const existing = next[idx]
            if (!existing) return prev
            next[idx] = { product: existing.product, quantity: Math.max(0, existing.quantity + (li.quantity || 1)) }
            return next
          }
          return [...prev, { product: p, quantity: li.quantity || 1 }]
        })
      } catch (err) {
        console.error('barcode-modal append handler error', err)
      }
    }

    window.addEventListener('scanned-barcode-append', handler as EventListener)
    return () => window.removeEventListener('scanned-barcode-append', handler as EventListener)
  }, [])

  useEffect(() => {
    const handler = () => {
      setLineItems([])
    }

    window.addEventListener('clear-barcode-queue', handler as EventListener)
    return () => window.removeEventListener('clear-barcode-queue', handler as EventListener)
  }, [])

  const handleConfirmSingle = () => {
    onConfirm({ barcode: barcode.trim(), quantity })
    onClose()
  }

  const handleConfirmBulk = () => {
    const items = lineItems.filter(li => {
      if (li.quantity <= 0) return false
      const status = (li.product.status || '').toString().toLowerCase()
      if (status.includes('out')) return false
      if (typeof li.product.balance === 'number' && li.product.balance <= 0) return false
      return true
    })
    if (items.length === 0) {
      onClose()
      return
    }
    onConfirm({ items })
    onClose()
  }

  const handleClearQueue = () => {
    setLineItems([])
  }

  const updateLineQuantity = (index: number, qty: number) => {
    setLineItems(prev => {
      const next = [...prev]
      const existing = next[index]
      if (!existing) return prev
      const maxQty = typeof existing.product.balance === 'number' ? existing.product.balance : Infinity
      const clampedQty = Math.max(0, Math.min(qty, maxQty))
      next[index] = { product: existing.product, quantity: clampedQty }
      return next
    })
  }

  function ItemImage({ item }: { item: Product }) {
    const [url, setUrl] = useState<string | null>(null)
    const [loaded, setLoaded] = useState(false)
    const [err, setErr] = useState(false)

    useEffect(() => {
      setErr(false)
      setLoaded(false)
      if (!item || !item.id) {
        setUrl(null)
        return
      }
      const numericId = parseInt(String(item.id), 10)
      if (isNaN(numericId)) {
        setUrl(null)
        return
      }
      const u = apiService.getItemLatestImageUrl(numericId)
      setUrl(`${u}?t=${Date.now()}`)
    }, [item])

    return (
      <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden border border-gray-300 relative">
        {!err && url && (
          <img src={url} alt={item.name} className={`w-full h-full object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`} onLoad={() => setLoaded(true)} onError={() => setErr(true)} />
        )}
        {(!url || err) && (
          <div className="text-gray-400 text-xs">No Img</div>
        )}
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="w-full max-w-[95vw] max-h-[85vh] overflow-hidden bg-white dark:bg-gray-900 border-0 shadow-2xl rounded-2xl flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-orange-50 to-orange-100 dark:from-gray-800 dark:to-gray-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center shadow-md">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M12 12l3-3m-3 3l-3-3m-3 6h2.01M12 12l-3 3m3-3l3 3M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
                  Barcode Detected
                </DialogTitle>
                <DialogDescription className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                  {lineItems && lineItems.length > 0
                    ? "Review and adjust quantities before adding"
                    : "Confirm details to add to cart"
                  }
                </DialogDescription>
              </div>
            </div>
            {lineItems && lineItems.length > 0 && (
              <span className="px-3 py-1.5 bg-orange-500 text-white rounded-full text-sm font-semibold shadow-md">
                {lineItems.length} {lineItems.length === 1 ? 'item' : 'items'}
              </span>
            )}
          </div>
        </DialogHeader>

        <div className="p-6 flex-1 overflow-hidden bg-gray-50 dark:bg-gray-950">
          {lineItems && lineItems.length > 0 ? (
            <div className="space-y-3 max-h-[340px] overflow-y-auto pr-2">{lineItems.map((li, idx) => {
                const maxQty = typeof li.product.balance === 'number' ? li.product.balance : 9999;
                const isOutOfStock = li.product.status === 'out-of-stock' || maxQty <= 0;
                return (
                  <div key={`${li.product.id}-${idx}`} className={`p-4 rounded-xl border transition-all duration-200 bg-white dark:bg-gray-900 ${
                    isOutOfStock
                      ? 'border-red-300 dark:border-red-700 opacity-60'
                      : 'border-gray-200 dark:border-gray-700 hover:border-orange-400 dark:hover:border-orange-500 hover:shadow-md'
                  }`}>
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0">
                        <ItemImage item={li.product} />
                      </div>
                      <div className="flex-1 min-w-0 grid grid-cols-[1fr_auto_auto] gap-4 items-center">
                        <div className="min-w-0">
                          <h4 className="text-base font-semibold text-gray-900 dark:text-white truncate">
                            {li.product.name}
                          </h4>
                          <div className="mt-1 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <span className="truncate">{li.product.brand}</span>
                            <span>•</span>
                            <span>{li.product.itemType}</span>
                            <span>•</span>
                            <span className="font-mono">#{li.product.id}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateLineQuantity(idx, Math.max(0, li.quantity - 1))}
                            disabled={isOutOfStock}
                            className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-orange-200 dark:hover:bg-orange-700 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                            </svg>
                          </button>
                          <Input
                            type="number"
                            min={0}
                            max={maxQty}
                            value={li.quantity}
                            onChange={(e: any) => updateLineQuantity(idx, Number(e.target.value || 0))}
                            disabled={isOutOfStock}
                            className="w-16 h-8 text-center text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:border-orange-500 dark:focus:border-orange-400 font-semibold"
                          />
                          <button
                            onClick={() => updateLineQuantity(idx, Math.min(maxQty, li.quantity + 1))}
                            disabled={isOutOfStock}
                            className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-orange-200 dark:hover:bg-orange-700 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                          </button>
                        </div>
                        
                        <div className="text-right">
                          <div className={`text-xs font-semibold px-2 py-1 rounded-full inline-block ${
                            li.product.status === 'in-stock' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                            li.product.status === 'low-stock' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' :
                            'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                          }`}>
                            {isOutOfStock ? 'Out' : `${maxQty} avail`}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="grid md:grid-cols-[1fr_200px] gap-6 items-center">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide flex items-center">
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    Barcode
                  </label>
                  <Input
                    ref={hiddenInputRef as any}
                    value={barcode}
                    onChange={(e: any) => setBarcode(e.target.value)}
                    className="text-base font-mono border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-orange-500 dark:focus:border-orange-400 h-11"
                    placeholder="Scan or enter barcode..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide flex items-center">
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                    </svg>
                    Quantity
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-9 h-9 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-orange-200 dark:hover:bg-orange-700 flex items-center justify-center transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                      </svg>
                    </button>

                    <Input
                      type="number"
                      value={quantity}
                      onChange={(e: any) => setQuantity(Number(e.target.value || 1))}
                      className="text-center border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-orange-500 dark:focus:border-orange-400 h-9 flex-1 font-semibold"
                      min={1}
                    />

                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-9 h-9 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-orange-200 dark:hover:bg-orange-700 flex items-center justify-center transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 border border-orange-200 dark:border-orange-800">
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 bg-orange-500 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-xs text-orange-800 dark:text-orange-200">
                    <strong>Pro Tip:</strong> Continue scanning to queue multiple items for bulk addition
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 bg-white dark:bg-gray-900">
          <div className="flex items-center justify-between w-full gap-3">
            <Button
              variant="ghost"
              onClick={handleClearQueue}
              disabled={!lineItems || lineItems.length === 0}
              className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Clear Queue
            </Button>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={onClose}
                className="border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 px-5"
              >
                Cancel
              </Button>

              <Button
                onClick={lineItems && lineItems.length > 0 ? handleConfirmBulk : handleConfirmSingle}
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg px-6 py-2.5 shadow-lg hover:shadow-xl transition-all duration-200 font-semibold"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.1 5H19M7 13l-1.1-5M7 13l1.1 5M9 21a1 1 0 11-2 0 1 1 0 012 0zm10 0a1 1 0 11-2 0 1 1 0 012 0z" />
                </svg>
                {lineItems && lineItems.length > 0 ? `Add ${lineItems.length} Items` : 'Add to Cart'}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}