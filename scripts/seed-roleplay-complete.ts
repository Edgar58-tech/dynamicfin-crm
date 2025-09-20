
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ROLEPLAY_SCENARIOS = [
  {
    titulo: "Cliente indeciso que 'necesita pensarlo'",
    descripcion: "El cliente muestra interés genuino pero constantemente dice que necesita pensarlo o consultar con su pareja. Debes trabajar para identificar las verdaderas objeciones y crear urgencia sin presionar demasiado.",
    categoria: "objeciones",
    nivelDificultad: "medio",
    tipoCliente: "indeciso",
    personalidadCliente: JSON.stringify({
      tipo: "Indeciso",
      caracteristicas: ["Analítico", "Cauteloso", "Busca validación", "Evita decisiones rápidas"],
      motivadores: ["Seguridad", "Consenso familiar", "Tiempo para analizar"],
      temores: ["Tomar la decisión equivocada", "Arrepentirse", "Presión de ventas"]
    }),
    vehiculoInteres: "SUV Familiar",
    presupuestoCliente: 450000,
    duracionEstimada: 20,
    objetivosAprendizaje: JSON.stringify([
      "Identificar objeciones reales vs falsas",
      "Crear urgencia apropiada",
      "Técnicas de cierre suave",
      "Manejo de la postergación"
    ]),
    objecionesComunes: JSON.stringify([
      "Necesito consultarlo con mi esposa",
      "Déjame pensarlo unos días",
      "Quiero ver otras opciones primero",
      "No tengo prisa por decidir"
    ]),
    contextoPreventa: "Primera visita al showroom, viene con información previa de internet",
    pilaresEvaluados: JSON.stringify([1, 2, 5, 8, 11, 13, 15]),
    etiquetas: JSON.stringify(["objeciones", "cierre", "urgencia", "consultivo"]),
    activo: true
  },
  {
    titulo: "Cliente enfocado únicamente en el precio",
    descripcion: "Cliente que desde el inicio pregunta por descuentos y precios, compara constantemente con la competencia y parece que solo le importa conseguir el mejor precio. Debes demostrar valor más allá del precio.",
    categoria: "objeciones",
    nivelDificultad: "medio",
    tipoCliente: "precio_sensible",
    personalidadCliente: JSON.stringify({
      tipo: "Sensible al Precio",
      caracteristicas: ["Comparador", "Negociador", "Busca ofertas", "Orientado al ahorro"],
      motivadores: ["Mejor precio", "Descuentos", "Promociones", "Valor por dinero"],
      temores: ["Pagar de más", "Perder una oferta mejor", "Ser engañado"]
    }),
    vehiculoInteres: "Auto Compacto",
    presupuestoCliente: 280000,
    duracionEstimada: 18,
    objetivosAprendizaje: JSON.stringify([
      "Construcción de valor",
      "Manejo de objeciones de precio",
      "Diferenciación de la competencia",
      "Enfoque en beneficios vs características"
    ]),
    objecionesComunes: JSON.stringify([
      "En X lugar está más barato",
      "¿Cuál es su mejor precio?",
      "¿No me puede hacer un descuento?",
      "Solo me interesa el más económico"
    ]),
    contextoPreventa: "Llega comparando precios de diferentes marcas",
    pilaresEvaluados: JSON.stringify([3, 4, 6, 7, 9, 12, 14]),
    etiquetas: JSON.stringify(["precio", "valor", "competencia", "descuentos"]),
    activo: true
  },
  {
    titulo: "Cliente técnico con conocimiento avanzado",
    descripcion: "Cliente que conoce muy bien las especificaciones técnicas, hace preguntas muy específicas sobre motor, transmisión, seguridad y tecnología. Puede intimidar con su conocimiento pero respeta la expertise.",
    categoria: "prospectacion",
    nivelDificultad: "avanzado",
    tipoCliente: "tecnico",
    personalidadCliente: JSON.stringify({
      tipo: "Técnico Experto",
      caracteristicas: ["Conocedor", "Detallista", "Investigador", "Exigente"],
      motivadores: ["Especificaciones técnicas", "Innovación", "Rendimiento", "Calidad"],
      temores: ["Productos inferiores", "Falta de expertise del vendedor", "Información incorrecta"]
    }),
    vehiculoInteres: "Sedán Premium",
    presupuestoCliente: 850000,
    duracionEstimada: 25,
    objetivosAprendizaje: JSON.stringify([
      "Demostrar expertise técnica",
      "Manejo de clientes conocedores",
      "Equilibrio entre datos y emociones",
      "Credibilidad profesional"
    ]),
    objecionesComunes: JSON.stringify([
      "¿Este motor tiene turbo lag?",
      "¿Qué tipo de suspensión usa?",
      "Los datos de consumo no me convencen",
      "He leído que tiene problemas de X"
    ]),
    contextoPreventa: "Viene con información técnica detallada, posible entusiasta automotriz",
    pilaresEvaluados: JSON.stringify([2, 4, 6, 10, 11, 14, 15]),
    etiquetas: JSON.stringify(["técnico", "especificaciones", "motor", "expertise"]),
    activo: true
  },
  {
    titulo: "Cliente joven comprando su primer auto",
    descripcion: "Cliente joven, entre 22-28 años, comprando su primer vehículo. Está emocionado pero nervioso, tiene presupuesto limitado y necesita mucha orientación. Los padres pueden estar involucrados en la decisión.",
    categoria: "prospectacion",
    nivelDificultad: "facil",
    tipoCliente: "primerizo",
    personalidadCliente: JSON.stringify({
      tipo: "Primerizo Entusiasta",
      caracteristicas: ["Emocionado", "Nervioso", "Inexperto", "Influenciable"],
      motivadores: ["Independencia", "Estilo", "Tecnología", "Aprobación social"],
      temores: ["Tomar mala decisión", "Problemas mecánicos", "Gastos inesperados"]
    }),
    vehiculoInteres: "Hatchback",
    presupuestoCliente: 220000,
    duracionEstimada: 15,
    objetivosAprendizaje: JSON.stringify([
      "Educación del cliente primerizo",
      "Construcción de confianza",
      "Manejo de influencias externas",
      "Proceso de compra simplificado"
    ]),
    objecionesComunes: JSON.stringify([
      "Es mi primer auto, no sé mucho",
      "Mis papás dicen que mejor usado",
      "¿Y si se descompone?",
      "¿No es muy caro para empezar?"
    ]),
    contextoPreventa: "Primera vez en un showroom, viene con expectativas altas pero conocimiento limitado",
    pilaresEvaluados: JSON.stringify([1, 3, 5, 7, 9, 11, 13]),
    etiquetas: JSON.stringify(["primerizo", "educativo", "confianza", "joven"]),
    activo: true
  },
  {
    titulo: "Cliente empresario buscando vehículo comercial",
    descripcion: "Empresario que necesita vehículo para su negocio. Enfocado en ROI, durabilidad, costos de mantenimiento y beneficios fiscales. Decisión rápida si ve el valor comercial.",
    categoria: "cierre",
    nivelDificultad: "medio",
    tipoCliente: "empresario",
    personalidadCliente: JSON.stringify({
      tipo: "Empresario Pragmático",
      caracteristicas: ["Orientado a resultados", "Directo", "Calculador", "Eficiente"],
      motivadores: ["ROI", "Productividad", "Beneficios fiscales", "Durabilidad"],
      temores: ["Pérdida de dinero", "Tiempo perdido", "Problemas operativos"]
    }),
    vehiculoInteres: "Pickup o Van",
    presupuestoCliente: 650000,
    duracionEstimada: 20,
    objetivosAprendizaje: JSON.stringify([
      "Enfoque en beneficios comerciales",
      "Cálculo de ROI",
      "Manejo de decisores empresariales",
      "Cierre basado en números"
    ]),
    objecionesComunes: JSON.stringify([
      "¿Cuánto me va a ahorrar?",
      "¿Qué beneficios fiscales tiene?",
      "Necesito números concretos",
      "¿Cuál es el costo total de propiedad?"
    ]),
    contextoPreventa: "Viene referido o por necesidad específica del negocio",
    pilaresEvaluados: JSON.stringify([2, 4, 6, 8, 10, 12, 14]),
    etiquetas: JSON.stringify(["empresarial", "ROI", "comercial", "fiscal"]),
    activo: true
  },
  {
    titulo: "Cliente familiar buscando seguridad máxima",
    descripcion: "Padre/madre de familia que prioriza la seguridad por encima de todo. Pregunta constantemente por sistemas de seguridad, calificaciones de crash tests y protección para los niños.",
    categoria: "prospectacion",
    nivelDificultad: "facil",
    tipoCliente: "familiar",
    personalidadCliente: JSON.stringify({
      tipo: "Protector Familiar",
      caracteristicas: ["Protector", "Responsable", "Cauteloso", "Informado"],
      motivadores: ["Seguridad familiar", "Tranquilidad", "Protección", "Confiabilidad"],
      temores: ["Accidentes", "Fallas de seguridad", "Riesgo para la familia"]
    }),
    vehiculoInteres: "SUV Familiar",
    presupuestoCliente: 550000,
    duracionEstimada: 22,
    objetivosAprendizaje: JSON.stringify([
      "Enfoque en seguridad",
      "Demostración de sistemas de protección",
      "Construcción de confianza familiar",
      "Manejo de preocupaciones parentales"
    ]),
    objecionesComunes: JSON.stringify([
      "¿Qué tan seguro es realmente?",
      "¿Tiene todas las bolsas de aire?",
      "¿Cómo protege a los niños?",
      "¿Qué pasa en caso de volcadura?"
    ]),
    contextoPreventa: "Viene con la familia, los niños pueden estar presentes",
    pilaresEvaluados: JSON.stringify([1, 3, 5, 7, 9, 11, 15]),
    etiquetas: JSON.stringify(["familia", "seguridad", "protección", "niños"]),
    activo: true
  },
  {
    titulo: "Cliente de lujo con expectativas premium",
    descripcion: "Cliente acostumbrado a productos y servicios de lujo. Espera atención personalizada, exclusividad y el mejor servicio. El precio no es el factor principal pero espera valor excepcional.",
    categoria: "cierre",
    nivelDificultad: "avanzado",
    tipoCliente: "premium",
    personalidadCliente: JSON.stringify({
      tipo: "Cliente Premium",
      caracteristicas: ["Exigente", "Sofisticado", "Conocedor", "Exclusivo"],
      motivadores: ["Exclusividad", "Prestigio", "Calidad superior", "Servicio excepcional"],
      temores: ["Servicio mediocre", "Falta de exclusividad", "Experiencia decepcionante"]
    }),
    vehiculoInteres: "Vehículo de Lujo",
    presupuestoCliente: 1200000,
    duracionEstimada: 30,
    objetivosAprendizaje: JSON.stringify([
      "Manejo de clientes premium",
      "Servicio de lujo",
      "Construcción de exclusividad",
      "Experiencia personalizada"
    ]),
    objecionesComunes: JSON.stringify([
      "¿Qué me hace especial como cliente?",
      "¿Qué servicios exclusivos ofrecen?",
      "¿Cómo garantizan la calidad?",
      "¿Qué diferencia tienen de la competencia?"
    ]),
    contextoPreventa: "Cita programada, expectativas altas de servicio",
    pilaresEvaluados: JSON.stringify([2, 4, 6, 8, 10, 12, 14, 15]),
    etiquetas: JSON.stringify(["lujo", "premium", "exclusivo", "servicio"]),
    activo: true
  },
  {
    titulo: "Cliente que viene por recomendación",
    descripcion: "Cliente que llega referido por un amigo o familiar que ya compró. Viene con predisposición positiva pero también con expectativas altas basadas en la experiencia del referidor.",
    categoria: "cierre",
    nivelDificultad: "facil",
    tipoCliente: "referido",
    personalidadCliente: JSON.stringify({
      tipo: "Cliente Referido",
      caracteristicas: ["Confiado", "Expectante", "Comparativo", "Predispuesto"],
      motivadores: ["Confianza en la referencia", "Experiencia similar", "Validación social"],
      temores: ["No recibir el mismo trato", "Expectativas no cumplidas", "Decepcionar al referidor"]
    }),
    vehiculoInteres: "Similar al del referidor",
    presupuestoCliente: 400000,
    duracionEstimada: 18,
    objetivosAprendizaje: JSON.stringify([
      "Aprovechamiento de referencias",
      "Manejo de expectativas",
      "Construcción sobre confianza existente",
      "Cierre por validación social"
    ]),
    objecionesComunes: JSON.stringify([
      "Mi amigo me dijo que...",
      "¿Me van a dar el mismo trato?",
      "¿El precio será igual?",
      "¿Por qué es diferente a lo que me contaron?"
    ]),
    contextoPreventa: "Llega con información previa y expectativas específicas",
    pilaresEvaluados: JSON.stringify([1, 3, 5, 7, 9, 11, 13]),
    etiquetas: JSON.stringify(["referido", "confianza", "expectativas", "social"]),
    activo: true
  }
];

async function seedRolePlayScenarios() {
  console.log('🎭 Iniciando seed de escenarios de Role Play...');

  try {
    // Limpiar escenarios existentes
    await prisma.rolePlayScenario.deleteMany({});
    console.log('✅ Escenarios existentes eliminados');

    // Insertar nuevos escenarios
    for (const scenario of ROLEPLAY_SCENARIOS) {
      await prisma.rolePlayScenario.create({
        data: scenario
      });
    }

    console.log(`✅ ${ROLEPLAY_SCENARIOS.length} escenarios de Role Play creados exitosamente`);

    // Verificar inserción
    const count = await prisma.rolePlayScenario.count();
    console.log(`📊 Total de escenarios en base de datos: ${count}`);

    // Mostrar resumen por categoría
    const categorias = await prisma.rolePlayScenario.groupBy({
      by: ['categoria'],
      _count: {
        categoria: true
      }
    });

    console.log('📈 Resumen por categorías:');
    categorias.forEach(cat => {
      console.log(`  - ${cat.categoria}: ${cat._count.categoria} escenarios`);
    });

  } catch (error) {
    console.error('❌ Error al crear escenarios de Role Play:', error);
    throw error;
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  seedRolePlayScenarios()
    .then(() => {
      console.log('🎉 Seed de Role Play completado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error en seed de Role Play:', error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

export { seedRolePlayScenarios };
