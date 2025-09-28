
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seed() {
  console.log('🌱 Starting database seeding...');

  try {
    // ============== 1. GRUPOS AUTOMOTRICES Y AGENCIAS ==============
    console.log('📊 Creating automotive groups and agencies...');

    const grupoNissan = await prisma.grupoAutomotriz.create({
      data: {
        nombreGrupo: 'Grupo Automotriz del Centro',
        direccion: 'Av. Universidad 1200, Col. Centro, CDMX',
        email: 'contacto@grupoautomotriz.mx',
        paginaWeb: 'https://grupoautomotriz.mx',
        activo: true
      }
    });

    const grupoBMW = await prisma.grupoAutomotriz.create({
      data: {
        nombreGrupo: 'Premium Motors Group',
        direccion: 'Blvd. Manuel Ávila Camacho 184, Polanco, CDMX',
        email: 'info@premiummotors.mx',
        paginaWeb: 'https://premiummotors.mx',
        activo: true
      }
    });

    // Marcas
    const marcaNissan = await prisma.marca.create({
      data: {
        nombreMarca: 'Nissan',
        grupoId: grupoNissan.id,
        activo: true
      }
    });

    const marcaBMW = await prisma.marca.create({
      data: {
        nombreMarca: 'BMW',
        grupoId: grupoBMW.id,
        activo: true
      }
    });

    const marcaMercedes = await prisma.marca.create({
      data: {
        nombreMarca: 'Mercedes-Benz',
        grupoId: grupoBMW.id,
        activo: true
      }
    });

    // Agencias
    const agenciaNissanSatellite = await prisma.agencia.create({
      data: {
        nombreAgencia: 'Nissan Satélite',
        marcaId: marcaNissan.id,
        direccion: 'Circuito Comercial Satélite, Naucalpan, EdoMex',
        telefono: '55-5555-0001',
        email: 'ventas@nissansatellite.mx',
        gerente: 'Roberto Mendoza',
        tierServicio: 'PROFESIONAL',
        limiteGrabacionesMes: 500,
        costosPorGrabacion: 3.50
      }
    });

    const agenciaBMWPolanco = await prisma.agencia.create({
      data: {
        nombreAgencia: 'BMW Polanco',
        marcaId: marcaBMW.id,
        direccion: 'Av. Presidente Masaryk 111, Polanco, CDMX',
        telefono: '55-5555-0002',
        email: 'ventas@bmwpolanco.mx',
        gerente: 'María Elena Vásquez',
        tierServicio: 'PREMIUM',
        limiteGrabacionesMes: 2000,
        costosPorGrabacion: 5.00
      }
    });

    const agenciaMercedesSantaFe = await prisma.agencia.create({
      data: {
        nombreAgencia: 'Mercedes-Benz Santa Fe',
        marcaId: marcaMercedes.id,
        direccion: 'Av. Santa Fe 94, Santa Fe, CDMX',
        telefono: '55-5555-0003',
        email: 'ventas@mercedessantafe.mx',
        gerente: 'Carlos Alberto López',
        tierServicio: 'PREMIUM',
        limiteGrabacionesMes: 2000,
        costosPorGrabacion: 5.50
      }
    });

    // ============== 2. CATÁLOGO DE VEHÍCULOS ==============
    console.log('🚗 Creating vehicle catalog...');

    const vehiculosCatalogo = await Promise.all([
      // Nissan
      prisma.vehiculoCatalogo.create({
        data: { marca: 'Nissan', modelo: 'Sentra', year: 2024 }
      }),
      prisma.vehiculoCatalogo.create({
        data: { marca: 'Nissan', modelo: 'Altima', year: 2024 }
      }),
      prisma.vehiculoCatalogo.create({
        data: { marca: 'Nissan', modelo: 'X-Trail', year: 2024 }
      }),
      prisma.vehiculoCatalogo.create({
        data: { marca: 'Nissan', modelo: 'Kicks', year: 2024 }
      }),
      // BMW
      prisma.vehiculoCatalogo.create({
        data: { marca: 'BMW', modelo: 'Serie 3', year: 2024 }
      }),
      prisma.vehiculoCatalogo.create({
        data: { marca: 'BMW', modelo: 'X3', year: 2024 }
      }),
      prisma.vehiculoCatalogo.create({
        data: { marca: 'BMW', modelo: 'X5', year: 2024 }
      }),
      // Mercedes
      prisma.vehiculoCatalogo.create({
        data: { marca: 'Mercedes-Benz', modelo: 'Clase C', year: 2024 }
      }),
      prisma.vehiculoCatalogo.create({
        data: { marca: 'Mercedes-Benz', modelo: 'GLC', year: 2024 }
      })
    ]);

    // ============== 3. INVENTARIO REAL ==============
    console.log('📦 Creating vehicle inventory...');

    await Promise.all([
      // Inventory Nissan Satélite
      prisma.vehiculo.create({
        data: {
          agenciaId: agenciaNissanSatellite.id,
          marca: 'Nissan',
          modelo: 'Sentra',
          year: 2024,
          version: 'Advance CVT',
          precio: 389900,
          color: 'Blanco',
          kilometraje: 0,
          estatus: 'Disponible',
          numeroSerie: 'JN1MBCLD4PW123456'
        }
      }),
      prisma.vehiculo.create({
        data: {
          agenciaId: agenciaNissanSatellite.id,
          marca: 'Nissan',
          modelo: 'X-Trail',
          year: 2024,
          version: 'Exclusive',
          precio: 549900,
          color: 'Negro',
          kilometraje: 0,
          estatus: 'Disponible',
          numeroSerie: 'JN1TBCLD4PW789012'
        }
      }),
      // Inventory BMW Polanco
      prisma.vehiculo.create({
        data: {
          agenciaId: agenciaBMWPolanco.id,
          marca: 'BMW',
          modelo: 'Serie 3',
          year: 2024,
          version: '320i Sport Line',
          precio: 899000,
          color: 'Azul Alpine',
          kilometraje: 0,
          estatus: 'Disponible',
          numeroSerie: 'WBA3A9C55PW345678'
        }
      })
    ]);

    // ============== 4. USUARIOS CON ROLES REALES ==============
    console.log('👥 Creating users with realistic roles...');

    const hashedPassword = await bcrypt.hash('demo123', 10);

    // Director General
    const directorGeneral = await prisma.user.create({
      data: {
        email: 'director@dinamicfin.com',
        nombre: 'Ricardo',
        apellido: 'Salinas Torres',
        password: hashedPassword,
        rol: 'DIRECTOR_GENERAL',
        grupoId: grupoNissan.id,
        activo: true
      }
    });

    // Gerente General Nissan
    const gerenteNissan = await prisma.user.create({
      data: {
        email: 'gerente.nissan@dinamicfin.com',
        nombre: 'Roberto',
        apellido: 'Mendoza García',
        password: hashedPassword,
        rol: 'GERENTE_GENERAL',
        agenciaId: agenciaNissanSatellite.id,
        marcaId: marcaNissan.id,
        grupoId: grupoNissan.id,
        activo: true
      }
    });

    // Gerente Ventas BMW
    const gerenteBMW = await prisma.user.create({
      data: {
        email: 'gerente.bmw@dinamicfin.com',
        nombre: 'María Elena',
        apellido: 'Vásquez Hernández',
        password: hashedPassword,
        rol: 'GERENTE_VENTAS',
        agenciaId: agenciaBMWPolanco.id,
        marcaId: marcaBMW.id,
        grupoId: grupoBMW.id,
        activo: true
      }
    });

    // Coordinador Centro de Leads
    const coordinadorLeads = await prisma.user.create({
      data: {
        email: 'leads@dinamicfin.com',
        nombre: 'Ana Patricia',
        apellido: 'Jiménez Cruz',
        password: hashedPassword,
        rol: 'CENTRO_LEADS',
        agenciaId: agenciaNissanSatellite.id,
        marcaId: marcaNissan.id,
        activo: true
      }
    });

    // Vendedores
    const vendedores = await Promise.all([
      prisma.user.create({
        data: {
          email: 'carlos.venta@dinamicfin.com',
          nombre: 'Carlos',
          apellido: 'Venta Silva',
          password: hashedPassword,
          rol: 'VENDEDOR',
          agenciaId: agenciaNissanSatellite.id,
          marcaId: marcaNissan.id,
          cargaProspectos: 0,
          activo: true
        }
      }),
      prisma.user.create({
        data: {
          email: 'lucia.ventas@dinamicfin.com',
          nombre: 'Lucía',
          apellido: 'Ventas Martínez',
          password: hashedPassword,
          rol: 'VENDEDOR',
          agenciaId: agenciaNissanSatellite.id,
          marcaId: marcaNissan.id,
          cargaProspectos: 0,
          activo: true
        }
      }),
      prisma.user.create({
        data: {
          email: 'miguel.sales@dinamicfin.com',
          nombre: 'Miguel',
          apellido: 'Sales Rodríguez',
          password: hashedPassword,
          rol: 'VENDEDOR',
          agenciaId: agenciaBMWPolanco.id,
          marcaId: marcaBMW.id,
          cargaProspectos: 0,
          activo: true
        }
      })
    ]);

    // ============== 5. PILARES SPPC (15 PILARES REALES) ==============
    console.log('🎯 Creating SPPC 15-pillar system...');

    const pilares = await Promise.all([
      // Fase 1 - Identificación Inicial (4 pilares)
      prisma.pilar.create({
        data: {
          nombrePilar: 'Capacidad Económica',
          descripcion: 'Evalúa la capacidad financiera real del prospecto para adquirir el vehículo',
          pesoEstrategico: 0.1500, // 15%
          faseEvaluacion: 1,
          activo: true
        }
      }),
      prisma.pilar.create({
        data: {
          nombrePilar: 'Urgencia de Compra',
          descripcion: 'Determina qué tan urgente es la necesidad del prospecto',
          pesoEstrategico: 0.1200, // 12%
          faseEvaluacion: 1,
          activo: true
        }
      }),
      prisma.pilar.create({
        data: {
          nombrePilar: 'Vehículo Actual',
          descripcion: 'Evalúa la situación del vehículo que actualmente posee',
          pesoEstrategico: 0.1000, // 10%
          faseEvaluacion: 1,
          activo: true
        }
      }),
      prisma.pilar.create({
        data: {
          nombrePilar: 'Autoridad de Compra',
          descripcion: 'Identifica si es quien toma las decisiones de compra',
          pesoEstrategico: 0.1100, // 11%
          faseEvaluacion: 1,
          activo: true
        }
      }),

      // Fase 2 - Profundización y Necesidades (6 pilares)
      prisma.pilar.create({
        data: {
          nombrePilar: 'Necesidades Específicas',
          descripcion: 'Comprende las necesidades exactas que busca cubrir',
          pesoEstrategico: 0.0900, // 9%
          faseEvaluacion: 2,
          activo: true
        }
      }),
      prisma.pilar.create({
        data: {
          nombrePilar: 'Experiencia Previa',
          descripcion: 'Historial de compra de vehículos y satisfacción',
          pesoEstrategico: 0.0600, // 6%
          faseEvaluacion: 2,
          activo: true
        }
      }),
      prisma.pilar.create({
        data: {
          nombrePilar: 'Proceso de Investigación',
          descripcion: 'Evalúa cuánto ha investigado y comparado opciones',
          pesoEstrategico: 0.0700, // 7%
          faseEvaluacion: 2,
          activo: true
        }
      }),
      prisma.pilar.create({
        data: {
          nombrePilar: 'Sensibilidad al Precio',
          descripcion: 'Determina flexibilidad en negociación y presupuesto',
          pesoEstrategico: 0.0800, // 8%
          faseEvaluacion: 2,
          activo: true
        }
      }),
      prisma.pilar.create({
        data: {
          nombrePilar: 'Confianza en la Marca',
          descripcion: 'Nivel de confianza y percepción de la marca',
          pesoEstrategico: 0.0700, // 7%
          faseEvaluacion: 2,
          activo: true
        }
      }),
      prisma.pilar.create({
        data: {
          nombrePilar: 'Red de Influencia',
          descripcion: 'Personas que influyen en su decisión de compra',
          pesoEstrategico: 0.0500, // 5%
          faseEvaluacion: 2,
          activo: true
        }
      }),

      // Fase 3 - Cierre y Conversión (5 pilares)
      prisma.pilar.create({
        data: {
          nombrePilar: 'Objeciones Identificadas',
          descripcion: 'Principales objeciones y su potencial resolución',
          pesoEstrategico: 0.0600, // 6%
          faseEvaluacion: 3,
          activo: true
        }
      }),
      prisma.pilar.create({
        data: {
          nombrePilar: 'Timing de Compra',
          descripcion: 'Marco temporal específico para la compra',
          pesoEstrategico: 0.0700, // 7%
          faseEvaluacion: 3,
          activo: true
        }
      }),
      prisma.pilar.create({
        data: {
          nombrePilar: 'Compromiso Emocional',
          descripcion: 'Conexión emocional con el vehículo y proceso',
          pesoEstrategico: 0.0600, // 6%
          faseEvaluacion: 3,
          activo: true
        }
      }),
      prisma.pilar.create({
        data: {
          nombrePilar: 'Competencia Directa',
          descripcion: 'Otras opciones que está considerando activamente',
          pesoEstrategico: 0.0500, // 5%
          faseEvaluacion: 3,
          activo: true
        }
      }),
      prisma.pilar.create({
        data: {
          nombrePilar: 'Facilidad de Cierre',
          descripcion: 'Probabilidad de conversión basada en todos los factores',
          pesoEstrategico: 0.0500, // 5%
          faseEvaluacion: 3,
          activo: true
        }
      })
    ]);

    console.log(`✅ Created ${pilares.length} SPPC pillars (Total weight: ${pilares.reduce((sum, p) => sum + Number(p.pesoEstrategico), 0)})`);

    // ============== 6. PROSPECTOS CON CALIFICACIONES REALES ==============
    console.log('📋 Creating prospects with realistic data...');

    const prospectos = await Promise.all([
      // Prospecto Elite
      prisma.prospecto.create({
        data: {
          nombre: 'María Fernanda',
          apellido: 'Rodríguez Gutiérrez',
          email: 'maria.rodriguez@empresa.com',
          telefono: '55-1234-5678',
          vendedorId: vendedores[0].id, // Carlos
          coordinadorId: coordinadorLeads.id,
          agenciaId: agenciaNissanSatellite.id,
          estatus: 'Calificado',
          estadoAsignacion: 'CONTACTADO',
          origenLead: 'LLAMADA_ENTRANTE',
          calificacionTotal: 92.50,
          clasificacion: 'Elite',
          vehiculoInteresId: vehiculosCatalogo[1].id, // Altima
          presupuesto: 450000,
          nivelUrgencia: 'ALTA',
          tiempoEsperado: 'INMEDIATO',
          acompanantes: 'PAREJA',
          notas: 'Cliente premium con alta capacidad de compra, requiere entrega inmediata por vencimiento de leasing actual.'
        }
      }),
      // Prospecto Calificado
      prisma.prospecto.create({
        data: {
          nombre: 'José Luis',
          apellido: 'Martínez Díaz',
          email: 'joseluis.martinez@gmail.com',
          telefono: '55-2345-6789',
          vendedorId: vendedores[1].id, // Lucía
          coordinadorId: coordinadorLeads.id,
          agenciaId: agenciaNissanSatellite.id,
          estatus: 'Contactado',
          estadoAsignacion: 'CONTACTADO',
          origenLead: 'VISITA_SHOWROOM',
          calificacionTotal: 78.30,
          clasificacion: 'Calificado',
          vehiculoInteresId: vehiculosCatalogo[0].id, // Sentra
          presupuesto: 400000,
          nivelUrgencia: 'MEDIA',
          tiempoEsperado: '1_SEMANA',
          acompanantes: 'FAMILIA',
          notas: 'Interesado en financiamiento, visitó showroom el fin de semana con familia.'
        }
      }),
      // Prospecto A Madurar
      prisma.prospecto.create({
        data: {
          nombre: 'Ana Cristina',
          apellido: 'García López',
          email: 'ana.garcia@empresa.mx',
          telefono: '55-3456-7890',
          vendedorId: vendedores[0].id, // Carlos
          coordinadorId: coordinadorLeads.id,
          agenciaId: agenciaNissanSatellite.id,
          estatus: 'Nuevo',
          estadoAsignacion: 'ASIGNADO',
          origenLead: 'OTROS',
          calificacionTotal: 65.20,
          clasificacion: 'A Madurar',
          vehiculoInteresId: vehiculosCatalogo[3].id, // Kicks
          presupuesto: 350000,
          nivelUrgencia: 'BAJA',
          tiempoEsperado: '1_MES',
          acompanantes: 'SOLO',
          notas: 'Primer auto, necesita más información sobre financiamiento y garantías.'
        }
      }),
      // Prospecto BMW Premium
      prisma.prospecto.create({
        data: {
          nombre: 'Alejandro',
          apellido: 'Domínguez Villanueva',
          email: 'alejandro@empresapremium.com',
          telefono: '55-4567-8901',
          vendedorId: vendedores[2].id, // Miguel
          coordinadorId: coordinadorLeads.id,
          agenciaId: agenciaBMWPolanco.id,
          estatus: 'Calificado',
          estadoAsignacion: 'CONTACTADO',
          origenLead: 'VISITA_SHOWROOM',
          calificacionTotal: 88.70,
          clasificacion: 'Elite',
          vehiculoInteresId: vehiculosCatalogo[4].id, // BMW Serie 3
          presupuesto: 1200000,
          nivelUrgencia: 'ALTA',
          tiempoEsperado: 'INMEDIATO',
          acompanantes: 'PAREJA',
          notas: 'Cliente corporativo VIP, busca vehículo ejecutivo con especificaciones premium.'
        }
      }),
      // Prospecto Explorador
      prisma.prospecto.create({
        data: {
          nombre: 'Carmen',
          apellido: 'Mendoza Rivas',
          email: 'carmen.mendoza@yahoo.com',
          telefono: '55-5678-9012',
          agenciaId: agenciaNissanSatellite.id,
          estatus: 'Nuevo',
          estadoAsignacion: 'PENDIENTE',
          origenLead: 'LLAMADA_ENTRANTE',
          calificacionTotal: 45.80,
          clasificacion: 'Explorador',
          vehiculoInteres: 'SUV económica',
          presupuesto: 280000,
          nivelUrgencia: 'BAJA',
          tiempoEsperado: 'FLEXIBLE',
          acompanantes: 'FAMILIA',
          notas: 'Llamada informativa, sin urgencia definida, explorando opciones del mercado.'
        }
      })
    ]);

    // ============== 7. CALIFICACIONES DETALLADAS ==============
    console.log('📊 Creating detailed SPCC evaluations...');

    // Calificaciones para María (Elite - 92.50)
    const calificacionesMaria = [];
    for (let i = 0; i < pilares.length; i++) {
      const pilar = pilares[i];
      let puntaje = 0;
      
      // Distribución realista para cliente Elite
      if (i < 4) puntaje = Math.random() * 15 + 85; // Fase 1: 85-100
      else if (i < 10) puntaje = Math.random() * 10 + 80; // Fase 2: 80-90
      else puntaje = Math.random() * 8 + 87; // Fase 3: 87-95

      calificacionesMaria.push(
        prisma.calificacion.create({
          data: {
            prospectoId: prospectos[0].id,
            pilarId: pilar.id,
            puntajeObtenido: Math.round(puntaje),
            notas: `Evaluación detallada del pilar ${pilar.nombrePilar} - Cliente premium`
          }
        })
      );
    }

    // Calificaciones para José Luis (Calificado - 78.30)
    const calificacionesJose = [];
    for (let i = 0; i < pilares.length; i++) {
      const pilar = pilares[i];
      let puntaje = 0;
      
      // Distribución realista para cliente Calificado
      if (i < 4) puntaje = Math.random() * 20 + 70; // Fase 1: 70-90
      else if (i < 10) puntaje = Math.random() * 15 + 65; // Fase 2: 65-80
      else puntaje = Math.random() * 20 + 60; // Fase 3: 60-80

      calificacionesJose.push(
        prisma.calificacion.create({
          data: {
            prospectoId: prospectos[1].id,
            pilarId: pilar.id,
            puntajeObtenido: Math.round(puntaje),
            notas: `Evaluación ${pilar.nombrePilar} - Cliente con potencial medio-alto`
          }
        })
      );
    }

    await Promise.all([...calificacionesMaria, ...calificacionesJose]);

    // ============== 8. CONFIGURACIONES CRM REALES ==============
    console.log('🔗 Creating CRM integrations...');

    const crmSalesforce = await prisma.crmConfiguration.create({
      data: {
        agenciaId: agenciaNissanSatellite.id,
        nombre: 'Salesforce Principal',
        crmTipo: 'salesforce',
        crmApiUrl: 'https://na123.salesforce.com',
        crmApiKey: 'sf_demo_key_12345',
        crmSecretKey: 'sf_demo_secret_67890',
        webhookUrl: 'https://dinamicfin.mx/webhook/salesforce',
        webhookSecret: 'webhook_secret_abc123',
        activo: true,
        sincronizacionBidireccional: true,
        frecuenciaSincronizacion: 15,
        configuracionAvanzada: JSON.stringify({
          sandbox: true,
          version: 'v58.0',
          objectMappings: {
            Lead: 'Prospecto',
            Account: 'Cliente',
            Opportunity: 'Venta'
          }
        })
      }
    });

    const crmSICOP = await prisma.crmConfiguration.create({
      data: {
        agenciaId: agenciaBMWPolanco.id,
        nombre: 'SICOP BMW',
        crmTipo: 'custom',
        crmApiUrl: 'https://api.sicop.mx/v2',
        crmApiKey: 'sicop_demo_key_98765',
        crmSecretKey: 'sicop_demo_secret_54321',
        activo: true,
        sincronizacionBidireccional: true,
        frecuenciaSincronizacion: 30,
        configuracionAvanzada: JSON.stringify({
          dealerCode: 'BMW_POLANCO_001',
          region: 'CENTRO_MX',
          syncTypes: ['prospects', 'sales', 'inventory']
        })
      }
    });

    // Field mappings para Salesforce
    await Promise.all([
      prisma.crmFieldMapping.create({
        data: {
          crmConfigurationId: crmSalesforce.id,
          entidad: 'prospecto',
          campoDynamicFin: 'nombre',
          campoCrm: 'FirstName',
          tipoDato: 'string',
          direccionSincronizacion: 'bidireccional',
          requerido: true
        }
      }),
      prisma.crmFieldMapping.create({
        data: {
          crmConfigurationId: crmSalesforce.id,
          entidad: 'prospecto',
          campoDynamicFin: 'apellido',
          campoCrm: 'LastName',
          tipoDato: 'string',
          direccionSincronizacion: 'bidireccional',
          requerido: true
        }
      }),
      prisma.crmFieldMapping.create({
        data: {
          crmConfigurationId: crmSalesforce.id,
          entidad: 'prospecto',
          campoDynamicFin: 'email',
          campoCrm: 'Email',
          tipoDato: 'string',
          direccionSincronizacion: 'bidireccional',
          requerido: false
        }
      })
    ]);

    // ============== 9. ROLE PLAY SCENARIOS REALES ==============
    console.log('🎭 Creating role play scenarios...');

    await Promise.all([
      prisma.rolePlayScenario.create({
        data: {
          titulo: 'Cliente Indeciso con Objeciones de Precio',
          descripcion: 'Un cliente que demuestra interés pero constantemente objeta el precio y compara con competencia.',
          categoria: 'objection_handling',
          nivelDificultad: 'medio',
          tipoCliente: 'indeciso',
          personalidadCliente: JSON.stringify({
            personalidad: 'analítico',
            tonoComunicacion: 'formal',
            nivelConocimiento: 'medio',
            principalMotivacion: 'precio'
          }),
          vehiculoInteres: 'Nissan Sentra 2024',
          presupuestoCliente: 350000,
          objetivosAprendizaje: JSON.stringify([
            'Manejo de objeciones de precio',
            'Presentación de valor agregado',
            'Técnicas de cierre consultivo'
          ]),
          objecionesComunes: JSON.stringify([
            'Está muy caro comparado con la competencia',
            'En otra agencia me lo ofrecen más barato',
            'Necesito pensarlo mejor'
          ]),
          contextoPreventa: 'Cliente llama por teléfono después de ver publicidad online. Ha visitado 2 agencias previamente.',
          duracionEstimada: 20,
          pilaresEvaluados: JSON.stringify([1, 2, 8, 11, 14]),
          etiquetas: JSON.stringify(['precio', 'objeciones', 'competencia', 'telefono']),
          activo: true
        }
      }),
      prisma.rolePlayScenario.create({
        data: {
          titulo: 'Cliente VIP con Urgencia de Entrega',
          descripcion: 'Cliente corporativo premium que necesita vehículo ejecutivo con entrega inmediata.',
          categoria: 'vip_handling',
          nivelDificultad: 'alto',
          tipoCliente: 'vip',
          personalidadCliente: JSON.stringify({
            personalidad: 'ejecutivo',
            tonoComunicacion: 'directo',
            nivelConocimiento: 'alto',
            principalMotivacion: 'estatus'
          }),
          vehiculoInteres: 'BMW Serie 3 2024',
          presupuestoCliente: 1200000,
          objetivosAprendizaje: JSON.stringify([
            'Atención VIP personalizada',
            'Gestión de expectativas premium',
            'Proceso de cierre acelerado'
          ]),
          objecionesComunes: JSON.stringify([
            'Necesito el vehículo la próxima semana',
            'Quiero todas las opciones premium incluidas',
            'El proceso debe ser expedito'
          ]),
          contextoPreventa: 'Ejecutivo de empresa Fortune 500 que necesita reemplazar vehículo corporativo.',
          duracionEstimada: 30,
          pilaresEvaluados: JSON.stringify([1, 2, 4, 12, 15]),
          etiquetas: JSON.stringify(['vip', 'urgente', 'corporativo', 'premium']),
          activo: true
        }
      }),
      prisma.rolePlayScenario.create({
        data: {
          titulo: 'Primera Compra de Auto',
          descripcion: 'Cliente joven comprando su primer vehículo, con dudas sobre financiamiento y garantías.',
          categoria: 'first_time_buyer',
          nivelDificultad: 'facil',
          tipoCliente: 'primerizo',
          personalidadCliente: JSON.stringify({
            personalidad: 'cauteloso',
            tonoComunicacion: 'amigable',
            nivelConocimiento: 'bajo',
            principalMotivacion: 'seguridad'
          }),
          vehiculoInteres: 'Nissan Kicks 2024',
          presupuestoCliente: 320000,
          objetivosAprendizaje: JSON.stringify([
            'Educación sobre financiamiento',
            'Explicación de garantías',
            'Construcción de confianza'
          ]),
          objecionesComunes: JSON.stringify([
            'Es mi primer auto, no sé si es la mejor opción',
            '¿Qué incluye la garantía?',
            '¿Cuánto pagaría mensualmente?'
          ]),
          contextoPreventa: 'Joven profesionista de 26 años, recién egresado, busca auto para trabajo.',
          duracionEstimada: 25,
          pilaresEvaluados: JSON.stringify([1, 3, 5, 6, 13]),
          etiquetas: JSON.stringify(['primerizo', 'financiamiento', 'garantia', 'joven']),
          activo: true
        }
      })
    ]);

    // ============== 10. MÉTRICAS Y ESTADÍSTICAS REALES ==============
    console.log('📈 Creating metrics and KPIs...');

    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    // Métricas por agencia
    await Promise.all([
      prisma.metricaVenta.create({
        data: {
          agenciaId: agenciaNissanSatellite.id,
          mes: currentMonth,
          year: currentYear,
          ventasRealizadas: 18,
          metaVentas: 25,
          prospectosProcesados: 87,
          tasaConversion: 20.69,
          utilidadPromedio: 45000,
          vendedoresActivos: 3,
          optimizacionesProcesadas: 156
        }
      }),
      prisma.metricaVenta.create({
        data: {
          agenciaId: agenciaBMWPolanco.id,
          mes: currentMonth,
          year: currentYear,
          ventasRealizadas: 12,
          metaVentas: 15,
          prospectosProcesados: 34,
          tasaConversion: 35.29,
          utilidadPromedio: 125000,
          vendedoresActivos: 2,
          optimizacionesProcesadas: 89
        }
      })
    ]);

    // Metas individuales de vendedores
    await Promise.all(vendedores.map(vendedor => 
      prisma.metaVendedor.create({
        data: {
          vendedorId: vendedor.id,
          mes: currentMonth,
          year: currentYear,
          metaAutos: vendedor.agenciaId === agenciaBMWPolanco.id ? 8 : 12,
          metaIngresos: vendedor.agenciaId === agenciaBMWPolanco.id ? 800000 : 450000,
          autosVendidos: Math.floor(Math.random() * 8) + 3,
          ingresosReales: Math.floor(Math.random() * 200000) + 300000,
          porcentajeCumplimiento: Math.random() * 40 + 60,
          especialidad: vendedor.agenciaId === agenciaBMWPolanco.id ? 'Vehículos Premium' : 'Vehículos Familiares'
        }
      })
    ));

    // ============== 11. VENDEDORES DE GUARDIA ==============
    console.log('👨‍💼 Setting up sales guard system...');

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    await Promise.all([
      prisma.vendedorGuardia.create({
        data: {
          vendedorId: vendedores[0].id, // Carlos
          fecha: today,
          activo: true,
          horaInicio: '09:00',
          horaFin: '18:00',
          cargaActual: 2,
          metaDelDia: 5,
          observaciones: 'Guardia principal - especialista en Nissan'
        }
      }),
      prisma.vendedorGuardia.create({
        data: {
          vendedorId: vendedores[2].id, // Miguel
          fecha: today,
          activo: true,
          horaInicio: '10:00',
          horaFin: '19:00',
          cargaActual: 1,
          metaDelDia: 3,
          observaciones: 'Guardia BMW - enfoque premium'
        }
      })
    ]);

    // ============== 12. LOGS CRM Y ACTIVIDAD ==============
    console.log('📋 Creating system logs and activity...');

    await Promise.all([
      prisma.crmSyncLog.create({
        data: {
          crmConfigurationId: crmSalesforce.id,
          tipoOperacion: 'sync_to_crm',
          entidad: 'prospectos',
          accion: 'create',
          estadoSync: 'exitoso',
          registrosProcesados: 15,
          registrosExitosos: 15,
          registrosFallidos: 0,
          tiempoEjecucion: 2.3,
          detalleOperacion: JSON.stringify({
            timestamp: new Date().toISOString(),
            batchSize: 15,
            operation: 'bulk_upsert'
          }),
          usuarioId: gerenteNissan.id
        }
      }),
      prisma.crmSyncLog.create({
        data: {
          crmConfigurationId: crmSICOP.id,
          tipoOperacion: 'sync_from_crm',
          entidad: 'vehiculos',
          accion: 'update',
          estadoSync: 'exitoso',
          registrosProcesados: 8,
          registrosExitosos: 7,
          registrosFallidos: 1,
          tiempoEjecucion: 1.8,
          detalleOperacion: JSON.stringify({
            timestamp: new Date().toISOString(),
            updatedFields: ['precio', 'disponibilidad'],
            errors: ['Vehicle ID BMW123 not found']
          }),
          usuarioId: gerenteBMW.id
        }
      })
    ]);

    // ============== 13. CONFIGURACIONES GENERALES ==============
    console.log('⚙️ Setting up general configurations...');

    await Promise.all([
      prisma.configuracion.create({
        data: {
          clave: 'SPCC_VERSION',
          valor: 'v2.1',
          tipo: 'string',
          descripcion: 'Versión actual del sistema SPCC'
        }
      }),
      prisma.configuracion.create({
        data: {
          clave: 'LIMITE_GRABACIONES_DEMO',
          valor: '1000',
          tipo: 'number',
          descripcion: 'Límite de grabaciones para cuenta demo'
        }
      }),
      prisma.configuracion.create({
        data: {
          clave: 'ALERTAS_ACTIVAS',
          valor: 'true',
          tipo: 'boolean',
          descripcion: 'Sistema de alertas automáticas activado'
        }
      }),
      prisma.configuracion.create({
        data: {
          clave: 'CRM_AUTO_SYNC',
          valor: 'true',
          tipo: 'boolean',
          descripcion: 'Sincronización automática con CRMs externos'
        }
      })
    ]);

    console.log('✅ Database seeding completed successfully!');
    console.log(`
    🎉 DYNAMICFIN CRM DEMO DATA CREATED:
    
    📊 Automotive Groups: 2
    🏢 Agencies: 3 (Nissan Satellite, BMW Polanco, Mercedes Santa Fe)
    🚗 Vehicle Catalog: 9 models
    📦 Inventory: 3 units in stock
    👥 Users: 6 (1 Director, 2 Managers, 1 Coordinator, 2 Sales)
    🎯 SPCC Pillars: 15 (complete evaluation system)
    📋 Prospects: 5 (with real evaluations)
    📊 Evaluations: ${pilares.length * 2} detailed SPCC evaluations
    🔗 CRM Integrations: 2 (Salesforce + SICOP)
    🎭 Role Play Scenarios: 3 realistic scenarios
    📈 Metrics: Current month data for all agencies
    👨‍💼 Sales Guards: Active for today
    📋 Activity Logs: CRM sync history
    
    🔑 LOGIN CREDENTIALS:
    Director: director@dinamicfin.com / demo123
    Gerente Nissan: gerente.nissan@dinamicfin.com / demo123
    Gerente BMW: gerente.bmw@dinamicfin.com / demo123
    Coordinator: leads@dinamicfin.com / demo123
    Vendedor Carlos: carlos.venta@dinamicfin.com / demo123
    Vendedor Lucía: lucia.ventas@dinamicfin.com / demo123
    Vendedor Miguel: miguel.sales@dinamicfin.com / demo123
    `);

  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seed();
