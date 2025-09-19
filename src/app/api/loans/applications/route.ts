import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Database connection placeholder
// In a real implementation, this would connect to your actual database
const db = {
  async query(sql: string, params?: any[]) {
    // Placeholder database query implementation
    // Replace with actual database connection (e.g., Prisma, Drizzle, raw SQL)
    console.log('Database query:', sql, params)
    return { rows: [], rowCount: 0 }
  }
}

// Authentication middleware placeholder
async function authenticate(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  
  // Placeholder authentication logic
  // In a real implementation, validate JWT token, API key, etc.
  const token = authHeader.substring(7)
  
  // Mock user for development
  return {
    id: '1',
    email: 'user@example.com',
    role: 'admin'
  }
}

// Validation schemas
const loanApplicationSchema = z.object({
  applicantName: z.string().min(2, 'Applicant name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phoneNumber: z.string().min(10, 'Phone number must be at least 10 digits'),
  loanAmount: z.number().positive('Loan amount must be positive'),
  loanPurpose: z.string().min(5, 'Loan purpose must be at least 5 characters'),
  annualIncome: z.number().positive('Annual income must be positive'),
  employment: z.object({
    status: z.enum(['employed', 'self-employed', 'unemployed', 'retired']),
    company: z.string().optional(),
    position: z.string().optional(),
    yearsEmployed: z.number().min(0).optional()
  }),
  creditScore: z.number().min(300).max(850).optional(),
  collateral: z.object({
    type: z.string().optional(),
    value: z.number().positive().optional()
  }).optional()
})

const querySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).default('10'),
  status: z.enum(['pending', 'approved', 'rejected', 'under-review']).optional(),
  search: z.string().optional(),
  sortBy: z.enum(['createdAt', 'loanAmount', 'applicantName']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
})

// TypeScript types
interface LoanApplication {
  id: string
  applicantName: string
  email: string
  phoneNumber: string
  loanAmount: number
  loanPurpose: string
  annualIncome: number
  employment: {
    status: 'employed' | 'self-employed' | 'unemployed' | 'retired'
    company?: string
    position?: string
    yearsEmployed?: number
  }
  creditScore?: number
  collateral?: {
    type?: string
    value?: number
  }
  status: 'pending' | 'approved' | 'rejected' | 'under-review'
  createdAt: Date
  updatedAt: Date
}

interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrevious: boolean
  }
}

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// GET: Retrieve loan applications with pagination and filtering
async function handleGet(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const query = querySchema.parse({
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '10',
      status: searchParams.get('status') || undefined,
      search: searchParams.get('search') || undefined,
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: searchParams.get('sortOrder') || 'desc'
    })

    const { page, limit, status, search, sortBy, sortOrder } = query
    const offset = (page - 1) * limit

    // Build SQL query
    let sql = `
      SELECT 
        id, applicant_name, email, phone_number, loan_amount, 
        loan_purpose, annual_income, employment, credit_score, 
        collateral, status, created_at, updated_at
      FROM loan_applications 
      WHERE 1=1
    `
    const params: any[] = []
    let paramIndex = 1

    // Add status filter
    if (status) {
      sql += ` AND status = $${paramIndex}`
      params.push(status)
      paramIndex++
    }

    // Add search filter
    if (search) {
      sql += ` AND (
        applicant_name ILIKE $${paramIndex} OR 
        email ILIKE $${paramIndex} OR 
        loan_purpose ILIKE $${paramIndex}
      )`
      params.push(`%${search}%`)
      paramIndex++
    }

    // Add sorting
    const sortColumn = sortBy === 'applicantName' ? 'applicant_name' : 
                      sortBy === 'loanAmount' ? 'loan_amount' : 'created_at'
    sql += ` ORDER BY ${sortColumn} ${sortOrder.toUpperCase()}`

    // Add pagination
    sql += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
    params.push(limit, offset)

    // Execute query
    const result = await db.query(sql, params)

    // Get total count for pagination
    let countSql = `SELECT COUNT(*) as total FROM loan_applications WHERE 1=1`
    const countParams: any[] = []
    let countParamIndex = 1

    if (status) {
      countSql += ` AND status = $${countParamIndex}`
      countParams.push(status)
      countParamIndex++
    }

    if (search) {
      countSql += ` AND (
        applicant_name ILIKE $${countParamIndex} OR 
        email ILIKE $${countParamIndex} OR 
        loan_purpose ILIKE $${countParamIndex}
      )`
      countParams.push(`%${search}%`)
    }

    const countResult = await db.query(countSql, countParams)
    const total = parseInt(countResult.rows[0]?.total || '0')
    const totalPages = Math.ceil(total / limit)

    // Transform database rows to LoanApplication objects
    const loanApplications: LoanApplication[] = result.rows.map((row: any) => ({
      id: row.id,
      applicantName: row.applicant_name,
      email: row.email,
      phoneNumber: row.phone_number,
      loanAmount: parseFloat(row.loan_amount),
      loanPurpose: row.loan_purpose,
      annualIncome: parseFloat(row.annual_income),
      employment: JSON.parse(row.employment || '{}'),
      creditScore: row.credit_score ? parseInt(row.credit_score) : undefined,
      collateral: row.collateral ? JSON.parse(row.collateral) : undefined,
      status: row.status,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    }))

    const response: ApiResponse<PaginatedResponse<LoanApplication>> = {
      success: true,
      data: {
        data: loanApplications,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrevious: page > 1
        }
      }
    }

    return NextResponse.json(response, { status: 200 })

  } catch (error) {
    console.error('Error fetching loan applications:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid query parameters',
        message: error.errors[0]?.message || 'Validation failed'
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch loan applications'
    }, { status: 500 })
  }
}

// POST: Create new loan application
async function handlePost(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()
    const validatedData = loanApplicationSchema.parse(body)

    // Generate unique ID (in real implementation, use UUID or database auto-increment)
    const id = `loan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Insert into database
    const sql = `
      INSERT INTO loan_applications (
        id, applicant_name, email, phone_number, loan_amount, 
        loan_purpose, annual_income, employment, credit_score, 
        collateral, status, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `

    const now = new Date()
    const params = [
      id,
      validatedData.applicantName,
      validatedData.email,
      validatedData.phoneNumber,
      validatedData.loanAmount,
      validatedData.loanPurpose,
      validatedData.annualIncome,
      JSON.stringify(validatedData.employment),
      validatedData.creditScore,
      validatedData.collateral ? JSON.stringify(validatedData.collateral) : null,
      'pending', // Default status
      now,
      now
    ]

    const result = await db.query(sql, params)
    
    // Transform result to LoanApplication object
    const row = result.rows[0]
    const loanApplication: LoanApplication = {
      id: row.id,
      applicantName: row.applicant_name,
      email: row.email,
      phoneNumber: row.phone_number,
      loanAmount: parseFloat(row.loan_amount),
      loanPurpose: row.loan_purpose,
      annualIncome: parseFloat(row.annual_income),
      employment: JSON.parse(row.employment || '{}'),
      creditScore: row.credit_score ? parseInt(row.credit_score) : undefined,
      collateral: row.collateral ? JSON.parse(row.collateral) : undefined,
      status: row.status,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    }

    const response: ApiResponse<LoanApplication> = {
      success: true,
      data: loanApplication,
      message: 'Loan application created successfully'
    }

    return NextResponse.json(response, { status: 201 })

  } catch (error) {
    console.error('Error creating loan application:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        message: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
      }, { status: 400 })
    }

    if (error instanceof SyntaxError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid JSON',
        message: 'Request body must be valid JSON'
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to create loan application'
    }, { status: 500 })
  }
}

// Main route handler
export async function GET(request: NextRequest) {
  // Check authentication
  const user = await authenticate(request)
  if (!user) {
    return NextResponse.json({
      success: false,
      error: 'Unauthorized',
      message: 'Authentication required'
    }, { status: 401 })
  }

  return handleGet(request)
}

export async function POST(request: NextRequest) {
  // Check authentication
  const user = await authenticate(request)
  if (!user) {
    return NextResponse.json({
      success: false,
      error: 'Unauthorized',
      message: 'Authentication required'
    }, { status: 401 })
  }

  return handlePost(request)
}

// Handle unsupported methods
export async function PUT() {
  return NextResponse.json({
    success: false,
    error: 'Method not allowed',
    message: 'PUT method not supported on this endpoint'
  }, { status: 405 })
}

export async function DELETE() {
  return NextResponse.json({
    success: false,
    error: 'Method not allowed',
    message: 'DELETE method not supported on this endpoint'
  }, { status: 405 })
}

export async function PATCH() {
  return NextResponse.json({
    success: false,
    error: 'Method not allowed',
    message: 'PATCH method not supported on this endpoint'
  }, { status: 405 })
}