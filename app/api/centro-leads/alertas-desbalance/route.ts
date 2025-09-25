// Force redeploy - cache clear v1.1
// API para gestión de alertas de desbalance en Centro de Leads
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = "force-dynamic";

// Obtener alertas de desbalance activas
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Solo gerentes y coordinadores pueden ver alertas
    if (!['GERENTE_VENTAS', 'GERENTE_GENERAL', 'COORDINADOR_LEADS', 'CENTRO_LEADS'].includes(session.user.rol)) {
      return NextResponse.json({ error: 'Sin permisos para ver alertas' }, { status: 403 });
    }

    const url = new URL(request.url);
    const estado = url.searchParams.get('estado') || 'ACTIVA';
    const limite = parseInt(url.searchParams.get('limite') || '10');

    // Obtener alertas de desbalance
    const alertas = await prisma.alertaDesbalance.findMany({
      where: {
        estadoAlerta: estado,
        // Solo alertas de la agencia del usuario
        usuario: {
          agenciaId: session.user.agenciaId
        }
      },
      include: {
        usuario: {
          select: {
            nombre: true,
            apellido: true
          }
        },
        vendedorAfectado: {
          select: {
            nombre: true,
            apellido: true,
            cargaProspectos: true
          }
        }
      },
      orderBy: {
        fechaDeteccion: 'desc'
      },
      take: limite
    });

    // Calcular estadísticas actuales de desbalance
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const vendedoresGuardiaActuales = await prisma.vendedorGuardia.findMany({
      where: {
        fecha: hoy,
        activo: true,
        vendedor: {
          agenciaId: session.user.agenciaId,
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
      }
    });

    let estadoActual: any = {
      hayDesbalance: false,
      diferencia: 0,
      vendedorSobrecargado: null,
      vendedorMenorCarga: null,
      totalVendedores: vendedoresGuardiaActuales.length,
      cargaPromedio: 0
    };

    if (vendedoresGuardiaActuales.length > 1) {
      const cargas = vendedoresGuardiaActuales.map(v => v.cargaActual);
      const maxCarga = Math.max(...cargas);
      const minCarga = Math.min(...cargas);
      const diferencia = maxCarga - minCarga;

      const vendedorSobrecargado = vendedoresGuardiaActuales.find(v => v.cargaActual === maxCarga)?.vendedor;
      const vendedorMenorCarga = vendedoresGuardiaActuales.find(v => v.cargaActual === minCarga)?.vendedor;
      
      estadoActual = {
        hayDesbalance: diferencia > 3,
        diferencia,
        vendedorSobrecargado: vendedorSobrecargado || null,
        vendedorMenorCarga: vendedorMenorCarga || null,
        totalVendedores: vendedoresGuardiaActuales.length,
        cargaPromedio: Math.round(cargas.reduce((a, b) => a + b, 0) / cargas.length)
      };
    }

    return NextResponse.json({
      alertas: alertas.map(alerta => ({
        id: alerta.id,
        tipo: alerta.tipoDesbalance,
        diferencia: alerta.diferenciaDetectada,
        umbral: alerta.umbralConfigurado,
        vendedorAfectado: alerta.vendedorAfectado ? {
          id: alerta.vendedorAfectadoId,
          nombre: alerta.vendedorAfectado.nombre,
          apellido: alerta.vendedorAfectado.apellido,
          carga: alerta.vendedorAfectado.cargaProspectos
        } : null,
        sugerencia: alerta.sugerenciaAccion,
        fechaDeteccion: alerta.fechaDeteccion,
        estado: alerta.estadoAlerta,
        accionTomada: alerta.accionTomada,
        fechaResolucion: alerta.fechaResolucion,
        observaciones: alerta.observaciones,
        createdBy: `${alerta.usuario.nombre} ${alerta.usuario.apellido || ''}`.trim()
      })),
      estadoActual,
      resumen: {
        alertasActivas: alertas.filter(a => a.estadoAlerta === 'ACTIVA').length,
        alertasResueltas: alertas.filter(a => a.estadoAlerta === 'RESUELTA').length,
        alertasIgnoradas: alertas.filter(a => a.estadoAlerta === 'IGNORADA').length
      }
    });

  } catch (error) {
    console.error('Error al obtener alertas de desbalance:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

// Crear nueva alerta de desbalance
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (!['GERENTE_VENTAS', 'GERENTE_GENERAL', 'COORDINADOR_LEADS'].includes(session.user.rol)) {
      return NextResponse.json({ error: 'Sin permisos para crear alertas' }, { status: 403 });
    }

    const {
      tipoDesbalance,
      vendedorAfectadoId,
      diferenciaDetectada,
      umbralConfigurado = 3,
      sugerenciaAccion,
      observaciones,
      datosDesbalance
    } = await request.json();

    if (!tipoDesbalance || !diferenciaDetectada) {
      return NextResponse.json({ error: 'Tipo de desbalance y diferencia son requeridos' }, { status: 400 });
    }

    // Verificar si ya existe una alerta activa similar
    const alertaExistente = await prisma.alertaDesbalance.findFirst({
      where: {
        usuarioId: session.user.id,
        tipoDesbalance,
        vendedorAfectadoId,
        estadoAlerta: 'ACTIVA',
        fechaDeteccion: {
          gte: new Date(Date.now() - 60 * 60 * 1000) // Última hora
        }
      }
    });

    if (alertaExistente) {
      return NextResponse.json({
        message: 'Ya existe una alerta similar activa',
        alertaExistente: { id: alertaExistente.id }
      });
    }

    // Crear nueva alerta
    const nuevaAlerta = await prisma.alertaDesbalance.create({
      data: {
        usuarioId: session.user.id,
        tipoDesbalance,
        vendedorAfectadoId,
        diferenciaDetectada,
        umbralConfigurado,
        sugerenciaAccion: sugerenciaAccion || 'redistribuir',
        observaciones: observaciones || `Alerta automática de desbalance. Diferencia: ${diferenciaDetectada}`,
        datosDesbalance: datosDesbalance ? JSON.stringify(datosDesbalance) : null
      },
      include: {
        vendedorAfectado: {
          select: {
            nombre: true,
            apellido: true
          }
        }
      }
    });

    // Log de actividad
    console.log(`Alerta de desbalance creada: ${tipoDesbalance} por ${session.user.nombre}`);

    return NextResponse.json({
      message: 'Alerta de desbalance creada exitosamente',
      alerta: {
        id: nuevaAlerta.id,
        tipo: nuevaAlerta.tipoDesbalance,
        diferencia: nuevaAlerta.diferenciaDetectada,
        vendedorAfectado: nuevaAlerta.vendedorAfectado,
        sugerencia: nuevaAlerta.sugerenciaAccion,
        fechaCreacion: nuevaAlerta.fechaDeteccion
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error al crear alerta de desbalance:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

// Actualizar estado de alerta (resolver, ignorar, etc.)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (!['GERENTE_VENTAS', 'GERENTE_GENERAL', 'COORDINADOR_LEADS'].includes(session.user.rol)) {
      return NextResponse.json({ error: 'Sin permisos para actualizar alertas' }, { status: 403 });
    }

    const {
      alertaId,
      nuevoEstado,
      accionTomada,
      observaciones
    } = await request.json();

    if (!alertaId || !nuevoEstado) {
      return NextResponse.json({ error: 'ID de alerta y nuevo estado requeridos' }, { status: 400 });
    }

    if (!['ACTIVA', 'EN_PROCESO', 'RESUELTA', 'IGNORADA'].includes(nuevoEstado)) {
      return NextResponse.json({ error: 'Estado inválido' }, { status: 400 });
    }

    // Verificar que la alerta existe y pertenece a la agencia
    const alerta = await prisma.alertaDesbalance.findFirst({
      where: {
        id: alertaId,
        usuario: {
          agenciaId: session.user.agenciaId
        }
      }
    });

    if (!alerta) {
      return NextResponse.json({ error: 'Alerta no encontrada' }, { status: 404 });
    }

    // Actualizar alerta
    const alertaActualizada = await prisma.alertaDesbalance.update({
      where: { id: alertaId },
      data: {
        estadoAlerta: nuevoEstado,
        accionTomada,
        observaciones: observaciones || alerta.observaciones,
        fechaResolucion: ['RESUELTA', 'IGNORADA'].includes(nuevoEstado) ? new Date() : null
      },
      include: {
        vendedorAfectado: {
          select: {
            nombre: true,
            apellido: true
          }
        }
      }
    });

    return NextResponse.json({
      message: 'Alerta actualizada exitosamente',
      alerta: {
        id: alertaActualizada.id,
        estado: alertaActualizada.estadoAlerta,
        accionTomada: alertaActualizada.accionTomada,
        fechaResolucion: alertaActualizada.fechaResolucion
      }
    });

  } catch (error) {
    console.error('Error al actualizar alerta de desbalance:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}
