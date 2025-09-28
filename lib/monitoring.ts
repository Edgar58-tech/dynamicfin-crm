
// Sistema integral de monitoreo para DynamicFin CRM
import { PrismaClient } from '@prisma/client';

export interface HealthCheck {
  service: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: Date;
  responseTime: number;
  error?: string;
  metadata?: Record<string, any>;
}

export interface SystemMetrics {
  timestamp: Date;
  cpu: number;
  memory: number;
  diskUsage: number;
  activeConnections: number;
  responseTime: number;
  errorRate: number;
  throughput: number;
}

export class MonitoringService {
  private prisma: PrismaClient;
  private metrics: SystemMetrics[] = [];
  private alerts: string[] = [];

  constructor() {
    this.prisma = new PrismaClient();
  }

  // Health Check para base de datos
  async checkDatabaseHealth(): Promise<HealthCheck> {
    const startTime = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      const responseTime = Date.now() - startTime;
      
      return {
        service: 'database',
        status: responseTime < 1000 ? 'healthy' : 'degraded',
        timestamp: new Date(),
        responseTime,
        metadata: {
          connectionPool: 'active',
          queryTime: responseTime
        }
      };
    } catch (error: any) {
      return {
        service: 'database',
        status: 'unhealthy',
        timestamp: new Date(),
        responseTime: Date.now() - startTime,
        error: error.message
      };
    }
  }

  // Health Check para APIs externas
  async checkExternalAPIHealth(apiName: string, url: string): Promise<HealthCheck> {
    const startTime = Date.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      const responseTime = Date.now() - startTime;
      const isHealthy = response.ok && responseTime < 5000;
      
      return {
        service: apiName,
        status: isHealthy ? 'healthy' : 'degraded',
        timestamp: new Date(),
        responseTime,
        metadata: {
          statusCode: response.status,
          contentType: response.headers.get('content-type')
        }
      };
    } catch (error: any) {
      return {
        service: apiName,
        status: 'unhealthy',
        timestamp: new Date(),
        responseTime: Date.now() - startTime,
        error: error.message
      };
    }
  }

  // Verificar salud del sistema de autenticación
  async checkAuthHealth(): Promise<HealthCheck> {
    const startTime = Date.now();
    try {
      // Verificar que NextAuth esté funcionando
      const authUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
      const response = await fetch(`${authUrl}/api/auth/providers`);
      
      const responseTime = Date.now() - startTime;
      
      return {
        service: 'authentication',
        status: response.ok ? 'healthy' : 'degraded',
        timestamp: new Date(),
        responseTime,
        metadata: {
          providersAvailable: response.ok,
          authUrl
        }
      };
    } catch (error: any) {
      return {
        service: 'authentication',
        status: 'unhealthy',
        timestamp: new Date(),
        responseTime: Date.now() - startTime,
        error: error.message
      };
    }
  }

  // Verificar funcionalidades críticas del CRM
  async checkCRMFunctionality(): Promise<HealthCheck> {
    const startTime = Date.now();
    try {
      // Verificar que las tablas principales existan y tengan datos
      const usersCount = await this.prisma.user.count();
      const prospectsCount = await this.prisma.prospecto.count();
      const vehiclesCount = await this.prisma.vehiculoCatalogo.count();
      
      const responseTime = Date.now() - startTime;
      const isHealthy = usersCount > 0 && vehiclesCount > 0;
      
      return {
        service: 'crm-functionality',
        status: isHealthy ? 'healthy' : 'degraded',
        timestamp: new Date(),
        responseTime,
        metadata: {
          usersCount,
          prospectsCount,
          vehiclesCount,
          hasData: isHealthy
        }
      };
    } catch (error: any) {
      return {
        service: 'crm-functionality',
        status: 'unhealthy',
        timestamp: new Date(),
        responseTime: Date.now() - startTime,
        error: error.message
      };
    }
  }

  // Ejecutar todos los health checks
  async runAllHealthChecks(): Promise<HealthCheck[]> {
    const checks: HealthCheck[] = [];
    
    // Health checks básicos
    checks.push(await this.checkDatabaseHealth());
    checks.push(await this.checkAuthHealth());
    checks.push(await this.checkCRMFunctionality());
    
    // Health checks de APIs externas (si están configuradas)
    if (process.env.ABACUSAI_API_KEY) {
      checks.push(await this.checkExternalAPIHealth('abacus-ai', 'https://api.abacus.ai/health'));
    }
    
    return checks;
  }

  // Recopilar métricas del sistema
  async collectSystemMetrics(): Promise<SystemMetrics> {
    const timestamp = new Date();
    
    // Métricas básicas (en un entorno real, usarías librerías como node-os-utils)
    const metrics: SystemMetrics = {
      timestamp,
      cpu: Math.random() * 100, // Placeholder - en producción usar os.cpus()
      memory: process.memoryUsage().heapUsed / 1024 / 1024, // MB
      diskUsage: 0, // Placeholder
      activeConnections: 0, // Placeholder
      responseTime: 0,
      errorRate: 0,
      throughput: 0
    };
    
    // Agregar a histórico
    this.metrics.push(metrics);
    
    // Mantener solo las últimas 1000 métricas
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
    
    return metrics;
  }

  // Generar alerta si hay problemas
  generateAlert(check: HealthCheck): void {
    if (check.status === 'unhealthy') {
      const alert = `CRITICAL: ${check.service} is unhealthy - ${check.error || 'Unknown error'}`;
      this.alerts.push(alert);
      console.error(alert);
    } else if (check.status === 'degraded') {
      const alert = `WARNING: ${check.service} is degraded - Response time: ${check.responseTime}ms`;
      this.alerts.push(alert);
      console.warn(alert);
    }
  }

  // Obtener resumen del estado del sistema
  async getSystemStatus(): Promise<{
    overall: 'healthy' | 'degraded' | 'unhealthy';
    checks: HealthCheck[];
    metrics: SystemMetrics;
    alerts: string[];
  }> {
    const checks = await this.runAllHealthChecks();
    const metrics = await this.collectSystemMetrics();
    
    // Generar alertas
    checks.forEach(check => this.generateAlert(check));
    
    // Determinar estado general
    const hasUnhealthy = checks.some(c => c.status === 'unhealthy');
    const hasDegraded = checks.some(c => c.status === 'degraded');
    
    let overall: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (hasUnhealthy) {
      overall = 'unhealthy';
    } else if (hasDegraded) {
      overall = 'degraded';
    }
    
    return {
      overall,
      checks,
      metrics,
      alerts: this.alerts.slice(-10) // Últimas 10 alertas
    };
  }

  // Cleanup
  async cleanup(): Promise<void> {
    await this.prisma.$disconnect();
  }
}

// Instancia singleton del servicio de monitoreo
export const monitoringService = new MonitoringService();
