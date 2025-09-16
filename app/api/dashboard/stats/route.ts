
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { rol, agenciaId, marcaId, grupoId } = session.user;

    // Build filter based on user role
    const filter: any = {};
    
    if (rol === 'VENDEDOR') {
      filter.vendedorId = session.user.id;
    } else if (rol === 'GERENTE_VENTAS' || rol === 'GERENTE_GENERAL') {
      if (agenciaId) filter.agenciaId = agenciaId;
    } else if (rol === 'DIRECTOR_MARCA') {
      if (marcaId) {
        const agencias = await prisma.agencia.findMany({
          where: { marcaId },
          select: { id: true },
        });
        filter.agenciaId = { in: agencias.map(a => a.id) };
      }
    } else if (rol === 'DIRECTOR_GENERAL') {
      if (grupoId) {
        const agencias = await prisma.agencia.findMany({
          where: { 
            marca: { grupoId } 
          },
          select: { id: true },
        });
        filter.agenciaId = { in: agencias.map(a => a.id) };
      }
    }
    // DYNAMICFIN_ADMIN has no filter - can see all

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    // Get prospect counts by classification
    const prospectoStats = await prisma.prospecto.groupBy({
      by: ['clasificacion'],
      where: filter,
      _count: {
        id: true,
      },
    });

    const prospectosSummary = {
      elite: prospectoStats.find(p => p.clasificacion === 'Elite')?._count.id || 0,
      calificado: prospectoStats.find(p => p.clasificacion === 'Calificado')?._count.id || 0,
      amadurar: prospectoStats.find(p => p.clasificacion === 'A Madurar')?._count.id || 0,
      explorador: prospectoStats.find(p => p.clasificacion === 'Explorador')?._count.id || 0,
      total: 0,
    };
    
    prospectosSummary.total = Object.values(prospectosSummary).reduce((a, b) => a + b, 0) - prospectosSummary.total;

    // Get metrics based on access level
    let metricasFilter: any = {};
    
    if (rol === 'GERENTE_VENTAS' || rol === 'GERENTE_GENERAL') {
      if (agenciaId) metricasFilter.agenciaId = agenciaId;
    } else if (rol === 'DIRECTOR_MARCA') {
      if (marcaId) {
        const agencias = await prisma.agencia.findMany({
          where: { marcaId },
          select: { id: true },
        });
        metricasFilter.agenciaId = { in: agencias.map(a => a.id) };
      }
    } else if (rol === 'DIRECTOR_GENERAL') {
      if (grupoId) {
        const agencias = await prisma.agencia.findMany({
          where: { 
            marca: { grupoId } 
          },
          select: { id: true },
        });
        metricasFilter.agenciaId = { in: agencias.map(a => a.id) };
      }
    }

    const metricas = await prisma.metricaVenta.findMany({
      where: {
        ...metricasFilter,
        mes: currentMonth,
        year: currentYear,
      },
    });

    const kpis = {
      optimizaciones: metricas.reduce((sum, m) => sum + m.optimizacionesProcesadas, 0),
      utilidadPromedio: metricas.length > 0 
        ? metricas.reduce((sum, m) => sum + Number(m.utilidadPromedio || 0), 0) / metricas.length 
        : 0,
      metaMensual: metricas.reduce((sum, m) => sum + m.metaVentas, 0),
      vendedoresActivos: metricas.reduce((sum, m) => sum + m.vendedoresActivos, 0),
      tasaConversion: metricas.length > 0
        ? metricas.reduce((sum, m) => sum + Number(m.tasaConversion || 0), 0) / metricas.length
        : 0,
      prospectosProcesados: metricas.reduce((sum, m) => sum + m.prospectosProcesados, 0),
      ventasRealizadas: metricas.reduce((sum, m) => sum + m.ventasRealizadas, 0),
    };

    // Get recent prospects
    const recentProspectos = await prisma.prospecto.findMany({
      where: filter,
      include: {
        vendedor: {
          select: {
            nombre: true,
            apellido: true,
          },
        },
        agencia: {
          select: {
            nombreAgencia: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: 10,
    });

    return NextResponse.json({
      prospectosSummary,
      kpis,
      recentProspectos,
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { error: 'Error al obtener estadísticas' },
      { status: 500 }
    );
  }
}
