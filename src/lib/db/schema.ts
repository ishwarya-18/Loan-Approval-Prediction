import { pgTable, serial, text, varchar, timestamp, integer, numeric, boolean, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Enums
export const genderEnum = pgEnum('gender', ['Male', 'Female', 'Other']);
export const educationEnum = pgEnum('education', ['Graduate', 'Not Graduate']);
export const propertyAreaEnum = pgEnum('property_area', ['Urban', 'Semiurban', 'Rural']);
export const loanStatusEnum = pgEnum('loan_status', ['Y', 'N', 'Pending']);

// Users table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  passwordHash: text('password_hash').notNull(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Loan applications table
export const loanApplications = pgTable('loan_applications', {
  id: serial('id').primaryKey(),
  loanId: varchar('loan_id', { length: 50 }).unique(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
  gender: genderEnum('gender').notNull(),
  married: boolean('married').notNull().default(false),
  dependents: integer('dependents').notNull().default(0),
  education: educationEnum('education').notNull(),
  selfEmployed: boolean('self_employed').notNull().default(false),
  applicantIncome: numeric('applicant_income', { precision: 12, scale: 2 }).notNull(),
  coapplicantIncome: numeric('coapplicant_income', { precision: 12, scale: 2 }).default('0.00'),
  loanAmount: numeric('loan_amount', { precision: 12, scale: 2 }).notNull(),
  loanAmountTerm: integer('loan_amount_term').notNull(), // in days
  creditHistory: boolean('credit_history').notNull().default(true),
  propertyArea: propertyAreaEnum('property_area').notNull(),
  loanStatus: loanStatusEnum('loan_status').notNull().default('Pending'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Loan providers table
export const loanProviders = pgTable('loan_providers', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  minAmount: numeric('min_amount', { precision: 12, scale: 2 }).notNull(),
  maxAmount: numeric('max_amount', { precision: 12, scale: 2 }).notNull(),
  minInterestRate: numeric('min_interest_rate', { precision: 5, scale: 2 }).notNull(), // e.g., 5.50%
  maxInterestRate: numeric('max_interest_rate', { precision: 5, scale: 2 }).notNull(),
  processingTime: integer('processing_time').notNull(), // in days
  features: jsonb('features'), // JSON object with additional provider features
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Loan predictions table
export const loanPredictions = pgTable('loan_predictions', {
  id: serial('id').primaryKey(),
  applicationId: integer('application_id').references(() => loanApplications.id, { onDelete: 'cascade' }).notNull(),
  predictedApproval: boolean('predicted_approval').notNull(),
  confidenceScore: numeric('confidence_score', { precision: 5, scale: 4 }), // e.g., 0.8534 (85.34%)
  modelVersion: varchar('model_version', { length: 50 }).notNull(),
  predictionFactors: jsonb('prediction_factors'), // JSON object with factors that influenced prediction
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// Loan ratings table
export const loanRatings = pgTable('loan_ratings', {
  id: serial('id').primaryKey(),
  loanProviderId: integer('loan_provider_id').references(() => loanProviders.id, { onDelete: 'cascade' }).notNull(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  rating: integer('rating').notNull(), // 1-5 star rating
  review: text('review'),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// Type exports for TypeScript
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type LoanApplication = typeof loanApplications.$inferSelect;
export type NewLoanApplication = typeof loanApplications.$inferInsert;

export type LoanProvider = typeof loanProviders.$inferSelect;
export type NewLoanProvider = typeof loanProviders.$inferInsert;

export type LoanPrediction = typeof loanPredictions.$inferSelect;
export type NewLoanPrediction = typeof loanPredictions.$inferInsert;

export type LoanRating = typeof loanRatings.$inferSelect;
export type NewLoanRating = typeof loanRatings.$inferInsert;

// Enum type exports
export type Gender = 'Male' | 'Female' | 'Other';
export type Education = 'Graduate' | 'Not Graduate';
export type PropertyArea = 'Urban' | 'Semiurban' | 'Rural';
export type LoanStatus = 'Y' | 'N' | 'Pending';