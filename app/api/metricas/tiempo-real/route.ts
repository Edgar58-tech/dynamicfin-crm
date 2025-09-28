
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface MetricasRequest {
  tipo: 'ventas' | 'spcc' | 'grabaciones' | 'crm' | 'general';
  periodo?: 'hoy' | 'semana' | 'mes' | 'trimestre' | 'año';
  agrupamiento?: 'hora' | 'dia' | 'semana' | 'mes';
  vendedorId?: string;
  comparativo?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (!session.user.agenciaId) {
      return NextResponse.json({ error: 'Usuario sin agencia asignada' }, { status: 400 });
    }

    const data: MetricasRequest = await request.json();
    const agenciaId = session.user.agenciaId;

    // Calcular rangos de fechas
    const { fechaInicio, fechaFin, fechaComparativa } = calculateDateRanges(
      data.periodo || 'mes',
      data.comparativo || false
    );

    let metricas: any = {};

    switch (data.tipo) {
      case 'ventas':
        metricas = await getMetricasVentas(agenciaId, fechaInicio, fechaFin, data);
        break;
      
      case 'spcc':
        metricas = await getMetricasSPCC(agenciaId, fechaInicio, fechaFin, data);
        break;
      
      case 'grabaciones':
        metricas = await getMetricasGrabaciones(agenciaId, fechaInicio, fechaFin, data);
        break;
      
      case 'crm':
        metricas = await getMetricasCRM(agenciaId, fechaInicio, fechaFin, data);
        break;
      
      case 'general':
      default:
        metricas = await getMetricasGenerales(agenciaId, fechaInicio, fechaFin, data);
        break;
    }

    // Agregar métricas comparativas si se solicita
    if (data.comparativo && fechaComparativa) {
      const metricasComparativas = await getMetricasComparativas(
        agenciaId,
        fechaComparativa.inicio,
        fechaComparativa.fin,
        data.tipo
      );
      
      metricas.comparativo = metricasComparativas;
      metricas.tendencias = calculateTendencias(metricas.actual, metricasComparativas);
    }

    return NextResponse.json({
      success: true,
      tipo: data.tipo,
      periodo: data.periodo || 'mes',
      fechaConsulta: new Date().toISOString(),
      metricas
    });

  } catch (error: any) {
    console.error('Error obteniendo métricas en tiempo real:', error);
    return NextResponse.json({
      error: 'Error interno del servidor',
      details: error.message
    }, { status: 500 });
  }
}

async function getMetricasVentas(agenciaId: number, fechaInicio: Date, fechaFin: Date, params: MetricasRequest) {
  const whereCondition: any = {
    agenciaId: agenciaId,
    createdAt: {
      gte: fechaInicio,
      lte: fechaFin
    }
  };

  if (params.vendedorId) {
    whereCondition.vendedorId = params.vendedorId;
  }

  const [
    totalProspectos,
    prospectosPorEstatus,
    prospectosPorClasificacion,
    conversionPorVendedor,
    tendenciasTiempo,
    metricasFinancieras
  ] = await Promise.all([
    // Total de prospectos
    prisma.prospecto.count({ where: whereCondition }),

    // Prospectos por estatus
    prisma.prospecto.groupBy({
      by: ['estatus'],
      where: whereCondition,
      _count: { estatus: true }
    }),

    // Prospectos por clasificación SPCC
    prisma.prospecto.groupBy({
      by: ['clasificacion'],
      where: whereCondition,
      _count: { clasificacion: true },
      _avg: { calificacionTotal: true }
    }),

    // Conversión por vendedor
    prisma.prospecto.groupBy({
      by: ['vendedorId'],
      where: {
        ...whereCondition,
        vendedorId: { not: null }
      },
      _count: { vendedorId: true },
      _sum: { presupuesto: true }
    }),

    // Tendencias por tiempo
    getTendenciasTiempo(agenciaId, fechaInicio, fechaFin, params.agrupamiento || 'dia'),

    // Métricas financieras
    prisma.prospecto.aggregate({
      where: whereCondition,
      _avg: { presupuesto: true },
      _sum: { presupuesto: true },
      _count: { presupuesto: true }
    })
  ]);

  // Enriquecer datos con información de vendedores
  const vendedoresInfo = await prisma.user.findMany({
    where: {
      agenciaId: agenciaId,
      rol: 'VENDEDOR',
      activo: true
    },
    select: {
      id: true,
      nombre: true,
      apellido: true
    }
  });

  const conversionEnriquecida = conversionPorVendedor.map(conv => {
    const vendedor = vendedoresInfo.find(v => v.id === conv.vendedorId);
    return {
      vendedorId: conv.vendedorId,
      vendedorNombre: vendedor ? `${vendedor.nombre} ${vendedor.apellido || ''}`.trim() : 'Sin asignar',
      totalProspectos: conv._count.vendedorId,
      presupuestoTotal: Number(conv._sum.presupuesto || 0)
    };
  });

  return {
    resumen: {
      totalProspectos,
      prospectosPorEstatus: prospectosPorEstatus.map(item => ({
        estatus: item.estatus,
        cantidad: item._count.estatus
      })),
      prospectosPorClasificacion: prospectosPorClasificacion.map(item => ({
        clasificacion: item.clasificacion,
        cantidad: item._count.clasificacion,
        promedioSPCC: Number(item._avg.calificacionTotal || 0)
      })),
      presupuestoPromedio: Number(metricasFinancieras._avg.presupuesto || 0),
      presupuestoTotal: Number(metricasFinancieras._sum.presupuesto || 0)
    },
    rendimientoVendedores: conversionEnriquecida,
    tendencias: tendenciasTiempo
  };
}

async function getMetricasSPCC(agenciaId: number, fechaInicio: Date, fechaFin: Date, params: MetricasRequest) {
  const [
    distribucionPuntajes,
    pilaresMasDebiles,
    eficienciaEvaluacion,
    mejoresProspectos
  ] = await Promise.all([
    // Distribución de puntajes SPCC
    prisma.$queryRaw`
      SELECT 
        CASE 
          WHEN p.calificacion_total >= 85 THEN 'Elite'
          WHEN p.calificacion_total >= 70 THEN 'Calificado' 
          WHEN p.calificacion_total >= 50 THEN 'A Madurar'
          ELSE 'Explorador'
        END as clasificacion,
        COUNT(*) as cantidad,
        AVG(p.calificacion_total) as promedio_spcc,
        MIN(p.calificacion_total) as minimo,
        MAX(p.calificacion_total) as maximo
      FROM prospectos p
      WHERE p.agencia_id = ${agenciaId}
        AND p.created_at >= ${fechaInicio}
        AND p.created_at <= ${fechaFin}
      GROUP BY 
        CASE 
          WHEN p.calificacion_total >= 85 THEN 'Elite'
          WHEN p.calificacion_total >= 70 THEN 'Calificado'
          WHEN p.calificacion_total >= 50 THEN 'A Madurar'
          ELSE 'Explorador'
        END
    `,

    // Pilares más débiles (promedios más bajos)
    prisma.$queryRaw`
      SELECT 
        pi.nombre_pilar,
        pi.descripcion,
        pi.fase_evaluacion,
        AVG(c.puntaje_obtenido) as promedio_puntaje,
        COUNT(c.id) as evaluaciones_totales,
        pi.peso_estrategico
      FROM calificaciones c
      JOIN pilares pi ON c.pilar_id = pi.id
      JOIN prospectos p ON c.prospecto_id = p.id
      WHERE p.agencia_id = ${agenciaId}
        AND c.updated_at >= ${fechaInicio}
        AND c.updated_at <= ${fechaFin}
      GROUP BY pi.id, pi.nombre_pilar, pi.descripcion, pi.fase_evaluacion, pi.peso_estrategico
      ORDER BY AVG(c.puntaje_obtenido) ASC
      LIMIT 5
    `,

    // Eficiencia de evaluación (tiempo promedio, evaluaciones automáticas vs manuales)
    prisma.$queryRaw`
      SELECT 
        DATE(p.updated_at) as fecha,
        COUNT(*) as evaluaciones_dia,
        AVG(p.calificacion_total) as spcc_promedio_dia
      FROM prospectos p
      WHERE p.agencia_id = ${agenciaId}
        AND p.updated_at >= ${fechaInicio}
        AND p.updated_at <= ${fechaFin}
        AND p.calificacion_total > 0
      GROUP BY DATE(p.updated_at)
      ORDER BY DATE(p.updated_at)
    `,

    // Mejores prospectos del período
    prisma.prospecto.findMany({
      where: {
        agenciaId: agenciaId,
        createdAt: {
          gte: fechaInicio,
          lte: fechaFin
        },
        calificacionTotal: {
          gte: 80 // Solo Elite y Calificados altos
        }
      },
      include: {
        vendedor: {
          select: { nombre: true, apellido: true }
        },
        vehiculoCatalogo: {
          select: { marca: true, modelo: true, year: true }
        }
      },
      orderBy: { calificacionTotal: 'desc' },
      take: 10
    })
  ]);

  return {
    distribucionPuntajes,
    pilaresMasDebiles,
    tendenciasEvaluacion: eficienciaEvaluacion,
    mejoresProspectos: mejoresProspectos.map(p => ({
      id: p.id,
      nombre: `${p.nombre} ${p.apellido || ''}`.trim(),
      spccScore: Number(p.calificacionTotal),
      clasificacion: p.clasificacion,
      vehiculo: p.vehiculoCatalogo ? 
        `${p.vehiculoCatalogo.marca} ${p.vehiculoCatalogo.modelo} ${p.vehiculoCatalogo.year}` :
        p.vehiculoInteres,
      vendedor: p.vendedor ? `${p.vendedor.nombre} ${p.vendedor.apellido || ''}`.trim() : null,
      presupuesto: Number(p.presupuesto || 0),
      fechaEvaluacion: p.updatedAt
    }))
  };
}

async function getMetricasGrabaciones(agenciaId: number, fechaInicio: Date, fechaFin: Date, params: MetricasRequest) {
  const [
    estadisticasGenerales,
    distribucionCalidad,
    sentimientoAnalisis,
    grabacionesPorVendedor,
    costosTranscripcion
  ] = await Promise.all([
    // Estadísticas generales
    prisma.grabacionConversacion.aggregate({
      where: {
        prospecto: { agenciaId: agenciaId },
        fechaGrabacion: {
          gte: fechaInicio,
          lte: fechaFin
        }
      },
      _count: { id: true },
      _avg: { 
        duracion: true,
        scoreConversacion: true,
        costoTranscripcion: true,
        costoAnalisis: true
      },
      _sum: {
        costoTranscripcion: true,
        costoAnalisis: true
      }
    }),

    // Distribución por calidad
    prisma.grabacionConversacion.groupBy({
      by: ['calidad'],
      where: {
        prospecto: { agenciaId: agenciaId },
        fechaGrabacion: {
          gte: fechaInicio,
          lte: fechaFin
        },
        calidad: { not: null }
      },
      _count: { calidad: true },
      _avg: { scoreConversacion: true }
    }),

    // Análisis de sentimiento
    prisma.grabacionConversacion.groupBy({
      by: ['sentimientoGeneral'],
      where: {
        prospecto: { agenciaId: agenciaId },
        fechaGrabacion: {
          gte: fechaInicio,
          lte: fechaFin
        },
        sentimientoGeneral: { not: null }
      },
      _count: { sentimientoGeneral: true }
    }),

    // Grabaciones por vendedor
    prisma.grabacionConversacion.groupBy({
      by: ['vendedorId'],
      where: {
        prospecto: { agenciaId: agenciaId },
        fechaGrabacion: {
          gte: fechaInicio,
          lte: fechaFin
        }
      },
      _count: { vendedorId: true },
      _avg: { 
        scoreConversacion: true,
        duracion: true
      }
    }),

    // Costos de transcripción e IA
    prisma.agencia.findUnique({
      where: { id: agenciaId },
      select: {
        grabacionesUsadas: true,
        limiteGrabacionesMes: true,
        costosPorGrabacion: true
      }
    })
  ]);

  // Enriquecer con info de vendedores
  const vendedoresInfo = await prisma.user.findMany({
    where: {
      agenciaId: agenciaId,
      rol: 'VENDEDOR',
      activo: true
    },
    select: { id: true, nombre: true, apellido: true }
  });

  const grabacionesEnriquecidas = grabacionesPorVendedor.map(g => {
    const vendedor = vendedoresInfo.find(v => v.id === g.vendedorId);
    return {
      vendedorId: g.vendedorId,
      vendedorNombre: vendedor ? `${vendedor.nombre} ${vendedor.apellido || ''}`.trim() : 'Sin asignar',
      totalGrabaciones: g._count.vendedorId,
      scorePromedio: Number(g._avg.scoreConversacion || 0),
      duracionPromedio: Number(g._avg.duracion || 0)
    };
  });

  return {
    resumen: {
      totalGrabaciones: estadisticasGenerales._count,
      duracionPromedio: Number(estadisticasGenerales._avg.duracion || 0),
      scorePromedio: Number(estadisticasGenerales._avg.scoreConversacion || 0),
      costoTranscripcionTotal: Number(estadisticasGenerales._sum.costoTranscripcion || 0),
      costoAnalisisTotal: Number(estadisticasGenerales._sum.costoAnalisis || 0),
      costoPromedioPorGrabacion: Number(estadisticasGenerales._avg.costoTranscripcion || 0) + 
                                Number(estadisticasGenerales._avg.costoAnalisis || 0)
    },
    distribucionCalidad: distribucionCalidad.map(item => ({
      calidad: item.calidad,
      cantidad: item._count.calidad,
      scorePromedio: Number(item._avg.scoreConversacion || 0)
    })),
    sentimiento: sentimientoAnalisis.map(item => ({
      sentimiento: item.sentimientoGeneral,
      cantidad: item._count.sentimientoGeneral
    })),
    rendimientoPorVendedor: grabacionesEnriquecidas,
    consumo: {
      grabacionesUsadas: costosTranscripcion?.grabacionesUsadas || 0,
      limiteMensual: costosTranscripcion?.limiteGrabacionesMes || 0,
      costoPorGrabacion: Number(costosTranscripcion?.costosPorGrabacion || 0),
      porcentajeConsumo: costosTranscripcion ? 
        ((costosTranscripcion.grabacionesUsadas / costosTranscripcion.limiteGrabacionesMes) * 100) : 0
    }
  };
}

async function getMetricasCRM(agenciaId: number, fechaInicio: Date, fechaFin: Date, params: MetricasRequest) {
  const [
    configuracionesCRM,
    logsSync,
    rendimientoPorCRM,
    ultimasSincronizaciones
  ] = await Promise.all([
    // Configuraciones CRM activas
    prisma.crmConfiguration.findMany({
      where: { agenciaId: agenciaId, activo: true },
      select: {
        id: true,
        nombre: true,
        crmTipo: true,
        ultimaSincronizacion: true,
        frecuenciaSincronizacion: true
      }
    }),

    // Logs de sincronización del período
    prisma.crmSyncLog.findMany({
      where: {
        crmConfiguration: { agenciaId: agenciaId },
        fechaInicio: {
          gte: fechaInicio,
          lte: fechaFin
        }
      },
      orderBy: { fechaInicio: 'desc' },
      take: 100
    }),

    // Rendimiento por CRM
    prisma.crmSyncLog.groupBy({
      by: ['crmConfigurationId', 'estadoSync'],
      where: {
        crmConfiguration: { agenciaId: agenciaId },
        fechaInicio: {
          gte: fechaInicio,
          lte: fechaFin
        }
      },
      _count: { estadoSync: true },
      _avg: { tiempoEjecucion: true },
      _sum: { registrosProcesados: true }
    }),

    // Últimas sincronizaciones exitosas
    prisma.crmSyncLog.findMany({
      where: {
        crmConfiguration: { agenciaId: agenciaId },
        estadoSync: 'exitoso'
      },
      include: {
        crmConfiguration: {
          select: { nombre: true, crmTipo: true }
        }
      },
      orderBy: { fechaInicio: 'desc' },
      take: 10
    })
  ]);

  const rendimientoAgrupado = rendimientoPorCRM.reduce((acc: any, item) => {
    const crmId = item.crmConfigurationId;
    if (!acc[crmId]) {
      acc[crmId] = {
        crmConfigurationId: crmId,
        exitosos: 0,
        errores: 0,
        parciales: 0,
        tiempoPromedioTotal: 0,
        registrosTotales: 0
      };
    }
    
    acc[crmId][item.estadoSync === 'exitoso' ? 'exitosos' : 
                item.estadoSync === 'error' ? 'errores' : 'parciales'] = item._count.estadoSync;
    acc[crmId].tiempoPromedioTotal += Number(item._avg.tiempoEjecucion || 0);
    acc[crmId].registrosTotales += item._sum.registrosProcesados || 0;
    
    return acc;
  }, {});

  return {
    configuraciones: configuracionesCRM,
    resumen: {
      totalSincronizaciones: logsSync.length,
      sincronizacionesExitosas: logsSync.filter(log => log.estadoSync === 'exitoso').length,
      sincronizacionesConError: logsSync.filter(log => log.estadoSync === 'error').length,
      registrosTotalesProcesados: logsSync.reduce((sum, log) => sum + (log.registrosProcesados || 0), 0)
    },
    rendimientoPorCRM: Object.values(rendimientoAgrupado).map((crm: any) => {
      const config = configuracionesCRM.find(c => c.id === crm.crmConfigurationId);
      return {
        ...crm,
        nombre: config?.nombre || 'Desconocido',
        crmTipo: config?.crmTipo || 'unknown',
        tasaExito: crm.exitosos + crm.errores + crm.parciales > 0 ? 
          (crm.exitosos / (crm.exitosos + crm.errores + crm.parciales)) * 100 : 0
      };
    }),
    ultimasSincronizaciones: ultimasSincronizaciones.map(sync => ({
      id: sync.id,
      crmNombre: sync.crmConfiguration.nombre,
      crmTipo: sync.crmConfiguration.crmTipo,
      tipoOperacion: sync.tipoOperacion,
      entidad: sync.entidad,
      registrosProcesados: sync.registrosProcesados,
      fechaEjecucion: sync.fechaInicio,
      duracion: Number(sync.tiempoEjecucion || 0)
    }))
  };
}

async function getMetricasGenerales(agenciaId: number, fechaInicio: Date, fechaFin: Date, params: MetricasRequest) {
  // Combinar métricas de todos los tipos para una vista general
  const [ventasMetricas, spccMetricas, grabacionesMetricas] = await Promise.all([
    getMetricasVentas(agenciaId, fechaInicio, fechaFin, params),
    getMetricasSPCC(agenciaId, fechaInicio, fechaFin, params),
    getMetricasGrabaciones(agenciaId, fechaInicio, fechaFin, params)
  ]);

  return {
    ventas: ventasMetricas.resumen,
    spcc: {
      distribucion: spccMetricas.distribucionPuntajes,
      pilaresMasDebiles: Array.isArray(spccMetricas.pilaresMasDebiles) 
        ? spccMetricas.pilaresMasDebiles.slice(0, 3) 
        : [] // Solo top 3
    },
    grabaciones: grabacionesMetricas.resumen,
    rendimientoVendedores: ventasMetricas.rendimientoVendedores.slice(0, 5) // Top 5
  };
}

async function getTendenciasTiempo(agenciaId: number, fechaInicio: Date, fechaFin: Date, agrupamiento: string) {
  const formatoFecha = agrupamiento === 'hora' ? 'YYYY-MM-DD HH24:00:00' :
                      agrupamiento === 'dia' ? 'YYYY-MM-DD' :
                      agrupamiento === 'semana' ? 'YYYY-"W"WW' :
                      'YYYY-MM';

  const tendencias = await prisma.$queryRaw`
    SELECT 
      TO_CHAR(created_at, ${formatoFecha}) as periodo,
      COUNT(*) as total_prospectos,
      COUNT(CASE WHEN estatus = 'Vendido' THEN 1 END) as ventas,
      AVG(calificacion_total) as spcc_promedio
    FROM prospectos
    WHERE agencia_id = ${agenciaId}
      AND created_at >= ${fechaInicio}
      AND created_at <= ${fechaFin}
    GROUP BY TO_CHAR(created_at, ${formatoFecha})
    ORDER BY TO_CHAR(created_at, ${formatoFecha})
  `;

  return tendencias;
}

function calculateDateRanges(periodo: string, comparativo: boolean) {
  const now = new Date();
  let fechaInicio: Date;
  let fechaFin: Date = new Date();
  let fechaComparativa: { inicio: Date; fin: Date } | null = null;

  switch (periodo) {
    case 'hoy':
      fechaInicio = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      if (comparativo) {
        fechaComparativa = {
          inicio: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1),
          fin: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59)
        };
      }
      break;
    
    case 'semana':
      fechaInicio = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      if (comparativo) {
        fechaComparativa = {
          inicio: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
          fin: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        };
      }
      break;
    
    case 'mes':
      fechaInicio = new Date(now.getFullYear(), now.getMonth(), 1);
      if (comparativo) {
        const mesAnterior = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
        const yearAnterior = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
        fechaComparativa = {
          inicio: new Date(yearAnterior, mesAnterior, 1),
          fin: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
        };
      }
      break;
    
    default:
      fechaInicio = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  return { fechaInicio, fechaFin, fechaComparativa };
}

async function getMetricasComparativas(agenciaId: number, fechaInicio: Date, fechaFin: Date, tipo: string) {
  // Reutilizar las mismas funciones pero para el período comparativo
  switch (tipo) {
    case 'ventas':
      return await getMetricasVentas(agenciaId, fechaInicio, fechaFin, { tipo: 'ventas' });
    case 'spcc':
      return await getMetricasSPCC(agenciaId, fechaInicio, fechaFin, { tipo: 'spcc' });
    case 'grabaciones':
      return await getMetricasGrabaciones(agenciaId, fechaInicio, fechaFin, { tipo: 'grabaciones' });
    default:
      return await getMetricasGenerales(agenciaId, fechaInicio, fechaFin, { tipo: 'general' });
  }
}

function calculateTendencias(actual: any, anterior: any) {
  const tendencias: any = {};

  // Calcular cambios porcentuales
  if (actual.resumen && anterior.resumen) {
    const campos = ['totalProspectos', 'presupuestoPromedio', 'presupuestoTotal'];
    campos.forEach(campo => {
      const valorActual = actual.resumen[campo] || 0;
      const valorAnterior = anterior.resumen[campo] || 0;
      tendencias[campo] = valorAnterior > 0 ? 
        ((valorActual - valorAnterior) / valorAnterior) * 100 : 0;
    });
  }

  return tendencias;
}

export async function GET(request: NextRequest) {
  // Endpoint para métricas rápidas en tiempo real
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const agenciaId = session.user.agenciaId;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const [
      prospectosHoy,
      grabacionesHoy,
      alertasPendientes,
      vendedoresActivos
    ] = await Promise.all([
      prisma.prospecto.count({
        where: {
          ...(agenciaId && { agenciaId: agenciaId }),
          createdAt: { gte: hoy }
        }
      }),

      prisma.grabacionConversacion.count({
        where: {
          ...(agenciaId && { prospecto: { agenciaId: agenciaId } }),
          fechaGrabacion: { gte: hoy }
        }
      }),

      prisma.alertaSistema.count({
        where: {
          ...(agenciaId && { usuario: { agenciaId: agenciaId } }),
          leida: false
        }
      }),

      prisma.user.count({
        where: {
          agenciaId: agenciaId,
          rol: 'VENDEDOR',
          activo: true
        }
      })
    ]);

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      metricas: {
        prospectosHoy,
        grabacionesHoy,
        alertasPendientes,
        vendedoresActivos
      }
    });

  } catch (error: any) {
    console.error('Error obteniendo métricas rápidas:', error);
    return NextResponse.json({
      error: 'Error interno del servidor',
      details: error.message
    }, { status: 500 });
  }
}
