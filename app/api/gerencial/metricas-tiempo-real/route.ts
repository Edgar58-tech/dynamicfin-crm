
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

    if (!['GERENTE_VENTAS', 'GERENTE_GENERAL', 'DIRECTOR_MARCA', 'DIRECTOR_GENERAL', 'DYNAMICFIN_ADMIN'].includes(session.user.rol)) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
    }

    const agenciaId = session.user.agenciaId;
    const now = new Date();
    const startOfHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), 0, 0, 0);
    
    // Obtener métricas de tiempo real (última hora)
    const [
      llamadasUltimaHora,
      visitasUltimaHora,
      asignacionesUltimaHora,
      grabacionesUltimaHora,
      contactosRealizados,
      vendedoresActivos
    ] = await Promise.all([
      prisma.registroLlamadaEntrante.count({
        where: {
          horaLlamada: { gte: startOfHour },
          ...(agenciaId && { coordinador: { agenciaId } })
        }
      }),
      
      prisma.visitaShowroom.count({
        where: {
          horaIngreso: { gte: startOfHour },
          ...(agenciaId && { coordinador: { agenciaId } })
        }
      }),
      
      prisma.asignacionLead.count({
        where: {
          fechaAsignacion: { gte: startOfHour },
          ...(agenciaId && { coordinador: { agenciaId } })
        }
      }),
      
      prisma.grabacionConversacion.count({
        where: {
          fechaGrabacion: { gte: startOfHour },
          ...(agenciaId && { vendedor: { agenciaId } })
        }
      }),
      
      prisma.asignacionLead.count({
        where: {
          vendedorContacto: true,
          fechaPrimerContacto: { gte: startOfHour },
          ...(agenciaId && { coordinador: { agenciaId } })
        }
      }),
      
      // Vendedores que han tenido actividad en la última hora
      prisma.user.count({
        where: {
          rol: 'VENDEDOR',
          activo: true,
          ...(agenciaId && { agenciaId }),
          OR: [
            {
              asignacionesRecibidas: {
                some: {
                  fechaPrimerContacto: { gte: startOfHour }
                }
              }
            },
            {
              grabaciones: {
                some: {
                  fechaGrabacion: { gte: startOfHour }
                }
              }
            }
          ]
        }
      })
    ]);

    // Obtener tendencias por horas del día actual
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tendenciasHoy = [];
    
    for (let hour = 0; hour <= now.getHours(); hour++) {
      const horaInicio = new Date(startOfDay.getTime() + hour * 60 * 60 * 1000);
      const horaFin = new Date(startOfDay.getTime() + (hour + 1) * 60 * 60 * 1000);
      
      const [llamadas, visitas, asignaciones] = await Promise.all([
        prisma.registroLlamadaEntrante.count({
          where: {
            horaLlamada: { gte: horaInicio, lt: horaFin },
            ...(agenciaId && { coordinador: { agenciaId } })
          }
        }),
        
        prisma.visitaShowroom.count({
          where: {
            horaIngreso: { gte: horaInicio, lt: horaFin },
            ...(agenciaId && { coordinador: { agenciaId } })
          }
        }),
        
        prisma.asignacionLead.count({
          where: {
            fechaAsignacion: { gte: horaInicio, lt: horaFin },
            ...(agenciaId && { coordinador: { agenciaId } })
          }
        })
      ]);
      
      tendenciasHoy.push({
        hora: `${hour.toString().padStart(2, '0')}:00`,
        llamadas,
        visitas,
        asignaciones,
        total: llamadas + visitas
      });
    }

    // Calcular velocidades (leads por minuto de la última hora)
    const minutosTranscurridos = Math.max((now.getTime() - startOfHour.getTime()) / (1000 * 60), 1);
    
    const metricas = {
      ultimaHora: {
        llamadas: llamadasUltimaHora,
        visitas: visitasUltimaHora,
        asignaciones: asignacionesUltimaHora,
        grabaciones: grabacionesUltimaHora,
        contactos: contactosRealizados,
        vendedoresActivos
      },
      velocidades: {
        llamadasPorMinuto: (llamadasUltimaHora / minutosTranscurridos).toFixed(2),
        visitasPorMinuto: (visitasUltimaHora / minutosTranscurridos).toFixed(2),
        asignacionesPorMinuto: (asignacionesUltimaHora / minutosTranscurridos).toFixed(2),
        contactosPorMinuto: (contactosRealizados / minutosTranscurridos).toFixed(2)
      },
      tendenciasHoy,
      estadoSistema: {
        horaActual: now.getHours(),
        minutosActuales: now.getMinutes(),
        actividadGeneral: (llamadasUltimaHora + visitasUltimaHora) > 0 ? 'ACTIVO' : 'BAJO',
        eficienciaAsignacion: asignacionesUltimaHora > 0 ? ((contactosRealizados / asignacionesUltimaHora) * 100).toFixed(1) : '0'
      },
      ultimaActualizacion: now.toISOString()
    };

    return NextResponse.json(metricas);

  } catch (error) {
    console.error('Error fetching real-time metrics:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
