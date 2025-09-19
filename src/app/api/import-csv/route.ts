import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { parse } from 'csv-parse';

const prisma = new PrismaClient();

interface CSVRow {
  Loan_ID: string;
  Gender: string;
  Married: string;
  Dependents: string;
  Education: string;
  Self_Employed: string;
  ApplicantIncome: string;
  CoapplicantIncome: string;
  LoanAmount: string;
  Loan_Amount_Term: string;
  Credit_History: string;
  Property_Area: string;
  Loan_Status: string;
}

interface ImportResult {
  totalRecords: number;
  successfulInserts: number;
  duplicateSkipped: number;
  validationErrors: number;
  errors: string[];
  summary: string;
}

function parseNumber(value: string): number | null {
  if (!value || value.trim() === '' || value === 'null' || value === 'NULL') {
    return null;
  }
  const parsed = parseFloat(value);
  return isNaN(parsed) ? null : parsed;
}

function parseInteger(value: string): number | null {
  if (!value || value.trim() === '' || value === 'null' || value === 'NULL') {
    return null;
  }
  const parsed = parseInt(value);
  return isNaN(parsed) ? null : parsed;
}

function normalizeDependents(dependents: string): number | null {
  if (!dependents || dependents.trim() === '' || dependents === 'null') {
    return null;
  }
  if (dependents === '3+') {
    return 3;
  }
  return parseInteger(dependents);
}

function validateRow(row: CSVRow, rowIndex: number): string[] {
  const errors: string[] = [];

  // Required fields
  if (!row.Loan_ID?.trim()) {
    errors.push(`Row ${rowIndex + 1}: Loan_ID is required`);
  }

  if (!row.Gender?.trim()) {
    errors.push(`Row ${rowIndex + 1}: Gender is required`);
  } else if (!['Male', 'Female'].includes(row.Gender)) {
    errors.push(`Row ${rowIndex + 1}: Gender must be 'Male' or 'Female'`);
  }

  if (!row.Married?.trim()) {
    errors.push(`Row ${rowIndex + 1}: Married is required`);
  } else if (!['Yes', 'No'].includes(row.Married)) {
    errors.push(`Row ${rowIndex + 1}: Married must be 'Yes' or 'No'`);
  }

  if (!row.Education?.trim()) {
    errors.push(`Row ${rowIndex + 1}: Education is required`);
  } else if (!['Graduate', 'Not Graduate'].includes(row.Education)) {
    errors.push(`Row ${rowIndex + 1}: Education must be 'Graduate' or 'Not Graduate'`);
  }

  if (!row.Self_Employed?.trim()) {
    errors.push(`Row ${rowIndex + 1}: Self_Employed is required`);
  } else if (!['Yes', 'No'].includes(row.Self_Employed)) {
    errors.push(`Row ${rowIndex + 1}: Self_Employed must be 'Yes' or 'No'`);
  }

  if (!row.Property_Area?.trim()) {
    errors.push(`Row ${rowIndex + 1}: Property_Area is required`);
  } else if (!['Urban', 'Semiurban', 'Rural'].includes(row.Property_Area)) {
    errors.push(`Row ${rowIndex + 1}: Property_Area must be 'Urban', 'Semiurban', or 'Rural'`);
  }

  if (!row.Loan_Status?.trim()) {
    errors.push(`Row ${rowIndex + 1}: Loan_Status is required`);
  } else if (!['Y', 'N'].includes(row.Loan_Status)) {
    errors.push(`Row ${rowIndex + 1}: Loan_Status must be 'Y' or 'N'`);
  }

  // Validate numeric fields
  const applicantIncome = parseNumber(row.ApplicantIncome);
  if (applicantIncome !== null && applicantIncome < 0) {
    errors.push(`Row ${rowIndex + 1}: ApplicantIncome must be non-negative`);
  }

  const coapplicantIncome = parseNumber(row.CoapplicantIncome);
  if (coapplicantIncome !== null && coapplicantIncome < 0) {
    errors.push(`Row ${rowIndex + 1}: CoapplicantIncome must be non-negative`);
  }

  const loanAmount = parseNumber(row.LoanAmount);
  if (loanAmount !== null && loanAmount <= 0) {
    errors.push(`Row ${rowIndex + 1}: LoanAmount must be positive if provided`);
  }

  const loanTerm = parseInteger(row.Loan_Amount_Term);
  if (loanTerm !== null && loanTerm <= 0) {
    errors.push(`Row ${rowIndex + 1}: Loan_Amount_Term must be positive if provided`);
  }

  const creditHistory = parseInteger(row.Credit_History);
  if (creditHistory !== null && ![0, 1].includes(creditHistory)) {
    errors.push(`Row ${rowIndex + 1}: Credit_History must be 0 or 1 if provided`);
  }

  return errors;
}

function transformRowToDatabase(row: CSVRow) {
  return {
    loanId: row.Loan_ID,
    gender: row.Gender as 'Male' | 'Female',
    married: row.Married === 'Yes',
    dependents: normalizeDependents(row.Dependents),
    education: row.Education as 'Graduate' | 'Not Graduate',
    selfEmployed: row.Self_Employed === 'Yes',
    applicantIncome: parseNumber(row.ApplicantIncome),
    coapplicantIncome: parseNumber(row.CoapplicantIncome),
    loanAmount: parseNumber(row.LoanAmount),
    loanAmountTerm: parseInteger(row.Loan_Amount_Term),
    creditHistory: parseInteger(row.Credit_History),
    propertyArea: row.Property_Area as 'Urban' | 'Semiurban' | 'Rural',
    loanStatus: row.Loan_Status === 'Y'
  };
}

async function parseCsvData(csvData: string): Promise<CSVRow[]> {
  return new Promise((resolve, reject) => {
    const records: CSVRow[] = [];
    
    parse(csvData, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    })
    .on('data', (row: CSVRow) => {
      records.push(row);
    })
    .on('error', (err) => {
      reject(err);
    })
    .on('end', () => {
      resolve(records);
    });
  });
}

export async function POST(request: NextRequest): Promise<NextResponse<ImportResult>> {
  try {
    let csvData: string;

    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      // Handle file upload
      const formData = await request.formData();
      const file = formData.get('file') as File;
      
      if (!file) {
        return NextResponse.json(
          {
            totalRecords: 0,
            successfulInserts: 0,
            duplicateSkipped: 0,
            validationErrors: 0,
            errors: ['No file uploaded'],
            summary: 'Import failed: No file provided'
          },
          { status: 400 }
        );
      }

      csvData = await file.text();
    } else {
      // Handle raw CSV data
      const body = await request.json();
      csvData = body.csvData;

      if (!csvData) {
        return NextResponse.json(
          {
            totalRecords: 0,
            successfulInserts: 0,
            duplicateSkipped: 0,
            validationErrors: 0,
            errors: ['No CSV data provided'],
            summary: 'Import failed: No CSV data provided'
          },
          { status: 400 }
        );
      }
    }

    // Parse CSV data
    let records: CSVRow[];
    try {
      records = await parseCsvData(csvData);
    } catch (parseError) {
      return NextResponse.json(
        {
          totalRecords: 0,
          successfulInserts: 0,
          duplicateSkipped: 0,
          validationErrors: 0,
          errors: [`CSV parsing error: ${parseError}`],
          summary: 'Import failed: Invalid CSV format'
        },
        { status: 400 }
      );
    }

    if (records.length === 0) {
      return NextResponse.json(
        {
          totalRecords: 0,
          successfulInserts: 0,
          duplicateSkipped: 0,
          validationErrors: 0,
          errors: ['CSV file is empty or contains no valid records'],
          summary: 'Import failed: Empty CSV file'
        },
        { status: 400 }
      );
    }

    const result: ImportResult = {
      totalRecords: records.length,
      successfulInserts: 0,
      duplicateSkipped: 0,
      validationErrors: 0,
      errors: [],
      summary: ''
    };

    // Validate and process records
    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      
      // Validate row
      const validationErrors = validateRow(row, i);
      if (validationErrors.length > 0) {
        result.validationErrors++;
        result.errors.push(...validationErrors);
        continue;
      }

      try {
        // Check for duplicates
        const existing = await prisma.loanApplication.findUnique({
          where: { loanId: row.Loan_ID }
        });

        if (existing) {
          result.duplicateSkipped++;
          continue;
        }

        // Transform and insert
        const transformedData = transformRowToDatabase(row);
        await prisma.loanApplication.create({
          data: transformedData
        });

        result.successfulInserts++;
      } catch (dbError) {
        result.errors.push(`Row ${i + 1}: Database error - ${dbError}`);
      }
    }

    // Generate summary
    const successRate = ((result.successfulInserts / result.totalRecords) * 100).toFixed(1);
    result.summary = `Import completed: ${result.successfulInserts}/${result.totalRecords} records imported successfully (${successRate}%). ${result.duplicateSkipped} duplicates skipped, ${result.validationErrors} validation errors.`;

    // Determine response status
    const status = result.successfulInserts > 0 ? 200 : 400;

    return NextResponse.json(result, { status });

  } catch (error) {
    console.error('Import error:', error);
    
    return NextResponse.json(
      {
        totalRecords: 0,
        successfulInserts: 0,
        duplicateSkipped: 0,
        validationErrors: 0,
        errors: [`Unexpected error: ${error}`],
        summary: 'Import failed due to unexpected error'
      },
      { status: 500 }
    );
  }
}