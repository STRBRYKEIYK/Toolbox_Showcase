import type { ApiConfig, TransactionFilters, TransactionResponse, TransactionStats } from '../api-config'
import { getDemoTransactions, addDemoTransaction } from '../mock-data'

/**
 * Transaction Log Data interface matching the database schema
 * Database fields: id (auto), log_date, log_time, username, details, purpose, id_number, id_barcode, item_no, created_at (auto)
 */
export interface TransactionLogData {
  username: string
  details: string
  purpose?: string  // Optional field for checkout purpose/reason
  id_number?: string  // Employee's ID number
  id_barcode?: string  // Employee's barcode
  item_no?: string  // Item numbers (can be single or multiple with separators)
  log_date?: string  // YYYY-MM-DD format, optional (database defaults to curdate())
  log_time?: string  // HH:MM:SS format, optional (database defaults to curtime())
}

/**
 * Internal interface for enhanced logging with full item details
 * Used internally before converting to TransactionLogData
 */
export interface EnhancedTransactionData {
  userId: string
  items: Array<{
    id: string
    name: string
    brand?: string
    itemType?: string
    location?: string
    quantity: number
    originalBalance?: number
    newBalance?: number
  }>
  username: string
  totalItems: number
  timestamp: string
}

/**
 * Transactions Service
 * Handles all transaction and logging-related API operations
 */
export class TransactionsService {
  private config: ApiConfig

  constructor(config: ApiConfig) {
    this.config = config
  }

  updateConfig(config: ApiConfig) {
    this.config = config
  }

  /**
   * Fetch transactions with optional filters
   */
  async fetchTransactions(filters: TransactionFilters = {}): Promise<TransactionResponse> {
    // Demo mode only - return mock transactions with filtering
    console.log("[TransactionsService] Demo mode: Returning mock transactions")
    const mockTransactions = getDemoTransactions()

    // Apply basic filtering if provided
    let filteredTransactions = mockTransactions
    if (filters.username) {
      filteredTransactions = filteredTransactions.filter(t => t.username.toLowerCase().includes(filters.username!.toLowerCase()))
    }
    if (filters.date_from) {
      filteredTransactions = filteredTransactions.filter(t => t.log_date >= filters.date_from!)
    }
    if (filters.date_to) {
      filteredTransactions = filteredTransactions.filter(t => t.log_date <= filters.date_to!)
    }
    if (filters.search) {
      filteredTransactions = filteredTransactions.filter(t => 
        t.details.toLowerCase().includes(filters.search!.toLowerCase()) ||
        t.username.toLowerCase().includes(filters.search!.toLowerCase())
      )
    }

    // Apply limit and offset
    const limit = filters.limit ? parseInt(filters.limit.toString()) : 50
    const offset = filters.offset ? parseInt(filters.offset.toString()) : 0
    const paginatedTransactions = filteredTransactions.slice(offset, offset + limit)

    return {
      success: true,
      data: paginatedTransactions,
      total: filteredTransactions.length,
      limit: limit,
      offset: offset
    } as TransactionResponse
  }

  /**
   * Fetch transaction statistics
   */
  async fetchTransactionStats(days: number = 30): Promise<TransactionStats> {
    // Demo mode only - return mock transaction stats
    console.log(`[TransactionsService] Demo mode: Returning mock transaction stats for ${days} days`)
    const mockTransactions = getDemoTransactions()

    // Calculate mock stats
    const totalTransactions = mockTransactions.length
    const uniqueUsers = new Set(mockTransactions.map(t => t.username)).size
    const totalItems = mockTransactions.reduce((sum, t) => {
      // Extract quantity from details (e.g., "Checked out Wireless Mouse Logitech x2")
      const match = t.details.match(/x(\d+)/)
      return sum + (match ? parseInt(match[1]) : 1)
    }, 0)

    return {
      total_transactions: totalTransactions,
      unique_users: uniqueUsers,
      total_items_checked_out: totalItems,
      average_items_per_transaction: totalTransactions > 0 ? totalItems / totalTransactions : 0,
      period_days: days
    } as TransactionStats
  }

  /**
   * Fetch transactions for a specific user
   */
  async fetchUserTransactions(username: string, filters: Omit<TransactionFilters, 'username'> = {}): Promise<any> {
    // Demo mode only - return mock transactions for user
    console.log(`[TransactionsService] Demo mode: Returning mock transactions for user ${username}`)
    const mockTransactions = getDemoTransactions()

    // Filter by username
    let userTransactions = mockTransactions.filter(t => t.username.toLowerCase() === username.toLowerCase())

    // Apply additional filters
    if (filters.date_from) {
      userTransactions = userTransactions.filter(t => t.log_date >= filters.date_from!)
    }
    if (filters.date_to) {
      userTransactions = userTransactions.filter(t => t.log_date <= filters.date_to!)
    }

    // Apply limit and offset
    const limit = filters.limit ? parseInt(filters.limit.toString()) : 50
    const offset = filters.offset ? parseInt(filters.offset.toString()) : 0
    const paginatedTransactions = userTransactions.slice(offset, offset + limit)

    return {
      success: true,
      data: paginatedTransactions,
      total: userTransactions.length,
      limit: limit,
      offset: offset,
      activity_summary: {
        total_transactions: userTransactions.length,
        total_items: userTransactions.reduce((sum, t) => {
          const match = t.details.match(/x(\d+)/)
          return sum + (match ? parseInt(match[1]) : 1)
        }, 0),
        last_activity: userTransactions.length > 0 ? userTransactions[0].log_date : null
      }
    }
  }

  /**
   * Log a transaction to the API
   */
  async logTransaction(transactionData: TransactionLogData): Promise<boolean> {
    // Demo mode only - add transaction to mock data
    console.log("[TransactionsService] Demo mode: Adding transaction to mock data")
    console.log(`[TransactionsService] User: ${transactionData.username}`)
    console.log(`[TransactionsService] Details: ${transactionData.details}`)
    console.log(`[TransactionsService] Date/Time: ${transactionData.log_date} ${transactionData.log_time}`)

    addDemoTransaction(transactionData)
    return true
  }
}