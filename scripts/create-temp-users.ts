
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createTempUsers() {
  try {
    // Primero crear grupo y marca para los usuarios
    console.log('🏢 Creando estructura organizacional...');
    
    const grupo = await prisma.grupoAutomotriz.upsert({
      where: { id: 1 },
      update: {},
      create: {
        nombreGrupo: 'Grupo Automotriz Demo',
        logo: '/images/grupo-logo.png',
        direccion: 'Av. Demo 123, Ciudad Demo',
        email: 'demo@grupoautomotriz.com',
        paginaWeb: 'https://grupoautomotriz.com',
        activo: true
      }
    });

    const marca = await prisma.marca.upsert({
      where: { id: 1 },
      update: {},
      create: {
        nombreMarca: 'BMW Demo',
        logo: '/images/bmw-logo.png',
        grupoId: grupo.id,
        activo: true
      }
    });

    const agencia = await prisma.agencia.upsert({
      where: { id: 1 },
      update: {},
      create: {
        nombreAgencia: 'BMW Centro Demo',
        marcaId: marca.id,
        direccion: 'Av. Principal 456, Centro',
        telefono: '55-1234-5678',
        email: 'ventas@bmwcentro.com',
        gerente: 'Carlos Manager',
        logo: '/images/agencia-logo.png',
        activo: true
      }
    });

    console.log('👤 Creando usuarios temporales...');

    // Usuario 1: Gerente
    const gerente = await prisma.user.upsert({
      where: { email: 'gerente@demo.com' },
      update: {
        nombre: 'Carlos',
        apellido: 'Manager',
        password: await bcrypt.hash('demo123', 10),
        rol: 'GERENTE_VENTAS',
        agenciaId: agencia.id,
        marcaId: marca.id,
        grupoId: grupo.id,
        activo: true
      },
      create: {
        email: 'gerente@demo.com',
        nombre: 'Carlos',
        apellido: 'Manager',
        password: await bcrypt.hash('demo123', 10),
        rol: 'GERENTE_VENTAS',
        agenciaId: agencia.id,
        marcaId: marca.id,
        grupoId: grupo.id,
        activo: true
      }
    });

    // Usuario 2: Vendedor
    const vendedor = await prisma.user.upsert({
      where: { email: 'vendedor@demo.com' },
      update: {
        nombre: 'Ana',
        apellido: 'Sales',
        password: await bcrypt.hash('demo123', 10),
        rol: 'VENDEDOR',
        agenciaId: agencia.id,
        marcaId: marca.id,
        grupoId: grupo.id,
        activo: true
      },
      create: {
        email: 'vendedor@demo.com',
        nombre: 'Ana',
        apellido: 'Sales',
        password: await bcrypt.hash('demo123', 10),
        rol: 'VENDEDOR',
        agenciaId: agencia.id,
        marcaId: marca.id,
        grupoId: grupo.id,
        activo: true
      }
    });

    console.log('📊 Creando pilares SPPC...');
    
    // Crear los 15 pilares del sistema SPPC
    const pilares = [
      { nombre: 'Necesidad Real', peso: 0.1000, fase: 1 },
      { nombre: 'Urgencia de Compra', peso: 0.0800, fase: 1 },
      { nombre: 'Presupuesto Definido', peso: 0.1200, fase: 1 },
      { nombre: 'Autoridad Decisión', peso: 0.1000, fase: 1 },
      { nombre: 'Timeline Compra', peso: 0.0600, fase: 1 },
      { nombre: 'Información Previa', peso: 0.0500, fase: 2 },
      { nombre: 'Experiencia Marca', peso: 0.0700, fase: 2 },
      { nombre: 'Comparación Activa', peso: 0.0600, fase: 2 },
      { nombre: 'Flexibilidad Opciones', peso: 0.0500, fase: 2 },
      { nombre: 'Confianza Vendedor', peso: 0.0800, fase: 2 },
      { nombre: 'Satisfacción Proceso', peso: 0.0700, fase: 3 },
      { nombre: 'Claridad Beneficios', peso: 0.0600, fase: 3 },
      { nombre: 'Manejo Objeciones', peso: 0.0500, fase: 3 },
      { nombre: 'Compromiso Verbal', peso: 0.0900, fase: 3 },
      { nombre: 'Señales de Cierre', peso: 0.1100, fase: 3 }
    ];

    for (let i = 0; i < pilares.length; i++) {
      await prisma.pilar.upsert({
        where: { id: i + 1 },
        update: {},
        create: {
          nombrePilar: pilares[i].nombre,
          descripcion: `Pilar ${i + 1}: ${pilares[i].nombre}`,
          pesoEstrategico: pilares[i].peso,
          faseEvaluacion: pilares[i].fase,
          activo: true
        }
      });
    }

    console.log('🎯 Creando prospectos demo...');
    
    // Crear algunos prospectos de ejemplo
    const prospectos = [
      {
        nombre: 'María',
        apellido: 'González',
        email: 'maria.gonzalez@email.com',
        telefono: '55-9876-5432',
        vendedorId: vendedor.id,
        agenciaId: agencia.id,
        calificacionTotal: 94.5,
        clasificacion: 'Elite',
        vehiculoInteres: 'BMW X3',
        presupuesto: 850000
      },
      {
        nombre: 'José Luis',
        apellido: 'Martínez',
        email: 'jl.martinez@email.com',
        telefono: '55-1122-3344',
        vendedorId: vendedor.id,
        agenciaId: agencia.id,
        calificacionTotal: 82.3,
        clasificacion: 'Calificado',
        vehiculoInteres: 'BMW Serie 3',
        presupuesto: 650000
      },
      {
        nombre: 'Patricia',
        apellido: 'López',
        email: 'patricia.lopez@email.com',
        telefono: '55-5566-7788',
        vendedorId: vendedor.id,
        agenciaId: agencia.id,
        calificacionTotal: 68.7,
        clasificacion: 'A Madurar',
        vehiculoInteres: 'BMW Serie 1',
        presupuesto: 450000
      }
    ];

    for (const prospecto of prospectos) {
      await prisma.prospecto.create({
        data: prospecto
      });
    }

    console.log('✅ ¡Usuarios temporales creados exitosamente!');
    console.log('\n🔑 CREDENCIALES DE ACCESO:');
    console.log('👔 GERENTE:');
    console.log('   Email: gerente@demo.com');
    console.log('   Password: demo123');
    console.log('   Rol: Gerente de Ventas');
    console.log('\n👤 VENDEDOR:');
    console.log('   Email: vendedor@demo.com');
    console.log('   Password: demo123');
    console.log('   Rol: Vendedor');
    console.log('\n📊 Sistema SPPC configurado con 15 pilares');
    console.log('🎯 3 prospectos de ejemplo creados');

  } catch (error) {
    console.error('❌ Error creando usuarios:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTempUsers();
