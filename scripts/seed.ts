
import { PrismaClient, TipoRol } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting MINIMAL database seeding for DEMO...');

  // Hash passwords for demo users
  const hashedPasswordDirectores = await bcrypt.hash('PrivXejc#6', 12);
  const hashedPasswordAdmin = await bcrypt.hash('Rada#94', 12);
  const hashedPasswordDemo = await bcrypt.hash('gerente1213', 12);
  const hashedPasswordVendedor = await bcrypt.hash('vendedor123', 12);
  const hashedPasswordRecep = await bcrypt.hash('recep123', 12);
  const hashedPasswordTest = await bcrypt.hash('johndoe123', 12);

  // ================== CREATE ESSENTIAL DEMO USERS ==================
  console.log('🔑 Creating Super Admin Users...');

  // Super Admin Users
  await prisma.user.upsert({
    where: { email: 'directores@dynamicfin.mx' },
    update: {},
    create: {
      email: 'directores@dynamicfin.mx',
      name: 'Directores DynamicFin',
      nombre: 'Directores',
      apellido: 'DynamicFin',
      password: hashedPasswordDirectores,
      rol: TipoRol.DYNAMICFIN_ADMIN,
      activo: true,
    },
  });

  await prisma.user.upsert({
    where: { email: 'admin@dynamicfin.mx' },
    update: {},
    create: {
      email: 'admin@dynamicfin.mx',
      name: 'Admin DynamicFin',
      nombre: 'Admin',
      apellido: 'DynamicFin',
      password: hashedPasswordAdmin,
      rol: TipoRol.DYNAMICFIN_ADMIN,
      activo: true,
    },
  });

  // Test user (hidden)
  await prisma.user.upsert({
    where: { email: 'john@doe.com' },
    update: {},
    create: {
      email: 'john@doe.com',
      name: 'Juan Doe',
      nombre: 'Juan',
      apellido: 'Doe',
      password: hashedPasswordTest,
      rol: TipoRol.DYNAMICFIN_ADMIN,
      activo: true,
    },
  });

  console.log('👥 Creating Demo Users for Login...');

  // Demo users for quick login (without agency dependencies)
  await prisma.user.upsert({
    where: { email: 'gerenteaudi@demo.com' },
    update: {},
    create: {
      email: 'gerenteaudi@demo.com',
      name: 'Gerente Audi Demo',
      nombre: 'Gerente Audi',
      apellido: 'Demo',
      password: hashedPasswordDemo,
      rol: TipoRol.GERENTE_VENTAS,
      activo: true,
    },
  });

  await prisma.user.upsert({
    where: { email: 'vendedoraudi@demo.com' },
    update: {},
    create: {
      email: 'vendedoraudi@demo.com',
      name: 'Vendedor Audi Demo',
      nombre: 'Vendedor Audi',
      apellido: 'Demo',
      password: hashedPasswordVendedor,
      rol: TipoRol.VENDEDOR,
      activo: true,
    },
  });

  await prisma.user.upsert({
    where: { email: 'recepaudi@demo.com' },
    update: {},
    create: {
      email: 'recepaudi@demo.com',
      name: 'Recepción Audi Demo',
      nombre: 'Recepción Audi',
      apellido: 'Demo',
      password: hashedPasswordRecep,
      rol: TipoRol.CENTRO_LEADS,
      activo: true,
    },
  });

  console.log('✅ MINIMAL DEMO database seeding completed!');
  console.log(`
🎯 DEMO USERS CREATED:
   - 2 Super Administrators (directores@dynamicfin.mx, admin@dynamicfin.mx)
   - 1 Test User (hidden)
   - 3 Demo Users for Quick Login:
     * gerenteaudi@demo.com / gerente1213
     * vendedoraudi@demo.com / vendedor123  
     * recepaudi@demo.com / recep123

🚀 System ready for demo with 3 quick login buttons!
`);

}

main()
  .catch((e) => {
    console.error('❌ Error during database seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('🔌 Database connection closed.');
  });
