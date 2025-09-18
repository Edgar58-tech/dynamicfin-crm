
// API para estadísticas de vendedores de guardia
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar permisos
    if (!['GERENTE_VENTAS', 'GERENTE_GENERAL', 'COORDINADOR_LEADS', 'CENTRO_LEADS'].includes(session.user.rol)) {
      return NextResponse.json({ error: 'Sin permisos para ver estadísticas' }, { status: 403 });
    }

    const url = new URL(request.url);
    const fechaInicio = url.searchParams.get('fechaInicio');
    const fechaFin = url.searchParams.get('fechaFin');
    const vendedorId = url.searchParams.get('vendedorId');

    // Fechas por defecto: últimos 7 días
    const finPeriodo = fechaFin ? new Date(fechaFin) : new Date();
    const inicioPeriodo = fechaInicio ? new Date(fechaInicio) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    finPeriodo.setHours(23, 59, 59, 999);
    inicioPeriodo.setHours(0, 0, 0, 0);

    // Construir filtros
    const filtrosBase: any = {
      fecha: {
        gte: inicioPeriodo,
        lte: finPeriodo
      },
      vendedor: {
        agenciaId: session.user.agenciaId,
        activo: true
      }
    };

    if (vendedorId) {
      filtrosBase.vendedorId = vendedorId;
    }

    // Estadísticas generales de vendedores de guardia
    const [
      totalGuardias,
      guardiasActivas,
      estadisticasVendedores,
      prospectosPorGuardia,
      alertasDesbalance
    ] = await Promise.all([
      // Total de guardias en el período
      prisma.vendedorGuardia.count({
        where: filtrosBase
      }),

      // Guardias activas
      prisma.vendedorGuardia.count({
        where: {
          ...filtrosBase,
          activo: true
        }
      }),

      // Estadísticas detalladas por vendedor
      prisma.vendedorGuardia.groupBy({
        by: ['vendedorId'],
        where: filtrosBase,
        _count: {
          id: true
        },
        _avg: {
          cargaActual: true,
          metaDelDia: true
        },
        _sum: {
          cargaActual: true
        }
      }),

      // Prospectos asignados por vendedor de guardia
      prisma.asignacionLead.groupBy({
        by: ['vendedorAsignadoId'],
        where: {
          fechaAsignacion: {
            gte: inicioPeriodo,
            lte: finPeriodo
          },
          coordinador: {
            agenciaId: session.user.agenciaId
          }
        },
        _count: {
          id: true
        }
      }),

      // Alertas de desbalance en el período
      prisma.alertaDesbalance.count({
        where: {
          fechaDeteccion: {
            gte: inicioPeriodo,
            lte: finPeriodo
          },
          usuario: {
            agenciaId: session.user.agenciaId
          }
        }
      })
    ]);

    // Obtener información detallada de vendedores
    const vendedoresInfo = await prisma.user.findMany({
      where: {
        id: { 
          in: estadisticasVendedores.map(ev => ev.vendedorId)
        }
      },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        cargaProspectos: true
      }
    });

    // Combinar estadísticas con información de vendedores
    const estadisticasDetalladas = estadisticasVendedores.map(stat => {
      const vendedor = vendedoresInfo.find(v => v.id === stat.vendedorId);
      const prospectosAsignados = prospectosPorGuardia.find(p => p.vendedorAsignadoId === stat.vendedorId)?._count.id || 0;

      return {
        vendedor: {
          id: vendedor?.id,
          nombre: vendedor?.nombre,
          apellido: vendedor?.apellido,
          nombreCompleto: `${vendedor?.nombre} ${vendedor?.apellido || ''}`.trim()
        },
        diasGuardia: stat._count.id,
        cargaPromedioGuardia: Math.round(stat._avg.cargaActual || 0),
        metaPromedioGuardia: Math.round(stat._avg.metaDelDia || 0),
        totalProspectosAsignados: prospectosAsignados,
        cargaActual: vendedor?.cargaProspectos || 0,
        eficiencia: stat._avg.metaDelDia && stat._avg.metaDelDia > 0 
          ? Math.round(((stat._avg.cargaActual || 0) / stat._avg.metaDelDia) * 100)
          : 0
      };
    });

    // Estadísticas por día
    const estadisticasDiarias = await prisma.vendedorGuardia.groupBy({
      by: ['fecha'],
      where: filtrosBase,
      _count: {
        id: true
      },
      _avg: {
        cargaActual: true
      },
      orderBy: {
        fecha: 'asc'
      }
    });

    // Calcular tendencias
    const tendenciaGuardias = estadisticasDiarias.map(dia => ({
      fecha: dia.fecha.toISOString().split('T')[0],
      vendedoresGuardia: dia._count.id,
      cargaPromedio: Math.round(dia._avg.cargaActual || 0)
    }));

    // Métricas de desempeño
    const metricas = {
      totalGuardias,
      guardiasActivas,
      porcentajeActivas: totalGuardias > 0 ? Math.round((guardiasActivas / totalGuardias) * 100) : 0,
      cargaPromedioGeneral: estadisticasVendedores.length > 0 
        ? Math.round(estadisticasVendedores.reduce((acc, stat) => acc + (stat._avg.cargaActual || 0), 0) / estadisticasVendedores.length)
        : 0,
      totalProspectosAsignados: prospectosPorGuardia.reduce((acc, p) => acc + p._count.id, 0),
      alertasDesbalance,
      diasAnalizados: Math.ceil((finPeriodo.getTime() - inicioPeriodo.getTime()) / (24 * 60 * 60 * 1000)),
      promedioVendedoresPorDia: tendenciaGuardias.length > 0 
        ? Math.round(tendenciaGuardias.reduce((acc, t) => acc + t.vendedoresGuardia, 0) / tendenciaGuardias.length)
        : 0
    };

    // Ranking de vendedores
    const ranking = estadisticasDetalladas
      .sort((a, b) => b.totalProspectosAsignados - a.totalProspectosAsignados)
      .slice(0, 10);

    return NextResponse.json({
      periodo: {
        inicio: inicioPeriodo.toISOString().split('T')[0],
        fin: finPeriodo.toISOString().split('T')[0],
        dias: metricas.diasAnalizados
      },
      metricas,
      vendedores: estadisticasDetalladas,
      tendenciasDiarias: tendenciaGuardias,
      ranking,
      resumen: {
        vendedorMasActivo: ranking[0] || null,
        mejorEficiencia: estadisticasDetalladas.sort((a, b) => b.eficiencia - a.eficiencia)[0] || null,
        promedioProspectosPorVendedor: estadisticasDetalladas.length > 0 
          ? Math.round(metricas.totalProspectosAsignados / estadisticasDetalladas.length)
          : 0
      }
    });

  } catch (error) {
    console.error('Error al obtener estadísticas de vendedores de guardia:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}
