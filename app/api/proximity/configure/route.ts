

/**
 * API para configuración del sistema de grabación por proximidad
 * Permite a los vendedores configurar sus preferencias de proximidad
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

/**
 * GET - Obtener configuración de proximidad del vendedor
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (session.user.rol !== 'VENDEDOR' && session.user.rol !== 'GERENTE_VENTAS') {
      return NextResponse.json({ error: 'Rol no autorizado' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const vendedorId = searchParams.get('vendedorId') || session.user.id;
    const zonaProximidadId = searchParams.get('zonaProximidadId');

    // Verificar permisos
    if (vendedorId !== session.user.id && session.user.rol !== 'GERENTE_VENTAS') {
      return NextResponse.json({ error: 'No autorizado para ver esta configuración' }, { status: 403 });
    }

    let whereClause: any = {
      vendedorId,
    };

    if (zonaProximidadId) {
      whereClause.zonaProximidadId = parseInt(zonaProximidadId);
    }

    const configuraciones = await prisma.configuracionProximidad.findMany({
      where: whereClause,
      include: {
        zonaProximidad: {
          select: {
            id: true,
            nombre: true,
            descripcion: true,
            tipo: true,
            latitud: true,
            longitud: true,
            radioMetros: true,
            activo: true,
          },
        },
        vendedor: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true,
          },
        },
      },
      orderBy: {
        ultimaConfiguracion: 'desc',
      },
    });

    return NextResponse.json({
      configuraciones: configuraciones.map(config => ({
        ...config,
        zonaProximidad: config.zonaProximidad ? {
          ...config.zonaProximidad,
          latitud: config.zonaProximidad.latitud?.toNumber(),
          longitud: config.zonaProximidad.longitud?.toNumber(),
        } : null,
      })),
      total: configuraciones.length,
    });

  } catch (error) {
    console.error('Error fetching proximity configuration:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * POST - Crear o actualizar configuración de proximidad
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
      vendedorId = session.user.id,
      zonaProximidadId,
      sistemaActivo = true,
      modoFuncionamiento = 'automatico',
      precisonGPS = 'alta',
      intervaloDeteccion = 30,
      inicioAutomatico = true,
      confirmarAntes = false,
      grabarEnBackground = true,
      notificacionesSonido = true,
      notificacionesVibrar = true,
      calidadAudio = 'media',
      compresionAudio = 'media',
      cancelarRuido = true,
      compartirUbicacion = true,
      almacenarUbicaciones = true,
      alertarGerente = false,
      alertarEquipo = false,
      horariosPersonalizados,
      zonasExcluidas,
      observaciones,
    } = body;

    // Verificar permisos
    if (vendedorId !== session.user.id && session.user.rol !== 'GERENTE_VENTAS') {
      return NextResponse.json({ error: 'No autorizado para configurar este vendedor' }, { status: 403 });
    }

    // Si se especifica una zona, verificar que pertenezca a la misma agencia
    if (zonaProximidadId && session.user.agenciaId) {
      const zona = await prisma.zonaProximidad.findFirst({
        where: {
          id: zonaProximidadId,
          agenciaId: session.user.agenciaId,
          activo: true,
        },
      });

      if (!zona) {
        return NextResponse.json(
          { error: 'Zona de proximidad no encontrada o no pertenece a tu agencia' },
          { status: 404 }
        );
      }
    }

    // Crear o actualizar configuración
    const configuracion = await prisma.configuracionProximidad.upsert({
      where: {
        vendedorId_zonaProximidadId: {
          vendedorId,
          zonaProximidadId: zonaProximidadId || null,
        },
      },
      update: {
        sistemaActivo,
        modoFuncionamiento,
        precisonGPS,
        intervaloDeteccion,
        inicioAutomatico,
        confirmarAntes,
        grabarEnBackground,
        notificacionesSonido,
        notificacionesVibrar,
        calidadAudio,
        compresionAudio,
        cancelarRuido,
        compartirUbicacion,
        almacenarUbicaciones,
        alertarGerente,
        alertarEquipo,
        horariosPersonalizados: horariosPersonalizados ? JSON.stringify(horariosPersonalizados) : null,
        zonasExcluidas: zonasExcluidas ? JSON.stringify(zonasExcluidas) : null,
        observaciones,
        ultimaConfiguracion: new Date(),
        updatedAt: new Date(),
      },
      create: {
        vendedorId,
        zonaProximidadId,
        sistemaActivo,
        modoFuncionamiento,
        precisonGPS,
        intervaloDeteccion,
        inicioAutomatico,
        confirmarAntes,
        grabarEnBackground,
        notificacionesSonido,
        notificacionesVibrar,
        calidadAudio,
        compresionAudio,
        cancelarRuido,
        compartirUbicacion,
        almacenarUbicaciones,
        alertarGerente,
        alertarEquipo,
        horariosPersonalizados: horariosPersonalizados ? JSON.stringify(horariosPersonalizados) : null,
        zonasExcluidas: zonasExcluidas ? JSON.stringify(zonasExcluidas) : null,
        observaciones,
        activo: true,
      },
      include: {
        zonaProximidad: {
          select: {
            id: true,
            nombre: true,
            tipo: true,
            latitud: true,
            longitud: true,
            radioMetros: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      configuracion: {
        ...configuracion,
        horariosPersonalizados: configuracion.horariosPersonalizados ? 
          JSON.parse(configuracion.horariosPersonalizados) : null,
        zonasExcluidas: configuracion.zonasExcluidas ? 
          JSON.parse(configuracion.zonasExcluidas) : null,
        zonaProximidad: configuracion.zonaProximidad ? {
          ...configuracion.zonaProximidad,
          latitud: configuracion.zonaProximidad.latitud?.toNumber(),
          longitud: configuracion.zonaProximidad.longitud?.toNumber(),
        } : null,
      },
      message: 'Configuración guardada exitosamente',
    });

  } catch (error) {
    console.error('Error saving proximity configuration:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * PUT - Actualizar configuración existente
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (session.user.rol !== 'VENDEDOR' && session.user.rol !== 'GERENTE_VENTAS') {
      return NextResponse.json({ error: 'Rol no autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID de configuración requerido' },
        { status: 400 }
      );
    }

    // Verificar que la configuración pertenezca al vendedor o que el usuario sea gerente
    const configuracionExistente = await prisma.configuracionProximidad.findUnique({
      where: { id: parseInt(id) },
      include: {
        vendedor: {
          select: {
            agenciaId: true,
          },
        },
      },
    });

    if (!configuracionExistente) {
      return NextResponse.json(
        { error: 'Configuración no encontrada' },
        { status: 404 }
      );
    }

    // Verificar permisos
    if (configuracionExistente.vendedorId !== session.user.id && 
        (session.user.rol !== 'GERENTE_VENTAS' || 
         configuracionExistente.vendedor.agenciaId !== session.user.agenciaId)) {
      return NextResponse.json(
        { error: 'No autorizado para modificar esta configuración' },
        { status: 403 }
      );
    }

    // Preparar datos de actualización
    const updateFields: any = {
      ...updateData,
      ultimaConfiguracion: new Date(),
      updatedAt: new Date(),
    };

    // Manejar campos JSON
    if (updateData.horariosPersonalizados) {
      updateFields.horariosPersonalizados = JSON.stringify(updateData.horariosPersonalizados);
    }
    if (updateData.zonasExcluidas) {
      updateFields.zonasExcluidas = JSON.stringify(updateData.zonasExcluidas);
    }

    // Actualizar configuración
    const configuracionActualizada = await prisma.configuracionProximidad.update({
      where: { id: parseInt(id) },
      data: updateFields,
      include: {
        zonaProximidad: {
          select: {
            id: true,
            nombre: true,
            tipo: true,
            latitud: true,
            longitud: true,
            radioMetros: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      configuracion: {
        ...configuracionActualizada,
        horariosPersonalizados: configuracionActualizada.horariosPersonalizados ? 
          JSON.parse(configuracionActualizada.horariosPersonalizados) : null,
        zonasExcluidas: configuracionActualizada.zonasExcluidas ? 
          JSON.parse(configuracionActualizada.zonasExcluidas) : null,
        zonaProximidad: configuracionActualizada.zonaProximidad ? {
          ...configuracionActualizada.zonaProximidad,
          latitud: configuracionActualizada.zonaProximidad.latitud?.toNumber(),
          longitud: configuracionActualizada.zonaProximidad.longitud?.toNumber(),
        } : null,
      },
      message: 'Configuración actualizada exitosamente',
    });

  } catch (error) {
    console.error('Error updating proximity configuration:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Eliminar configuración de proximidad
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (session.user.rol !== 'VENDEDOR' && session.user.rol !== 'GERENTE_VENTAS') {
      return NextResponse.json({ error: 'Rol no autorizado' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID de configuración requerido' },
        { status: 400 }
      );
    }

    // Verificar ownership
    const configuracion = await prisma.configuracionProximidad.findUnique({
      where: { id: parseInt(id) },
      include: {
        vendedor: {
          select: {
            agenciaId: true,
          },
        },
      },
    });

    if (!configuracion) {
      return NextResponse.json(
        { error: 'Configuración no encontrada' },
        { status: 404 }
      );
    }

    // Verificar permisos
    if (configuracion.vendedorId !== session.user.id && 
        (session.user.rol !== 'GERENTE_VENTAS' || 
         configuracion.vendedor.agenciaId !== session.user.agenciaId)) {
      return NextResponse.json(
        { error: 'No autorizado para eliminar esta configuración' },
        { status: 403 }
      );
    }

    // Eliminar configuración (soft delete marcando como inactiva)
    await prisma.configuracionProximidad.update({
      where: { id: parseInt(id) },
      data: {
        activo: false,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Configuración eliminada exitosamente',
    });

  } catch (error) {
    console.error('Error deleting proximity configuration:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
