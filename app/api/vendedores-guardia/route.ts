
// API para gestión del sistema de vendedores de guardia diario
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { TipoRol } from '@prisma/client';

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const url = new URL(request.url);
    const fecha = url.searchParams.get('fecha') || new Date().toISOString().split('T')[0];
    const soloActivos = url.searchParams.get('activos') === 'true';

    // Verificar permisos - Solo gerentes y coordinadores
    if (!['GERENTE_VENTAS', 'GERENTE_GENERAL', 'COORDINADOR_LEADS', 'CENTRO_LEADS'].includes(session.user.rol)) {
      return NextResponse.json({ error: 'Sin permisos suficientes' }, { status: 403 });
    }

    // Obtener vendedores de guardia para la fecha específica
    const vendedoresGuardia = await prisma.vendedorGuardia.findMany({
      where: {
        fecha: new Date(fecha),
        ...(soloActivos && { activo: true }),
        vendedor: {
          agenciaId: session.user.agenciaId,
          rol: TipoRol.VENDEDOR,
          activo: true
        }
      },
      include: {
        vendedor: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            cargaProspectos: true
          }
        }
      },
      orderBy: [
        { activo: 'desc' },
        { cargaActual: 'asc' }
      ]
    });

    // Si no hay vendedores de guardia para hoy, obtener lista de todos los vendedores disponibles
    let vendedoresDisponibles: any[] = [];
    if (vendedoresGuardia.length === 0 || !soloActivos) {
      vendedoresDisponibles = await prisma.user.findMany({
        where: {
          rol: TipoRol.VENDEDOR,
          agenciaId: session.user.agenciaId,
          activo: true
        },
        select: {
          id: true,
          nombre: true,
          apellido: true,
          cargaProspectos: true
        },
        orderBy: [
          { cargaProspectos: 'asc' },
          { nombre: 'asc' }
        ]
      });
    }

    // Calcular estadísticas
    const estadisticas = {
      totalVendedoresGuardia: vendedoresGuardia.filter(v => v.activo).length,
      cargaPromedio: vendedoresGuardia.length > 0 
        ? Math.round(vendedoresGuardia.reduce((acc, v) => acc + v.cargaActual, 0) / vendedoresGuardia.length)
        : 0,
      maxCarga: vendedoresGuardia.length > 0 
        ? Math.max(...vendedoresGuardia.map(v => v.cargaActual))
        : 0,
      minCarga: vendedoresGuardia.length > 0 
        ? Math.min(...vendedoresGuardia.map(v => v.cargaActual))
        : 0,
      desbalance: false,
      diferenciaMaxima: 0
    };

    if (vendedoresGuardia.length > 1) {
      estadisticas.diferenciaMaxima = estadisticas.maxCarga - estadisticas.minCarga;
      estadisticas.desbalance = estadisticas.diferenciaMaxima > 3;
    }

    return NextResponse.json({
      fecha,
      vendedoresGuardia: vendedoresGuardia.map(vg => ({
        id: vg.id,
        vendedorId: vg.vendedorId,
        vendedor: vg.vendedor,
        activo: vg.activo,
        horaInicio: vg.horaInicio,
        horaFin: vg.horaFin,
        cargaActual: vg.cargaActual,
        metaDelDia: vg.metaDelDia,
        observaciones: vg.observaciones
      })),
      vendedoresDisponibles,
      estadisticas,
      hayGuardiaDefinida: vendedoresGuardia.some(v => v.activo)
    });

  } catch (error) {
    console.error('Error al obtener vendedores de guardia:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Solo gerentes pueden definir vendedores de guardia
    if (!['GERENTE_VENTAS', 'GERENTE_GENERAL'].includes(session.user.rol)) {
      return NextResponse.json({ error: 'Solo gerentes pueden definir vendedores de guardia' }, { status: 403 });
    }

    const { vendedoresIds, fecha, horaInicio = '09:00', horaFin = '18:00', observaciones } = await request.json();

    if (!vendedoresIds || !Array.isArray(vendedoresIds) || vendedoresIds.length === 0) {
      return NextResponse.json({ error: 'Debe seleccionar al menos un vendedor' }, { status: 400 });
    }

    const fechaGuardia = fecha ? new Date(fecha) : new Date();
    fechaGuardia.setHours(0, 0, 0, 0); // Resetear horas para comparación

    // Verificar que todos los vendedores pertenezcan a la agencia
    const vendedores = await prisma.user.findMany({
      where: {
        id: { in: vendedoresIds },
        rol: TipoRol.VENDEDOR,
        agenciaId: session.user.agenciaId,
        activo: true
      }
    });

    if (vendedores.length !== vendedoresIds.length) {
      return NextResponse.json({ error: 'Algunos vendedores no son válidos o no están activos' }, { status: 400 });
    }

    // Limpiar vendedores de guardia existentes para esta fecha
    await prisma.vendedorGuardia.deleteMany({
      where: {
        fecha: fechaGuardia,
        vendedor: {
          agenciaId: session.user.agenciaId
        }
      }
    });

    // Crear nuevos registros de vendedores de guardia
    const nuevosVendedoresGuardia = await Promise.all(
      vendedoresIds.map(async (vendedorId: string) => {
        return await prisma.vendedorGuardia.create({
          data: {
            vendedorId,
            fecha: fechaGuardia,
            horaInicio,
            horaFin,
            activo: true,
            creadoPor: session.user.id,
            observaciones: observaciones || `Guardia definida por ${session.user.nombre}`,
            cargaActual: 0, // Se actualizará cuando se asignen prospectos
            metaDelDia: 5   // Meta por defecto
          },
          include: {
            vendedor: {
              select: {
                id: true,
                nombre: true,
                apellido: true,
                cargaProspectos: true
              }
            }
          }
        });
      })
    );

    // Registrar en log de actividad
    console.log(`Vendedores de guardia definidos por ${session.user.nombre} para ${fechaGuardia.toDateString()}: ${vendedoresIds.join(', ')}`);

    return NextResponse.json({
      message: 'Vendedores de guardia definidos exitosamente',
      fecha: fechaGuardia.toISOString().split('T')[0],
      vendedoresGuardia: nuevosVendedoresGuardia,
      total: nuevosVendedoresGuardia.length
    });

  } catch (error) {
    console.error('Error al definir vendedores de guardia:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Solo gerentes pueden modificar vendedores de guardia
    if (!['GERENTE_VENTAS', 'GERENTE_GENERAL'].includes(session.user.rol)) {
      return NextResponse.json({ error: 'Sin permisos suficientes' }, { status: 403 });
    }

    const { vendedorGuardiaId, cargaActual, metaDelDia, observaciones, activo } = await request.json();

    if (!vendedorGuardiaId) {
      return NextResponse.json({ error: 'ID de vendedor de guardia requerido' }, { status: 400 });
    }

    // Verificar que el vendedor de guardia pertenezca a la agencia
    const vendedorGuardia = await prisma.vendedorGuardia.findFirst({
      where: {
        id: vendedorGuardiaId,
        vendedor: {
          agenciaId: session.user.agenciaId
        }
      },
      include: {
        vendedor: true
      }
    });

    if (!vendedorGuardia) {
      return NextResponse.json({ error: 'Vendedor de guardia no encontrado' }, { status: 404 });
    }

    // Actualizar vendedor de guardia
    const vendedorActualizado = await prisma.vendedorGuardia.update({
      where: { id: vendedorGuardiaId },
      data: {
        ...(cargaActual !== undefined && { cargaActual }),
        ...(metaDelDia !== undefined && { metaDelDia }),
        ...(observaciones !== undefined && { observaciones }),
        ...(activo !== undefined && { activo })
      },
      include: {
        vendedor: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            cargaProspectos: true
          }
        }
      }
    });

    return NextResponse.json({
      message: 'Vendedor de guardia actualizado exitosamente',
      vendedorGuardia: vendedorActualizado
    });

  } catch (error) {
    console.error('Error al actualizar vendedor de guardia:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Solo gerentes pueden eliminar vendedores de guardia
    if (!['GERENTE_VENTAS', 'GERENTE_GENERAL'].includes(session.user.rol)) {
      return NextResponse.json({ error: 'Sin permisos suficientes' }, { status: 403 });
    }

    const url = new URL(request.url);
    const fecha = url.searchParams.get('fecha');

    if (!fecha) {
      return NextResponse.json({ error: 'Fecha requerida' }, { status: 400 });
    }

    const fechaGuardia = new Date(fecha);
    fechaGuardia.setHours(0, 0, 0, 0);

    // Eliminar todos los vendedores de guardia para la fecha especificada
    const eliminados = await prisma.vendedorGuardia.deleteMany({
      where: {
        fecha: fechaGuardia,
        vendedor: {
          agenciaId: session.user.agenciaId
        }
      }
    });

    return NextResponse.json({
      message: 'Vendedores de guardia eliminados exitosamente',
      eliminados: eliminados.count,
      fecha: fecha
    });

  } catch (error) {
    console.error('Error al eliminar vendedores de guardia:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}
