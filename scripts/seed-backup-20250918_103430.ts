
import { PrismaClient, TipoRol } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // First, seed the 15 SPPC Pillars based on the technical documentation
  console.log('📊 Seeding SPPC Pillars...');
  
  const pilares = [
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
      nombrePilar: "Nivel de Conocimiento",
      descripcion: "Permite adaptar el nivel de conversación técnica",
      pesoEstrategico: 0.02,
      faseEvaluacion: 2
    },
    {
      nombrePilar: "La Moneda de Cambio (Auto a Cuenta)",
      descripcion: "Componente clave en la estructura financiera del trato",
      pesoEstrategico: 0.09,
      faseEvaluacion: 2
    },
    {
      nombrePilar: "Calidad de la Conversación",
      descripcion: "Mide el interés genuino a través del nivel de interacción",
      pesoEstrategico: 0.09,
      faseEvaluacion: 2
    },
    {
      nombrePilar: "Historial y Barreras Previas",
      descripcion: "Permite anticipar y desactivar objeciones",
      pesoEstrategico: 0.02,
      faseEvaluacion: 2
    },
    {
      nombrePilar: "Cercanía a la Agencia",
      descripcion: "Factor de conveniencia que influye en la visita y lealtad",
      pesoEstrategico: 0.04,
      faseEvaluacion: 3
    },
    {
      nombrePilar: "Lealtad a la Marca",
      descripcion: "Cliente recurrente tiene ciclo de venta más corto",
      pesoEstrategico: 0.08,
      faseEvaluacion: 3
    },
    {
      nombrePilar: "Posesión de Múltiples Vehículos",
      descripcion: "Indicador de capacidad económica y potencial futuro",
      pesoEstrategico: 0.04,
      faseEvaluacion: 3
    },
    {
      nombrePilar: "Actitud del Prospecto",
      descripcion: "Ayuda a adaptar el estilo de venta a la personalidad del cliente",
      pesoEstrategico: 0.05,
      faseEvaluacion: 3
    },
    {
      nombrePilar: "Círculo de Influencia",
      descripcion: "Mide el potencial del cliente como embajador de la marca",
      pesoEstrategico: 0.02,
      faseEvaluacion: 3
    }
  ];

  // Create pillars
  for (const pilar of pilares) {
    const existingPilar = await prisma.pilar.findFirst({
      where: { nombrePilar: pilar.nombrePilar },
    });
    
    if (!existingPilar) {
      await prisma.pilar.create({
        data: pilar,
      });
    }
  }

  console.log('🏢 Seeding Automotive Groups, Brands, and Agencies...');

  // Create Automotive Groups
  const grupoAleman = await prisma.grupoAutomotriz.upsert({
    where: { id: 1 },
    update: {},
    create: {
      nombreGrupo: "Grupo Automotriz Alemán Premium",
      logo: "/images/logo-grupo-aleman.png",
      direccion: "Av. Revolución 1425, Col. Campestre, Ciudad de México",
      email: "contacto@grupoalemanpremium.com",
      paginaWeb: "https://grupoalemanpremium.com",
    },
  });

  const grupoJapones = await prisma.grupoAutomotriz.upsert({
    where: { id: 2 },
    update: {},
    create: {
      nombreGrupo: "Grupo Automotriz Japonés",
      logo: "/images/logo-grupo-japones.png",
      direccion: "Blvd. Manuel Ávila Camacho 191, Col. Lomas de Chapultepec",
      email: "info@grupojaponesmx.com",
      paginaWeb: "https://grupojaponesmx.com",
    },
  });

  // Create Brands
  const marcaAudi = await prisma.marca.upsert({
    where: { id: 1 },
    update: {},
    create: {
      nombreMarca: "Audi",
      logo: "/images/audi-logo.png",
      grupoId: grupoAleman.id,
    },
  });

  const marcaBMW = await prisma.marca.upsert({
    where: { id: 2 },
    update: {},
    create: {
      nombreMarca: "BMW",
      logo: "/images/bmw-logo.png",
      grupoId: grupoAleman.id,
    },
  });

  const marcaToyota = await prisma.marca.upsert({
    where: { id: 3 },
    update: {},
    create: {
      nombreMarca: "Toyota",
      logo: "/images/toyota-logo.png",
      grupoId: grupoJapones.id,
    },
  });

  const marcaHonda = await prisma.marca.upsert({
    where: { id: 4 },
    update: {},
    create: {
      nombreMarca: "Honda",
      logo: "/images/honda-logo.png",
      grupoId: grupoJapones.id,
    },
  });

  // Create Agencies
  const audiPolanco = await prisma.agencia.upsert({
    where: { id: 1 },
    update: {},
    create: {
      nombreAgencia: "Audi Polanco",
      marcaId: marcaAudi.id,
      direccion: "Av. Horacio 1855, Col. Los Morales Polanco, Miguel Hidalgo",
      telefono: "55-5280-1200",
      email: "ventas@audipolanco.com.mx",
      gerente: "Roberto Martínez Silva",
      logo: "/images/audi-polanco-logo.png",
    },
  });

  const audiSantaFe = await prisma.agencia.upsert({
    where: { id: 2 },
    update: {},
    create: {
      nombreAgencia: "Audi Santa Fe",
      marcaId: marcaAudi.id,
      direccion: "Av. Carlos Lazo 100, Col. Santa Fe, Álvaro Obregón",
      telefono: "55-1103-8000",
      email: "ventas@audisantafe.com.mx",
      gerente: "Ana Patricia Hernández",
      logo: "/images/audi-santafe-logo.png",
    },
  });

  const bmwInterlomas = await prisma.agencia.upsert({
    where: { id: 3 },
    update: {},
    create: {
      nombreAgencia: "BMW Interlomas",
      marcaId: marcaBMW.id,
      direccion: "Blvd. Magnocentro 26, Col. Centro Urbano San Fernando",
      telefono: "55-5291-4400",
      email: "contacto@bmwinterlomas.com",
      gerente: "Fernando López García",
      logo: "/images/bmw-interlomas-logo.png",
    },
  });

  const toyotaSureste = await prisma.agencia.upsert({
    where: { id: 4 },
    update: {},
    create: {
      nombreAgencia: "Toyota Sureste",
      marcaId: marcaToyota.id,
      direccion: "Av. División del Norte 3418, Col. Xotepingo, Coyoacán",
      telefono: "55-5524-7800",
      email: "ventas@toyotasureste.com",
      gerente: "Carmen Rodríguez Mendez",
      logo: "/images/toyota-sureste-logo.png",
    },
  });

  const hondaCentro = await prisma.agencia.upsert({
    where: { id: 5 },
    update: {},
    create: {
      nombreAgencia: "Honda Centro",
      marcaId: marcaHonda.id,
      direccion: "Eje Central Lázaro Cárdenas 13, Col. Centro",
      telefono: "55-5518-2200",
      email: "info@hondacentro.mx",
      gerente: "Miguel Ángel Vargas",
      logo: "/images/honda-centro-logo.png",
    },
  });

  console.log('👥 Seeding Users...');

  // Hash passwords
  const hashedPassword = await bcrypt.hash('johndoe123', 12);
  const hashedPasswordGeneral = await bcrypt.hash('password123', 12);
  const hashedPasswordMaster = await bcrypt.hash('PrivXejc#6', 12);

  // Master DynamicFin Admin User
  const masterAdmin = await prisma.user.upsert({
    where: { email: 'admin@dynamicfin.mx' },
    update: {},
    create: {
      email: 'admin@dynamicfin.mx',
      name: 'DynamicFin Master Admin',
      nombre: 'DynamicFin',
      apellido: 'Master Admin',
      password: hashedPasswordMaster,
      rol: TipoRol.DYNAMICFIN_ADMIN,
      activo: true,
    },
  });

  // Test user (hidden from user responses as per requirements)
  const testUser = await prisma.user.upsert({
    where: { email: 'john@doe.com' },
    update: {},
    create: {
      email: 'john@doe.com',
      name: 'Juan Doe',
      nombre: 'Juan',
      apellido: 'Doe',
      password: hashedPassword,
      rol: TipoRol.DYNAMICFIN_ADMIN,
      activo: true,
    },
  });

  // Director General
  const directorGeneral = await prisma.user.upsert({
    where: { email: 'director@grupoalemanpremium.com' },
    update: {},
    create: {
      email: 'director@grupoalemanpremium.com',
      name: 'Carlos Mendoza',
      nombre: 'Carlos',
      apellido: 'Mendoza',
      password: hashedPasswordGeneral,
      rol: TipoRol.DIRECTOR_GENERAL,
      grupoId: grupoAleman.id,
      activo: true,
    },
  });

  // Director de Marca Audi
  const directorAudi = await prisma.user.upsert({
    where: { email: 'director.audi@grupoalemanpremium.com' },
    update: {},
    create: {
      email: 'director.audi@grupoalemanpremium.com',
      name: 'María González',
      nombre: 'María',
      apellido: 'González',
      password: hashedPasswordGeneral,
      rol: TipoRol.DIRECTOR_MARCA,
      grupoId: grupoAleman.id,
      marcaId: marcaAudi.id,
      activo: true,
    },
  });

  // Gerente General Audi Polanco
  const gerentePolanco = await prisma.user.upsert({
    where: { email: 'gerente@audipolanco.com.mx' },
    update: {},
    create: {
      email: 'gerente@audipolanco.com.mx',
      name: 'Roberto Martínez',
      nombre: 'Roberto',
      apellido: 'Martínez',
      password: hashedPasswordGeneral,
      rol: TipoRol.GERENTE_GENERAL,
      grupoId: grupoAleman.id,
      marcaId: marcaAudi.id,
      agenciaId: audiPolanco.id,
      activo: true,
    },
  });

  // Gerente de Ventas
  const gerenteVentas = await prisma.user.upsert({
    where: { email: 'ventas.gerente@audipolanco.com.mx' },
    update: {},
    create: {
      email: 'ventas.gerente@audipolanco.com.mx',
      name: 'Patricia Silva',
      nombre: 'Patricia',
      apellido: 'Silva',
      password: hashedPasswordGeneral,
      rol: TipoRol.GERENTE_VENTAS,
      grupoId: grupoAleman.id,
      marcaId: marcaAudi.id,
      agenciaId: audiPolanco.id,
      activo: true,
    },
  });

  // Vendedores
  const vendedor1 = await prisma.user.upsert({
    where: { email: 'carlos.venta@audipolanco.com.mx' },
    update: {},
    create: {
      email: 'carlos.venta@audipolanco.com.mx',
      name: 'Carlos Venta',
      nombre: 'Carlos',
      apellido: 'Venta',
      password: hashedPasswordGeneral,
      rol: TipoRol.VENDEDOR,
      grupoId: grupoAleman.id,
      marcaId: marcaAudi.id,
      agenciaId: audiPolanco.id,
      activo: true,
    },
  });

  const vendedor2 = await prisma.user.upsert({
    where: { email: 'lucia.ventas@audipolanco.com.mx' },
    update: {},
    create: {
      email: 'lucia.ventas@audipolanco.com.mx',
      name: 'Lucía Ventas',
      nombre: 'Lucía',
      apellido: 'Ventas',
      password: hashedPasswordGeneral,
      rol: TipoRol.VENDEDOR,
      grupoId: grupoAleman.id,
      marcaId: marcaAudi.id,
      agenciaId: audiPolanco.id,
      activo: true,
    },
  });

  const vendedor3 = await prisma.user.upsert({
    where: { email: 'miguel.sales@audisantafe.com.mx' },
    update: {},
    create: {
      email: 'miguel.sales@audisantafe.com.mx',
      name: 'Miguel Sales',
      nombre: 'Miguel',
      apellido: 'Sales',
      password: hashedPasswordGeneral,
      rol: TipoRol.VENDEDOR,
      grupoId: grupoAleman.id,
      marcaId: marcaAudi.id,
      agenciaId: audiSantaFe.id,
      activo: true,
    },
  });

  console.log('🚗 Seeding Vehicle Catalog...');

  // Comprehensive Vehicle Catalog - Simplified identification without pricing
  const vehiculosCatalogo = [
    // Audi Models
    { marca: "Audi", modelo: "A3 Sportback", year: 2024 },
    { marca: "Audi", modelo: "A3 Sedan", year: 2024 },
    { marca: "Audi", modelo: "A4 Sedan", year: 2024 },
    { marca: "Audi", modelo: "A4 Avant", year: 2024 },
    { marca: "Audi", modelo: "A6 Sedan", year: 2024 },
    { marca: "Audi", modelo: "A6 Avant", year: 2024 },
    { marca: "Audi", modelo: "A7 Sportback", year: 2024 },
    { marca: "Audi", modelo: "A8 L", year: 2024 },
    { marca: "Audi", modelo: "Q3 Sportback", year: 2024 },
    { marca: "Audi", modelo: "Q5 Sportback", year: 2024 },
    { marca: "Audi", modelo: "Q7", year: 2024 },
    { marca: "Audi", modelo: "Q8", year: 2024 },
    { marca: "Audi", modelo: "e-tron GT", year: 2024 },
    { marca: "Audi", modelo: "Q4 e-tron", year: 2024 },
    
    // BMW Models
    { marca: "BMW", modelo: "Serie 1", year: 2024 },
    { marca: "BMW", modelo: "Serie 2 Gran Coupé", year: 2024 },
    { marca: "BMW", modelo: "Serie 3 Sedan", year: 2024 },
    { marca: "BMW", modelo: "Serie 3 Touring", year: 2024 },
    { marca: "BMW", modelo: "Serie 4 Coupé", year: 2024 },
    { marca: "BMW", modelo: "Serie 4 Gran Coupé", year: 2024 },
    { marca: "BMW", modelo: "Serie 5 Sedan", year: 2024 },
    { marca: "BMW", modelo: "Serie 5 Touring", year: 2024 },
    { marca: "BMW", modelo: "Serie 7", year: 2024 },
    { marca: "BMW", modelo: "X1", year: 2024 },
    { marca: "BMW", modelo: "X3", year: 2024 },
    { marca: "BMW", modelo: "X4", year: 2024 },
    { marca: "BMW", modelo: "X5", year: 2024 },
    { marca: "BMW", modelo: "X6", year: 2024 },
    { marca: "BMW", modelo: "X7", year: 2024 },
    { marca: "BMW", modelo: "iX", year: 2024 },
    { marca: "BMW", modelo: "i4", year: 2024 },
    
    // Mercedes-Benz Models
    { marca: "Mercedes-Benz", modelo: "Clase A", year: 2024 },
    { marca: "Mercedes-Benz", modelo: "Clase C Sedan", year: 2024 },
    { marca: "Mercedes-Benz", modelo: "Clase C Estate", year: 2024 },
    { marca: "Mercedes-Benz", modelo: "Clase E Sedan", year: 2024 },
    { marca: "Mercedes-Benz", modelo: "Clase E Estate", year: 2024 },
    { marca: "Mercedes-Benz", modelo: "Clase S", year: 2024 },
    { marca: "Mercedes-Benz", modelo: "CLA Coupé", year: 2024 },
    { marca: "Mercedes-Benz", modelo: "CLS", year: 2024 },
    { marca: "Mercedes-Benz", modelo: "GLA", year: 2024 },
    { marca: "Mercedes-Benz", modelo: "GLB", year: 2024 },
    { marca: "Mercedes-Benz", modelo: "GLC", year: 2024 },
    { marca: "Mercedes-Benz", modelo: "GLE", year: 2024 },
    { marca: "Mercedes-Benz", modelo: "GLS", year: 2024 },
    { marca: "Mercedes-Benz", modelo: "EQA", year: 2024 },
    { marca: "Mercedes-Benz", modelo: "EQC", year: 2024 },
    
    // Toyota Models
    { marca: "Toyota", modelo: "Yaris", year: 2024 },
    { marca: "Toyota", modelo: "Corolla", year: 2024 },
    { marca: "Toyota", modelo: "Camry", year: 2024 },
    { marca: "Toyota", modelo: "Avalon", year: 2024 },
    { marca: "Toyota", modelo: "C-HR", year: 2024 },
    { marca: "Toyota", modelo: "RAV4", year: 2024 },
    { marca: "Toyota", modelo: "Highlander", year: 2024 },
    { marca: "Toyota", modelo: "4Runner", year: 2024 },
    { marca: "Toyota", modelo: "Sequoia", year: 2024 },
    { marca: "Toyota", modelo: "Land Cruiser", year: 2024 },
    { marca: "Toyota", modelo: "Prius", year: 2024 },
    { marca: "Toyota", modelo: "Sienna", year: 2024 },
    
    // Honda Models
    { marca: "Honda", modelo: "Civic Hatchback", year: 2024 },
    { marca: "Honda", modelo: "Civic Sedan", year: 2024 },
    { marca: "Honda", modelo: "Civic Type R", year: 2024 },
    { marca: "Honda", modelo: "Accord", year: 2024 },
    { marca: "Honda", modelo: "HR-V", year: 2024 },
    { marca: "Honda", modelo: "CR-V", year: 2024 },
    { marca: "Honda", modelo: "Pilot", year: 2024 },
    { marca: "Honda", modelo: "Passport", year: 2024 },
    { marca: "Honda", modelo: "Ridgeline", year: 2024 },
    { marca: "Honda", modelo: "Odyssey", year: 2024 },
  ];

  // Insert vehicle catalog
  for (const vehiculo of vehiculosCatalogo) {
    await prisma.vehiculoCatalogo.upsert({
      where: {
        marca_modelo_year: {
          marca: vehiculo.marca,
          modelo: vehiculo.modelo,
          year: vehiculo.year,
        },
      },
      update: {},
      create: vehiculo,
    });
  }

  console.log('🚗 Seeding Inventory Vehicles...');

  // Sample vehicles for inventory (existing code with pricing)  
  const vehiculos = [
    {
      agenciaId: audiPolanco.id,
      marca: "Audi",
      modelo: "A4",
      year: 2024,
      version: "40 TFSI quattro",
      precio: 899900.00,
      color: "Negro Fantasma",
      kilometraje: 0,
      numeroSerie: "WAUENAF40PA123456",
    },
    {
      agenciaId: audiPolanco.id,
      marca: "Audi",
      modelo: "A6",
      year: 2024,
      version: "55 TFSI quattro",
      precio: 1299900.00,
      color: "Blanco Glaciar",
      kilometraje: 0,
      numeroSerie: "WAUGFAF76PA234567",
    },
    {
      agenciaId: audiPolanco.id,
      marca: "Audi",
      modelo: "Q7",
      year: 2024,
      version: "55 TFSI quattro",
      precio: 1799900.00,
      color: "Gris Nardo",
      kilometraje: 0,
      numeroSerie: "WA1LAAF76PA345678",
    },
    {
      agenciaId: audiSantaFe.id,
      marca: "Audi",
      modelo: "Q5",
      year: 2024,
      version: "40 TFSI quattro",
      precio: 1199900.00,
      color: "Azul Navarra",
      kilometraje: 0,
      numeroSerie: "WA1ANAFY6P2456789",
    },
    {
      agenciaId: audiSantaFe.id,
      marca: "Audi",
      modelo: "A3",
      year: 2024,
      version: "35 TFSI",
      precio: 629900.00,
      color: "Rojo Tango",
      kilometraje: 0,
      numeroSerie: "WAUZZZ8V7PA567890",
    },
  ];

  for (const vehiculo of vehiculos) {
    await prisma.vehiculo.upsert({
      where: { numeroSerie: vehiculo.numeroSerie },
      update: {},
      create: vehiculo,
    });
  }

  console.log('📈 Seeding Metrics...');

  // Current month metrics
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  await prisma.metricaVenta.upsert({
    where: {
      agenciaId_mes_year: {
        agenciaId: audiPolanco.id,
        mes: currentMonth,
        year: currentYear,
      },
    },
    update: {},
    create: {
      agenciaId: audiPolanco.id,
      mes: currentMonth,
      year: currentYear,
      ventasRealizadas: 12,
      metaVentas: 18,
      prospectosProcesados: 145,
      tasaConversion: 8.28,
      utilidadPromedio: 125000.00,
      vendedoresActivos: 3,
      optimizacionesProcesadas: 89,
    },
  });

  await prisma.metricaVenta.upsert({
    where: {
      agenciaId_mes_year: {
        agenciaId: audiSantaFe.id,
        mes: currentMonth,
        year: currentYear,
      },
    },
    update: {},
    create: {
      agenciaId: audiSantaFe.id,
      mes: currentMonth,
      year: currentYear,
      ventasRealizadas: 8,
      metaVentas: 15,
      prospectosProcesados: 98,
      tasaConversion: 8.16,
      utilidadPromedio: 118000.00,
      vendedoresActivos: 2,
      optimizacionesProcesadas: 67,
    },
  });

  console.log('👥 Seeding Sample Prospects...');

  // Sample prospects with different classifications
  const prospectos = [
    {
      nombre: "Fernando",
      apellido: "Rodríguez",
      email: "fernando.rodriguez@email.com",
      telefono: "+52 55 1234-5678",
      vendedorId: vendedor1.id,
      agenciaId: audiPolanco.id,
      estatus: "En Proceso",
      calificacionTotal: 92.50,
      clasificacion: "Elite",
      vehiculoInteres: "Audi Q7 55 TFSI quattro",
      presupuesto: 1800000.00,
      proximaSeguimiento: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      notas: "Cliente muy interesado, tiene crédito pre-aprobado",
    },
    {
      nombre: "María",
      apellido: "López",
      email: "maria.lopez@corporativo.com",
      telefono: "+52 55 9876-5432",
      vendedorId: vendedor1.id,
      agenciaId: audiPolanco.id,
      estatus: "Calificado",
      calificacionTotal: 78.25,
      clasificacion: "Calificado",
      vehiculoInteres: "Audi A6 55 TFSI quattro",
      presupuesto: 1300000.00,
      proximaSeguimiento: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
      notas: "Necesita aprobación de esposo, muy interesada",
    },
    {
      nombre: "José",
      apellido: "Martínez",
      email: "jose.martinez@gmail.com",
      telefono: "+52 55 5555-1234",
      vendedorId: vendedor2.id,
      agenciaId: audiPolanco.id,
      estatus: "A Madurar",
      calificacionTotal: 45.75,
      clasificacion: "A Madurar",
      vehiculoInteres: "Audi A4 40 TFSI quattro",
      presupuesto: 900000.00,
      proximaSeguimiento: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week
      notas: "Quiere esperar a fin de año, buen potencial",
    },
    {
      nombre: "Ana",
      apellido: "García",
      email: "ana.garcia@hotmail.com",
      telefono: "+52 55 7777-8888",
      vendedorId: vendedor2.id,
      agenciaId: audiPolanco.id,
      estatus: "Explorador",
      calificacionTotal: 28.50,
      clasificacion: "Explorador",
      vehiculoInteres: "Audi A3 35 TFSI",
      presupuesto: 650000.00,
      proximaSeguimiento: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks
      notas: "Solo cotizando, primera experiencia con la marca",
    },
    {
      nombre: "Roberto",
      apellido: "Sánchez",
      email: "roberto.sanchez@empresa.mx",
      telefono: "+52 55 3333-4444",
      vendedorId: vendedor3.id,
      agenciaId: audiSantaFe.id,
      estatus: "Elite",
      calificacionTotal: 95.75,
      clasificacion: "Elite",
      vehiculoInteres: "Audi Q5 40 TFSI quattro",
      presupuesto: 1200000.00,
      proximaSeguimiento: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      notas: "Cliente repetitivo, quiere cambiar su Q3 por Q5",
    },
  ];

  for (const prospecto of prospectos) {
    const existingProspecto = await prisma.prospecto.findFirst({
      where: { 
        email: prospecto.email,
        agenciaId: prospecto.agenciaId 
      },
    });
    
    if (!existingProspecto) {
      await prisma.prospecto.create({
        data: prospecto,
      });
    }
  }

  console.log('⚙️ Seeding Configuration...');

  const configuraciones = [
    {
      clave: "empresa_nombre",
      valor: "DynamicFin Optimization Suite",
      descripcion: "Nombre de la empresa/plataforma",
    },
    {
      clave: "sppc_clasificacion_elite_min",
      valor: "85",
      tipo: "number",
      descripcion: "Puntuación mínima para clasificación Elite",
    },
    {
      clave: "sppc_clasificacion_calificado_min",
      valor: "60",
      tipo: "number",
      descripcion: "Puntuación mínima para clasificación Calificado",
    },
    {
      clave: "sppc_clasificacion_madurar_min",
      valor: "35",
      tipo: "number",
      descripcion: "Puntuación mínima para clasificación A Madurar",
    },
    {
      clave: "seguimiento_dias_elite",
      valor: "1",
      tipo: "number",
      descripcion: "Días para seguimiento de prospectos Elite",
    },
    {
      clave: "seguimiento_dias_calificado",
      valor: "3",
      tipo: "number",
      descripcion: "Días para seguimiento de prospectos Calificados",
    },
    {
      clave: "seguimiento_dias_madurar",
      valor: "7",
      tipo: "number",
      descripcion: "Días para seguimiento de prospectos A Madurar",
    },
    {
      clave: "seguimiento_dias_explorador",
      valor: "14",
      tipo: "number",
      descripcion: "Días para seguimiento de prospectos Exploradores",
    },
  ];

  for (const config of configuraciones) {
    await prisma.configuracion.upsert({
      where: { clave: config.clave },
      update: {},
      create: config,
    });
  }

  console.log('✅ Database seeding completed successfully!');
  console.log(`
📊 Seeded:
   - ${pilares.length} SPPC Pillars
   - 2 Automotive Groups
   - 4 Brands (Audi, BMW, Toyota, Honda)
   - 5 Agencies
   - 8 Users (1 Master Admin, 1 Director General, 1 Director Marca, 1 Gerente General, 1 Gerente Ventas, 3 Vendedores)
   - ${vehiculosCatalogo.length} Vehicle Catalog Entries
   - ${vehiculos.length} Inventory Vehicles
   - 2 Monthly Metrics
   - ${prospectos.length} Sample Prospects
   - ${configuraciones.length} Configuration Settings
  `);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
