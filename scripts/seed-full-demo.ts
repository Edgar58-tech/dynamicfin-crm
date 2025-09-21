import { PrismaClient, TipoRol } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting FULL DEMO database seeding for DynamicFin CRM...');

  // Hash passwords
  const hashedPasswordDirectores = await bcrypt.hash('PrivXejc#6', 12);
  const hashedPasswordAdmin = await bcrypt.hash('Rada#94', 12);
  const hashedPasswordDemo = await bcrypt.hash('demo123', 12);

  // ================== SUPER ADMINISTRADORES ==================
  console.log('🔑 Creating Super Admin Users...');

  const superAdminDirectores = await prisma.user.upsert({
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

  const superAdminGeneral = await prisma.user.upsert({
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

  // ================== GRUPO DEMOSTRADOR ==================
  console.log('🏢 Creating Grupo Demostrador...');

  const grupoDemostrador = await prisma.grupoAutomotriz.upsert({
    where: { id: 1 },
    update: {},
    create: {
      nombreGrupo: 'Grupo Demostrador',
      logo: '/logos/grupo-demostrador.png',
      direccion: 'Av. Principal 123, Ciudad Demo',
      email: 'contacto@grupodemostrador.mx',
      paginaWeb: 'https://grupodemostrador.mx',
      activo: true,
    },
  });

  // ================== 7 MARCAS ==================
  console.log('🚗 Creating 7 Automotive Brands...');

  const marcasData = [
    { nombre: 'Audi', logo: '/logos/audi.png', tipo: 'premium' },
    { nombre: 'BMW', logo: '/logos/bmw.png', tipo: 'premium' },
    { nombre: 'Mercedes-Benz', logo: '/logos/mercedes.png', tipo: 'premium' },
    { nombre: 'Honda', logo: '/logos/honda.png', tipo: 'volumen' },
    { nombre: 'Toyota', logo: '/logos/toyota.png', tipo: 'volumen' },
    { nombre: 'Volkswagen', logo: '/logos/volkswagen.png', tipo: 'volumen' },
    { nombre: 'Nissan', logo: '/logos/nissan.png', tipo: 'volumen' },
  ];

  const marcas = [];
  for (const marcaData of marcasData) {
    const existingMarca = await prisma.marca.findFirst({
      where: { nombreMarca: marcaData.nombre }
    });
    
    const marca = existingMarca || await prisma.marca.create({
      data: {
        nombreMarca: marcaData.nombre,
        logo: marcaData.logo,
        grupoId: grupoDemostrador.id,
        activo: true,
      },
    });
    marcas.push({ ...marca, tipo: marcaData.tipo });
  }

  // ================== AGENCIAS POR MARCA ==================
  console.log('🏪 Creating Agencies for each Brand...');

  const agencias = [];
  for (const marca of marcas) {
    const existingAgencia = await prisma.agencia.findFirst({
      where: { nombreAgencia: `Agencia ${marca.nombreMarca} Demo` }
    });
    
    const agencia = existingAgencia || await prisma.agencia.create({
      data: {
        nombreAgencia: `Agencia ${marca.nombreMarca} Demo`,
        marcaId: marca.id,
        direccion: `Av. ${marca.nombreMarca} 456, Ciudad Demo`,
        telefono: `555-${marca.id}000`,
        email: `contacto@${marca.nombreMarca.toLowerCase()}demo.mx`,
        gerente: `Gerente ${marca.nombreMarca}`,
        logo: marca.logo,
        activo: true,
        // Configuración de pagos
        estadoPago: 'ACTIVO',
        tierServicio: marca.tipo === 'premium' ? 'PREMIUM' : 'PROFESIONAL',
        limiteGrabacionesMes: marca.tipo === 'premium' ? 2000 : 500,
        grabacionesUsadas: Math.floor(Math.random() * 100),
        costosPorGrabacion: marca.tipo === 'premium' ? 1.50 : 2.00,
        saldoPendiente: 0,
        fechaUltimoPago: new Date(),
      },
    });
    agencias.push({ ...agencia, marca, tipo: marca.tipo });
  }

  // ================== PILARES SPCC ==================
  console.log('📊 Creating SPCC Pillars...');

  const pilaresData = [
    {
      nombrePilar: "Canal de Contacto e Intención Inicial",
      descripcion: "Mide el nivel de esfuerzo y compromiso demostrado por el prospecto",
      pesoEstrategico: 0.06,
      faseEvaluacion: 1
    },
    {
      nombrePilar: "La Realidad Financiera",
      descripcion: "Factor más crítico. Determina la viabilidad real de la venta",
      pesoEstrategico: 0.15,
      faseEvaluacion: 1
    },
    {
      nombrePilar: "El Para Qué Profundo",
      descripcion: "Descubre la necesidad, sueño o miedo real detrás de la compra",
      pesoEstrategico: 0.10,
      faseEvaluacion: 1
    },
    {
      nombrePilar: "El Termómetro de la Urgencia",
      descripcion: "Permite priorizar la cartera de clientes por necesidad inmediata",
      pesoEstrategico: 0.15,
      faseEvaluacion: 1
    },
    {
      nombrePilar: "El Círculo de Decisión",
      descripcion: "Identifica a todos los involucrados para dirigir la comunicación efectivamente",
      pesoEstrategico: 0.07,
      faseEvaluacion: 2
    },
    {
      nombrePilar: "Vehículo Inicial vs. Solución Ideal",
      descripcion: "Evalúa flexibilidad del cliente y oportunidad del vendedor como asesor",
      pesoEstrategico: 0.02,
      faseEvaluacion: 2
    },
    {
      nombrePilar: "El Presupuesto Real",
      descripcion: "Determina el rango de precios viable para el cliente",
      pesoEstrategico: 0.12,
      faseEvaluacion: 2
    },
    {
      nombrePilar: "La Experiencia Previa",
      descripcion: "Comprende el historial automotriz y expectativas del cliente",
      pesoEstrategico: 0.05,
      faseEvaluacion: 2
    },
    {
      nombrePilar: "El Proceso de Compra",
      descripcion: "Identifica en qué etapa del proceso se encuentra el cliente",
      pesoEstrategico: 0.08,
      faseEvaluacion: 2
    },
    {
      nombrePilar: "La Competencia",
      descripcion: "Conoce qué otras opciones está considerando el cliente",
      pesoEstrategico: 0.06,
      faseEvaluacion: 3
    },
    {
      nombrePilar: "El Factor Emocional",
      descripcion: "Identifica las motivaciones emocionales detrás de la compra",
      pesoEstrategico: 0.04,
      faseEvaluacion: 3
    },
    {
      nombrePilar: "La Confianza y Rapport",
      descripcion: "Mide el nivel de confianza establecido con el vendedor",
      pesoEstrategico: 0.03,
      faseEvaluacion: 3
    },
    {
      nombrePilar: "Las Objeciones Reales",
      descripcion: "Identifica las verdaderas preocupaciones del cliente",
      pesoEstrategico: 0.04,
      faseEvaluacion: 3
    },
    {
      nombrePilar: "El Timing Perfecto",
      descripcion: "Determina el momento ideal para el cierre",
      pesoEstrategico: 0.02,
      faseEvaluacion: 3
    },
    {
      nombrePilar: "La Propuesta de Valor",
      descripcion: "Evalúa qué tan bien se ha comunicado el valor único",
      pesoEstrategico: 0.01,
      faseEvaluacion: 3
    }
  ];

  for (const pilarData of pilaresData) {
    const existingPilar = await prisma.pilar.findFirst({
      where: { nombrePilar: pilarData.nombrePilar }
    });
    
    if (!existingPilar) {
      await prisma.pilar.create({
        data: pilarData,
      });
    }
  }

  // ================== USUARIOS DEMO POR MARCA ==================
  console.log('👥 Creating Demo Users for each Brand...');

  const usuarios = [];
  for (const agencia of agencias) {
    const marca = agencia.marca;
    const marcaLower = marca.nombreMarca.toLowerCase().replace('-', '');
    
    // Gerente General
    const gerenteGeneral = await prisma.user.upsert({
      where: { email: `gerente.general@${marcaLower}demo.mx` },
      update: {},
      create: {
        email: `gerente.general@${marcaLower}demo.mx`,
        name: `Gerente General ${marca.nombreMarca}`,
        nombre: `Gerente General`,
        apellido: marca.nombreMarca,
        password: hashedPasswordDemo,
        rol: TipoRol.GERENTE_GENERAL,
        agenciaId: agencia.id,
        marcaId: marca.id,
        grupoId: grupoDemostrador.id,
        activo: true,
      },
    });
    usuarios.push(gerenteGeneral);

    // Gerente de Ventas
    const gerenteVentas = await prisma.user.upsert({
      where: { email: `gerente.ventas@${marcaLower}demo.mx` },
      update: {},
      create: {
        email: `gerente.ventas@${marcaLower}demo.mx`,
        name: `Gerente Ventas ${marca.nombreMarca}`,
        nombre: `Gerente Ventas`,
        apellido: marca.nombreMarca,
        password: hashedPasswordDemo,
        rol: TipoRol.GERENTE_VENTAS,
        agenciaId: agencia.id,
        marcaId: marca.id,
        grupoId: grupoDemostrador.id,
        activo: true,
      },
    });
    usuarios.push(gerenteVentas);

    // Vendedores (15 para volumen, 10 para premium)
    const numVendedores = agencia.tipo === 'premium' ? 10 : 15;
    for (let i = 1; i <= numVendedores; i++) {
      const vendedor = await prisma.user.upsert({
        where: { email: `vendedor${i}@${marcaLower}demo.mx` },
        update: {},
        create: {
          email: `vendedor${i}@${marcaLower}demo.mx`,
          name: `Vendedor ${i} ${marca.nombreMarca}`,
          nombre: `Vendedor ${i}`,
          apellido: marca.nombreMarca,
          password: hashedPasswordDemo,
          rol: TipoRol.VENDEDOR,
          agenciaId: agencia.id,
          marcaId: marca.id,
          grupoId: grupoDemostrador.id,
          activo: true,
          cargaProspectos: Math.floor(Math.random() * 10),
        },
      });
      usuarios.push(vendedor);
    }

    // Centro de Leads - Recepcionista
    const recepcionista = await prisma.user.upsert({
      where: { email: `recepcion@${marcaLower}demo.mx` },
      update: {},
      create: {
        email: `recepcion@${marcaLower}demo.mx`,
        name: `Recepcionista ${marca.nombreMarca}`,
        nombre: `Recepcionista`,
        apellido: marca.nombreMarca,
        password: hashedPasswordDemo,
        rol: TipoRol.CENTRO_LEADS,
        agenciaId: agencia.id,
        marcaId: marca.id,
        grupoId: grupoDemostrador.id,
        activo: true,
      },
    });
    usuarios.push(recepcionista);

    // Centro de Leads - Marketing Digital
    const marketing = await prisma.user.upsert({
      where: { email: `marketing@${marcaLower}demo.mx` },
      update: {},
      create: {
        email: `marketing@${marcaLower}demo.mx`,
        name: `Marketing ${marca.nombreMarca}`,
        nombre: `Marketing Digital`,
        apellido: marca.nombreMarca,
        password: hashedPasswordDemo,
        rol: TipoRol.MARKETING_DIGITAL,
        agenciaId: agencia.id,
        marcaId: marca.id,
        grupoId: grupoDemostrador.id,
        activo: true,
      },
    });
    usuarios.push(marketing);

    // Centro de Leads - Telemarketing
    const telemarketing = await prisma.user.upsert({
      where: { email: `telemarketing@${marcaLower}demo.mx` },
      update: {},
      create: {
        email: `telemarketing@${marcaLower}demo.mx`,
        name: `Telemarketing ${marca.nombreMarca}`,
        nombre: `Telemarketing`,
        apellido: marca.nombreMarca,
        password: hashedPasswordDemo,
        rol: TipoRol.TELEMARKETING,
        agenciaId: agencia.id,
        marcaId: marca.id,
        grupoId: grupoDemostrador.id,
        activo: true,
      },
    });
    usuarios.push(telemarketing);
  }

  // ================== CATÁLOGO DE VEHÍCULOS ==================
  console.log('🚙 Creating Vehicle Catalog...');

  const vehiculosData = [
    // Audi
    { marca: 'Audi', modelo: 'A3', year: 2024 },
    { marca: 'Audi', modelo: 'A4', year: 2024 },
    { marca: 'Audi', modelo: 'Q3', year: 2024 },
    { marca: 'Audi', modelo: 'Q5', year: 2024 },
    { marca: 'Audi', modelo: 'Q7', year: 2024 },
    // BMW
    { marca: 'BMW', modelo: 'Serie 3', year: 2024 },
    { marca: 'BMW', modelo: 'Serie 5', year: 2024 },
    { marca: 'BMW', modelo: 'X1', year: 2024 },
    { marca: 'BMW', modelo: 'X3', year: 2024 },
    { marca: 'BMW', modelo: 'X5', year: 2024 },
    // Mercedes-Benz
    { marca: 'Mercedes-Benz', modelo: 'Clase A', year: 2024 },
    { marca: 'Mercedes-Benz', modelo: 'Clase C', year: 2024 },
    { marca: 'Mercedes-Benz', modelo: 'GLA', year: 2024 },
    { marca: 'Mercedes-Benz', modelo: 'GLC', year: 2024 },
    { marca: 'Mercedes-Benz', modelo: 'GLE', year: 2024 },
    // Honda
    { marca: 'Honda', modelo: 'Civic', year: 2024 },
    { marca: 'Honda', modelo: 'Accord', year: 2024 },
    { marca: 'Honda', modelo: 'CR-V', year: 2024 },
    { marca: 'Honda', modelo: 'HR-V', year: 2024 },
    { marca: 'Honda', modelo: 'Pilot', year: 2024 },
    // Toyota
    { marca: 'Toyota', modelo: 'Corolla', year: 2024 },
    { marca: 'Toyota', modelo: 'Camry', year: 2024 },
    { marca: 'Toyota', modelo: 'RAV4', year: 2024 },
    { marca: 'Toyota', modelo: 'Highlander', year: 2024 },
    { marca: 'Toyota', modelo: 'Prius', year: 2024 },
    // Volkswagen
    { marca: 'Volkswagen', modelo: 'Jetta', year: 2024 },
    { marca: 'Volkswagen', modelo: 'Passat', year: 2024 },
    { marca: 'Volkswagen', modelo: 'Tiguan', year: 2024 },
    { marca: 'Volkswagen', modelo: 'Atlas', year: 2024 },
    { marca: 'Volkswagen', modelo: 'Golf', year: 2024 },
    // Nissan
    { marca: 'Nissan', modelo: 'Sentra', year: 2024 },
    { marca: 'Nissan', modelo: 'Altima', year: 2024 },
    { marca: 'Nissan', modelo: 'Rogue', year: 2024 },
    { marca: 'Nissan', modelo: 'Murano', year: 2024 },
    { marca: 'Nissan', modelo: 'Pathfinder', year: 2024 },
  ];

  for (const vehiculo of vehiculosData) {
    await prisma.vehiculoCatalogo.upsert({
      where: { 
        marca_modelo_year: {
          marca: vehiculo.marca,
          modelo: vehiculo.modelo,
          year: vehiculo.year
        }
      },
      update: {},
      create: vehiculo,
    });
  }

  // ================== PROSPECTOS DEMO ==================
  console.log('👤 Creating Demo Prospects...');

  const nombresDemo = [
    'Juan Carlos', 'María Elena', 'Roberto', 'Ana Sofía', 'Luis Miguel',
    'Carmen', 'Diego', 'Valentina', 'Alejandro', 'Isabella',
    'Fernando', 'Camila', 'Sebastián', 'Natalia', 'Andrés',
    'Gabriela', 'Mateo', 'Daniela', 'Santiago', 'Lucía'
  ];

  const apellidosDemo = [
    'García', 'Rodríguez', 'López', 'Martínez', 'González',
    'Pérez', 'Sánchez', 'Ramírez', 'Cruz', 'Torres',
    'Flores', 'Gómez', 'Díaz', 'Reyes', 'Morales'
  ];

  const vendedores = usuarios.filter(u => u.rol === TipoRol.VENDEDOR);
  
  for (let i = 0; i < 200; i++) {
    const vendedor = vendedores[Math.floor(Math.random() * vendedores.length)];
    const nombre = nombresDemo[Math.floor(Math.random() * nombresDemo.length)];
    const apellido = apellidosDemo[Math.floor(Math.random() * apellidosDemo.length)];
    
    await prisma.prospecto.create({
      data: {
        nombre,
        apellido,
        email: `${nombre.toLowerCase().replace(' ', '.')}.${apellido.toLowerCase()}@email.com`,
        telefono: `555-${Math.floor(Math.random() * 9000) + 1000}`,
        vendedorId: vendedor.id,
        agenciaId: vendedor.agenciaId!,
        estatus: ['Nuevo', 'Contactado', 'Calificado'][Math.floor(Math.random() * 3)],
        calificacionTotal: Math.floor(Math.random() * 100),
        clasificacion: ['Elite', 'Calificado', 'A Madurar', 'Explorador'][Math.floor(Math.random() * 4)],
        vehiculoInteres: vehiculosData[Math.floor(Math.random() * vehiculosData.length)].modelo,
        presupuesto: Math.floor(Math.random() * 500000) + 200000,
        proximaSeguimiento: new Date(Date.now() + Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
        notas: `Prospecto demo generado automáticamente para ${vendedor.nombre}`,
        origenLead: ['LLAMADA_ENTRANTE', 'VISITA_SHOWROOM', 'OTROS'][Math.floor(Math.random() * 3)],
        estadoAsignacion: 'ASIGNADO',
        nivelUrgencia: ['BAJA', 'MEDIA', 'ALTA'][Math.floor(Math.random() * 3)],
        tiempoEsperado: ['INMEDIATO', '1_SEMANA', '1_MES', 'FLEXIBLE'][Math.floor(Math.random() * 4)],
      },
    });
  }

  // ================== CONFIGURACIONES SISTEMA ==================
  console.log('⚙️ Creating System Configurations...');

  const configuraciones = [
    { clave: 'LIMITE_GUARDIAS_POR_VENDEDOR', valor: '8', tipo: 'number', descripcion: 'Límite máximo de guardias por vendedor por mes' },
    { clave: 'UMBRAL_DESBALANCE_GUARDIAS', valor: '3', tipo: 'number', descripcion: 'Diferencia máxima permitida entre guardias de vendedores' },
    { clave: 'NOTIFICAR_DESBALANCE', valor: 'true', tipo: 'boolean', descripcion: 'Enviar notificaciones cuando hay desbalance de guardias' },
    { clave: 'AUTO_ASIGNAR_LEADS', valor: 'true', tipo: 'boolean', descripcion: 'Asignación automática de leads balanceada' },
    { clave: 'LIMITE_LEADS_POR_VENDEDOR', valor: '15', tipo: 'number', descripcion: 'Límite máximo de leads activos por vendedor' },
    { clave: 'SISTEMA_PAGOS_ACTIVO', valor: 'true', tipo: 'boolean', descripcion: 'Sistema de control de pagos activo' },
    { clave: 'COSTO_BASE_GRABACION', valor: '2.50', tipo: 'number', descripcion: 'Costo base por grabación en pesos' },
    { clave: 'LIMITE_BASICO_GRABACIONES', valor: '100', tipo: 'number', descripcion: 'Límite mensual tier básico' },
    { clave: 'LIMITE_PROFESIONAL_GRABACIONES', valor: '500', tipo: 'number', descripcion: 'Límite mensual tier profesional' },
    { clave: 'LIMITE_PREMIUM_GRABACIONES', valor: '2000', tipo: 'number', descripcion: 'Límite mensual tier premium' },
  ];

  for (const config of configuraciones) {
    await prisma.configuracion.upsert({
      where: { clave: config.clave },
      update: { valor: config.valor },
      create: config,
    });
  }

  console.log('✅ FULL DEMO database seeding completed!');
  console.log(`
🎯 DEMO SYSTEM CREATED:
   ✅ 2 Super Administrators:
      - directores@dynamicfin.mx / PrivXejc#6 (acceso total sin BD)
      - admin@dynamicfin.mx / Rada#94 (admin completo en BD)
   
   ✅ Grupo Demostrador with 7 Brands:
      - 4 Marcas Volumen: Honda, Toyota, VW, Nissan (15 vendedores c/u)
      - 3 Marcas Premium: Audi, BMW, Mercedes (10 vendedores c/u)
      - Total: 85 vendedores
   
   ✅ Complete User Structure per Brand:
      - Gerente General
      - Gerente Ventas  
      - Vendedores (15 volumen / 10 premium)
      - Centro Leads: Recepcionista, Marketing, Telemarketing
   
   ✅ Demo Data:
      - 35 vehículos en catálogo
      - 200 prospectos distribuidos
      - 15 pilares SPCC configurados
      - Sistema de pagos configurado
      - Configuraciones del sistema
   
   ✅ Payment System:
      - Tier Premium: 2000 grabaciones/mes, $1.50 c/u
      - Tier Profesional: 500 grabaciones/mes, $2.00 c/u
      - Control automático de límites y facturación
   
🔐 LOGIN CREDENTIALS:
   All demo users: password = "demo123"
   Format: [role]@[brand]demo.mx
   
🚀 System ready for full demonstration!
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
