
import { NextRequest, NextResponse } from 'next/server';
import { monitoringService } from '@/lib/monitoring';

export async function GET(req: NextRequest) {
  try {
    const systemStatus = await monitoringService.getSystemStatus();
    
    return NextResponse.json({
      success: true,
      data: systemStatus,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Health check error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// Endpoint específico para health check simple
export async function HEAD(req: NextRequest) {
  try {
    const dbCheck = await monitoringService.checkDatabaseHealth();
    const status = dbCheck.status === 'healthy' ? 200 : 503;
    
    return new NextResponse(null, { 
      status,
      headers: {
        'Cache-Control': 'no-cache',
        'X-Health-Status': dbCheck.status
      }
    });
  } catch (error) {
    return new NextResponse(null, { status: 503 });
  }
}
