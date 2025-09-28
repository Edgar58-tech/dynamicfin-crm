
const { PrismaClient } = require('@prisma/client');

// Use the correct DATABASE_URL that works
process.env.DATABASE_URL = 'postgresql://postgres.owpjsywhzetkcwlvgmtu:qdYmxCFzpEoWJ2zw@aws-1-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true';

const prisma = new PrismaClient();

async function checkDatabaseStatus() {
  console.log('🔍 VERIFICANDO ESTADO DE LA BASE DE DATOS...\n');

  try {
    // Verificar usuarios
    const usersCount = await prisma.user.count();
    console.log(`👥 Usuarios totales: ${usersCount}`);
    
    if (usersCount > 0) {
      const usersByRole = await prisma.user.groupBy({
        by: ['rol'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } }
      });
      console.log('📊 Distribución por rol:');
      usersByRole.forEach(role => {
        console.log(`   - ${role.rol}: ${role._count.id}`);
      });
    }

    // Verificar agencias
    const agenciasCount = await prisma.agencia.count();
    console.log(`\n🏢 Agencias totales: ${agenciasCount}`);

    // Verificar prospectos
    const prospectosCount = await prisma.prospecto.count();
    console.log(`\n👤 Prospectos totales: ${prospectosCount}`);

    // Verificar Role Play scenarios
    const roleplaysCount = await prisma.rolePlayScenario.count();
    console.log(`\n🎭 Escenarios Role Play: ${roleplaysCount}`);
    
    if (roleplaysCount > 0) {
      const roleplaysByCategory = await prisma.rolePlayScenario.groupBy({
        by: ['categoria'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } }
      });
      console.log('📋 Role Play por categoría:');
      roleplaysByCategory.forEach(cat => {
        console.log(`   - ${cat.categoria}: ${cat._count.id}`);
      });
    }

    // Verificar zonas de proximidad
    const zonasCount = await prisma.zonaProximidad.count();
    console.log(`\n📍 Zonas de proximidad: ${zonasCount}`);
    
    if (zonasCount > 0) {
      const zonasByAgency = await prisma.zonaProximidad.groupBy({
        by: ['agenciaId'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } }
      });
      console.log('🏢 Zonas por agencia:');
      for (const zona of zonasByAgency) {
        const agencia = await prisma.agencia.findUnique({
          where: { id: zona.agenciaId },
          select: { nombreAgencia: true }
        });
        console.log(`   - ${agencia?.nombreAgencia || 'Agencia desconocida'}: ${zona._count.id} zonas`);
      }
    }

    // Verificar grabaciones de proximidad
    const grabacionesProximidadCount = await prisma.grabacionProximidad.count();
    console.log(`\n🎙️ Grabaciones de proximidad: ${grabacionesProximidadCount}`);

    // Verificar configuraciones de proximidad
    const configProximidadCount = await prisma.configuracionProximidad.count();
    console.log(`\n⚙️ Configuraciones de proximidad: ${configProximidadCount}`);

    // Verificar vehiculos
    const vehiculosCount = await prisma.vehiculo.count();
    console.log(`\n🚗 Vehículos: ${vehiculosCount}`);

    console.log('\n✅ Verificación completada!');

  } catch (error) {
    console.error('❌ Error verificando base de datos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabaseStatus();
