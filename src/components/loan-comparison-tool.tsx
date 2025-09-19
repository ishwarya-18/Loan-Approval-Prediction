"use client"

import { useState, useMemo, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Calculator, Download, Star, TrendingUp, TrendingDown, Plus, X, Filter, ArrowUpDown, ChevronDown, Building2, Car, CreditCard, Briefcase, DollarSign, Calendar, Percent, FileText, CheckCircle, AlertCircle, Info, LoaderCircle } from 'lucide-react'
import { motion } from 'motion/react'

interface LoanOption {
  id: string
  provider: string
  type: 'personal' | 'auto' | 'mortgage' | 'business'
  interestRate: number
  minCreditScore: number
  minAmount: number
  maxAmount: number
  minTerm: number
  maxTerm: number
  features: string[]
  processingTime: string
  fees: {
    origination: number
    processing: number
  }
  rating: number
  totalReviews: number
  isBestRate?: boolean
  isBestPayment?: boolean
}

interface UserRating {
  id: string
  loanId: string
  userId: string
  rating: number
  review?: string
  createdAt: string
}

// Mock function to simulate API call for ratings
const fetchLoanRatings = async (loanId: string): Promise<{ averageRating: number; totalReviews: number }> => {
  // In a real app, this would be an API call like:
  // const response = await fetch(`/api/loans/${loanId}/ratings`)
  // return response.json()
  
  // Simulated response
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({
        averageRating: Math.random() * 2 + 3, // Random rating between 3-5
        totalReviews: Math.floor(Math.random() * 500) + 50 // Random review count
      })
    }, 500)
  })
}

// Mock function to submit user rating
const submitUserRating = async (loanId: string, rating: number, review?: string): Promise<void> => {
  // In a real app, this would be an API call like:
  // await fetch('/api/ratings', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ loanId, rating, review, userId: currentUser.id })
  // })
  
  console.log('Submitting rating:', { loanId, rating, review })
  return new Promise(resolve => setTimeout(resolve, 1000))
}

const mockLoanOptions: LoanOption[] = [
  {
    id: '1',
    provider: 'TealBank',
    type: 'personal',
    interestRate: 5.99,
    minCreditScore: 680,
    minAmount: 1000,
    maxAmount: 50000,
    minTerm: 12,
    maxTerm: 60,
    features: ['No prepayment penalty', 'Fixed rate', 'Same-day funding'],
    processingTime: '1-2 days',
    fees: { origination: 0, processing: 0 },
    rating: 0,
    totalReviews: 0,
    isBestRate: true
  },
  {
    id: '2',
    provider: 'AmberCredit',
    type: 'personal',
    interestRate: 7.49,
    minCreditScore: 640,
    minAmount: 2000,
    maxAmount: 40000,
    minTerm: 24,
    maxTerm: 72,
    features: ['Flexible payments', 'Rate discount for autopay', 'No fees'],
    processingTime: '2-3 days',
    fees: { origination: 0, processing: 0 },
    rating: 0,
    totalReviews: 0
  },
  {
    id: '3',
    provider: 'QuickFunds',
    type: 'personal',
    interestRate: 8.29,
    minCreditScore: 600,
    minAmount: 500,
    maxAmount: 35000,
    minTerm: 12,
    maxTerm: 84,
    features: ['Bad credit OK', 'Fast approval', 'Soft credit check'],
    processingTime: 'Same day',
    fees: { origination: 1.5, processing: 0 },
    rating: 0,
    totalReviews: 0
  },
  {
    id: '4',
    provider: 'PremiumLending',
    type: 'personal',
    interestRate: 6.75,
    minCreditScore: 720,
    minAmount: 5000,
    maxAmount: 100000,
    minTerm: 24,
    maxTerm: 60,
    features: ['Premium rates', 'Dedicated support', 'Free credit monitoring'],
    processingTime: '1-2 days',
    fees: { origination: 0, processing: 25 },
    rating: 0,
    totalReviews: 0,
    isBestPayment: true
  }
]

export default function LoanComparisonTool() {
  const [selectedLoans, setSelectedLoans] = useState<string[]>(['1', '2'])
  const [loanAmount, setLoanAmount] = useState(25000)
  const [loanTerm, setLoanTerm] = useState(36)
  const [loanType, setLoanType] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'rate' | 'payment' | 'total'>('rate')
  const [creditScore, setCreditScore] = useState(700)
  const [showCalculator, setShowCalculator] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [userRatings, setUserRatings] = useState<Record<string, number>>({})
  const [showRatingModal, setShowRatingModal] = useState<string | null>(null)
  const [loanRatings, setLoanRatings] = useState<Record<string, { rating: number; totalReviews: number }>>({})
  const [userRating, setUserRating] = useState<Record<string, number>>({})
  const [submittingRating, setSubmittingRating] = useState(false)
  const [ratingComment, setRatingComment] = useState('')

  // Load ratings when component mounts or when loans change
  useEffect(() => {
    const loadRatings = async () => {
      const ratings: Record<string, { rating: number; totalReviews: number }> = {}
      
      for (const loan of mockLoanOptions) {
        try {
          const ratingData = await fetchLoanRatings(loan.id)
          ratings[loan.id] = ratingData
        } catch (error) {
          console.error(`Failed to load rating for loan ${loan.id}:`, error)
          ratings[loan.id] = { rating: 0, totalReviews: 0 }
        }
      }
      
      setLoanRatings(ratings)
    }

    loadRatings()
  }, [])

  // Get updated loan options with dynamic ratings
  const loansWithDynamicRatings = mockLoanOptions.map(loan => ({
    ...loan,
    rating: loanRatings[loan.id]?.rating || 0,
    totalReviews: loanRatings[loan.id]?.totalReviews || 0
  }))

  const filteredLoans = useMemo(() => {
    let filtered = loansWithDynamicRatings.filter(loan => {
      if (loanType !== 'all' && loan.type !== loanType) return false
      if (loanAmount < loan.minAmount || loanAmount > loan.maxAmount) return false
      if (creditScore < loan.minCreditScore) return false
      if (loanTerm < loan.minTerm || loanTerm > loan.maxTerm) return false
      return true
    })

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'rate':
          return a.interestRate - b.interestRate
        case 'payment':
          return calculateMonthlyPayment(a) - calculateMonthlyPayment(b)
        case 'total':
          return calculateTotalCost(a) - calculateTotalCost(b)
        default:
          return 0
      }
    })
  }, [loanType, loanAmount, creditScore, loanTerm, sortBy, loansWithDynamicRatings])

  const calculateMonthlyPayment = (loan: LoanOption) => {
    const principal = loanAmount
    const monthlyRate = loan.interestRate / 100 / 12
    const numPayments = loanTerm
    return (principal * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1)
  }

  const calculateTotalCost = (loan: LoanOption) => {
    const monthlyPayment = calculateMonthlyPayment(loan)
    const totalPayments = monthlyPayment * loanTerm
    const originationFee = loanAmount * (loan.fees.origination / 100)
    return totalPayments + originationFee + loan.fees.processing
  }

  const addLoanToComparison = (loanId: string) => {
    if (selectedLoans.length < 4 && !selectedLoans.includes(loanId)) {
      setSelectedLoans([...selectedLoans, loanId])
    }
  }

  const removeLoanFromComparison = (loanId: string) => {
    setSelectedLoans(selectedLoans.filter(id => id !== loanId))
  }

  const getLoanTypeIcon = (type: string) => {
    switch (type) {
      case 'personal': return <CreditCard className="w-4 h-4" />
      case 'auto': return <Car className="w-4 h-4" />
      case 'mortgage': return <Building2 className="w-4 h-4" />
      case 'business': return <Briefcase className="w-4 h-4" />
      default: return <CreditCard className="w-4 h-4" />
    }
  }

  const exportToPDF = () => {
    // PDF export functionality would be implemented here
    console.log('Exporting to PDF...')
  }

  const handleSubmitRating = async (loanId: string) => {
    const rating = userRating[loanId]
    if (!rating) return

    setSubmittingRating(true)
    try {
      await submitUserRating(loanId, rating, ratingComment)
      
      // Refresh the rating for this loan
      const updatedRating = await fetchLoanRatings(loanId)
      setLoanRatings(prev => ({
        ...prev,
        [loanId]: updatedRating
      }))
      
      setShowRatingModal(null)
      setRatingComment('')
      setUserRating(prev => ({ ...prev, [loanId]: 0 }))
    } catch (error) {
      console.error('Failed to submit rating:', error)
    } finally {
      setSubmittingRating(false)
    }
  }

  const StarRating = ({ rating, onRatingChange, readonly = false }: {
    rating: number
    onRatingChange?: (rating: number) => void
    readonly?: boolean
  }) => (
    <div className="flex items-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={`${
            readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'
          } transition-transform`}
          onClick={() => !readonly && onRatingChange?.(star)}
          disabled={readonly}
        >
          <Star
            className={`w-4 h-4 ${
              star <= rating
                ? 'fill-amber-400 text-amber-400'
                : 'text-gray-300'
            }`}
          />
        </button>
      ))}
    </div>
  )

  return (
    <div className="w-full max-w-7xl mx-auto p-6 bg-background space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Loan Comparison Tool</h1>
        <p className="text-muted-foreground">Compare loan options side by side to find the best deal for your needs</p>
      </div>

      {/* Controls */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-primary" />
            Loan Parameters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <Label htmlFor="loan-amount">Loan Amount</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  id="loan-amount"
                  type="number"
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(Number(e.target.value))}
                  className="pl-10"
                  placeholder="25000"
                />
              </div>
              <div className="px-3">
                <Slider
                  value={[loanAmount]}
                  onValueChange={(value) => setLoanAmount(value[0])}
                  max={100000}
                  min={1000}
                  step={1000}
                  className="w-full"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="loan-term">Term (months)</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  id="loan-term"
                  type="number"
                  value={loanTerm}
                  onChange={(e) => setLoanTerm(Number(e.target.value))}
                  className="pl-10"
                  placeholder="36"
                />
              </div>
              <div className="px-3">
                <Slider
                  value={[loanTerm]}
                  onValueChange={(value) => setLoanTerm(value[0])}
                  max={84}
                  min={12}
                  step={12}
                  className="w-full"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="credit-score">Credit Score</Label>
              <div className="relative">
                <Star className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  id="credit-score"
                  type="number"
                  value={creditScore}
                  onChange={(e) => setCreditScore(Number(e.target.value))}
                  className="pl-10"
                  placeholder="700"
                />
              </div>
              <div className="px-3">
                <Slider
                  value={[creditScore]}
                  onValueChange={(value) => setCreditScore(value[0])}
                  max={850}
                  min={300}
                  step={10}
                  className="w-full"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Loan Type</Label>
              <Select value={loanType} onValueChange={setLoanType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="personal">Personal</SelectItem>
                  <SelectItem value="auto">Auto</SelectItem>
                  <SelectItem value="mortgage">Mortgage</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 mt-6">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filters
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </Button>

            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rate">Interest Rate</SelectItem>
                <SelectItem value="payment">Monthly Payment</SelectItem>
                <SelectItem value="total">Total Cost</SelectItem>
              </SelectContent>
            </Select>

            <Dialog open={showCalculator} onOpenChange={setShowCalculator}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Calculator className="w-4 h-4" />
                  Advanced Calculator
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle>Advanced Loan Calculator</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Tabs defaultValue="payment" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="payment">Payment Calculator</TabsTrigger>
                      <TabsTrigger value="amortization">Amortization</TabsTrigger>
                      <TabsTrigger value="comparison">Cost Comparison</TabsTrigger>
                    </TabsList>
                    <TabsContent value="payment" className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-4">
                          <div>
                            <Label>Principal Amount</Label>
                            <Input value={`$${loanAmount.toLocaleString()}`} readOnly />
                          </div>
                          <div>
                            <Label>Term</Label>
                            <Input value={`${loanTerm} months`} readOnly />
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <Label>Monthly Payment</Label>
                            <div className="text-2xl font-bold text-primary">
                              ${filteredLoans.length > 0 ? calculateMonthlyPayment(filteredLoans[0]).toFixed(2) : '0.00'}
                            </div>
                          </div>
                          <div>
                            <Label>Total Interest</Label>
                            <div className="text-lg font-semibold text-secondary">
                              ${filteredLoans.length > 0 ? (calculateTotalCost(filteredLoans[0]) - loanAmount).toFixed(2) : '0.00'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                    <TabsContent value="amortization">
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">Amortization schedule would be displayed here</p>
                      </div>
                    </TabsContent>
                    <TabsContent value="comparison">
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">Detailed cost comparison would be displayed here</p>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </DialogContent>
            </Dialog>

            <Button onClick={exportToPDF} className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Loan Comparison Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
        {filteredLoans.filter(loan => selectedLoans.includes(loan.id)).map((loan) => (
          <motion.div
            key={loan.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="bg-card border-border h-full relative">
              <div className="absolute top-4 right-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeLoanFromComparison(loan.id)}
                  className="h-8 w-8 p-0 hover:bg-destructive/10"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getLoanTypeIcon(loan.type)}
                    <CardTitle className="text-lg">{loan.provider}</CardTitle>
                  </div>
                  <div className="flex items-center gap-1">
                    <StarRating rating={loan.rating} readonly />
                    <span className="text-sm font-medium">
                      {loan.rating > 0 ? loan.rating.toFixed(1) : 'No ratings'}
                    </span>
                    {loan.totalReviews > 0 && (
                      <span className="text-xs text-muted-foreground">
                        ({loan.totalReviews})
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  {loan.isBestRate && (
                    <Badge className="bg-primary/10 text-primary border-primary/20">
                      <TrendingDown className="w-3 h-3 mr-1" />
                      Best Rate
                    </Badge>
                  )}
                  {loan.isBestPayment && (
                    <Badge className="bg-secondary/10 text-secondary border-secondary/20">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      Best Payment
                    </Badge>
                  )}
                </div>

                <div className="mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowRatingModal(loan.id)}
                    className="w-full text-xs"
                  >
                    {userRatings[loan.id] ? 'Update Rating' : 'Rate this Lender'}
                    <Star className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="text-center py-4 bg-muted rounded-lg">
                  <div className="text-3xl font-bold text-primary flex items-center justify-center gap-1">
                    {loan.interestRate}%
                    <Percent className="w-6 h-6" />
                  </div>
                  <p className="text-sm text-muted-foreground">Interest Rate</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-xl font-bold text-foreground">
                      ${calculateMonthlyPayment(loan).toFixed(2)}
                    </div>
                    <p className="text-xs text-muted-foreground">Monthly Payment</p>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-foreground">
                      ${calculateTotalCost(loan).toFixed(0)}
                    </div>
                    <p className="text-xs text-muted-foreground">Total Cost</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Processing Time:</span>
                    <span className="font-medium">{loan.processingTime}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Min Credit Score:</span>
                    <span className="font-medium">{loan.minCreditScore}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Origination Fee:</span>
                    <span className="font-medium">{loan.fees.origination}%</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Key Features:</h4>
                  <ul className="space-y-1">
                    {loan.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-3 h-3 text-primary flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex gap-2">
                  <Button className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground">
                    Apply Now
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowRatingModal(loan.id)}
                    className="px-3"
                  >
                    <Star className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}

        {/* Add More Loans Card */}
        {selectedLoans.length < 4 && (
          <Card className="bg-card border-border border-dashed h-full flex items-center justify-center">
            <CardContent className="text-center py-8">
              <Plus className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">Add another loan to compare</p>
              <Select onValueChange={addLoanToComparison}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select loan to add" />
                </SelectTrigger>
                <SelectContent>
                  {filteredLoans
                    .filter(loan => !selectedLoans.includes(loan.id))
                    .map((loan) => (
                      <SelectItem key={loan.id} value={loan.id}>
                        {loan.provider} - {loan.interestRate}%
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Rating Modal */}
      {showRatingModal && (
        <Dialog open={!!showRatingModal} onOpenChange={() => setShowRatingModal(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rate this Lender</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Your Rating</Label>
                <div className="mt-2">
                  <StarRating
                    rating={userRating[showRatingModal] || 0}
                    onRatingChange={(rating) => 
                      setUserRating(prev => ({ ...prev, [showRatingModal]: rating }))
                    }
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="rating-comment">Comment (optional)</Label>
                <Textarea
                  id="rating-comment"
                  value={ratingComment}
                  onChange={(e) => setRatingComment(e.target.value)}
                  placeholder="Share your experience with this lender..."
                  className="mt-1"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleSubmitRating(showRatingModal)}
                  disabled={!userRating[showRatingModal] || submittingRating}
                  className="flex-1"
                >
                  {submittingRating ? (
                    <>
                      <LoaderCircle className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Rating'
                  )}
                </Button>
                <Button variant="outline" onClick={() => setShowRatingModal(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Available Loans List */}
      {filteredLoans.filter(loan => !selectedLoans.includes(loan.id)).length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Available Loans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredLoans
                .filter(loan => !selectedLoans.includes(loan.id))
                .map((loan) => (
                  <div
                    key={loan.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {getLoanTypeIcon(loan.type)}
                      <div>
                        <h4 className="font-medium">{loan.provider}</h4>
                        <p className="text-sm text-muted-foreground">
                          {loan.interestRate}% • ${calculateMonthlyPayment(loan).toFixed(2)}/mo
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addLoanToComparison(loan.id)}
                      disabled={selectedLoans.length >= 4}
                    >
                      Compare
                    </Button>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Statistics */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Comparison Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {filteredLoans.filter(loan => selectedLoans.includes(loan.id)).length > 0
                  ? Math.min(...filteredLoans.filter(loan => selectedLoans.includes(loan.id)).map(loan => loan.interestRate)).toFixed(2)
                  : '0.00'}%
              </div>
              <p className="text-sm text-muted-foreground">Lowest Interest Rate</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-secondary">
                $
                {filteredLoans.filter(loan => selectedLoans.includes(loan.id)).length > 0
                  ? Math.min(...filteredLoans.filter(loan => selectedLoans.includes(loan.id)).map(loan => calculateMonthlyPayment(loan))).toFixed(2)
                  : '0.00'}
              </div>
              <p className="text-sm text-muted-foreground">Lowest Monthly Payment</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">
                $
                {filteredLoans.filter(loan => selectedLoans.includes(loan.id)).length > 0
                  ? Math.min(...filteredLoans.filter(loan => selectedLoans.includes(loan.id)).map(loan => calculateTotalCost(loan))).toFixed(0)
                  : '0'}
              </div>
              <p className="text-sm text-muted-foreground">Lowest Total Cost</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}