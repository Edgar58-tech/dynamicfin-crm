
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

    // Obtener estadísticas del día
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const manana = new Date(hoy);
    manana.setDate(manana.getDate() + 1);

    const estadisticas = await Promise.all([
      // Llamadas hoy
      prisma.lead.count({
        where: {
          origenLead: 'LLAMADA_ENTRANTE',
          fechaCreacion: {
            gte: hoy,
            lt: manana
          }
        }
      }),
      
      // Visitas hoy
      prisma.lead.count({
        where: {
          origenLead: 'VISITA_SHOWROOM',
          fechaCreacion: {
            gte: hoy,
            lt: manana
          }
        }
      }),
      
      // Prospectos generados hoy
      prisma.prospecto.count({
        where: {
          fechaCreacion: {
            gte: hoy,
            lt: manana
          }
        }
      })
    ]);

    // Verificar si hay guardia definida
    const vendedoresGuardia = await prisma.vendedorGuardia.findMany({
      where: {
        fechaGuardia: hoy,
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

    const guardiaDefinida = vendedoresGuardia.length > 0;

    // Calcular estadísticas de carga si hay guardia
    let vendedoresGuardiaInfo = [];
    let alertaDesbalance = null;

    if (guardiaDefinida) {
      // Obtener carga actual de cada vendedor de guardia
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

        const metaDelDia = guardia.metaDelDia || 10; // Meta por defecto
        
        vendedoresGuardiaInfo.push({
          id: guardia.vendedor.id,
          nombre: guardia.vendedor.nombre,
          apellido: guardia.vendedor.apellido,
          cargaActual,
          metaDelDia,
          porcentajeMeta: Math.round((cargaActual / metaDelDia) * 100)
        });
      }

      // Detectar desbalance
      const cargas = vendedoresGuardiaInfo.map(v => v.cargaActual);
      const maxCarga = Math.max(...cargas);
      const minCarga = Math.min(...cargas);
      const diferencia = maxCarga - minCarga;

      if (diferencia >= 3) { // Umbral de desbalance
        const vendedorSobrecargado = vendedoresGuardiaInfo.find(v => v.cargaActual === maxCarga);
        const vendedorMenorCarga = vendedoresGuardiaInfo.find(v => v.cargaActual === minCarga);
        
        alertaDesbalance = {
          tipo: 'DESBALANCE',
          diferencia,
          vendedorSobrecargado: vendedorSobrecargado ? {
            nombre: `${vendedorSobrecargado.nombre} ${vendedorSobrecargado.apellido || ''}`.trim(),
            carga: vendedorSobrecargado.cargaActual
          } : undefined,
          vendedorMenorCarga: vendedorMenorCarga ? {
            nombre: `${vendedorMenorCarga.nombre} ${vendedorMenorCarga.apellido || ''}`.trim(),
            carga: vendedorMenorCarga.cargaActual
          } : undefined
        };
      }
    }

    // Obtener últimas actividades
    const [ultimasLlamadas, ultimasVisitas] = await Promise.all([
      prisma.lead.findMany({
        where: {
          origenLead: 'LLAMADA_ENTRANTE',
          fechaCreacion: {
            gte: hoy,
            lt: manana
          }
        },
        select: {
          id: true,
          telefono: true,
          duracionLlamada: true,
          resultadoLlamada: true,
          creadoPor: true,
          fechaCreacion: true,
          creador: {
            select: {
              nombre: true,
              apellido: true
            }
          }
        },
        orderBy: {
          fechaCreacion: 'desc'
        },
        take: 5
      }),
      
      prisma.lead.findMany({
        where: {
          origenLead: 'VISITA_SHOWROOM',
          fechaCreacion: {
            gte: hoy,
            lt: manana
          }
        },
        select: {
          id: true,
          nombre: true,
          acompanantes: true,
          vehiculoInteres: true,
          nivelInteres: true,
          creadoPor: true,
          fechaCreacion: true,
          creador: {
            select: {
              nombre: true,
              apellido: true
            }
          }
        },
        orderBy: {
          fechaCreacion: 'desc'
        },
        take: 5
      })
    ]);

    const responseData = {
      estadisticas: {
        llamadasHoy: estadisticas[0],
        visitasHoy: estadisticas[1],
        prospectosGenerados: estadisticas[2],
        vendedoresGuardia: vendedoresGuardia.length,
        promedioAsignacion: 2 // Calcular promedio real si es necesario
      },
      guardiaDefinida,
      vendedoresGuardia: vendedoresGuardiaInfo,
      alertaDesbalance,
      ultimasActividades: {
        llamadas: ultimasLlamadas.map(llamada => ({
          id: llamada.id,
          telefono: llamada.telefono,
          duracion: llamada.duracionLlamada,
          resultado: llamada.resultadoLlamada,
          coordinador: `${llamada.creador?.nombre || ''} ${llamada.creador?.apellido || ''}`.trim(),
          fecha: llamada.fechaCreacion.toISOString()
        })),
        visitas: ultimasVisitas.map(visita => ({
          id: visita.id,
          visitante: visita.nombre || 'Visitante',
          acompanantes: visita.acompanantes || 1,
          vehiculo: visita.vehiculoInteres,
          nivel: visita.nivelInteres,
          coordinador: `${visita.creador?.nombre || ''} ${visita.creador?.apellido || ''}`.trim(),
          fecha: visita.fechaCreacion.toISOString()
        }))
      }
    };

    return NextResponse.json(responseData, { status: 200 });

  } catch (error) {
    console.error('Error al obtener datos del centro de leads:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
