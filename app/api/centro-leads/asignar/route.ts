
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface AsignacionRequest {
  prospectoId: number;
  metodologia?: 'BALANCEADO' | 'MANUAL' | 'URGENTE' | 'ESPECIALIDAD';
  vendedorEspecifico?: string; // Para asignación manual
  prioridad?: 'BAJA' | 'NORMAL' | 'ALTA' | 'URGENTE';
  motivoAsignacion?: string;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar que el usuario sea coordinador de leads
    if (session.user.rol !== 'CENTRO_LEADS' && session.user.rol !== 'GERENTE_VENTAS' && session.user.rol !== 'GERENTE_GENERAL') {
      return NextResponse.json({ 
        error: 'Sin permisos para asignar leads' 
      }, { status: 403 });
    }

    const data: AsignacionRequest = await request.json();

    if (!data.prospectoId) {
      return NextResponse.json({ error: 'ID de prospecto requerido' }, { status: 400 });
    }

    // Obtener prospecto
    const prospecto = await prisma.prospecto.findFirst({
      where: {
        id: data.prospectoId,
        agenciaId: session.user.agenciaId || undefined,
        estadoAsignacion: 'PENDIENTE'
      },
      include: {
        vehiculoCatalogo: true,
        asignacionLead: true
      }
    });

    if (!prospecto) {
      return NextResponse.json({ 
        error: 'Prospecto no encontrado o ya asignado' 
      }, { status: 404 });
    }

    if (prospecto.asignacionLead) {
      return NextResponse.json({ 
        error: 'El prospecto ya tiene una asignación activa' 
      }, { status: 400 });
    }

    let vendedorAsignado: any = null;
    let metodologiaUsada = data.metodologia || 'BALANCEADO';
    let motivoAsignacion = data.motivoAsignacion || '';

    // ALGORITMO DE ASIGNACIÓN
    switch (metodologiaUsada) {
      case 'MANUAL':
        if (!data.vendedorEspecifico) {
          return NextResponse.json({ 
            error: 'Vendedor específico requerido para asignación manual' 
          }, { status: 400 });
        }
        
        vendedorAsignado = await prisma.user.findFirst({
          where: {
            id: data.vendedorEspecifico,
            agenciaId: session.user.agenciaId,
            rol: 'VENDEDOR',
            activo: true
          }
        });
        
        motivoAsignacion = motivoAsignacion || 'Asignación manual por coordinador';
        break;

      case 'URGENTE':
        // Buscar vendedor de guardia disponible
        vendedorAsignado = await findVendedorUrgente(session.user.agenciaId!);
        motivoAsignacion = motivoAsignacion || 'Asignación urgente - vendedor de guardia';
        break;

      case 'ESPECIALIDAD':
        // Buscar vendedor especializado según el vehículo
        vendedorAsignado = await findVendedorEspecializado(
          session.user.agenciaId!,
          prospecto.vehiculoCatalogo?.marca || prospecto.vehiculoInteres || ''
        );
        motivoAsignacion = motivoAsignacion || 'Asignación por especialidad de producto';
        break;

      default: // BALANCEADO
        vendedorAsignado = await findVendedorBalanceado(session.user.agenciaId!);
        motivoAsignacion = motivoAsignacion || 'Asignación balanceada por carga de trabajo';
        break;
    }

    if (!vendedorAsignado) {
      return NextResponse.json({ 
        error: 'No hay vendedores disponibles para la asignación' 
      }, { status: 400 });
    }

    // Crear asignación
    const asignacion = await prisma.asignacionLead.create({
      data: {
        prospectoId: data.prospectoId,
        coordinadorId: session.user.id,
        vendedorAsignadoId: vendedorAsignado.id,
        metodologiaAsignacion: metodologiaUsada,
        cargaCoordinadorMomento: session.user.cargaProspectos || 0,
        cargaVendedorMomento: vendedorAsignado.cargaProspectos || 0,
        motivoAsignacion: motivoAsignacion,
        prioridadAsignacion: data.prioridad || 'NORMAL',
        notificacionEnviada: false
      }
    });

    // Actualizar prospecto
    await prisma.prospecto.update({
      where: { id: data.prospectoId },
      data: {
        vendedorId: vendedorAsignado.id,
        estadoAsignacion: 'ASIGNADO',
        fechaAsignacion: new Date(),
        coordinadorId: session.user.id
      }
    });

    // Incrementar carga del vendedor
    await prisma.user.update({
      where: { id: vendedorAsignado.id },
      data: {
        cargaProspectos: {
          increment: 1
        }
      }
    });

    // Crear alerta para el vendedor (si es urgente)
    if (data.prioridad === 'URGENTE' || data.prioridad === 'ALTA') {
      await prisma.alertaSistema.create({
        data: {
          usuarioId: vendedorAsignado.id,
          tipoAlerta: 'lead_critico',
          prioridad: data.prioridad === 'URGENTE' ? 'alta' : 'media',
          titulo: `Nuevo lead ${data.prioridad.toLowerCase()} asignado`,
          mensaje: `Se te ha asignado un nuevo prospecto: ${prospecto.nombre} ${prospecto.apellido}`,
          datos: JSON.stringify({
            prospectoId: prospecto.id,
            clasificacion: prospecto.clasificacion,
            vehiculoInteres: prospecto.vehiculoInteres,
            presupuesto: prospecto.presupuesto
          })
        }
      });
    }

    // Enviar notificación (implementar según sistema de notificaciones)
    await sendNotificationToVendedor(vendedorAsignado.id, {
      type: 'nuevo_lead',
      prospecto: {
        id: prospecto.id,
        nombre: `${prospecto.nombre} ${prospecto.apellido}`,
        telefono: prospecto.telefono,
        vehiculoInteres: prospecto.vehiculoInteres,
        clasificacion: prospecto.clasificacion,
        prioridad: data.prioridad
      }
    });

    // Verificar si hay desbalance y crear alerta si es necesario
    await checkAndCreateDesbalanceAlert(session.user.agenciaId!);

    return NextResponse.json({
      success: true,
      asignacion: {
        id: asignacion.id,
        prospecto: {
          id: prospecto.id,
          nombre: `${prospecto.nombre} ${prospecto.apellido}`,
          telefono: prospecto.telefono,
          email: prospecto.email,
          clasificacion: prospecto.clasificacion,
          vehiculoInteres: prospecto.vehiculoInteres
        },
        vendedorAsignado: {
          id: vendedorAsignado.id,
          nombre: `${vendedorAsignado.nombre} ${vendedorAsignado.apellido || ''}`.trim(),
          email: vendedorAsignado.email,
          cargaAnterior: vendedorAsignado.cargaProspectos || 0,
          cargaNueva: (vendedorAsignado.cargaProspectos || 0) + 1
        },
        metodologia: metodologiaUsada,
        prioridad: data.prioridad || 'NORMAL',
        fechaAsignacion: asignacion.fechaAsignacion,
        motivoAsignacion
      }
    });

  } catch (error: any) {
    console.error('Error asignando lead:', error);
    return NextResponse.json({
      error: 'Error interno del servidor',
      details: error.message
    }, { status: 500 });
  }
}

async function findVendedorBalanceado(agenciaId: number) {
  // Encontrar vendedor con menor carga actual
  const vendedores = await prisma.user.findMany({
    where: {
      agenciaId: agenciaId,
      rol: 'VENDEDOR',
      activo: true
    },
    orderBy: {
      cargaProspectos: 'asc'
    },
    take: 5 // Top 5 con menor carga
  });

  if (vendedores.length === 0) return null;

  // Si hay empate en carga, seleccionar el que tiene mejor performance
  const vendedoresConMetricas = await Promise.all(
    vendedores.map(async (vendedor) => {
      const metricas = await prisma.metaVendedor.findFirst({
        where: {
          vendedorId: vendedor.id,
          mes: new Date().getMonth() + 1,
          year: new Date().getFullYear()
        }
      });

      return {
        ...vendedor,
        porcentajeCumplimiento: Number(metricas?.porcentajeCumplimiento || 50)
      };
    })
  );

  // Ordenar por carga (asc) y luego por cumplimiento (desc)
  vendedoresConMetricas.sort((a, b) => {
    if (a.cargaProspectos === b.cargaProspectos) {
      return b.porcentajeCumplimiento - a.porcentajeCumplimiento;
    }
    return a.cargaProspectos - b.cargaProspectos;
  });

  return vendedoresConMetricas[0];
}

async function findVendedorUrgente(agenciaId: number) {
  const hoy = new Date();
  const fechaHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());

  // Buscar vendedor de guardia para hoy
  const vendedorGuardia = await prisma.vendedorGuardia.findFirst({
    where: {
      fecha: fechaHoy,
      activo: true,
      cargaActual: {
        lt: 10  // Carga menor a la meta del día (valor por defecto)
      },
      vendedor: {
        agenciaId: agenciaId,
        activo: true
      }
    },
    include: {
      vendedor: true
    },
    orderBy: {
      cargaActual: 'asc'
    }
  });

  if (vendedorGuardia?.vendedor) {
    // Incrementar carga del vendedor de guardia
    await prisma.vendedorGuardia.update({
      where: { id: vendedorGuardia.id },
      data: {
        cargaActual: {
          increment: 1
        }
      }
    });

    return vendedorGuardia.vendedor;
  }

  // Si no hay vendedor de guardia disponible, usar balanceado
  return await findVendedorBalanceado(agenciaId);
}

async function findVendedorEspecializado(agenciaId: number, vehiculoMarca: string) {
  // Buscar vendedores con especialidad en la marca
  const vendedoresEspecializados = await prisma.metaVendedor.findMany({
    where: {
      vendedor: {
        agenciaId: agenciaId,
        rol: 'VENDEDOR',
        activo: true
      },
      especialidad: {
        contains: vehiculoMarca,
        mode: 'insensitive'
      },
      mes: new Date().getMonth() + 1,
      year: new Date().getFullYear()
    },
    include: {
      vendedor: true
    },
    orderBy: [
      { porcentajeCumplimiento: 'desc' },
      { vendedor: { cargaProspectos: 'asc' } }
    ]
  });

  if (vendedoresEspecializados.length > 0) {
    return vendedoresEspecializados[0].vendedor;
  }

  // Si no hay especialistas, usar balanceado
  return await findVendedorBalanceado(agenciaId);
}

async function sendNotificationToVendedor(vendedorId: string, notification: any) {
  // Implementar sistema de notificaciones (email, SMS, push, etc.)
  console.log(`Notificación enviada a vendedor ${vendedorId}:`, notification);
  
  // Actualizar flag de notificación enviada
  await prisma.asignacionLead.updateMany({
    where: {
      vendedorAsignadoId: vendedorId,
      notificacionEnviada: false
    },
    data: {
      notificacionEnviada: true,
      fechaNotificacion: new Date()
    }
  });
}

async function checkAndCreateDesbalanceAlert(agenciaId: number) {
  // Obtener cargas de todos los vendedores
  const vendedores = await prisma.user.findMany({
    where: {
      agenciaId: agenciaId,
      rol: 'VENDEDOR',
      activo: true
    },
    select: {
      id: true,
      nombre: true,
      apellido: true,
      cargaProspectos: true
    }
  });

  if (vendedores.length < 2) return;

  const cargas = vendedores.map(v => v.cargaProspectos);
  const cargaMaxima = Math.max(...cargas);
  const cargaMinima = Math.min(...cargas);
  const diferencia = cargaMaxima - cargaMinima;

  const umbralDesbalance = 3; // Configurable

  if (diferencia >= umbralDesbalance) {
    const vendedorSobrecargado = vendedores.find(v => v.cargaProspectos === cargaMaxima);
    
    // Buscar gerente para crear alerta
    const gerente = await prisma.user.findFirst({
      where: {
        agenciaId: agenciaId,
        rol: { in: ['GERENTE_VENTAS', 'GERENTE_GENERAL'] },
        activo: true
      }
    });

    if (gerente && vendedorSobrecargado) {
      await prisma.alertaDesbalance.create({
        data: {
          usuarioId: gerente.id,
          tipoDesbalance: 'CARGA_DESIGUAL',
          vendedorAfectadoId: vendedorSobrecargado.id,
          diferenciaDetectada: diferencia,
          umbralConfigurado: umbralDesbalance,
          sugerenciaAccion: diferencia >= 5 ? 'redistribuir' : 'agregar_vendedor_guardia',
          datosDesbalance: JSON.stringify({
            vendedores: vendedores.map(v => ({
              id: v.id,
              nombre: `${v.nombre} ${v.apellido || ''}`.trim(),
              carga: v.cargaProspectos
            })),
            diferencia,
            timestamp: new Date()
          })
        }
      });
    }
  }
}

// GET - Obtener estadísticas de asignaciones
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const periodo = searchParams.get('periodo') || 'hoy';

    let fechaInicio: Date;
    const fechaFin = new Date();

    switch (periodo) {
      case 'hoy':
        fechaInicio = new Date();
        fechaInicio.setHours(0, 0, 0, 0);
        break;
      case 'semana':
        fechaInicio = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'mes':
        fechaInicio = new Date();
        fechaInicio.setDate(1);
        fechaInicio.setHours(0, 0, 0, 0);
        break;
      default:
        fechaInicio = new Date();
        fechaInicio.setHours(0, 0, 0, 0);
    }

    const [
      totalAsignaciones,
      asignacionesPorMetodologia,
      asignacionesPorPrioridad,
      estadisticasVendedores,
      alertasDesbalance
    ] = await Promise.all([
      prisma.asignacionLead.count({
        where: {
          coordinador: { agenciaId: session.user.agenciaId },
          fechaAsignacion: {
            gte: fechaInicio,
            lte: fechaFin
          }
        }
      }),

      prisma.asignacionLead.groupBy({
        by: ['metodologiaAsignacion'],
        where: {
          coordinador: { agenciaId: session.user.agenciaId },
          fechaAsignacion: {
            gte: fechaInicio,
            lte: fechaFin
          }
        },
        _count: { metodologiaAsignacion: true }
      }),

      prisma.asignacionLead.groupBy({
        by: ['prioridadAsignacion'],
        where: {
          coordinador: { agenciaId: session.user.agenciaId },
          fechaAsignacion: {
            gte: fechaInicio,
            lte: fechaFin
          }
        },
        _count: { prioridadAsignacion: true }
      }),

      prisma.user.findMany({
        where: {
          agenciaId: session.user.agenciaId,
          rol: 'VENDEDOR',
          activo: true
        },
        select: {
          id: true,
          nombre: true,
          apellido: true,
          cargaProspectos: true,
          _count: {
            select: {
              asignacionesRecibidas: {
                where: {
                  fechaAsignacion: {
                    gte: fechaInicio,
                    lte: fechaFin
                  }
                }
              }
            }
          }
        },
        orderBy: { cargaProspectos: 'desc' }
      }),

      prisma.alertaDesbalance.count({
        where: {
          usuario: { agenciaId: session.user.agenciaId },
          estadoAlerta: 'ACTIVA',
          fechaDeteccion: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      })
    ]);

    return NextResponse.json({
      resumen: {
        totalAsignaciones,
        asignacionesHoy: periodo === 'hoy' ? totalAsignaciones : 0,
        alertasDesbalanceActivas: alertasDesbalance,
        vendedoresActivos: estadisticasVendedores.length
      },
      distribuciones: {
        porMetodologia: asignacionesPorMetodologia.map(item => ({
          metodologia: item.metodologiaAsignacion,
          cantidad: item._count.metodologiaAsignacion
        })),
        porPrioridad: asignacionesPorPrioridad.map(item => ({
          prioridad: item.prioridadAsignacion,
          cantidad: item._count.prioridadAsignacion
        }))
      },
      vendedores: estadisticasVendedores.map(v => ({
        id: v.id,
        nombre: `${v.nombre} ${v.apellido || ''}`.trim(),
        cargaActual: v.cargaProspectos,
        asignacionesPeriodo: v._count.asignacionesRecibidas,
        disponibilidad: v.cargaProspectos < 10 ? 'alta' : v.cargaProspectos < 20 ? 'media' : 'baja'
      })),
      periodo,
      fechaConsulta: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Error obteniendo estadísticas de asignación:', error);
    return NextResponse.json({
      error: 'Error interno del servidor',
      details: error.message
    }, { status: 500 });
  }
}
