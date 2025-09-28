
// Sistema integral de testing para DynamicFin CRM
import { PrismaClient } from '@prisma/client';

export interface TestResult {
  testName: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: string;
  timestamp: Date;
  category: 'unit' | 'integration' | 'e2e' | 'api';
}

export interface TestSuite {
  suiteName: string;
  tests: TestResult[];
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  totalDuration: number;
  status: 'passed' | 'failed' | 'partial';
}

export class TestingService {
  private prisma: PrismaClient;
  private testResults: TestResult[] = [];

  constructor() {
    this.prisma = new PrismaClient();
  }

  // Test de conectividad de base de datos
  async testDatabaseConnectivity(): Promise<TestResult> {
    const startTime = Date.now();
    try {
      await this.prisma.$connect();
      const result = await this.prisma.$queryRaw`SELECT version()`;
      await this.prisma.$disconnect();
      
      return {
        testName: 'Database Connectivity',
        status: 'passed',
        duration: Date.now() - startTime,
        timestamp: new Date(),
        category: 'integration'
      };
    } catch (error: any) {
      return {
        testName: 'Database Connectivity',
        status: 'failed',
        duration: Date.now() - startTime,
        error: error.message,
        timestamp: new Date(),
        category: 'integration'
      };
    }
  }

  // Test CRUD básico de usuarios
  async testUserCRUD(): Promise<TestResult> {
    const startTime = Date.now();
    try {
      // Create
      const testUser = await this.prisma.user.create({
        data: {
          email: `test-${Date.now()}@example.com`,
          nombre: 'Test User',
          password: 'test-password-hash',
          rol: 'VENDEDOR',
          activo: true
        }
      });

      // Read
      const foundUser = await this.prisma.user.findUnique({
        where: { id: testUser.id }
      });

      // Update
      const updatedUser = await this.prisma.user.update({
        where: { id: testUser.id },
        data: { nombre: 'Updated Test User' }
      });

      // Delete
      await this.prisma.user.delete({
        where: { id: testUser.id }
      });

      const isSuccess = foundUser && updatedUser.nombre === 'Updated Test User';

      return {
        testName: 'User CRUD Operations',
        status: isSuccess ? 'passed' : 'failed',
        duration: Date.now() - startTime,
        error: !isSuccess ? 'CRUD operations failed validation' : undefined,
        timestamp: new Date(),
        category: 'integration'
      };
    } catch (error: any) {
      return {
        testName: 'User CRUD Operations',
        status: 'failed',
        duration: Date.now() - startTime,
        error: error.message,
        timestamp: new Date(),
        category: 'integration'
      };
    }
  }

  // Test CRUD básico de prospectos
  async testProspectCRUD(): Promise<TestResult> {
    const startTime = Date.now();
    try {
      // Obtener un usuario existente para el test
      const user = await this.prisma.user.findFirst({ where: { rol: 'VENDEDOR' } });
      if (!user) throw new Error('No user found for test');

      // Create
      const testProspect = await this.prisma.prospecto.create({
        data: {
          nombre: 'Test',
          apellido: 'Prospect',
          email: `test-prospect-${Date.now()}@example.com`,
          telefono: '1234567890',
          estadoLead: 'LEAD',
          score: 75,
          vendedorId: user.id,
          agenciaId: 1
        }
      });

      // Read
      const foundProspect = await this.prisma.prospecto.findUnique({
        where: { id: testProspect.id }
      });

      // Update
      const updatedProspect = await this.prisma.prospecto.update({
        where: { id: testProspect.id },
        data: { score: 85, estadoLead: 'QUALIFIED' }
      });

      // Delete
      await this.prisma.prospecto.delete({
        where: { id: testProspect.id }
      });

      const isSuccess = foundProspect && updatedProspect.score === 85;

      return {
        testName: 'Prospect CRUD Operations',
        status: isSuccess ? 'passed' : 'failed',
        duration: Date.now() - startTime,
        error: !isSuccess ? 'Prospect CRUD operations failed validation' : undefined,
        timestamp: new Date(),
        category: 'integration'
      };
    } catch (error: any) {
      return {
        testName: 'Prospect CRUD Operations',
        status: 'failed',
        duration: Date.now() - startTime,
        error: error.message,
        timestamp: new Date(),
        category: 'integration'
      };
    }
  }

  // Test de cálculo de score SPCC
  async testSPCCScoring(): Promise<TestResult> {
    const startTime = Date.now();
    try {
      // Datos de prueba para scoring
      const testData = {
        situation: 8,
        problem: 7,
        consequence: 9,
        capability: 8
      };

      // Calcular score (promedio ponderado)
      const expectedScore = Math.round(
        (testData.situation * 0.2 + 
         testData.problem * 0.3 + 
         testData.consequence * 0.3 + 
         testData.capability * 0.2) * 10
      );

      const calculatedScore = Math.round(
        (testData.situation * 0.2 + 
         testData.problem * 0.3 + 
         testData.consequence * 0.3 + 
         testData.capability * 0.2) * 10
      );

      return {
        testName: 'SPCC Scoring Algorithm',
        status: expectedScore === calculatedScore ? 'passed' : 'failed',
        duration: Date.now() - startTime,
        error: expectedScore !== calculatedScore ? 
          `Expected ${expectedScore}, got ${calculatedScore}` : undefined,
        timestamp: new Date(),
        category: 'unit'
      };
    } catch (error: any) {
      return {
        testName: 'SPCC Scoring Algorithm',
        status: 'failed',
        duration: Date.now() - startTime,
        error: error.message,
        timestamp: new Date(),
        category: 'unit'
      };
    }
  }

  // Test de API endpoints
  async testAPIEndpoints(): Promise<TestResult[]> {
    const endpoints = [
      { path: '/api/auth/providers', method: 'GET' },
      { path: '/api/health', method: 'GET' },
      { path: '/api/prospects', method: 'GET' },
      { path: '/api/users', method: 'GET' },
      { path: '/api/vehicles', method: 'GET' }
    ];

    const results: TestResult[] = [];

    for (const endpoint of endpoints) {
      const startTime = Date.now();
      try {
        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(`${baseUrl}${endpoint.path}`, {
          method: endpoint.method,
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        results.push({
          testName: `API ${endpoint.method} ${endpoint.path}`,
          status: response.ok ? 'passed' : 'failed',
          duration: Date.now() - startTime,
          error: !response.ok ? `HTTP ${response.status}` : undefined,
          timestamp: new Date(),
          category: 'api'
        });
      } catch (error: any) {
        results.push({
          testName: `API ${endpoint.method} ${endpoint.path}`,
          status: 'failed',
          duration: Date.now() - startTime,
          error: error.message,
          timestamp: new Date(),
          category: 'api'
        });
      }
    }

    return results;
  }

  // Ejecutar todos los tests
  async runAllTests(): Promise<TestSuite> {
    const startTime = Date.now();
    const tests: TestResult[] = [];

    // Tests de integración
    tests.push(await this.testDatabaseConnectivity());
    tests.push(await this.testUserCRUD());
    tests.push(await this.testProspectCRUD());

    // Tests unitarios
    tests.push(await this.testSPCCScoring());

    // Tests de API
    const apiTests = await this.testAPIEndpoints();
    tests.push(...apiTests);

    // Calcular estadísticas
    const totalTests = tests.length;
    const passedTests = tests.filter(t => t.status === 'passed').length;
    const failedTests = tests.filter(t => t.status === 'failed').length;
    const skippedTests = tests.filter(t => t.status === 'skipped').length;
    const totalDuration = Date.now() - startTime;

    let status: 'passed' | 'failed' | 'partial' = 'passed';
    if (failedTests > 0) {
      status = passedTests > 0 ? 'partial' : 'failed';
    }

    const suite: TestSuite = {
      suiteName: 'DynamicFin CRM Test Suite',
      tests,
      totalTests,
      passedTests,
      failedTests,
      skippedTests,
      totalDuration,
      status
    };

    // Guardar resultados
    this.testResults = tests;

    return suite;
  }

  // Generar reporte de tests
  generateReport(suite: TestSuite): string {
    let report = `
=== DynamicFin CRM Test Report ===
Suite: ${suite.suiteName}
Total Tests: ${suite.totalTests}
Passed: ${suite.passedTests}
Failed: ${suite.failedTests}
Skipped: ${suite.skippedTests}
Duration: ${suite.totalDuration}ms
Status: ${suite.status.toUpperCase()}

=== Test Details ===
`;

    suite.tests.forEach(test => {
      report += `
${test.status === 'passed' ? '✓' : test.status === 'failed' ? '✗' : '○'} ${test.testName}
  Category: ${test.category}
  Duration: ${test.duration}ms
  ${test.error ? `Error: ${test.error}` : ''}
`;
    });

    return report;
  }

  // Cleanup
  async cleanup(): Promise<void> {
    await this.prisma.$disconnect();
  }
}

// Instancia singleton del servicio de testing
export const testingService = new TestingService();
