const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function testAuth() {
  console.log('🔍 Testing authentication for demo users...');
  
  const testCredentials = [
    { email: 'gerenteaudi@demo.com', password: 'gerente123' },
    { email: 'vendedoraudi@demo.com', password: 'vendedor123' },
    { email: 'recepaud@demo.com', password: 'recep123' }
  ];

  for (const cred of testCredentials) {
    try {
      console.log(`\n📧 Testing: ${cred.email}`);
      
      const user = await prisma.user.findUnique({
        where: { 
          email: cred.email,
          activo: true,
        },
      });

      if (!user) {
        console.log(`❌ User not found: ${cred.email}`);
        continue;
      }

      console.log(`✅ User found: ${user.nombre} ${user.apellido} (${user.rol})`);
      
      const isPasswordValid = await bcrypt.compare(cred.password, user.password);
      
      if (isPasswordValid) {
        console.log(`✅ Password is valid for ${cred.email}`);
      } else {
        console.log(`❌ Password is invalid for ${cred.email}`);
      }
      
    } catch (error) {
      console.error(`❌ Error testing ${cred.email}:`, error.message);
    }
  }
  
  await prisma.$disconnect();
  console.log('\n🏁 Authentication test completed!');
}

testAuth().catch(console.error);
