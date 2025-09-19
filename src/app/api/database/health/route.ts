import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  const start = performance.now()
  
  try {
    // Test basic connectivity with a simple query
    const connectivityStart = performance.now()
    const result = await db.raw('SELECT 1 as health_check')
    const connectivityEnd = performance.now()
    const connectivityLatency = Math.round(connectivityEnd - connectivityStart)

    // Get database version and basic info
    const versionStart = performance.now()
    const versionResult = await db.raw('SELECT version() as version')
    const versionEnd = performance.now()
    const versionLatency = Math.round(versionEnd - versionStart)

    // Test a more complex query to check performance
    const performanceStart = performance.now()
    await db.raw('SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = current_schema()')
    const performanceEnd = performance.now()
    const performanceLatency = Math.round(performanceEnd - performanceStart)

    // Get connection pool information
    const poolConfig = db.client.pool
    const poolInfo = {
      min: poolConfig.min,
      max: poolConfig.max,
      used: poolConfig.numUsed(),
      free: poolConfig.numFree(),
      pending: poolConfig.numPendingAcquires(),
      pendingCreates: poolConfig.numPendingCreates(),
      destroyed: poolConfig.numPendingValidations()
    }

    // Calculate total response time
    const totalLatency = Math.round(performance.now() - start)

    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        version: versionResult.rows[0]?.version || 'Unknown',
        schema: await getCurrentSchema()
      },
      latency: {
        connectivity: connectivityLatency,
        version: versionLatency,
        performance: performanceLatency,
        total: totalLatency
      },
      connectionPool: poolInfo,
      metrics: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        nodeVersion: process.version
      }
    }

    return NextResponse.json(healthData, { status: 200 })

  } catch (error) {
    const totalLatency = Math.round(performance.now() - start)
    
    console.error('Database health check failed:', error)
    
    const errorData = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: {
        message: error instanceof Error ? error.message : 'Unknown database error',
        code: (error as any)?.code || 'UNKNOWN_ERROR',
        type: error instanceof Error ? error.constructor.name : 'UnknownError'
      },
      latency: {
        total: totalLatency
      },
      database: {
        connected: false
      },
      metrics: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        nodeVersion: process.version
      }
    }

    return NextResponse.json(errorData, { status: 503 })
  }
}

async function getCurrentSchema(): Promise<string> {
  try {
    const result = await db.raw('SELECT current_schema() as schema')
    return result.rows[0]?.schema || 'public'
  } catch {
    return 'unknown'
  }
}

// Optional: Add a HEAD method for simple connectivity checks
export async function HEAD(request: NextRequest) {
  try {
    await db.raw('SELECT 1')
    return new NextResponse(null, { status: 200 })
  } catch {
    return new NextResponse(null, { status: 503 })
  }
}