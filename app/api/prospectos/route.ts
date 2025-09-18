
// API para gestión básica de prospectos
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

    const url = new URL(request.url);
    const estadoAsignacion = url.searchParams.get('estadoAsignacion');
    const limite = parseInt(url.searchParams.get('limite') || '50');
    const vendedorId = url.searchParams.get('vendedorId');

    // Construir filtros base
    const filtros: any = {
      agenciaId: session.user.agenciaId || 0
    };

    // Filtro por estado de asignación
    if (estadoAsignacion) {
      filtros.estadoAsignacion = estadoAsignacion;
    }

    // Filtro por vendedor específico
    if (vendedorId) {
      filtros.vendedorId = vendedorId;
    }

    // Obtener prospectos
    const prospectos = await prisma.prospecto.findMany({
      where: filtros,
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
            id: true,
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
            id: true,
            fechaAsignacion: true,
            metodologiaAsignacion: true,
            prioridadAsignacion: true
          }
        }
      },
      orderBy: [
        { fechaContacto: 'desc' },
        { nivelUrgencia: 'desc' }
      ],
      take: limite
    });

    // Formatear respuesta
    const prospectosFormateados = prospectos.map(prospecto => ({
      id: prospecto.id,
      nombre: prospecto.nombre,
      apellido: prospecto.apellido,
      telefono: prospecto.telefono,
      email: prospecto.email,
      vendedor: prospecto.vendedor ? {
        id: prospecto.vendedor.id,
        nombre: prospecto.vendedor.nombre,
        apellido: prospecto.vendedor.apellido,
        nombreCompleto: `${prospecto.vendedor.nombre} ${prospecto.vendedor.apellido || ''}`.trim()
      } : null,
      coordinador: prospecto.coordinador ? {
        id: prospecto.coordinador.id,
        nombre: prospecto.coordinador.nombre,
        apellido: prospecto.coordinador.apellido,
        nombreCompleto: `${prospecto.coordinador.nombre} ${prospecto.coordinador.apellido || ''}`.trim()
      } : null,
      vehiculo: prospecto.vehiculoCatalogo ? {
        marca: prospecto.vehiculoCatalogo.marca,
        modelo: prospecto.vehiculoCatalogo.modelo,
        year: prospecto.vehiculoCatalogo.year,
        descripcion: `${prospecto.vehiculoCatalogo.marca} ${prospecto.vehiculoCatalogo.modelo} ${prospecto.vehiculoCatalogo.year}`
      } : prospecto.vehiculoInteres ? {
        descripcion: prospecto.vehiculoInteres
      } : null,
      estatus: prospecto.estatus,
      estadoAsignacion: prospecto.estadoAsignacion,
      origenLead: prospecto.origenLead,
      nivelUrgencia: prospecto.nivelUrgencia,
      tiempoEsperado: prospecto.tiempoEsperado,
      calificacionTotal: prospecto.calificacionTotal,
      clasificacion: prospecto.clasificacion,
      presupuesto: prospecto.presupuesto,
      fechaContacto: prospecto.fechaContacto,
      fechaAsignacion: prospecto.fechaAsignacion,
      proximaSeguimiento: prospecto.proximaSeguimiento,
      notas: prospecto.notas,
      asignacion: prospecto.asignacionLead ? {
        fechaAsignacion: prospecto.asignacionLead.fechaAsignacion,
        metodologia: prospecto.asignacionLead.metodologiaAsignacion,
        prioridad: prospecto.asignacionLead.prioridadAsignacion
      } : null,
      createdAt: prospecto.createdAt,
      updatedAt: prospecto.updatedAt
    }));

    // Estadísticas básicas
    const estadisticas = {
      total: prospectosFormateados.length,
      porEstado: {
        pendientes: prospectosFormateados.filter(p => p.estadoAsignacion === 'PENDIENTE').length,
        asignados: prospectosFormateados.filter(p => p.estadoAsignacion === 'ASIGNADO').length,
        contactados: prospectosFormateados.filter(p => p.estadoAsignacion === 'CONTACTADO').length
      },
      porUrgencia: {
        alta: prospectosFormateados.filter(p => p.nivelUrgencia === 'ALTA').length,
        media: prospectosFormateados.filter(p => p.nivelUrgencia === 'MEDIA').length,
        baja: prospectosFormateados.filter(p => p.nivelUrgencia === 'BAJA').length
      },
      porOrigen: {
        llamadas: prospectosFormateados.filter(p => p.origenLead === 'LLAMADA_ENTRANTE').length,
        visitas: prospectosFormateados.filter(p => p.origenLead === 'VISITA_SHOWROOM').length,
        otros: prospectosFormateados.filter(p => p.origenLead === 'OTROS').length
      }
    };

    return NextResponse.json({
      prospectos: prospectosFormateados,
      estadisticas,
      filtros: {
        estadoAsignacion,
        vendedorId,
        limite
      }
    });

  } catch (error) {
    console.error('Error al obtener prospectos:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

// Actualizar prospecto (para cambios básicos)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const {
      prospectoId,
      estatus,
      estadoAsignacion,
      proximaSeguimiento,
      notas
    } = await request.json();

    if (!prospectoId) {
      return NextResponse.json({ error: 'ID de prospecto requerido' }, { status: 400 });
    }

    // Verificar que el prospecto pertenezca a la agencia
    const prospecto = await prisma.prospecto.findFirst({
      where: {
        id: prospectoId,
        agenciaId: session.user.agenciaId || 0
      }
    });

    if (!prospecto) {
      return NextResponse.json({ error: 'Prospecto no encontrado' }, { status: 404 });
    }

    // Actualizar prospecto
    const prospectoActualizado = await prisma.prospecto.update({
      where: { id: prospectoId },
      data: {
        ...(estatus && { estatus }),
        ...(estadoAsignacion && { estadoAsignacion }),
        ...(proximaSeguimiento && { proximaSeguimiento: new Date(proximaSeguimiento) }),
        ...(notas && { notas })
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
      message: 'Prospecto actualizado exitosamente',
      prospecto: {
        id: prospectoActualizado.id,
        nombre: prospectoActualizado.nombre,
        apellido: prospectoActualizado.apellido,
        estatus: prospectoActualizado.estatus,
        estadoAsignacion: prospectoActualizado.estadoAsignacion,
        vendedor: prospectoActualizado.vendedor
      }
    });

  } catch (error) {
    console.error('Error al actualizar prospecto:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}
