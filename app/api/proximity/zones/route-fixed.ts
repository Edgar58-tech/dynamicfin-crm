
/**
 * API para gestión de zonas de proximidad
 * Permite CRUD completo de zonas geográficas para activación automática de grabaciones
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

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
    const activo = searchParams.get('activo');
    const tipo = searchParams.get('tipo');

    // Construir filtros
    const whereClause: any = {
      agenciaId: session.user.agenciaId,
    };

    if (activo !== null) {
      whereClause.activo = activo === 'true';
    }

    if (tipo) {
      whereClause.tipo = tipo;
    }

    // Obtener zonas
    const zonas = await prisma.zonaProximidad.findMany({
      where: whereClause,
      include: {
        _count: {
          select: {
            grabacionesProximidad: {
              where: {
                horaEntrada: {
                  gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Últimos 30 días
                },
              },
            },
            configuracionesProximidad: {
              where: {
                activo: true,
              },
            },
          },
        },
      },
      orderBy: [
        { activo: 'desc' },
        { nombre: 'asc' },
      ],
    });

    // Formatear respuesta
    const zonasFormateadas = zonas.map(zona => ({
      id: zona.id,
      nombre: zona.nombre,
      descripcion: zona.descripcion,
      tipo: zona.tipo,
      latitud: zona.latitud.toNumber(),
      longitud: zona.longitud.toNumber(),
      radio: zona.radio.toNumber(),
      activo: zona.activo,
      configuracionAutomatica: zona.configuracionAutomatica ? JSON.parse(zona.configuracionAutomatica) : null,
      horariosActivo: zona.horariosActivo ? JSON.parse(zona.horariosActivo) : null,
      diasSemanaActivo: zona.diasSemanaActivo ? JSON.parse(zona.diasSemanaActivo) : null,
      metadatos: zona.metadatos ? JSON.parse(zona.metadatos) : null,
      createdAt: zona.createdAt,
      updatedAt: zona.updatedAt,
      estadisticas: {
        grabacionesUltimos30Dias: zona._count.grabacionesProximidad,
        vendedoresConfigurados: zona._count.configuracionesProximidad,
      },
    }));

    // Estadísticas generales
    const estadisticas = {
      totalZonas: zonas.length,
      zonasActivas: zonas.filter(z => z.activo).length,
      porTipo: {
        showroom: zonas.filter(z => z.tipo === 'showroom').length,
        test_drive: zonas.filter(z => z.tipo === 'test_drive').length,
        entrega: zonas.filter(z => z.tipo === 'entrega').length,
        reunion: zonas.filter(z => z.tipo === 'reunion').length,
        otro: zonas.filter(z => z.tipo === 'otro').length,
      },
    };

    return NextResponse.json({
      zonas: zonasFormateadas,
      estadisticas,
      filtros: {
        activo,
        tipo,
      },
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

    // Solo gerentes pueden crear zonas
    if (!['GERENTE_VENTAS', 'GERENTE_GENERAL', 'DIRECTOR_MARCA', 'DIRECTOR_GENERAL', 'DYNAMICFIN_ADMIN'].includes(session.user.rol)) {
      return NextResponse.json({ error: 'Sin permisos para crear zonas' }, { status: 403 });
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
      tipo,
      latitud,
      longitud,
      radio,
      configuracionAutomatica,
      horariosActivo,
      diasSemanaActivo,
      metadatos,
      activo = true,
    } = body;

    // Validaciones
    if (!nombre || !tipo || latitud === undefined || longitud === undefined || !radio) {
      return NextResponse.json(
        { error: 'Campos requeridos: nombre, tipo, latitud, longitud, radio' },
        { status: 400 }
      );
    }

    if (latitud < -90 || latitud > 90) {
      return NextResponse.json(
        { error: 'Latitud debe estar entre -90 y 90' },
        { status: 400 }
      );
    }

    if (longitud < -180 || longitud > 180) {
      return NextResponse.json(
        { error: 'Longitud debe estar entre -180 y 180' },
        { status: 400 }
      );
    }

    if (radio <= 0 || radio > 10000) {
      return NextResponse.json(
        { error: 'Radio debe estar entre 1 y 10000 metros' },
        { status: 400 }
      );
    }

    const tiposValidos = ['showroom', 'test_drive', 'entrega', 'reunion', 'otro'];
    if (!tiposValidos.includes(tipo)) {
      return NextResponse.json(
        { error: 'Tipo de zona no válido' },
        { status: 400 }
      );
    }

    // Verificar si ya existe una zona muy cercana (dentro de 50 metros)
    const zonasExistentes = await prisma.zonaProximidad.findMany({
      where: {
        agenciaId: session.user.agenciaId,
        activo: true,
      },
    });

    for (const zonaExistente of zonasExistentes) {
      const distancia = calcularDistancia(
        latitud,
        longitud,
        zonaExistente.latitud.toNumber(),
        zonaExistente.longitud.toNumber()
      );

      if (distancia < 50) {
        return NextResponse.json(
          { 
            error: `Ya existe una zona "${zonaExistente.nombre}" muy cerca (${Math.round(distancia)}m). Las zonas deben estar separadas al menos 50 metros.`,
            zonaConflicto: {
              id: zonaExistente.id,
              nombre: zonaExistente.nombre,
              distancia: Math.round(distancia),
            },
          },
          { status: 409 }
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
        latitud,
        longitud,
        radio,
        configuracionAutomatica: configuracionAutomatica ? JSON.stringify(configuracionAutomatica) : null,
        horariosActivo: horariosActivo ? JSON.stringify(horariosActivo) : null,
        diasSemanaActivo: diasSemanaActivo ? JSON.stringify(diasSemanaActivo) : null,
        metadatos: metadatos ? JSON.stringify(metadatos) : null,
        activo,
      },
    });

    return NextResponse.json({
      message: 'Zona de proximidad creada exitosamente',
      zona: {
        id: nuevaZona.id,
        nombre: nuevaZona.nombre,
        descripcion: nuevaZona.descripcion,
        tipo: nuevaZona.tipo,
        latitud: nuevaZona.latitud.toNumber(),
        longitud: nuevaZona.longitud.toNumber(),
        radio: nuevaZona.radio.toNumber(),
        activo: nuevaZona.activo,
        createdAt: nuevaZona.createdAt,
      },
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
 * PUT - Actualizar zona de proximidad
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Solo gerentes pueden actualizar zonas
    if (!['GERENTE_VENTAS', 'GERENTE_GENERAL', 'DIRECTOR_MARCA', 'DIRECTOR_GENERAL', 'DYNAMICFIN_ADMIN'].includes(session.user.rol)) {
      return NextResponse.json({ error: 'Sin permisos para actualizar zonas' }, { status: 403 });
    }

    const body = await request.json();
    const {
      id,
      nombre,
      descripcion,
      tipo,
      latitud,
      longitud,
      radio,
      configuracionAutomatica,
      horariosActivo,
      diasSemanaActivo,
      metadatos,
      activo,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID de zona requerido' },
        { status: 400 }
      );
    }

    // Verificar que la zona pertenezca a la agencia
    const zonaExistente = await prisma.zonaProximidad.findFirst({
      where: {
        id: parseInt(id),
        agenciaId: session.user.agenciaId,
      },
    });

    if (!zonaExistente) {
      return NextResponse.json(
        { error: 'Zona no encontrada o no autorizada' },
        { status: 404 }
      );
    }

    // Preparar datos de actualización
    const updateData: any = {};

    if (nombre !== undefined) updateData.nombre = nombre;
    if (descripcion !== undefined) updateData.descripcion = descripcion;
    if (tipo !== undefined) {
      const tiposValidos = ['showroom', 'test_drive', 'entrega', 'reunion', 'otro'];
      if (!tiposValidos.includes(tipo)) {
        return NextResponse.json(
          { error: 'Tipo de zona no válido' },
          { status: 400 }
        );
      }
      updateData.tipo = tipo;
    }
    if (latitud !== undefined) {
      if (latitud < -90 || latitud > 90) {
        return NextResponse.json(
          { error: 'Latitud debe estar entre -90 y 90' },
          { status: 400 }
        );
      }
      updateData.latitud = latitud;
    }
    if (longitud !== undefined) {
      if (longitud < -180 || longitud > 180) {
        return NextResponse.json(
          { error: 'Longitud debe estar entre -180 y 180' },
          { status: 400 }
        );
      }
      updateData.longitud = longitud;
    }
    if (radio !== undefined) {
      if (radio <= 0 || radio > 10000) {
        return NextResponse.json(
          { error: 'Radio debe estar entre 1 y 10000 metros' },
          { status: 400 }
        );
      }
      updateData.radio = radio;
    }
    if (configuracionAutomatica !== undefined) {
      updateData.configuracionAutomatica = configuracionAutomatica ? JSON.stringify(configuracionAutomatica) : null;
    }
    if (horariosActivo !== undefined) {
      updateData.horariosActivo = horariosActivo ? JSON.stringify(horariosActivo) : null;
    }
    if (diasSemanaActivo !== undefined) {
      updateData.diasSemanaActivo = diasSemanaActivo ? JSON.stringify(diasSemanaActivo) : null;
    }
    if (metadatos !== undefined) {
      updateData.metadatos = metadatos ? JSON.stringify(metadatos) : null;
    }
    if (activo !== undefined) updateData.activo = activo;

    // Actualizar zona
    const zonaActualizada = await prisma.zonaProximidad.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    return NextResponse.json({
      message: 'Zona de proximidad actualizada exitosamente',
      zona: {
        id: zonaActualizada.id,
        nombre: zonaActualizada.nombre,
        descripcion: zonaActualizada.descripcion,
        tipo: zonaActualizada.tipo,
        latitud: zonaActualizada.latitud.toNumber(),
        longitud: zonaActualizada.longitud.toNumber(),
        radio: zonaActualizada.radio.toNumber(),
        activo: zonaActualizada.activo,
        updatedAt: zonaActualizada.updatedAt,
      },
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

    // Solo gerentes pueden eliminar zonas
    if (!['GERENTE_VENTAS', 'GERENTE_GENERAL', 'DIRECTOR_MARCA', 'DIRECTOR_GENERAL', 'DYNAMICFIN_ADMIN'].includes(session.user.rol)) {
      return NextResponse.json({ error: 'Sin permisos para eliminar zonas' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID de zona requerido' },
        { status: 400 }
      );
    }

    // Verificar que la zona pertenezca a la agencia
    const zonaExistente = await prisma.zonaProximidad.findFirst({
      where: {
        id: parseInt(id),
        agenciaId: session.user.agenciaId,
      },
      include: {
        _count: {
          select: {
            grabacionesProximidad: true,
            configuracionesProximidad: true,
          },
        },
      },
    });

    if (!zonaExistente) {
      return NextResponse.json(
        { error: 'Zona no encontrada o no autorizada' },
        { status: 404 }
      );
    }

    // Verificar si hay grabaciones o configuraciones asociadas
    if (zonaExistente._count.grabacionesProximidad > 0) {
      return NextResponse.json(
        { 
          error: `No se puede eliminar la zona porque tiene ${zonaExistente._count.grabacionesProximidad} grabaciones asociadas. Desactívala en su lugar.`,
          hasAssociatedData: true,
          grabaciones: zonaExistente._count.grabacionesProximidad,
          configuraciones: zonaExistente._count.configuracionesProximidad,
        },
        { status: 409 }
      );
    }

    // Eliminar configuraciones asociadas primero
    if (zonaExistente._count.configuracionesProximidad > 0) {
      await prisma.configuracionProximidad.deleteMany({
        where: {
          zonaProximidadId: parseInt(id),
        },
      });
    }

    // Eliminar zona
    await prisma.zonaProximidad.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({
      message: 'Zona de proximidad eliminada exitosamente',
    });

  } catch (error) {
    console.error('Error deleting proximity zone:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * Función auxiliar para calcular distancia entre dos puntos geográficos
 * Usa la fórmula de Haversine
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
