

/**
 * API para gestión de zonas de proximidad
 * Permite crear, leer, actualizar y eliminar zonas geográficas para grabación automática
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

/**
 * Función helper para calcular distancia entre dos puntos (Haversine formula)
 */
function calcularDistancia(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Radio de la Tierra en metros
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * GET - Obtener zonas de proximidad de la agencia
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (!session.user.agenciaId) {
      return NextResponse.json(
        { error: 'Usuario no asociado a agencia' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get('tipo');
    const activo = searchParams.get('activo');
    const latitud = searchParams.get('latitud');
    const longitud = searchParams.get('longitud');
    const radioKm = searchParams.get('radioKm');

    let whereClause: any = {
      agenciaId: session.user.agenciaId,
    };

    if (tipo) whereClause.tipo = tipo;
    if (activo !== null) whereClause.activo = activo === 'true';

    const zonas = await prisma.zonaProximidad.findMany({
      where: whereClause,
      include: {
        configuraciones: {
          where: {
            activo: true,
          },
          select: {
            id: true,
            vendedorId: true,
            sistemaActivo: true,
            vendedor: {
              select: {
                nombre: true,
                apellido: true,
              },
            },
          },
        },
      } as any,
      orderBy: [
        { activo: 'desc' },
        { nombre: 'asc' },
      ],
    });

    // Si se proporcionan coordenadas, calcular distancias
    let zonasConDistancia = zonas;
    if (latitud && longitud) {
      const lat = parseFloat(latitud);
      const lon = parseFloat(longitud);
      const maxRadio = radioKm ? parseFloat(radioKm) * 1000 : null; // Convertir km a metros

      zonasConDistancia = zonas
        .map(zona => ({
          ...zona,
          distanciaMetros: calcularDistancia(
            lat, 
            lon, 
            zona.latitud?.toNumber() || 0, 
            zona.longitud?.toNumber() || 0
          ),
        }))
        .filter(zona => !maxRadio || zona.distanciaMetros <= maxRadio)
        .sort((a, b) => a.distanciaMetros - b.distanciaMetros);
    }

    return NextResponse.json({
      zonas: zonasConDistancia.map(zona => ({
        ...zona,
        latitud: zona.latitud?.toNumber(),
        longitud: zona.longitud?.toNumber(),
        coordenadas: zona.coordenadas ? JSON.parse(zona.coordenadas) : null,
        horariosActivos: zona.horariosActivos ? JSON.parse(zona.horariosActivos) : null,
      })),
      total: zonasConDistancia.length,
    });

  } catch (error) {
    console.error('Error fetching proximity zones:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * POST - Crear nueva zona de proximidad
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (session.user.rol !== 'GERENTE_VENTAS' && session.user.rol !== 'GERENTE_GENERAL') {
      return NextResponse.json({ error: 'Solo gerentes pueden crear zonas' }, { status: 403 });
    }

    if (!session.user.agenciaId) {
      return NextResponse.json(
        { error: 'Usuario no asociado a agencia' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      nombre,
      descripcion,
      tipo = 'custom',
      latitud,
      longitud,
      radioMetros = 50,
      coordenadas,
      activarGrabacion = true,
      tipoGrabacion = 'automatica',
      duracionMaxima = 3600,
      calidadGrabacion = 'media',
      notificarEntrada = true,
      notificarSalida = true,
      notificarGerente = false,
      horariosActivos,
      diasActivos = '1,2,3,4,5,6,7',
      observaciones,
    } = body;

    // Validaciones
    if (!nombre || !latitud || !longitud) {
      return NextResponse.json(
        { error: 'Nombre, latitud y longitud son requeridos' },
        { status: 400 }
      );
    }

    if (radioMetros < 10 || radioMetros > 1000) {
      return NextResponse.json(
        { error: 'El radio debe estar entre 10 y 1000 metros' },
        { status: 400 }
      );
    }

    // Verificar si ya existe una zona muy cercana (menos de 20 metros)
    const zonasExistentes = await prisma.zonaProximidad.findMany({
      where: {
        agenciaId: session.user.agenciaId,
        activo: true,
      },
    });

    for (const zonaExistente of zonasExistentes) {
      const distancia = calcularDistancia(
        parseFloat(latitud),
        parseFloat(longitud),
        zonaExistente.latitud?.toNumber() || 0,
        zonaExistente.longitud?.toNumber() || 0
      );

      if (distancia < 20) {
        return NextResponse.json(
          { 
            error: `Ya existe una zona "${zonaExistente.nombre}" muy cerca (${Math.round(distancia)}m). Las zonas deben estar separadas al menos 20 metros.` 
          },
          { status: 400 }
        );
      }
    }

    // Crear zona
    const nuevaZona = await prisma.zonaProximidad.create({
      data: {
        agenciaId: session.user.agenciaId,
        nombre,
        descripcion,
        tipo,
        latitud: parseFloat(latitud),
        longitud: parseFloat(longitud),
        radioMetros,
        coordenadas: coordenadas ? JSON.stringify(coordenadas) : null,
        activarGrabacion,
        tipoGrabacion,
        duracionMaxima,
        calidadGrabacion,
        notificarEntrada,
        notificarSalida,
        notificarGerente,
        horariosActivos: horariosActivos ? JSON.stringify(horariosActivos) : null,
        diasActivos,
        creadoPor: session.user.id,
        observaciones,
        activo: true,
      },
      include: {
        _count: {
          select: {
            configuraciones: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      zona: {
        ...nuevaZona,
        latitud: nuevaZona.latitud?.toNumber(),
        longitud: nuevaZona.longitud?.toNumber(),
        coordenadas: nuevaZona.coordenadas ? JSON.parse(nuevaZona.coordenadas) : null,
        horariosActivos: nuevaZona.horariosActivos ? JSON.parse(nuevaZona.horariosActivos) : null,
      },
      message: 'Zona de proximidad creada exitosamente',
    });

  } catch (error) {
    console.error('Error creating proximity zone:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * PUT - Actualizar zona de proximidad existente
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (session.user.rol !== 'GERENTE_VENTAS' && session.user.rol !== 'GERENTE_GENERAL') {
      return NextResponse.json({ error: 'Solo gerentes pueden modificar zonas' }, { status: 403 });
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID de zona requerido' },
        { status: 400 }
      );
    }

    // Verificar que la zona pertenezca a la agencia del usuario
    const zonaExistente = await prisma.zonaProximidad.findFirst({
      where: {
        id: parseInt(id),
        agenciaId: session.user.agenciaId,
      },
    });

    if (!zonaExistente) {
      return NextResponse.json(
        { error: 'Zona no encontrada o no pertenece a tu agencia' },
        { status: 404 }
      );
    }

    // Preparar datos de actualización
    const updateFields: any = {
      ...updateData,
      updatedAt: new Date(),
    };

    // Manejar campos JSON y conversiones
    if (updateData.coordenadas) {
      updateFields.coordenadas = JSON.stringify(updateData.coordenadas);
    }
    if (updateData.horariosActivos) {
      updateFields.horariosActivos = JSON.stringify(updateData.horariosActivos);
    }
    if (updateData.latitud) {
      updateFields.latitud = parseFloat(updateData.latitud);
    }
    if (updateData.longitud) {
      updateFields.longitud = parseFloat(updateData.longitud);
    }

    // Si se cambian las coordenadas, verificar conflictos
    if (updateFields.latitud && updateFields.longitud) {
      const otrasZonas = await prisma.zonaProximidad.findMany({
        where: {
          agenciaId: session.user.agenciaId,
          activo: true,
          NOT: { id: parseInt(id) },
        },
      });

      for (const otraZona of otrasZonas) {
        const distancia = calcularDistancia(
          updateFields.latitud,
          updateFields.longitud,
          otraZona.latitud?.toNumber() || 0,
          otraZona.longitud?.toNumber() || 0
        );

        if (distancia < 20) {
          return NextResponse.json(
            { 
              error: `La nueva ubicación está muy cerca de la zona "${otraZona.nombre}" (${Math.round(distancia)}m). Las zonas deben estar separadas al menos 20 metros.` 
            },
            { status: 400 }
          );
        }
      }
    }

    // Actualizar zona
    const zonaActualizada = await prisma.zonaProximidad.update({
      where: { id: parseInt(id) },
      data: updateFields,
      include: {
        configuraciones: {
          where: { activo: true },
          select: {
            id: true,
            vendedorId: true,
            sistemaActivo: true,
            vendedor: {
              select: {
                nombre: true,
                apellido: true,
              },
            },
          },
        },
        _count: {
          select: {
            grabaciones: true,
            logs: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      zona: {
        ...zonaActualizada,
        latitud: zonaActualizada.latitud?.toNumber(),
        longitud: zonaActualizada.longitud?.toNumber(),
        coordenadas: zonaActualizada.coordenadas ? JSON.parse(zonaActualizada.coordenadas) : null,
        horariosActivos: zonaActualizada.horariosActivos ? JSON.parse(zonaActualizada.horariosActivos) : null,
      },
      message: 'Zona actualizada exitosamente',
    });

  } catch (error) {
    console.error('Error updating proximity zone:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Eliminar zona de proximidad
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (session.user.rol !== 'GERENTE_VENTAS' && session.user.rol !== 'GERENTE_GENERAL') {
      return NextResponse.json({ error: 'Solo gerentes pueden eliminar zonas' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID de zona requerido' },
        { status: 400 }
      );
    }

    // Verificar que la zona pertenezca a la agencia del usuario
    const zona = await prisma.zonaProximidad.findFirst({
      where: {
        id: parseInt(id),
        agenciaId: session.user.agenciaId,
      },
      include: {
        _count: {
          select: {
            configuraciones: true,
            grabaciones: true,
            logs: true,
          },
        },
      },
    });

    if (!zona) {
      return NextResponse.json(
        { error: 'Zona no encontrada o no pertenece a tu agencia' },
        { status: 404 }
      );
    }

    // Soft delete - marcamos como inactiva en lugar de eliminar
    await prisma.zonaProximidad.update({
      where: { id: parseInt(id) },
      data: {
        activo: false,
        updatedAt: new Date(),
      },
    });

    // También desactivar configuraciones asociadas
    await prisma.configuracionProximidad.updateMany({
      where: {
        zonaProximidadId: parseInt(id),
      },
      data: {
        activo: false,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Zona "${zona.nombre}" eliminada exitosamente`,
      detalles: {
        configuracionesAfectadas: zona._count.configuraciones,
        grabacionesHistoricas: zona._count.grabaciones,
        logsHistoricos: zona._count.logs,
      },
    });

  } catch (error) {
    console.error('Error deleting proximity zone:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
