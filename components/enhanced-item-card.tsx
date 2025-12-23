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
  
  // Robust image loading with fallback and retry logic
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

    const loadImageWithFallback = async (retryCount = 0) => {
      try {
        console.log(`[EnhancedItemCard] Loading image for item ${itemId}, attempt ${retryCount + 1}`)

        // First try to get the image list (like item detail view)
        const res = await apiService.getItemImages(itemId)
        if (res?.success && res.data && res.data.length > 0) {
          // Use the first image from the list
          const firstImage = res.data[0]
          const url = apiService.getItemImageUrl(itemId, firstImage.filename)
          console.log(`[EnhancedItemCard] Using image from list: ${url}`)
          imageCache.set(cacheKey, url)
          setImageUrl(url)
          setImageLoaded(true)
          return
        }

        // If no images in list, fall back to latest image
        console.log(`[EnhancedItemCard] No images in list, falling back to latest image`)
        const latestUrl = apiService.getItemLatestImageUrl(itemId)
        console.log(`[EnhancedItemCard] Using latest image: ${latestUrl}`)
        imageCache.set(cacheKey, latestUrl)
        setImageUrl(latestUrl)
        setImageLoaded(true)

      } catch (error) {
        console.error(`[EnhancedItemCard] Failed to load image for item ${itemId}:`, error)

        // Debug image endpoints for troubleshooting
        if (process.env.NODE_ENV === 'development') {
          console.log(`[EnhancedItemCard] Debugging image endpoints for item ${itemId}...`)
          const imagesUrl = `${apiService.getConfig().baseUrl}/api/items/images/${itemId}`
          const latestUrl = apiService.getItemLatestImageUrl(itemId)

          await debugImageEndpoint(itemId, 'images list', imagesUrl)
          await debugImageEndpoint(itemId, 'latest image', latestUrl)
        }

        // Log additional debugging info for server issues
        if (error instanceof Error) {
          if (error.message.includes('Failed to fetch')) {
            console.warn(`[EnhancedItemCard] Network error - check if image server is running and accessible`)
          } else if (error.message.includes('404')) {
            console.warn(`[EnhancedItemCard] Image endpoint returned 404 - check if item ${itemId} has images`)
          } else if (error.message.includes('403') || error.message.includes('401')) {
            console.warn(`[EnhancedItemCard] Authentication error - check API token and permissions`)
          }
        }

        // Retry logic with exponential backoff (max 3 retries)
        if (retryCount < 3) {
          const delay = Math.pow(2, retryCount) * 1000 // 1s, 2s, 4s
          console.log(`[EnhancedItemCard] Retrying in ${delay}ms...`)
          setTimeout(() => loadImageWithFallback(retryCount + 1), delay)
        } else {
          console.error(`[EnhancedItemCard] All retry attempts failed for item ${itemId}`)
          setImageError(true)
        }
      }
    }

    loadImageWithFallback()
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
                    if (fallbackUrl !== imageUrl) {
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
