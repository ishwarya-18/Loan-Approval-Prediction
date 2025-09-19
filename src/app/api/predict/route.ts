import { NextRequest, NextResponse } from 'next/server';

interface LoanApplicationData {
  applicant_name: string;
  loan_amount: number;
  annual_income: number;
  credit_score: number;
  employment_status: string;
  employment_length: number;
  loan_purpose: string;
  debt_to_income_ratio: number;
  existing_loans: number;
  collateral_value?: number;
  education_level: string;
  age: number;
  marital_status: string;
  number_dependents: number;
  property_ownership: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

interface MLPrediction {
  applicationId: string;
  approvalProbability: number;
  riskScore: number;
  decision: 'APPROVED' | 'REJECTED' | 'REVIEW_REQUIRED';
  reasons: string[];
  recommendedLoanAmount?: number;
  conditions?: string[];
}

interface APIResponse {
  success: boolean;
  data?: MLPrediction;
  error?: string;
  timestamp: string;
}

// Input validation functions
function validateLoanData(data: any): ValidationResult {
  const errors: string[] = [];

  // Required string fields
  if (!data.applicant_name || typeof data.applicant_name !== 'string' || data.applicant_name.trim().length === 0) {
    errors.push('Applicant name is required');
  }

  if (!data.employment_status || typeof data.employment_status !== 'string') {
    errors.push('Employment status is required');
  }

  if (!data.loan_purpose || typeof data.loan_purpose !== 'string') {
    errors.push('Loan purpose is required');
  }

  if (!data.education_level || typeof data.education_level !== 'string') {
    errors.push('Education level is required');
  }

  if (!data.marital_status || typeof data.marital_status !== 'string') {
    errors.push('Marital status is required');
  }

  if (!data.property_ownership || typeof data.property_ownership !== 'string') {
    errors.push('Property ownership is required');
  }

  // Numeric validations
  const loanAmount = parseFloat(data.loan_amount);
  if (isNaN(loanAmount) || loanAmount <= 0 || loanAmount > 10000000) {
    errors.push('Loan amount must be between $1 and $10,000,000');
  }

  const annualIncome = parseFloat(data.annual_income);
  if (isNaN(annualIncome) || annualIncome < 0 || annualIncome > 10000000) {
    errors.push('Annual income must be between $0 and $10,000,000');
  }

  const creditScore = parseInt(data.credit_score);
  if (isNaN(creditScore) || creditScore < 300 || creditScore > 850) {
    errors.push('Credit score must be between 300 and 850');
  }

  const employmentLength = parseFloat(data.employment_length);
  if (isNaN(employmentLength) || employmentLength < 0 || employmentLength > 50) {
    errors.push('Employment length must be between 0 and 50 years');
  }

  const debtToIncomeRatio = parseFloat(data.debt_to_income_ratio);
  if (isNaN(debtToIncomeRatio) || debtToIncomeRatio < 0 || debtToIncomeRatio > 100) {
    errors.push('Debt-to-income ratio must be between 0% and 100%');
  }

  const existingLoans = parseInt(data.existing_loans);
  if (isNaN(existingLoans) || existingLoans < 0 || existingLoans > 50) {
    errors.push('Number of existing loans must be between 0 and 50');
  }

  const age = parseInt(data.age);
  if (isNaN(age) || age < 18 || age > 100) {
    errors.push('Age must be between 18 and 100');
  }

  const numberDependents = parseInt(data.number_dependents);
  if (isNaN(numberDependents) || numberDependents < 0 || numberDependents > 20) {
    errors.push('Number of dependents must be between 0 and 20');
  }

  // Optional collateral value validation
  if (data.collateral_value !== undefined && data.collateral_value !== null && data.collateral_value !== '') {
    const collateralValue = parseFloat(data.collateral_value);
    if (isNaN(collateralValue) || collateralValue < 0) {
      errors.push('Collateral value must be a positive number');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Simplified ML scoring algorithm
function calculateMLPrediction(data: LoanApplicationData): MLPrediction {
  const reasons: string[] = [];
  const conditions: string[] = [];
  let score = 0;
  let maxScore = 0;

  // Credit Score (30% weight)
  maxScore += 30;
  if (data.credit_score >= 750) {
    score += 30;
    reasons.push('Excellent credit score');
  } else if (data.credit_score >= 700) {
    score += 25;
    reasons.push('Good credit score');
  } else if (data.credit_score >= 650) {
    score += 20;
    reasons.push('Fair credit score');
  } else if (data.credit_score >= 600) {
    score += 15;
    reasons.push('Below average credit score');
  } else {
    score += 5;
    reasons.push('Poor credit score');
  }

  // Debt-to-Income Ratio (25% weight)
  maxScore += 25;
  if (data.debt_to_income_ratio <= 20) {
    score += 25;
    reasons.push('Excellent debt-to-income ratio');
  } else if (data.debt_to_income_ratio <= 30) {
    score += 20;
    reasons.push('Good debt-to-income ratio');
  } else if (data.debt_to_income_ratio <= 40) {
    score += 15;
    reasons.push('Acceptable debt-to-income ratio');
  } else if (data.debt_to_income_ratio <= 50) {
    score += 10;
    reasons.push('High debt-to-income ratio');
    conditions.push('Consider debt consolidation');
  } else {
    score += 0;
    reasons.push('Very high debt-to-income ratio');
  }

  // Income vs Loan Amount (20% weight)
  const incomeToLoanRatio = (data.annual_income / data.loan_amount) * 100;
  maxScore += 20;
  if (incomeToLoanRatio >= 300) {
    score += 20;
    reasons.push('Strong income relative to loan amount');
  } else if (incomeToLoanRatio >= 200) {
    score += 16;
    reasons.push('Good income relative to loan amount');
  } else if (incomeToLoanRatio >= 150) {
    score += 12;
    reasons.push('Adequate income relative to loan amount');
  } else if (incomeToLoanRatio >= 100) {
    score += 8;
    reasons.push('Marginal income relative to loan amount');
  } else {
    score += 2;
    reasons.push('Low income relative to loan amount');
  }

  // Employment Stability (15% weight)
  maxScore += 15;
  if (data.employment_status === 'Employed' || data.employment_status === 'Self-employed') {
    if (data.employment_length >= 5) {
      score += 15;
      reasons.push('Stable long-term employment');
    } else if (data.employment_length >= 2) {
      score += 12;
      reasons.push('Good employment history');
    } else if (data.employment_length >= 1) {
      score += 8;
      reasons.push('Recent employment history');
    } else {
      score += 5;
      reasons.push('Limited employment history');
      conditions.push('Provide additional income verification');
    }
  } else {
    score += 0;
    reasons.push('Unemployed or retired');
  }

  // Existing Loans (10% weight)
  maxScore += 10;
  if (data.existing_loans === 0) {
    score += 10;
    reasons.push('No existing loan obligations');
  } else if (data.existing_loans <= 2) {
    score += 8;
    reasons.push('Minimal existing loan obligations');
  } else if (data.existing_loans <= 4) {
    score += 5;
    reasons.push('Moderate existing loan obligations');
  } else {
    score += 2;
    reasons.push('High number of existing loans');
  }

  // Collateral bonus (if applicable)
  if (data.collateral_value && data.collateral_value >= data.loan_amount * 0.8) {
    score += 5;
    reasons.push('Strong collateral coverage');
  }

  // Age factor
  if (data.age >= 25 && data.age <= 55) {
    score += 2;
    reasons.push('Prime age demographic');
  }

  // Education level bonus
  if (data.education_level === 'Bachelor\s Degree' || data.education_level === 'Master\s Degree' || data.education_level === 'PhD') {
    score += 2;
    reasons.push('Higher education level');
  }

  // Calculate approval probability
  const approvalProbability = Math.round((score / maxScore) * 100);
  const riskScore = 100 - approvalProbability;

  // Determine decision
  let decision: 'APPROVED' | 'REJECTED' | 'REVIEW_REQUIRED';
  if (approvalProbability >= 75) {
    decision = 'APPROVED';
  } else if (approvalProbability >= 50) {
    decision = 'REVIEW_REQUIRED';
    conditions.push('Manual underwriting review required');
  } else {
    decision = 'REJECTED';
  }

  // Calculate recommended loan amount for marginal cases
  let recommendedLoanAmount: number | undefined;
  if (decision === 'REVIEW_REQUIRED' && approvalProbability >= 60) {
    recommendedLoanAmount = Math.round(data.loan_amount * 0.8);
    conditions.push(`Consider reducing loan amount to $${recommendedLoanAmount.toLocaleString()}`);
  }

  return {
    applicationId: `APP_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
    approvalProbability,
    riskScore,
    decision,
    reasons,
    recommendedLoanAmount,
    conditions: conditions.length > 0 ? conditions : undefined
  };
}

export async function POST(request: NextRequest): Promise<NextResponse<APIResponse>> {
  const startTime = Date.now();
  
  try {
    console.log('🔍 ML Prediction API: Processing loan application request');

    // Parse request body
    let requestData;
    try {
      requestData = await request.json();
      console.log('📊 Received application data:', {
        applicantName: requestData.applicant_name,
        loanAmount: requestData.loan_amount,
        creditScore: requestData.credit_score
      });
    } catch (error) {
      console.error('❌ Invalid JSON in request body:', error);
      return NextResponse.json({
        success: false,
        error: 'Invalid JSON format in request body',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // Validate input data
    const validation = validateLoanData(requestData);
    if (!validation.isValid) {
      console.error('❌ Validation failed:', validation.errors);
      return NextResponse.json({
        success: false,
        error: `Validation failed: ${validation.errors.join(', ')}`,
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // Convert and normalize data
    const loanData: LoanApplicationData = {
      applicant_name: requestData.applicant_name?.trim(),
      loan_amount: parseFloat(requestData.loan_amount),
      annual_income: parseFloat(requestData.annual_income),
      credit_score: parseInt(requestData.credit_score),
      employment_status: requestData.employment_status?.trim(),
      employment_length: parseFloat(requestData.employment_length),
      loan_purpose: requestData.loan_purpose?.trim(),
      debt_to_income_ratio: parseFloat(requestData.debt_to_income_ratio),
      existing_loans: parseInt(requestData.existing_loans),
      collateral_value: requestData.collateral_value ? parseFloat(requestData.collateral_value) : undefined,
      education_level: requestData.education_level?.trim(),
      age: parseInt(requestData.age),
      marital_status: requestData.marital_status?.trim(),
      number_dependents: parseInt(requestData.number_dependents),
      property_ownership: requestData.property_ownership?.trim()
    };

    console.log('🤖 Running ML prediction algorithm...');

    // Run ML prediction
    const prediction = calculateMLPrediction(loanData);

    const processingTime = Date.now() - startTime;
    console.log(`✅ ML Prediction completed in ${processingTime}ms:`, {
      applicationId: prediction.applicationId,
      decision: prediction.decision,
      approvalProbability: prediction.approvalProbability,
      riskScore: prediction.riskScore
    });

    // Log for analytics and monitoring
    console.log('📈 Prediction Analytics:', {
      applicantName: loanData.applicant_name,
      loanAmount: loanData.loan_amount,
      creditScore: loanData.credit_score,
      decision: prediction.decision,
      approvalProbability: prediction.approvalProbability,
      processingTimeMs: processingTime
    });

    return NextResponse.json({
      success: true,
      data: prediction,
      timestamp: new Date().toISOString()
    }, { status: 200 });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('💥 ML Prediction API Error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      processingTimeMs: processingTime
    });

    return NextResponse.json({
      success: false,
      error: 'Internal server error occurred while processing the loan application',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET(): Promise<NextResponse<APIResponse>> {
  return NextResponse.json({
    success: false,
    error: 'Method not allowed. Use POST to submit loan application data.',
    timestamp: new Date().toISOString()
  }, { status: 405 });
}