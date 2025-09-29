
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Solo roles de centro de leads pueden acceder
    if (!['CENTRO_LEADS', 'COORDINADOR_LEADS', 'GERENTE_VENTAS', 'GERENTE_GENERAL'].includes(session.user.rol)) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
    }

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const manana = new Date(hoy);
    manana.setDate(manana.getDate() + 1);

    // Obtener vendedores de guardia
    const vendedoresGuardia = await prisma.vendedorGuardia.findMany({
      where: {
        fecha: hoy,
        activo: true
      },
      include: {
        vendedor: {
          select: {
            id: true,
            nombre: true,
            apellido: true
          }
        }
      }
    });

    const hayGuardia = vendedoresGuardia.length > 0;

    if (!hayGuardia) {
      return NextResponse.json({
        vendedores: [],
        estadisticas: null,
        hayGuardia: false,
        recomendacion: null
      });
    }

    // Calcular carga actual de cada vendedor
    const vendedores = [];
    const cargas = [];
    
    for (const guardia of vendedoresGuardia) {
      const cargaActual = await prisma.prospecto.count({
        where: {
          vendedorId: guardia.vendedorId,
          fechaCreacion: {
            gte: hoy,
            lt: manana
          }
        }
      });

      const metaDelDia = guardia.metaDelDia || 10;
      const porcentajeMeta = Math.round((cargaActual / metaDelDia) * 100);
      
      cargas.push(cargaActual);
      
      vendedores.push({
        id: guardia.vendedorId,
        nombre: guardia.vendedor.nombre,
        apellido: guardia.vendedor.apellido,
        nombreCompleto: `${guardia.vendedor.nombre} ${guardia.vendedor.apellido || ''}`.trim(),
        cargaActual,
        metaDelDia,
        porcentajeMeta,
        recomendado: false, // Se actualizará después
        sobrecargado: porcentajeMeta > 100
      });
    }

    // Calcular estadísticas
    const cargaPromedio = Math.round(cargas.reduce((a, b) => a + b, 0) / cargas.length);
    const maxCarga = Math.max(...cargas);
    const minCarga = Math.min(...cargas);
    const diferencia = maxCarga - minCarga;

    const estadisticas = {
      cargaPromedio,
      maxCarga,
      minCarga,
      diferencia,
      hayDesbalance: diferencia >= 3
    };

    // Encontrar vendedor recomendado (menor carga)
    const vendedorConMenorCarga = vendedores.find(v => v.cargaActual === minCarga);
    if (vendedorConMenorCarga) {
      vendedorConMenorCarga.recomendado = true;
    }

    const recomendacion = vendedorConMenorCarga ? {
      vendedorId: vendedorConMenorCarga.id,
      razon: `Menor carga actual (${minCarga} prospectos asignados)`
    } : null;

    return NextResponse.json({
      vendedores,
      estadisticas,
      hayGuardia: true,
      recomendacion
    });

  } catch (error) {
    console.error('Error al obtener vendedores para asignación:', error);
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

    // Solo roles de centro de leads pueden asignar manualmente
    if (!['COORDINADOR_LEADS', 'GERENTE_VENTAS', 'GERENTE_GENERAL'].includes(session.user.rol)) {
      return NextResponse.json({ error: 'Sin permisos para asignación manual' }, { status: 403 });
    }

    const { prospectoId, vendedorId, prioridad, metodo, observaciones, forzarDesbalance } = await request.json();

    if (!prospectoId || !vendedorId) {
      return NextResponse.json({ error: 'Prospecto ID y Vendedor ID son requeridos' }, { status: 400 });
    }

    // Verificar que el prospecto existe y no está asignado
    const prospecto = await prisma.prospecto.findFirst({
      where: {
        id: prospectoId,
        estadoAsignacion: 'PENDIENTE'
      }
    });

    if (!prospecto) {
      return NextResponse.json({ error: 'Prospecto no encontrado o ya asignado' }, { status: 404 });
    }

    // Verificar que el vendedor está de guardia
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    const vendedorGuardia = await prisma.vendedorGuardia.findFirst({
      where: {
        vendedorId,
        fechaGuardia: hoy,
        activo: true
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

    if (!vendedorGuardia) {
      return NextResponse.json({ error: 'El vendedor seleccionado no está de guardia' }, { status: 400 });
    }

    // Verificar desbalance si no está forzado
    if (!forzarDesbalance) {
      const manana = new Date(hoy);
      manana.setDate(manana.getDate() + 1);

      // Obtener todos los vendedores de guardia y sus cargas
      const vendedoresGuardia = await prisma.vendedorGuardia.findMany({
        where: {
          fechaGuardia: hoy,
          activo: true
        }
      });

      const cargas = [];
      for (const guardia of vendedoresGuardia) {
        const cargaActual = await prisma.prospecto.count({
          where: {
            vendedorId: guardia.vendedorId,
            fechaCreacion: {
              gte: hoy,
              lt: manana
            }
          }
        });
        cargas.push({ vendedorId: guardia.vendedorId, carga: cargaActual });
      }

      const cargaVendedorSeleccionado = cargas.find(c => c.vendedorId === vendedorId)?.carga || 0;
      const cargaNuevaSeleccionado = cargaVendedorSeleccionado + 1;
      const menorCarga = Math.min(...cargas.map(c => c.carga));
      const mayorCarga = Math.max(...cargas.map(c => c.carga));
      
      // Si la asignación crea un desbalance significativo
      const nuevaDiferencia = Math.max(cargaNuevaSeleccionado - menorCarga, mayorCarga - menorCarga);
      
      if (nuevaDiferencia >= 3 && cargaVendedorSeleccionado !== menorCarga) {
        const vendedorConMenorCarga = cargas.find(c => c.carga === menorCarga);
        const vendedorSugeridoInfo = vendedoresGuardia.find(g => g.vendedorId === vendedorConMenorCarga?.vendedorId);
        
        return NextResponse.json({
          error: 'DESBALANCE_DETECTADO',
          alertaDesbalance: {
            diferencia: nuevaDiferencia,
            vendedorSeleccionado: {
              nombre: `${vendedorGuardia.vendedor.nombre} ${vendedorGuardia.vendedor.apellido || ''}`.trim(),
              cargaActual: cargaVendedorSeleccionado,
              cargaNueva: cargaNuevaSeleccionado
            },
            vendedorSugerido: vendedorSugeridoInfo ? {
              id: vendedorSugeridoInfo.vendedorId,
              nombre: `Vendedor ID ${vendedorSugeridoInfo.vendedorId}`, // Aquí podrías obtener el nombre real
              carga: menorCarga
            } : null
          }
        }, { status: 409 });
      }
    }

    // Realizar la asignación
    await prisma.$transaction(async (tx) => {
      // Actualizar prospecto
      await tx.prospecto.update({
        where: { id: prospectoId },
        data: {
          vendedorId,
          estadoAsignacion: 'ASIGNADO',
          fechaAsignacion: new Date(),
          prioridadAsignacion: prioridad || 'NORMAL',
          metodoAsignacion: metodo || 'MANUAL'
        }
      });

      // Crear historial de asignación
      await tx.historialAsignacion.create({
        data: {
          prospectoId,
          vendedorId,
          fechaAsignacion: new Date(),
          metodo: metodo || 'MANUAL',
          asignadoPor: session.user.id,
          observaciones: observaciones || `Asignación manual realizada por ${session.user.nombre}`
        }
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Lead asignado exitosamente',
      vendedorAsignado: {
        id: vendedorId,
        nombre: `${vendedorGuardia.vendedor.nombre} ${vendedorGuardia.vendedor.apellido || ''}`.trim()
      }
    });

  } catch (error) {
    console.error('Error al asignar lead manualmente:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
