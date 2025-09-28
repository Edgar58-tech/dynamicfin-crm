
import { NextRequest, NextResponse } from 'next/server';
import { testingService } from '@/lib/testing';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { category } = body; // 'unit', 'integration', 'api', 'e2e' o 'all'
    
    // Por ahora ejecutamos todos los tests
    const testSuite = await testingService.runAllTests();
    const report = testingService.generateReport(testSuite);
    
    return NextResponse.json({
      success: true,
      data: {
        suite: testSuite,
        report: report
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Test execution error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  // Endpoint para obtener el estado de los últimos tests
  try {
    return NextResponse.json({
      success: true,
      data: {
        message: 'Testing service is available',
        availableEndpoints: [
          'POST /api/testing/run - Execute test suite',
          'GET /api/testing/run - Get testing service status'
        ]
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
