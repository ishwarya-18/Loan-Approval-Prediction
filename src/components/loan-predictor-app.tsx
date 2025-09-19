"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { 
  Menu, 
  X, 
  Home, 
  CreditCard, 
  CheckCircle, 
  BarChart3, 
  Info, 
  Mail, 
  ArrowRight,
  Moon,
  Sun,
  Building,
  Car,
  GraduationCap,
  Shield,
  TrendingUp,
  DollarSign,
  Clock,
  Star,
  Users,
  Award,
  ChevronRight,
  Calculator,
  FileText,
  Phone,
  MapPin,
  Loader2,
  AlertCircle,
  CheckCircle2
} from 'lucide-react'
import { LoanApplicationForm } from './loan-application-form'

type PageType = 'home' | 'loan-types' | 'eligibility' | 'comparison' | 'about' | 'contact' | 'get-started' | 'database'

interface LoanApplication {
  loanAmount: string
  income: string
  creditScore: string
  employmentType: string
  loanPurpose: string
  loanTerm: string
}

interface LoanType {
  id: string
  name: string
  icon: React.ComponentType<{ className?: string }>
  description: string
  interestRate: string
  maxAmount: string
  term: string
  features: string[]
}

const loanTypes: LoanType[] = [
  {
    id: 'personal',
    name: 'Personal Loan',
    icon: CreditCard,
    description: 'Flexible loans for personal expenses',
    interestRate: '8.5% - 15.9%',
    maxAmount: '$50,000',
    term: '2-7 years',
    features: ['No collateral required', 'Quick approval', 'Flexible terms', 'Multiple purposes']
  },
  {
    id: 'home',
    name: 'Home Loan',
    icon: Building,
    description: 'Affordable financing for your dream home',
    interestRate: '6.2% - 8.5%',
    maxAmount: '$500,000',
    term: '15-30 years',
    features: ['Low interest rates', 'Tax benefits', 'Flexible repayment', 'No prepayment penalty']
  },
  {
    id: 'auto',
    name: 'Auto Loan',
    icon: Car,
    description: 'Drive your dream car with easy financing',
    interestRate: '4.9% - 9.9%',
    maxAmount: '$75,000',
    term: '3-7 years',
    features: ['Competitive rates', 'New & used cars', 'Quick processing', 'Flexible down payment']
  },
  {
    id: 'education',
    name: 'Education Loan',
    icon: GraduationCap,
    description: 'Invest in your future with education funding',
    interestRate: '7.5% - 12.5%',
    maxAmount: '$100,000',
    term: '5-15 years',
    features: ['No collateral for amounts up to $25k', 'Grace period', 'Tax benefits', 'Global universities']
  }
]

export default function LoanPredictorApp() {
  const [currentPage, setCurrentPage] = useState<PageType>('home')
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [loanApplication, setLoanApplication] = useState<LoanApplication>({
    loanAmount: '',
    income: '',
    creditScore: '',
    employmentType: '',
    loanPurpose: '',
    loanTerm: ''
  })
  const [predictionResult, setPredictionResult] = useState<{
    approved: boolean
    confidence: number
    recommendations: string[]
  } | null>(null)

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDarkMode])

  const navigationItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'loan-types', label: 'Loan Types', icon: CreditCard },
    { id: 'eligibility', label: 'Check Eligibility', icon: CheckCircle },
    { id: 'database', label: 'ML Application', icon: BarChart3 },
    { id: 'comparison', label: 'Compare Loans', icon: BarChart3 },
    { id: 'about', label: 'About', icon: Info },
    { id: 'contact', label: 'Contact', icon: Mail }
  ]

  const handlePageChange = (page: PageType) => {
    setCurrentPage(page)
    setIsMobileMenuOpen(false)
  }

  const handleLoanApplicationChange = (field: keyof LoanApplication, value: string) => {
    setLoanApplication(prev => ({ ...prev, [field]: value }))
  }

  const handlePredictLoan = async () => {
    setIsLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    const score = parseInt(loanApplication.creditScore) || 0
    const income = parseInt(loanApplication.income) || 0
    const amount = parseInt(loanApplication.loanAmount) || 0
    
    const approved = score >= 650 && income * 12 >= amount * 0.3
    const confidence = Math.min(95, Math.max(45, score / 8.5 + (income / 1000) * 2))
    
    setPredictionResult({
      approved,
      confidence,
      recommendations: approved 
        ? ['Excellent credit profile', 'Consider applying for premium rates', 'Pre-approval available']
        : ['Improve credit score', 'Consider a co-signer', 'Reduce loan amount']
    })
    setIsLoading(false)
  }

  const renderHeader = () => (
    <header className="bg-card border-b sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-primary text-primary-foreground p-2 rounded-lg">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">LoanPredictor</h1>
              <p className="text-sm text-muted-foreground">Smart Loan Solutions</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center space-x-6">
            {navigationItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handlePageChange(item.id as PageType)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentPage === item.id
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground hover:bg-muted'
                }`}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="hidden md:flex"
            >
              {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button
              className="hidden md:flex"
              onClick={() => handlePageChange('get-started')}
            >
              Get Started
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden"
            >
              {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t bg-card"
          >
            <div className="container mx-auto px-4 py-4 space-y-2">
              {navigationItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handlePageChange(item.id as PageType)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentPage === item.id
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-muted'
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </button>
              ))}
              <Separator className="my-2" />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="w-full justify-start"
              >
                {isDarkMode ? <Sun className="h-4 w-4 mr-2" /> : <Moon className="h-4 w-4 mr-2" />}
                {isDarkMode ? 'Light Mode' : 'Dark Mode'}
              </Button>
              <Button
                className="w-full justify-start"
                onClick={() => handlePageChange('get-started')}
              >
                Get Started
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )

  const renderHomePage = () => (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="text-center space-y-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-4">
            Smart Loan Approval
            <span className="block text-primary">Predictions</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Get instant loan approval predictions powered by advanced machine learning. 
            Make informed financial decisions with confidence.
          </p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Button size="lg" onClick={() => handlePageChange('eligibility')}>
            Check Eligibility
            <CheckCircle className="h-5 w-5 ml-2" />
          </Button>
          <Button variant="outline" size="lg" onClick={() => handlePageChange('loan-types')}>
            Explore Loans
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="text-center">
          <CardHeader>
            <div className="bg-primary/10 text-primary p-3 rounded-lg w-fit mx-auto">
              <TrendingUp className="h-6 w-6" />
            </div>
            <CardTitle>AI-Powered Predictions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Advanced machine learning algorithms analyze your financial profile for accurate loan approval predictions.
            </p>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardHeader>
            <div className="bg-secondary/10 text-secondary p-3 rounded-lg w-fit mx-auto">
              <Clock className="h-6 w-6" />
            </div>
            <CardTitle>Instant Results</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Get loan approval predictions in seconds, not days. Make faster financial decisions with confidence.
            </p>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardHeader>
            <div className="bg-primary/10 text-primary p-3 rounded-lg w-fit mx-auto">
              <Shield className="h-6 w-6" />
            </div>
            <CardTitle>Secure & Private</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Your financial data is protected with bank-level security. We never store or share your information.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Stats Section */}
      <section className="bg-muted/30 rounded-lg p-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
          <div>
            <div className="text-3xl font-bold text-primary">98%</div>
            <p className="text-muted-foreground">Prediction Accuracy</p>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary">50K+</div>
            <p className="text-muted-foreground">Loans Processed</p>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary">2 Min</div>
            <p className="text-muted-foreground">Average Processing Time</p>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary">4.9/5</div>
            <p className="text-muted-foreground">Customer Rating</p>
          </div>
        </div>
      </section>
    </div>
  )

  const renderLoanTypes = () => (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-4">Loan Types</h1>
        <p className="text-muted-foreground">
          Choose from our comprehensive range of loan products designed to meet your specific needs.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loanTypes.map((loan) => (
          <Card key={loan.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="bg-primary/10 text-primary p-3 rounded-lg">
                  <loan.icon className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle>{loan.name}</CardTitle>
                  <CardDescription>{loan.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Interest Rate</p>
                  <p className="text-lg font-semibold text-foreground">{loan.interestRate}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Max Amount</p>
                  <p className="text-lg font-semibold text-foreground">{loan.maxAmount}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Term</p>
                  <p className="text-lg font-semibold text-foreground">{loan.term}</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Key Features:</p>
                <ul className="space-y-1">
                  {loan.features.map((feature, index) => (
                    <li key={index} className="flex items-center space-x-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <Button className="w-full mt-4" onClick={() => handlePageChange('eligibility')}>
                Check Eligibility
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )

  const renderEligibilityCheck = () => (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-4">Check Your Eligibility</h1>
        <p className="text-muted-foreground">
          Fill out the form below to get an instant loan approval prediction.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Loan Application</CardTitle>
            <CardDescription>
              Provide your financial details for accurate prediction
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="loanAmount">Loan Amount ($)</Label>
                <Input
                  id="loanAmount"
                  type="number"
                  placeholder="25000"
                  value={loanApplication.loanAmount}
                  onChange={(e) => handleLoanApplicationChange('loanAmount', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="income">Monthly Income ($)</Label>
                <Input
                  id="income"
                  type="number"
                  placeholder="5000"
                  value={loanApplication.income}
                  onChange={(e) => handleLoanApplicationChange('income', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="creditScore">Credit Score</Label>
                <Input
                  id="creditScore"
                  type="number"
                  placeholder="750"
                  value={loanApplication.creditScore}
                  onChange={(e) => handleLoanApplicationChange('creditScore', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="loanTerm">Loan Term (years)</Label>
                <Select value={loanApplication.loanTerm} onValueChange={(value) => handleLoanApplicationChange('loanTerm', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select term" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 year</SelectItem>
                    <SelectItem value="2">2 years</SelectItem>
                    <SelectItem value="3">3 years</SelectItem>
                    <SelectItem value="5">5 years</SelectItem>
                    <SelectItem value="7">7 years</SelectItem>
                    <SelectItem value="10">10 years</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="employmentType">Employment Type</Label>
              <Select value={loanApplication.employmentType} onValueChange={(value) => handleLoanApplicationChange('employmentType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select employment type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full-time">Full-time Employee</SelectItem>
                  <SelectItem value="part-time">Part-time Employee</SelectItem>
                  <SelectItem value="self-employed">Self-employed</SelectItem>
                  <SelectItem value="contractor">Contractor</SelectItem>
                  <SelectItem value="unemployed">Unemployed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="loanPurpose">Loan Purpose</Label>
              <Select value={loanApplication.loanPurpose} onValueChange={(value) => handleLoanApplicationChange('loanPurpose', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select loan purpose" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="home">Home Purchase</SelectItem>
                  <SelectItem value="auto">Auto Purchase</SelectItem>
                  <SelectItem value="personal">Personal Expenses</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                  <SelectItem value="debt-consolidation">Debt Consolidation</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              className="w-full" 
              onClick={handlePredictLoan}
              disabled={isLoading || !loanApplication.loanAmount || !loanApplication.income}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Calculator className="h-4 w-4 mr-2" />
                  Get Prediction
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Prediction Results</CardTitle>
            <CardDescription>
              Your loan approval prediction will appear here
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : predictionResult ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  {predictionResult.approved ? (
                    <CheckCircle2 className="h-8 w-8 text-green-500" />
                  ) : (
                    <AlertCircle className="h-8 w-8 text-red-500" />
                  )}
                  <div>
                    <h3 className="text-lg font-semibold">
                      {predictionResult.approved ? 'Likely Approved' : 'Likely Denied'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Confidence: {predictionResult.confidence.toFixed(1)}%
                    </p>
                  </div>
                </div>
                
                <Progress value={predictionResult.confidence} className="w-full" />
                
                <div>
                  <h4 className="font-medium mb-2">Recommendations:</h4>
                  <ul className="space-y-1">
                    {predictionResult.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-center space-x-2 text-sm">
                        <ArrowRight className="h-4 w-4 text-primary" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Button 
                  className="w-full" 
                  onClick={() => handlePageChange('loan-types')}
                >
                  Explore Loan Options
                </Button>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Fill out the form to get your loan prediction</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )

  const renderComparison = () => (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-4">Compare Loan Options</h1>
        <p className="text-muted-foreground">
          Compare different loan products side by side to find the best option for your needs.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b">
              <th className="text-left p-4 font-medium">Loan Type</th>
              <th className="text-left p-4 font-medium">Interest Rate</th>
              <th className="text-left p-4 font-medium">Max Amount</th>
              <th className="text-left p-4 font-medium">Term</th>
              <th className="text-left p-4 font-medium">Processing Time</th>
              <th className="text-left p-4 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {loanTypes.map((loan) => (
              <tr key={loan.id} className="border-b hover:bg-muted/50 transition-colors">
                <td className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-primary/10 text-primary p-2 rounded">
                      <loan.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium">{loan.name}</p>
                      <p className="text-sm text-muted-foreground">{loan.description}</p>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <Badge variant="outline">{loan.interestRate}</Badge>
                </td>
                <td className="p-4 font-medium">{loan.maxAmount}</td>
                <td className="p-4">{loan.term}</td>
                <td className="p-4">
                  <span className="text-green-600 font-medium">2-3 days</span>
                </td>
                <td className="p-4">
                  <Button size="sm" onClick={() => handlePageChange('eligibility')}>
                    Apply Now
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  const renderAbout = () => (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-4">About LoanPredictor</h1>
        <p className="text-lg text-muted-foreground">
          Empowering financial decisions through intelligent loan predictions
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Our Mission</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              We believe that everyone deserves access to transparent, fair, and intelligent financial services. 
              Our mission is to democratize loan approval predictions using cutting-edge machine learning technology, 
              helping borrowers make informed decisions and lenders reduce risk.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">1</div>
                <div>
                  <h4 className="font-medium">Input Your Data</h4>
                  <p className="text-sm text-muted-foreground">Provide basic financial information securely</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">2</div>
                <div>
                  <h4 className="font-medium">AI Analysis</h4>
                  <p className="text-sm text-muted-foreground">Our ML models analyze your profile</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">3</div>
                <div>
                  <h4 className="font-medium">Get Results</h4>
                  <p className="text-sm text-muted-foreground">Receive instant approval predictions</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-muted/30 rounded-lg p-8">
        <h2 className="text-2xl font-bold text-foreground mb-4">Why Choose LoanPredictor?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <Award className="h-12 w-12 text-primary mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Industry Leading</h3>
            <p className="text-sm text-muted-foreground">98% prediction accuracy with advanced ML models</p>
          </div>
          <div className="text-center">
            <Users className="h-12 w-12 text-primary mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Customer Focused</h3>
            <p className="text-sm text-muted-foreground">Serving over 50,000 satisfied customers</p>
          </div>
          <div className="text-center">
            <Shield className="h-12 w-12 text-primary mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Secure & Private</h3>
            <p className="text-sm text-muted-foreground">Bank-level security for your data</p>
          </div>
        </div>
      </div>
    </div>
  )

  const renderContact = () => (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-4">Contact Us</h1>
        <p className="text-muted-foreground">
          Get in touch with our team for support, questions, or partnership opportunities.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Send us a message</CardTitle>
            <CardDescription>We'll get back to you within 24 hours</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" placeholder="John" />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" placeholder="Doe" />
              </div>
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="john@example.com" />
            </div>
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input id="subject" placeholder="How can we help?" />
            </div>
            <div>
              <Label htmlFor="message">Message</Label>
              <textarea
                id="message"
                className="w-full min-h-[120px] px-3 py-2 border border-input rounded-md text-sm"
                placeholder="Tell us more about your inquiry..."
              />
            </div>
            <Button className="w-full">
              <Mail className="h-4 w-4 mr-2" />
              Send Message
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Get in Touch</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">support@loanpredictor.com</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Phone</p>
                  <p className="text-sm text-muted-foreground">+1 (555) 123-4567</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Address</p>
                  <p className="text-sm text-muted-foreground">123 Financial Street, Suite 100<br />New York, NY 10001</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Business Hours</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span>Monday - Friday</span>
                <span className="text-muted-foreground">9:00 AM - 6:00 PM</span>
              </div>
              <div className="flex justify-between">
                <span>Saturday</span>
                <span className="text-muted-foreground">10:00 AM - 4:00 PM</span>
              </div>
              <div className="flex justify-between">
                <span>Sunday</span>
                <span className="text-muted-foreground">Closed</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )

  const renderGetStarted = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground mb-4">Get Started Today</h1>
        <p className="text-muted-foreground">
          Ready to discover your loan options? Choose how you'd like to begin.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="text-center hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handlePageChange('eligibility')}>
          <CardHeader>
            <div className="bg-primary/10 text-primary p-4 rounded-lg w-fit mx-auto">
              <CheckCircle className="h-8 w-8" />
            </div>
            <CardTitle>Check Eligibility</CardTitle>
            <CardDescription>
              Get instant loan approval predictions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Use our AI-powered tool to check your loan eligibility in minutes. No impact on your credit score.
            </p>
            <Button className="w-full">
              Start Check
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>

        <Card className="text-center hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handlePageChange('loan-types')}>
          <CardHeader>
            <div className="bg-secondary/10 text-secondary p-4 rounded-lg w-fit mx-auto">
              <CreditCard className="h-8 w-8" />
            </div>
            <CardTitle>Explore Loans</CardTitle>
            <CardDescription>
              Browse our loan products
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Discover personal, home, auto, and education loans with competitive rates and flexible terms.
            </p>
            <Button className="w-full" variant="outline">
              View Loans
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>

        <Card className="text-center hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handlePageChange('comparison')}>
          <CardHeader>
            <div className="bg-primary/10 text-primary p-4 rounded-lg w-fit mx-auto">
              <BarChart3 className="h-8 w-8" />
            </div>
            <CardTitle>Compare Options</CardTitle>
            <CardDescription>
              Find the best loan for you
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Compare interest rates, terms, and features across different loan products side by side.
            </p>
            <Button className="w-full" variant="outline">
              Compare Now
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Need Help Getting Started?</h3>
              <p className="text-muted-foreground">
                Our financial experts are here to guide you through the process.
              </p>
            </div>
            <Button onClick={() => handlePageChange('contact')}>
              Contact Support
              <Mail className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderDatabasePage = () => (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-4">AI-Powered Loan Application</h1>
        <p className="text-muted-foreground">
          Experience our machine learning-powered loan application system with real-time predictions and database integration.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="text-center">
          <CardHeader>
            <div className="bg-primary/10 text-primary p-3 rounded-lg w-fit mx-auto">
              <TrendingUp className="h-6 w-6" />
            </div>
            <CardTitle>Real-time ML Predictions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Get instant loan approval predictions powered by machine learning algorithms trained on real financial data.
            </p>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardHeader>
            <div className="bg-secondary/10 text-secondary p-3 rounded-lg w-fit mx-auto">
              <Shield className="h-6 w-6" />
            </div>
            <CardTitle>Database Integration</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Your applications are securely stored in PostgreSQL database with full audit trail and data integrity.
            </p>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardHeader>
            <div className="bg-primary/10 text-primary p-3 rounded-lg w-fit mx-auto">
              <DollarSign className="h-6 w-6" />
            </div>
            <CardTitle>Smart Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Receive personalized loan recommendations and improvement suggestions based on your financial profile.
            </p>
          </CardContent>
        </Card>
      </div>

      <LoanApplicationForm />
    </div>
  )

  const renderFooter = () => (
    <footer className="bg-card border-t mt-16">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="bg-primary text-primary-foreground p-2 rounded-lg">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">LoanPredictor</h3>
                <p className="text-xs text-muted-foreground">Smart Loan Solutions</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              AI-powered loan approval predictions to help you make informed financial decisions.
            </p>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-4">Products</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-sm text-muted-foreground hover:text-primary">Personal Loans</a></li>
              <li><a href="#" className="text-sm text-muted-foreground hover:text-primary">Home Loans</a></li>
              <li><a href="#" className="text-sm text-muted-foreground hover:text-primary">Auto Loans</a></li>
              <li><a href="#" className="text-sm text-muted-foreground hover:text-primary">Education Loans</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-4">Company</h4>
            <ul className="space-y-2">
              <li><button onClick={() => handlePageChange('about')} className="text-sm text-muted-foreground hover:text-primary">About Us</button></li>
              <li><button onClick={() => handlePageChange('contact')} className="text-sm text-muted-foreground hover:text-primary">Contact</button></li>
              <li><a href="#" className="text-sm text-muted-foreground hover:text-primary">Careers</a></li>
              <li><a href="#" className="text-sm text-muted-foreground hover:text-primary">Press</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-4">Support</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-sm text-muted-foreground hover:text-primary">Help Center</a></li>
              <li><a href="#" className="text-sm text-muted-foreground hover:text-primary">Privacy Policy</a></li>
              <li><a href="#" className="text-sm text-muted-foreground hover:text-primary">Terms of Service</a></li>
              <li><a href="#" className="text-sm text-muted-foreground hover:text-primary">Security</a></li>
            </ul>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-muted-foreground">
            © 2024 LoanPredictor. All rights reserved.
          </p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <a href="#" className="text-sm text-muted-foreground hover:text-primary">Privacy</a>
            <a href="#" className="text-sm text-muted-foreground hover:text-primary">Terms</a>
            <a href="#" className="text-sm text-muted-foreground hover:text-primary">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  )

  const renderBreadcrumbs = () => {
    const breadcrumbMap = {
      'home': 'Home',
      'loan-types': 'Loan Types',
      'eligibility': 'Check Eligibility',
      'comparison': 'Compare Loans',
      'about': 'About',
      'contact': 'Contact',
      'get-started': 'Get Started'
    }

    if (currentPage === 'home') return null

    return (
      <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-6">
        <button 
          onClick={() => handlePageChange('home')}
          className="hover:text-primary"
        >
          Home
        </button>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground font-medium">
          {breadcrumbMap[currentPage]}
        </span>
      </div>
    )
  }

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'home':
        return renderHomePage()
      case 'loan-types':
        return renderLoanTypes()
      case 'eligibility':
        return renderEligibilityCheck()
      case 'database':
        return renderDatabasePage()
      case 'comparison':
        return renderComparison()
      case 'about':
        return renderAbout()
      case 'contact':
        return renderContact()
      case 'get-started':
        return renderGetStarted()
      default:
        return renderHomePage()
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {renderHeader()}
      
      <main className="container mx-auto px-4 py-8">
        {renderBreadcrumbs()}
        
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderCurrentPage()}
          </motion.div>
        </AnimatePresence>
      </main>

      {renderFooter()}
    </div>
  )
}