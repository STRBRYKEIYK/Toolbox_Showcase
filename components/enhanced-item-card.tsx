import React, { useState, useEffect } from 'react'
import { Card, CardContent } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Plus, Eye, Package } from 'lucide-react'
import type { Product } from '../lib/barcode-scanner'
import { apiService } from '../lib/api_service'
import { IndustrialTooltip } from './ui/tooltip'

// Global image cache for faster loading
const imageCache = new Map<string, string>()

// Debug utility for image endpoint testing
const debugImageEndpoint = async (itemId: number, endpoint: string, url: string) => {
  try {
    console.log(`[ImageDebug] Testing ${endpoint} for item ${itemId}: ${url}`)
    const response = await fetch(url, {
      method: 'HEAD', // Use HEAD to check if endpoint exists without downloading
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
      }
    })
    console.log(`[ImageDebug] ${endpoint} response: ${response.status} ${response.statusText}`)
    return response.ok
  } catch (error) {
    console.error(`[ImageDebug] ${endpoint} failed:`, error)
    return false
  }
}

interface EnhancedItemCardProps {
  product: Product
  onAddToCart: (product: Product, quantity?: number) => void
  onViewItem: (product: Product) => void
  viewMode?: 'grid' | 'list'
}

export const EnhancedItemCard = React.memo<EnhancedItemCardProps>(({ 
  product, 
  onAddToCart, 
  onViewItem, 
  viewMode = 'grid' 
}) => {
  const [imageError, setImageError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  
  // Simplified image loading - use generated URL directly
  useEffect(() => {
    setImageError(false)
    setImageLoaded(false)

    if (!product?.id) {
      setImageUrl(null)
      return
    }

    const itemId = typeof product.id === 'number' ? product.id : parseInt(product.id, 10)
    if (isNaN(itemId)) {
      setImageUrl(null)
      return
    }

    const cacheKey = `item_${itemId}`

    if (imageCache.has(cacheKey)) {
      setImageUrl(imageCache.get(cacheKey)!)
      setImageLoaded(true)
      return
    }

    // Generate image URL directly from item name
    const generatedUrl = apiService.getItemLatestImageUrl(itemId)
    if (generatedUrl) {
      console.log(`[EnhancedItemCard] Using generated image URL for item ${itemId}: ${generatedUrl}`)
      imageCache.set(cacheKey, generatedUrl)
      setImageUrl(generatedUrl)
      setImageLoaded(true)
    } else {
      setImageUrl(null)
      setImageLoaded(true)
    }
  }, [product?.id])

  const isAddDisabled = product.status === 'out-of-stock' || (typeof product.balance === 'number' && product.balance <= 0)

  const getStatusStyle = () => {
    if (product.status === 'out-of-stock') return 'bg-destructive/10 text-destructive'
    if (product.status === 'low-stock') return 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
    return 'bg-green-500/10 text-green-600 dark:text-green-400'
  }

  // List view
  if (viewMode === 'list') {
    return (
      <Card className="industrial-card group hover:shadow-lg transition-all">
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            {/* Image */}
            <div 
              className="w-14 h-14 bg-muted rounded-lg flex items-center justify-center overflow-hidden shrink-0 cursor-pointer"
              onClick={() => onViewItem(product)}
            >
              {!imageError && imageUrl ? (
                <img 
                  src={imageUrl} 
                  alt={product.name}
                  className={`w-full h-full object-cover transition-opacity ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                  onLoad={() => setImageLoaded(true)}
                  onError={() => setImageError(true)}
                />
              ) : (
                <Package className="w-6 h-6 text-muted-foreground" />
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onViewItem(product)}>
              <h3 className="font-medium text-sm truncate">{product.name}</h3>
              <p className="text-xs text-muted-foreground truncate">
                {product.itemType} {product.location && `• ${product.location}`}
              </p>
            </div>

            {/* Stock & Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <span className={`text-xs font-medium px-2 py-1 rounded-md ${getStatusStyle()}`}>
                {product.balance || 0}
              </span>
              <IndustrialTooltip content="Add item to cart">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onAddToCart(product)}
                  disabled={isAddDisabled}
                  className="h-8 w-8 p-0"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </IndustrialTooltip>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Grid view
  return (
    <Card className="industrial-card group hover:shadow-lg transition-all overflow-hidden">
      <CardContent className="p-0">
        {/* Image */}
        <div 
          className="relative aspect-square bg-muted cursor-pointer"
          onClick={() => onViewItem(product)}
        >
          {!imageError && imageUrl ? (
            <img
              src={imageUrl}
              alt={product.name}
              className={`w-full h-full object-cover transition-opacity ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => setImageLoaded(true)}
              onError={(e) => {
                console.error(`[EnhancedItemCard] Image failed to load for item ${product.id}: ${imageUrl}`)
                // Try fallback to latest image if we were using a specific image
                if (imageUrl && imageUrl.includes('/file/')) {
                  const itemId = typeof product.id === 'number' ? product.id : parseInt(product.id, 10)
                  if (!isNaN(itemId)) {
                    const fallbackUrl = apiService.getItemLatestImageUrl(itemId)
                    if (fallbackUrl && fallbackUrl !== imageUrl) {
                      setImageUrl(fallbackUrl)
                      return
                    }
                  }
                }
                setImageError(true)
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-10 h-10 text-muted-foreground/50" />
            </div>
          )}
          
          {/* Stock Badge */}
          <div className="absolute top-2 right-2">
            <span className={`text-xs font-medium px-2 py-1 rounded-md ${getStatusStyle()}`}>
              {product.balance || 0}
            </span>
          </div>

          {/* Hover Actions */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <IndustrialTooltip content="View item details">
              <Button
                size="sm"
                variant="secondary"
                onClick={(e) => {
                  e.stopPropagation()
                  onViewItem(product)
                }}
                className="h-8 text-xs"
              >
                <Eye className="w-3.5 h-3.5 mr-1" />
                View
              </Button>
            </IndustrialTooltip>
            <IndustrialTooltip content="Add item to cart">
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onAddToCart(product)
                }}
                disabled={isAddDisabled}
                className="h-8 text-xs"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add
              </Button>
            </IndustrialTooltip>
          </div>
        </div>

        {/* Details */}
        <div className="p-3" onClick={() => onViewItem(product)}>
          <h3 className="font-medium text-sm line-clamp-2 leading-tight cursor-pointer hover:text-primary transition-colors">
            {product.name}
          </h3>
          <p className="text-xs text-muted-foreground mt-1 truncate">
            {product.itemType}
          </p>
        </div>
      </CardContent>
    </Card>
  )
})

EnhancedItemCard.displayName = 'EnhancedItemCard'
