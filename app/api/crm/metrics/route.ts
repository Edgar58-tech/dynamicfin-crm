
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

// GET - Obtener métricas CRM
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const configId = url.searchParams.get('configId');
    const periodo = url.searchParams.get('periodo') || '30'; // días
    const tipo = url.searchParams.get('tipo') || 'general'; // 'general', 'detallado', 'tiempo-real'

    // Construir filtros base para configuraciones de la agencia
    const whereClause: any = {};
    
    if (configId) {
      const config = await prisma.crmConfiguration.findFirst({
        where: {
          id: parseInt(configId),
          agenciaId: session.user.agenciaId as number
        }
      });

      if (!config) {
        return NextResponse.json(
          { error: 'Configuración CRM no encontrada' },
          { status: 404 }
        );
      }

      whereClause.crmConfigurationId = parseInt(configId);
    } else {
      // Obtener configuraciones de la agencia
      const configs = await prisma.crmConfiguration.findMany({
        where: { agenciaId: session.user.agenciaId as number },
        select: { id: true }
      });

      if (configs.length === 0) {
        return NextResponse.json({
          success: true,
          data: {
            metricas: [],
            resumen: getEmptyMetricsResumen(),
            configuracionesActivas: 0
          }
        });
      }

      whereClause.crmConfigurationId = {
        in: configs.map(c => c.id)
      };
    }

    // Filtro por fecha
    const fechaDesde = new Date();
    fechaDesde.setDate(fechaDesde.getDate() - parseInt(periodo));
    whereClause.fecha = {
      gte: fechaDesde
    };

    switch (tipo) {
      case 'general':
        return await getGeneralMetrics(whereClause, session.user.agenciaId!);
      
      case 'detallado':
        return await getDetailedMetrics(whereClause, session.user.agenciaId!);
      
      case 'tiempo-real':
        return await getRealTimeMetrics(whereClause, session.user.agenciaId!);
      
      default:
        return await getGeneralMetrics(whereClause, session.user.agenciaId!);
    }

  } catch (error: any) {
    console.error('Error en GET /api/crm/metrics:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Error interno del servidor',
        details: error.message
      },
      { status: 500 }
    );
  }
}

// POST - Generar métricas manualmente (para testing o recálculo)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const data = await request.json();
    const { configId, fecha } = data;

    if (!configId) {
      return NextResponse.json(
        { error: 'ID de configuración requerido' },
        { status: 400 }
      );
    }

    // Verificar que la configuración pertenece a la agencia
    const config = await prisma.crmConfiguration.findFirst({
      where: {
        id: configId,
        agenciaId: session.user.agenciaId as number
      }
    });

    if (!config) {
      return NextResponse.json(
        { error: 'Configuración CRM no encontrada' },
        { status: 404 }
      );
    }

    const targetDate = fecha ? new Date(fecha) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    // Calcular métricas para la fecha especificada
    const metrics = await calculateDailyMetrics(configId, targetDate);

    // Guardar o actualizar métricas
    const existingMetric = await prisma.crmMetrics.findUnique({
      where: {
        crmConfigurationId_fecha: {
          crmConfigurationId: configId,
          fecha: targetDate
        }
      }
    });

    if (existingMetric) {
      // Actualizar métricas existentes
      await prisma.crmMetrics.update({
        where: { id: existingMetric.id },
        data: metrics
      });
    } else {
      // Crear nuevas métricas
      await prisma.crmMetrics.create({
        data: {
          crmConfigurationId: configId,
          fecha: targetDate,
          ...metrics
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Métricas generadas exitosamente',
      data: {
        fecha: targetDate.toISOString(),
        metricas: metrics
      }
    });

  } catch (error: any) {
    console.error('Error en POST /api/crm/metrics:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Error al generar métricas',
        details: error.message
      },
      { status: 500 }
    );
  }
}

// Función para obtener métricas generales
async function getGeneralMetrics(whereClause: any, agenciaId: number) {
  const metricas = await prisma.crmMetrics.findMany({
    where: whereClause,
    include: {
      crmConfiguration: {
        select: {
          id: true,
          nombre: true,
          crmTipo: true,
          activo: true
        }
      }
    },
    orderBy: { fecha: 'desc' }
  });

  // Calcular resumen agregado
  const resumen = metricas.reduce((acc, metric) => ({
    totalSincronizaciones: acc.totalSincronizaciones + metric.totalSincronizaciones,
    sincronizacionesExitosas: acc.sincronizacionesExitosas + metric.sincronizacionesExitosas,
    sincronizacionesFallidas: acc.sincronizacionesFallidas + metric.sincronizacionesFallidas,
    prospectosSincronizados: acc.prospectosSincronizados + metric.prospectosSincronizados,
    vehiculosSincronizados: acc.vehiculosSincronizados + metric.vehiculosSincronizados,
    ventasSincronizadas: acc.ventasSincronizadas + metric.ventasSincronizadas,
    contactosSincronizados: acc.contactosSincronizados + metric.contactosSincronizados,
    webhooksEnviados: acc.webhooksEnviados + metric.webhooksEnviados,
    webhooksRecibidos: acc.webhooksRecibidos + metric.webhooksRecibidos,
    rateLimitHits: acc.rateLimitHits + metric.rateLimitHits,
    datosVolumen: acc.datosVolumen.plus(metric.datosVolumen || 0),
    costoOperacional: acc.costoOperacional.plus(metric.costoOperacional || 0)
  }), {
    totalSincronizaciones: 0,
    sincronizacionesExitosas: 0,
    sincronizacionesFallidas: 0,
    prospectosSincronizados: 0,
    vehiculosSincronizados: 0,
    ventasSincronizadas: 0,
    contactosSincronizados: 0,
    webhooksEnviados: 0,
    webhooksRecibidos: 0,
    rateLimitHits: 0,
    datosVolumen: new Decimal(0),
    costoOperacional: new Decimal(0)
  });

  // Calcular tasas de éxito promedio
  const tasaExito = resumen.totalSincronizaciones > 0 
    ? (resumen.sincronizacionesExitosas / resumen.totalSincronizaciones * 100).toFixed(2)
    : '0.00';

  // Obtener configuraciones activas
  const configuracionesActivas = await prisma.crmConfiguration.count({
    where: {
      agenciaId: agenciaId,
      activo: true
    }
  });

  return NextResponse.json({
    success: true,
    data: {
      metricas: metricas,
      resumen: {
        ...resumen,
        tasaExito: parseFloat(tasaExito),
        configuracionesActivas: configuracionesActivas,
        periodo: metricas.length > 0 ? {
          desde: metricas[metricas.length - 1].fecha,
          hasta: metricas[0].fecha
        } : null
      }
    }
  });
}

// Función para obtener métricas detalladas
async function getDetailedMetrics(whereClause: any, agenciaId: number) {
  // Obtener métricas con agrupación por configuración
  const metricasPorConfig = await prisma.crmMetrics.groupBy({
    by: ['crmConfigurationId'],
    where: whereClause,
    _sum: {
      totalSincronizaciones: true,
      sincronizacionesExitosas: true,
      sincronizacionesFallidas: true,
      prospectosSincronizados: true,
      vehiculosSincronizados: true,
      ventasSincronizadas: true,
      contactosSincronizados: true,
      webhooksEnviados: true,
      webhooksRecibidos: true,
      rateLimitHits: true,
      datosVolumen: true,
      costoOperacional: true
    },
    _avg: {
      tiempoPromedioSync: true,
      errorRate: true,
      uptime: true,
      latenciaPromedio: true
    },
    _count: {
      id: true
    }
  });

  // Obtener información de configuraciones
  const configs = await prisma.crmConfiguration.findMany({
    where: {
      agenciaId: agenciaId,
      id: {
        in: metricasPorConfig.map(m => m.crmConfigurationId)
      }
    },
    select: {
      id: true,
      nombre: true,
      crmTipo: true,
      activo: true,
      ultimaSincronizacion: true,
      frecuenciaSincronizacion: true
    }
  });

  // Combinar datos
  const detalles = metricasPorConfig.map(metric => {
    const config = configs.find(c => c.id === metric.crmConfigurationId);
    return {
      configuracion: config,
      metricas: {
        ...metric._sum,
        promedios: metric._avg,
        diasConDatos: metric._count.id
      }
    };
  });

  return NextResponse.json({
    success: true,
    data: {
      detallesPorConfiguracion: detalles,
      totalConfiguraciones: configs.length
    }
  });
}

// Función para obtener métricas en tiempo real
async function getRealTimeMetrics(whereClause: any, agenciaId: number) {
  // Obtener logs más recientes para métricas en tiempo real
  const fechaHoy = new Date();
  fechaHoy.setHours(0, 0, 0, 0);

  const logsHoy = await prisma.crmSyncLog.findMany({
    where: {
      ...whereClause,
      fechaInicio: {
        gte: fechaHoy
      }
    },
    include: {
      crmConfiguration: {
        select: {
          id: true,
          nombre: true,
          crmTipo: true
        }
      }
    },
    orderBy: { fechaInicio: 'desc' },
    take: 50
  });

  // Calcular métricas de las últimas horas
  const ahora = new Date();
  const hace1Hora = new Date(ahora.getTime() - 60 * 60 * 1000);
  const hace24Horas = new Date(ahora.getTime() - 24 * 60 * 60 * 1000);

  const ultimaHora = logsHoy.filter(log => log.fechaInicio >= hace1Hora);
  const ultimas24Horas = logsHoy.filter(log => log.fechaInicio >= hace24Horas);

  const metricas = {
    ultimaHora: {
      sincronizaciones: ultimaHora.length,
      exitosas: ultimaHora.filter(l => l.estadoSync === 'exitoso').length,
      fallidas: ultimaHora.filter(l => l.estadoSync === 'error').length,
      registrosProcesados: ultimaHora.reduce((sum, l) => sum + l.registrosProcesados, 0)
    },
    ultimas24Horas: {
      sincronizaciones: ultimas24Horas.length,
      exitosas: ultimas24Horas.filter(l => l.estadoSync === 'exitoso').length,
      fallidas: ultimas24Horas.filter(l => l.estadoSync === 'error').length,
      registrosProcesados: ultimas24Horas.reduce((sum, l) => sum + l.registrosProcesados, 0)
    },
    logsRecientes: logsHoy.slice(0, 10) // Últimos 10 logs
  };

  return NextResponse.json({
    success: true,
    data: metricas
  });
}

// Función para calcular métricas diarias
async function calculateDailyMetrics(configId: number, fecha: Date): Promise<any> {
  const fechaInicio = new Date(fecha);
  fechaInicio.setHours(0, 0, 0, 0);
  
  const fechaFin = new Date(fecha);
  fechaFin.setHours(23, 59, 59, 999);

  // Obtener logs del día
  const logs = await prisma.crmSyncLog.findMany({
    where: {
      crmConfigurationId: configId,
      fechaInicio: {
        gte: fechaInicio,
        lte: fechaFin
      }
    }
  });

  // Obtener ejecuciones de webhook del día
  const webhookExecutions = await prisma.webhookExecution.findMany({
    where: {
      webhookConfiguration: {
        crmConfigurationId: configId
      },
      fechaEjecucion: {
        gte: fechaInicio,
        lte: fechaFin
      }
    }
  });

  // Calcular métricas
  const totalSincronizaciones = logs.length;
  const sincronizacionesExitosas = logs.filter(l => l.estadoSync === 'exitoso').length;
  const sincronizacionesFallidas = logs.filter(l => l.estadoSync === 'error').length;
  
  const prospectosSincronizados = logs.filter(l => l.entidad === 'prospectos').reduce((sum, l) => sum + l.registrosExitosos, 0);
  const vehiculosSincronizados = logs.filter(l => l.entidad === 'vehiculos').reduce((sum, l) => sum + l.registrosExitosos, 0);
  const ventasSincronizadas = logs.filter(l => l.entidad === 'ventas').reduce((sum, l) => sum + l.registrosExitosos, 0);
  const contactosSincronizados = logs.filter(l => l.entidad === 'contactos').reduce((sum, l) => sum + l.registrosExitosos, 0);

  const webhooksEnviados = webhookExecutions.filter(w => w.tipoEjecucion !== 'manual').length;
  const webhooksRecibidos = logs.filter(l => l.tipoOperacion === 'webhook_received').length;

  const tiempoPromedio = logs.length > 0 
    ? logs.reduce((sum, l) => sum + (Number(l.tiempoEjecucion) || 0), 0) / logs.length
    : 0;

  const errorRate = totalSincronizaciones > 0 
    ? (sincronizacionesFallidas / totalSincronizaciones) * 100
    : 0;

  return {
    totalSincronizaciones,
    sincronizacionesExitosas,
    sincronizacionesFallidas,
    prospectosSincronizados,
    vehiculosSincronizados,
    ventasSincronizadas,
    contactosSincronizados,
    webhooksEnviados,
    webhooksRecibidos,
    tiempoPromedioSync: tiempoPromedio,
    rateLimitHits: 0, // Se calcularía desde logs específicos de rate limit
    errorRate: errorRate,
    datosVolumen: 0, // Se calcularía desde el tamaño de payloads
    costoOperacional: 0, // Se calcularía según el proveedor CRM
    uptime: 100, // Se calcularía desde disponibilidad del servicio
    latenciaPromedio: Math.floor(tiempoPromedio * 1000) // convertir a ms
  };
}

// Función helper para resumen vacío
function getEmptyMetricsResumen() {
  return {
    totalSincronizaciones: 0,
    sincronizacionesExitosas: 0,
    sincronizacionesFallidas: 0,
    prospectosSincronizados: 0,
    vehiculosSincronizados: 0,
    ventasSincronizadas: 0,
    contactosSincronizados: 0,
    webhooksEnviados: 0,
    webhooksRecibidos: 0,
    rateLimitHits: 0,
    datosVolumen: 0,
    costoOperacional: 0,
    tasaExito: 0.00,
    configuracionesActivas: 0
  };
}
