
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const categoria = searchParams.get('categoria');
    const nivel = searchParams.get('nivel');
    const tipoCliente = searchParams.get('tipoCliente');
    const activo = searchParams.get('activo');

    const scenarios = await prisma.rolePlayScenario.findMany({
      where: {
        ...(categoria && { categoria }),
        ...(nivel && { nivelDificultad: nivel }),
        ...(tipoCliente && { tipoCliente }),
        ...(activo !== null && { activo: activo === 'true' }),
      },
      orderBy: [
        { categoria: 'asc' },
        { nivelDificultad: 'asc' },
        { titulo: 'asc' }
      ],
      select: {
        id: true,
        titulo: true,
        descripcion: true,
        categoria: true,
        nivelDificultad: true,
        tipoCliente: true,
        vehiculoInteres: true,
        presupuestoCliente: true,
        duracionEstimada: true,
        activo: true,
        dificultadPromedio: true,
        completadoVeces: true,
        puntuacionPromedio: true,
        etiquetas: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // Parse JSON fields
    const scenariosFormatted = scenarios.map(scenario => ({
      ...scenario,
      etiquetas: scenario.etiquetas ? JSON.parse(scenario.etiquetas) : [],
      presupuestoCliente: scenario.presupuestoCliente ? Number(scenario.presupuestoCliente) : null,
      dificultadPromedio: scenario.dificultadPromedio ? Number(scenario.dificultadPromedio) : null,
      puntuacionPromedio: scenario.puntuacionPromedio ? Number(scenario.puntuacionPromedio) : null
    }));

    return NextResponse.json({
      scenarios: scenariosFormatted,
      total: scenarios.length
    });

  } catch (error) {
    console.error('Error fetching scenarios:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Solo gerentes pueden crear escenarios
    if (!['GERENTE_VENTAS', 'GERENTE_GENERAL', 'DIRECTOR_MARCA', 'DIRECTOR_GENERAL', 'DYNAMICFIN_ADMIN'].includes(session.user.rol)) {
      return NextResponse.json({ error: 'Sin permisos para crear escenarios' }, { status: 403 });
    }

    const data = await request.json();
    
    // Validación básica
    if (!data.titulo || !data.descripcion || !data.categoria || !data.tipoCliente) {
      return NextResponse.json({ error: 'Campos requeridos faltantes' }, { status: 400 });
    }

    const scenario = await prisma.rolePlayScenario.create({
      data: {
        titulo: data.titulo,
        descripcion: data.descripcion,
        categoria: data.categoria,
        nivelDificultad: data.nivelDificultad || 'medio',
        tipoCliente: data.tipoCliente,
        personalidadCliente: JSON.stringify(data.personalidadCliente || {}),
        vehiculoInteres: data.vehiculoInteres,
        presupuestoCliente: data.presupuestoCliente ? Number(data.presupuestoCliente) : null,
        objetivosAprendizaje: JSON.stringify(data.objetivosAprendizaje || []),
        objecionesComunes: JSON.stringify(data.objecionesComunes || []),
        contextoPreventa: data.contextoPreventa,
        duracionEstimada: data.duracionEstimada || 15,
        pilaresEvaluados: JSON.stringify(data.pilaresEvaluados || []),
        etiquetas: JSON.stringify(data.etiquetas || []),
        activo: data.activo !== false
      },
      select: {
        id: true,
        titulo: true,
        descripcion: true,
        categoria: true,
        nivelDificultad: true,
        tipoCliente: true,
        vehiculoInteres: true,
        presupuestoCliente: true,
        duracionEstimada: true,
        activo: true,
        createdAt: true
      }
    });

    return NextResponse.json({
      message: 'Escenario creado exitosamente',
      scenario: {
        ...scenario,
        presupuestoCliente: scenario.presupuestoCliente ? Number(scenario.presupuestoCliente) : null
      }
    });

  } catch (error) {
    console.error('Error creating scenario:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Solo gerentes pueden actualizar escenarios
    if (!['GERENTE_VENTAS', 'GERENTE_GENERAL', 'DIRECTOR_MARCA', 'DIRECTOR_GENERAL', 'DYNAMICFIN_ADMIN'].includes(session.user.rol)) {
      return NextResponse.json({ error: 'Sin permisos para actualizar escenarios' }, { status: 403 });
    }

    const data = await request.json();
    
    if (!data.id) {
      return NextResponse.json({ error: 'ID del escenario requerido' }, { status: 400 });
    }

    const scenario = await prisma.rolePlayScenario.update({
      where: { id: data.id },
      data: {
        ...(data.titulo && { titulo: data.titulo }),
        ...(data.descripcion && { descripcion: data.descripcion }),
        ...(data.categoria && { categoria: data.categoria }),
        ...(data.nivelDificultad && { nivelDificultad: data.nivelDificultad }),
        ...(data.tipoCliente && { tipoCliente: data.tipoCliente }),
        ...(data.personalidadCliente && { personalidadCliente: JSON.stringify(data.personalidadCliente) }),
        ...(data.vehiculoInteres !== undefined && { vehiculoInteres: data.vehiculoInteres }),
        ...(data.presupuestoCliente !== undefined && { presupuestoCliente: data.presupuestoCliente ? Number(data.presupuestoCliente) : null }),
        ...(data.objetivosAprendizaje && { objetivosAprendizaje: JSON.stringify(data.objetivosAprendizaje) }),
        ...(data.objecionesComunes && { objecionesComunes: JSON.stringify(data.objecionesComunes) }),
        ...(data.contextoPreventa !== undefined && { contextoPreventa: data.contextoPreventa }),
        ...(data.duracionEstimada && { duracionEstimada: data.duracionEstimada }),
        ...(data.pilaresEvaluados && { pilaresEvaluados: JSON.stringify(data.pilaresEvaluados) }),
        ...(data.etiquetas && { etiquetas: JSON.stringify(data.etiquetas) }),
        ...(data.activo !== undefined && { activo: data.activo }),
      },
      select: {
        id: true,
        titulo: true,
        descripcion: true,
        categoria: true,
        nivelDificultad: true,
        tipoCliente: true,
        vehiculoInteres: true,
        presupuestoCliente: true,
        duracionEstimada: true,
        activo: true,
        updatedAt: true
      }
    });

    return NextResponse.json({
      message: 'Escenario actualizado exitosamente',
      scenario: {
        ...scenario,
        presupuestoCliente: scenario.presupuestoCliente ? Number(scenario.presupuestoCliente) : null
      }
    });

  } catch (error) {
    console.error('Error updating scenario:', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Escenario no encontrado' }, { status: 404 });
    }
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Solo gerentes pueden eliminar escenarios
    if (!['GERENTE_VENTAS', 'GERENTE_GENERAL', 'DIRECTOR_MARCA', 'DIRECTOR_GENERAL', 'DYNAMICFIN_ADMIN'].includes(session.user.rol)) {
      return NextResponse.json({ error: 'Sin permisos para eliminar escenarios' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'ID del escenario requerido' }, { status: 400 });
    }

    await prisma.rolePlayScenario.delete({
      where: { id: parseInt(id) }
    });

    return NextResponse.json({
      message: 'Escenario eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error deleting scenario:', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Escenario no encontrado' }, { status: 404 });
    }
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
