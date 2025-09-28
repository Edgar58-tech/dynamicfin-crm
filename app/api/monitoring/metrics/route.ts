
import { NextRequest, NextResponse } from 'next/server';
import { monitoringService } from '@/lib/monitoring';

export async function GET(req: NextRequest) {
  try {
    const metrics = await monitoringService.collectSystemMetrics();
    
    return NextResponse.json({
      success: true,
      data: {
        current: metrics,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error('Metrics collection error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
