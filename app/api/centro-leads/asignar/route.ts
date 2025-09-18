
// API para asignación manual de leads con balanceo de carga
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar permisos
    if (!['CENTRO_LEADS', 'COORDINADOR_LEADS', 'GERENTE_VENTAS'].includes(session.user.rol)) {
      return NextResponse.json({ error: 'Sin permisos para asignar leads' }, { status: 403 });
    }

    const {
      prospectoId,
      vendedorId,
      prioridad = 'NORMAL',
      metodo = 'MANUAL',
      observaciones,
      forzarDesbalance = false
    } = await request.json();

    if (!prospectoId || !vendedorId) {
      return NextResponse.json({ error: 'Prospecto y vendedor requeridos' }, { status: 400 });
    }

    // Verificar que el prospecto existe y no está asignado
    const prospecto = await prisma.prospecto.findFirst({
      where: { 
        id: prospectoId,
        agenciaId: session.user.agenciaId || 0
      }
    });

    if (!prospecto) {
      return NextResponse.json({ error: 'Prospecto no encontrado' }, { status: 404 });
    }

    if (prospecto.estadoAsignacion === 'ASIGNADO') {
      return NextResponse.json({ error: 'El prospecto ya está asignado' }, { status: 400 });
    }

    // Verificar que el vendedor está de guardia hoy
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const vendedorGuardia = await prisma.vendedorGuardia.findFirst({
      where: {
        vendedorId,
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

    if (!vendedorGuardia) {
      return NextResponse.json({ 
        error: 'El vendedor seleccionado no está de guardia hoy o no está activo' 
      }, { status: 400 });
    }

    // Verificar desbalance de carga
    const otrosVendedoresGuardia = await prisma.vendedorGuardia.findMany({
      where: {
        fecha: hoy,
        activo: true,
        vendedorId: { not: vendedorId },
        vendedor: {
          agenciaId: session.user.agenciaId,
          activo: true
        }
      },
      select: {
        cargaActual: true,
        vendedor: {
          select: {
            nombre: true
          }
        }
      }
    });

    let alertaDesbalance: any = null;
    if (otrosVendedoresGuardia.length > 0) {
      const cargasOtros = otrosVendedoresGuardia.map(v => v.cargaActual);
      const minCargaOtros = Math.min(...cargasOtros);
      const diferencia = (vendedorGuardia.cargaActual + 1) - minCargaOtros;

      if (diferencia > 3 && !forzarDesbalance) {
        const vendedorMenorCarga = otrosVendedoresGuardia.find(v => v.cargaActual === minCargaOtros);
        
        alertaDesbalance = {
          tipo: 'CARGA_DESIGUAL',
          diferencia,
          vendedorSeleccionado: {
            nombre: `${vendedorGuardia.vendedor.nombre} ${vendedorGuardia.vendedor.apellido || ''}`.trim(),
            cargaActual: vendedorGuardia.cargaActual,
            cargaNueva: vendedorGuardia.cargaActual + 1
          },
          vendedorSugerido: {
            nombre: vendedorMenorCarga?.vendedor.nombre,
            carga: minCargaOtros
          }
        };

        return NextResponse.json({
          error: 'DESBALANCE_DETECTADO',
          message: `Asignar a este vendedor creará un desbalance de ${diferencia} leads. ¿Continuar?`,
          alertaDesbalance,
          permitirForzar: true
        }, { status: 409 });
      }
    }

    try {
      // Realizar asignación en transacción
      const resultado = await prisma.$transaction(async (tx) => {
        // Actualizar prospecto
        const prospectoActualizado = await tx.prospecto.update({
          where: { id: prospectoId },
          data: {
            vendedorId: vendedorId,
            estadoAsignacion: 'ASIGNADO',
            estatus: 'PENDIENTE_CALIFICACION', // Estado específico para leads del Centro de Leads
            fechaAsignacion: new Date(),
            origenLead: prospecto.origenLead || 'OTROS' // Preservar origen
          },
          include: {
            vendedor: {
              select: {
                id: true,
                nombre: true,
                apellido: true,
                email: true
              }
            },
            vehiculoCatalogo: true
          }
        });

        // Crear o actualizar registro de asignación
        await tx.asignacionLead.upsert({
          where: { prospectoId },
          update: {
            vendedorAsignadoId: vendedorId,
            coordinadorId: session.user.id,
            metodologiaAsignacion: metodo,
            cargaVendedorMomento: vendedorGuardia.cargaActual,
            motivoAsignacion: forzarDesbalance ? 'desbalance_forzado' : 'asignacion_manual',
            prioridadAsignacion: prioridad,
            observaciones: observaciones || `Asignación manual por ${session.user.nombre}`,
            fechaAsignacion: new Date()
          },
          create: {
            prospectoId,
            coordinadorId: session.user.id,
            vendedorAsignadoId: vendedorId,
            metodologiaAsignacion: metodo,
            cargaVendedorMomento: vendedorGuardia.cargaActual,
            motivoAsignacion: forzarDesbalance ? 'desbalance_forzado' : 'asignacion_manual',
            prioridadAsignacion: prioridad,
            observaciones: observaciones || `Asignación manual por ${session.user.nombre}`
          }
        });

        // Actualizar carga del vendedor de guardia
        await tx.vendedorGuardia.update({
          where: { id: vendedorGuardia.id },
          data: {
            cargaActual: {
              increment: 1
            }
          }
        });

        // Actualizar carga general del vendedor
        await tx.user.update({
          where: { id: vendedorId },
          data: {
            cargaProspectos: {
              increment: 1
            }
          }
        });

        // Si se forzó un desbalance, crear alerta
        if (forzarDesbalance && alertaDesbalance) {
          await tx.alertaDesbalance.create({
            data: {
              usuarioId: session.user.id,
              tipoDesbalance: 'CARGA_DESIGUAL',
              vendedorAfectadoId: vendedorId,
              diferenciaDetectada: alertaDesbalance.diferencia,
              sugerenciaAccion: 'redistribuir',
              observaciones: `Desbalance forzado en asignación manual. Diferencia: ${alertaDesbalance.diferencia} leads.`,
              datosDesbalance: JSON.stringify(alertaDesbalance)
            }
          });
        }

        return prospectoActualizado;
      });

      // Log de actividad
      console.log(`Lead asignado manualmente: ${resultado.nombre} a ${vendedorGuardia.vendedor.nombre} por ${session.user.nombre}`);

      return NextResponse.json({
        message: 'Lead asignado exitosamente',
        prospecto: resultado,
        vendedorAsignado: {
          id: vendedorId,
          nombre: vendedorGuardia.vendedor.nombre,
          apellido: vendedorGuardia.vendedor.apellido,
          cargaNueva: vendedorGuardia.cargaActual + 1
        },
        asignacion: {
          metodo: metodo,
          prioridad: prioridad,
          forzado: forzarDesbalance,
          razon: forzarDesbalance ? 'Asignación forzada ignorando desbalance' : 'Asignación manual'
        },
        alertaGenerada: forzarDesbalance && alertaDesbalance
      }, { status: 200 });

    } catch (transactionError) {
      console.error('Error en transacción de asignación:', transactionError);
      return NextResponse.json({ 
        error: 'Error al asignar lead',
        details: transactionError instanceof Error ? transactionError.message : 'Error en transacción'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error al asignar lead:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

// Obtener opciones de asignación (vendedores disponibles)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (!['CENTRO_LEADS', 'COORDINADOR_LEADS', 'GERENTE_VENTAS'].includes(session.user.rol)) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
    }

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    // Obtener vendedores de guardia con su carga actual
    const vendedoresGuardia = await prisma.vendedorGuardia.findMany({
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
      },
      orderBy: {
        cargaActual: 'asc'
      }
    });

    if (vendedoresGuardia.length === 0) {
      return NextResponse.json({
        hayGuardia: false,
        vendedores: [],
        message: 'No hay vendedores de guardia definidos para hoy'
      });
    }

    // Calcular métricas de balanceo
    const cargas = vendedoresGuardia.map(v => v.cargaActual);
    const cargaPromedio = Math.round(cargas.reduce((a, b) => a + b, 0) / cargas.length);
    const maxCarga = Math.max(...cargas);
    const minCarga = Math.min(...cargas);

    return NextResponse.json({
      hayGuardia: true,
      vendedores: vendedoresGuardia.map(vg => ({
        id: vg.vendedorId,
        nombre: vg.vendedor.nombre,
        apellido: vg.vendedor.apellido,
        nombreCompleto: `${vg.vendedor.nombre} ${vg.vendedor.apellido || ''}`.trim(),
        cargaActual: vg.cargaActual,
        metaDelDia: vg.metaDelDia,
        porcentajeMeta: vg.metaDelDia > 0 ? Math.round((vg.cargaActual / vg.metaDelDia) * 100) : 0,
        recomendado: vg.cargaActual === minCarga,
        sobrecargado: maxCarga - minCarga > 3 && vg.cargaActual === maxCarga
      })),
      estadisticas: {
        cargaPromedio,
        maxCarga,
        minCarga,
        diferencia: maxCarga - minCarga,
        hayDesbalance: (maxCarga - minCarga) > 3
      },
      recomendacion: {
        vendedorId: vendedoresGuardia[0].vendedorId, // El de menor carga
        razon: 'Vendedor con menor carga actual'
      }
    });

  } catch (error) {
    console.error('Error al obtener opciones de asignación:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}
