
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.rol !== 'GERENTE_VENTAS') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const agenciaId = session.user.agenciaId;
    if (!agenciaId) {
      return NextResponse.json({ error: 'Usuario sin agencia asignada' }, { status: 400 });
    }

    // Obtener KPIs gerenciales
    const vendedores = await prisma.user.findMany({
      where: {
        agenciaId: agenciaId,
        rol: 'VENDEDOR',
        activo: true
      },
      include: {
        prospectosVendedor: {
          include: {
            calificaciones: {
              include: {
                pilar: true
              }
            }
          }
        },
        metas: {
          where: {
            mes: new Date().getMonth() + 1,
            year: new Date().getFullYear(),
            activo: true
          }
        }
      }
    });

    // Calcular métricas por vendedor
    const rendimientoVendedores = vendedores.map((vendedor: any) => {
      const prospectoActivos = vendedor.prospectosVendedor?.filter((p: any) => p.estatus !== 'Cliente') || [];
      const ventasRealizadas = vendedor.prospectosVendedor?.filter((p: any) => p.estatus === 'Cliente').length || 0;
      const meta = vendedor.metas[0]?.metaAutos || 0;
      
      return {
        id: vendedor.id,
        nombre: vendedor.nombre,
        apellido: vendedor.apellido,
        metaAutos: meta,
        autosVendidos: ventasRealizadas,
        porcentajeCumplimiento: meta > 0 ? Math.round((ventasRealizadas / meta) * 100) : 0,
        leadsActivos: prospectoActivos.length,
        tasaConversion: prospectoActivos.length > 0 ? Math.round((ventasRealizadas / (ventasRealizadas + prospectoActivos.length)) * 100) : 0,
        estado: ventasRealizadas >= meta ? 'excelente' : ventasRealizadas >= meta * 0.8 ? 'bueno' : 'necesita_coaching'
      };
    });

    // KPIs generales
    const totalPipeline = await prisma.prospecto.aggregate({
      where: {
        agenciaId: agenciaId,
        estatus: { not: 'Cliente' }
      },
      _sum: {
        presupuesto: true
      },
      _count: {
        id: true
      }
    });

    // Alertas críticas (simuladas)
    const alertasCriticas = [
      {
        id: 1,
        tipo: 'lead_critico',
        prioridad: 'alta',
        titulo: 'Lead premium sin seguimiento',
        mensaje: 'Roberto Martínez - $750,000 - Sin contacto hace 3 días',
        vendedor: 'Ana López',
        accion: 'Reasignar a top performer'
      }
    ];

    const response = {
      kpis: {
        pipelineTotal: Number(totalPipeline._sum.presupuesto) || 0,
        forecastMensual: Math.round((Number(totalPipeline._sum.presupuesto) || 0) * 0.35),
        vendedoresActivos: vendedores.length,
        tasaConversionEquipo: rendimientoVendedores.reduce((acc, v) => acc + v.tasaConversion, 0) / vendedores.length || 0,
        leadsNuevos: totalPipeline._count.id || 0,
        leadsCriticos: 3 // Simulado
      },
      vendedores: rendimientoVendedores,
      alertas: alertasCriticas
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error en dashboard gerencial:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
