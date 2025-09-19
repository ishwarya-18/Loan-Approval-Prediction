-- Initial migration: Create all tables and enums for the loan application system
-- Migration: 001_initial_database_schema.sql

-- Create enum types first

-- User role enum for role-based access control
CREATE TYPE user_role AS ENUM ('USER', 'ADMIN', 'LOAN_OFFICER');

-- Loan application status enum for tracking application lifecycle
CREATE TYPE application_status AS ENUM (
    'DRAFT',           -- Initial state, user still editing
    'SUBMITTED',       -- Submitted for review
    'UNDER_REVIEW',    -- Being processed by loan officers
    'APPROVED',        -- Application approved
    'REJECTED',        -- Application rejected
    'WITHDRAWN'        -- User withdrew application
);

-- Loan type enum for categorizing different loan products
CREATE TYPE loan_type AS ENUM (
    'PERSONAL',        -- Personal/unsecured loans
    'HOME',           -- Home/mortgage loans
    'AUTO',           -- Auto/vehicle loans
    'BUSINESS',       -- Business loans
    'EDUCATION',      -- Student/education loans
    'CREDIT_CARD'     -- Credit card applications
);

-- Prediction confidence level for ML model outputs
CREATE TYPE confidence_level AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- Create extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table: Core user management with authentication and profile data
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role user_role NOT NULL DEFAULT 'USER',
    date_of_birth DATE,
    -- Address information for loan applications
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(20),
    country VARCHAR(50) DEFAULT 'US',
    -- Financial profile data
    annual_income DECIMAL(12,2),
    employment_status VARCHAR(50),
    employer_name VARCHAR(255),
    years_employed INTEGER,
    -- Account management
    email_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Loan providers table: External lenders and financial institutions
CREATE TABLE loan_providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    website_url VARCHAR(500),
    logo_url VARCHAR(500),
    -- Contact information
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    -- Provider characteristics
    min_loan_amount DECIMAL(12,2),
    max_loan_amount DECIMAL(12,2),
    min_interest_rate DECIMAL(5,4), -- e.g., 0.0350 for 3.5%
    max_interest_rate DECIMAL(5,4),
    min_credit_score INTEGER,
    -- Supported loan types (JSON array for flexibility)
    supported_loan_types JSON,
    -- Provider status and metadata
    is_active BOOLEAN DEFAULT TRUE,
    requires_collateral BOOLEAN DEFAULT FALSE,
    average_approval_time_days INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Loan applications table: Core application data and financial details
CREATE TABLE loan_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Application metadata
    status application_status NOT NULL DEFAULT 'DRAFT',
    loan_type loan_type NOT NULL,
    
    -- Loan details
    requested_amount DECIMAL(12,2) NOT NULL CHECK (requested_amount > 0),
    loan_purpose TEXT,
    preferred_term_months INTEGER CHECK (preferred_term_months > 0),
    
    -- Applicant financial information
    applicant_annual_income DECIMAL(12,2) NOT NULL CHECK (applicant_annual_income >= 0),
    applicant_employment_status VARCHAR(50) NOT NULL,
    applicant_employer_name VARCHAR(255),
    applicant_years_employed INTEGER CHECK (applicant_years_employed >= 0),
    applicant_credit_score INTEGER CHECK (applicant_credit_score BETWEEN 300 AND 850),
    
    -- Debt and financial obligations
    monthly_debt_payments DECIMAL(10,2) DEFAULT 0 CHECK (monthly_debt_payments >= 0),
    existing_loans_count INTEGER DEFAULT 0 CHECK (existing_loans_count >= 0),
    
    -- Collateral information (for secured loans)
    collateral_type VARCHAR(100),
    collateral_value DECIMAL(12,2) CHECK (collateral_value >= 0),
    collateral_description TEXT,
    
    -- Application processing
    submitted_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    decision_reason TEXT,
    
    -- Audit trail
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure submitted applications have required submission timestamp
    CONSTRAINT check_submitted_status CHECK (
        (status = 'SUBMITTED' AND submitted_at IS NOT NULL) OR 
        (status != 'SUBMITTED')
    )
);

-- Loan predictions table: ML model predictions for loan approval likelihood
CREATE TABLE loan_predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    loan_application_id UUID NOT NULL REFERENCES loan_applications(id) ON DELETE CASCADE,
    loan_provider_id UUID NOT NULL REFERENCES loan_providers(id) ON DELETE CASCADE,
    
    -- Prediction results
    approval_probability DECIMAL(5,4) NOT NULL CHECK (approval_probability BETWEEN 0 AND 1),
    confidence_level confidence_level NOT NULL,
    
    -- Estimated terms (what the provider might offer)
    estimated_interest_rate DECIMAL(5,4) CHECK (estimated_interest_rate >= 0),
    estimated_monthly_payment DECIMAL(10,2) CHECK (estimated_monthly_payment >= 0),
    estimated_approval_time_days INTEGER CHECK (estimated_approval_time_days >= 0),
    
    -- Model metadata
    model_version VARCHAR(50) NOT NULL,
    prediction_features JSON, -- Store the features used for this prediction
    risk_factors TEXT[], -- Array of identified risk factors
    
    -- Prediction lifecycle
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE, -- Predictions may become stale
    
    -- Ensure unique prediction per application-provider combination
    CONSTRAINT unique_application_provider_prediction 
        UNIQUE (loan_application_id, loan_provider_id)
);

-- Loan ratings table: User feedback and ratings for loan providers
CREATE TABLE loan_ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    loan_provider_id UUID NOT NULL REFERENCES loan_providers(id) ON DELETE CASCADE,
    
    -- Rating and feedback
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    review_title VARCHAR(200),
    review_text TEXT,
    
    -- Rating context
    loan_amount DECIMAL(12,2) CHECK (loan_amount > 0),
    loan_type loan_type,
    was_approved BOOLEAN,
    
    -- Helpful for other users
    helpful_count INTEGER DEFAULT 0 CHECK (helpful_count >= 0),
    
    -- Rating metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Prevent duplicate ratings from same user for same provider
    CONSTRAINT unique_user_provider_rating UNIQUE (user_id, loan_provider_id)
);

-- Create indexes for optimal query performance

-- Users table indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active) WHERE is_active = true;
CREATE INDEX idx_users_created_at ON users(created_at);

-- Loan applications indexes
CREATE INDEX idx_loan_applications_user_id ON loan_applications(user_id);
CREATE INDEX idx_loan_applications_status ON loan_applications(status);
CREATE INDEX idx_loan_applications_loan_type ON loan_applications(loan_type);
CREATE INDEX idx_loan_applications_created_at ON loan_applications(created_at);
CREATE INDEX idx_loan_applications_submitted_at ON loan_applications(submitted_at) WHERE submitted_at IS NOT NULL;
CREATE INDEX idx_loan_applications_user_status ON loan_applications(user_id, status);
CREATE INDEX idx_loan_applications_amount_range ON loan_applications(requested_amount, loan_type);

-- Loan providers indexes
CREATE INDEX idx_loan_providers_name ON loan_providers(name);
CREATE INDEX idx_loan_providers_active ON loan_providers(is_active) WHERE is_active = true;
CREATE INDEX idx_loan_providers_loan_amount_range ON loan_providers(min_loan_amount, max_loan_amount);
CREATE INDEX idx_loan_providers_interest_rate_range ON loan_providers(min_interest_rate, max_interest_rate);

-- Loan predictions indexes
CREATE INDEX idx_loan_predictions_application_id ON loan_predictions(loan_application_id);
CREATE INDEX idx_loan_predictions_provider_id ON loan_predictions(loan_provider_id);
CREATE INDEX idx_loan_predictions_approval_probability ON loan_predictions(approval_probability);
CREATE INDEX idx_loan_predictions_confidence ON loan_predictions(confidence_level);
CREATE INDEX idx_loan_predictions_created_at ON loan_predictions(created_at);
CREATE INDEX idx_loan_predictions_expires_at ON loan_predictions(expires_at) WHERE expires_at IS NOT NULL;

-- Loan ratings indexes
CREATE INDEX idx_loan_ratings_user_id ON loan_ratings(user_id);
CREATE INDEX idx_loan_ratings_provider_id ON loan_ratings(loan_provider_id);
CREATE INDEX idx_loan_ratings_rating ON loan_ratings(rating);
CREATE INDEX idx_loan_ratings_created_at ON loan_ratings(created_at);
CREATE INDEX idx_loan_ratings_helpful ON loan_ratings(helpful_count) WHERE helpful_count > 0;

-- Add table comments for documentation
COMMENT ON TABLE users IS 'Core user accounts with authentication and profile information';
COMMENT ON TABLE loan_providers IS 'External loan providers and financial institutions';
COMMENT ON TABLE loan_applications IS 'Loan applications submitted by users with financial details';
COMMENT ON TABLE loan_predictions IS 'ML model predictions for loan approval probability by provider';
COMMENT ON TABLE loan_ratings IS 'User ratings and reviews for loan providers';

-- Add column comments for important fields
COMMENT ON COLUMN users.role IS 'User role for access control (USER, ADMIN, LOAN_OFFICER)';
COMMENT ON COLUMN users.annual_income IS 'User annual income in USD for loan eligibility';
COMMENT ON COLUMN loan_applications.status IS 'Current status of the loan application workflow';
COMMENT ON COLUMN loan_applications.applicant_credit_score IS 'Credit score (300-850 FICO range)';
COMMENT ON COLUMN loan_predictions.approval_probability IS 'ML model probability of approval (0.0-1.0)';
COMMENT ON COLUMN loan_predictions.model_version IS 'Version of ML model used for prediction';
COMMENT ON COLUMN loan_ratings.rating IS 'User rating of loan provider (1-5 stars)';