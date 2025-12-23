import { ApiItemSchema, rateLimiter, sanitizeForLog } from '../validation'
import type { ApiConfig } from '../api-config'
import { getDemoProducts, updateDemoProductBalance, addDemoTransaction } from '../mock-data'

/**
 * Items Service
 * Handles all item-related API operations
 */
export class ItemsService {
  private config: ApiConfig

  constructor(config: ApiConfig) {
    this.config = config
  }

  updateConfig(config: ApiConfig) {
    this.config = config
  }

  /**
   * Fetch all items from the API
   */
  async fetchItems(): Promise<any[]> {
    // Demo mode only - return mock products
    console.log("[ItemsService] Demo mode: Returning mock products")
    const mockProducts = getDemoProducts()
    return mockProducts.map(product => ({
      id: product.id,
      item_no: product.id,
      item_name: product.name,
      brand: product.brand,
      item_type: product.itemType,
      location: product.location,
      balance: product.balance,
      status: product.status
    }))
  }

  /**
   * Commit item changes to the API
   */
  async commitItemChanges(items: any[]): Promise<boolean> {
    // Demo mode only - update mock product balances and add transactions
    console.log("[ItemsService] Demo mode: Updating mock product balances and adding transactions")

    // Get current demo products
    const demoProducts = getDemoProducts()

    // Process each item change
    for (const item of items) {
      const productId = item.item_no || item.id
      const quantity = item.quantity || 1
      const product = demoProducts.find(p => p.id === productId)

      if (product) {
        const newBalance = Math.max(0, product.balance - quantity)
        updateDemoProductBalance(productId, newBalance)

        // Add transaction log
        const transaction = {
          username: "Demo User",
          details: `Checked out ${item.item_name || item.name || 'Unknown Item'} x${quantity}`,
          purpose: "Demo checkout",
          id_number: "DEMO001",
          id_barcode: "DEMO001",
          item_no: productId,
          log_date: new Date().toISOString().split('T')[0],
          log_time: new Date().toTimeString().split(' ')[0]
        }
        addDemoTransaction(transaction)

        console.log(`[ItemsService] Demo: Updated ${productId} balance: ${product.balance} → ${newBalance}`)
      }
    }

    return true
  }

  /**
   * Update item quantity using the PUT /api/items/:id/quantity endpoint
   */
  async updateItemQuantity(itemId: number, updateType: 'set_balance' | 'adjust_in' | 'adjust_out' | 'manual', value: number, notes?: string): Promise<any> {
    // Demo mode only - update mock product balance
    console.log(`[ItemsService] Demo mode: Updating quantity for item ${itemId}`)

    const demoProducts = getDemoProducts()
    const product = demoProducts.find(p => p.id === itemId.toString())

    if (!product) {
      throw new Error(`Demo product with ID ${itemId} not found`)
    }

    let newBalance: number
    switch (updateType) {
      case 'set_balance':
        newBalance = value
        break
      case 'adjust_in':
        newBalance = product.balance + value
        break
      case 'adjust_out':
        newBalance = Math.max(0, product.balance - value)
        break
      case 'manual':
      default:
        newBalance = value
        break
    }

    updateDemoProductBalance(itemId.toString(), newBalance)

    console.log(`[ItemsService] Demo: Updated item ${itemId} balance: ${product.balance} → ${newBalance}`)
    return { success: true, data: { balance: newBalance } }
  }

}
