
/**
 * Script para poblar la base de datos con datos semilla
 * PROBLEMA RESUELTO: Conectar funcionalidades simuladas con BD real
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Los 15 Pilares SPPC para ventas automotrices
const PILARES_SPCC = [
  {
    nombrePilar: "Saludo y Primera Impresión",
    descripcion: "Crear una conexión inicial positiva y profesional con el cliente",
    pesoEstrategico: 0.08, // 8%
    faseEvaluacion: 1
  },
  {
    nombrePilar: "Prospección Efectiva",
    descripcion: "Identificar y calificar clientes potenciales de manera efectiva",
    pesoEstrategico: 0.07, // 7%
    faseEvaluacion: 1
  },
  {
    nombrePilar: "Construcción de Rapport",
    descripcion: "Establecer confianza y conexión emocional con el cliente",
    pesoEstrategico: 0.09, // 9%
    faseEvaluacion: 1
  },
  {
    nombrePilar: "Consulta de Necesidades",
    descripcion: "Descubrir necesidades reales y específicas del cliente",
    pesoEstrategico: 0.10, // 10%
    faseEvaluacion: 2
  },
  {
    nombrePilar: "Presentación del Producto",
    descripcion: "Mostrar características y beneficios relevantes del vehículo",
    pesoEstrategico: 0.08, // 8%
    faseEvaluacion: 2
  },
  {
    nombrePilar: "Demostración Práctica",
    descripcion: "Prueba de manejo y experiencia directa del vehículo",
    pesoEstrategico: 0.09, // 9%
    faseEvaluacion: 2
  },
  {
    nombrePilar: "Manejo de Objeciones",
    descripcion: "Resolver dudas y preocupaciones del cliente de manera efectiva",
    pesoEstrategico: 0.10, // 10%
    faseEvaluacion: 2
  },
  {
    nombrePilar: "Creación de Urgencia",
    descripcion: "Motivar la decisión de compra de manera ética y efectiva",
    pesoEstrategico: 0.07, // 7%
    faseEvaluacion: 3
  },
  {
    nombrePilar: "Negociación de Precio",
    descripcion: "Llegar a acuerdos beneficiosos para ambas partes",
    pesoEstrategico: 0.09, // 9%
    faseEvaluacion: 3
  },
  {
    nombrePilar: "Cierre de Venta",
    descripcion: "Finalizar la transacción de manera exitosa",
    pesoEstrategico: 0.10, // 10%
    faseEvaluacion: 3
  },
  {
    nombrePilar: "Seguimiento Post-Venta",
    descripcion: "Mantener relación después de la compra para fidelización",
    pesoEstrategico: 0.05, // 5%
    faseEvaluacion: 3
  },
  {
    nombrePilar: "Upselling y Cross-selling",
    descripcion: "Vender productos adicionales y complementarios",
    pesoEstrategico: 0.06, // 6%
    faseEvaluacion: 3
  },
  {
    nombrePilar: "Manejo de Situaciones Difíciles",
    descripcion: "Resolver conflictos y situaciones complejas con clientes",
    pesoEstrategico: 0.06, // 6%
    faseEvaluacion: 2
  },
  {
    nombrePilar: "Construcción de Lealtad",
    descripcion: "Crear clientes recurrentes y generar referencias",
    pesoEstrategico: 0.04, // 4%
    faseEvaluacion: 3
  },
  {
    nombrePilar: "Cierre Consultivo",
    descripcion: "Asesorar integralmente al cliente en la decisión de compra",
    pesoEstrategico: 0.02, // 2%
    faseEvaluacion: 3
  }
];

// Escenarios de RolePlay básicos
const ESCENARIOS_ROLEPLAY = [
  {
    titulo: "Cliente Primerizo Interesado en Sedán",
    descripcion: "Un cliente joven busca su primer auto, está interesado en un sedán compacto pero tiene dudas sobre financiamiento",
    categoria: "Prospección Inicial",
    nivelDificultad: "basico",
    tipoCliente: "Comprador Primerizo",
    vehiculoInteres: "Sedán Compacto",
    presupuestoCliente: 250000,
    duracionEstimada: 15,
    personalidadCliente: JSON.stringify({
      tipo: "analítico",
      preocupaciones: ["precio", "confiabilidad", "financiamiento"],
      motivadores: ["economía", "seguridad", "garantía"]
    }),
    objetivosAprendizaje: JSON.stringify([
      "Establecer rapport inicial",
      "Identificar necesidades básicas",
      "Explicar opciones de financiamiento"
    ]),
    objecionesComunes: JSON.stringify([
      "Es mi primer auto, no sé si necesito tanto",
      "¿No hay algo más barato?",
      "Necesito pensarlo con mi familia"
    ]),
    contextoPreventa: "Cliente llega al showroom un sábado por la tarde, solo, viste casual",
    pilaresEvaluados: JSON.stringify([
      "Saludo y Primera Impresión",
      "Construcción de Rapport", 
      "Consulta de Necesidades"
    ]),
    etiquetas: JSON.stringify(["principiante", "sedán", "financiamiento"])
  },
  {
    titulo: "Ejecutivo Buscando SUV Premium",
    descripcion: "Ejecutivo senior busca SUV de lujo, tiene presupuesto alto pero es muy exigente en detalles",
    categoria: "Presentación de Producto",
    nivelDificultad: "avanzado",
    tipoCliente: "Ejecutivo Senior",
    vehiculoInteres: "SUV Premium",
    presupuestoCliente: 800000,
    duracionEstimada: 25,
    personalidadCliente: JSON.stringify({
      tipo: "dominante",
      preocupaciones: ["estatus", "tecnología", "tiempo"],
      motivadores: ["exclusividad", "rendimiento", "reconocimiento"]
    }),
    objetivosAprendizaje: JSON.stringify([
      "Presentar valor premium",
      "Demostrar tecnología avanzada",
      "Manejar cliente exigente"
    ]),
    objecionesComunes: JSON.stringify([
      "En la competencia me ofrecen más por menos",
      "No tengo tiempo para esto",
      "¿Qué me garantiza que vale la pena?"
    ]),
    contextoPreventa: "Cita programada, llega en auto de lujo, revisa el tiempo constantemente",
    pilaresEvaluados: JSON.stringify([
      "Presentación del Producto",
      "Demostración Práctica",
      "Manejo de Objeciones",
      "Negociación de Precio"
    ]),
    etiquetas: JSON.stringify(["premium", "ejecutivo", "suv", "exigente"])
  },
  {
    titulo: "Familia Numerosa Busca Minivan",
    descripcion: "Pareja con 3 hijos necesita vehículo espacioso, presupuesto limitado pero necesidad urgente",
    categoria: "Consulta de Necesidades",
    nivelDificultad: "intermedio",
    tipoCliente: "Familia Numerosa",
    vehiculoInteres: "Minivan",
    presupuestoCliente: 400000,
    duracionEstimada: 20,
    personalidadCliente: JSON.stringify({
      tipo: "colaborativo",
      preocupaciones: ["espacio", "seguridad", "precio"],
      motivadores: ["practicidad", "comodidad familiar", "economía"]
    }),
    objetivosAprendizaje: JSON.stringify([
      "Identificar necesidades familiares",
      "Demostrar características de seguridad",
      "Encontrar solución en presupuesto"
    ]),
    objecionesComunes: JSON.stringify([
      "Necesitamos pensarlo en familia",
      "¿No hay algo más barato con las mismas características?",
      "Los gastos de mantenimiento nos preocupan"
    ]),
    contextoPreventa: "Llegan en fin de semana, con niños, se ven apurados por el tiempo",
    pilaresEvaluados: JSON.stringify([
      "Consulta de Necesidades",
      "Presentación del Producto",
      "Manejo de Objeciones",
      "Cierre Consultivo"
    ]),
    etiquetas: JSON.stringify(["familia", "minivan", "seguridad", "presupuesto-limitado"])
  },
  {
    titulo: "Cliente Difícil con Múltiples Objeciones",
    descripcion: "Cliente que ha visitado varias agencias, muy crítico y con muchas objeciones",
    categoria: "Manejo de Objeciones",
    nivelDificultad: "experto",
    tipoCliente: "Cliente Agresivo",
    vehiculoInteres: "Pickup",
    presupuestoCliente: 600000,
    duracionEstimada: 30,
    personalidadCliente: JSON.stringify({
      tipo: "agresivo",
      preocupaciones: ["ser engañado", "sobrepagar", "calidad"],
      motivadores: ["respeto", "honestidad", "valor real"]
    }),
    objetivosAprendizaje: JSON.stringify([
      "Mantener profesionalismo bajo presión",
      "Convertir objeciones en oportunidades",
      "Construir confianza con cliente difícil"
    ]),
    objecionesComunes: JSON.stringify([
      "En todas partes me quieren ver la cara",
      "Este precio es un robo",
      "Ya me dijeron en otro lado que esto no sirve"
    ]),
    contextoPreventa: "Llega molesto, menciona experiencias negativas previas, actitud desafiante",
    pilaresEvaluados: JSON.stringify([
      "Manejo de Objeciones",
      "Manejo de Situaciones Difíciles",
      "Construcción de Rapport",
      "Cierre de Venta"
    ]),
    etiquetas: JSON.stringify(["difícil", "objeciones", "pickup", "experiencia-previa"])
  },
  {
    titulo: "Cierre de Venta con Cliente Indeciso",
    descripcion: "Cliente que está convencido del vehículo pero no puede decidirse a firmar",
    categoria: "Cierre de Venta",
    nivelDificultad: "intermedio",
    tipoCliente: "Cliente Indeciso",
    vehiculoInteres: "Hatchback",
    presupuestoCliente: 300000,
    duracionEstimada: 20,
    personalidadCliente: JSON.stringify({
      tipo: "analítico",
      preocupaciones: ["tomar decisión incorrecta", "timing", "opciones"],
      motivadores: ["seguridad", "aprobación", "garantías"]
    }),
    objetivosAprendizaje: JSON.stringify([
      "Técnicas de cierre suave",
      "Crear urgencia sin presión",
      "Dar confianza en la decisión"
    ]),
    objecionesComunes: JSON.stringify([
      "¿Y si sale algo mejor el próximo mes?",
      "Déjame pensarlo un poco más",
      "¿Estás seguro de que es la mejor opción para mí?"
    ]),
    contextoPreventa: "Ha venido varias veces, conoce bien el producto, solo falta decidirse",
    pilaresEvaluados: JSON.stringify([
      "Creación de Urgencia",
      "Cierre de Venta",
      "Cierre Consultivo",
      "Manejo de Objeciones"
    ]),
    etiquetas: JSON.stringify(["cierre", "indeciso", "hatchback", "seguimiento"])
  }
];

async function populateDatabase() {
  try {
    console.log('🚀 Iniciando población de la base de datos...');
    
    // 1. Poblar Pilares SPCC
    console.log('📋 Poblando Pilares SPCC...');
    
    // Verificar si ya existen pilares
    const existingPilares = await prisma.pilar.count();
    
    if (existingPilares === 0) {
      for (const pilar of PILARES_SPCC) {
        await prisma.pilar.create({
          data: pilar
        });
      }
      console.log(`✅ ${PILARES_SPCC.length} Pilares SPCC creados exitosamente`);
    } else {
      console.log(`ℹ️  Ya existen ${existingPilares} pilares en la BD, omitiendo...`);
    }
    
    // 2. Poblar Escenarios de RolePlay
    console.log('🎭 Poblando Escenarios de RolePlay...');
    
    const existingScenarios = await prisma.rolePlayScenario.count();
    
    if (existingScenarios === 0) {
      for (const scenario of ESCENARIOS_ROLEPLAY) {
        await prisma.rolePlayScenario.create({
          data: scenario
        });
      }
      console.log(`✅ ${ESCENARIOS_ROLEPLAY.length} Escenarios de RolePlay creados exitosamente`);
    } else {
      console.log(`ℹ️  Ya existen ${existingScenarios} escenarios en la BD, omitiendo...`);
    }
    
    // 3. Mostrar resumen final
    const finalPilares = await prisma.pilar.count();
    const finalScenarios = await prisma.rolePlayScenario.count();
    const finalProspectos = await prisma.prospecto.count();
    
    console.log('\n🎉 POBLACIÓN DE BASE DE DATOS COMPLETADA');
    console.log('==========================================');
    console.log(`📊 Pilares SPCC: ${finalPilares}`);
    console.log(`🎭 Escenarios RolePlay: ${finalScenarios}`);
    console.log(`👥 Prospectos existentes: ${finalProspectos}`);
    console.log('==========================================');
    console.log('✅ Las funcionalidades ahora están conectadas a la BD real');
    
  } catch (error) {
    console.error('❌ Error poblando la base de datos:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  populateDatabase()
    .then(() => {
      console.log('🏁 Script completado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Script falló:', error);
      process.exit(1);
    });
}

module.exports = { populateDatabase };
