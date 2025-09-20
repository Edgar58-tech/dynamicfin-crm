const ROLEPLAY_SCENARIOS = [
  {
    titulo: "Cliente indeciso que 'necesita pensarlo'",
    descripcion: "El cliente muestra interés genuino pero constantemente dice que necesita pensarlo o consultar con su pareja. Debes trabajar para identificar las verdaderas objeciones y crear urgencia sin presionar demasiado.",
    categoria: "objeciones",
    nivelDificultad: "medio",
    tipoCliente: "indeciso",
    personalidadCliente: "Indeciso", // <-- CAMPO AÑADIDO
    vehiculoInteres: "SUV Familiar",
    presupuestoCliente: 450000,
    duracionEstimada: 20,
    objetivosAprendizaje: JSON.stringify(["Identificar objeciones reales vs falsas", "Crear urgencia apropiada", "Técnicas de cierre suave", "Manejo de la postergación"]),
    objecionesComunes: JSON.stringify(["Necesito consultarlo con mi esposa", "Déjame pensarlo unos días", "Quiero ver otras opciones primero", "No tengo prisa por decidir"]),
    contextoPreventa: "Primera visita al showroom, viene con información previa de internet",
    pilaresEvaluados: JSON.stringify([1, 2, 5, 8, 11, 13, 15]),
    etiquetas: JSON.stringify(["objeciones", "cierre", "urgencia", "consultivo"])
  },
  {
    titulo: "Cliente enfocado únicamente en el precio",
    descripcion: "Cliente que desde el inicio pregunta por descuentos y precios, compara constantemente con la competencia y parece que solo le importa conseguir el mejor precio. Debes demostrar valor más allá del precio.",
    categoria: "objeciones", 
    nivelDificultad: "medio",
    tipoCliente: "precio_sensible",
    personalidadCliente: "Sensible al Precio", // <-- CAMPO AÑADIDO
    vehiculoInteres: "Auto Compacto",
    presupuestoCliente: 280000,
    duracionEstimada: 18,
    objetivosAprendizaje: JSON.stringify(["Construcción de valor", "Manejo de objeciones de precio", "Diferenciación de la competencia", "Enfoque en beneficios vs características"]),
    objecionesComunes: JSON.stringify(["En X lugar está más barato", "¿Cuál es su mejor precio?", "¿No me puede hacer un descuento?", "Solo me interesa el más económico"]),
    contextoPreventa: "Llega comparando precios de diferentes marcas",
    pilaresEvaluados: JSON.stringify([3, 4, 6, 7, 9, 12, 14]),
    etiquetas: JSON.stringify(["precio", "valor", "competencia", "descuentos"])
  },
  {
    titulo: "Cliente técnico con conocimiento avanzado",
    descripcion: "Cliente que conoce muy bien las especificaciones técnicas, hace preguntas muy específicas sobre motor, transmisión, seguridad y tecnología. Puede intimidar con su conocimiento pero respeta la expertise.",
    categoria: "prospectacion",
    nivelDificultad: "avanzado", 
    tipoCliente: "tecnico",
    personalidadCliente: "Técnico", // <-- CAMPO AÑADIDO
    vehiculoInteres: "Sedán Premium",
    presupuestoCliente: 850000,
    duracionEstimada: 25,
    objetivosAprendizaje: JSON.stringify(["Demostrar expertise técnica", "Manejo de clientes conocedores", "Equilibrio entre datos y emociones", "Credibilidad profesional"]),
    objecionesComunes: JSON.stringify(["¿Este motor tiene turbo lag?", "¿Qué tipo de suspensión usa?", "Los datos de consumo no me convencen", "He leído que tiene problemas de X"]),
    contextoPreventa: "Viene con información técnica detallada, posible entusiasta automotriz",
    pilaresEvaluados: JSON.stringify([2, 4, 6, 10, 11, 14, 15]),
    etiquetas: JSON.stringify(["técnico", "especificaciones", "motor", "expertise"])
  },
  {
    titulo: "Cliente impulsivo que quiere comprar rápido",
    descripcion: "Cliente que muestra interés inmediato y quiere comprar el mismo día. Hay que mantener el momentum pero asegurar que sea una decisión informada y adecuada a sus necesidades reales.",
    categoria: "cierre",
    nivelDificultad: "medio",
    tipoCliente: "impulsivo",
    personalidadCliente: "Impulsivo", // <-- CAMPO AÑADIDO
    vehiculoInteres: "Pickup Mediana",
    presupuestoCliente: 620000,
    duracionEstimada: 15,
    objetivosAprendizaje: JSON.stringify(["Manejo de clientes impulsivos", "Cierre rápido pero responsable", "Confirmación de necesidades", "Prevención de remordimiento post-compra"]),
    objecionesComunes: JSON.stringify(["¿Lo puedo llevar hoy?", "¿Qué necesito firmar?", "No necesito test drive", "Déme el mejor precio y cerramos"]),
    contextoPreventa: "Necesidad inmediata por cambio de trabajo o vehículo dañado",
    pilaresEvaluados: JSON.stringify([1, 3, 7, 8, 12, 13, 15]),
    etiquetas: JSON.stringify(["impulsivo", "cierre rápido", "urgencia", "momentum"])
  },
  {
    titulo: "Cliente con trade-in complicado",
    descripcion: "Cliente que quiere dar su auto usado como parte del pago, pero el vehículo tiene problemas (chocado, con adeudo, documentos irregulares). Debes manejar sus expectativas sobre el valor y encontrar soluciones.",
    categoria: "situaciones_dificiles",
    nivelDificultad: "avanzado",
    tipoCliente: "desconfiado",
    personalidadCliente: "Desconfiado", // <-- CAMPO AÑADIDO
    vehiculoInteres: "SUV Mediana",
    presupuestoCliente: 520000,
    duracionEstimada: 30,
    objetivosAprendizaje: JSON.stringify(["Evaluación honesta de trade-in", "Manejo de expectativas", "Búsqueda de soluciones alternativas", "Transparencia en procesos"]),
    objecionesComunes: JSON.stringify(["Mi auto vale más que eso", "En internet sale a mejor precio", "¿Por qué tanto papeleo?", "Ustedes se quieren aprovechar"]),
    contextoPreventa: "Auto con problemas evidentes pero cliente sobrevalúa su vehículo",
    pilaresEvaluados: JSON.stringify([2, 5, 6, 9, 10, 11, 14]),
    etiquetas: JSON.stringify(["trade-in", "usado", "expectativas", "transparencia"])
  },
  {
    titulo: "Cliente comparando con la competencia",
    descripcion: "Cliente que está evaluando varias marcas y constantemente menciona ofertas de otros concesionarios. Necesitas diferenciarte sin atacar a la competencia y demostrar tu propuesta de valor única.",
    categoria: "objeciones",
    nivelDificultad: "medio",
    tipoCliente: "informado",
    personalidadCliente: "Informado", // <-- CAMPO AÑADIDO
    vehiculoInteres: "Hatchback Premium", 
    presupuestoCliente: 380000,
    duracionEstimada: 22,
    objetivosAprendizaje: JSON.stringify(["Diferenciación vs competencia", "Propuesta de valor única", "Manejo profesional de comparaciones", "Enfoque en beneficios propios"]),
    objecionesComunes: JSON.stringify(["En Toyota me dan más por mi auto", "Honda me ofrece más accesorios", "¿Qué me hace mejor que Ford?", "Todos dicen lo mismo"]),
    contextoPreventa: "Ha visitado múltiples concesionarios y tiene cotizaciones de la competencia",
    pilaresEvaluados: JSON.stringify([3, 4, 7, 8, 12, 13, 14]),
    etiquetas: JSON.stringify(["competencia", "comparación", "diferenciación", "valor"])
  },
  {
    titulo: "Cliente con presupuesto muy limitado",
    descripcion: "Cliente que realmente quiere un auto pero su presupuesto está muy por debajo de las opciones disponibles. Debes ser creativo con opciones de financiamiento y alternativas sin frustrarlo.",
    categoria: "situaciones_dificiles",
    nivelDificultad: "medio",
    tipoCliente: "precio_sensible",
    personalidadCliente: "Sensible al Precio", // <-- CAMPO AÑADIDO
    vehiculoInteres: "Auto Básico",
    presupuestoCliente: 180000,
    duracionEstimada: 25,
    objetivosAprendizaje: JSON.stringify(["Opciones de financiamiento creativas", "Manejo empático de limitaciones", "Alternativas realistas", "Construcción de relación a futuro"]),
    objecionesComunes: JSON.stringify(["No me alcanza para ese precio", "¿No tienen algo más barato?", "¿Me pueden financiar el 100%?", "Está fuera de mi alcance"]),
    contextoPreventa: "Necesidad real pero recursos limitados, posible primer auto",
    pilaresEvaluados: JSON.stringify([1, 2, 5, 7, 9, 11, 13]),
    etiquetas: JSON.stringify(["presupuesto", "financiamiento", "empático", "primer auto"])
  },
  {
    titulo: "Cliente buscando financiamiento específico",
    descripcion: "Cliente preaprobado por su banco que busca condiciones muy específicas de financiamiento y quiere que respetes sus términos. Debes trabajar con sus condiciones mientras ofreces alternativas que puedan beneficiarlo.",
    categoria: "prospectacion",
    nivelDificultad: "medio",
    tipoCliente: "informado",
    personalidadCliente: "Informado", // <-- CAMPO AÑADIDO
    vehiculoInteres: "Sedán Ejecutivo",
    presupuestoCliente: 750000,
    duracionEstimada: 20,
    objetivosAprendizaje: JSON.stringify(["Manejo de clientes pre-aprobados", "Opciones de financiamiento competitivas", "Flexibilidad en términos", "Valor agregado en el servicio"]),
    objecionesComunes: JSON.stringify(["Mi banco me da mejor tasa", "Solo acepto estos términos", "¿Pueden igualar mi preaprobación?", "No quiero cambiar de financiera"]),
    contextoPreventa: "Viene con preaprobación bancaria y términos específicos",
    pilaresEvaluados: JSON.stringify([3, 6, 7, 9, 10, 12, 15]),
    etiquetas: JSON.stringify(["financiamiento", "preaprobado", "banco", "términos"])
  },
  {
    titulo: "Cliente insatisfecho con servicio anterior",
    descripcion: "Cliente que tuvo una mala experiencia previa con la marca o concesionario. Viene con desconfianza y necesitas reconstruir la relación mientras abordas sus preocupaciones pasadas.",
    categoria: "situaciones_dificiles",
    nivelDificultad: "avanzado",
    tipoCliente: "desconfiado",
    personalidadCliente: "Desconfiado", // <-- CAMPO AÑADIDO
    vehiculoInteres: "SUV Grande",
    presupuestoCliente: 920000,
    duracionEstimada: 35,
    objetivosAprendizaje: JSON.stringify(["Reconstrucción de confianza", "Manejo de clientes insatisfechos", "Escucha activa de quejas", "Diferenciación del servicio actual"]),
    objecionesComunes: JSON.stringify(["La última vez me trataron mal", "No confío en esta marca", "¿Cómo sé que no pasará lo mismo?", "Ustedes no cumplen lo prometido"]),
    contextoPreventa: "Experiencia negativa previa documentada, segunda oportunidad",
    pilaresEvaluados: JSON.stringify([1, 2, 5, 8, 10, 11, 13]),
    etiquetas: JSON.stringify(["insatisfecho", "confianza", "servicio", "segunda oportunidad"])
  },
  {
    titulo: "Cliente con acompañante influyente",
    descripcion: "Cliente interesado que viene con pareja, padre o amigo que tiene opiniones fuertes y puede influir negativamente en la decisión. Debes manejar las dinámicas grupales y ganar la confianza de ambas partes.",
    categoria: "situaciones_dificiles",
    nivelDificultad: "avanzado",
    tipoCliente: "indeciso",
    personalidadCliente: "Acompañante Influyente", // <-- CAMPO AÑADIDO
    vehiculoInteres: "SUV Familiar Premium",
    presupuestoCliente: 680000,
    duracionEstimada: 28,
    objetivosAprendizaje: JSON.stringify(["Manejo de dinámicas grupales", "Identificación del decision maker", "Inclusión de todos los participantes", "Neutralización de influencias negativas"]),
    objecionesComunes: JSON.stringify(["A mí no me convence este auto", "¿No crees que es muy caro?", "Yo conozco mejores opciones", "Mejor vamos a ver en otro lado"]),
    contextoPreventa: "Cliente principal interesado pero acompañante escéptico o negativo",
    pilaresEvaluados: JSON.stringify([1, 2, 4, 8, 11, 13, 14]),
    etiquetas: JSON.stringify(["grupo", "influencia", "dinámicas", "acompañante"])
  }
];