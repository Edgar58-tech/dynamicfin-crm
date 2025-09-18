
// API para completar la calificación SPCC y cambiar el estado del prospecto
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = "force-dynamic";

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Solo vendedores y gerentes pueden completar calificaciones
    if (!['VENDEDOR', 'GERENTE_VENTAS', 'GERENTE_GENERAL'].includes(session.user.rol)) {
      return NextResponse.json({ error: 'Sin permisos para completar calificaciones' }, { status: 403 });
    }

    const { prospectoId, calificacionTotal, clasificacion } = await request.json();

    if (!prospectoId) {
      return NextResponse.json({ error: 'Prospecto ID requerido' }, { status: 400 });
    }

    // Verificar que el prospecto existe y está asignado al vendedor (o es gerente)
    const whereClause = {
      id: prospectoId,
      agenciaId: session.user.agenciaId || 0,
      estatus: 'PENDIENTE_CALIFICACION',
      ...(session.user.rol === 'VENDEDOR' && { vendedorId: session.user.id })
    };

    const prospecto = await prisma.prospecto.findFirst({
      where: whereClause,
      include: {
        vendedor: {
          select: {
            nombre: true,
            apellido: true
          }
        },
        asignacionLead: true
      }
    });

    if (!prospecto) {
      return NextResponse.json({ 
        error: 'Prospecto no encontrado o no está pendiente de calificación' 
      }, { status: 404 });
    }

    // Actualizar el prospecto con la calificación completada
    const prospectoActualizado = await prisma.prospecto.update({
      where: { id: prospectoId },
      data: {
        estatus: 'Calificado',
        calificacionTotal: calificacionTotal || 0,
        clasificacion: clasificacion || 'Explorador'
      },
      include: {
        vendedor: {
          select: {
            id: true,
            nombre: true,
            apellido: true
          }
        },
        calificaciones: {
          include: {
            pilar: true
          }
        }
      }
    });

    // Log de actividad
    console.log(`Calificación SPCC completada: Prospecto ${prospectoId} por ${session.user.nombre} - Clasificación: ${clasificacion}`);

    return NextResponse.json({
      message: 'Calificación SPCC completada exitosamente',
      prospecto: prospectoActualizado,
      transicion: {
        estadoAnterior: 'PENDIENTE_CALIFICACION',
        estadoNuevo: 'Calificado',
        calificacionTotal,
        clasificacion,
        fechaCalificacion: new Date()
      }
    });

  } catch (error) {
    console.error('Error al completar calificación:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

// Obtener estadísticas de calificaciones completadas
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (!['VENDEDOR', 'GERENTE_VENTAS', 'GERENTE_GENERAL'].includes(session.user.rol)) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const periodo = searchParams.get('periodo') || '30'; // días

    let vendedorId = session.user.id;
    if (['GERENTE_VENTAS', 'GERENTE_GENERAL'].includes(session.user.rol)) {
      const vendedorParam = searchParams.get('vendedor');
      if (vendedorParam && vendedorParam !== 'all') {
        vendedorId = vendedorParam;
      } else if (vendedorParam === 'all') {
        vendedorId = '';
      }
    }

    const fechaInicio = new Date();
    fechaInicio.setDate(fechaInicio.getDate() - parseInt(periodo));

    const whereClause = {
      estatus: 'Calificado',
      agenciaId: session.user.agenciaId || 0,
      updatedAt: {
        gte: fechaInicio
      },
      ...(vendedorId && { vendedorId })
    };

    const calificacionesCompletadas = await prisma.prospecto.findMany({
      where: whereClause,
      select: {
        id: true,
        nombre: true,
        apellido: true,
        calificacionTotal: true,
        clasificacion: true,
        updatedAt: true,
        origenLead: true,
        vendedor: {
          select: {
            nombre: true,
            apellido: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    // Estadísticas por clasificación
    const estadisticas = {
      totalCalificadas: calificacionesCompletadas.length,
      elite: calificacionesCompletadas.filter(p => p.clasificacion === 'Elite').length,
      calificado: calificacionesCompletadas.filter(p => p.clasificacion === 'Calificado').length,
      amadurar: calificacionesCompletadas.filter(p => p.clasificacion === 'A Madurar').length,
      explorador: calificacionesCompletadas.filter(p => p.clasificacion === 'Explorador').length,
      promedioCalificacion: calificacionesCompletadas.length > 0
        ? Math.round(calificacionesCompletadas.reduce((acc, p) => acc + parseFloat(p.calificacionTotal?.toString() || '0'), 0) / calificacionesCompletadas.length)
        : 0,
      delCentroLeads: calificacionesCompletadas.filter(p => 
        ['LLAMADA_ENTRANTE', 'VISITA_SHOWROOM'].includes(p.origenLead || '')
      ).length
    };

    return NextResponse.json({
      calificacionesCompletadas,
      estadisticas,
      periodo: parseInt(periodo)
    });

  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}
