"use client"

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Home, 
  Car, 
  User, 
  Building, 
  GraduationCap, 
  CreditCard,
  ChevronDown,
  ChevronUp,
  Filter,
  Calculator,
  CheckCircle,
  ArrowRight,
  DollarSign,
  Clock,
  FileText,
  Shield
} from 'lucide-react'
import { motion, AnimatePresence } from "motion/react"

interface LoanType {
  id: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  keyFeatures: string[]
  loanAmounts: string
  terms: string
  eligibility: string[]
  interestRates: string
  applicationProcess: string[]
  category: string
  minCreditScore: number
  maxAmount: number
}

const loanTypes: LoanType[] = [
  {
    id: 'personal',
    title: 'Personal Loans',
    description: 'Unsecured loans for flexible personal use',
    icon: User,
    keyFeatures: [
      'No collateral required',
      'Fixed interest rates',
      'Flexible repayment terms',
      'Quick approval process'
    ],
    loanAmounts: '$1,000 - $50,000',
    terms: '12 - 84 months',
    eligibility: [
      'Credit score 580+',
      'Steady income verification',
      'Debt-to-income ratio under 40%'
    ],
    interestRates: '5.99% - 35.99% APR',
    applicationProcess: [
      'Online application (5 minutes)',
      'Document verification',
      'Instant decision',
      'Funds in 1-2 business days'
    ],
    category: 'personal',
    minCreditScore: 580,
    maxAmount: 50000
  },
  {
    id: 'home',
    title: 'Home Loans',
    description: 'Mortgages and refinancing options',
    icon: Home,
    keyFeatures: [
      'Competitive interest rates',
      'Various loan programs',
      'Down payment assistance',
      'Refinancing options'
    ],
    loanAmounts: '$50,000 - $2,000,000',
    terms: '15 - 30 years',
    eligibility: [
      'Credit score 620+',
      'Stable employment history',
      'Down payment 3-20%',
      'Property appraisal required'
    ],
    interestRates: '3.25% - 7.50% APR',
    applicationProcess: [
      'Pre-qualification',
      'Full application with documents',
      'Property appraisal',
      'Underwriting review',
      'Closing process'
    ],
    category: 'secured',
    minCreditScore: 620,
    maxAmount: 2000000
  },
  {
    id: 'auto',
    title: 'Auto Loans',
    description: 'Financing for new and used vehicles',
    icon: Car,
    keyFeatures: [
      'New and used vehicle financing',
      'Competitive rates',
      'Flexible terms',
      'No prepayment penalties'
    ],
    loanAmounts: '$5,000 - $150,000',
    terms: '24 - 84 months',
    eligibility: [
      'Credit score 550+',
      'Proof of income',
      'Valid driver\'s license',
      'Insurance requirements'
    ],
    interestRates: '2.99% - 18.99% APR',
    applicationProcess: [
      'Online pre-approval',
      'Vehicle selection',
      'Final loan approval',
      'Dealership coordination'
    ],
    category: 'secured',
    minCreditScore: 550,
    maxAmount: 150000
  },
  {
    id: 'business',
    title: 'Business Loans',
    description: 'Startup and expansion funding',
    icon: Building,
    keyFeatures: [
      'Working capital solutions',
      'Equipment financing',
      'SBA loan programs',
      'Business lines of credit'
    ],
    loanAmounts: '$10,000 - $500,000',
    terms: '6 months - 10 years',
    eligibility: [
      'Business credit score 650+',
      'Minimum 2 years in business',
      'Annual revenue $100,000+',
      'Financial statements required'
    ],
    interestRates: '4.50% - 25.00% APR',
    applicationProcess: [
      'Business assessment',
      'Financial documentation',
      'Credit evaluation',
      'Loan structuring',
      'Funding'
    ],
    category: 'business',
    minCreditScore: 650,
    maxAmount: 500000
  },
  {
    id: 'student',
    title: 'Student Loans',
    description: 'Education financing solutions',
    icon: GraduationCap,
    keyFeatures: [
      'Undergraduate and graduate loans',
      'Deferred payment options',
      'Competitive interest rates',
      'Flexible repayment plans'
    ],
    loanAmounts: '$1,000 - $150,000',
    terms: '5 - 25 years',
    eligibility: [
      'Enrolled in eligible institution',
      'Satisfactory academic progress',
      'U.S. citizenship or eligible non-citizen',
      'No adverse credit history'
    ],
    interestRates: '3.73% - 14.50% APR',
    applicationProcess: [
      'FAFSA completion',
      'School enrollment verification',
      'Loan application',
      'Promissory note signing',
      'Disbursement to school'
    ],
    category: 'education',
    minCreditScore: 600,
    maxAmount: 150000
  },
  {
    id: 'creditcards',
    title: 'Credit Cards',
    description: 'Revolving credit options',
    icon: CreditCard,
    keyFeatures: [
      'No annual fee options',
      'Rewards programs',
      'Cashback opportunities',
      'Balance transfer options'
    ],
    loanAmounts: '$500 - $25,000',
    terms: 'Revolving credit',
    eligibility: [
      'Credit score 550+',
      'Minimum age 18',
      'Proof of income',
      'Valid Social Security number'
    ],
    interestRates: '15.99% - 29.99% APR',
    applicationProcess: [
      'Online application',
      'Instant pre-qualification',
      'Identity verification',
      'Card activation',
      'Immediate use'
    ],
    category: 'credit',
    minCreditScore: 550,
    maxAmount: 25000
  }
]

const categories = [
  { id: 'all', label: 'All Loans', icon: FileText },
  { id: 'personal', label: 'Personal', icon: User },
  { id: 'secured', label: 'Secured', icon: Shield },
  { id: 'business', label: 'Business', icon: Building },
  { id: 'education', label: 'Education', icon: GraduationCap },
  { id: 'credit', label: 'Credit', icon: CreditCard }
]

export default function LoanTypesShowcase() {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [expandedCard, setExpandedCard] = useState<string | null>(null)
  const [comparisonItems, setComparisonItems] = useState<string[]>([])

  const filteredLoanTypes = selectedCategory === 'all' 
    ? loanTypes 
    : loanTypes.filter(loan => loan.category === selectedCategory)

  const toggleExpanded = (id: string) => {
    setExpandedCard(expandedCard === id ? null : id)
  }

  const toggleComparison = (id: string) => {
    setComparisonItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    )
  }

  return (
    <div className="bg-background min-h-screen py-12 px-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Loan Types & Options
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Explore our comprehensive range of loan products designed to meet your financial needs
          </p>
        </div>

        {/* Category Tabs */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-8">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 bg-muted">
            {categories.map((category) => (
              <TabsTrigger
                key={category.id}
                value={category.id}
                className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <category.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{category.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Loan Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLoanTypes.map((loan) => (
            <motion.div
              key={loan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              <Card className="h-full flex flex-col bg-card border-border hover:shadow-lg hover:border-primary/20 transition-all duration-300">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <loan.icon className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-semibold text-foreground">
                          {loan.title}
                        </CardTitle>
                        <CardDescription className="text-sm text-muted-foreground">
                          {loan.description}
                        </CardDescription>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={comparisonItems.includes(loan.id)}
                      onChange={() => toggleComparison(loan.id)}
                      className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
                    />
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-muted/50 p-3 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <DollarSign className="w-4 h-4 text-secondary" />
                        <span className="text-xs font-medium text-muted-foreground">Amount</span>
                      </div>
                      <div className="text-sm font-semibold text-foreground">
                        {loan.loanAmounts}
                      </div>
                    </div>
                    <div className="bg-muted/50 p-3 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="w-4 h-4 text-secondary" />
                        <span className="text-xs font-medium text-muted-foreground">Terms</span>
                      </div>
                      <div className="text-sm font-semibold text-foreground">
                        {loan.terms}
                      </div>
                    </div>
                  </div>

                  <div className="bg-accent/10 p-3 rounded-lg">
                    <div className="text-sm font-medium text-accent-foreground mb-1">
                      Interest Rates
                    </div>
                    <div className="text-lg font-bold text-accent">
                      {loan.interestRates}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col pt-0">
                  {/* Key Features */}
                  <div className="mb-4">
                    <h4 className="font-medium text-foreground mb-2">Key Features</h4>
                    <ul className="space-y-1">
                      {loan.keyFeatures.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Expandable Details */}
                  <AnimatePresence>
                    {expandedCard === loan.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="mb-4 space-y-4">
                          <div>
                            <h4 className="font-medium text-foreground mb-2">Eligibility Requirements</h4>
                            <ul className="space-y-1">
                              {loan.eligibility.map((req, index) => (
                                <li key={index} className="text-sm text-muted-foreground">
                                  • {req}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <h4 className="font-medium text-foreground mb-2">Application Process</h4>
                            <ul className="space-y-1">
                              {loan.applicationProcess.map((step, index) => (
                                <li key={index} className="text-sm text-muted-foreground">
                                  {index + 1}. {step}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Action Buttons */}
                  <div className="mt-auto space-y-3">
                    <Button
                      variant="outline"
                      onClick={() => toggleExpanded(loan.id)}
                      className="w-full justify-between border-border text-foreground hover:bg-muted"
                    >
                      {expandedCard === loan.id ? 'Less Details' : 'Learn More'}
                      {expandedCard === loan.id ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </Button>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 border-border text-foreground hover:bg-muted"
                      >
                        <Calculator className="w-4 h-4 mr-1" />
                        Calculate
                      </Button>
                      <Button
                        className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        Apply Now
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Comparison Bar */}
        {comparisonItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-card border border-border rounded-lg shadow-lg p-4 z-50 max-w-md w-full mx-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
                  {comparisonItems.length}
                </Badge>
                <span className="text-sm font-medium text-foreground">
                  Selected for comparison
                </span>
              </div>
              <Button
                size="sm"
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Compare Now
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}