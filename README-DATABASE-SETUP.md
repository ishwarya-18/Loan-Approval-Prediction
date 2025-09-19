# CommunityLend - Peer-to-Peer Lending Platform

A comprehensive peer-to-peer lending platform built with Next.js, PostgreSQL, and advanced ML models for risk assessment and loan matching.

## Table of Contents

1. [Database Setup](#database-setup)
2. [Environment Configuration](#environment-configuration)
3. [Database Schema & Migrations](#database-schema--migrations)
4. [CSV Data Import](#csv-data-import)
5. [API Documentation](#api-documentation)
6. [ML Model Integration](#ml-model-integration)
7. [Development Workflow](#development-workflow)
8. [Production Deployment](#production-deployment)
9. [Troubleshooting](#troubleshooting)
10. [Architecture Overview](#architecture-overview)

---

## Database Setup

### PostgreSQL Installation

#### Option 1: Local Installation (Recommended for Development)

**Windows:**
# Download from PostgreSQL official website
https://www.postgresql.org/download/windows/

# Or use Chocolatey
choco install postgresql

# Start PostgreSQL service
net start postgresql-x64-14
**macOS:**
# Using Homebrew
brew install postgresql@14
brew services start postgresql@14

# Using MacPorts
sudo port install postgresql14-server
sudo port load postgresql14-server
**Ubuntu/Debian:**
# Update package list
sudo apt update

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql
#### Option 2: Docker Setup

# docker-compose.yml
version: '3.8'
services:
  postgres:
    image: postgres:14-alpine
    restart: always
    environment:
      POSTGRES_DB: communitylend
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: your_secure_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql

  pgadmin:
    image: dpage/pgadmin4
    restart: always
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@communitylend.com
      PGADMIN_DEFAULT_PASSWORD: admin_password
    ports:
      - "5050:80"
    volumes:
      - pgadmin_data:/var/lib/pgadmin

volumes:
  postgres_data:
  pgadmin_data:
# Start the services
docker-compose up -d

# Stop the services
docker-compose down
### PgAdmin Setup

#### Accessing PgAdmin

1. **Web Interface:** Navigate to `http://localhost:5050`
2. **Login:** Use credentials from docker-compose.yml or your local install
3. **Add Server:**
   - Name: CommunityLend Local
   - Host: localhost (or postgres for Docker)
   - Port: 5432
   - Username: postgres
   - Password: your_password

#### Database Creation

-- Connect as superuser and create database
CREATE DATABASE communitylend
    WITH 
    OWNER = postgres
    ENCODING = 'UTF8'
    LC_COLLATE = 'en_US.utf8'
    LC_CTYPE = 'en_US.utf8'
    TABLESPACE = pg_default
    CONNECTION LIMIT = -1;

-- Create application user
CREATE USER communitylend_user WITH ENCRYPTED PASSWORD 'secure_app_password';
GRANT ALL PRIVILEGES ON DATABASE communitylend TO communitylend_user;

-- Connect to communitylend database and grant schema privileges
\c communitylend
GRANT ALL ON SCHEMA public TO communitylend_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO communitylend_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO communitylend_user;
---

## Environment Configuration

### Required Environment Variables

Create `.env.local` file in your project root:

# Database Configuration
DATABASE_URL="postgresql://communitylend_user:secure_app_password@localhost:5432/communitylend"
POSTGRES_PRISMA_URL="postgresql://communitylend_user:secure_app_password@localhost:5432/communitylend?pgbouncer=true&connect_timeout=15"
POSTGRES_URL_NON_POOLING="postgresql://communitylend_user:secure_app_password@localhost:5432/communitylend"

# NextAuth.js Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-super-secret-jwt-secret-key-minimum-32-characters"

# OAuth Providers (Optional)
GOOGLE_CLIENT_ID="your-google-oauth-client-id"
GOOGLE_CLIENT_SECRET="your-google-oauth-client-secret"
GITHUB_CLIENT_ID="your-github-oauth-client-id"
GITHUB_CLIENT_SECRET="your-github-oauth-client-secret"

# Email Configuration (for notifications)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# ML Model Configuration
PYTHON_ML_SERVICE_URL="http://localhost:8000"
ML_API_KEY="your-ml-service-api-key"

# File Upload Configuration
UPLOAD_MAX_SIZE=10485760  # 10MB
ALLOWED_FILE_TYPES="pdf,jpg,jpeg,png,doc,docx"

# Payment Integration (Stripe example)
STRIPE_SECRET_KEY="sk_test_your_stripe_secret_key"
STRIPE_PUBLISHABLE_KEY="pk_test_your_stripe_publishable_key"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret"

# Logging and Monitoring
LOG_LEVEL="info"
SENTRY_DSN="your-sentry-dsn"

# Feature Flags
ENABLE_ML_SCORING=true
ENABLE_AUTO_MATCHING=true
ENABLE_EMAIL_NOTIFICATIONS=true
### Production Environment

# Use environment-specific values for production
NODE_ENV=production
DATABASE_URL="postgresql://user:pass@prod-db:5432/communitylend?sslmode=require"
NEXTAUTH_URL="https://your-domain.com"

# Security Headers
SECURITY_HEADERS_ENABLED=true
CORS_ORIGIN="https://your-domain.com"
---

## Database Schema & Migrations

### Schema Overview

-- Core user management
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    date_of_birth DATE,
    address JSONB,
    verification_status VARCHAR(50) DEFAULT 'pending',
    credit_score INTEGER,
    annual_income DECIMAL(12,2),
    employment_status VARCHAR(50),
    profile_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Loan applications and listings
CREATE TABLE loans (
    id SERIAL PRIMARY KEY,
    borrower_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    lender_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    amount DECIMAL(12,2) NOT NULL,
    interest_rate DECIMAL(5,2) NOT NULL,
    term_months INTEGER NOT NULL,
    purpose TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    risk_grade VARCHAR(5),
    ml_score DECIMAL(5,2),
    collateral_description TEXT,
    monthly_payment DECIMAL(10,2),
    total_payment DECIMAL(12,2),
    funded_amount DECIMAL(12,2) DEFAULT 0.00,
    funding_deadline DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Investment/lending records
CREATE TABLE investments (
    id SERIAL PRIMARY KEY,
    lender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    loan_id INTEGER REFERENCES loans(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    expected_return DECIMAL(10,2),
    actual_return DECIMAL(10,2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'active',
    investment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    maturity_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment tracking
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    loan_id INTEGER REFERENCES loans(id) ON DELETE CASCADE,
    borrower_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    payment_type VARCHAR(50) NOT NULL, -- 'scheduled', 'early', 'late'
    payment_date DATE NOT NULL,
    due_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    principal_amount DECIMAL(10,2),
    interest_amount DECIMAL(10,2),
    late_fee DECIMAL(10,2) DEFAULT 0.00,
    transaction_id VARCHAR(255),
    payment_method VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Document storage
CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    loan_id INTEGER REFERENCES loans(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    verification_status VARCHAR(50) DEFAULT 'pending',
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ML model predictions and scoring
CREATE TABLE risk_assessments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    loan_id INTEGER REFERENCES loans(id) ON DELETE CASCADE,
    model_version VARCHAR(50),
    risk_score DECIMAL(5,2),
    probability_default DECIMAL(5,4),
    risk_factors JSONB,
    assessment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activity logging
CREATE TABLE activity_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id INTEGER,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
### Indexes for Performance

-- User indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_verification_status ON users(verification_status);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Loan indexes
CREATE INDEX idx_loans_borrower_id ON loans(borrower_id);
CREATE INDEX idx_loans_lender_id ON loans(lender_id);
CREATE INDEX idx_loans_status ON loans(status);
CREATE INDEX idx_loans_risk_grade ON loans(risk_grade);
CREATE INDEX idx_loans_funding_deadline ON loans(funding_deadline);
CREATE INDEX idx_loans_amount ON loans(amount);

-- Investment indexes
CREATE INDEX idx_investments_lender_id ON investments(lender_id);
CREATE INDEX idx_investments_loan_id ON investments(loan_id);
CREATE INDEX idx_investments_status ON investments(status);
CREATE INDEX idx_investments_investment_date ON investments(investment_date);

-- Payment indexes
CREATE INDEX idx_payments_loan_id ON payments(loan_id);
CREATE INDEX idx_payments_borrower_id ON payments(borrower_id);
CREATE INDEX idx_payments_due_date ON payments(due_date);
CREATE INDEX idx_payments_status ON payments(status);

-- Composite indexes for common queries
CREATE INDEX idx_loans_status_funding_deadline ON loans(status, funding_deadline);
CREATE INDEX idx_payments_loan_status_due ON payments(loan_id, status, due_date);
### Database Migrations with Prisma

#### Install Prisma

npm install prisma @prisma/client
npx prisma init
#### Prisma Schema (`prisma/schema.prisma`)

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id                  Int      @id @default(autoincrement())
  email               String   @unique
  passwordHash        String?  @map("password_hash")
  firstName           String   @map("first_name")
  lastName            String   @map("last_name")
  phone               String?
  dateOfBirth         DateTime? @map("date_of_birth")
  address             Json?
  verificationStatus  String   @default("pending") @map("verification_status")
  creditScore         Int?     @map("credit_score")
  annualIncome        Decimal? @map("annual_income")
  employmentStatus    String?  @map("employment_status")
  profileCompleted    Boolean  @default(false) @map("profile_completed")
  createdAt          DateTime @default(now()) @map("created_at")
  updatedAt          DateTime @updatedAt @map("updated_at")

  // Relations
  borrowedLoans      Loan[]   @relation("BorrowerLoans")
  lentLoans          Loan[]   @relation("LenderLoans")
  investments        Investment[]
  payments           Payment[]
  documents          Document[]
  riskAssessments    RiskAssessment[]
  activityLogs       ActivityLog[]
  notifications      Notification[]

  @@map("users")
}

model Loan {
  id                     Int      @id @default(autoincrement())
  borrowerId            Int      @map("borrower_id")
  lenderId              Int?     @map("lender_id")
  amount                Decimal
  interestRate          Decimal  @map("interest_rate")
  termMonths            Int      @map("term_months")
  purpose               String
  status                String   @default("pending")
  riskGrade             String?  @map("risk_grade")
  mlScore               Decimal? @map("ml_score")
  collateralDescription String?  @map("collateral_description")
  monthlyPayment        Decimal? @map("monthly_payment")
  totalPayment          Decimal? @map("total_payment")
  fundedAmount          Decimal  @default(0.00) @map("funded_amount")
  fundingDeadline       DateTime? @map("funding_deadline")
  createdAt            DateTime @default(now()) @map("created_at")
  updatedAt            DateTime @updatedAt @map("updated_at")

  // Relations
  borrower       User          @relation("BorrowerLoans", fields: [borrowerId], references: [id], onDelete: Cascade)
  lender         User?         @relation("LenderLoans", fields: [lenderId], references: [id], onDelete: SetNull)
  investments    Investment[]
  payments       Payment[]
  documents      Document[]
  riskAssessments RiskAssessment[]

  @@map("loans")
}

// Additional models follow similar pattern...
#### Migration Commands

# Generate migration from schema changes
npx prisma migrate dev --name init

# Apply migrations to production
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset

# Generate Prisma client
npx prisma generate

# View database in browser
npx prisma studio
---

## CSV Data Import

### Sample Data Structure

Create sample CSV files for initial data population:

#### users.csv
email,first_name,last_name,phone,annual_income,employment_status,credit_score
john.doe@email.com,John,Doe,555-0101,75000,employed,720
jane.smith@email.com,Jane,Smith,555-0102,92000,employed,680
mike.johnson@email.com,Mike,Johnson,555-0103,55000,self_employed,640
#### loans.csv
borrower_email,amount,interest_rate,term_months,purpose,risk_grade
john.doe@email.com,25000,8.5,36,debt_consolidation,B
jane.smith@email.com,15000,6.2,24,home_improvement,A
mike.johnson@email.com,10000,12.0,12,business,C
### Import Scripts

#### SQL Import Script (`scripts/import_data.sql`)

-- Import users
COPY users(email, first_name, last_name, phone, annual_income, employment_status, credit_score)
FROM '/path/to/users.csv'
DELIMITER ','
CSV HEADER;

-- Import loans (requires user ID mapping)
CREATE TEMP TABLE temp_loans (
    borrower_email VARCHAR(255),
    amount DECIMAL(12,2),
    interest_rate DECIMAL(5,2),
    term_months INTEGER,
    purpose TEXT,
    risk_grade VARCHAR(5)
);

COPY temp_loans FROM '/path/to/loans.csv' DELIMITER ',' CSV HEADER;

INSERT INTO loans (borrower_id, amount, interest_rate, term_months, purpose, risk_grade)
SELECT 
    u.id,
    tl.amount,
    tl.interest_rate,
    tl.term_months,
    tl.purpose,
    tl.risk_grade
FROM temp_loans tl
JOIN users u ON u.email = tl.borrower_email;

DROP TABLE temp_loans;
#### Node.js Import Script (`scripts/import-csv.js`)

const fs = require('fs');
const csv = require('csv-parser');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function importUsers(filePath) {
  const users = [];
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        users.push({
          email: row.email,
          firstName: row.first_name,
          lastName: row.last_name,
          phone: row.phone,
          annualIncome: parseFloat(row.annual_income),
          employmentStatus: row.employment_status,
          creditScore: parseInt(row.credit_score)
        });
      })
      .on('end', async () => {
        try {
          await prisma.user.createMany({
            data: users,
            skipDuplicates: true
          });
          console.log(`Imported ${users.length} users`);
          resolve();
        } catch (error) {
          reject(error);
        }
      });
  });
}

async function importLoans(filePath) {
  const loans = [];
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', async (row) => {
        try {
          const user = await prisma.user.findUnique({
            where: { email: row.borrower_email }
          });
          
          if (user) {
            loans.push({
              borrowerId: user.id,
              amount: parseFloat(row.amount),
              interestRate: parseFloat(row.interest_rate),
              termMonths: parseInt(row.term_months),
              purpose: row.purpose,
              riskGrade: row.risk_grade
            });
          }
        } catch (error) {
          console.error('Error processing loan row:', error);
        }
      })
      .on('end', async () => {
        try {
          await prisma.loan.createMany({
            data: loans,
            skipDuplicates: true
          });
          console.log(`Imported ${loans.length} loans`);
          resolve();
        } catch (error) {
          reject(error);
        }
      });
  });
}

async function main() {
  try {
    await importUsers('./data/users.csv');
    await importLoans('./data/loans.csv');
    console.log('Data import completed successfully');
  } catch (error) {
    console.error('Import failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
#### Run Import

# Install required packages
npm install csv-parser

# Run the import script
node scripts/import-csv.js

# Or use npm script
npm run import:data
---

## API Documentation

### Authentication Endpoints

#### POST /api/auth/register
// Request body
{
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: string;
}

// Response
{
  success: boolean;
  user?: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
  };
  error?: string;
}
#### POST /api/auth/login
// Request body
{
  email: string;
  password: string;
}

// Response
{
  success: boolean;
  token?: string;
  user?: UserProfile;
  error?: string;
}
### User Management Endpoints

#### GET /api/users/profile
// Headers: Authorization: Bearer <token>
// Response
{
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  verificationStatus: string;
  creditScore?: number;
  annualIncome?: number;
  profileCompleted: boolean;
}
#### PUT /api/users/profile
// Request body
{
  firstName?: string;
  lastName?: string;
  phone?: string;
  dateOfBirth?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  annualIncome?: number;
  employmentStatus?: string;
}

// Response
{
  success: boolean;
  user?: UserProfile;
  error?: string;
}
### Loan Endpoints

#### POST /api/loans/create
// Request body
{
  amount: number;
  interestRate: number;
  termMonths: number;
  purpose: string;
  collateralDescription?: string;
}

// Response
{
  success: boolean;
  loan?: {
    id: number;
    amount: number;
    interestRate: number;
    termMonths: number;
    purpose: string;
    status: string;
    monthlyPayment: number;
    totalPayment: number;
    riskGrade?: string;
    mlScore?: number;
  };
  error?: string;
}
#### GET /api/loans
// Query parameters
{
  page?: number;
  limit?: number;
  status?: string;
  minAmount?: number;
  maxAmount?: number;
  riskGrade?: string;
  sortBy?: 'amount' | 'interestRate' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

// Response
{
  loans: LoanListing[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
#### GET /api/loans/:id
// Response
{
  id: number;
  amount: number;
  interestRate: number;
  termMonths: number;
  purpose: string;
  status: string;
  riskGrade?: string;
  mlScore?: number;
  borrower: {
    id: number;
    firstName: string;
    lastName: string;
    creditScore?: number;
    verificationStatus: string;
  };
  fundedAmount: number;
  fundingDeadline?: string;
  createdAt: string;
}
### Investment Endpoints

#### POST /api/investments/create
// Request body
{
  loanId: number;
  amount: number;
}

// Response
{
  success: boolean;
  investment?: {
    id: number;
    loanId: number;
    amount: number;
    expectedReturn: number;
    investmentDate: string;
    maturityDate: string;
  };
  error?: string;
}
#### GET /api/investments/portfolio
// Response
{
  investments: Investment[];
  summary: {
    totalInvested: number;
    expectedReturn: number;
    actualReturn: number;
    activeInvestments: number;
    completedInvestments: number;
  };
}
### ML Model Endpoints

#### POST /api/ml/assess-risk
// Request body
{
  userId: number;
  loanAmount: number;
  termMonths: number;
  purpose: string;
  annualIncome: number;
  creditScore: number;
  employmentStatus: string;
}

// Response
{
  success: boolean;
  assessment?: {
    riskScore: number;
    riskGrade: string;
    probabilityDefault: number;
    riskFactors: {
      creditScore: number;
      incomeStability: number;
      debtToIncome: number;
      loanAmount: number;
    };
    recommendedInterestRate: number;
  };
  error?: string;
}
#### GET /api/ml/loan-matching/:userId
// Response
{
  matches: {
    loanId: number;
    matchScore: number;
    reasons: string[];
  }[];
}
### Payment Endpoints

#### POST /api/payments/schedule
// Request body
{
  loanId: number;
  amount: number;
  paymentDate: string;
}

// Response
{
  success: boolean;
  payment?: PaymentRecord;
  error?: string;
}
#### GET /api/payments/history/:loanId
// Response
{
  payments: PaymentRecord[];
  schedule: {
    dueDate: string;
    amount: number;
    principalAmount: number;
    interestAmount: number;
    status: string;
  }[];
  summary: {
    totalPaid: number;
    remainingBalance: number;
    nextPaymentDue: string;
    nextPaymentAmount: number;
  };
}
---

## ML Model Integration

### Python ML Service Setup

#### Requirements (`ml-service/requirements.txt`)

fastapi==0.104.1
uvicorn[standard]==0.24.0
pandas==2.1.3
numpy==1.24.3
scikit-learn==1.3.2
xgboost==2.0.2
joblib==1.3.2
pydantic==2.5.0
python-multipart==0.0.6
aiofiles==23.2.1
python-dotenv==1.0.0
#### ML Service (`ml-service/main.py`)

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier
import joblib
import os
from typing import List, Dict, Optional

app = FastAPI(title="CommunityLend ML Service", version="1.0.0")

# Load pre-trained models
risk_model = joblib.load('models/risk_assessment_model.pkl')
scaler = joblib.load('models/feature_scaler.pkl')

class RiskAssessmentRequest(BaseModel):
    credit_score: int
    annual_income: float
    loan_amount: float
    term_months: int
    employment_status: str
    debt_to_income_ratio: Optional[float] = None
    previous_defaults: Optional[int] = 0

class LoanMatchingRequest(BaseModel):
    lender_id: int
    risk_tolerance: str  # 'low', 'medium', 'high'
    preferred_amount_min: float
    preferred_amount_max: float
    preferred_term_min: int
    preferred_term_max: int

@app.post("/assess-risk")
async def assess_risk(request: RiskAssessmentRequest):
    try:
        # Prepare features for the model
        features = prepare_features(request)
        
        # Scale features
        scaled_features = scaler.transform([features])
        
        # Make prediction
        risk_probability = risk_model.predict_proba(scaled_features)[0][1]
        risk_score = int(risk_probability * 100)
        
        # Determine risk grade
        risk_grade = get_risk_grade(risk_score)
        
        # Calculate recommended interest rate
        base_rate = 5.0  # Base interest rate
        risk_premium = risk_score * 0.1  # Risk-based premium
        recommended_rate = base_rate + risk_premium
        
        # Identify key risk factors
        risk_factors = analyze_risk_factors(request)
        
        return {
            "success": True,
            "risk_score": risk_score,
            "risk_grade": risk_grade,
            "probability_default": risk_probability,
            "recommended_interest_rate": round(recommended_rate, 2),
            "risk_factors": risk_factors
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/match-loans")
async def match_loans(request: LoanMatchingRequest):
    try:
        # This would typically query your database for available loans
        # and score them based on the lender's preferences
        
        matches = [
            {
                "loan_id": 123,
                "match_score": 85,
                "reasons": [
                    "Amount within preferred range",
                    "Risk grade matches tolerance",
                    "Term aligns with preferences"
                ]
            }
        ]
        
        return {
            "success": True,
            "matches": matches
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def prepare_features(request: RiskAssessmentRequest) -> List[float]:
    """Prepare features for ML model"""
    
    # Employment status encoding
    employment_mapping = {
        'employed': 1,
        'self_employed': 0.7,
        'unemployed': 0,
        'retired': 0.8,
        'student': 0.3
    }
    
    employment_score = employment_mapping.get(request.employment_status, 0.5)
    
    # Debt-to-income ratio calculation
    if request.debt_to_income_ratio is None:
        # Estimate based on loan amount and income
        estimated_debt = request.loan_amount * 0.5  # Assume 50% of loan is additional debt
        request.debt_to_income_ratio = estimated_debt / request.annual_income
    
    # Loan-to-income ratio
    loan_to_income = request.loan_amount / request.annual_income
    
    features = [
        request.credit_score,
        request.annual_income,
        request.loan_amount,
        request.term_months,
        employment_score,
        request.debt_to_income_ratio,
        loan_to_income,
        request.previous_defaults
    ]
    
    return features

def get_risk_grade(risk_score: int) -> str:
    """Convert risk score to letter grade"""
    if risk_score <= 20:
        return 'A'
    elif risk_score <= 40:
        return 'B'
    elif risk_score <= 60:
        return 'C'
    elif risk_score <= 80:
        return 'D'
    else:
        return 'E'

def analyze_risk_factors(request: RiskAssessmentRequest) -> Dict[str, float]:
    """Analyze individual risk factors"""
    
    factors = {}
    
    # Credit score factor (normalized 0-1, lower is better)
    if request.credit_score >= 750:
        factors['credit_score_risk'] = 0.1
    elif request.credit_score >= 700:
        factors['credit_score_risk'] = 0.3
    elif request.credit_score >= 650:
        factors['credit_score_risk'] = 0.5
    else:
        factors['credit_score_risk'] = 0.8
    
    # Income stability factor
    employment_risk = {
        'employed': 0.2,
        'self_employed': 0.6,
        'unemployed': 1.0,
        'retired': 0.4,
        'student': 0.7
    }
    factors['income_stability_risk'] = employment_risk.get(request.employment_status, 0.5)
    
    # Loan amount relative to income
    loan_to_income = request.loan_amount / request.annual_income
    if loan_to_income <= 0.1:
        factors['loan_amount_risk'] = 0.1
    elif loan_to_income <= 0.3:
        factors['loan_amount_risk'] = 0.4
    elif loan_to_income <= 0.5:
        factors['loan_amount_risk'] = 0.7
    else:
        factors['loan_amount_risk'] = 1.0
    
    return factors

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
#### Model Training Script (`ml-service/train_model.py`)

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report, roc_auc_score
import joblib

def train_risk_model():
    # Load your historical loan data
    # This is a placeholder - replace with your actual data loading
    data = pd.read_csv('historical_loans.csv')
    
    # Feature engineering
    features = [
        'credit_score',
        'annual_income',
        'loan_amount',
        'term_months',
        'employment_score',  # Pre-calculated
        'debt_to_income_ratio',
        'loan_to_income_ratio',
        'previous_defaults'
    ]
    
    X = data[features]
    y = data['default']  # Binary: 1 if defaulted, 0 if not
    
    # Split the data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    # Scale features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # Train model
    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=10,
        random_state=42,
        class_weight='balanced'
    )
    
    model.fit(X_train_scaled, y_train)
    
    # Evaluate model
    y_pred = model.predict(X_test_scaled)
    y_pred_proba = model.predict_proba(X_test_scaled)[:,1]
    
    print("Classification Report:")
    print(classification_report(y_test, y_pred))
    print(f"ROC AUC Score: {roc_auc_score(y_test, y_pred_proba):.4f}")
    
    # Save model and scaler
    joblib.dump(model, 'models/risk_assessment_model.pkl')
    joblib.dump(scaler, 'models/feature_scaler.pkl')
    
    print("Model saved successfully!")

if __name__ == "__main__":
    train_risk_model()
#### Docker Setup for ML Service

# Dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
### Integration with Next.js API

#### ML Service Client (`lib/ml-client.ts`)

interface RiskAssessmentRequest {
  creditScore: number;
  annualIncome: number;
  loanAmount: number;
  termMonths: number;
  employmentStatus: string;
  debtToIncomeRatio?: number;
  previousDefaults?: number;
}

interface RiskAssessmentResponse {
  success: boolean;
  riskScore: number;
  riskGrade: string;
  probabilityDefault: number;
  recommendedInterestRate: number;
  riskFactors: {
    creditScoreRisk: number;
    incomeStabilityRisk: number;
    loanAmountRisk: number;
  };
}

class MLService {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = process.env.PYTHON_ML_SERVICE_URL || 'http://localhost:8000';
    this.apiKey = process.env.ML_API_KEY || '';
  }

  async assessRisk(data: RiskAssessmentRequest): Promise<RiskAssessmentResponse> {
    const response = await fetch(`${this.baseUrl}/assess-risk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        credit_score: data.creditScore,
        annual_income: data.annualIncome,
        loan_amount: data.loanAmount,
        term_months: data.termMonths,
        employment_status: data.employmentStatus,
        debt_to_income_ratio: data.debtToIncomeRatio,
        previous_defaults: data.previousDefaults,
      }),
    });

    if (!response.ok) {
      throw new Error(`ML service error: ${response.statusText}`);
    }

    return response.json();
  }

  async matchLoans(lenderId: number, preferences: any) {
    const response = await fetch(`${this.baseUrl}/match-loans`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        lender_id: lenderId,
        ...preferences,
      }),
    });

    if (!response.ok) {
      throw new Error(`ML service error: ${response.statusText}`);
    }

    return response.json();
  }
}

export const mlService = new MLService();
---

## Development Workflow

### Project Structure

communitylend/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── dashboard/
│   │   ├── loans/
│   │   ├── investments/
│   │   └── api/
│   ├── components/
│   │   ├── ui/
│   │   ├── forms/
│   │   └── charts/
│   ├── lib/
│   │   ├── prisma.ts
│   │   ├── auth.ts
│   │   └── utils.ts
│   └── types/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── ml-service/
│   ├── main.py
│   ├── models/
│   └── requirements.txt
├── public/
├── scripts/
└── docs/
### Development Commands

# Install dependencies
npm install

# Start development server
npm run dev

# Start ML service
cd ml-service
python -m uvicorn main:app --reload --port 8000

# Database operations
npx prisma migrate dev
npx prisma generate
npx prisma studio

# Type checking
npm run type-check

# Linting
npm run lint
npm run lint:fix

# Testing
npm run test
npm run test:watch
npm run test:coverage

# Build
npm run build

# Start production server
npm start
### Git Workflow

# Feature development
git checkout -b feature/loan-application
git add .
git commit -m "feat: add loan application form"
git push origin feature/loan-application

# Create pull request and merge
git checkout main
git pull origin main
git branch -d feature/loan-application

# Release
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
### Code Quality Tools

#### ESLint Configuration (`.eslintrc.json`)

{
  "extends": [
    "next/core-web-vitals",
    "@typescript-eslint/recommended"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "prefer-const": "error",
    "no-console": "warn"
  }
}
#### Prettier Configuration (`.prettierrc`)

{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2
}
#### Husky Pre-commit Hooks

npm install --save-dev husky lint-staged

# package.json
{
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ]
  }
}
---

## Production Deployment

### Environment Setup

#### Production Environment Variables

# Production database
DATABASE_URL="postgresql://user:pass@production-db:5432/communitylend?sslmode=require"

# Security
NEXTAUTH_SECRET="production-secret-key-32-characters-minimum"
NEXTAUTH_URL="https://your-domain.com"

# External services
STRIPE_SECRET_KEY="sk_live_your_live_stripe_key"
SMTP_HOST="production-smtp-server"

# Feature flags
NODE_ENV="production"
ML_SERVICE_URL="https://ml-api.your-domain.com"
### Docker Production Setup

#### Multi-stage Dockerfile

# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --only=production

COPY . .

RUN npx prisma generate
RUN npm run build

# Production stage
FROM node:18-alpine AS runner

WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
#### Docker Compose for Production

version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
    depends_on:
      - postgres
    restart: unless-stopped

  ml-service:
    build: ./ml-service
    ports:
      - "8000:8000"
    environment:
      - API_KEY=${ML_API_KEY}
    restart: unless-stopped

  postgres:
    image: postgres:14-alpine
    environment:
      - POSTGRES_DB=${POSTGRES_DB}
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl
    depends_on:
      - app
    restart: unless-stopped

volumes:
  postgres_data:
### Cloud Deployment

#### Vercel Deployment

# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Environment variables via Vercel dashboard or CLI
vercel env add DATABASE_URL
vercel env add NEXTAUTH_SECRET
#### AWS ECS Deployment

# task-definition.json
{
  "family": "communitylend-app",
  "executionRoleArn": "arn:aws:iam::account:role/ecsTaskExecutionRole",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "containerDefinitions": [
    {
      "name": "app",
      "image": "your-account.dkr.ecr.region.amazonaws.com/communitylend:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:communitylend/database-url"
        }
      ]
    }
  ]
}
### Database Migration Strategy

# Production migration checklist
1. Backup database
2. Test migrations on staging
3. Schedule maintenance window
4. Run migrations
5. Verify application functionality
6. Monitor for issues

# Migration script
#!/bin/bash
set -e

echo "Starting database migration..."

# Backup database
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Run migrations
npx prisma migrate deploy

# Verify migration
npx prisma db seed --preview-feature

echo "Migration completed successfully"
---

## Troubleshooting

### Common Issues

#### Database Connection Issues

**Problem:** `Error: connect ECONNREFUSED 127.0.0.1:5432`

**Solution:**
# Check PostgreSQL status
sudo systemctl status postgresql

# Start PostgreSQL
sudo systemctl start postgresql

# Check connection
psql -h localhost -p 5432 -U postgres -d communitylend

# Verify environment variables
echo $DATABASE_URL
**Problem:** `SSL connection required`

**Solution:**
# Update DATABASE_URL with SSL parameters
DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"

# For local development, disable SSL
DATABASE_URL="postgresql://user:pass@localhost:5432/db?sslmode=disable"
#### Prisma Issues

**Problem:** `Prisma Client not found`

**Solution:**
# Generate Prisma client
npx prisma generate

# Clear node_modules and reinstall
rm -rf node_modules
npm install
npx prisma generate
**Problem:** `Migration failed: relation already exists`

**Solution:**
# Reset database (development only)
npx prisma migrate reset

# Or mark migration as applied
npx prisma db push --accept-data-loss
#### ML Service Issues

**Problem:** `Connection refused to ML service`

**Solution:**
# Check ML service status
curl http://localhost:8000/docs

# Check service logs
docker logs ml-service

# Restart service
cd ml-service
python -m uvicorn main:app --reload
**Problem:** `Model file not found`

**Solution:**
# Ensure model files exist
ls -la ml-service/models/

# Train models if missing
cd ml-service
python train_model.py

# Check file permissions
chmod 644 ml-service/models/*.pkl
#### Performance Issues

**Problem:** Slow database queries

**Solution:**
-- Check query performance
EXPLAIN ANALYZE SELECT * FROM loans WHERE status = 'pending';

-- Add missing indexes
CREATE INDEX IF NOT EXISTS idx_loans_status_amount ON loans(status, amount);

-- Update table statistics
ANALYZE loans;
**Problem:** Memory issues in production

**Solution:**
# Check memory usage
docker stats

# Increase container memory limits
# In docker-compose.yml:
services:
  app:
    deploy:
      resources:
        limits:
          memory: 2G
#### Authentication Issues

**Problem:** `NextAuth.js JWT error`

**Solution:**
# Regenerate NEXTAUTH_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Clear browser cookies and sessions
# Update environment variable and restart
#### File Upload Issues

**Problem:** File upload fails

**Solution:**
# Check file size limits
# In next.config.js:
module.exports = {
  experimental: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
}

# Check disk space
df -h

# Verify upload directory permissions
ls -la public/uploads/
### Debugging Tools

#### Database Debugging

-- Check active connections
SELECT * FROM pg_stat_activity;

-- Monitor slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

-- Check table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
#### Application Debugging

// Enable debug logging
// lib/logger.ts
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true
    }
  }
});

// Usage in API routes
import { logger } from '@/lib/logger';

export async function POST(request: Request) {
  try {
    logger.info('Processing loan application');
    // ... your code
  } catch (error) {
    logger.error({ error }, 'Loan application failed');
    throw error;
  }
}
#### Performance Monitoring

// lib/monitoring.ts
import { NextRequest, NextResponse } from 'next/server';

export function withMonitoring(handler: Function) {
  return async (request: NextRequest, context: any) => {
    const start = Date.now();
    
    try {
      const response = await handler(request, context);
      const duration = Date.now() - start;
      
      console.log(`${request.method} ${request.url} - ${duration}ms`);
      
      return response;
    } catch (error) {
      console.error(`${request.method} ${request.url} - Error:`, error);
      throw error;
    }
  };
}
---

## Architecture Overview

### System Architecture

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Database      │
│   (Next.js)     │◄──►│   (Next.js API) │◄──►│   (PostgreSQL)  │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                        │
         ▼                        ▼
┌─────────────────┐    ┌─────────────────┐
│   External      │    │   ML Service    │
│   Services      │    │   (FastAPI)     │
│   (Stripe,etc)  │    │                 │
└─────────────────┘    └─────────────────┘
### Data Flow

1. **User Registration/Login**
   - User submits credentials
   - NextAuth.js handles authentication
   - JWT token issued for session management
   - User profile stored in PostgreSQL

2. **Loan Application**
   - Borrower fills application form
   - Data validated on client and server
   - ML service assesses risk and assigns grade
   - Loan stored with calculated payments and rates

3. **Investment Process**
   - Lender browses available loans
   - ML service provides loan matching recommendations
   - Investment transaction recorded
   - Payment schedules generated

4. **Payment Processing**
   - Scheduled payments tracked
   - Stripe integration for payment processing
   - Payment history updated
   - Notifications sent to relevant parties

### Security Model

#### Authentication & Authorization

// lib/auth.ts - NextAuth configuration
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        
        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });
        
        if (!user) return null;
        
        const isValid = await bcrypt.compare(
          credentials.password, 
          user.passwordHash
        );
        
        if (!isValid) return null;
        
        return {
          id: user.id.toString(),
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        };
      }
    })
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.userId;
      }
      return session;
    },
  },
};
#### API Route Protection

// lib/auth-middleware.ts
import { getServerSession } from "next-auth";
import { authOptions } from "./auth";

export async function withAuth(handler: Function) {
  return async (request: Request, context: any) => {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return new Response("Unauthorized", { status: 401 });
    }
    
    return handler(request, { ...context, user: session.user });
  };
}

// Usage in API routes
export const POST = withAuth(async (request: Request, { user }) => {
  // Protected route logic
});
#### Data Protection

1. **Input Validation:** Zod schemas for all inputs
2. **SQL Injection:** Prisma ORM with parameterized queries
3. **XSS Protection:** Content Security Policy headers
4. **CSRF Protection:** SameSite cookies and CSRF tokens
5. **Rate Limiting:** API route throttling
6. **Data Encryption:** Sensitive data encrypted at rest

### Scalability Considerations

#### Database Optimization

- **Indexing Strategy:** Optimized indexes for common queries
- **Connection Pooling:** PgBouncer for connection management
- **Read Replicas:** Separate read/write database instances
- **Partitioning:** Large tables partitioned by date/status

#### Application Scaling

- **Horizontal Scaling:** Multiple app instances behind load balancer
- **Caching:** Redis for session storage and frequently accessed data
- **CDN:** Static assets served via CloudFront/Cloudflare
- **Microservices:** ML service separated for independent scaling

#### Performance Monitoring

- **APM:** Application Performance Monitoring with tools like DataDog
- **Database Monitoring:** Query performance tracking
- **Error Tracking:** Sentry integration for error reporting
- **Logging:** Structured logging with request correlation IDs

---

This README provides a comprehensive guide for setting up, developing, and deploying the CommunityLend platform. For additional questions or support, please refer to the project documentation or contact the development team.