
// Script rápido para verificar el estado del sistema
const { PrismaClient } = require('@prisma/client');

async function checkSystemStatus() {
  console.log('🔍 === VERIFICACIÓN RÁPIDA DEL SISTEMA ===\n');
  
  const prisma = new PrismaClient();
  
  try {
    // Verificar conexión a la base de datos
    const startTime = Date.now();
    await prisma.$connect();
    const dbTime = Date.now() - startTime;
    
    console.log(`✅ Base de datos: Conectada (${dbTime}ms)`);
    
    // Contar registros principales
    const counts = await Promise.all([
      prisma.user.count(),
      prisma.prospecto.count(),
      prisma.vehiculoCatalogo.count(),
      prisma.agencia.count()
    ]);
    
    console.log('\n📊 Datos en el sistema:');
    console.log(`   👥 Usuarios: ${counts[0]}`);
    console.log(`   🎯 Prospectos: ${counts[1]}`);
    console.log(`   🚗 Vehículos: ${counts[2]}`);
    console.log(`   🏢 Agencias: ${counts[3]}`);
    
    // Verificar variables de entorno críticas
    const requiredEnvs = [
      'DATABASE_URL',
      'NEXTAUTH_SECRET',
      'NEXTAUTH_URL'
    ];
    
    console.log('\n🔐 Variables de entorno:');
    requiredEnvs.forEach(env => {
      const exists = !!process.env[env];
      console.log(`   ${exists ? '✅' : '❌'} ${env}: ${exists ? 'Configurada' : 'Faltante'}`);
    });
    
    console.log('\n✅ Sistema operacional\n');
    
  } catch (error) {
    console.error(`❌ Error del sistema: ${error.message}\n`);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  checkSystemStatus();
}

module.exports = { checkSystemStatus };
