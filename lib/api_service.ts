import { ItemsService } from './Services/items.service'
import { EmployeesService } from './Services/employees.service'
import { TransactionsService } from './Services/transactions.service'
import { ConnectionService } from './Services/connection.service'
import type { ApiConfig, TransactionFilters, TransactionResponse, TransactionStats } from './api-config'
import { DEFAULT_API_CONFIG } from './api-config'
import type { TransactionLogData } from './Services/transactions.service'
import env from './env'
import {
  mockProducts,
  mockEmployees,
  mockTransactions,
  getDemoProducts,
  getDemoTransactions,
  getDemoEmployees,
  updateDemoProductBalance,
  addDemoTransaction,
  simulatePayment,
  resetDemoData
} from './mock-data'

/**
 * API Services
 * 
 * This is the main middleman service that orchestrates all API operations.
 * It provides a unified interface to interact with different API service modules.
 * 
 * Usage:
 * - Use this service instead of directly accessing individual service classes
 * - This provides a centralized point for API operations
 * - Handles service initialization and configuration management
 */
export class ApiServices {
  private config: ApiConfig
  private itemsService: ItemsService
  private employeesService: EmployeesService
  private transactionsService: TransactionsService
  private connectionService: ConnectionService

  constructor(config: ApiConfig = DEFAULT_API_CONFIG) {
    this.config = config
    
    // Initialize all service modules
    this.itemsService = new ItemsService(config)
    this.employeesService = new EmployeesService(config)
    this.transactionsService = new TransactionsService(config)
    this.connectionService = new ConnectionService(config)
  }

  /**
   * Update configuration for all services
   */
  updateConfig(newConfig: Partial<ApiConfig>) {
    this.connectionService.updateConfig(newConfig)
    this.config = this.connectionService.getConfig()
    
    // Update all other services with new config
    this.itemsService.updateConfig(this.config)
    this.employeesService.updateConfig(this.config)
    this.transactionsService.updateConfig(this.config)
  }

  /**
   * Get current configuration
   */
  getConfig(): ApiConfig {
    return this.connectionService.getConfig()
  }

  // ========================================
  // CONNECTION OPERATIONS
  // ========================================

  /**
   * Test connection to the API server
   */
  async testConnection(): Promise<boolean> {
    if (env.DEMO_MODE) {
      return true
    }
    return this.connectionService.testConnection()
  }

  // ========================================
  // ITEMS OPERATIONS
  // ========================================

  /**
   * Fetch all items from the API
   */
  async fetchItems(): Promise<any[]> {
    if (env.DEMO_MODE) {
      return getDemoProducts()
    }
    return this.itemsService.fetchItems()
  }

  /**
   * Commit item changes to the API
   */
  async commitItemChanges(items: any[]): Promise<boolean> {
    return this.itemsService.commitItemChanges(items)
  }

  /**
   * Update item quantity using the PUT /api/items/:id/quantity endpoint
   */
  async updateItemQuantity(
    itemId: number, 
    updateType: 'set_balance' | 'adjust_in' | 'adjust_out' | 'manual', 
    value: number, 
    notes?: string
  ): Promise<any> {
    if (env.DEMO_MODE) {
      // Simulate updating balance
      const products = getDemoProducts()
      const product = products.find(p => p.id === itemId.toString())
      if (product) {
        let newBalance = product.balance
        if (updateType === 'set_balance') {
          newBalance = value
        } else if (updateType === 'adjust_in') {
          newBalance += value
        } else if (updateType === 'adjust_out') {
          newBalance -= value
        }
        updateDemoProductBalance(product.id, newBalance)
      }
      return { success: true }
    }
    return this.itemsService.updateItemQuantity(itemId, updateType, value, notes)
  }

  /**
   * Get list of images for an item
   */
  async getItemImages(itemId: number): Promise<any> {
    // Get item data to generate mock images
    const items = getDemoProducts()
    const item = items.find(i => i.id === itemId.toString() || i.item_no === itemId)

    if (item) {
      // Return mock image data
      return {
        success: true,
        data: [{
          filename: `${item.item_name || item.name || 'item'}.jpg`,
          url: this.generateImageUrlFromItemName(item.item_name || item.name || 'Unknown Item')
        }]
      }
    }

    return { success: true, data: [] }
  }

  /**
   * Build URL for latest image (direct <img src>)
   */
  getItemLatestImageUrl(itemId: number): string | null {
    // Get item data to use name for image search
    const items = getDemoProducts()
    const item = items.find(i => i.id === itemId.toString() || i.item_no === itemId)
    if (item) {
      return this.generateImageUrlFromItemName(item.item_name || item.name || 'Unknown Item')
    }
    return null
  }

  /**
   * Build URL for a specific image filename
   */
  getItemImageUrl(itemId: number, filename: string): string | null {
    // Get item data to use name for image search
    const items = getDemoProducts()
    const item = items.find(i => i.id === itemId.toString() || i.item_no === itemId)
    if (item) {
      return this.generateImageUrlFromItemName(item.item_name || item.name || 'Unknown Item')
    }
    return null
  }

  /**
   * Generate image URL based on item name using placeholder service
   */
  private generateImageUrlFromItemName(itemName: string): string {
    // Clean the item name for URL
    const cleanName = itemName.replace(/[^a-zA-Z0-9\s]/g, '').trim()
    const encodedName = encodeURIComponent(cleanName)

    // Use a placeholder service that can display text
    // We'll use placeholder.com which can show text
    return `https://via.placeholder.com/300x200/4f46e5/ffffff?text=${encodedName}`
  }

  // ========================================
  // EMPLOYEES OPERATIONS
  // ========================================

  /**
   * Fetch all employees from the API
   */
  async fetchEmployees(): Promise<any[]> {
    if (env.DEMO_MODE) {
      return getDemoEmployees()
    }
    return this.employeesService.fetchEmployees()
  }

  // ========================================
  // TRANSACTIONS OPERATIONS
  // ========================================

  /**
   * Fetch transactions with optional filters
   */
  async fetchTransactions(filters: TransactionFilters = {}): Promise<TransactionResponse> {
    if (env.DEMO_MODE) {
      const transactions = getDemoTransactions()
      return {
        data: transactions,
        total: transactions.length,
        page: 1,
        limit: transactions.length
      }
    }
    return this.transactionsService.fetchTransactions(filters)
  }

  /**
   * Fetch transaction statistics
   */
  async fetchTransactionStats(days: number = 30): Promise<TransactionStats> {
    return this.transactionsService.fetchTransactionStats(days)
  }

  /**
   * Fetch transactions for a specific user
   */
  async fetchUserTransactions(username: string, filters: Omit<TransactionFilters, 'username'> = {}): Promise<any> {
    return this.transactionsService.fetchUserTransactions(username, filters)
  }

  /**
   * Log a transaction to the API
   */
  async logTransaction(transactionData: TransactionLogData): Promise<boolean> {
    if (env.DEMO_MODE) {
      addDemoTransaction(transactionData)
      return true
    }
    return this.transactionsService.logTransaction(transactionData)
  }

  // ========================================
  // CONVENIENCE METHODS
  // ========================================

  /**
   * Simulate payment processing (demo only)
   */
  async processPayment(amount: number, method: string): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    if (env.DEMO_MODE) {
      return simulatePayment(amount, method)
    }
    throw new Error('Payment processing not available in production mode')
  }

  /**
   * Reset demo data to initial state
   */
  resetDemoData(): void {
    if (env.DEMO_MODE) {
      resetDemoData()
    }
  }

  /**
   * Check if the API is currently connected
   */
  isConnected(): boolean {
    return this.config.isConnected
  }

  /**
   * Get the current API base URL
   */
  getBaseUrl(): string {
    return this.config.baseUrl
  }

  /**
   * Perform a full health check of all API services
   */
  async healthCheck(): Promise<{
    connection: boolean;
    items: boolean;
    employees: boolean;
    transactions: boolean;
  }> {
    const results = {
      connection: false,
      items: false,
      employees: false,
      transactions: false
    }

    try {
      // Test basic connection
      results.connection = await this.testConnection()

      if (results.connection) {
        // Test items endpoint
        try {
          await this.fetchItems()
          results.items = true
        } catch (error) {
          console.warn("[ApiServices] Items endpoint health check failed:", error)
        }

        // Test employees endpoint
        try {
          await this.fetchEmployees()
          results.employees = true
        } catch (error) {
          console.warn("[ApiServices] Employees endpoint health check failed:", error)
        }

        // Test transactions endpoint
        try {
          await this.fetchTransactions({ limit: 1 })
          results.transactions = true
        } catch (error) {
          console.warn("[ApiServices] Transactions endpoint health check failed:", error)
        }
      }
    } catch (error) {
      console.error("[ApiServices] Health check failed:", error)
    }

    return results
  }
}

// Export the default instance
export const apiService = new ApiServices()

// Also export individual service classes for direct access if needed
export { ItemsService } from './Services/items.service'
export { EmployeesService } from './Services/employees.service'
export { TransactionsService } from './Services/transactions.service'
export { ConnectionService } from './Services/connection.service'

// Export types
export type { ApiConfig, TransactionFilters, TransactionResponse, TransactionStats } from './api-config'
