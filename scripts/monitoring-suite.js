
// Script integrado de monitoreo y testing para DynamicFin CRM
const { monitoringService } = require('../lib/monitoring');
const { testingService } = require('../lib/testing');

class MonitoringSuite {
  constructor() {
    this.startTime = Date.now();
  }

  async runHealthCheck() {
    console.log('🏥 === HEALTH CHECK REPORT ===\n');
    
    try {
      const systemStatus = await monitoringService.getSystemStatus();
      
      const statusIcon = systemStatus.overall === 'healthy' ? '✅' : 
                        systemStatus.overall === 'degraded' ? '⚠️' : '❌';
      
      console.log(`${statusIcon} ESTADO GENERAL: ${systemStatus.overall.toUpperCase()}\n`);
      
      console.log('📊 CHECKS INDIVIDUALES:');
      systemStatus.checks.forEach(check => {
        const icon = check.status === 'healthy' ? '✅' : 
                    check.status === 'degraded' ? '⚠️' : '❌';
        
        console.log(`  ${icon} ${check.service.padEnd(20)} | ${check.status.toUpperCase().padEnd(10)} | ${check.responseTime}ms`);
        
        if (check.error) {
          console.log(`     ❗ Error: ${check.error}`);
        }
      });
      
      console.log('\n📈 MÉTRICAS DEL SISTEMA:');
      console.log(`  💾 Memoria: ${Math.round(systemStatus.metrics.memory)} MB`);
      console.log(`  ⚡ CPU: ${Math.round(systemStatus.metrics.cpu)}%`);
      console.log(`  🚀 Tiempo respuesta: ${systemStatus.metrics.responseTime}ms`);
      console.log(`  📊 Tasa error: ${systemStatus.metrics.errorRate}%\n`);
      
      if (systemStatus.alerts && systemStatus.alerts.length > 0) {
        console.log('🚨 ALERTAS ACTIVAS:');
        systemStatus.alerts.forEach(alert => {
          console.log(`  ⚠️ ${alert}`);
        });
        console.log();
      }
      
      return systemStatus;
    } catch (error) {
      console.error('❌ Error en health check:', error.message);
      return null;
    }
  }

  async runTests() {
    console.log('🧪 === TEST SUITE REPORT ===\n');
    
    try {
      const testSuite = await testingService.runAllTests();
      
      const statusIcon = testSuite.status === 'passed' ? '✅' : 
                        testSuite.status === 'partial' ? '⚠️' : '❌';
      
      console.log(`${statusIcon} RESULTADO GENERAL: ${testSuite.status.toUpperCase()}\n`);
      
      console.log('📊 RESUMEN:');
      console.log(`  Total: ${testSuite.totalTests}`);
      console.log(`  ✅ Exitosos: ${testSuite.passedTests}`);
      console.log(`  ❌ Fallidos: ${testSuite.failedTests}`);
      console.log(`  ⏭️ Omitidos: ${testSuite.skippedTests}`);
      console.log(`  ⏱️ Duración: ${testSuite.totalDuration}ms\n`);
      
      console.log('🔍 TESTS INDIVIDUALES:');
      testSuite.tests.forEach(test => {
        const icon = test.status === 'passed' ? '✅' : 
                    test.status === 'failed' ? '❌' : '⏭️';
        
        console.log(`  ${icon} ${test.testName.padEnd(30)} | ${test.category.padEnd(12)} | ${test.duration}ms`);
        
        if (test.error) {
          console.log(`     ❗ Error: ${test.error}`);
        }
      });
      console.log();
      
      return testSuite;
    } catch (error) {
      console.error('❌ Error en test suite:', error.message);
      return null;
    }
  }

  async runFullSuite() {
    console.log('🚀 === DYNAMICFIN CRM - SISTEMA INTEGRAL DE MONITOREO ===\n');
    console.log(`Iniciado: ${new Date().toLocaleString()}\n`);
    
    const healthStatus = await this.runHealthCheck();
    const testResults = await this.runFullSuite();
    
    console.log('📋 === RESUMEN EJECUTIVO ===\n');
    
    if (healthStatus) {
      console.log(`🏥 Health Status: ${healthStatus.overall.toUpperCase()}`);
      console.log(`   - Services: ${healthStatus.checks.length} verificados`);
      console.log(`   - Alerts: ${healthStatus.alerts?.length || 0} activas`);
    }
    
    if (testResults) {
      console.log(`🧪 Test Suite: ${testResults.status.toUpperCase()}`);
      console.log(`   - Success Rate: ${Math.round((testResults.passedTests / testResults.totalTests) * 100)}%`);
      console.log(`   - Total Duration: ${testResults.totalDuration}ms`);
    }
    
    const totalDuration = Date.now() - this.startTime;
    console.log(`\n⏱️ Duración total del monitoreo: ${totalDuration}ms`);
    console.log(`✅ Monitoreo completado: ${new Date().toLocaleString()}\n`);
    
    // Determinar exit code
    const healthFailed = healthStatus?.overall === 'unhealthy';
    const testsFailed = testResults?.status === 'failed';
    const exitCode = (healthFailed || testsFailed) ? 1 : 0;
    
    return exitCode;
  }
}

// Función para ejecutar desde línea de comandos
async function main() {
  const suite = new MonitoringSuite();
  
  const args = process.argv.slice(2);
  const command = args[0] || 'full';
  
  let exitCode = 0;
  
  try {
    switch (command) {
      case 'health':
        const healthStatus = await suite.runHealthCheck();
        exitCode = healthStatus?.overall === 'unhealthy' ? 1 : 0;
        break;
      
      case 'test':
        const testResults = await suite.runTests();
        exitCode = testResults?.status === 'failed' ? 1 : 0;
        break;
      
      case 'full':
      default:
        exitCode = await suite.runFullSuite();
        break;
    }
  } catch (error) {
    console.error('❌ Error ejecutando monitoreo:', error.message);
    exitCode = 1;
  }
  
  process.exit(exitCode);
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main();
}

module.exports = { MonitoringSuite };
