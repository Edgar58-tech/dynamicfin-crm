import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function testLogin() {
  console.log('🧪 Probando autenticación de usuarios demo...');

  const testCredentials = [
    { email: 'gerenteaudi@demo.com', password: 'gerente1213', role: 'Gerente' },
    { email: 'vendedoraudi@demo.com', password: 'vendedor123', role: 'Vendedor' },
    { email: 'recepaudi@demo.com', password: 'recep123', role: 'Centro de Leads' }
  ];

  for (const cred of testCredentials) {
    console.log(`\n🔐 Probando login: ${cred.role}`);
    console.log(`   Email: ${cred.email}`);
    console.log(`   Password: ${cred.password}`);

    try {
      // Buscar usuario
      const user = await prisma.user.findUnique({
        where: { email: cred.email },
        select: {
          id: true,
          email: true,
          name: true,
          rol: true,
          activo: true,
          password: true
        }
      });

      if (!user) {
        console.log('   ❌ Usuario no encontrado');
        continue;
      }

      if (!user.activo) {
        console.log('   ❌ Usuario inactivo');
        continue;
      }

      // Verificar contraseña
      const isPasswordValid = await bcrypt.compare(cred.password, user.password);
      
      if (isPasswordValid) {
        console.log('   ✅ LOGIN EXITOSO');
        console.log(`   👤 Usuario: ${user.name}`);
        console.log(`   🎭 Rol: ${user.rol}`);
      } else {
        console.log('   ❌ Contraseña incorrecta');
      }

    } catch (error) {
      console.log(`   ❌ Error: ${error}`);
    }
  }

  console.log('\n🎯 Resumen de credenciales para la interfaz:');
  console.log('┌─────────────────────────────────────────────────────────┐');
  console.log('│                 CREDENCIALES DEMO                       │');
  console.log('├─────────────────────────────────────────────────────────┤');
  console.log('│ 👔 Gerente: gerenteaudi@demo.com / gerente1213         │');
  console.log('│ 👤 Vendedor: vendedoraudi@demo.com / vendedor123       │');
  console.log('│ 🎧 Centro Leads: recepaudi@demo.com / recep123         │');
  console.log('└─────────────────────────────────────────────────────────┘');

  await prisma.$disconnect();
}

testLogin();
