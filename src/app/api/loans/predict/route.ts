import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { LoanPredictionService } from '@/services/loan-prediction'
import { PredictionRepository } from '@/repositories/prediction-repository'

// Input validation schema
const loanApplicationSchema = z.object({
  applicantIncome: z.number().min(0, 'Applicant income must be positive'),
  coapplicantIncome: z.number().min(0, 'Co-applicant income must be non-negative'),
  loanAmount: z.number().min(1000, 'Loan amount must be at least $1,000'),
  loanAmountTerm: z.number().min(12, 'Loan term must be at least 12 months'),
  creditHistory: z.number().min(0).max(1, 'Credit history must be 0 or 1'),
  gender: z.enum(['Male', 'Female']),
  married: z.enum(['Yes', 'No']),
  dependents: z.enum(['0', '1', '2', '3+']),
  education: z.enum(['Graduate', 'Not Graduate']),
  selfEmployed: z.enum(['Yes', 'No']),
  propertyArea: z.enum(['Urban', 'Rural', 'Semiurban']),
  userId: z.string().optional()
})

export type LoanApplicationData = z.infer<typeof loanApplicationSchema>

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input data
    const validatedData = loanApplicationSchema.parse(body)
    
    // Generate prediction using the service
    const predictionService = new LoanPredictionService()
    const prediction = await predictionService.generatePrediction(validatedData)
    
    // Save prediction to database
    const predictionRepo = new PredictionRepository()
    const savedPrediction = await predictionRepo.create({
      userId: validatedData.userId,
      applicantIncome: validatedData.applicantIncome,
      coapplicantIncome: validatedData.coapplicantIncome,
      loanAmount: validatedData.loanAmount,
      loanAmountTerm: validatedData.loanAmountTerm,
      creditHistory: validatedData.creditHistory,
      gender: validatedData.gender,
      married: validatedData.married,
      dependents: validatedData.dependents,
      education: validatedData.education,
      selfEmployed: validatedData.selfEmployed,
      propertyArea: validatedData.propertyArea,
      prediction: prediction.approved ? 'Approved' : 'Rejected',
      confidence: prediction.confidence,
      riskFactors: prediction.riskFactors,
      recommendations: prediction.recommendations
    })
    
    return NextResponse.json({
      success: true,
      data: {
        id: savedPrediction.id,
        prediction: prediction.approved ? 'Approved' : 'Rejected',
        confidence: prediction.confidence,
        riskFactors: prediction.riskFactors,
        recommendations: prediction.recommendations,
        createdAt: savedPrediction.createdAt
      }
    })
    
  } catch (error) {
    console.error('Loan prediction error:', error)
    
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        details: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      }, { status: 400 })
    }
    
    // Handle service errors
    if (error instanceof Error && error.message.includes('service')) {
      return NextResponse.json({
        success: false,
        error: 'Prediction service unavailable',
        message: 'Unable to generate loan prediction at this time'
      }, { status: 503 })
    }
    
    // Handle database errors
    if (error instanceof Error && error.message.includes('database')) {
      return NextResponse.json({
        success: false,
        error: 'Database error',
        message: 'Unable to save prediction'
      }, { status: 500 })
    }
    
    // Generic error response
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'An unexpected error occurred'
    }, { status: 500 })
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json({
    success: false,
    error: 'Method not allowed',
    message: 'This endpoint only accepts POST requests'
  }, { status: 405 })
}

export async function PUT() {
  return NextResponse.json({
    success: false,
    error: 'Method not allowed',
    message: 'This endpoint only accepts POST requests'
  }, { status: 405 })
}

export async function DELETE() {
  return NextResponse.json({
    success: false,
    error: 'Method not allowed',
    message: 'This endpoint only accepts POST requests'
  }, { status: 405 })
}