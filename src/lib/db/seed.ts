import { PrismaClient } from '@prisma/client'
import { parse } from 'csv-parse'
import { readFileSync } from 'fs'
import { join } from 'path'

const prisma = new PrismaClient()

// Utility class for logging with colors
class Logger {
  static info(message: string) {
    console.log(`\x1b[36m[INFO]\x1b[0m ${message}`)
  }

  static success(message: string) {
    console.log(`\x1b[32m[SUCCESS]\x1b[0m ${message}`)
  }

  static warning(message: string) {
    console.log(`\x1b[33m[WARNING]\x1b[0m ${message}`)
  }

  static error(message: string) {
    console.log(`\x1b[31m[ERROR]\x1b[0m ${message}`)
  }

  static step(step: number, message: string) {
    console.log(`\x1b[35m[STEP ${step}]\x1b[0m ${message}`)
  }
}

// Realistic loan provider data
const loanProviders = [
  {
    name: 'Wells Fargo',
    type: 'BANK',
    interestRateRange: '3.5-7.2',
    minimumAmount: 5000,
    maximumAmount: 100000,
    description: 'One of the largest banks in the US, offering competitive personal loans with flexible terms.',
    website: 'https://wellsfargo.com',
    isActive: true
  },
  {
    name: 'Chase Bank',
    type: 'BANK',
    interestRateRange: '3.7-7.5',
    minimumAmount: 1000,
    maximumAmount: 500000,
    description: 'Major national bank with extensive branch network and digital banking solutions.',
    website: 'https://chase.com',
    isActive: true
  },
  {
    name: 'Navy Federal Credit Union',
    type: 'CREDIT_UNION',
    interestRateRange: '2.9-6.8',
    minimumAmount: 250,
    maximumAmount: 50000,
    description: 'Serving military members and their families with competitive rates and member benefits.',
    website: 'https://navyfederal.org',
    isActive: true
  },
  {
    name: 'SoFi',
    type: 'ONLINE',
    interestRateRange: '5.0-9.9',
    minimumAmount: 5000,
    maximumAmount: 100000,
    description: 'Digital-first lender offering personal loans with no fees and member benefits.',
    website: 'https://sofi.com',
    isActive: true
  },
  {
    name: 'LendingClub',
    type: 'ONLINE',
    interestRateRange: '6.0-14.9',
    minimumAmount: 1000,
    maximumAmount: 40000,
    description: 'Peer-to-peer lending platform connecting borrowers with investors.',
    website: 'https://lendingclub.com',
    isActive: true
  },
  {
    name: 'Marcus by Goldman Sachs',
    type: 'BANK',
    interestRateRange: '4.5-8.5',
    minimumAmount: 3500,
    maximumAmount: 40000,
    description: 'No-fee personal loans from Goldman Sachs with competitive rates.',
    website: 'https://marcus.com',
    isActive: true
  },
  {
    name: 'Discover Personal Loans',
    type: 'BANK',
    interestRateRange: '6.0-12.9',
    minimumAmount: 2500,
    maximumAmount: 35000,
    description: 'Direct payment to creditors available for debt consolidation loans.',
    website: 'https://discover.com',
    isActive: true
  },
  {
    name: 'Alliant Credit Union',
    type: 'CREDIT_UNION',
    interestRateRange: '4.9-9.9',
    minimumAmount: 1000,
    maximumAmount: 50000,
    description: 'Member-owned financial cooperative offering competitive personal loan rates.',
    website: 'https://alliantcreditunion.org',
    isActive: true
  },
  {
    name: 'Prosper',
    type: 'ONLINE',
    interestRateRange: '5.9-15.9',
    minimumAmount: 2000,
    maximumAmount: 40000,
    description: 'Marketplace lending platform with quick approval and funding process.',
    website: 'https://prosper.com',
    isActive: true
  },
  {
    name: 'Upstart',
    type: 'ONLINE',
    interestRateRange: '6.4-16.8',
    minimumAmount: 1000,
    maximumAmount: 50000,
    description: 'AI-powered lending platform that considers education and employment history.',
    website: 'https://upstart.com',
    isActive: true
  }
]

// Sample users data
const sampleUsers = [
  {
    email: 'john.smith@email.com',
    firstName: 'John',
    lastName: 'Smith',
    dateOfBirth: new Date('1985-03-15'),
    phoneNumber: '+1-555-0101',
    address: '123 Main St, Anytown, ST 12345',
    employmentStatus: 'EMPLOYED',
    annualIncome: 75000,
    creditScore: 720
  },
  {
    email: 'sarah.johnson@email.com',
    firstName: 'Sarah',
    lastName: 'Johnson',
    dateOfBirth: new Date('1990-07-22'),
    phoneNumber: '+1-555-0102',
    address: '456 Oak Ave, Springfield, ST 67890',
    employmentStatus: 'EMPLOYED',
    annualIncome: 85000,
    creditScore: 780
  },
  {
    email: 'mike.davis@email.com',
    firstName: 'Mike',
    lastName: 'Davis',
    dateOfBirth: new Date('1982-11-08'),
    phoneNumber: '+1-555-0103',
    address: '789 Pine Rd, Riverside, ST 54321',
    employmentStatus: 'SELF_EMPLOYED',
    annualIncome: 65000,
    creditScore: 680
  },
  {
    email: 'emma.wilson@email.com',
    firstName: 'Emma',
    lastName: 'Wilson',
    dateOfBirth: new Date('1988-01-30'),
    phoneNumber: '+1-555-0104',
    address: '321 Elm St, Lakeside, ST 98765',
    employmentStatus: 'EMPLOYED',
    annualIncome: 92000,
    creditScore: 750
  },
  {
    email: 'alex.brown@email.com',
    firstName: 'Alex',
    lastName: 'Brown',
    dateOfBirth: new Date('1993-05-12'),
    phoneNumber: '+1-555-0105',
    address: '654 Maple Dr, Hillview, ST 13579',
    employmentStatus: 'EMPLOYED',
    annualIncome: 58000,
    creditScore: 640
  }
]

// Interface for CSV row data
interface CSVLoanData {
  Loan_ID: string
  Gender: string
  Married: string
  Dependents: string
  Education: string
  Self_Employed: string
  ApplicantIncome: string
  CoapplicantIncome: string
  LoanAmount: string
  Loan_Amount_Term: string
  Credit_History: string
  Property_Area: string
  Loan_Status: string
}

// Utility functions
async function clearDatabase() {
  Logger.info('Clearing existing database data...')
  
  try {
    await prisma.loanRating.deleteMany()
    await prisma.loanApplication.deleteMany()
    await prisma.user.deleteMany()
    await prisma.loanProvider.deleteMany()
    
    Logger.success('Database cleared successfully')
  } catch (error) {
    Logger.error(`Failed to clear database: ${error}`)
    throw error
  }
}

async function seedLoanProviders() {
  Logger.step(1, 'Seeding loan providers...')
  
  try {
    const createdProviders = await Promise.all(
      loanProviders.map(provider => 
        prisma.loanProvider.create({ data: provider })
      )
    )
    
    Logger.success(`Created ${createdProviders.length} loan providers`)
    return createdProviders
  } catch (error) {
    Logger.error(`Failed to seed loan providers: ${error}`)
    throw error
  }
}

async function seedUsers() {
  Logger.step(2, 'Seeding sample users...')
  
  try {
    const createdUsers = await Promise.all(
      sampleUsers.map(user => 
        prisma.user.create({ data: user })
      )
    )
    
    Logger.success(`Created ${createdUsers.length} users`)
    return createdUsers
  } catch (error) {
    Logger.error(`Failed to seed users: ${error}`)
    throw error
  }
}

function parseCSVFile(filePath: string): Promise<CSVLoanData[]> {
  return new Promise((resolve, reject) => {
    try {
      const fileContent = readFileSync(filePath, 'utf-8')
      
      parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      }, (error, records: CSVLoanData[]) => {
        if (error) {
          reject(error)
        } else {
          resolve(records)
        }
      })
    } catch (error) {
      reject(error)
    }
  })
}

function mapCSVToLoanApplication(csvRow: CSVLoanData, userId: string, providerId: string) {
  // Helper function to parse numbers safely
  const parseNumber = (value: string, defaultValue: number = 0): number => {
    const parsed = parseFloat(value)
    return isNaN(parsed) ? defaultValue : parsed
  }

  // Helper function to parse boolean from string
  const parseBoolean = (value: string): boolean => {
    return value.toLowerCase() === 'yes' || value === '1'
  }

  // Map education level
  const educationMap: Record<string, string> = {
    'Graduate': 'GRADUATE',
    'Not Graduate': 'UNDERGRADUATE',
    'Post Graduate': 'POSTGRADUATE'
  }

  // Map property area
  const propertyAreaMap: Record<string, string> = {
    'Urban': 'URBAN',
    'Semiurban': 'SEMI_URBAN',
    'Rural': 'RURAL'
  }

  // Map loan status
  const statusMap: Record<string, string> = {
    'Y': 'APPROVED',
    'N': 'REJECTED'
  }

  const loanAmount = parseNumber(csvRow.LoanAmount) * 1000 // Convert to actual amount
  const applicantIncome = parseNumber(csvRow.ApplicantIncome)
  const coapplicantIncome = parseNumber(csvRow.CoapplicantIncome)
  const totalIncome = applicantIncome + coapplicantIncome

  return {
    userId,
    loanProviderId: providerId,
    purpose: 'PERSONAL', // Default purpose since not in CSV
    requestedAmount: loanAmount,
    termMonths: parseInt(csvRow.Loan_Amount_Term) || 360,
    interestRate: 7.5 + Math.random() * 5, // Random rate between 7.5-12.5%
    monthlyIncome: totalIncome / 12,
    employmentStatus: parseBoolean(csvRow.Self_Employed) ? 'SELF_EMPLOYED' : 'EMPLOYED',
    creditScore: parseBoolean(csvRow.Credit_History) ? 
      Math.floor(Math.random() * (850 - 650) + 650) : 
      Math.floor(Math.random() * (649 - 300) + 300),
    debtToIncomeRatio: Math.random() * 0.4, // Random DTI ratio up to 40%
    status: statusMap[csvRow.Loan_Status] || 'PENDING',
    submittedAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000), // Random date within last year
    
    // Additional fields derived from CSV
    applicantIncome,
    coapplicantIncome,
    dependents: parseInt(csvRow.Dependents === '3+' ? '3' : csvRow.Dependents) || 0,
    educationLevel: educationMap[csvRow.Education] || 'UNDERGRADUATE',
    maritalStatus: parseBoolean(csvRow.Married) ? 'MARRIED' : 'SINGLE',
    propertyArea: propertyAreaMap[csvRow.Property_Area] || 'URBAN',
    gender: csvRow.Gender.toUpperCase(),
    originalLoanId: csvRow.Loan_ID
  }
}

async function seedLoanApplicationsFromCSV(csvFilePath: string, users: any[], providers: any[]) {
  Logger.step(3, 'Processing CSV file and seeding loan applications...')
  
  try {
    const csvData = await parseCSVFile(csvFilePath)
    Logger.info(`Found ${csvData.length} records in CSV file`)
    
    const loanApplications = csvData.map((row, index) => {
      // Randomly assign user and provider
      const user = users[index % users.length]
      const provider = providers[index % providers.length]
      
      return mapCSVToLoanApplication(row, user.id, provider.id)
    })
    
    // Batch insert loan applications
    const batchSize = 100
    let created = 0
    
    for (let i = 0; i < loanApplications.length; i += batchSize) {
      const batch = loanApplications.slice(i, i + batchSize)
      
      try {
        await prisma.loanApplication.createMany({
          data: batch,
          skipDuplicates: true
        })
        created += batch.length
        Logger.info(`Processed batch ${Math.floor(i / batchSize) + 1}: ${created}/${loanApplications.length} applications`)
      } catch (error) {
        Logger.warning(`Skipped batch due to error: ${error}`)
      }
    }
    
    Logger.success(`Created ${created} loan applications from CSV data`)
    return created
  } catch (error) {
    Logger.error(`Failed to process CSV file: ${error}`)
    throw error
  }
}

async function seedLoanRatings(users: any[], providers: any[]) {
  Logger.step(4, 'Generating sample loan ratings...')
  
  try {
    const ratings = []
    
    // Generate 20-30 random ratings
    const numRatings = 20 + Math.floor(Math.random() * 10)
    
    for (let i = 0; i < numRatings; i++) {
      const user = users[Math.floor(Math.random() * users.length)]
      const provider = providers[Math.floor(Math.random() * providers.length)]
      
      // Generate realistic ratings (skewed towards positive)
      const ratingValue = Math.random() < 0.7 ? 
        (4 + Math.random() * 1) : // 70% chance of 4-5 stars
        (2 + Math.random() * 2)   // 30% chance of 2-4 stars
      
      const comments = [
        'Excellent service and competitive rates. Highly recommended!',
        'Quick approval process and friendly staff.',
        'Good rates but the application process was a bit lengthy.',
        'Professional service, would use again.',
        'Great customer support throughout the loan process.',
        'Competitive rates and transparent terms.',
        'Smooth digital experience, very convenient.',
        'Helpful loan officers who explained everything clearly.',
        'Fast funding and no hidden fees.',
        'Outstanding customer service from start to finish.'
      ]
      
      ratings.push({
        userId: user.id,
        loanProviderId: provider.id,
        rating: Math.round(ratingValue * 10) / 10, // Round to 1 decimal
        comment: comments[Math.floor(Math.random() * comments.length)],
        createdAt: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000) // Random date within last 6 months
      })
    }
    
    const createdRatings = await prisma.loanRating.createMany({
      data: ratings,
      skipDuplicates: true
    })
    
    Logger.success(`Created ${createdRatings.count} loan ratings`)
    return createdRatings.count
  } catch (error) {
    Logger.error(`Failed to seed loan ratings: ${error}`)
    throw error
  }
}

// Main seeding function
async function seedAll(csvFilePath?: string) {
  const startTime = Date.now()
  Logger.info('Starting database seeding process...')
  
  try {
    // Step 0: Clear existing data
    await clearDatabase()
    
    // Step 1: Seed loan providers
    const providers = await seedLoanProviders()
    
    // Step 2: Seed users
    const users = await seedUsers()
    
    // Step 3: Seed loan applications (from CSV if provided)
    let applicationsCreated = 0
    if (csvFilePath) {
      applicationsCreated = await seedLoanApplicationsFromCSV(csvFilePath, users, providers)
    } else {
      Logger.warning('No CSV file provided, skipping loan applications seeding')
    }
    
    // Step 4: Seed loan ratings
    const ratingsCreated = await seedLoanRatings(users, providers)
    
    const endTime = Date.now()
    const duration = ((endTime - startTime) / 1000).toFixed(2)
    
    Logger.success(`Database seeding completed successfully in ${duration}s!`)
    Logger.info(`Summary:`)
    Logger.info(`  - Loan Providers: ${providers.length}`)
    Logger.info(`  - Users: ${users.length}`)
    Logger.info(`  - Loan Applications: ${applicationsCreated}`)
    Logger.info(`  - Loan Ratings: ${ratingsCreated}`)
    
  } catch (error) {
    Logger.error(`Seeding process failed: ${error}`)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Quick reseed function for development
async function quickReseed(csvFilePath?: string) {
  Logger.info('Performing quick reseed...')
  await seedAll(csvFilePath)
}

// Export functions for use in scripts
export {
  seedAll,
  quickReseed,
  clearDatabase,
  seedLoanProviders,
  seedUsers,
  seedLoanApplicationsFromCSV,
  seedLoanRatings,
  Logger
}

// CLI execution
if (require.main === module) {
  const csvFilePath = process.argv[2] || join(process.cwd(), 'data', 'loan_data.csv')
  
  seedAll(csvFilePath)
    .then(() => {
      Logger.success('Seeding script completed successfully')
      process.exit(0)
    })
    .catch((error) => {
      Logger.error(`Seeding script failed: ${error}`)
      process.exit(1)
    })
}