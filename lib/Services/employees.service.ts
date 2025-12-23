import type { ApiConfig } from '../api-config'
import { getDemoEmployees } from '../mock-data'

/**
 * Employee interface - represents employee data structure
 */
export interface Employee {
  id: number
  fullName: string
  firstName: string
  middleName: string
  lastName: string
  age: number | null
  birthDate: string
  contactNumber: string | null
  createdAt: string
  department: string
  document: string | null
  email: string
  hireDate: string
  idBarcode: string
  idNumber: string
  isNewHire: boolean
  position: string
  profilePicture: string | null
  salary: string | null
  status: string
  address: string | null
  civilStatus: string | null
  pagibigNumber: string | null
  philhealthNumber: string | null
  sssNumber: string | null
  tinNumber: string | null
}

/**
 * Employees Service
 * Handles all employee-related API operations
 */
export class EmployeesService {
  private config: ApiConfig

  constructor(config: ApiConfig) {
    this.config = config
  }

  updateConfig(config: ApiConfig) {
    this.config = config
  }

  /**
   * Fetch all employees from the API
   * @param includeAllStatuses - If true, fetch all employees including Inactive/Disabled ones
   */
  async fetchEmployees(includeAllStatuses: boolean = true): Promise<any[]> {
    // Demo mode only - return mock employees
    console.log("[EmployeesService] Demo mode: Returning mock employees")
    const mockEmployees = getDemoEmployees()
    return mockEmployees.map(employee => ({
      id: employee.id,
      fullName: employee.name,
      firstName: employee.name.split(' ')[0],
      lastName: employee.name.split(' ').slice(1).join(' '),
      department: employee.department,
      status: 'Active',
      idBarcode: employee.id,
      idNumber: employee.id
    }))
  }
}