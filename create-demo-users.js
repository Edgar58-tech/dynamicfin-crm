
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const prisma = new PrismaClient();

async function createDemoUsers() {
  console.log('🌱 Creating DEMO users...');

  try {
    // Hash passwords for demo users
    const hashedPasswordDirectores = await bcrypt.hash('PrivXejc#6', 12);
    const hashedPasswordDemo = await bcrypt.hash('gerente1213', 12);
    const hashedPasswordVendedor = await bcrypt.hash('vendedor123', 12);
    const hashedPasswordRecep = await bcrypt.hash('recep123', 12);

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
        rol: 'DYNAMICFIN_ADMIN',
        activo: true,
      },
    });

    console.log('👥 Creating Demo Users for Login...');

    // Demo users for quick login
    await prisma.user.upsert({
      where: { email: 'gerenteaudi@demo.com' },
      update: {},
      create: {
        email: 'gerenteaudi@demo.com',
        name: 'Gerente Audi Demo',
        nombre: 'Gerente Audi',
        apellido: 'Demo',
        password: hashedPasswordDemo,
        rol: 'GERENTE_VENTAS',
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
        rol: 'VENDEDOR',
        activo: true,
      },
    });

    await prisma.user.upsert({
      where: { email: 'recepaudi@demo.com' },
      update: {},
      create: {
        email: 'recepaudi@demo.com',
        name: 'Recepcionista Audi Demo',
        nombre: 'Recepcionista Audi',
        apellido: 'Demo',
        password: hashedPasswordRecep,
        rol: 'CENTRO_LEADS',
        activo: true,
      },
    });

    console.log('✅ Demo users created successfully!');

    // Verify users exist
    const users = await prisma.user.findMany({
      select: {
        email: true,
        nombre: true,
        rol: true,
        activo: true
      }
    });

    console.log('📋 Current users in database:');
    users.forEach(user => {
      console.log(`  - ${user.email} (${user.rol}) - Active: ${user.activo}`);
    });

  } catch (error) {
    console.error('❌ Error creating demo users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createDemoUsers();
