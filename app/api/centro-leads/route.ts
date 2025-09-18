
// API principal para Centro de Leads - Captura y asignación de leads
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { TipoRol } from '@prisma/client';

export const dynamic = "force-dynamic";

// Obtener estadísticas del centro de leads
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar permisos - Solo roles de centro de leads y gerencial
    if (!['CENTRO_LEADS', 'COORDINADOR_LEADS', 'GERENTE_VENTAS', 'GERENTE_GENERAL'].includes(session.user.rol)) {
      return NextResponse.json({ error: 'Sin permisos para acceder al centro de leads' }, { status: 403 });
    }

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const manana = new Date(hoy);
    manana.setDate(manana.getDate() + 1);

    // Obtener estadísticas del día
    const [
      llamadasHoy,
      visitasHoy,
      prospectosHoy,
      vendedoresGuardiaHoy
    ] = await Promise.all([
      // Llamadas entrantes del día
      prisma.registroLlamadaEntrante.count({
        where: {
          horaLlamada: {
            gte: hoy,
            lt: manana
          },
          coordinador: {
            agenciaId: session.user.agenciaId || 0
          }
        }
      }),
      
      // Visitas al showroom del día
      prisma.visitaShowroom.count({
        where: {
          horaIngreso: {
            gte: hoy,
            lt: manana
          },
          coordinador: {
            agenciaId: session.user.agenciaId || 0
          }
        }
      }),

      // Prospectos generados hoy
      prisma.prospecto.count({
        where: {
          fechaContacto: {
            gte: hoy,
            lt: manana
          },
          origenLead: {
            in: ['LLAMADA_ENTRANTE', 'VISITA_SHOWROOM']
          },
          agenciaId: session.user.agenciaId || 0
        }
      }),

      // Vendedores de guardia activos hoy
      prisma.vendedorGuardia.count({
        where: {
          fecha: hoy,
          activo: true,
          vendedor: {
            agenciaId: session.user.agenciaId || 0
          }
        }
      })
    ]);

    // Verificar si hay guardia definida para hoy
    const guardiaDefinida = vendedoresGuardiaHoy > 0;

    // Obtener vendedores de guardia con su carga actual
    const vendedoresGuardia = guardiaDefinida ? await prisma.vendedorGuardia.findMany({
      where: {
        fecha: hoy,
        activo: true,
        vendedor: {
          agenciaId: session.user.agenciaId || 0
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
    }) : [];

    // Calcular desbalance de carga
    let alertaDesbalance = null;
    if (vendedoresGuardia.length > 1) {
      const cargas = vendedoresGuardia.map(v => v.cargaActual);
      const maxCarga = Math.max(...cargas);
      const minCarga = Math.min(...cargas);
      const diferencia = maxCarga - minCarga;

      if (diferencia > 3) {
        alertaDesbalance = {
          tipo: 'CARGA_DESIGUAL',
          diferencia,
          vendedorSobrecargado: vendedoresGuardia.find(v => v.cargaActual === maxCarga)?.vendedor,
          vendedorMenorCarga: vendedoresGuardia.find(v => v.cargaActual === minCarga)?.vendedor
        };
      }
    }

    // Obtener últimas actividades
    const ultimasLlamadas = await prisma.registroLlamadaEntrante.findMany({
      where: {
        coordinador: {
          agenciaId: session.user.agenciaId || 0
        }
      },
      include: {
        coordinador: {
          select: {
            nombre: true,
            apellido: true
          }
        }
      },
      orderBy: {
        horaLlamada: 'desc'
      },
      take: 5
    });

    const ultimasVisitas = await prisma.visitaShowroom.findMany({
      where: {
        coordinador: {
          agenciaId: session.user.agenciaId || 0
        }
      },
      include: {
        coordinador: {
          select: {
            nombre: true,
            apellido: true
          }
        }
      },
      orderBy: {
        horaIngreso: 'desc'
      },
      take: 5
    });

    return NextResponse.json({
      estadisticas: {
        llamadasHoy,
        visitasHoy,
        prospectosGenerados: prospectosHoy,
        vendedoresGuardia: vendedoresGuardiaHoy,
        promedioAsignacion: 2.5 // Placeholder - se calculará con datos reales
      },
      guardiaDefinida,
      vendedoresGuardia: vendedoresGuardia.map(vg => ({
        id: vg.vendedorId,
        nombre: vg.vendedor.nombre,
        apellido: vg.vendedor.apellido,
        cargaActual: vg.cargaActual,
        metaDelDia: vg.metaDelDia,
        porcentajeMeta: vg.metaDelDia > 0 ? Math.round((vg.cargaActual / vg.metaDelDia) * 100) : 0
      })),
      alertaDesbalance,
      ultimasActividades: {
        llamadas: ultimasLlamadas.map(ll => ({
          id: ll.id,
          telefono: ll.numeroTelefono,
          duracion: ll.duracionLlamada,
          resultado: ll.resultadoContacto,
          coordinador: `${ll.coordinador.nombre} ${ll.coordinador.apellido || ''}`.trim(),
          fecha: ll.horaLlamada
        })),
        visitas: ultimasVisitas.map(v => ({
          id: v.id,
          visitante: v.nombreVisitante,
          acompanantes: v.acompanantes,
          vehiculo: v.vehiculoInteres,
          nivel: v.nivelInteres,
          coordinador: `${v.coordinador.nombre} ${v.coordinador.apellido || ''}`.trim(),
          fecha: v.horaIngreso
        }))
      }
    });

  } catch (error) {
    console.error('Error al obtener estadísticas del centro de leads:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

// Crear prospecto desde centro de leads
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Solo coordinadores de centro de leads pueden crear prospectos
    if (!['CENTRO_LEADS', 'COORDINADOR_LEADS'].includes(session.user.rol)) {
      return NextResponse.json({ error: 'Sin permisos para crear prospectos desde centro de leads' }, { status: 403 });
    }

    const {
      nombre,
      apellido,
      telefono,
      email,
      vehiculoInteresId,
      vehiculoInteres,
      presupuesto,
      origenLead,
      nivelUrgencia,
      tiempoEsperado,
      acompanantes,
      observaciones,
      // Datos específicos según el origen
      duracionLlamada,
      tipoConsulta,
      tipoVisita,
      tiempoVisita
    } = await request.json();

    // Validaciones básicas
    if (!nombre || !telefono) {
      return NextResponse.json({ error: 'Nombre y teléfono son requeridos' }, { status: 400 });
    }

    if (!['LLAMADA_ENTRANTE', 'VISITA_SHOWROOM'].includes(origenLead)) {
      return NextResponse.json({ error: 'Origen de lead inválido' }, { status: 400 });
    }

    // Verificar si hay vendedores de guardia definidos
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

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
        error: 'NO_GUARDIA_DEFINIDA',
        message: 'No hay vendedores de guardia definidos para hoy. Solicite al Gerente de Ventas que defina la guardia.',
        prospectData: {
          nombre,
          apellido,
          telefono,
          email,
          vehiculoInteresId,
          vehiculoInteres,
          presupuesto,
          origenLead,
          nivelUrgencia,
          tiempoEsperado,
          acompanantes,
          observaciones
        }
      }, { status: 400 });
    }

    // Seleccionar vendedor con menor carga (balanceo automático)
    const vendedorSeleccionado = vendedoresGuardia[0]; // Ya están ordenados por carga ascendente

    try {
      // Iniciar transacción para crear prospecto y registros relacionados
      const resultado = await prisma.$transaction(async (tx) => {
        // 1. Crear el prospecto
        const nuevoProspecto = await tx.prospecto.create({
          data: {
            nombre,
            apellido: apellido || '',
            telefono,
            email: email || null,
            vendedorId: vendedorSeleccionado.vendedorId,
            coordinadorId: session.user.id,
            agenciaId: session.user.agenciaId || 0,
            estatus: 'PENDIENTE_CALIFICACION', // Leads del Centro de Leads van directamente a pendientes de calificación
            calificacionTotal: 0,
            vehiculoInteres: vehiculoInteres || null,
            vehiculoInteresId: vehiculoInteresId || null,
            presupuesto: presupuesto ? parseFloat(presupuesto.toString()) : null,
            origenLead,
            estadoAsignacion: 'ASIGNADO',
            nivelUrgencia: nivelUrgencia || 'MEDIA',
            tiempoEsperado,
            acompanantes,
            notas: observaciones,
            fechaAsignacion: new Date()
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

        // 2. Crear registro específico según el origen
        if (origenLead === 'LLAMADA_ENTRANTE') {
          await tx.registroLlamadaEntrante.create({
            data: {
              coordinadorId: session.user.id,
              numeroTelefono: telefono,
              duracionLlamada: duracionLlamada || null,
              tipoConsulta: tipoConsulta || 'informacion',
              calificacionLlamada: nivelUrgencia === 'ALTA' ? 'caliente' : nivelUrgencia === 'MEDIA' ? 'tibio' : 'frio',
              observaciones,
              resultadoContacto: 'lead_generado',
              siguienteAccion: 'asignar_vendedor',
              prospectoGeneradoId: nuevoProspecto.id
            }
          });
        } else if (origenLead === 'VISITA_SHOWROOM') {
          await tx.visitaShowroom.create({
            data: {
              coordinadorId: session.user.id,
              nombreVisitante: `${nombre} ${apellido || ''}`.trim(),
              acompanantes: acompanantes || 1,
              tipoVisita: tipoVisita || 'informacion',
              vehiculoInteres,
              vehiculoInteresId,
              tiempoVisita: tiempoVisita || null,
              nivelInteres: nivelUrgencia === 'ALTA' ? 'alto' : nivelUrgencia === 'MEDIA' ? 'medio' : 'bajo',
              presupuestoMencionado: presupuesto ? parseFloat(presupuesto.toString()) : null,
              observaciones,
              resultadoVisita: 'lead_generado',
              prospectoGeneradoId: nuevoProspecto.id,
              seguimientoRequerido: true,
              fechaSeguimiento: new Date(Date.now() + 24 * 60 * 60 * 1000) // Mañana
            }
          });
        }

        // 3. Crear registro de asignación
        await tx.asignacionLead.create({
          data: {
            prospectoId: nuevoProspecto.id,
            coordinadorId: session.user.id,
            vendedorAsignadoId: vendedorSeleccionado.vendedorId,
            metodologiaAsignacion: 'BALANCEADO',
            cargaVendedorMomento: vendedorSeleccionado.cargaActual,
            motivoAsignacion: 'guardia_disponible',
            prioridadAsignacion: nivelUrgencia || 'NORMAL'
          }
        });

        // 4. Actualizar carga del vendedor de guardia
        await tx.vendedorGuardia.update({
          where: { id: vendedorSeleccionado.id },
          data: {
            cargaActual: {
              increment: 1
            }
          }
        });

        // 5. Actualizar carga general del vendedor
        await tx.user.update({
          where: { id: vendedorSeleccionado.vendedorId },
          data: {
            cargaProspectos: {
              increment: 1
            }
          }
        });

        return nuevoProspecto;
      });

      // Log de actividad exitosa
      console.log(`Prospecto creado desde centro de leads: ${resultado.nombre} asignado a ${vendedorSeleccionado.vendedor.nombre}`);

      return NextResponse.json({
        message: 'Prospecto creado y asignado exitosamente',
        prospecto: resultado,
        vendedorAsignado: {
          id: vendedorSeleccionado.vendedorId,
          nombre: vendedorSeleccionado.vendedor.nombre,
          apellido: vendedorSeleccionado.vendedor.apellido,
          cargaNueva: vendedorSeleccionado.cargaActual + 1
        },
        asignacion: {
          metodo: 'BALANCEADO',
          razon: 'Vendedor de guardia con menor carga disponible'
        }
      }, { status: 201 });

    } catch (transactionError) {
      console.error('Error en transacción:', transactionError);
      return NextResponse.json({ 
        error: 'Error al crear prospecto',
        details: transactionError instanceof Error ? transactionError.message : 'Error en transacción'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error al crear prospecto desde centro de leads:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}
