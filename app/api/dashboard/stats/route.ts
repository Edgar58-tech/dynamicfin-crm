import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const agenciaId = session.user.agenciaId;
    const periodo = searchParams.get('periodo') || 'mes_actual';

    if (!agenciaId) {
      return NextResponse.json({ error: 'Usuario sin agencia asignada' }, { status: 400 });
    }

    // Calcular rangos de fechas
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    
    let fechaInicio: Date;
    let fechaFin: Date = new Date();

    switch (periodo) {
      case 'hoy':
        fechaInicio = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        fechaFin = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        break;
      case 'semana':
        fechaInicio = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'mes_actual':
        fechaInicio = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'trimestre':
        fechaInicio = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        break;
      default:
        fechaInicio = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // 1. OBTENER KPIs PRINCIPALES
    const [
      metricasVenta,
      prospectosSummary,
      grabacionesEstadisticas,
      vendedoresActivos,
      alertasActivas
    ] = await Promise.all([
      // Métricas de ventas del mes actual
      prisma.metricaVenta.findFirst({
        where: {
          agenciaId: agenciaId,
          mes: currentMonth,
          year: currentYear
        }
      }),

      // Resumen de prospectos por clasificación
      prisma.prospecto.groupBy({
        by: ['clasificacion'],
        where: {
          agenciaId: agenciaId,
          createdAt: {
            gte: fechaInicio,
            lte: fechaFin
          }
        },
        _count: { clasificacion: true }
      }),

      // Estadísticas de grabaciones
      prisma.grabacionConversacion.aggregate({
        where: {
          prospecto: { agenciaId: agenciaId },
          fechaGrabacion: {
            gte: fechaInicio,
            lte: fechaFin
          }
        },
        _count: { id: true },
        _avg: { scoreConversacion: true }
      }),

      // Vendedores activos con métricas
      prisma.user.findMany({
        where: {
          agenciaId: agenciaId,
          rol: 'VENDEDOR',
          activo: true
        },
        include: {
          prospectosVendedor: {
            where: {
              createdAt: {
                gte: fechaInicio,
                lte: fechaFin
              }
            }
          },
          _count: {
            select: {
              prospectosVendedor: {
                where: {
                  estatus: 'Vendido',
                  updatedAt: {
                    gte: fechaInicio,
                    lte: fechaFin
                  }
                }
              }
            }
          }
        }
      }),

      // Alertas activas
      prisma.alertaSistema.count({
        where: {
          usuario: { agenciaId: agenciaId },
          leida: false,
          fechaCreacion: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Última semana
          }
        }
      })
    ]);

    // 2. PROCESAR DATOS DE PROSPECTOS
    const prospectosPorClasificacion = {
      elite: prospectosSummary.find(p => p.clasificacion === 'Elite')?._count?.clasificacion || 0,
      calificado: prospectosSummary.find(p => p.clasificacion === 'Calificado')?._count?.clasificacion || 0,
      amadurar: prospectosSummary.find(p => p.clasificacion === 'A Madurar')?._count?.clasificacion || 0,
      explorador: prospectosSummary.find(p => p.clasificacion === 'Explorador')?._count?.clasificacion || 0,
      total: prospectosSummary.reduce((sum, p) => sum + (p._count?.clasificacion || 0), 0)
    };

    // 3. CALCULAR MÉTRICAS DE RENDIMIENTO
    const totalProspectos = prospectosPorClasificacion.total;
    const prospectosCalificados = prospectosPorClasificacion.elite + prospectosPorClasificacion.calificado;
    const tasaCalificacion = totalProspectos > 0 ? (prospectosCalificados / totalProspectos) * 100 : 0;
    
    const kpis = {
      // Métricas principales
      optimizaciones: metricasVenta?.optimizacionesProcesadas || 0,
      utilidadPromedio: Number(metricasVenta?.utilidadPromedio || 0),
      metaMensual: metricasVenta?.metaVentas || 0,
      ventasRealizadas: metricasVenta?.ventasRealizadas || 0,
      vendedoresActivos: vendedoresActivos.length,
      tasaConversion: Number(metricasVenta?.tasaConversion || 0),
      prospectosProcesados: metricasVenta?.prospectosProcesados || totalProspectos,
      
      // Métricas adicionales
      grabacionesRealizadas: grabacionesEstadisticas._count || 0,
      scorePromedioLlamadas: Math.round(grabacionesEstadisticas._avg.scoreConversacion || 0),
      tasaCalificacion: Math.round(tasaCalificacion),
      alertasPendientes: alertasActivas
    };

    // 4. OBTENER PROSPECTOS RECIENTES
    const recentProspectos = await prisma.prospecto.findMany({
      where: {
        agenciaId: agenciaId,
        createdAt: {
          gte: fechaInicio,
          lte: fechaFin
        }
      },
      include: {
        vendedor: {
          select: { nombre: true, apellido: true }
        },
        agencia: {
          select: { nombreAgencia: true }
        },
        vehiculoCatalogo: {
          select: { marca: true, modelo: true, year: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    // 5. ACTIVIDADES PRÓXIMAS (datos reales del calendario)
    const proximasActividades = await prisma.prospecto.findMany({
      where: {
        agenciaId: agenciaId,
        proximaSeguimiento: {
          gte: new Date(),
          lte: new Date(Date.now() + 24 * 60 * 60 * 1000) // Próximas 24 horas
        }
      },
      include: {
        vendedor: {
          select: { nombre: true, apellido: true }
        }
      },
      orderBy: { proximaSeguimiento: 'asc' },
      take: 10
    });

    // 6. MÉTRICAS DE RENDIMIENTO POR VENDEDOR
    const rendimientoVendedores = vendedoresActivos.map(vendedor => {
      const ventasRealizadas = vendedor._count.prospectosVendedor;
      const prospectosTotales = vendedor.prospectosVendedor.length;
      const tasaConversionVendedor = prospectosTotales > 0 ? (ventasRealizadas / prospectosTotales) * 100 : 0;

      return {
        vendedor: {
          id: vendedor.id,
          nombre: `${vendedor.nombre} ${vendedor.apellido || ''}`.trim()
        },
        prospectosTotales,
        ventasRealizadas,
        tasaConversion: Math.round(tasaConversionVendedor),
        cargaActual: vendedor.cargaProspectos
      };
    });

    // 7. TENDENCIAS Y COMPARACIONES
    const mesAnterior = currentMonth === 1 ? 12 : currentMonth - 1;
    const yearMesAnterior = currentMonth === 1 ? currentYear - 1 : currentYear;

    const metricasMesAnterior = await prisma.metricaVenta.findFirst({
      where: {
        agenciaId: agenciaId,
        mes: mesAnterior,
        year: yearMesAnterior
      }
    });

    const tendencias = {
      ventasVsMesAnterior: metricasMesAnterior ? 
        ((kpis.ventasRealizadas - (metricasMesAnterior.ventasRealizadas || 0)) / (metricasMesAnterior.ventasRealizadas || 1)) * 100 : 0,
      prospectosVsMesAnterior: metricasMesAnterior ?
        ((kpis.prospectosProcesados - (metricasMesAnterior.prospectosProcesados || 0)) / (metricasMesAnterior.prospectosProcesados || 1)) * 100 : 0,
      utilidadVsMesAnterior: metricasMesAnterior ?
        ((kpis.utilidadPromedio - Number(metricasMesAnterior.utilidadPromedio || 0)) / Number(metricasMesAnterior.utilidadPromedio || 1)) * 100 : 0
    };

    // 8. FORMATEAR RESPUESTA
    const dashboardData = {
      // KPIs principales
      kpis,
      
      // Distribución de prospectos
      prospectosSummary: prospectosPorClasificacion,
      
      // Prospectos recientes
      recentProspectos: recentProspectos.map(p => ({
        id: p.id,
        nombre: p.nombre,
        apellido: p.apellido,
        telefono: p.telefono,
        email: p.email,
        clasificacion: p.clasificacion,
        calificacionTotal: Number(p.calificacionTotal),
        vehiculo: p.vehiculoCatalogo ? 
          `${p.vehiculoCatalogo.marca} ${p.vehiculoCatalogo.modelo} ${p.vehiculoCatalogo.year}` :
          p.vehiculoInteres,
        vendedor: p.vendedor,
        agencia: p.agencia,
        fechaCreacion: p.createdAt,
        proximaSeguimiento: p.proximaSeguimiento
      })),

      // Actividades próximas
      proximasActividades: proximasActividades.map(p => ({
        id: p.id,
        prospecto: {
          nombre: p.nombre,
          apellido: p.apellido,
          clasificacion: p.clasificacion,
          sppc: Number(p.calificacionTotal)
        },
        vendedorAsignado: p.vendedor ? `${p.vendedor.nombre} ${p.vendedor.apellido || ''}`.trim() : 'Sin asignar',
        fecha: p.proximaSeguimiento,
        tipo: 'Seguimiento',
        comentarios: p.notas || 'Seguimiento programado'
      })),

      // Rendimiento por vendedor
      rendimientoVendedores,

      // Tendencias
      tendencias,

      // Metadatos
      metadata: {
        periodo,
        fechaGeneracion: new Date().toISOString(),
        agenciaId,
        totalRegistros: {
          prospectos: totalProspectos,
          grabaciones: grabacionesEstadisticas._count || 0,
          vendedores: vendedoresActivos.length,
          alertas: alertasActivas
        }
      }
    };

    return NextResponse.json(dashboardData);

  } catch (error: any) {
    console.error('Error obteniendo estadísticas del dashboard:', error);
    return NextResponse.json({
      error: 'Error interno del servidor',
      details: error.message
    }, { status: 500 });
  }
}

// Endpoint para métricas específicas
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { metricType, dateRange, filters } = await request.json();
    const agenciaId = session.user.agenciaId;

    let result: any = {};

    switch (metricType) {
      case 'conversion_funnel':
        // Análisis del funnel de conversión
        const funnelData = await prisma.prospecto.groupBy({
          by: ['estatus'],
          where: {
            agenciaId: agenciaId,
            ...(dateRange && {
              createdAt: {
                gte: new Date(dateRange.start),
                lte: new Date(dateRange.end)
              }
            })
          },
          _count: { estatus: true }
        });

        result = {
          funnel: funnelData.map(item => ({
            etapa: item.estatus,
            cantidad: item._count?.estatus || 0
          }))
        };
        break;

      case 'spcc_distribution':
        // Distribución de puntajes SPCC
        const spccRanges = await prisma.$queryRaw`
          SELECT 
            CASE 
              WHEN calificacion_total >= 85 THEN 'Elite (85-100)'
              WHEN calificacion_total >= 70 THEN 'Calificado (70-84)'
              WHEN calificacion_total >= 50 THEN 'A Madurar (50-69)'
              ELSE 'Explorador (0-49)'
            END as rango,
            COUNT(*) as cantidad,
            AVG(calificacion_total) as promedio
          FROM prospectos 
          WHERE agencia_id = ${agenciaId}
          GROUP BY 
            CASE 
              WHEN calificacion_total >= 85 THEN 'Elite (85-100)'
              WHEN calificacion_total >= 70 THEN 'Calificado (70-84)'
              WHEN calificacion_total >= 50 THEN 'A Madurar (50-69)'
              ELSE 'Explorador (0-49)'
            END
        `;

        result = { spccDistribution: spccRanges };
        break;

      case 'crm_sync_status':
        // Estado de sincronizaciones CRM
        const crmSyncData = await prisma.crmSyncLog.groupBy({
          by: ['estadoSync'],
          where: {
            crmConfiguration: { agenciaId: agenciaId || 0 },
            fechaInicio: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Últimos 30 días
            }
          },
          _count: { estadoSync: true },
          _avg: { tiempoEjecucion: true }
        });

        result = {
          crmSync: crmSyncData.map(item => ({
            estado: item.estadoSync,
            cantidad: item._count?.estadoSync || 0,
            tiempoPromedio: Number(item._avg?.tiempoEjecucion || 0)
          }))
        };
        break;

      default:
        return NextResponse.json({ error: 'Tipo de métrica no válido' }, { status: 400 });
    }

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Error obteniendo métrica específica:', error);
    return NextResponse.json({
      error: 'Error interno del servidor',
      details: error.message
    }, { status: 500 });
  }
}