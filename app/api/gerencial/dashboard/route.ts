
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Solo gerentes pueden acceder a este dashboard
    if (!['GERENTE_VENTAS', 'GERENTE_GENERAL', 'DIRECTOR_MARCA', 'DIRECTOR_GENERAL', 'DYNAMICFIN_ADMIN'].includes(session.user.rol)) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
    }

    const agenciaId = session.user.agenciaId;
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Obtener todas las métricas en paralelo
    const [
      // Centro de Leads
      vendedoresGuardiaHoy,
      llamadasHoy,
      visitasHoy,
      prospectosPendientes,
      alertasDesbalance,
      
      // Grabaciones
      grabacionesHoy,
      grabacionesSemana,
      grabacionesMes,
      
      // Prospectos y Pipeline
      prospectosTotales,
      prospectosCalificados,
      prospectosVendidos,
      
      // Catálogo
      vehiculosMasSolicitados,
      
      // KPIs Generales
      metricasVentas,
      metasVendedores,
      
      // Alertas Críticas
      alertasSistema
    ] = await Promise.all([
      // Centro de Leads
      prisma.vendedorGuardia.findMany({
        where: {
          fecha: {
            gte: startOfDay,
            lt: new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000)
          },
          activo: true,
          ...(agenciaId && { vendedor: { agenciaId } })
        },
        include: {
          vendedor: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              cargaProspectos: true
            }
          }
        }
      }),
      
      prisma.registroLlamadaEntrante.count({
        where: {
          horaLlamada: { gte: startOfDay },
          ...(agenciaId && { coordinador: { agenciaId } })
        }
      }),
      
      prisma.visitaShowroom.count({
        where: {
          horaIngreso: { gte: startOfDay },
          ...(agenciaId && { coordinador: { agenciaId } })
        }
      }),
      
      prisma.prospecto.count({
        where: {
          estatus: 'PENDIENTE_CALIFICACION',
          ...(agenciaId && { agenciaId })
        }
      }),
      
      prisma.alertaDesbalance.count({
        where: {
          estadoAlerta: 'ACTIVA',
          ...(agenciaId && { usuario: { agenciaId } })
        }
      }),
      
      // Grabaciones
      prisma.grabacionConversacion.count({
        where: {
          fechaGrabacion: { gte: startOfDay },
          ...(agenciaId && { vendedor: { agenciaId } })
        }
      }),
      
      prisma.grabacionConversacion.count({
        where: {
          fechaGrabacion: { gte: startOfWeek },
          ...(agenciaId && { vendedor: { agenciaId } })
        }
      }),
      
      prisma.grabacionConversacion.count({
        where: {
          fechaGrabacion: { gte: startOfMonth },
          ...(agenciaId && { vendedor: { agenciaId } })
        }
      }),
      
      // Prospectos
      prisma.prospecto.count({
        where: {
          ...(agenciaId && { agenciaId })
        }
      }),
      
      prisma.prospecto.count({
        where: {
          estatus: 'Calificado',
          ...(agenciaId && { agenciaId })
        }
      }),
      
      prisma.prospecto.count({
        where: {
          estatus: 'Vendido',
          ...(agenciaId && { agenciaId })
        }
      }),
      
      // Catálogo más solicitado
      prisma.prospecto.groupBy({
        by: ['vehiculoInteresId'],
        _count: { id: true },
        where: {
          vehiculoInteresId: { not: null },
          createdAt: { gte: startOfMonth },
          ...(agenciaId && { agenciaId })
        },
        orderBy: { _count: { id: 'desc' } },
        take: 10
      }),
      
      // Métricas de ventas
      prisma.metricaVenta.findFirst({
        where: {
          mes: today.getMonth() + 1,
          year: today.getFullYear(),
          ...(agenciaId && { agenciaId })
        }
      }),
      
      // Metas de vendedores
      prisma.metaVendedor.findMany({
        where: {
          mes: today.getMonth() + 1,
          year: today.getFullYear(),
          activo: true,
          ...(agenciaId && { vendedor: { agenciaId } })
        },
        include: {
          vendedor: {
            select: {
              id: true,
              nombre: true,
              apellido: true
            }
          }
        }
      }),
      
      // Alertas críticas
      prisma.alertaSistema.findMany({
        where: {
          leida: false,
          prioridad: 'alta',
          ...(agenciaId && { usuario: { agenciaId } })
        },
        orderBy: { fechaCreacion: 'desc' },
        take: 10
      })
    ]);

    // Procesar datos de vehículos más solicitados
    const vehiculosConNombres = await Promise.all(
      vehiculosMasSolicitados.map(async (item) => {
        const vehiculo = await prisma.vehiculoCatalogo.findUnique({
          where: { id: item.vehiculoInteresId! }
        });
        return {
          id: item.vehiculoInteresId,
          nombre: vehiculo ? `${vehiculo.marca} ${vehiculo.modelo} ${vehiculo.year}` : 'Vehículo no identificado',
          solicitudes: item._count.id
        };
      })
    );

    // Calcular métricas de tiempo promedio
    const asignaciones = await prisma.asignacionLead.findMany({
      where: {
        fechaAsignacion: { gte: startOfDay },
        ...(agenciaId && { coordinador: { agenciaId } })
      },
      include: {
        prospecto: {
          select: {
            createdAt: true
          }
        }
      }
    });

    const tiempoPromedioAsignacion = asignaciones.length > 0 
      ? asignaciones.reduce((acc, asignacion) => {
          const tiempoDiff = asignacion.fechaAsignacion.getTime() - asignacion.prospecto.createdAt.getTime();
          return acc + (tiempoDiff / (1000 * 60)); // en minutos
        }, 0) / asignaciones.length
      : 0;

    // Calcular estadísticas de rendimiento por vendedor de guardia
    const rendimientoVendedoresGuardia = await Promise.all(
      vendedoresGuardiaHoy.map(async (guardia) => {
        const prospectsAsignadosHoy = await prisma.asignacionLead.count({
          where: {
            vendedorAsignadoId: guardia.vendedorId,
            fechaAsignacion: { gte: startOfDay }
          }
        });

        const prospectsContactados = await prisma.asignacionLead.count({
          where: {
            vendedorAsignadoId: guardia.vendedorId,
            vendedorContacto: true,
            fechaAsignacion: { gte: startOfDay }
          }
        });

        return {
          vendedorId: guardia.vendedorId,
          nombre: `${guardia.vendedor.nombre} ${guardia.vendedor.apellido || ''}`.trim(),
          cargaActual: guardia.cargaActual,
          metaDelDia: guardia.metaDelDia,
          prospectsAsignadosHoy,
          prospectsContactados,
          tasaContacto: prospectsAsignadosHoy > 0 ? (prospectsContactados / prospectsAsignadosHoy) * 100 : 0,
          disponible: guardia.cargaActual < guardia.metaDelDia
        };
      })
    );

    // Calcular métricas del pipeline
    const funnelData = {
      leadsRecibidos: llamadasHoy + visitasHoy,
      leadsAsignados: asignaciones.length,
      leadsContactados: await prisma.asignacionLead.count({
        where: {
          vendedorContacto: true,
          fechaAsignacion: { gte: startOfDay },
          ...(agenciaId && { coordinador: { agenciaId } })
        }
      }),
      leadsCalificados: await prisma.prospecto.count({
        where: {
          estatus: 'Calificado',
          updatedAt: { gte: startOfDay },
          ...(agenciaId && { agenciaId })
        }
      }),
      ventasRealizadas: await prisma.prospecto.count({
        where: {
          estatus: 'Vendido',
          updatedAt: { gte: startOfDay },
          ...(agenciaId && { agenciaId })
        }
      })
    };

    // Respuesta estructurada
    const dashboardData = {
      // Resumen ejecutivo
      resumenEjecutivo: {
        leadsRecibidosHoy: llamadasHoy + visitasHoy,
        vendedoresGuardiaActivos: vendedoresGuardiaHoy.length,
        prospectosPendientes,
        alertasCriticas: alertasSistema.length,
        tiempoPromedioAsignacion: Math.round(tiempoPromedioAsignacion * 10) / 10 // redondeado a 1 decimal
      },

      // Centro de Leads
      centroLeads: {
        llamadasHoy,
        visitasHoy,
        prospectsGenerados: llamadasHoy + visitasHoy,
        vendedoresGuardia: vendedoresGuardiaHoy.length,
        promedioAsignacion: Math.round(tiempoPromedioAsignacion * 10) / 10,
        alertasDesbalance,
        rendimientoVendedores: rendimientoVendedoresGuardia
      },

      // Grabaciones
      grabaciones: {
        grabacionesHoy,
        grabacionesSemana,
        grabacionesMes,
        promedioGrabacionesDiarias: grabacionesMes / 30,
        // Agregar más métricas de grabaciones después
      },

      // Catálogo de vehículos
      catalogo: {
        vehiculosMasSolicitados: vehiculosConNombres,
        totalSolicitudesMes: vehiculosMasSolicitados.reduce((acc, item) => acc + item._count.id, 0)
      },

      // Pipeline integrado
      pipeline: funnelData,

      // KPIs generales
      kpis: {
        prospectosTotales,
        prospectosCalificados,
        prospectosVendidos,
        tasaConversionGeneral: prospectosTotales > 0 ? (prospectosVendidos / prospectosTotales) * 100 : 0,
        metaMensual: metricasVentas?.metaVentas || 0,
        ventasRealizadas: metricasVentas?.ventasRealizadas || 0,
        cumplimientoMeta: metricasVentas?.metaVentas ? (metricasVentas.ventasRealizadas / metricasVentas.metaVentas) * 100 : 0
      },

      // Metas de vendedores
      metasVendedores: metasVendedores.map(meta => ({
        vendedorId: meta.vendedorId,
        nombre: `${meta.vendedor.nombre} ${meta.vendedor.apellido || ''}`.trim(),
        metaAutos: meta.metaAutos,
        autosVendidos: meta.autosVendidos,
        cumplimiento: meta.porcentajeCumplimiento,
        metaIngresos: meta.metaIngresos,
        ingresosReales: meta.ingresosReales
      })),

      // Alertas críticas
      alertasCriticas: alertasSistema.map(alerta => ({
        id: alerta.id,
        tipo: alerta.tipoAlerta,
        titulo: alerta.titulo,
        mensaje: alerta.mensaje,
        prioridad: alerta.prioridad,
        fechaCreacion: alerta.fechaCreacion
      })),

      // Timestamp de última actualización
      ultimaActualizacion: new Date().toISOString()
    };

    return NextResponse.json(dashboardData);

  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
