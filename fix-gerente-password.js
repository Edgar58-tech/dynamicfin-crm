const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function fixGerentePassword() {
  console.log('🔧 Fixing gerente password...');
  
  try {
    // Delete the existing user
    await prisma.user.delete({
      where: { email: 'gerenteaudi@demo.com' }
    });
    console.log('🗑️ Deleted existing gerente user');
    
    // Create new user with correct password
    const hashedPassword = await bcrypt.hash('gerente123', 12);
    
    await prisma.user.create({
      data: {
        email: 'gerenteaudi@demo.com',
        name: 'Gerente Audi Demo',
        nombre: 'Gerente Audi',
        apellido: 'Demo',
        password: hashedPassword,
        rol: 'GERENTE_VENTAS',
        activo: true,
      },
    });
    
    console.log('✅ Created new gerente user with correct password');
    
    // Test the new password
    const user = await prisma.user.findUnique({
      where: { email: 'gerenteaudi@demo.com' }
    });
    
    const isPasswordValid = await bcrypt.compare('gerente123', user.password);
    console.log(`🔍 Password test result: ${isPasswordValid ? '✅ VALID' : '❌ INVALID'}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
    console.log('🏁 Fix completed!');
  }
}

fixGerentePassword().catch(console.error);
