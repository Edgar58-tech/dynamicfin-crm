
// API para obtener leads pendientes de calificación para vendedores
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

    // Solo vendedores y gerentes pueden acceder
    if (!['VENDEDOR', 'GERENTE_VENTAS', 'GERENTE_GENERAL'].includes(session.user.rol)) {
      return NextResponse.json({ error: 'Sin permisos para ver leads pendientes' }, { status: 403 });
    }

    let vendedorId = session.user.id;
    
    // Si es un gerente, puede especificar otro vendedor o ver todos
    if (['GERENTE_VENTAS', 'GERENTE_GENERAL'].includes(session.user.rol)) {
      const { searchParams } = new URL(request.url);
      const vendedorParam = searchParams.get('vendedor');
      if (vendedorParam && vendedorParam !== 'all') {
        vendedorId = vendedorParam;
      } else if (vendedorParam === 'all') {
        vendedorId = '';
      }
    }

    const whereClause = {
      estatus: 'PENDIENTE_CALIFICACION',
      agenciaId: session.user.agenciaId || 0,
      ...(vendedorId && { vendedorId })
    };

    // Obtener leads pendientes de calificación
    const leadsPendientes = await prisma.prospecto.findMany({
      where: whereClause,
      include: {
        vendedor: {
          select: {
            id: true,
            nombre: true,
            apellido: true
          }
        },
        coordinador: {
          select: {
            nombre: true,
            apellido: true
          }
        },
        vehiculoCatalogo: {
          select: {
            marca: true,
            modelo: true,
            year: true
          }
        },
        asignacionLead: {
          select: {
            fechaAsignacion: true,
            prioridadAsignacion: true,
            observaciones: true
          }
        }
      },
      orderBy: {
        fechaAsignacion: 'asc'
      }
    });

    // Calcular tiempo de espera y nivel de alerta
    const ahora = new Date();
    const leadsConAlerta = leadsPendientes.map(lead => {
      const fechaAsignacion = lead.fechaAsignacion || lead.createdAt;
      const horasEspera = Math.floor((ahora.getTime() - fechaAsignacion.getTime()) / (1000 * 60 * 60));
      
      let alertaTiempo: 'NORMAL' | 'AMARILLA' | 'NARANJA' | 'ROJA' = 'NORMAL';
      if (horasEspera >= 8) {
        alertaTiempo = 'ROJA';
      } else if (horasEspera >= 4) {
        alertaTiempo = 'NARANJA';
      } else if (horasEspera >= 2) {
        alertaTiempo = 'AMARILLA';
      }

      const minutosEspera = Math.floor((ahora.getTime() - fechaAsignacion.getTime()) / (1000 * 60));

      return {
        ...lead,
        horasEspera,
        minutosEspera,
        alertaTiempo,
        vehiculoInteresTexto: lead.vehiculoCatalogo 
          ? `${lead.vehiculoCatalogo.marca} ${lead.vehiculoCatalogo.modelo} ${lead.vehiculoCatalogo.year}`
          : lead.vehiculoInteres || 'No especificado',
        coordinadorNombre: lead.coordinador 
          ? `${lead.coordinador.nombre} ${lead.coordinador.apellido || ''}`.trim()
          : 'No asignado',
        vendedorNombre: lead.vendedor 
          ? `${lead.vendedor.nombre} ${lead.vendedor.apellido || ''}`.trim()
          : 'No asignado'
      };
    });

    // Estadísticas de resumen
    const estadisticas = {
      total: leadsConAlerta.length,
      normal: leadsConAlerta.filter(l => l.alertaTiempo === 'NORMAL').length,
      amarilla: leadsConAlerta.filter(l => l.alertaTiempo === 'AMARILLA').length,
      naranja: leadsConAlerta.filter(l => l.alertaTiempo === 'NARANJA').length,
      roja: leadsConAlerta.filter(l => l.alertaTiempo === 'ROJA').length,
      promedioHoras: leadsConAlerta.length > 0 
        ? Math.round(leadsConAlerta.reduce((acc, lead) => acc + lead.horasEspera, 0) / leadsConAlerta.length)
        : 0
    };

    return NextResponse.json({
      leadsPendientes: leadsConAlerta,
      estadisticas,
      filtros: {
        vendedorId: vendedorId || 'all',
        esGerente: ['GERENTE_VENTAS', 'GERENTE_GENERAL'].includes(session.user.rol)
      }
    });

  } catch (error) {
    console.error('Error al obtener leads pendientes:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

// Marcar lead como iniciada la calificación
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (!['VENDEDOR', 'GERENTE_VENTAS', 'GERENTE_GENERAL'].includes(session.user.rol)) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
    }

    const { prospectoId, accion } = await request.json();

    if (!prospectoId || !accion) {
      return NextResponse.json({ error: 'Prospecto ID y acción requeridos' }, { status: 400 });
    }

    if (accion === 'iniciar_calificacion') {
      // Cambiar estado a "Contactado" para indicar que se inició el proceso de calificación
      const prospectoActualizado = await prisma.prospecto.update({
        where: { 
          id: prospectoId,
          vendedorId: session.user.id, // Solo el vendedor asignado puede marcarlo
          estatus: 'PENDIENTE_CALIFICACION'
        },
        data: {
          estatus: 'Contactado'
        },
        include: {
          vendedor: {
            select: {
              nombre: true,
              apellido: true
            }
          }
        }
      });

      return NextResponse.json({
        message: 'Calificación iniciada exitosamente',
        prospecto: prospectoActualizado
      });
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });

  } catch (error) {
    console.error('Error al actualizar estado del lead:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}
