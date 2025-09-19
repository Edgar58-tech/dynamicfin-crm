import { PrismaClient, TipoRol } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function fixGerentePassword() {
  console.log('🔧 Corrigiendo contraseña del gerente...');

  try {
    // Generar nuevo hash para la contraseña correcta
    const correctPassword = 'gerente1213';
    const newHashedPassword = await bcrypt.hash(correctPassword, 12);
    
    console.log(`🔑 Generando nuevo hash para: ${correctPassword}`);
    console.log(`🔐 Nuevo hash: ${newHashedPassword.substring(0, 20)}...`);

    // Actualizar el usuario gerente
    const updatedUser = await prisma.user.update({
      where: { email: 'gerenteaudi@demo.com' },
      data: { 
        password: newHashedPassword,
        // Asegurar que otros campos estén correctos
        name: 'Gerente Audi Demo',
        nombre: 'Gerente Audi',
        apellido: 'Demo',
        rol: TipoRol.GERENTE_VENTAS,
        activo: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        rol: true,
        activo: true
      }
    });

    console.log('✅ Usuario actualizado:', updatedUser);

    // Verificar que la contraseña funciona
    const user = await prisma.user.findUnique({
      where: { email: 'gerenteaudi@demo.com' },
      select: { password: true }
    });

    if (user) {
      const isValid = await bcrypt.compare(correctPassword, user.password);
      console.log(`🔍 Verificación de contraseña "${correctPassword}": ${isValid ? '✅ VÁLIDA' : '❌ INVÁLIDA'}`);
    }

    console.log('\n🎯 Corrección completada. Credenciales actualizadas:');
    console.log('   - Email: gerenteaudi@demo.com');
    console.log('   - Password: gerente1213');
    
  } catch (error) {
    console.error('❌ Error durante la corrección:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixGerentePassword();
