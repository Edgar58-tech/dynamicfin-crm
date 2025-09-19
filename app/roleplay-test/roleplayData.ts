// Datos de prueba para escenarios de Role Play - Metodología SPCC
// Sistema DynamicFin CRM - Sector Automotriz Mexicano

export interface RolePlayScenario {
  id: number;
  titulo: string;
  descripcion: string;
  categoria: string;
  nivelDificultad: string;
  tipoCliente: string;
  vehiculoInteres?: string;
  presupuestoCliente?: number;
  duracionEstimada: number;
  activo: boolean;
  dificultadPromedio?: number;
  completadoVeces: number;
  puntuacionPromedio?: number;
  etiquetas: string[];
  createdAt: string;
  updatedAt: string;
  
  // Campos específicos para metodología SPCC
  pilaresSPCC: string[];
  contextoCliente: string;
  objetivoEscenario: string;
  objecionesEsperadas: string[];
  respuestasSugeridas: string[];
  metricasExito: string[];
  situacionInicial: string;
  trasfondoCliente: string;
  desafiosEspecificos: string[];
}

// Los 15 Pilares de la Metodología SPCC (Adaptados para Ventas Automotrices)
export const PILARES_SPCC = [
  { id: 1, nombre: "Saludo y Primera Impresión", descripcion: "Crear una conexión inicial positiva y profesional" },
  { id: 2, nombre: "Prospección Efectiva", descripcion: "Identificar y calificar clientes potenciales" },
  { id: 3, nombre: "Construcción de Rapport", descripcion: "Establecer confianza y conexión emocional" },
  { id: 4, nombre: "Consulta de Necesidades", descripcion: "Descubrir necesidades reales del cliente" },
  { id: 5, nombre: "Presentación del Producto", descripcion: "Mostrar características y beneficios relevantes" },
  { id: 6, nombre: "Demostración Práctica", descripcion: "Prueba de manejo y experiencia del vehículo" },
  { id: 7, nombre: "Manejo de Objeciones", descripcion: "Resolver dudas y preocupaciones del cliente" },
  { id: 8, nombre: "Creación de Urgencia", descripcion: "Motivar la decisión de compra inmediata" },
  { id: 9, nombre: "Negociación de Precio", descripcion: "Llegar a acuerdos beneficiosos para ambas partes" },
  { id: 10, nombre: "Cierre de Venta", descripcion: "Finalizar la transacción exitosamente" },
  { id: 11, nombre: "Seguimiento Post-Venta", descripcion: "Mantener relación después de la compra" },
  { id: 12, nombre: "Upselling y Cross-selling", descripcion: "Vender productos adicionales y complementarios" },
  { id: 13, nombre: "Manejo de Situaciones Difíciles", descripcion: "Resolver conflictos y situaciones complejas" },
  { id: 14, nombre: "Construcción de Lealtad", descripcion: "Crear clientes recurrentes y referencias" },
  { id: 15, nombre: "Cierre Consultivo", descripcion: "Asesorar integralmente en la decisión de compra" }
];

// Tipos de cliente específicos del sector automotriz mexicano
export const TIPOS_CLIENTE_AUTOMOTRIZ = [
  { value: 'sospechoso', label: 'Sospechoso - Interés inicial' },
  { value: 'prospecto', label: 'Prospecto - Necesidad identificada' },
  { value: 'prueba', label: 'Prueba - Evaluando opciones' },
  { value: 'cliente', label: 'Cliente - Listo para comprar' },
  { value: 'indeciso', label: 'Cliente Indeciso' },
  { value: 'precio_sensible', label: 'Sensible al Precio' },
  { value: 'tecnico', label: 'Cliente Técnico' },
  { value: 'impulsivo', label: 'Cliente Impulsivo' },
  { value: 'desconfiado', label: 'Cliente Desconfiado' },
  { value: 'informado', label: 'Cliente Informado' }
];

// Escenarios de Role Play completos
export const roleplayScenarios: RolePlayScenario[] = [
  // ESCENARIOS NIVEL PRINCIPIANTE
  {
    id: 1,
    titulo: "Primera Visita - Cliente Joven Interesado en SUV",
    descripcion: "Un cliente joven de 28 años visita por primera vez el concesionario buscando su primer SUV. Tiene trabajo estable pero es su primera compra de auto nuevo.",
    categoria: "prospectacion",
    nivelDificultad: "principiante",
    tipoCliente: "sospechoso",
    vehiculoInteres: "SUV Compacto",
    presupuestoCliente: 350000,
    duracionEstimada: 20,
    activo: true,
    dificultadPromedio: 2.5,
    completadoVeces: 45,
    puntuacionPromedio: 78,
    etiquetas: ["primer auto", "SUV", "joven profesional", "financiamiento"],
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-01-15T10:00:00Z",
    pilaresSPCC: ["Saludo y Primera Impresión", "Prospección Efectiva", "Construcción de Rapport"],
    contextoCliente: "Ingeniero de sistemas de 28 años, soltero, vive en CDMX. Primer trabajo formal bien remunerado. Busca independencia y comodidad para traslados largos.",
    objetivoEscenario: "Practicar el saludo inicial, identificar necesidades básicas y establecer rapport con cliente primerizo",
    objecionesEsperadas: [
      "Es mi primera compra, necesito pensarlo",
      "¿No hay algo más barato?",
      "¿Qué incluye la garantía?",
      "¿Cuánto es el enganche mínimo?"
    ],
    respuestasSugeridas: [
      "Entiendo perfectamente, es una decisión importante. Permíteme mostrarte todas las opciones para que tengas la información completa",
      "Tenemos excelentes planes de financiamiento que se adaptan a tu presupuesto. ¿Cuál sería tu pago mensual ideal?",
      "La garantía incluye 3 años o 100,000 km, además de servicios gratuitos el primer año",
      "Podemos trabajar con enganches desde el 10%, y tenemos promociones especiales este mes"
    ],
    metricasExito: [
      "Obtener información de contacto",
      "Agendar segunda cita",
      "Identificar 3 necesidades principales",
      "Lograr prueba de manejo"
    ],
    situacionInicial: "El cliente entra al showroom mirando los SUVs. Se ve interesado pero nervioso. Es sábado por la mañana y hay poca gente.",
    trasfondoCliente: "Vive con roomies, maneja un auto usado de 2015. Quiere algo más confiable para viajar a ver a su familia en Guadalajara cada mes. Le preocupa el financiamiento.",
    desafiosEspecificos: [
      "Cliente primerizo sin experiencia en compra de autos nuevos",
      "Presupuesto limitado pero expectativas altas",
      "Necesita educación sobre proceso de compra y financiamiento"
    ]
  },

  {
    id: 2,
    titulo: "Familia Buscando Minivan - Presupuesto Ajustado",
    descripcion: "Matrimonio con 3 hijos pequeños necesita cambiar su sedán por una minivan. Presupuesto limitado pero necesidad urgente por crecimiento familiar.",
    categoria: "prospectacion",
    nivelDificultad: "principiante",
    tipoCliente: "prospecto",
    vehiculoInteres: "Minivan",
    presupuestoCliente: 280000,
    duracionEstimada: 25,
    activo: true,
    dificultadPromedio: 3.0,
    completadoVeces: 38,
    puntuacionPromedio: 82,
    etiquetas: ["familia", "minivan", "presupuesto ajustado", "necesidad urgente"],
    createdAt: "2024-01-16T11:00:00Z",
    updatedAt: "2024-01-16T11:00:00Z",
    pilaresSPCC: ["Consulta de Necesidades", "Presentación del Producto", "Manejo de Objeciones"],
    contextoCliente: "Matrimonio de 32 y 30 años, él trabaja en oficina, ella es maestra. Tienen 3 hijos (6, 4 y 2 años). Su sedán ya no es funcional para la familia.",
    objetivoEscenario: "Identificar necesidades familiares específicas y presentar soluciones dentro del presupuesto",
    objecionesEsperadas: [
      "Está fuera de nuestro presupuesto",
      "¿No hay opciones más económicas?",
      "Necesitamos pensarlo en familia",
      "¿Qué pasa si no podemos pagar algún mes?"
    ],
    respuestasSugeridas: [
      "Entiendo su situación familiar. Tenemos opciones de financiamiento flexibles y también vehículos seminuevos que podrían ajustarse mejor",
      "Permíteme mostrarte nuestro programa de intercambio, tu sedán actual puede servir como enganche",
      "Por supuesto, es una decisión familiar importante. ¿Qué tal si programamos una cita cuando puedan venir todos?",
      "Nuestros planes incluyen seguros de desempleo y opciones de refinanciamiento en caso de dificultades"
    ],
    metricasExito: [
      "Identificar 5 necesidades familiares específicas",
      "Mostrar 2 opciones dentro del presupuesto",
      "Obtener compromiso de segunda visita familiar",
      "Evaluar vehículo actual para intercambio"
    ],
    situacionInicial: "La pareja llega con los 3 niños un domingo por la tarde. Los niños están inquietos y los padres se ven estresados por el espacio limitado de su auto actual.",
    trasfondoCliente: "Viven en zona conurbada, necesitan espacio para carriolas, juguetes y compras familiares. Ella maneja principalmente para llevar niños a la escuela. Ingresos estables pero comprometidos con gastos familiares.",
    desafiosEspecificos: [
      "Presupuesto muy ajustado con gastos familiares altos",
      "Necesidad real vs. capacidad de pago",
      "Decisión que involucra a toda la familia",
      "Urgencia por seguridad y comodidad de los niños"
    ]
  },

  // ESCENARIOS NIVEL MEDIO
  {
    id: 3,
    titulo: "Ejecutivo Exigente - Sedán Premium con Objeciones de Precio",
    descripcion: "Director de empresa busca sedán premium para uso ejecutivo. Conoce el mercado, compara precios y es muy exigente con detalles técnicos.",
    categoria: "objeciones",
    nivelDificultad: "medio",
    tipoCliente: "informado",
    vehiculoInteres: "Sedán Premium",
    presupuestoCliente: 650000,
    duracionEstimada: 35,
    activo: true,
    dificultadPromedio: 6.5,
    completadoVeces: 28,
    puntuacionPromedio: 71,
    etiquetas: ["ejecutivo", "premium", "exigente", "comparación precios"],
    createdAt: "2024-01-17T14:00:00Z",
    updatedAt: "2024-01-17T14:00:00Z",
    pilaresSPCC: ["Manejo de Objeciones", "Negociación de Precio", "Presentación del Producto", "Cierre Consultivo"],
    contextoCliente: "Director de Marketing de 45 años, casado, 2 hijos adolescentes. Maneja BMW 2019, busca renovar. Muy informado sobre el mercado automotriz.",
    objetivoEscenario: "Manejar objeciones de precio de cliente informado y demostrar valor diferencial del producto",
    objecionesEsperadas: [
      "En la competencia me ofrecen $50,000 menos",
      "Este modelo no tiene las características del BMW",
      "¿Por qué debería cambiar de marca?",
      "Necesito mejor precio para decidir hoy",
      "Mi BMW actual aún está en buenas condiciones"
    ],
    respuestasSugeridas: [
      "Entiendo que has investigado. Permíteme mostrarte el valor agregado que incluimos: mantenimiento gratuito por 3 años, seguro de auto nuevo y garantía extendida",
      "Tienes razón, son marcas diferentes. Déjame mostrarte las ventajas específicas de nuestro modelo en tecnología, eficiencia y costo de mantenimiento",
      "Excelente pregunta. Nuestros clientes ejecutivos valoran especialmente nuestro servicio personalizado y la red de distribuidores más amplia del país",
      "Aprecio tu interés en cerrar hoy. Permíteme consultar con mi gerente qué opciones especiales podemos ofrecerte",
      "Tu BMW es excelente. Consideremos el valor de intercambio y cómo este nuevo modelo puede ofrecerte mejor tecnología y menores costos operativos"
    ],
    metricasExito: [
      "Superar al menos 3 objeciones principales",
      "Demostrar valor diferencial convincente",
      "Obtener compromiso de decisión en 48 horas",
      "Lograr cotización de intercambio de vehículo actual"
    ],
    situacionInicial: "El cliente llega en su BMW, bien vestido, revisa su teléfono constantemente. Ha visitado 2 concesionarios antes. Tiene prisa pero está genuinamente interesado.",
    trasfondoCliente: "Ingresos altos, valora estatus y calidad. Usa el auto para juntas ejecutivas y viajes de trabajo. Su esposa también maneja ocasionalmente. Busca tecnología avanzada y confort.",
    desafiosEspecificos: [
      "Cliente muy informado que conoce precios de competencia",
      "Altas expectativas de servicio y producto",
      "Comparación constante con su vehículo actual premium",
      "Presión de tiempo en la decisión",
      "Necesidad de justificar cambio de marca"
    ]
  },

  {
    id: 4,
    titulo: "Cliente Desconfiado - Experiencia Previa Negativa",
    descripcion: "Cliente que tuvo mala experiencia en otro concesionario. Muy desconfiado de vendedores, cuestiona todo y busca garantías adicionales.",
    categoria: "situaciones_dificiles",
    nivelDificultad: "medio",
    tipoCliente: "desconfiado",
    vehiculoInteres: "Pickup",
    presupuestoCliente: 450000,
    duracionEstimada: 40,
    activo: true,
    dificultadPromedio: 7.0,
    completadoVeces: 22,
    puntuacionPromedio: 68,
    etiquetas: ["desconfiado", "experiencia negativa", "pickup", "garantías"],
    createdAt: "2024-01-18T09:00:00Z",
    updatedAt: "2024-01-18T09:00:00Z",
    pilaresSPCC: ["Construcción de Rapport", "Manejo de Situaciones Difíciles", "Construcción de Lealtad"],
    contextoCliente: "Contratista de 38 años, divorciado. Compró pickup en otro concesionario hace 2 años, tuvo problemas con garantía y servicio post-venta. Muy escéptico.",
    objetivoEscenario: "Reconstruir confianza con cliente que ha tenido experiencias negativas previas",
    objecionesEsperadas: [
      "Los vendedores siempre prometen y no cumplen",
      "¿Cómo sé que no me van a estafar como en el otro lugar?",
      "Necesito todo por escrito y con firmas",
      "¿Qué pasa si el auto sale defectuoso?",
      "No confío en las garantías, son puro papel"
    ],
    respuestasSugeridas: [
      "Entiendo perfectamente tu preocupación. Lamento que hayas tenido esa experiencia. Aquí manejamos las cosas diferente, permíteme mostrarte testimonios de clientes satisfechos",
      "Tienes todo el derecho a ser cauteloso. Te propongo que hablemos con mi gerente y algunos clientes que han tenido experiencias similares a la tuya",
      "Por supuesto, todo debe quedar documentado. Te daré una copia de cada documento y mi tarjeta personal para cualquier seguimiento",
      "Excelente pregunta. Tenemos un proceso claro: 30 días de garantía total, reemplazo inmediato si hay defectos de fábrica, y mi compromiso personal de seguimiento",
      "Te entiendo. Permíteme mostrarte casos reales donde hemos cumplido nuestras garantías. También puedes hablar directamente con nuestro gerente de servicio"
    ],
    metricasExito: [
      "Lograr que el cliente se relaje y baje la guardia",
      "Obtener al menos una sonrisa o comentario positivo",
      "Conseguir que acepte una prueba de manejo",
      "Establecer seguimiento personalizado"
    ],
    situacionInicial: "El cliente entra con actitud defensiva, brazos cruzados, mira todo con desconfianza. Hace preguntas directas y cortantes desde el primer momento.",
    trasfondoCliente: "Usa pickup para trabajo de construcción. La anterior le dio muchos problemas mecánicos y el concesionario no respondió bien. Perdió dinero y tiempo. Necesita vehículo confiable para su negocio.",
    desafiosEspecificos: [
      "Superar desconfianza basada en experiencia real negativa",
      "Demostrar diferenciación genuina en servicio",
      "Construir credibilidad desde cero",
      "Manejar actitud defensiva sin confrontar",
      "Convertir escepticismo en confianza"
    ]
  },

  // ESCENARIOS NIVEL AVANZADO
  {
    id: 5,
    titulo: "Negociación Compleja - Flota Empresarial",
    descripcion: "Gerente de flota de empresa mediana necesita renovar 8 vehículos. Proceso de licitación interno, múltiples stakeholders y presupuesto corporativo estricto.",
    categoria: "cierre",
    nivelDificultad: "avanzado",
    tipoCliente: "cliente",
    vehiculoInteres: "Flota Mixta",
    presupuestoCliente: 2400000,
    duracionEstimada: 60,
    activo: true,
    dificultadPromedio: 8.5,
    completadoVeces: 15,
    puntuacionPromedio: 75,
    etiquetas: ["flota", "empresarial", "licitación", "múltiples vehículos"],
    createdAt: "2024-01-19T15:00:00Z",
    updatedAt: "2024-01-19T15:00:00Z",
    pilaresSPCC: ["Negociación de Precio", "Cierre de Venta", "Upselling y Cross-selling", "Cierre Consultivo"],
    contextoCliente: "Gerente de Administración de empresa de logística con 150 empleados. Necesita renovar flota: 5 sedanes ejecutivos, 2 pickups y 1 van de carga.",
    objetivoEscenario: "Manejar venta compleja B2B con múltiples decisores y requisitos específicos",
    objecionesEsperadas: [
      "Necesito aprobación del director general",
      "La competencia ofrece mejor precio por volumen",
      "¿Pueden garantizar entrega simultánea de todos los vehículos?",
      "Necesitamos facturación especial y términos de pago extendidos",
      "¿Qué pasa con el mantenimiento de toda la flota?"
    ],
    respuestasSugeridas: [
      "Perfecto, preparemos una presentación ejecutiva completa para el director. ¿Cuándo podríamos agendar esa reunión?",
      "Entiendo. Nuestro valor está en el servicio integral: mantenimiento programado, vehículos de reemplazo y gestión administrativa completa",
      "Sí, podemos coordinar entregas escalonadas según sus necesidades operativas. Tenemos un protocolo especial para flotas",
      "Manejamos cuentas corporativas con términos especiales. Podemos ofrecer 60 días de crédito y facturación consolidada mensual",
      "Incluimos plan de mantenimiento corporativo con descuentos preferenciales y servicio prioritario para toda su flota"
    ],
    metricasExito: [
      "Obtener reunión con director general",
      "Presentar propuesta formal completa",
      "Superar al menos 2 competidores",
      "Cerrar al menos 50% de la flota inicial"
    ],
    situacionInicial: "Reunión programada en oficinas de la empresa. El gerente tiene prisa, revisa constantemente su reloj y teléfono. Hay presión por renovar la flota antes de fin de año fiscal.",
    trasfondoCliente: "Empresa familiar en crecimiento, cuida mucho los costos pero valora la confiabilidad. Los vehículos son herramientas de trabajo críticas. Decisión final la toma el director general (hijo del fundador).",
    desafiosEspecificos: [
      "Múltiples decisores con diferentes prioridades",
      "Proceso de compra corporativo formal",
      "Competencia directa con otros concesionarios",
      "Presión de tiempo por cierre fiscal",
      "Necesidades técnicas específicas por tipo de vehículo"
    ]
  },

  {
    id: 6,
    titulo: "Cliente VIP Insatisfecho - Servicio de Recuperación",
    descripcion: "Cliente VIP que compró vehículo premium hace 6 meses. Ha tenido problemas de servicio post-venta y está considerando cambiar de marca. Situación crítica de retención.",
    categoria: "situaciones_dificiles",
    nivelDificultad: "avanzado",
    tipoCliente: "cliente",
    vehiculoInteres: "SUV Premium",
    presupuestoCliente: 850000,
    duracionEstimada: 45,
    activo: true,
    dificultadPromedio: 9.0,
    completadoVeces: 12,
    puntuacionPromedio: 72,
    etiquetas: ["VIP", "insatisfecho", "retención", "servicio post-venta"],
    createdAt: "2024-01-20T16:00:00Z",
    updatedAt: "2024-01-20T16:00:00Z",
    pilaresSPCC: ["Manejo de Situaciones Difíciles", "Construcción de Lealtad", "Seguimiento Post-Venta"],
    contextoCliente: "Empresario exitoso de 52 años, compró SUV premium hace 6 meses. Ha tenido 3 visitas al taller por problemas menores pero el servicio ha sido deficiente.",
    objetivoEscenario: "Recuperar la confianza de cliente VIP insatisfecho y prevenir pérdida de cuenta importante",
    objecionesEsperadas: [
      "Estoy muy decepcionado del servicio, esperaba más de esta marca",
      "He perdido tiempo y dinero por sus errores",
      "Estoy considerando seriamente cambiar de marca",
      "¿Cómo me van a compensar por todas estas molestias?",
      "Ya no confío en que puedan resolver mis problemas"
    ],
    respuestasSugeridas: [
      "Tiene toda la razón en estar molesto. Como cliente VIP, merece un servicio excepcional y claramente no lo hemos brindado. Permítame corregir esto personalmente",
      "Entiendo su frustración y asumo la responsabilidad. Vamos a compensarlo adecuadamente y asegurar que esto no vuelva a pasar",
      "No quiero que se vaya, es un cliente muy valioso para nosotros. Déjeme mostrarle cómo vamos a cambiar su experiencia completamente",
      "Le ofrezco extensión de garantía sin costo, servicios VIP prioritarios y mi número personal para cualquier situación futura",
      "Le propongo asignarle un asesor de servicio exclusivo y revisar completamente su vehículo sin costo para asegurar que todo esté perfecto"
    ],
    metricasExito: [
      "Lograr que el cliente acepte una solución de compensación",
      "Obtener compromiso de darle otra oportunidad a la marca",
      "Establecer plan de seguimiento personalizado",
      "Convertir experiencia negativa en testimonio positivo"
    ],
    situacionInicial: "El cliente llega visiblemente molesto, habla en tono elevado desde la recepción. Otros clientes están observando. La situación es tensa y requiere manejo inmediato.",
    trasfondoCliente: "Empresario exitoso, influyente en su círculo social y empresarial. Sus recomendaciones tienen peso. Compra vehículos premium regularmente y espera servicio acorde a lo que paga.",
    desafiosEspecificos: [
      "Cliente muy molesto con razones válidas",
      "Riesgo de pérdida de cliente VIP y referencias negativas",
      "Situación pública que puede afectar imagen del concesionario",
      "Necesidad de solución inmediata y compensación adecuada",
      "Recuperar confianza perdida por fallas del equipo"
    ]
  },

  // ESCENARIOS NIVEL EXPERTO
  {
    id: 7,
    titulo: "Cierre Consultivo Complejo - Decisión Familiar Múltiple",
    descripción: "Familia extendida (3 generaciones) necesita renovar 4 vehículos diferentes. Cada miembro tiene necesidades distintas, presupuestos variables y todos opinan en las decisiones.",
    categoria: "cierre",
    nivelDificultad: "experto",
    tipoCliente: "cliente",
    vehiculoInteres: "Múltiples Vehículos",
    presupuestoCliente: 1800000,
    duracionEstimada: 90,
    activo: true,
    dificultadPromedio: 9.5,
    completadoVeces: 8,
    puntuacionPromedio: 79,
    etiquetas: ["familia extendida", "múltiples decisores", "diferentes necesidades", "cierre complejo"],
    createdAt: "2024-01-21T10:00:00Z",
    updatedAt: "2024-01-21T10:00:00Z",
    pilaresSPCC: ["Cierre Consultivo", "Manejo de Situaciones Difíciles", "Negociación de Precio", "Construcción de Lealtad"],
    contextoCliente: "Familia empresaria: abuelos (70s), padres (45-50), hijo recién casado (25). Necesitan: auto para abuelos, SUV familiar, pickup para negocio, compacto para nuera.",
    objetivoEscenario: "Manejar venta consultiva compleja con múltiples decisores, necesidades y presupuestos diferentes",
    objecionesEsperadas: [
      "Cada quien quiere algo diferente, no nos ponemos de acuerdo",
      "Es mucho dinero de una sola vez",
      "¿No podemos comprar de uno en uno?",
      "Los abuelos quieren lo más barato, los jóvenes lo más moderno",
      "¿Qué descuento nos dan por comprar varios?"
    ],
    respuestasSugeridas: [
      "Entiendo perfectamente. Propongo que analicemos las necesidades de cada miembro por separado y luego veamos cómo optimizar la compra grupal",
      "Tienen razón, es una inversión importante. Podemos estructurar pagos escalonados y aprovechar el intercambio de sus vehículos actuales",
      "Podríamos hacerlo gradual, pero comprando juntos obtienen mejores precios y condiciones. Permítanme mostrarles los beneficios",
      "Es normal en familias. Propongo opciones que satisfagan las necesidades básicas de cada uno dentro de un rango de precios coherente",
      "Por volumen puedo ofrecerles descuentos especiales, financiamiento preferencial y servicios adicionales sin costo"
    ],
    metricasExito: [
      "Lograr consenso familiar en al menos 3 de 4 vehículos",
      "Estructurar plan de compra que satisfaga a todos",
      "Cerrar al menos 2 vehículos en la primera reunión",
      "Establecer cronograma para compras restantes"
    ],
    situacionInicial: "Reunión familiar un sábado por la tarde. Llegan en 2 autos, 7 personas total incluyendo 2 niños pequeños. Cada subgrupo tiene ideas diferentes y hay discusiones constantes.",
    trasfondoCliente: "Familia unida pero con personalidades fuertes. Los abuelos fundaron el negocio familiar, son conservadores con el dinero. Los padres manejan ahora el negocio, más abiertos a tecnología. Los jóvenes quieren estilo y modernidad.",
    desafiosEspecificos: [
      "7 personas con opiniones diferentes en una decisión",
      "Rangos de edad muy amplios (25-75 años)",
      "Diferentes niveles de conocimiento automotriz",
      "Presupuestos individuales vs. familiar",
      "Dinámicas familiares que pueden generar conflicto",
      "Necesidad de satisfacer a todos sin perder la venta"
    ]
  },

  {
    id: 8,
    titulo: "Recuperación de Venta Perdida - Cliente que se Fue a Competencia",
    descripcion: "Cliente que estuvo negociando hace 3 semanas, se fue a la competencia pero no finalizó compra. Regresa con información de otros concesionarios y expectativas muy específicas.",
    categoria: "cierre",
    nivelDificultad: "experto",
    tipoCliente: "prueba",
    vehiculoInteres: "Sedán Ejecutivo",
    presupuestoCliente: 520000,
    duracionEstimada: 50,
    activo: true,
    dificultadPromedio: 8.8,
    completadoVeces: 10,
    puntuacionPromedio: 74,
    etiquetas: ["recuperación", "competencia", "segunda oportunidad", "información privilegiada"],
    createdAt: "2024-01-22T13:00:00Z",
    updatedAt: "2024-01-22T13:00:00Z",
    pilaresSPCC: ["Manejo de Objeciones", "Negociación de Precio", "Cierre de Venta", "Construcción de Rapport"],
    contextoCliente: "Contador de 42 años, casado, 1 hijo. Visitó hace 3 semanas, no se cerró la venta por precio. Fue a 3 competidores, tiene cotizaciones pero no ha comprado.",
    objetivoEscenario: "Recuperar cliente que se fue a competencia, superar objeciones basadas en ofertas externas",
    objecionesEsperadas: [
      "En Honda me ofrecen el mismo auto $30,000 más barato",
      "¿Por qué no me dieron ese precio desde la primera vez?",
      "Ya perdí mucho tiempo, necesito decidir rápido",
      "Toyota me incluye 5 años de garantía",
      "¿Cómo sé que esta es su mejor oferta?"
    ],
    respuestasSugeridas: [
      "Entiendo que encontraste una buena oferta. Permíteme revisar exactamente qué incluye para hacer una comparación justa de valor total",
      "Tienes razón, debí haber explorado más opciones desde el inicio. Ahora que conozco mejor tus necesidades, puedo hacer una propuesta más competitiva",
      "Aprecio que regreses a darnos otra oportunidad. Vamos directo al grano con mi mejor oferta final",
      "Excelente que hayas investigado. Nuestra garantía incluye servicios adicionales que otras marcas cobran por separado. Déjame mostrarte la comparación real",
      "Esta es mi oferta final y más competitiva. Incluye todo lo que necesitas y mi compromiso personal de servicio"
    ],
    metricasExito: [
      "Superar ofertas de competencia con propuesta de valor",
      "Cerrar venta en esta segunda oportunidad",
      "Lograr que el cliente se sienta bien con su decisión",
      "Obtener referencia positiva después de la experiencia"
    ],
    situacionInicial: "El cliente regresa solo, se ve cansado del proceso de búsqueda. Trae folder con cotizaciones de otros lugares. Está decidido a comprar pero quiere asegurar la mejor decisión.",
    trasfondoCliente: "Profesionista meticuloso, analiza todo detalladamente. Su esposa lo presiona para que decida pronto porque necesitan el auto. Ha invertido mucho tiempo en investigación y quiere que valga la pena.",
    desafiosEspecificos: [
      "Cliente tiene información detallada de competencia",
      "Expectativas elevadas por experiencia previa",
      "Presión de tiempo para cerrar decisión",
      "Necesidad de justificar por qué regresó",
      "Superar ofertas específicas de competidores",
      "Convertir segunda oportunidad en venta exitosa"
    ]
  },

  // ESCENARIOS ADICIONALES PARA COMPLETAR LOS 15 PILARES
  {
    id: 9,
    titulo: "Demostración Técnica Avanzada - Cliente Ingeniero",
    descripcion: "Ingeniero automotriz que conoce perfectamente las especificaciones técnicas. Requiere demostración detallada de tecnología, rendimiento y comparativas técnicas precisas.",
    categoria: "prospectacion",
    nivelDificultad: "avanzado",
    tipoCliente: "tecnico",
    vehiculoInteres: "Híbrido Tecnológico",
    presupuestoCliente: 580000,
    duracionEstimada: 55,
    activo: true,
    dificultadPromedio: 8.0,
    completadoVeces: 18,
    puntuacionPromedio: 76,
    etiquetas: ["técnico", "ingeniero", "híbrido", "especificaciones"],
    createdAt: "2024-01-23T11:00:00Z",
    updatedAt: "2024-01-23T11:00:00Z",
    pilaresSPCC: ["Demostración Práctica", "Presentación del Producto", "Consulta de Necesidades"],
    contextoCliente: "Ingeniero mecánico de 35 años, trabaja en industria automotriz. Busca vehículo híbrido para uso personal. Conoce perfectamente especificaciones técnicas.",
    objetivoEscenario: "Realizar demostración técnica convincente para cliente experto en el tema",
    objecionesEsperadas: [
      "El sistema híbrido de Toyota es más eficiente",
      "¿Cuál es el torque real en modo eléctrico?",
      "Los datos de consumo en laboratorio no son reales",
      "¿Qué tipo de batería usa y cuál es su vida útil?",
      "¿Cómo se comporta en condiciones extremas?"
    ],
    respuestasSugeridas: [
      "Tienes razón sobre Toyota, pero nuestro sistema tiene ventajas en aceleración y mantenimiento. Déjame mostrarte las pruebas comparativas",
      "El torque en modo eléctrico es de 315 Nm desde 0 rpm. ¿Quieres que revisemos las curvas de potencia completas?",
      "Entiendo tu escepticismo. Tenemos datos de consumo real de clientes en diferentes condiciones. ¿Te interesa ver el estudio?",
      "Usamos baterías de ion-litio con garantía de 8 años. La degradación promedio es menor al 10% en ese período",
      "Excelente pregunta. Tenemos datos de pruebas en altitud, temperaturas extremas y diferentes tipos de manejo. ¿Cuál te interesa más?"
    ],
    metricasExito: [
      "Satisfacer todas las preguntas técnicas del cliente",
      "Lograr prueba de manejo enfocada en aspectos técnicos",
      "Demostrar conocimiento superior al de competencia",
      "Obtener reconocimiento de ventajas técnicas del producto"
    ],
    situacionInicial: "El cliente llega con tablet y cuaderno, hace preguntas técnicas desde el saludo. Claramente ha investigado mucho y quiere validar información.",
    trasfondoCliente: "Profesional muy preparado, valora la precisión técnica sobre aspectos emocionales. Su decisión será puramente racional basada en datos y rendimiento real.",
    desafiosEspecificos: [
      "Cliente con conocimiento técnico superior al promedio",
      "Necesidad de datos precisos y verificables",
      "Comparación técnica directa con competencia",
      "Demostración práctica de especificaciones teóricas"
    ]
  },

  {
    id: 10,
    titulo: "Upselling Estratégico - Cliente Satisfecho Busca Segundo Auto",
    descripcion: "Cliente que compró auto hace 2 años, muy satisfecho con servicio. Ahora busca segundo vehículo para su esposa. Oportunidad de upselling y cross-selling.",
    categoria: "cierre",
    nivelDificultad: "medio",
    tipoCliente: "cliente",
    vehiculoInteres: "SUV Familiar",
    presupuestoCliente: 420000,
    duracionEstimada: 30,
    activo: true,
    dificultadPromedio: 5.5,
    completadoVeces: 32,
    puntuacionPromedio: 85,
    etiquetas: ["cliente satisfecho", "segundo auto", "upselling", "familia"],
    createdAt: "2024-01-24T14:00:00Z",
    updatedAt: "2024-01-24T14:00:00Z",
    pilaresSPCC: ["Upselling y Cross-selling", "Construcción de Lealtad", "Seguimiento Post-Venta"],
    contextoCliente: "Médico de 40 años, compró sedán hace 2 años. Excelente experiencia de servicio. Su esposa necesita SUV para llevar niños a actividades.",
    objetivoEscenario: "Aprovechar relación existente para venta adicional y maximizar valor de cliente",
    objecionesEsperadas: [
      "No queremos gastar tanto como en el primer auto",
      "¿No hay descuento por ser cliente frecuente?",
      "Mi esposa prefiere algo más sencillo",
      "¿Podemos usar el sedán como parte de pago?"
    ],
    respuestasSugeridas: [
      "Entiendo perfectamente. Tenemos opciones excelentes en un rango más accesible que mantendrán la calidad que ya conocen",
      "Por supuesto, como cliente VIP tienes descuentos especiales y condiciones preferenciales",
      "Perfecto, busquemos algo práctico y confiable. ¿Qué características son más importantes para ella?",
      "Podemos evaluar tu sedán, aunque te recomiendo conservarlo. Tener dos autos de la misma marca facilita el mantenimiento"
    ],
    metricasExito: [
      "Cerrar venta del segundo vehículo",
      "Ofrecer servicios adicionales (seguros, garantías)",
      "Mantener satisfacción del cliente existente",
      "Obtener referencia de otros médicos del hospital"
    ],
    situacionInicial: "El cliente llega confiado, saluda por su nombre al personal. Se nota cómodo y relajado. Menciona que su esposa viene en camino.",
    trasfondoCliente: "Cliente leal muy satisfecho con su experiencia previa. Valora la relación de confianza establecida. Su recomendación tiene peso en su círculo profesional.",
    desafiosEspecificos: [
      "Mantener nivel de satisfacción alto",
      "Balancear necesidades de dos usuarios diferentes",
      "Maximizar valor sin comprometer relación",
      "Aprovechar confianza para productos adicionales"
    ]
  },

  // ESCENARIOS ESPECÍFICOS PARA PILARES RESTANTES
  {
    id: 11,
    titulo: "Creación de Urgencia - Promoción Limitada",
    descripcion: "Cliente interesado pero indeciso. Última semana de promoción especial con descuentos significativos. Necesita tomar decisión antes del vencimiento.",
    categoria: "cierre",
    nivelDificultad: "medio",
    tipoCliente: "indeciso",
    vehiculoInteres: "Hatchback",
    presupuestoCliente: 290000,
    duracionEstimada: 25,
    activo: true,
    dificultadPromedio: 6.0,
    completadoVeces: 41,
    puntuacionPromedio: 73,
    etiquetas: ["urgencia", "promoción", "indeciso", "descuentos"],
    createdAt: "2024-01-25T16:00:00Z",
    updatedAt: "2024-01-25T16:00:00Z",
    pilaresSPCC: ["Creación de Urgencia", "Cierre de Venta", "Manejo de Objeciones"],
    contextoCliente: "Estudiante de posgrado de 26 años, trabaja medio tiempo. Necesita auto pero tiende a postergar decisiones importantes. Presupuesto muy ajustado.",
    objetivoEscenario: "Crear urgencia genuina sin presionar excesivamente a cliente indeciso",
    objecionesEsperadas: [
      "Necesito pensarlo más",
      "¿No habrá otra promoción después?",
      "Quiero consultarlo con mis papás",
      "¿Y si encuentro algo mejor la próxima semana?"
    ],
    respuestasSugeridas: [
      "Te entiendo perfectamente. La promoción termina el viernes y no sabemos cuándo habrá otra igual. ¿Qué información adicional necesitas para decidir?",
      "Esta promoción es especial por fin de año fiscal. La siguiente sería hasta marzo y probablemente con menos descuento",
      "Excelente idea consultarlo. ¿Qué tal si los llamas ahora o podemos hacer videollamada para que vean el auto?",
      "Es posible, pero este precio y estas condiciones no las vas a encontrar después del viernes. ¿Qué te detiene realmente?"
    ],
    metricasExito: [
      "Lograr decisión antes del vencimiento de promoción",
      "Identificar y resolver la verdadera objeción",
      "Mantener presión positiva sin agobiar",
      "Cerrar con condiciones de promoción"
    ],
    situacionInicial: "Miércoles por la tarde, el cliente ha visitado 3 veces en 2 semanas. Se ve interesado pero siempre encuentra excusas para no decidir.",
    trasfondoCliente: "Joven responsable pero inseguro en decisiones financieras importantes. Sus padres lo apoyan económicamente parcialmente. Necesita el auto para trabajo y estudios.",
    desafiosEspecificos: [
      "Crear urgencia sin parecer desesperado",
      "Superar tendencia natural a postergar",
      "Manejar inseguridad financiera del cliente",
      "Aprovechar promoción real sin manipular"
    ]
  },

  {
    id: 12,
    titulo: "Seguimiento Post-Venta Proactivo - Cliente Reciente",
    descripcion: "Cliente que compró auto hace 1 mes. Primera llamada de seguimiento para asegurar satisfacción y detectar oportunidades de servicios adicionales.",
    categoria: "prospectacion",
    nivelDificultad: "principiante",
    tipoCliente: "cliente",
    vehiculoInteres: "Compacto",
    presupuestoCliente: 0,
    duracionEstimada: 15,
    activo: true,
    dificultadPromedio: 3.5,
    completadoVeces: 67,
    puntuacionPromedio: 88,
    etiquetas: ["seguimiento", "post-venta", "satisfacción", "servicios"],
    createdAt: "2024-01-26T10:00:00Z",
    updatedAt: "2024-01-26T10:00:00Z",
    pilaresSPCC: ["Seguimiento Post-Venta", "Construcción de Lealtad", "Upselling y Cross-selling"],
    contextoCliente: "Secretaria de 29 años, compró su primer auto nuevo hace 1 mes. Muy contenta con la compra pero aún adaptándose al vehículo nuevo.",
    objetivoEscenario: "Realizar seguimiento efectivo que fortalezca relación y detecte oportunidades",
    objecionesEsperadas: [
      "Todo está bien, no necesito nada",
      "Aún no he tenido tiempo de revisar todo",
      "¿Me van a estar llamando seguido?",
      "No tengo presupuesto para servicios adicionales"
    ],
    respuestasSugeridas: [
      "Me da mucho gusto escuchar eso. Solo quería asegurarme y recordarte que estoy aquí para cualquier duda",
      "No te preocupes, es normal. ¿Te gustaría que te explique algunas funciones que quizás no has explorado?",
      "No, solo llamadas importantes. Prefiero que me contactes tú cuando necesites algo. ¿Tienes mi número directo?",
      "Perfecto, no es necesario comprar nada. Solo quería ofrecerte información sobre mantenimiento preventivo gratuito"
    ],
    metricasExito: [
      "Confirmar satisfacción total del cliente",
      "Detectar alguna necesidad o duda",
      "Agendar primer servicio de mantenimiento",
      "Obtener autorización para futuras comunicaciones"
    ],
    situacionInicial: "Llamada telefónica programada un mes después de la entrega. El cliente está en su trabajo, tiene tiempo limitado pero se escucha contento.",
    trasfondoCliente: "Primera experiencia con auto nuevo, muy cuidadosa con el vehículo. Valora mucho el servicio personalizado y la atención recibida durante la compra.",
    desafiosEspecificos: [
      "Mantener contacto sin ser invasivo",
      "Detectar necesidades no expresadas",
      "Fortalecer relación para futuras compras",
      "Generar confianza para referencias"
    ]
  },

  {
    id: 13,
    titulo: "Cross-selling Inteligente - Accesorios y Servicios",
    descripcion: "Cliente que ya decidió comprar el auto. Oportunidad de ofrecer accesorios, seguros, garantías extendidas y servicios adicionales que agreguen valor.",
    categoria: "cierre",
    nivelDificultad: "medio",
    tipoCliente: "cliente",
    vehiculoInteres: "SUV Mediano",
    presupuestoCliente: 480000,
    duracionEstimada: 35,
    activo: true,
    dificultadPromedio: 5.8,
    completadoVeces: 29,
    puntuacionPromedio: 81,
    etiquetas: ["cross-selling", "accesorios", "seguros", "garantías"],
    createdAt: "2024-01-27T12:00:00Z",
    updatedAt: "2024-01-27T12:00:00Z",
    pilaresSPCC: ["Upselling y Cross-selling", "Cierre de Venta", "Presentación del Producto"],
    contextoCliente: "Arquitecto de 37 años, casado, 2 hijos. Ya decidió comprar SUV, ahora está en proceso de firma de documentos. Momento ideal para accesorios.",
    objetivoEscenario: "Maximizar valor de venta mediante productos y servicios complementarios relevantes",
    objecionesEsperadas: [
      "Ya gasté mucho en el auto",
      "¿Realmente necesito todo eso?",
      "¿No pueden incluir algo sin costo?",
      "Prefiero comprarlo después más barato"
    ],
    respuestasSugeridas: [
      "Entiendo perfectamente. Estos accesorios los puedes financiar junto con el auto, sin afectar tu flujo de efectivo",
      "Tienes razón en preguntar. Déjame mostrarte solo lo que realmente te va a ser útil para tu familia y trabajo",
      "Por la compra del SUV puedo incluir las películas polarizadas sin costo. Los demás accesorios tienen descuento especial",
      "Podrías, pero instalándolos ahora mantienes la garantía integral y obtienes mejor precio que en el mercado"
    ],
    metricasExito: [
      "Vender al menos 2 accesorios relevantes",
      "Cerrar seguro de auto con cobertura amplia",
      "Ofrecer garantía extendida exitosamente",
      "Mantener satisfacción del cliente con compra principal"
    ],
    situacionInicial: "El cliente está firmando papeles, relajado y contento con su decisión. Es el momento perfecto para ofertas adicionales sin presión.",
    trasfondoCliente: "Profesionista exitoso que valora la calidad y comodidad. Usa el auto para trabajo (visitas a obras) y familia. Dispuesto a invertir en protección y funcionalidad.",
    desafiosEspecificos: [
      "Ofrecer productos relevantes sin saturar",
      "Mantener momentum positivo de la compra principal",
      "Justificar valor de cada producto adicional",
      "No comprometer satisfacción por sobreventa"
    ]
  },

  {
    id: 14,
    titulo: "Construcción de Lealtad - Cliente Multigeneracional",
    descripcion: "Familia que ha comprado 5 autos en el concesionario a lo largo de 15 años. El hijo mayor cumple 18 y necesita su primer auto. Oportunidad de continuar tradición familiar.",
    categoria: "prospectacion",
    nivelDificultad: "medio",
    tipoCliente: "cliente",
    vehiculoInteres: "Compacto Juvenil",
    presupuestoCliente: 250000,
    duracionEstimada: 40,
    activo: true,
    dificultadPromedio: 4.5,
    completadoVeces: 24,
    puntuacionPromedio: 92,
    etiquetas: ["lealtad", "familia", "tradición", "primer auto joven"],
    createdAt: "2024-01-28T15:00:00Z",
    updatedAt: "2024-01-28T15:00:00Z",
    pilaresSPCC: ["Construcción de Lealtad", "Construcción de Rapport", "Seguimiento Post-Venta"],
    contextoCliente: "Familia empresaria leal al concesionario. Padre de 52 años trae a su hijo de 18 para comprar primer auto. Relación de confianza establecida por años.",
    objetivoEscenario: "Fortalecer lealtad multigeneracional y crear nueva relación con cliente joven",
    objecionesEsperadas: [
      "El muchacho quiere algo más deportivo",
      "¿No es muy caro para un primer auto?",
      "Él prefiere autos usados de otras marcas",
      "¿Qué pasa si lo choca?"
    ],
    respuestasSugeridas: [
      "Entiendo perfectamente. Tenemos opciones deportivas pero seguras, perfectas para jóvenes responsables como él",
      "Como familia VIP, tenemos condiciones especiales. Además, un auto confiable es inversión en su seguridad",
      "Es natural que explore opciones. Pero aquí tiene la tranquilidad del servicio que ustedes ya conocen",
      "Por eso recomendamos seguro de cobertura amplia. Además, nuestro servicio de accidentes es el mejor de la ciudad"
    ],
    metricasExito: [
      "Mantener lealtad familiar",
      "Crear conexión con nuevo cliente joven",
      "Cerrar venta con condiciones preferenciales",
      "Establecer base para futuras compras del hijo"
    ],
    situacionInicial: "Sábado familiar, llegan padre e hijo. El padre saluda a todos por nombre, el hijo se ve emocionado pero tímido. Ambiente de confianza total.",
    trasfondoCliente: "Familia de empresarios exitosos, muy leales a marcas y proveedores de confianza. El padre quiere dar buen ejemplo al hijo sobre lealtad y calidad.",
    desafiosEspecificos: [
      "Satisfacer expectativas de dos generaciones diferentes",
      "Mantener tradición familiar sin imponer",
      "Crear nueva relación con cliente joven",
      "Balancear seguridad (padre) con estilo (hijo)"
    ]
  },

  {
    id: 15,
    titulo: "Manejo de Crisis - Recall de Vehículo",
    descripcion: "Cliente que compró auto hace 6 meses se entera por noticias de recall del modelo. Llega muy preocupado exigiendo explicaciones y soluciones inmediatas.",
    categoria: "situaciones_dificiles",
    nivelDificultad: "experto",
    tipoCliente: "cliente",
    vehiculoInteres: "Sedán Familiar",
    presupuestoCliente: 0,
    duracionEstimada: 45,
    activo: true,
    dificultadPromedio: 9.2,
    completadoVeces: 6,
    puntuacionPromedio: 69,
    etiquetas: ["crisis", "recall", "manejo de crisis", "comunicación crítica"],
    createdAt: "2024-01-29T09:00:00Z",
    updatedAt: "2024-01-29T09:00:00Z",
    pilaresSPCC: ["Manejo de Situaciones Difíciles", "Construcción de Lealtad", "Seguimiento Post-Venta"],
    contextoCliente: "Contador de 44 años, casado, 2 hijos. Compró sedán hace 6 meses. Se enteró por noticias del recall y está muy preocupado por seguridad familiar.",
    objetivoEscenario: "Manejar crisis de comunicación, mantener confianza del cliente y resolver situación satisfactoriamente",
    objecionesEsperadas: [
      "¿Por qué no me avisaron antes que las noticias?",
      "¿Es seguro que mi familia siga usando el auto?",
      "¿Me van a cambiar el auto por uno nuevo?",
      "¿Cómo sé que no hay otros problemas ocultos?",
      "Esto afecta el valor de reventa de mi auto"
    ],
    respuestasSugeridas: [
      "Tiene toda la razón en estar molesto. Debimos contactarlo inmediatamente. La notificación oficial llegó ayer y ya estamos llamando a todos los clientes",
      "Su seguridad es nuestra prioridad. El problema es menor y preventivo, pero entiendo su preocupación. Revisemos su auto inmediatamente",
      "El recall incluye reparación gratuita completa. Si prefiere, podemos evaluar opciones de intercambio con condiciones preferenciales",
      "Entiendo su desconfianza. Le propongo revisión completa gratuita de todo el vehículo para su tranquilidad total",
      "Tiene razón. Nos comprometemos a mantener el valor de su auto y ofrecerle garantía extendida sin costo"
    ],
    metricasExito: [
      "Calmar preocupaciones del cliente",
      "Programar reparación inmediata",
      "Mantener confianza en la marca",
      "Convertir crisis en oportunidad de servicio excepcional"
    ],
    situacionInicial: "El cliente llega agitado, con periódico en mano. Habla fuerte desde la entrada, otros clientes observan. Situación de crisis que requiere manejo inmediato.",
    trasfondoCliente: "Padre de familia responsable, muy preocupado por seguridad. Cliente normalmente tranquilo pero la situación lo tiene muy alterado. Valora transparencia y honestidad.",
    desafiosEspecificos: [
      "Manejar cliente muy alterado por tema de seguridad",
      "Situación pública que puede afectar otros clientes",
      "Comunicar información técnica compleja de manera tranquilizadora",
      "Convertir crisis en demostración de servicio excepcional",
      "Mantener lealtad después de problema del fabricante"
    ]
  },

  {
    id: 16,
    titulo: "Madre Joven - Sienna Crédito",
    descripcion: "Madre joven de 29 años busca Toyota Sienna para su familia en crecimiento. Necesita financiamiento por crédito automotriz pero tiene preocupaciones sobre pagos mensuales y enganche.",
    categoria: "objeciones",
    nivelDificultad: "medio",
    tipoCliente: "prospecto",
    vehiculoInteres: "Toyota Sienna",
    presupuestoCliente: 1000000,
    duracionEstimada: 45,
    activo: true,
    dificultadPromedio: 6.2,
    completadoVeces: 0,
    puntuacionPromedio: 0,
    etiquetas: ["madre joven", "sienna", "crédito", "familia", "financiamiento"],
    createdAt: "2024-09-19T10:00:00Z",
    updatedAt: "2024-09-19T10:00:00Z",
    pilaresSPCC: ["Consulta de Necesidades", "Manejo de Objeciones", "Negociación de Precio", "Presentación del Producto", "Cierre Consultivo"],
    contextoCliente: "Madre de 29 años, casada, con 2 hijos pequeños (3 y 5 años) y esperando el tercero. Trabaja medio tiempo como diseñadora gráfica. Su esposo es ingeniero. Actualmente manejan un sedán compacto que ya no es funcional para la familia en crecimiento.",
    objetivoEscenario: "Identificar necesidades familiares específicas, manejar objeciones sobre financiamiento y estructurar crédito automotriz accesible",
    objecionesEsperadas: [
      "El pago mensual me parece muy alto para nuestro presupuesto",
      "¿Cuánto necesito de enganche? No tengo mucho efectivo disponible",
      "¿Qué pasa si mi esposo pierde el trabajo?",
      "¿No hay opciones más baratas que una Sienna?",
      "Me preocupa endeudarme por tantos años"
    ],
    respuestasSugeridas: [
      "Entiendo perfectamente su preocupación. Podemos estructurar el crédito a mayor plazo para reducir la mensualidad, y tenemos opciones de seguro de desempleo incluido",
      "Trabajamos con enganches desde el 10%. Su sedán actual puede servir como parte del enganche, y tenemos promociones especiales para familias",
      "Excelente que piensen en eso. Nuestros créditos incluyen seguro de desempleo y opciones de refinanciamiento en caso de dificultades económicas",
      "La Sienna es la mejor inversión a largo plazo para familias grandes. Su seguridad, espacio y confiabilidad justifican la diferencia de precio",
      "Es natural esa preocupación. Un crédito automotriz bien estructurado es una inversión en la seguridad y comodidad de su familia en crecimiento"
    ],
    metricasExito: [
      "Identificar 5 necesidades específicas de la familia en crecimiento",
      "Estructurar plan de financiamiento accesible",
      "Superar objeciones sobre capacidad de pago",
      "Demostrar valor de la Sienna vs opciones más económicas",
      "Obtener pre-aprobación de crédito"
    ],
    situacionInicial: "Sábado por la mañana, la cliente llega con su esposo y los dos niños. Se ve cansada pero emocionada. Los niños corren por el showroom mientras ella mira la Sienna con interés genuino pero preocupación visible.",
    trasfondoCliente: "Familia joven en crecimiento, ingresos estables pero comprometidos con gastos de niños pequeños. Ella valora mucho la seguridad y funcionalidad. Necesitan espacio para carriolas dobles, juguetes y equipo de bebé. Su decisión será muy racional basada en necesidades familiares reales.",
    desafiosEspecificos: [
      "Presupuesto familiar ajustado con gastos de niños pequeños",
      "Ansiedad sobre comprometerse financieramente a largo plazo",
      "Necesidad de justificar gasto mayor vs opciones más económicas",
      "Manejar interrupciones constantes de los niños durante la negociación",
      "Equilibrar necesidades actuales con crecimiento familiar futuro"
    ]
  },

  {
    id: 17,
    titulo: "Ejecutiva - Camioneta Lujo Arrendamiento",
    descripcion: "Mujer ejecutiva de 48 años, directora de una empresa de consultoría, busca camioneta de lujo BMW X7 por medio de arrendamiento puro. Interesada en beneficios fiscales y imagen ejecutiva.",
    categoria: "cierre",
    nivelDificultad: "avanzado",
    tipoCliente: "informado",
    vehiculoInteres: "BMW X7",
    presupuestoCliente: 2500000,
    duracionEstimada: 50,
    activo: true,
    dificultadPromedio: 7.8,
    completadoVeces: 0,
    puntuacionPromedio: 0,
    etiquetas: ["ejecutiva", "lujo", "arrendamiento", "BMW X7", "beneficios fiscales"],
    createdAt: "2024-09-19T10:00:00Z",
    updatedAt: "2024-09-19T10:00:00Z",
    pilaresSPCC: ["Presentación del Producto", "Manejo de Objeciones", "Negociación de Precio", "Cierre Consultivo", "Upselling y Cross-selling"],
    contextoCliente: "Directora General de empresa de consultoría con 50 empleados. Divorciada, 2 hijos universitarios. Ingresos altos, busca vehículo que proyecte éxito profesional. Conoce bien los beneficios fiscales del arrendamiento y valora la imagen ejecutiva.",
    objetivoEscenario: "Demostrar ventajas del arrendamiento puro vs compra, maximizar beneficios fiscales y cerrar venta de vehículo premium",
    objecionesEsperadas: [
      "¿No es mejor comprar que arrendar? Al final no me quedo con nada",
      "El pago mensual del arrendamiento es muy alto",
      "¿Qué pasa si excedo el kilometraje permitido?",
      "¿Realmente me conviene fiscalmente vs comprar?",
      "¿Qué sucede si quiero terminar el contrato antes?"
    ],
    respuestasSugeridas: [
      "Excelente pregunta. Para ejecutivos como usted, el arrendamiento ofrece ventajas: deducibilidad fiscal del 100%, siempre maneja vehículo nuevo con garantía, y libera capital para su negocio",
      "Entiendo su perspectiva. Consideremos que puede deducir el 100% como gasto empresarial, reduciendo significativamente el costo real mensual",
      "Nuestros contratos ejecutivos incluyen kilometraje generoso de 20,000 km anuales. Si necesita más, podemos ajustar el contrato desde el inicio",
      "Definitivamente. Como empresaria puede deducir pagos, seguros y mantenimiento. Su contador confirmará que es la opción más eficiente fiscalmente",
      "Tenemos cláusulas flexibles para ejecutivos. Puede transferir el contrato o terminarlo anticipadamente con penalizaciones mínimas"
    ],
    metricasExito: [
      "Demostrar ventajas fiscales convincentes del arrendamiento",
      "Superar objeciones sobre 'no quedarse con el vehículo'",
      "Estructurar contrato de arrendamiento atractivo",
      "Cerrar venta con servicios premium adicionales",
      "Obtener referencia de otros ejecutivos de su red"
    ],
    situacionInicial: "Martes por la tarde, cita programada. La ejecutiva llega puntual en su BMW X5 actual, bien vestida, revisa constantemente su teléfono. Tiene 1 hora disponible antes de su siguiente junta. Se ve segura y acostumbrada a tomar decisiones rápidas.",
    trasfondoCliente: "Mujer exitosa y decidida, acostumbrada a obtener lo mejor. Valora el tiempo, la eficiencia y la imagen profesional. Su vehículo es una herramienta de trabajo que debe proyectar éxito. Conoce el mercado automotriz premium y tiene expectativas altas de servicio.",
    desafiosEspecificos: [
      "Cliente muy informada que conoce opciones de financiamiento",
      "Expectativas altas de servicio y atención ejecutiva",
      "Presión de tiempo por agenda ejecutiva apretada",
      "Necesidad de justificar arrendamiento vs compra desde perspectiva empresarial",
      "Competencia directa con otros concesionarios premium",
      "Maximizar valor de venta con servicios y accesorios premium"
    ]
  }
];

// Datos adicionales para el sistema
export const CATEGORIAS_ROLEPLAY = [
  { value: 'prospectacion', label: 'Prospección Inicial', icon: 'Target' },
  { value: 'objeciones', label: 'Manejo de Objeciones', icon: 'AlertTriangle' },
  { value: 'cierre', label: 'Técnicas de Cierre', icon: 'CheckCircle' },
  { value: 'situaciones_dificiles', label: 'Situaciones Difíciles', icon: 'Brain' }
];

export const NIVELES_DIFICULTAD_ROLEPLAY = [
  { value: 'principiante', label: '⭐ Principiante', descripcion: 'Escenarios básicos para desarrollar habilidades fundamentales' },
  { value: 'medio', label: '⭐⭐ Medio', descripcion: 'Situaciones comunes con complejidad moderada' },
  { value: 'avanzado', label: '⭐⭐⭐ Avanzado', descripcion: 'Casos complejos que requieren experiencia' },
  { value: 'experto', label: '⭐⭐⭐⭐ Experto', descripcion: 'Situaciones críticas y altamente especializadas' }
];

export const VEHICULOS_DISPONIBLES = [
  'Compacto', 'Sedán', 'SUV Compacto', 'SUV Mediano', 'SUV Premium', 
  'Pickup', 'Minivan', 'Hatchback', 'Deportivo', 'Híbrido', 'Eléctrico',
  'Sedán Premium', 'Sedán Ejecutivo', 'Sedán Familiar', 'SUV Familiar'
];

export default roleplayScenarios;
