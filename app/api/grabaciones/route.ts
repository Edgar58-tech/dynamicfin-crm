
/**
 * API para manejo de grabaciones de conversaciones
 * Soporta CRUD completo con control de pagos y límites
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { checkPaymentStatus, updateServiceUsage } from '@/lib/payment-guard';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

/**
 * GET - Obtener grabaciones del vendedor/agencia
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const prospectoId = searchParams.get('prospectoId');
    const vendedorId = searchParams.get('vendedorId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Filtros según rol del usuario
    let whereClause: any = {};

    if (session.user.rol === 'VENDEDOR') {
      // Vendedores solo ven sus propias grabaciones
      whereClause.vendedorId = session.user.id;
    } else if (session.user.rol === 'GERENTE_VENTAS' || session.user.rol === 'GERENTE_GENERAL') {
      // Gerentes ven grabaciones de su agencia
      whereClause.vendedor = {
        agenciaId: session.user.agenciaId,
      };
    } else if (session.user.rol === 'DIRECTOR_MARCA') {
      // Directores ven grabaciones de su marca
      whereClause.vendedor = {
        marcaId: session.user.marcaId,
      };
    } else if (session.user.rol === 'DIRECTOR_GENERAL') {
      // Director general ve todo su grupo
      whereClause.vendedor = {
        grupoId: session.user.grupoId,
      };
    }

    // Aplicar filtros adicionales
    if (prospectoId) {
      whereClause.prospectoId = parseInt(prospectoId);
    }
    if (vendedorId && (session.user.rol !== 'VENDEDOR' || vendedorId === session.user.id)) {
      whereClause.vendedorId = vendedorId;
    }

    const grabaciones = await prisma.grabacionConversacion.findMany({
      where: whereClause,
      include: {
        prospecto: {
          select: {
            nombre: true,
            apellido: true,
            vehiculoInteres: true,
            clasificacion: true,
          },
        },
        vendedor: {
          select: {
            nombre: true,
            apellido: true,
          },
        },
      },
      orderBy: {
        fechaGrabacion: 'desc',
      },
      take: limit,
      skip: offset,
    });

    const total = await prisma.grabacionConversacion.count({
      where: whereClause,
    });

    return NextResponse.json({
      grabaciones: grabaciones.map(g => ({
        ...g,
        costoTranscripcion: g.costoTranscripcion?.toNumber(),
        costoAnalisis: g.costoAnalisis?.toNumber(),
      })),
      total,
      hasMore: total > offset + limit,
    });

  } catch (error) {
    console.error('Error fetching grabaciones:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * POST - Crear nueva grabación
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (session.user.rol !== 'VENDEDOR' && session.user.rol !== 'GERENTE_VENTAS') {
      return NextResponse.json({ error: 'Rol no autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const {
      prospectoId,
      tipoLlamada,
      duracion,
      rutaArchivo,
      observacionesVendedor,
      tamanoArchivo,
      formatoAudio,
      dispositivoGrabacion,
    } = body;

    // Validaciones
    if (!prospectoId || !tipoLlamada || !duracion) {
      return NextResponse.json(
        { error: 'Campos requeridos: prospectoId, tipoLlamada, duracion' },
        { status: 400 }
      );
    }

    // Verificar que el prospecto pertenezca al vendedor o su agencia
    const prospecto = await prisma.prospecto.findFirst({
      where: {
        id: prospectoId,
        OR: [
          { vendedorId: session.user.id },
          session.user.rol === 'GERENTE_VENTAS' ? {
            vendedor: { agenciaId: session.user.agenciaId }
          } : {},
        ],
      },
    });

    if (!prospecto) {
      return NextResponse.json(
        { error: 'Prospecto no encontrado o no autorizado' },
        { status: 404 }
      );
    }

    // Verificar estado de pago de la agencia
    if (!session.user.agenciaId) {
      return NextResponse.json(
        { error: 'Usuario no asociado a agencia' },
        { status: 400 }
      );
    }

    const paymentStatus = await checkPaymentStatus(session.user.agenciaId, 'grabacion');
    if (!paymentStatus.canUseService) {
      return NextResponse.json(
        { 
          error: paymentStatus.reason,
          paymentStatus,
          code: 'PAYMENT_REQUIRED',
        },
        { status: 403 }
      );
    }

    // Determinar calidad basada en duración y tamaño
    let calidad: string = 'REGULAR';
    if (duracion > 60 && tamanoArchivo && tamanoArchivo > 1024 * 1024) { // > 1MB y > 1 minuto
      calidad = 'EXCELENTE';
    } else if (duracion > 30) {
      calidad = 'BUENA';
    } else if (duracion < 10) {
      calidad = 'MALA';
    }

    // Obtener IP del cliente
    const forwarded = request.headers.get('x-forwarded-for');
    const ipOrigen = forwarded ? forwarded.split(',')[0] : 
                   request.headers.get('x-real-ip') || 
                   'unknown';

    // Crear grabación
    const grabacion = await prisma.grabacionConversacion.create({
      data: {
        prospectoId: parseInt(prospectoId),
        vendedorId: session.user.id,
        tipoLlamada,
        duracion: parseInt(duracion),
        rutaArchivo,
        observacionesVendedor,
        tamanoArchivo: tamanoArchivo ? BigInt(tamanoArchivo) : null,
        formatoAudio: formatoAudio || 'webm',
        calidad,
        dispositivoGrabacion: dispositivoGrabacion || 'web',
        ipOrigen,
        fechaGrabacion: new Date(),
        procesado: false,
      },
      include: {
        prospecto: {
          select: {
            nombre: true,
            apellido: true,
            vehiculoInteres: true,
          },
        },
        vendedor: {
          select: {
            nombre: true,
            apellido: true,
          },
        },
      },
    });

    // Actualizar contador de uso de la agencia
    await updateServiceUsage(session.user.agenciaId, {
      grabacionesIncrement: 1,
      costoGrabacion: paymentStatus.costs.costPerRecording,
      costoTranscripcion: 0,
      costoAnalisis: 0,
    });

    return NextResponse.json({
      grabacion: {
        ...grabacion,
        tamanoArchivo: grabacion.tamanoArchivo?.toString(),
      },
      paymentStatus,
    });

  } catch (error) {
    console.error('Error creating grabacion:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * PUT - Actualizar grabación existente
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const {
      id,
      observacionesVendedor,
      transcripcion,
      analisisIA,
      analisisPilaresSPPC,
      procesado,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID de grabación requerido' },
        { status: 400 }
      );
    }

    // Verificar ownership
    let whereClause: any = { id: parseInt(id) };
    
    if (session.user.rol === 'VENDEDOR') {
      whereClause.vendedorId = session.user.id;
    } else if (session.user.rol === 'GERENTE_VENTAS' || session.user.rol === 'GERENTE_GENERAL') {
      whereClause.vendedor = { agenciaId: session.user.agenciaId };
    }

    const grabacionExistente = await prisma.grabacionConversacion.findFirst({
      where: whereClause,
    });

    if (!grabacionExistente) {
      return NextResponse.json(
        { error: 'Grabación no encontrada o no autorizada' },
        { status: 404 }
      );
    }

    // Actualizar grabación
    const updateData: any = {};
    
    if (observacionesVendedor !== undefined) updateData.observacionesVendedor = observacionesVendedor;
    if (transcripcion !== undefined) updateData.transcripcion = transcripcion;
    if (analisisIA !== undefined) updateData.analisisIA = analisisIA;
    if (analisisPilaresSPPC !== undefined) updateData.analisisPilaresSPPC = analisisPilaresSPPC;
    if (procesado !== undefined) {
      updateData.procesado = procesado;
      if (procesado) {
        updateData.fechaProcesamiento = new Date();
      }
    }

    const grabacion = await prisma.grabacionConversacion.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        prospecto: {
          select: {
            nombre: true,
            apellido: true,
            vehiculoInteres: true,
          },
        },
        vendedor: {
          select: {
            nombre: true,
            apellido: true,
          },
        },
      },
    });

    return NextResponse.json({
      grabacion: {
        ...grabacion,
        tamanoArchivo: grabacion.tamanoArchivo?.toString(),
      },
    });

  } catch (error) {
    console.error('Error updating grabacion:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Eliminar grabación
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID de grabación requerido' },
        { status: 400 }
      );
    }

    // Verificar ownership
    let whereClause: any = { id: parseInt(id) };
    
    if (session.user.rol === 'VENDEDOR') {
      whereClause.vendedorId = session.user.id;
    } else if (session.user.rol === 'GERENTE_VENTAS' || session.user.rol === 'GERENTE_GENERAL') {
      whereClause.vendedor = { agenciaId: session.user.agenciaId };
    } else if (session.user.rol !== 'DIRECTOR_MARCA' && session.user.rol !== 'DIRECTOR_GENERAL' && session.user.rol !== 'DYNAMICFIN_ADMIN') {
      return NextResponse.json({ error: 'Rol no autorizado' }, { status: 403 });
    }

    const grabacion = await prisma.grabacionConversacion.findFirst({
      where: whereClause,
    });

    if (!grabacion) {
      return NextResponse.json(
        { error: 'Grabación no encontrada o no autorizada' },
        { status: 404 }
      );
    }

    // Eliminar archivo del storage si existe
    if (grabacion.rutaArchivo) {
      // TODO: Implementar eliminación del archivo en Supabase Storage
      console.log('TODO: Eliminar archivo de storage:', grabacion.rutaArchivo);
    }

    // Eliminar grabación
    await prisma.grabacionConversacion.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({
      message: 'Grabación eliminada exitosamente',
    });

  } catch (error) {
    console.error('Error deleting grabacion:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
