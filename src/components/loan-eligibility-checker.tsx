"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { motion } from "motion/react"
import { 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle, 
  DollarSign, 
  User, 
  FileText, 
  CreditCard,
  Star,
  TrendingUp,
  Shield,
  AlertCircle,
  LoaderCircle
} from "lucide-react"

interface PersonalInfo {
  fullName: string
  email: string
  phone: string
  dateOfBirth: string
  employmentStatus: string
  annualIncome: number
}

interface LoanDetails {
  loanAmount: number
  loanPurpose: string
  loanTerm: number
}

interface FinancialInfo {
  monthlyExpenses: number
  existingDebts: number
  creditScore: number
  assetsValue: number
}

interface FormData {
  personalInfo: PersonalInfo
  loanDetails: LoanDetails
  financialInfo: FinancialInfo
  termsAccepted: boolean
}

const steps = [
  { id: 1, title: "Personal Information", icon: User },
  { id: 2, title: "Loan Details", icon: DollarSign },
  { id: 3, title: "Financial Information", icon: CreditCard },
  { id: 4, title: "Review & Submit", icon: FileText }
]

const loanPurposes = [
  { value: "home", label: "Home Purchase" },
  { value: "car", label: "Car Purchase" },
  { value: "business", label: "Business Loan" },
  { value: "personal", label: "Personal Loan" },
  { value: "education", label: "Education" },
  { value: "debt-consolidation", label: "Debt Consolidation" },
  { value: "home-improvement", label: "Home Improvement" },
  { value: "other", label: "Other" }
]

const employmentStatuses = [
  { value: "employed", label: "Employed Full-time" },
  { value: "self-employed", label: "Self-employed" },
  { value: "part-time", label: "Part-time" },
  { value: "unemployed", label: "Unemployed" },
  { value: "student", label: "Student" },
  { value: "retired", label: "Retired" }
]

const loanTerms = [
  { value: 12, label: "12 months" },
  { value: 24, label: "24 months" },
  { value: 36, label: "36 months" },
  { value: 48, label: "48 months" },
  { value: 60, label: "60 months" }
]

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

const calculateEligibilityScore = (data: Partial<FormData>) => {
  let score = 0
  
  // Income to loan ratio
  if (data.personalInfo?.annualIncome && data.loanDetails?.loanAmount) {
    const ratio = data.loanDetails.loanAmount / data.personalInfo.annualIncome
    if (ratio < 0.3) score += 30
    else if (ratio < 0.5) score += 20
    else if (ratio < 0.8) score += 10
  }
  
  // Credit score
  if (data.financialInfo?.creditScore) {
    if (data.financialInfo.creditScore >= 750) score += 25
    else if (data.financialInfo.creditScore >= 700) score += 20
    else if (data.financialInfo.creditScore >= 650) score += 15
    else if (data.financialInfo.creditScore >= 600) score += 10
    else score += 5
  }
  
  // Debt to income ratio
  if (data.personalInfo?.annualIncome && data.financialInfo?.monthlyExpenses && data.financialInfo?.existingDebts) {
    const monthlyIncome = data.personalInfo.annualIncome / 12
    const totalMonthlyDebts = data.financialInfo.monthlyExpenses + data.financialInfo.existingDebts
    const debtRatio = totalMonthlyDebts / monthlyIncome
    if (debtRatio < 0.3) score += 25
    else if (debtRatio < 0.4) score += 20
    else if (debtRatio < 0.5) score += 15
    else if (debtRatio < 0.6) score += 10
    else score += 5
  }
  
  // Employment status
  if (data.personalInfo?.employmentStatus) {
    if (data.personalInfo.employmentStatus === 'employed') score += 15
    else if (data.personalInfo.employmentStatus === 'self-employed') score += 12
    else if (data.personalInfo.employmentStatus === 'part-time') score += 8
    else score += 3
  }
  
  // Assets
  if (data.financialInfo?.assetsValue && data.loanDetails?.loanAmount) {
    const assetRatio = data.financialInfo.assetsValue / data.loanDetails.loanAmount
    if (assetRatio >= 1) score += 5
    else if (assetRatio >= 0.5) score += 3
    else if (assetRatio >= 0.2) score += 1
  }
  
  return Math.min(100, score)
}

export default function LoanEligibilityChecker() {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<FormData>({
    personalInfo: {
      fullName: '',
      email: '',
      phone: '',
      dateOfBirth: '',
      employmentStatus: '',
      annualIncome: 0
    },
    loanDetails: {
      loanAmount: 50000,
      loanPurpose: '',
      loanTerm: 36
    },
    financialInfo: {
      monthlyExpenses: 0,
      existingDebts: 0,
      creditScore: 700,
      assetsValue: 0
    },
    termsAccepted: false
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [eligibilityResult, setEligibilityResult] = useState<{
    approved: boolean
    score: number
    probability: number
    recommendedAmount: number
    recommendedTerm: number
    interestRate: number
  } | null>(null)

  const eligibilityScore = calculateEligibilityScore(formData)

  const validateStep = (step: number) => {
    const newErrors: Record<string, string> = {}
    
    switch (step) {
      case 1:
        if (!formData.personalInfo.fullName) newErrors.fullName = "Full name is required"
        if (!formData.personalInfo.email) newErrors.email = "Email is required"
        if (!formData.personalInfo.phone) newErrors.phone = "Phone number is required"
        if (!formData.personalInfo.dateOfBirth) newErrors.dateOfBirth = "Date of birth is required"
        if (!formData.personalInfo.employmentStatus) newErrors.employmentStatus = "Employment status is required"
        if (!formData.personalInfo.annualIncome) newErrors.annualIncome = "Annual income is required"
        break
      case 2:
        if (!formData.loanDetails.loanAmount) newErrors.loanAmount = "Loan amount is required"
        if (!formData.loanDetails.loanPurpose) newErrors.loanPurpose = "Loan purpose is required"
        if (!formData.loanDetails.loanTerm) newErrors.loanTerm = "Loan term is required"
        break
      case 3:
        if (!formData.financialInfo.monthlyExpenses) newErrors.monthlyExpenses = "Monthly expenses are required"
        if (!formData.financialInfo.creditScore) newErrors.creditScore = "Credit score is required"
        break
      case 4:
        if (!formData.termsAccepted) newErrors.termsAccepted = "You must accept the terms and conditions"
        break
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    setCurrentStep(currentStep - 1)
  }

  const handleSubmit = async () => {
    if (!validateStep(4)) return
    
    setIsSubmitting(true)
    
    // Simulate ML prediction
    setTimeout(() => {
      const score = calculateEligibilityScore(formData)
      const probability = Math.min(95, Math.max(5, score + Math.random() * 10 - 5))
      const approved = probability >= 60
      
      setEligibilityResult({
        approved,
        score,
        probability,
        recommendedAmount: approved ? formData.loanDetails.loanAmount : Math.floor(formData.loanDetails.loanAmount * 0.7),
        recommendedTerm: approved ? formData.loanDetails.loanTerm : Math.max(formData.loanDetails.loanTerm + 12, 60),
        interestRate: approved ? 5.5 + (100 - score) / 20 : 8.5 + (100 - score) / 10
      })
      
      setIsSubmitting(false)
      setShowResults(true)
    }, 3000)
  }

  const updatePersonalInfo = (field: keyof PersonalInfo, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      personalInfo: { ...prev.personalInfo, [field]: value }
    }))
  }

  const updateLoanDetails = (field: keyof LoanDetails, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      loanDetails: { ...prev.loanDetails, [field]: value }
    }))
  }

  const updateFinancialInfo = (field: keyof FinancialInfo, value: number) => {
    setFormData(prev => ({
      ...prev,
      financialInfo: { ...prev.financialInfo, [field]: value }
    }))
  }

  if (showResults && eligibilityResult) {
    return (
      <div className="bg-card min-h-screen p-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Card className="bg-card border-border">
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  {eligibilityResult.approved ? (
                    <CheckCircle className="w-16 h-16 text-primary" />
                  ) : (
                    <AlertCircle className="w-16 h-16 text-warning" />
                  )}
                </div>
                <CardTitle className="text-2xl font-bold text-foreground">
                  {eligibilityResult.approved ? "Congratulations!" : "Application Under Review"}
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  {eligibilityResult.approved 
                    ? "Your loan application has been pre-approved"
                    : "Your application requires additional review"
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-primary" />
                      <span className="font-medium text-foreground">Eligibility Score</span>
                    </div>
                    <div className="relative">
                      <Progress value={eligibilityResult.probability} className="h-3" />
                      <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-foreground">
                        {eligibilityResult.probability.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Star className="w-5 h-5 text-secondary" />
                      <span className="font-medium text-foreground">Recommended Terms</span>
                    </div>
                    <div className="bg-muted rounded-lg p-3 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Amount:</span>
                        <span className="font-medium text-foreground">{formatCurrency(eligibilityResult.recommendedAmount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Term:</span>
                        <span className="font-medium text-foreground">{eligibilityResult.recommendedTerm} months</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Interest Rate:</span>
                        <span className="font-medium text-foreground">{eligibilityResult.interestRate.toFixed(1)}% APR</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="border-t border-border pt-6">
                  <h3 className="font-semibold text-foreground mb-3">Application Summary</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Requested Amount:</span>
                      <span className="ml-2 font-medium text-foreground">{formatCurrency(formData.loanDetails.loanAmount)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Purpose:</span>
                      <span className="ml-2 font-medium text-foreground">
                        {loanPurposes.find(p => p.value === formData.loanDetails.loanPurpose)?.label}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Annual Income:</span>
                      <span className="ml-2 font-medium text-foreground">{formatCurrency(formData.personalInfo.annualIncome)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Credit Score:</span>
                      <span className="ml-2 font-medium text-foreground">{formData.financialInfo.creditScore}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-4 pt-4">
                  <Button 
                    onClick={() => window.location.reload()} 
                    variant="outline" 
                    className="flex-1"
                  >
                    Start New Application
                  </Button>
                  {eligibilityResult.approved && (
                    <Button className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">
                      <Shield className="w-4 h-4 mr-2" />
                      Proceed to Full Application
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-card min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Loan Eligibility Checker</h1>
          <p className="text-muted-foreground">Complete the form to check your loan eligibility instantly</p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row items-center justify-between mb-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    currentStep >= step.id
                      ? 'bg-primary border-primary text-primary-foreground'
                      : 'border-border text-muted-foreground'
                  }`}
                >
                  {currentStep > step.id ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <step.icon className="w-5 h-5" />
                  )}
                </div>
                <div className="ml-3 hidden md:block">
                  <div className={`text-sm font-medium ${
                    currentStep >= step.id ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                    {step.title}
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden md:block w-16 h-0.5 bg-border mx-4" />
                )}
              </div>
            ))}
          </div>
          <Progress value={(currentStep / steps.length) * 100} className="h-2" />
        </div>

        {/* Eligibility Score Preview */}
        {currentStep > 1 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card className="bg-muted border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    <span className="font-medium text-foreground">Current Eligibility Score</span>
                  </div>
                  <div className="text-2xl font-bold text-primary">
                    {eligibilityScore}%
                  </div>
                </div>
                <Progress value={eligibilityScore} className="mt-2 h-2" />
              </CardContent>
            </Card>
          </motion.div>
        )}

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-foreground">
              {steps[currentStep - 1].title}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {currentStep === 1 && "Please provide your personal information"}
              {currentStep === 2 && "Tell us about your loan requirements"}
              {currentStep === 3 && "Share your financial details"}
              {currentStep === 4 && "Review your information before submitting"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="fullName" className="text-foreground">Full Name</Label>
                      <Input
                        id="fullName"
                        value={formData.personalInfo.fullName}
                        onChange={(e) => updatePersonalInfo('fullName', e.target.value)}
                        className="mt-1 bg-card border-input text-foreground"
                        placeholder="Enter your full name"
                      />
                      {errors.fullName && <p className="text-destructive text-sm mt-1">{errors.fullName}</p>}
                    </div>
                    <div>
                      <Label htmlFor="email" className="text-foreground">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.personalInfo.email}
                        onChange={(e) => updatePersonalInfo('email', e.target.value)}
                        className="mt-1 bg-card border-input text-foreground"
                        placeholder="Enter your email"
                      />
                      {errors.email && <p className="text-destructive text-sm mt-1">{errors.email}</p>}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phone" className="text-foreground">Phone Number</Label>
                      <Input
                        id="phone"
                        value={formData.personalInfo.phone}
                        onChange={(e) => updatePersonalInfo('phone', e.target.value)}
                        className="mt-1 bg-card border-input text-foreground"
                        placeholder="Enter your phone number"
                      />
                      {errors.phone && <p className="text-destructive text-sm mt-1">{errors.phone}</p>}
                    </div>
                    <div>
                      <Label htmlFor="dateOfBirth" className="text-foreground">Date of Birth</Label>
                      <Input
                        id="dateOfBirth"
                        type="date"
                        value={formData.personalInfo.dateOfBirth}
                        onChange={(e) => updatePersonalInfo('dateOfBirth', e.target.value)}
                        className="mt-1 bg-card border-input text-foreground"
                      />
                      {errors.dateOfBirth && <p className="text-destructive text-sm mt-1">{errors.dateOfBirth}</p>}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="employmentStatus" className="text-foreground">Employment Status</Label>
                      <Select value={formData.personalInfo.employmentStatus} onValueChange={(value) => updatePersonalInfo('employmentStatus', value)}>
                        <SelectTrigger className="mt-1 bg-card border-input text-foreground">
                          <SelectValue placeholder="Select employment status" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border">
                          {employmentStatuses.map(status => (
                            <SelectItem key={status.value} value={status.value} className="text-popover-foreground">
                              {status.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.employmentStatus && <p className="text-destructive text-sm mt-1">{errors.employmentStatus}</p>}
                    </div>
                    <div>
                      <Label htmlFor="annualIncome" className="text-foreground">Annual Income</Label>
                      <Input
                        id="annualIncome"
                        type="number"
                        value={formData.personalInfo.annualIncome || ''}
                        onChange={(e) => updatePersonalInfo('annualIncome', Number(e.target.value))}
                        className="mt-1 bg-card border-input text-foreground"
                        placeholder="Enter annual income"
                      />
                      {errors.annualIncome && <p className="text-destructive text-sm mt-1">{errors.annualIncome}</p>}
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-6">
                  <div>
                    <Label className="text-foreground">Loan Amount</Label>
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">$10,000</span>
                        <span className="text-2xl font-bold text-primary">
                          {formatCurrency(formData.loanDetails.loanAmount)}
                        </span>
                        <span className="text-sm text-muted-foreground">$500,000</span>
                      </div>
                      <Slider
                        value={[formData.loanDetails.loanAmount]}
                        onValueChange={(value) => updateLoanDetails('loanAmount', value[0])}
                        max={500000}
                        min={10000}
                        step={1000}
                        className="w-full"
                      />
                    </div>
                    {errors.loanAmount && <p className="text-destructive text-sm mt-1">{errors.loanAmount}</p>}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="loanPurpose" className="text-foreground">Loan Purpose</Label>
                      <Select value={formData.loanDetails.loanPurpose} onValueChange={(value) => updateLoanDetails('loanPurpose', value)}>
                        <SelectTrigger className="mt-1 bg-card border-input text-foreground">
                          <SelectValue placeholder="Select loan purpose" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border">
                          {loanPurposes.map(purpose => (
                            <SelectItem key={purpose.value} value={purpose.value} className="text-popover-foreground">
                              {purpose.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.loanPurpose && <p className="text-destructive text-sm mt-1">{errors.loanPurpose}</p>}
                    </div>
                    <div>
                      <Label htmlFor="loanTerm" className="text-foreground">Loan Term</Label>
                      <Select value={formData.loanDetails.loanTerm.toString()} onValueChange={(value) => updateLoanDetails('loanTerm', Number(value))}>
                        <SelectTrigger className="mt-1 bg-card border-input text-foreground">
                          <SelectValue placeholder="Select loan term" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border">
                          {loanTerms.map(term => (
                            <SelectItem key={term.value} value={term.value.toString()} className="text-popover-foreground">
                              {term.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.loanTerm && <p className="text-destructive text-sm mt-1">{errors.loanTerm}</p>}
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="monthlyExpenses" className="text-foreground">Monthly Expenses</Label>
                      <Input
                        id="monthlyExpenses"
                        type="number"
                        value={formData.financialInfo.monthlyExpenses || ''}
                        onChange={(e) => updateFinancialInfo('monthlyExpenses', Number(e.target.value))}
                        className="mt-1 bg-card border-input text-foreground"
                        placeholder="Enter monthly expenses"
                      />
                      {errors.monthlyExpenses && <p className="text-destructive text-sm mt-1">{errors.monthlyExpenses}</p>}
                    </div>
                    <div>
                      <Label htmlFor="existingDebts" className="text-foreground">Existing Debts (Monthly)</Label>
                      <Input
                        id="existingDebts"
                        type="number"
                        value={formData.financialInfo.existingDebts || ''}
                        onChange={(e) => updateFinancialInfo('existingDebts', Number(e.target.value))}
                        className="mt-1 bg-card border-input text-foreground"
                        placeholder="Enter existing monthly debts"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-foreground">Credit Score Range</Label>
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Poor (300)</span>
                        <span className="text-xl font-bold text-primary">
                          {formData.financialInfo.creditScore}
                        </span>
                        <span className="text-sm text-muted-foreground">Excellent (850)</span>
                      </div>
                      <Slider
                        value={[formData.financialInfo.creditScore]}
                        onValueChange={(value) => updateFinancialInfo('creditScore', value[0])}
                        max={850}
                        min={300}
                        step={10}
                        className="w-full"
                      />
                    </div>
                    {errors.creditScore && <p className="text-destructive text-sm mt-1">{errors.creditScore}</p>}
                  </div>
                  
                  <div>
                    <Label htmlFor="assetsValue" className="text-foreground">Total Assets Value</Label>
                    <Input
                      id="assetsValue"
                      type="number"
                      value={formData.financialInfo.assetsValue || ''}
                      onChange={(e) => updateFinancialInfo('assetsValue', Number(e.target.value))}
                      className="mt-1 bg-card border-input text-foreground"
                      placeholder="Enter total assets value"
                    />
                  </div>
                </div>
              )}

              {currentStep === 4 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-4">Application Summary</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Full Name:</span>
                          <span className="font-medium text-foreground">{formData.personalInfo.fullName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Email:</span>
                          <span className="font-medium text-foreground">{formData.personalInfo.email}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Employment:</span>
                          <span className="font-medium text-foreground">
                            {employmentStatuses.find(s => s.value === formData.personalInfo.employmentStatus)?.label}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Annual Income:</span>
                          <span className="font-medium text-foreground">{formatCurrency(formData.personalInfo.annualIncome)}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Loan Amount:</span>
                          <span className="font-medium text-foreground">{formatCurrency(formData.loanDetails.loanAmount)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Purpose:</span>
                          <span className="font-medium text-foreground">
                            {loanPurposes.find(p => p.value === formData.loanDetails.loanPurpose)?.label}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Term:</span>
                          <span className="font-medium text-foreground">{formData.loanDetails.loanTerm} months</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Credit Score:</span>
                          <span className="font-medium text-foreground">{formData.financialInfo.creditScore}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-t border-border pt-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="terms"
                        checked={formData.termsAccepted}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, termsAccepted: checked as boolean }))}
                      />
                      <Label htmlFor="terms" className="text-sm text-foreground">
                        I agree to the <a href="#" className="text-primary hover:underline">Terms and Conditions</a> and <a href="#" className="text-primary hover:underline">Privacy Policy</a>
                      </Label>
                    </div>
                    {errors.termsAccepted && <p className="text-destructive text-sm mt-1">{errors.termsAccepted}</p>}
                  </div>
                </div>
              )}
            </motion.div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          
          {currentStep < 4 ? (
            <Button
              onClick={handleNext}
              className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isSubmitting ? (
                <>
                  <LoaderCircle className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  Submit Application
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}