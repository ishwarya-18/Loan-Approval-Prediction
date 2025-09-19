import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

// Environment variable validation
const requiredEnvVars = {
  DATABASE_URL: process.env.DATABASE_URL,
  DATABASE_HOST: process.env.DATABASE_HOST,
  DATABASE_PORT: process.env.DATABASE_PORT,
  DATABASE_NAME: process.env.DATABASE_NAME,
  DATABASE_USER: process.env.DATABASE_USER,
  DATABASE_PASSWORD: process.env.DATABASE_PASSWORD,
} as const;

// Validate environment variables
function validateEnvironment(): void {
  const missingVars: string[] = [];

  // Check if DATABASE_URL is provided
  if (!requiredEnvVars.DATABASE_URL) {
    // If no DATABASE_URL, check individual connection parameters
    if (!requiredEnvVars.DATABASE_HOST) missingVars.push('DATABASE_HOST');
    if (!requiredEnvVars.DATABASE_PORT) missingVars.push('DATABASE_PORT');
    if (!requiredEnvVars.DATABASE_NAME) missingVars.push('DATABASE_NAME');
    if (!requiredEnvVars.DATABASE_USER) missingVars.push('DATABASE_USER');
    if (!requiredEnvVars.DATABASE_PASSWORD) missingVars.push('DATABASE_PASSWORD');
    
    if (missingVars.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missingVars.join(', ')}. ` +
        'Either provide DATABASE_URL or all individual database connection parameters.'
      );
    }
  }
}

// Validate environment on module load
validateEnvironment();

// Database pool configuration
const poolConfig = {
  connectionString: requiredEnvVars.DATABASE_URL,
  host: requiredEnvVars.DATABASE_HOST,
  port: requiredEnvVars.DATABASE_PORT ? parseInt(requiredEnvVars.DATABASE_PORT, 10) : 5432,
  database: requiredEnvVars.DATABASE_NAME,
  user: requiredEnvVars.DATABASE_USER,
  password: requiredEnvVars.DATABASE_PASSWORD,
  // Connection pool settings
  max: 20, // Maximum number of connections in the pool
  min: 2, // Minimum number of connections to keep open
  idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
  connectionTimeoutMillis: 10000, // Timeout for acquiring connection
  // SSL configuration for production
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
};

// Create the connection pool
const pool = new Pool(poolConfig);

// Handle pool errors
pool.on('error', (err: Error) => {
  console.error('Database pool error:', err);
});

pool.on('connect', () => {
  console.log('New database connection established');
});

pool.on('acquire', () => {
  console.log('Database connection acquired from pool');
});

pool.on('remove', () => {
  console.log('Database connection removed from pool');
});

// Create Drizzle database instance
export const db = drizzle(pool, { 
  schema,
  logger: process.env.NODE_ENV === 'development'
});

// Connection health check function
export async function checkDatabaseHealth(): Promise<{
  healthy: boolean;
  details: {
    connected: boolean;
    totalConnections?: number;
    idleConnections?: number;
    waitingClients?: number;
    latency?: number;
    error?: string;
  };
}> {
  try {
    const startTime = Date.now();
    
    // Test basic connectivity with a simple query
    await pool.query('SELECT 1 as health_check');
    
    const latency = Date.now() - startTime;
    
    // Get pool statistics
    const poolStats = {
      totalConnections: pool.totalCount,
      idleConnections: pool.idleCount,
      waitingClients: pool.waitingCount,
    };

    return {
      healthy: true,
      details: {
        connected: true,
        latency,
        ...poolStats,
      },
    };
  } catch (error) {
    console.error('Database health check failed:', error);
    
    return {
      healthy: false,
      details: {
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown database error',
      },
    };
  }
}

// Graceful shutdown function
export async function closeDatabaseConnection(): Promise<void> {
  try {
    await pool.end();
    console.log('Database connection pool closed gracefully');
  } catch (error) {
    console.error('Error closing database connection pool:', error);
    throw error;
  }
}

// Database transaction helper
export async function withTransaction<T>(
  callback: (tx: typeof db) => Promise<T>
): Promise<T> {
  return await db.transaction(callback);
}

// Export types for use in other modules
export type DatabaseType = typeof db;
export type DatabaseTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

// Export the pool for direct access if needed
export { pool };

// Default export for convenience
export default db;