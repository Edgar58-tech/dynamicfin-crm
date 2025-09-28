
// Script para ejecutar tests desde línea de comandos
const { testingService } = require('../lib/testing');

async function runTestsFromCLI() {
  console.log('🚀 Iniciando ejecución de tests de DynamicFin CRM...\n');

  try {
    const testSuite = await testingService.runAllTests();
    const report = testingService.generateReport(testSuite);

    console.log(report);

    // Mostrar resumen colorizado
    console.log('\n=== RESUMEN ===');
    console.log(`Total: ${testSuite.totalTests}`);
    console.log(`✅ Exitosos: ${testSuite.passedTests}`);
    console.log(`❌ Fallidos: ${testSuite.failedTests}`);
    console.log(`⏭️ Omitidos: ${testSuite.skippedTests}`);
    console.log(`⏱️ Duración: ${testSuite.totalDuration}ms`);
    console.log(`📊 Estado: ${testSuite.status.toUpperCase()}`);

    // Exit code basado en resultado
    const exitCode = testSuite.status === 'failed' ? 1 : 0;
    process.exit(exitCode);

  } catch (error) {
    console.error('❌ Error ejecutando tests:', error.message);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  runTestsFromCLI();
}

module.exports = { runTestsFromCLI };
