
// Script para ejecutar health checks desde línea de comandos
const { monitoringService } = require('../lib/monitoring');

async function runHealthCheckFromCLI() {
  console.log('🏥 Ejecutando Health Check de DynamicFin CRM...\n');

  try {
    const systemStatus = await monitoringService.getSystemStatus();

    console.log(`=== ESTADO GENERAL: ${systemStatus.overall.toUpperCase()} ===\n`);

    console.log('=== HEALTH CHECKS ===');
    systemStatus.checks.forEach(check => {
      const statusIcon = check.status === 'healthy' ? '✅' : 
                        check.status === 'degraded' ? '⚠️' : '❌';
      
      console.log(`${statusIcon} ${check.service}`);
      console.log(`   Estado: ${check.status.toUpperCase()}`);
      console.log(`   Tiempo: ${check.responseTime}ms`);
      
      if (check.error) {
        console.log(`   Error: ${check.error}`);
      }
      
      if (check.metadata && Object.keys(check.metadata).length > 0) {
        console.log(`   Metadata:`, check.metadata);
      }
      
      console.log('');
    });

    console.log('=== MÉTRICAS ===');
    console.log(`💾 Memoria: ${Math.round(systemStatus.metrics.memory)} MB`);
    console.log(`⚡ CPU: ${Math.round(systemStatus.metrics.cpu)}%`);
    console.log(`🚀 Tiempo respuesta: ${systemStatus.metrics.responseTime}ms`);
    console.log(`📊 Tasa error: ${systemStatus.metrics.errorRate}%`);

    if (systemStatus.alerts && systemStatus.alerts.length > 0) {
      console.log('\n=== ALERTAS ===');
      systemStatus.alerts.forEach(alert => {
        console.log(`⚠️ ${alert}`);
      });
    } else {
      console.log('\n✅ No hay alertas activas');
    }

    // Exit code basado en estado general
    const exitCode = systemStatus.overall === 'unhealthy' ? 1 : 0;
    process.exit(exitCode);

  } catch (error) {
    console.error('❌ Error ejecutando health check:', error.message);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  runHealthCheckFromCLI();
}

module.exports = { runHealthCheckFromCLI };
