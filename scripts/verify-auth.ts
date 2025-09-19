import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function verifyAuth() {
  console.log('🔍 Verificando usuarios de autenticación...');

  try {
    // Verificar usuarios demo
    const demoUsers = await prisma.user.findMany({
      where: {
        email: {
          in: ['gerenteaudi@demo.com', 'vendedoraudi@demo.com', 'recepaudi@demo.com']
        }
      },
      select: {
        id: true,
        email: true,
        name: true,
        rol: true,
        activo: true,
        password: true
      }
    });

    console.log(`\n📊 Usuarios encontrados: ${demoUsers.length}/3`);
    
    for (const user of demoUsers) {
      console.log(`\n👤 ${user.email}:`);
      console.log(`   - Nombre: ${user.name}`);
      console.log(`   - Rol: ${user.rol}`);
      console.log(`   - Activo: ${user.activo}`);
      console.log(`   - Password Hash: ${user.password.substring(0, 20)}...`);
      
      // Verificar contraseñas
      const expectedPasswords = {
        'gerenteaudi@demo.com': 'gerente1213',
        'vendedoraudi@demo.com': 'vendedor123',
        'recepaudi@demo.com': 'recep123'
      };
      
      const expectedPassword = expectedPasswords[user.email as keyof typeof expectedPasswords];
      if (expectedPassword) {
        const isValid = await bcrypt.compare(expectedPassword, user.password);
        console.log(`   - Password "${expectedPassword}": ${isValid ? '✅ VÁLIDA' : '❌ INVÁLIDA'}`);
      }
    }

    // Verificar si faltan usuarios
    const missingEmails = ['gerenteaudi@demo.com', 'vendedoraudi@demo.com', 'recepaudi@demo.com']
      .filter(email => !demoUsers.find(user => user.email === email));
    
    if (missingEmails.length > 0) {
      console.log(`\n⚠️  Usuarios faltantes: ${missingEmails.join(', ')}`);
    }

    console.log('\n✅ Verificación completada');
    
  } catch (error) {
    console.error('❌ Error durante la verificación:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyAuth();
