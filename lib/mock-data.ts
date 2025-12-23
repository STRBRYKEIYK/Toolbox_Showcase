// Mock data for demo mode
import type { Product } from './barcode-scanner'
import type { TransactionLogData, EnhancedTransactionData } from './Services/transactions.service'

export const mockProducts: Product[] = [
  {
    id: "1",
    name: "Laptop Dell Inspiron 15",
    brand: "Dell",
    itemType: "Electronics",
    location: "Office A",
    balance: 5,
    status: "in-stock"
  },
  {
    id: "2",
    name: "Wireless Mouse Logitech",
    brand: "Logitech",
    itemType: "Accessories",
    location: "Storage B",
    balance: 12,
    status: "in-stock"
  },
  {
    id: "3",
    name: "USB Cable 2m",
    brand: "Generic",
    itemType: "Cables",
    location: "Shelf C",
    balance: 2,
    status: "low-stock"
  },
  {
    id: "4",
    name: "Monitor Samsung 24\"",
    brand: "Samsung",
    itemType: "Electronics",
    location: "Office B",
    balance: 0,
    status: "out-of-stock"
  },
  {
    id: "5",
    name: "Keyboard Mechanical",
    brand: "Corsair",
    itemType: "Accessories",
    location: "Storage A",
    balance: 8,
    status: "in-stock"
  },
  {
    id: "6",
    name: "Printer Ink Cartridge",
    brand: "HP",
    itemType: "Consumables",
    location: "Printer Room",
    balance: 15,
    status: "in-stock"
  },
  {
    id: "7",
    name: "Network Cable Cat6",
    brand: "Generic",
    itemType: "Cables",
    location: "Network Closet",
    balance: 25,
    status: "in-stock"
  },
  {
    id: "8",
    name: "Webcam HD",
    brand: "Microsoft",
    itemType: "Electronics",
    location: "Meeting Room",
    balance: 3,
    status: "low-stock"
  }
]

export const mockEmployees = [
  { id: "EMP001", name: "John Doe", department: "IT" },
  { id: "EMP002", name: "Jane Smith", department: "HR" },
  { id: "EMP003", name: "Bob Johnson", department: "Finance" },
  { id: "EMP004", name: "Alice Brown", department: "Operations" }
]

export const mockTransactions: TransactionLogData[] = [
  {
    username: "John Doe",
    details: "Checked out Laptop Dell Inspiron 15",
    purpose: "Project work",
    id_number: "EMP001",
    id_barcode: "EMP001",
    item_no: "1",
    log_date: "2024-12-20",
    log_time: "09:30:00"
  },
  {
    username: "Jane Smith",
    details: "Checked out Wireless Mouse Logitech x2",
    purpose: "Office setup",
    id_number: "EMP002",
    id_barcode: "EMP002",
    item_no: "2",
    log_date: "2024-12-19",
    log_time: "14:15:00"
  }
]

export const generateMockTransactionId = () => {
  return `TXN${Date.now()}${Math.random().toString(36).substr(2, 9)}`
}

export const simulatePayment = async (amount: number, method: string): Promise<{ success: boolean; transactionId?: string; error?: string }> => {
  // Simulate payment processing delay
  await new Promise(resolve => setTimeout(resolve, 2000))

  // Always succeed for demo
  return {
    success: true,
    transactionId: generateMockTransactionId()
  }
}

export const resetDemoData = () => {
  // Reset to initial mock data
  localStorage.setItem('demo_products', JSON.stringify(mockProducts))
  localStorage.setItem('demo_transactions', JSON.stringify(mockTransactions))
  localStorage.setItem('demo_employees', JSON.stringify(mockEmployees))
}

export const getDemoProducts = (): Product[] => {
  const stored = localStorage.getItem('demo_products')
  return stored ? JSON.parse(stored) : mockProducts
}

export const getDemoTransactions = (): TransactionLogData[] => {
  const stored = localStorage.getItem('demo_transactions')
  return stored ? JSON.parse(stored) : mockTransactions
}

export const getDemoEmployees = () => {
  const stored = localStorage.getItem('demo_employees')
  return stored ? JSON.parse(stored) : mockEmployees
}

export const updateDemoProductBalance = (productId: string, newBalance: number) => {
  const products = getDemoProducts()
  const updated = products.map(p =>
    p.id === productId ? { ...p, balance: newBalance, status: newBalance <= 0 ? 'out-of-stock' : newBalance < 5 ? 'low-stock' : 'in-stock' } : p
  )
  localStorage.setItem('demo_products', JSON.stringify(updated))
}

export const addDemoTransaction = (transaction: TransactionLogData) => {
  const transactions = getDemoTransactions()
  transactions.unshift(transaction)
  localStorage.setItem('demo_transactions', JSON.stringify(transactions))
}