
import { PrismaClient, TipoRol } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive database seeding for DEMO...');

  // First, seed the 15 SPCC Pillars based on the technical documentation
  console.log('📊 Seeding SPCC Pillars...');
  
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

  // Create pillars with transaction
  await prisma.$transaction(async (tx) => {
    for (const pilar of pilares) {
      const existingPilar = await tx.pilar.findFirst({
        where: { nombrePilar: pilar.nombrePilar },
      });
      
      if (!existingPilar) {
        await tx.pilar.create({
          data: pilar,
        });
      }
    }
  });

  console.log('🏢 Creating Demo Automotive Group & Brands...');

  // ================== DEMO AUTOMOTIVE GROUP ==================
  const grupoDemostrador = await prisma.grupoAutomotriz.upsert({
    where: { id: 1 },
    update: {},
    create: {
      nombreGrupo: "Grupo Automotriz Demostrador",
      logo: "/images/logo-grupo-demo.png",
      direccion: "Av. Revolución 1500, Col. Campestre, Ciudad de México",
      email: "contacto@grupoautomotrizdemostrador.com",
      paginaWeb: "https://grupoautomotrizdemostrador.com",
    },
  });

  // ================== DEMO BRANDS ==================
  const marcaAudi = await prisma.marca.upsert({
    where: { id: 1 },
    update: {},
    create: {
      nombreMarca: "Audi",
      logo: "/images/audi-logo.png",
      grupoId: grupoDemostrador.id,
    },
  });

  const marcaToyota = await prisma.marca.upsert({
    where: { id: 2 },
    update: {},
    create: {
      nombreMarca: "Toyota",
      logo: "/images/toyota-logo.png",
      grupoId: grupoDemostrador.id,
    },
  });

  const marcaHonda = await prisma.marca.upsert({
    where: { id: 3 },
    update: {},
    create: {
      nombreMarca: "Honda",
      logo: "/images/honda-logo.png",
      grupoId: grupoDemostrador.id,
    },
  });

  const marcaVW = await prisma.marca.upsert({
    where: { id: 4 },
    update: {},
    create: {
      nombreMarca: "Volkswagen",
      logo: "/images/vw-logo.png",
      grupoId: grupoDemostrador.id,
    },
  });

  const marcaNissan = await prisma.marca.upsert({
    where: { id: 5 },
    update: {},
    create: {
      nombreMarca: "Nissan",
      logo: "/images/nissan-logo.png",
      grupoId: grupoDemostrador.id,
    },
  });

  const marcaMazda = await prisma.marca.upsert({
    where: { id: 6 },
    update: {},
    create: {
      nombreMarca: "Mazda",
      logo: "/images/mazda-logo.png",
      grupoId: grupoDemostrador.id,
    },
  });

  const marcaBMW = await prisma.marca.upsert({
    where: { id: 7 },
    update: {},
    create: {
      nombreMarca: "BMW",
      logo: "/images/bmw-logo.png",
      grupoId: grupoDemostrador.id,
    },
  });

  // ================== DEMO AGENCIES ==================
  console.log('🏪 Creating 7 Demo Agencies...');

  const audiDemo = await prisma.agencia.upsert({
    where: { id: 1 },
    update: {},
    create: {
      nombreAgencia: "Audi Demostrador",
      marcaId: marcaAudi.id,
      direccion: "Av. Horacio 1855, Col. Los Morales Polanco, Miguel Hidalgo",
      telefono: "55-5280-1200",
      email: "ventas@audidemostrador.com.mx",
      gerente: "Gerente Audi Demo",
      logo: "/images/audi-demo-logo.png",
      tierServicio: "PREMIUM",
      limiteGrabacionesMes: 500,
    },
  });

  const toyotaDemo = await prisma.agencia.upsert({
    where: { id: 2 },
    update: {},
    create: {
      nombreAgencia: "Toyota Demostrador",
      marcaId: marcaToyota.id,
      direccion: "Av. División del Norte 3418, Col. Xotepingo, Coyoacán",
      telefono: "55-5524-7800",
      email: "ventas@toyotademostrador.com",
      gerente: "Gerente Toyota Demo",
      logo: "/images/toyota-demo-logo.png",
      tierServicio: "PROFESIONAL",
      limiteGrabacionesMes: 300,
    },
  });

  const hondaDemo = await prisma.agencia.upsert({
    where: { id: 3 },
    update: {},
    create: {
      nombreAgencia: "Honda Demostrador",
      marcaId: marcaHonda.id,
      direccion: "Eje Central Lázaro Cárdenas 13, Col. Centro",
      telefono: "55-5518-2200",
      email: "info@hondademostrador.mx",
      gerente: "Gerente Honda Demo",
      logo: "/images/honda-demo-logo.png",
      tierServicio: "PROFESIONAL",
      limiteGrabacionesMes: 300,
    },
  });

  const vwDemo = await prisma.agencia.upsert({
    where: { id: 4 },
    update: {},
    create: {
      nombreAgencia: "VW Demostrador",
      marcaId: marcaVW.id,
      direccion: "Blvd. Manuel Ávila Camacho 191, Col. Lomas de Chapultepec",
      telefono: "55-5555-1234",
      email: "ventas@vwdemostrador.com",
      gerente: "Gerente VW Demo",
      logo: "/images/vw-demo-logo.png",
      tierServicio: "PROFESIONAL",
      limiteGrabacionesMes: 300,
    },
  });

  const nissanDemo = await prisma.agencia.upsert({
    where: { id: 5 },
    update: {},
    create: {
      nombreAgencia: "Nissan Demostrador",
      marcaId: marcaNissan.id,
      direccion: "Av. Insurgentes Sur 1423, Col. Insurgentes Mixcoac",
      telefono: "55-5555-5678",
      email: "ventas@nissandemostrador.com",
      gerente: "Gerente Nissan Demo",
      logo: "/images/nissan-demo-logo.png",
      tierServicio: "PROFESIONAL",
      limiteGrabacionesMes: 300,
    },
  });

  const mazdaDemo = await prisma.agencia.upsert({
    where: { id: 6 },
    update: {},
    create: {
      nombreAgencia: "Mazda Demostrador",
      marcaId: marcaMazda.id,
      direccion: "Av. Universidad 1200, Col. Del Valle Centro",
      telefono: "55-5555-9012",
      email: "ventas@mazdademostrador.com",
      gerente: "Gerente Mazda Demo",
      logo: "/images/mazda-demo-logo.png",
      tierServicio: "PROFESIONAL",
      limiteGrabacionesMes: 300,
    },
  });

  const bmwDemo = await prisma.agencia.upsert({
    where: { id: 7 },
    update: {},
    create: {
      nombreAgencia: "BMW Demostrador",
      marcaId: marcaBMW.id,
      direccion: "Blvd. Magnocentro 26, Col. Centro Urbano San Fernando",
      telefono: "55-5291-4400",
      email: "contacto@bmwdemostrador.com",
      gerente: "Gerente BMW Demo",
      logo: "/images/bmw-demo-logo.png",
      tierServicio: "PREMIUM",
      limiteGrabacionesMes: 500,
    },
  });

  // ================== DEMO USERS CREATION ==================
  console.log('👥 Creating Demo Users (37 + vendedores adicionales)...');

  // Hash passwords
  const hashedPasswordTest = await bcrypt.hash('johndoe123', 12);
  const hashedPasswordDemo = await bcrypt.hash('gerente1213', 12);
  const hashedPasswordVendedor = await bcrypt.hash('vendedor123', 12);
  const hashedPasswordRecep = await bcrypt.hash('recep123', 12);
  const hashedPasswordMktg = await bcrypt.hash('mktg123', 12);
  const hashedPasswordTele = await bcrypt.hash('tele123', 12);
  const hashedPasswordDirectores = await bcrypt.hash('PrivXejc#6', 12);
  const hashedPasswordAdmin = await bcrypt.hash('Rada#94', 12);

  // ================== SUPER ADMINISTRATORS ==================
  console.log('🔑 Creating Super Administrators...');

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

  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@dynamicfin.mx' },
    update: {},
    create: {
      email: 'admin@dynamicfin.mx',
      name: 'Administrador DynamicFin',
      nombre: 'Administrador',
      apellido: 'DynamicFin',
      password: hashedPasswordAdmin,
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
      password: hashedPasswordTest,
      rol: TipoRol.DYNAMICFIN_ADMIN,
      activo: true,
    },
  });

  // ================== DEMO USERS BY AGENCY (5 per agency = 35 total) ==================
  console.log('👥 Creating 5 users per agency (35 total)...');

  // AUDI DEMOSTRADOR (Premium)
  const gerenteAudi = await prisma.user.upsert({
    where: { email: 'gerenteaudi@demo.com' },
    update: {},
    create: {
      email: 'gerenteaudi@demo.com',
      name: 'Gerente Audi Demo',
      nombre: 'Gerente',
      apellido: 'Audi Demo',
      password: hashedPasswordDemo,
      rol: TipoRol.GERENTE_VENTAS,
      grupoId: grupoDemostrador.id,
      marcaId: marcaAudi.id,
      agenciaId: audiDemo.id,
      activo: true,
    },
  });

  const vendedorAudi = await prisma.user.upsert({
    where: { email: 'vendedoraudi@demo.com' },
    update: {},
    create: {
      email: 'vendedoraudi@demo.com',
      name: 'Vendedor Audi Demo',
      nombre: 'Vendedor',
      apellido: 'Audi Demo',
      password: hashedPasswordVendedor,
      rol: TipoRol.VENDEDOR,
      grupoId: grupoDemostrador.id,
      marcaId: marcaAudi.id,
      agenciaId: audiDemo.id,
      activo: true,
    },
  });

  const recepAudi = await prisma.user.upsert({
    where: { email: 'recepaudi@demo.com' },
    update: {},
    create: {
      email: 'recepaudi@demo.com',
      name: 'Recepción Audi Demo',
      nombre: 'Recepción',
      apellido: 'Audi Demo',
      password: hashedPasswordRecep,
      rol: TipoRol.CENTRO_LEADS,
      grupoId: grupoDemostrador.id,
      marcaId: marcaAudi.id,
      agenciaId: audiDemo.id,
      activo: true,
    },
  });

  const mktgAudi = await prisma.user.upsert({
    where: { email: 'mktgaudi@demo.com' },
    update: {},
    create: {
      email: 'mktgaudi@demo.com',
      name: 'Marketing Audi Demo',
      nombre: 'Marketing',
      apellido: 'Audi Demo',
      password: hashedPasswordMktg,
      rol: TipoRol.MARKETING_DIGITAL,
      grupoId: grupoDemostrador.id,
      marcaId: marcaAudi.id,
      agenciaId: audiDemo.id,
      activo: true,
    },
  });

  const teleAudi = await prisma.user.upsert({
    where: { email: 'teleaudi@demo.com' },
    update: {},
    create: {
      email: 'teleaudi@demo.com',
      name: 'Telemarketing Audi Demo',
      nombre: 'Telemarketing',
      apellido: 'Audi Demo',
      password: hashedPasswordTele,
      rol: TipoRol.TELEMARKETING,
      grupoId: grupoDemostrador.id,
      marcaId: marcaAudi.id,
      agenciaId: audiDemo.id,
      activo: true,
    },
  });

  // TOYOTA DEMOSTRADOR (Volumen)
  const gerenteToyota = await prisma.user.upsert({
    where: { email: 'gerentetoyota@demo.com' },
    update: {},
    create: {
      email: 'gerentetoyota@demo.com',
      name: 'Gerente Toyota Demo',
      nombre: 'Gerente',
      apellido: 'Toyota Demo',
      password: hashedPasswordDemo,
      rol: TipoRol.GERENTE_VENTAS,
      grupoId: grupoDemostrador.id,
      marcaId: marcaToyota.id,
      agenciaId: toyotaDemo.id,
      activo: true,
    },
  });

  const vendedorToyota = await prisma.user.upsert({
    where: { email: 'vendedortoyota@demo.com' },
    update: {},
    create: {
      email: 'vendedortoyota@demo.com',
      name: 'Vendedor Toyota Demo',
      nombre: 'Vendedor',
      apellido: 'Toyota Demo',
      password: hashedPasswordVendedor,
      rol: TipoRol.VENDEDOR,
      grupoId: grupoDemostrador.id,
      marcaId: marcaToyota.id,
      agenciaId: toyotaDemo.id,
      activo: true,
    },
  });

  const recepToyota = await prisma.user.upsert({
    where: { email: 'receptoyota@demo.com' },
    update: {},
    create: {
      email: 'receptoyota@demo.com',
      name: 'Recepción Toyota Demo',
      nombre: 'Recepción',
      apellido: 'Toyota Demo',
      password: hashedPasswordRecep,
      rol: TipoRol.CENTRO_LEADS,
      grupoId: grupoDemostrador.id,
      marcaId: marcaToyota.id,
      agenciaId: toyotaDemo.id,
      activo: true,
    },
  });

  const mktgToyota = await prisma.user.upsert({
    where: { email: 'mktgtoyota@demo.com' },
    update: {},
    create: {
      email: 'mktgtoyota@demo.com',
      name: 'Marketing Toyota Demo',
      nombre: 'Marketing',
      apellido: 'Toyota Demo',
      password: hashedPasswordMktg,
      rol: TipoRol.MARKETING_DIGITAL,
      grupoId: grupoDemostrador.id,
      marcaId: marcaToyota.id,
      agenciaId: toyotaDemo.id,
      activo: true,
    },
  });

  const teleToyota = await prisma.user.upsert({
    where: { email: 'teletoyota@demo.com' },
    update: {},
    create: {
      email: 'teletoyota@demo.com',
      name: 'Telemarketing Toyota Demo',
      nombre: 'Telemarketing',
      apellido: 'Toyota Demo',
      password: hashedPasswordTele,
      rol: TipoRol.TELEMARKETING,
      grupoId: grupoDemostrador.id,
      marcaId: marcaToyota.id,
      agenciaId: toyotaDemo.id,
      activo: true,
    },
  });

  // HONDA DEMOSTRADOR (Volumen)
  const gerenteHonda = await prisma.user.upsert({
    where: { email: 'gerentehonda@demo.com' },
    update: {},
    create: {
      email: 'gerentehonda@demo.com',
      name: 'Gerente Honda Demo',
      nombre: 'Gerente',
      apellido: 'Honda Demo',
      password: hashedPasswordDemo,
      rol: TipoRol.GERENTE_VENTAS,
      grupoId: grupoDemostrador.id,
      marcaId: marcaHonda.id,
      agenciaId: hondaDemo.id,
      activo: true,
    },
  });

  const vendedorHonda = await prisma.user.upsert({
    where: { email: 'vendedorhonda@demo.com' },
    update: {},
    create: {
      email: 'vendedorhonda@demo.com',
      name: 'Vendedor Honda Demo',
      nombre: 'Vendedor',
      apellido: 'Honda Demo',
      password: hashedPasswordVendedor,
      rol: TipoRol.VENDEDOR,
      grupoId: grupoDemostrador.id,
      marcaId: marcaHonda.id,
      agenciaId: hondaDemo.id,
      activo: true,
    },
  });

  const recepHonda = await prisma.user.upsert({
    where: { email: 'recephonda@demo.com' },
    update: {},
    create: {
      email: 'recephonda@demo.com',
      name: 'Recepción Honda Demo',
      nombre: 'Recepción',
      apellido: 'Honda Demo',
      password: hashedPasswordRecep,
      rol: TipoRol.CENTRO_LEADS,
      grupoId: grupoDemostrador.id,
      marcaId: marcaHonda.id,
      agenciaId: hondaDemo.id,
      activo: true,
    },
  });

  const mktgHonda = await prisma.user.upsert({
    where: { email: 'mktghonda@demo.com' },
    update: {},
    create: {
      email: 'mktghonda@demo.com',
      name: 'Marketing Honda Demo',
      nombre: 'Marketing',
      apellido: 'Honda Demo',
      password: hashedPasswordMktg,
      rol: TipoRol.MARKETING_DIGITAL,
      grupoId: grupoDemostrador.id,
      marcaId: marcaHonda.id,
      agenciaId: hondaDemo.id,
      activo: true,
    },
  });

  const teleHonda = await prisma.user.upsert({
    where: { email: 'telehonda@demo.com' },
    update: {},
    create: {
      email: 'telehonda@demo.com',
      name: 'Telemarketing Honda Demo',
      nombre: 'Telemarketing',
      apellido: 'Honda Demo',
      password: hashedPasswordTele,
      rol: TipoRol.TELEMARKETING,
      grupoId: grupoDemostrador.id,
      marcaId: marcaHonda.id,
      agenciaId: hondaDemo.id,
      activo: true,
    },
  });

  // VW DEMOSTRADOR (Volumen)
  const gerenteVW = await prisma.user.upsert({
    where: { email: 'gerentevw@demo.com' },
    update: {},
    create: {
      email: 'gerentevw@demo.com',
      name: 'Gerente VW Demo',
      nombre: 'Gerente',
      apellido: 'VW Demo',
      password: hashedPasswordDemo,
      rol: TipoRol.GERENTE_VENTAS,
      grupoId: grupoDemostrador.id,
      marcaId: marcaVW.id,
      agenciaId: vwDemo.id,
      activo: true,
    },
  });

  const vendedorVW = await prisma.user.upsert({
    where: { email: 'vendedorvw@demo.com' },
    update: {},
    create: {
      email: 'vendedorvw@demo.com',
      name: 'Vendedor VW Demo',
      nombre: 'Vendedor',
      apellido: 'VW Demo',
      password: hashedPasswordVendedor,
      rol: TipoRol.VENDEDOR,
      grupoId: grupoDemostrador.id,
      marcaId: marcaVW.id,
      agenciaId: vwDemo.id,
      activo: true,
    },
  });

  const recepVW = await prisma.user.upsert({
    where: { email: 'recepvw@demo.com' },
    update: {},
    create: {
      email: 'recepvw@demo.com',
      name: 'Recepción VW Demo',
      nombre: 'Recepción',
      apellido: 'VW Demo',
      password: hashedPasswordRecep,
      rol: TipoRol.CENTRO_LEADS,
      grupoId: grupoDemostrador.id,
      marcaId: marcaVW.id,
      agenciaId: vwDemo.id,
      activo: true,
    },
  });

  const mktgVW = await prisma.user.upsert({
    where: { email: 'mktgvw@demo.com' },
    update: {},
    create: {
      email: 'mktgvw@demo.com',
      name: 'Marketing VW Demo',
      nombre: 'Marketing',
      apellido: 'VW Demo',
      password: hashedPasswordMktg,
      rol: TipoRol.MARKETING_DIGITAL,
      grupoId: grupoDemostrador.id,
      marcaId: marcaVW.id,
      agenciaId: vwDemo.id,
      activo: true,
    },
  });

  const teleVW = await prisma.user.upsert({
    where: { email: 'televw@demo.com' },
    update: {},
    create: {
      email: 'televw@demo.com',
      name: 'Telemarketing VW Demo',
      nombre: 'Telemarketing',
      apellido: 'VW Demo',
      password: hashedPasswordTele,
      rol: TipoRol.TELEMARKETING,
      grupoId: grupoDemostrador.id,
      marcaId: marcaVW.id,
      agenciaId: vwDemo.id,
      activo: true,
    },
  });

  // NISSAN DEMOSTRADOR (Volumen)
  const gerenteNissan = await prisma.user.upsert({
    where: { email: 'gerentenissan@demo.com' },
    update: {},
    create: {
      email: 'gerentenissan@demo.com',
      name: 'Gerente Nissan Demo',
      nombre: 'Gerente',
      apellido: 'Nissan Demo',
      password: hashedPasswordDemo,
      rol: TipoRol.GERENTE_VENTAS,
      grupoId: grupoDemostrador.id,
      marcaId: marcaNissan.id,
      agenciaId: nissanDemo.id,
      activo: true,
    },
  });

  const vendedorNissan = await prisma.user.upsert({
    where: { email: 'vendedornissan@demo.com' },
    update: {},
    create: {
      email: 'vendedornissan@demo.com',
      name: 'Vendedor Nissan Demo',
      nombre: 'Vendedor',
      apellido: 'Nissan Demo',
      password: hashedPasswordVendedor,
      rol: TipoRol.VENDEDOR,
      grupoId: grupoDemostrador.id,
      marcaId: marcaNissan.id,
      agenciaId: nissanDemo.id,
      activo: true,
    },
  });

  const recepNissan = await prisma.user.upsert({
    where: { email: 'recepnissan@demo.com' },
    update: {},
    create: {
      email: 'recepnissan@demo.com',
      name: 'Recepción Nissan Demo',
      nombre: 'Recepción',
      apellido: 'Nissan Demo',
      password: hashedPasswordRecep,
      rol: TipoRol.CENTRO_LEADS,
      grupoId: grupoDemostrador.id,
      marcaId: marcaNissan.id,
      agenciaId: nissanDemo.id,
      activo: true,
    },
  });

  const mktgNissan = await prisma.user.upsert({
    where: { email: 'mktgnissan@demo.com' },
    update: {},
    create: {
      email: 'mktgnissan@demo.com',
      name: 'Marketing Nissan Demo',
      nombre: 'Marketing',
      apellido: 'Nissan Demo',
      password: hashedPasswordMktg,
      rol: TipoRol.MARKETING_DIGITAL,
      grupoId: grupoDemostrador.id,
      marcaId: marcaNissan.id,
      agenciaId: nissanDemo.id,
      activo: true,
    },
  });

  const teleNissan = await prisma.user.upsert({
    where: { email: 'telenissan@demo.com' },
    update: {},
    create: {
      email: 'telenissan@demo.com',
      name: 'Telemarketing Nissan Demo',
      nombre: 'Telemarketing',
      apellido: 'Nissan Demo',
      password: hashedPasswordTele,
      rol: TipoRol.TELEMARKETING,
      grupoId: grupoDemostrador.id,
      marcaId: marcaNissan.id,
      agenciaId: nissanDemo.id,
      activo: true,
    },
  });

  // MAZDA DEMOSTRADOR (Volumen)
  const gerenteMazda = await prisma.user.upsert({
    where: { email: 'gerentemazda@demo.com' },
    update: {},
    create: {
      email: 'gerentemazda@demo.com',
      name: 'Gerente Mazda Demo',
      nombre: 'Gerente',
      apellido: 'Mazda Demo',
      password: hashedPasswordDemo,
      rol: TipoRol.GERENTE_VENTAS,
      grupoId: grupoDemostrador.id,
      marcaId: marcaMazda.id,
      agenciaId: mazdaDemo.id,
      activo: true,
    },
  });

  const vendedorMazda = await prisma.user.upsert({
    where: { email: 'vendedormazda@demo.com' },
    update: {},
    create: {
      email: 'vendedormazda@demo.com',
      name: 'Vendedor Mazda Demo',
      nombre: 'Vendedor',
      apellido: 'Mazda Demo',
      password: hashedPasswordVendedor,
      rol: TipoRol.VENDEDOR,
      grupoId: grupoDemostrador.id,
      marcaId: marcaMazda.id,
      agenciaId: mazdaDemo.id,
      activo: true,
    },
  });

  const recepMazda = await prisma.user.upsert({
    where: { email: 'recepmazda@demo.com' },
    update: {},
    create: {
      email: 'recepmazda@demo.com',
      name: 'Recepción Mazda Demo',
      nombre: 'Recepción',
      apellido: 'Mazda Demo',
      password: hashedPasswordRecep,
      rol: TipoRol.CENTRO_LEADS,
      grupoId: grupoDemostrador.id,
      marcaId: marcaMazda.id,
      agenciaId: mazdaDemo.id,
      activo: true,
    },
  });

  const mktgMazda = await prisma.user.upsert({
    where: { email: 'mktgmazda@demo.com' },
    update: {},
    create: {
      email: 'mktgmazda@demo.com',
      name: 'Marketing Mazda Demo',
      nombre: 'Marketing',
      apellido: 'Mazda Demo',
      password: hashedPasswordMktg,
      rol: TipoRol.MARKETING_DIGITAL,
      grupoId: grupoDemostrador.id,
      marcaId: marcaMazda.id,
      agenciaId: mazdaDemo.id,
      activo: true,
    },
  });

  const teleMazda = await prisma.user.upsert({
    where: { email: 'telemazda@demo.com' },
    update: {},
    create: {
      email: 'telemazda@demo.com',
      name: 'Telemarketing Mazda Demo',
      nombre: 'Telemarketing',
      apellido: 'Mazda Demo',
      password: hashedPasswordTele,
      rol: TipoRol.TELEMARKETING,
      grupoId: grupoDemostrador.id,
      marcaId: marcaMazda.id,
      agenciaId: mazdaDemo.id,
      activo: true,
    },
  });

  // BMW DEMOSTRADOR (Premium)
  const gerenteBMW = await prisma.user.upsert({
    where: { email: 'gerentebmw@demo.com' },
    update: {},
    create: {
      email: 'gerentebmw@demo.com',
      name: 'Gerente BMW Demo',
      nombre: 'Gerente',
      apellido: 'BMW Demo',
      password: hashedPasswordDemo,
      rol: TipoRol.GERENTE_VENTAS,
      grupoId: grupoDemostrador.id,
      marcaId: marcaBMW.id,
      agenciaId: bmwDemo.id,
      activo: true,
    },
  });

  const vendedorBMW = await prisma.user.upsert({
    where: { email: 'vendedorbmw@demo.com' },
    update: {},
    create: {
      email: 'vendedorbmw@demo.com',
      name: 'Vendedor BMW Demo',
      nombre: 'Vendedor',
      apellido: 'BMW Demo',
      password: hashedPasswordVendedor,
      rol: TipoRol.VENDEDOR,
      grupoId: grupoDemostrador.id,
      marcaId: marcaBMW.id,
      agenciaId: bmwDemo.id,
      activo: true,
    },
  });

  const recepBMW = await prisma.user.upsert({
    where: { email: 'recepbmw@demo.com' },
    update: {},
    create: {
      email: 'recepbmw@demo.com',
      name: 'Recepción BMW Demo',
      nombre: 'Recepción',
      apellido: 'BMW Demo',
      password: hashedPasswordRecep,
      rol: TipoRol.CENTRO_LEADS,
      grupoId: grupoDemostrador.id,
      marcaId: marcaBMW.id,
      agenciaId: bmwDemo.id,
      activo: true,
    },
  });

  const mktgBMW = await prisma.user.upsert({
    where: { email: 'mktgbmw@demo.com' },
    update: {},
    create: {
      email: 'mktgbmw@demo.com',
      name: 'Marketing BMW Demo',
      nombre: 'Marketing',
      apellido: 'BMW Demo',
      password: hashedPasswordMktg,
      rol: TipoRol.MARKETING_DIGITAL,
      grupoId: grupoDemostrador.id,
      marcaId: marcaBMW.id,
      agenciaId: bmwDemo.id,
      activo: true,
    },
  });

  const teleBMW = await prisma.user.upsert({
    where: { email: 'telebmw@demo.com' },
    update: {},
    create: {
      email: 'telebmw@demo.com',
      name: 'Telemarketing BMW Demo',
      nombre: 'Telemarketing',
      apellido: 'BMW Demo',
      password: hashedPasswordTele,
      rol: TipoRol.TELEMARKETING,
      grupoId: grupoDemostrador.id,
      marcaId: marcaBMW.id,
      agenciaId: bmwDemo.id,
      activo: true,
    },
  });

  // ================== ADDITIONAL SALESPEOPLE ==================
  console.log('🚗 Creating Additional Salespeople...');

  // Premium brands (Audi, BMW) - 10 additional each
  for (let i = 1; i <= 10; i++) {
    await prisma.user.upsert({
      where: { email: `vendedor${i}audi@demo.com` },
      update: {},
      create: {
        email: `vendedor${i}audi@demo.com`,
        name: `Vendedor ${i} Audi`,
        nombre: `Vendedor ${i}`,
        apellido: 'Audi',
        password: hashedPasswordVendedor,
        rol: TipoRol.VENDEDOR,
        grupoId: grupoDemostrador.id,
        marcaId: marcaAudi.id,
        agenciaId: audiDemo.id,
        activo: true,
      },
    });

    await prisma.user.upsert({
      where: { email: `vendedor${i}bmw@demo.com` },
      update: {},
      create: {
        email: `vendedor${i}bmw@demo.com`,
        name: `Vendedor ${i} BMW`,
        nombre: `Vendedor ${i}`,
        apellido: 'BMW',
        password: hashedPasswordVendedor,
        rol: TipoRol.VENDEDOR,
        grupoId: grupoDemostrador.id,
        marcaId: marcaBMW.id,
        agenciaId: bmwDemo.id,
        activo: true,
      },
    });
  }

  // Volume brands (Toyota, Honda, VW, Nissan, Mazda) - 15 additional each
  const volumeBrands = [
    { marca: marcaToyota, agencia: toyotaDemo, nombre: 'toyota' },
    { marca: marcaHonda, agencia: hondaDemo, nombre: 'honda' },
    { marca: marcaVW, agencia: vwDemo, nombre: 'vw' },
    { marca: marcaNissan, agencia: nissanDemo, nombre: 'nissan' },
    { marca: marcaMazda, agencia: mazdaDemo, nombre: 'mazda' },
  ];

  for (const brand of volumeBrands) {
    for (let i = 1; i <= 15; i++) {
      await prisma.user.upsert({
        where: { email: `vendedor${i}${brand.nombre}@demo.com` },
        update: {},
        create: {
          email: `vendedor${i}${brand.nombre}@demo.com`,
          name: `Vendedor ${i} ${brand.nombre.toUpperCase()}`,
          nombre: `Vendedor ${i}`,
          apellido: brand.nombre.toUpperCase(),
          password: hashedPasswordVendedor,
          rol: TipoRol.VENDEDOR,
          grupoId: grupoDemostrador.id,
          marcaId: brand.marca.id,
          agenciaId: brand.agencia.id,
          activo: true,
        },
      });
    }
  }

  // ================== COMPREHENSIVE VEHICLE CATALOG ==================
  console.log('🚗 Creating Comprehensive Vehicle Catalog with Realistic Pricing...');

  const vehiculosCatalogo = [
    // ================== AUDI (PREMIUM) ==================
    { marca: "Audi", modelo: "A1 Sportback", year: 2024 },
    { marca: "Audi", modelo: "A3 Sportback", year: 2024 },
    { marca: "Audi", modelo: "A3 Sedan", year: 2024 },
    { marca: "Audi", modelo: "A4 Sedan", year: 2024 },
    { marca: "Audi", modelo: "A4 Avant", year: 2024 },
    { marca: "Audi", modelo: "A6 Sedan", year: 2024 },
    { marca: "Audi", modelo: "A6 Avant", year: 2024 },
    { marca: "Audi", modelo: "A7 Sportback", year: 2024 },
    { marca: "Audi", modelo: "A8 L", year: 2024 },
    { marca: "Audi", modelo: "Q2", year: 2024 },
    { marca: "Audi", modelo: "Q3", year: 2024 },
    { marca: "Audi", modelo: "Q3 Sportback", year: 2024 },
    { marca: "Audi", modelo: "Q5", year: 2024 },
    { marca: "Audi", modelo: "Q5 Sportback", year: 2024 },
    { marca: "Audi", modelo: "Q7", year: 2024 },
    { marca: "Audi", modelo: "Q8", year: 2024 },
    { marca: "Audi", modelo: "e-tron GT", year: 2024 },
    { marca: "Audi", modelo: "Q4 e-tron", year: 2024 },

    // ================== BMW (PREMIUM) ==================
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
    { marca: "BMW", modelo: "X2", year: 2024 },
    { marca: "BMW", modelo: "X3", year: 2024 },
    { marca: "BMW", modelo: "X4", year: 2024 },
    { marca: "BMW", modelo: "X5", year: 2024 },
    { marca: "BMW", modelo: "X6", year: 2024 },
    { marca: "BMW", modelo: "X7", year: 2024 },
    { marca: "BMW", modelo: "iX", year: 2024 },
    { marca: "BMW", modelo: "i4", year: 2024 },

    // ================== TOYOTA (VOLUMEN) ==================
    { marca: "Toyota", modelo: "Yaris", year: 2024 },
    { marca: "Toyota", modelo: "Yaris Cross", year: 2024 },
    { marca: "Toyota", modelo: "Corolla", year: 2024 },
    { marca: "Toyota", modelo: "Corolla Cross", year: 2024 },
    { marca: "Toyota", modelo: "Camry", year: 2024 },
    { marca: "Toyota", modelo: "Avalon", year: 2024 },
    { marca: "Toyota", modelo: "C-HR", year: 2024 },
    { marca: "Toyota", modelo: "RAV4", year: 2024 },
    { marca: "Toyota", modelo: "Highlander", year: 2024 },
    { marca: "Toyota", modelo: "4Runner", year: 2024 },
    { marca: "Toyota", modelo: "Sequoia", year: 2024 },
    { marca: "Toyota", modelo: "Land Cruiser", year: 2024 },
    { marca: "Toyota", modelo: "Prius", year: 2024 },
    { marca: "Toyota", modelo: "Prius Prime", year: 2024 },
    { marca: "Toyota", modelo: "Sienna", year: 2024 },

    // ================== HONDA (VOLUMEN) ==================
    { marca: "Honda", modelo: "City", year: 2024 },
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

    // ================== VOLKSWAGEN (VOLUMEN) ==================
    { marca: "Volkswagen", modelo: "Polo", year: 2024 },
    { marca: "Volkswagen", modelo: "Vento", year: 2024 },
    { marca: "Volkswagen", modelo: "Jetta", year: 2024 },
    { marca: "Volkswagen", modelo: "Jetta GLI", year: 2024 },
    { marca: "Volkswagen", modelo: "Golf", year: 2024 },
    { marca: "Volkswagen", modelo: "Golf GTI", year: 2024 },
    { marca: "Volkswagen", modelo: "Passat", year: 2024 },
    { marca: "Volkswagen", modelo: "Tiguan", year: 2024 },
    { marca: "Volkswagen", modelo: "Touareg", year: 2024 },
    { marca: "Volkswagen", modelo: "Atlas", year: 2024 },
    { marca: "Volkswagen", modelo: "ID.4", year: 2024 },

    // ================== NISSAN (VOLUMEN) ==================
    { marca: "Nissan", modelo: "Versa", year: 2024 },
    { marca: "Nissan", modelo: "Sentra", year: 2024 },
    { marca: "Nissan", modelo: "Altima", year: 2024 },
    { marca: "Nissan", modelo: "Maxima", year: 2024 },
    { marca: "Nissan", modelo: "Kicks", year: 2024 },
    { marca: "Nissan", modelo: "Rogue", year: 2024 },
    { marca: "Nissan", modelo: "X-Trail", year: 2024 },
    { marca: "Nissan", modelo: "Murano", year: 2024 },
    { marca: "Nissan", modelo: "Pathfinder", year: 2024 },
    { marca: "Nissan", modelo: "Armada", year: 2024 },
    { marca: "Nissan", modelo: "Leaf", year: 2024 },

    // ================== MAZDA (VOLUMEN) ==================
    { marca: "Mazda", modelo: "Mazda2", year: 2024 },
    { marca: "Mazda", modelo: "Mazda3 Sedan", year: 2024 },
    { marca: "Mazda", modelo: "Mazda3 Hatchback", year: 2024 },
    { marca: "Mazda", modelo: "Mazda6", year: 2024 },
    { marca: "Mazda", modelo: "MX-5 Miata", year: 2024 },
    { marca: "Mazda", modelo: "CX-3", year: 2024 },
    { marca: "Mazda", modelo: "CX-30", year: 2024 },
    { marca: "Mazda", modelo: "CX-5", year: 2024 },
    { marca: "Mazda", modelo: "CX-9", year: 2024 },
    { marca: "Mazda", modelo: "CX-50", year: 2024 },
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

  // ================== INVENTORY VEHICLES WITH REALISTIC PRICING ==================
  console.log('💰 Creating Inventory with Realistic Pricing...');

  const vehiculosInventario = [
    // ================== AUDI INVENTORY (PREMIUM) ==================
    {
      agenciaId: audiDemo.id,
      marca: "Audi",
      modelo: "A3 Sedan",
      year: 2024,
      version: "35 TFSI",
      precio: 650000.00,
      color: "Negro Fantasma",
      kilometraje: 0,
      numeroSerie: "WA1ENAF40PA001001",
    },
    {
      agenciaId: audiDemo.id,
      marca: "Audi",
      modelo: "A4",
      year: 2024,
      version: "40 TFSI quattro",
      precio: 750000.00,
      color: "Blanco Glaciar",
      kilometraje: 0,
      numeroSerie: "WAUENAF40PA001002",
    },
    {
      agenciaId: audiDemo.id,
      marca: "Audi",
      modelo: "Q3",
      year: 2024,
      version: "40 TFSI quattro",
      precio: 680000.00,
      color: "Azul Navarra",
      kilometraje: 0,
      numeroSerie: "WA1ANACF6PA001003",
    },
    {
      agenciaId: audiDemo.id,
      marca: "Audi",
      modelo: "Q5",
      year: 2024,
      version: "40 TFSI quattro",
      precio: 850000.00,
      color: "Gris Nardo",
      kilometraje: 0,
      numeroSerie: "WA1ANAFY6P2001004",
    },
    {
      agenciaId: audiDemo.id,
      marca: "Audi",
      modelo: "Q7",
      year: 2024,
      version: "55 TFSI quattro",
      precio: 1200000.00,
      color: "Rojo Tango",
      kilometraje: 0,
      numeroSerie: "WA1LAAF76PA001005",
    },

    // ================== BMW INVENTORY (PREMIUM) ==================
    {
      agenciaId: bmwDemo.id,
      marca: "BMW",
      modelo: "Serie 1",
      year: 2024,
      version: "118i",
      precio: 620000.00,
      color: "Blanco Alpine",
      kilometraje: 0,
      numeroSerie: "WBA8A5G50LNA01001",
    },
    {
      agenciaId: bmwDemo.id,
      marca: "BMW",
      modelo: "Serie 3",
      year: 2024,
      version: "330i",
      precio: 780000.00,
      color: "Azul Mineral",
      kilometraje: 0,
      numeroSerie: "WBA5A1050LNP01002",
    },
    {
      agenciaId: bmwDemo.id,
      marca: "BMW",
      modelo: "X1",
      year: 2024,
      version: "sDrive20i",
      precio: 650000.00,
      color: "Negro Zafiro",
      kilometraje: 0,
      numeroSerie: "WBXHT9C50LP001003",
    },
    {
      agenciaId: bmwDemo.id,
      marca: "BMW",
      modelo: "X3",
      year: 2024,
      version: "xDrive30i",
      precio: 880000.00,
      color: "Gris Mineral",
      kilometraje: 0,
      numeroSerie: "5UXTY3C08L9A01004",
    },
    {
      agenciaId: bmwDemo.id,
      marca: "BMW",
      modelo: "X5",
      year: 2024,
      version: "xDrive40i",
      precio: 1100000.00,
      color: "Blanco Alpine",
      kilometraje: 0,
      numeroSerie: "5UXTY5C03L9A01005",
    },

    // ================== TOYOTA INVENTORY (VOLUMEN) ==================
    {
      agenciaId: toyotaDemo.id,
      marca: "Toyota",
      modelo: "Corolla",
      year: 2024,
      version: "LE",
      precio: 380000.00,
      color: "Blanco Perla",
      kilometraje: 0,
      numeroSerie: "2T1BURHE0PC001001",
    },
    {
      agenciaId: toyotaDemo.id,
      marca: "Toyota",
      modelo: "Camry",
      year: 2024,
      version: "LE",
      precio: 520000.00,
      color: "Gris Celestial",
      kilometraje: 0,
      numeroSerie: "4T1G11AK8PU001002",
    },
    {
      agenciaId: toyotaDemo.id,
      marca: "Toyota",
      modelo: "RAV4",
      year: 2024,
      version: "LE",
      precio: 480000.00,
      color: "Azul Lunar",
      kilometraje: 0,
      numeroSerie: "2T3F1RFV8PW001003",
    },

    // ================== HONDA INVENTORY (VOLUMEN) ==================
    {
      agenciaId: hondaDemo.id,
      marca: "Honda",
      modelo: "Civic",
      year: 2024,
      version: "EX",
      precio: 420000.00,
      color: "Blanco Platino",
      kilometraje: 0,
      numeroSerie: "19XFL1H33PE001001",
    },
    {
      agenciaId: hondaDemo.id,
      marca: "Honda",
      modelo: "CR-V",
      year: 2024,
      version: "EX",
      precio: 580000.00,
      color: "Negro Cristal",
      kilometraje: 0,
      numeroSerie: "7FARW2H8XPE001002",
    },

    // ================== VW INVENTORY (VOLUMEN) ==================
    {
      agenciaId: vwDemo.id,
      marca: "Volkswagen",
      modelo: "Jetta",
      year: 2024,
      version: "Comfortline",
      precio: 410000.00,
      color: "Gris Urano",
      kilometraje: 0,
      numeroSerie: "3VWC57BU0PM001001",
    },
    {
      agenciaId: vwDemo.id,
      marca: "Volkswagen",
      modelo: "Tiguan",
      year: 2024,
      version: "Trendline",
      precio: 550000.00,
      color: "Blanco Puro",
      kilometraje: 0,
      numeroSerie: "WVGBV7AX3PW001002",
    },

    // ================== NISSAN INVENTORY (VOLUMEN) ==================
    {
      agenciaId: nissanDemo.id,
      marca: "Nissan",
      modelo: "Sentra",
      year: 2024,
      version: "Sense",
      precio: 350000.00,
      color: "Rojo Energía",
      kilometraje: 0,
      numeroSerie: "3N1AB8CV4PY001001",
    },
    {
      agenciaId: nissanDemo.id,
      marca: "Nissan",
      modelo: "X-Trail",
      year: 2024,
      version: "Sense",
      precio: 510000.00,
      color: "Negro Magnético",
      kilometraje: 0,
      numeroSerie: "5N1DR3MM4PC001002",
    },

    // ================== MAZDA INVENTORY (VOLUMEN) ==================
    {
      agenciaId: mazdaDemo.id,
      marca: "Mazda",
      modelo: "Mazda3",
      year: 2024,
      version: "i Sport",
      precio: 390000.00,
      color: "Rojo Alma",
      kilometraje: 0,
      numeroSerie: "3MZBPBCL0PM001001",
    },
    {
      agenciaId: mazdaDemo.id,
      marca: "Mazda",
      modelo: "CX-5",
      year: 2024,
      version: "i Sport",
      precio: 490000.00,
      color: "Azul Eterno",
      kilometraje: 0,
      numeroSerie: "JM3KFBCM1P0001002",
    },
  ];

  for (const vehiculo of vehiculosInventario) {
    await prisma.vehiculo.upsert({
      where: { numeroSerie: vehiculo.numeroSerie },
      update: {},
      create: vehiculo,
    });
  }

  // ================== COMPREHENSIVE DEMO DATA ==================
  console.log('📊 Creating Comprehensive Demo Data...');

  // Sample metrics for each agency
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  const agenciasDemo = [audiDemo, bmwDemo, toyotaDemo, hondaDemo, vwDemo, nissanDemo, mazdaDemo];

  for (const agencia of agenciasDemo) {
    await prisma.metricaVenta.upsert({
      where: {
        agenciaId_mes_year: {
          agenciaId: agencia.id,
          mes: currentMonth,
          year: currentYear,
        },
      },
      update: {},
      create: {
        agenciaId: agencia.id,
        mes: currentMonth,
        year: currentYear,
        ventasRealizadas: Math.floor(Math.random() * 15) + 8,
        metaVentas: Math.floor(Math.random() * 10) + 15,
        prospectosProcesados: Math.floor(Math.random() * 50) + 100,
        tasaConversion: Number((Math.random() * 5 + 5).toFixed(2)),
        utilidadPromedio: Number((Math.random() * 50000 + 100000).toFixed(2)),
        vendedoresActivos: Math.floor(Math.random() * 5) + 3,
        optimizacionesProcesadas: Math.floor(Math.random() * 30) + 50,
      },
    });
  }

  // ================== COMPREHENSIVE PROSPECT DATA ==================
  console.log('👥 Creating Comprehensive Prospect Data...');

  const nombresMexicanos = [
    "Fernando", "María", "José", "Ana", "Roberto", "Carmen", "Miguel", "Patricia", "Carlos", "Isabel",
    "Luis", "Rosa", "Francisco", "Teresa", "Alejandro", "Leticia", "Manuel", "Gloria", "Raúl", "Esperanza",
    "Alberto", "Dolores", "Sergio", "Luz", "Jorge", "Alma", "Rafael", "Silvia", "Arturo", "Blanca",
    "Enrique", "Norma", "Ricardo", "Francisca", "Víctor", "Adriana", "Armando", "Guadalupe", "Pedro", "Elena",
    "Juan", "Verónica", "Daniel", "Mónica", "Eduardo", "Rocío", "Mario", "Martha", "Guillermo", "Yolanda"
  ];

  const apellidosMexicanos = [
    "García", "Rodríguez", "Martínez", "López", "González", "Hernández", "Pérez", "Sánchez", "Ramírez", "Cruz",
    "Flores", "Gómez", "Díaz", "Morales", "Jiménez", "Álvarez", "Romero", "Herrera", "Vargas", "Castillo",
    "Ruiz", "Ortiz", "Mendoza", "Silva", "Castro", "Torres", "Delgado", "Ramos", "Guerrero", "Medina",
    "Aguilar", "Moreno", "Gutiérrez", "Contreras", "Vázquez", "Reyes", "Santana", "Espinoza", "Cervantes", "Lara"
  ];

  const vehiculosInteres = [
    "Audi A3 Sedan", "Audi A4", "Audi Q3", "Audi Q5", "Audi Q7",
    "BMW Serie 1", "BMW Serie 3", "BMW X1", "BMW X3", "BMW X5",
    "Toyota Corolla", "Toyota Camry", "Toyota RAV4", "Toyota Highlander",
    "Honda Civic", "Honda Accord", "Honda CR-V", "Honda HR-V",
    "Volkswagen Jetta", "Volkswagen Tiguan", "Volkswagen Golf",
    "Nissan Sentra", "Nissan Altima", "Nissan X-Trail", "Nissan Kicks",
    "Mazda3", "Mazda6", "Mazda CX-5", "Mazda CX-30"
  ];

  const estatusOptions = ["Nuevo", "Contactado", "Calificado", "En Proceso", "Perdido"];
  const clasificacionOptions = ["Elite", "Calificado", "A Madurar", "Explorador"];

  // Create 50 prospects per agency (350 total)
  for (const agencia of agenciasDemo) {
    // Get vendors from this agency
    const vendedores = await prisma.user.findMany({
      where: { 
        agenciaId: agencia.id,
        rol: TipoRol.VENDEDOR,
      }
    });

    for (let i = 1; i <= 50; i++) {
      const randomNombre = nombresMexicanos[Math.floor(Math.random() * nombresMexicanos.length)];
      const randomApellido = apellidosMexicanos[Math.floor(Math.random() * apellidosMexicanos.length)];
      const randomVendedor = vendedores[Math.floor(Math.random() * vendedores.length)];
      const randomVehiculo = vehiculosInteres[Math.floor(Math.random() * vehiculosInteres.length)];
      const randomEstatus = estatusOptions[Math.floor(Math.random() * estatusOptions.length)];
      const randomClasificacion = clasificacionOptions[Math.floor(Math.random() * clasificacionOptions.length)];
      
      const calificacionTotal = randomClasificacion === "Elite" ? Math.random() * 15 + 85 :
                               randomClasificacion === "Calificado" ? Math.random() * 25 + 60 :
                               randomClasificacion === "A Madurar" ? Math.random() * 25 + 35 :
                               Math.random() * 35;

      const presupuestoBase = agencia.tierServicio === "PREMIUM" ? 600000 : 350000;
      const presupuesto = presupuestoBase + (Math.random() * presupuestoBase * 0.8);

      await prisma.prospecto.create({
        data: {
          nombre: randomNombre,
          apellido: randomApellido,
          email: `${randomNombre.toLowerCase()}.${randomApellido.toLowerCase()}${i}@email.com`,
          telefono: `+52 55 ${Math.floor(Math.random() * 9000) + 1000}-${Math.floor(Math.random() * 9000) + 1000}`,
          vendedorId: randomVendedor?.id,
          agenciaId: agencia.id,
          estatus: randomEstatus,
          calificacionTotal: Number(calificacionTotal.toFixed(2)),
          clasificacion: randomClasificacion,
          vehiculoInteres: randomVehiculo,
          presupuesto: Number(presupuesto.toFixed(2)),
          proximaSeguimiento: new Date(Date.now() + (Math.random() * 30) * 24 * 60 * 60 * 1000),
          notas: `Prospecto demo generado para ${agencia.nombreAgencia}`,
          fechaContacto: new Date(Date.now() - (Math.random() * 60) * 24 * 60 * 60 * 1000),
        },
      });
    }
  }

  // ================== COACHING SESSIONS DATA ==================
  console.log('🎯 Creating Coaching Sessions Data...');

  const tiposCoaching = ["conversion", "seguimiento", "cierre", "presentacion", "objeciones"];
  const problemas = [
    "Dificultad para cerrar ventas",
    "Falta seguimiento prospectos",
    "Presentaciones poco convincentes",
    "Manejo inadecuado de objeciones",
    "Falta técnicas de conversión"
  ];

  for (const agencia of agenciasDemo) {
    const gerente = await prisma.user.findFirst({
      where: {
        agenciaId: agencia.id,
        rol: TipoRol.GERENTE_VENTAS,
      },
    });

    const vendedores = await prisma.user.findMany({
      where: {
        agenciaId: agencia.id,
        rol: TipoRol.VENDEDOR,
      },
      take: 5,
    });

    if (gerente && vendedores.length > 0) {
      for (const vendedor of vendedores) {
        await prisma.sesionCoaching.create({
          data: {
            vendedorId: vendedor.id,
            gerenteId: gerente.id,
            tipoCoaching: tiposCoaching[Math.floor(Math.random() * tiposCoaching.length)],
            problemasIdentificados: JSON.stringify([
              problemas[Math.floor(Math.random() * problemas.length)]
            ]),
            planMejora: "Plan personalizado de desarrollo según necesidades identificadas",
            fechaSesion: new Date(Date.now() + (Math.random() * 7) * 24 * 60 * 60 * 1000),
            duracion: Math.floor(Math.random() * 60) + 30,
            completado: Math.random() > 0.5,
          },
        });
      }
    }
  }

  // ================== CONFIGURATION SETTINGS ==================
  console.log('⚙️ Creating Configuration Settings...');

  const configuraciones = [
    {
      clave: "empresa_nombre",
      valor: "DynamicFin Optimization Suite - Demo",
      descripcion: "Nombre de la empresa/plataforma demo",
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
    {
      clave: "demo_mode",
      valor: "true",
      tipo: "boolean",
      descripcion: "Indica si el sistema está en modo demostración",
    },
    {
      clave: "transcripcion_provider",
      valor: "openai-whisper",
      descripcion: "Proveedor de transcripción configurado para demo",
    },
    {
      clave: "analisis_provider",
      valor: "gpt-3.5-turbo",
      descripcion: "Modelo de IA configurado para análisis SPCC demo",
    },
    {
      clave: "costo_maximo_demo",
      valor: "5.00",
      tipo: "number",
      descripcion: "Costo máximo mensual USD para modo demo",
    },
  ];

  for (const config of configuraciones) {
    await prisma.configuracion.upsert({
      where: { clave: config.clave },
      update: {},
      create: config,
    });
  }

  console.log('✅ Comprehensive DEMO database seeding completed successfully!');
  console.log(`
📊 COMPLETE DEMO SEEDED:
   ==================== INFRASTRUCTURE ====================
   - ${pilares.length} SPPC Pillars ✅
   - 1 Demo Automotive Group ✅
   - 7 Brands (Audi, Toyota, Honda, VW, Nissan, Mazda, BMW) ✅
   - 7 Demo Agencies ✅

   ==================== USERS ====================
   - 2 Super Administrators ✅
   - 1 Test User (hidden) ✅
   - 35 Demo Users (5 per agency) ✅
   - ${10 + 10 + 15 + 15 + 15 + 15 + 15} Additional Salespeople ✅
   - TOTAL USERS: ${39 + 95} ✅

   ==================== VEHICLE DATA ====================
   - ${vehiculosCatalogo.length} Vehicle Catalog Entries ✅
   - ${vehiculosInventario.length} Inventory Vehicles with Realistic Pricing ✅

   ==================== BUSINESS DATA ====================
   - ${agenciasDemo.length} Monthly Metrics ✅
   - ${agenciasDemo.length * 50} Demo Prospects ✅
   - Coaching Sessions ✅
   - ${configuraciones.length} Configuration Settings ✅

   ==================== READY FOR DEMO ====================
   🎯 Login Credentials Ready:
   - directores@dynamicfin.mx / PrivXejc#6
   - admin@dynamicfin.mx / Rada#94
   - All demo emails / respective passwords

   🚀 System fully populated and ready for demos!
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
