

/**
 * API para estado y monitoreo del sistema de proximidad
 * Proporciona información en tiempo real del sistema y estadísticas
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

/**
 * GET - Obtener estado del sistema de proximidad
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
    const vendedorId = searchParams.get('vendedorId');
    const detalle = searchParams.get('detalle') === 'true';

    // Verificar permisos
    if (vendedorId && vendedorId !== session.user.id && 
        session.user.rol !== 'GERENTE_VENTAS' && 
        session.user.rol !== 'GERENTE_GENERAL') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const fechaHoy = new Date();
    fechaHoy.setHours(0, 0, 0, 0);
    const fechaAyer = new Date(fechaHoy);
    fechaAyer.setDate(fechaAyer.getDate() - 1);

    // Estado general del sistema para la agencia
    const estadoGeneral = await Promise.all([
      // Zonas activas
      prisma.zonaProximidad.count({
        where: {
          agenciaId: session.user.agenciaId,
          activo: true,
        },
      }),

      // Vendedores con sistema activo
      prisma.configuracionProximidad.count({
        where: {
          sistemaActivo: true,
          activo: true,
          vendedor: {
            agenciaId: session.user.agenciaId,
          },
        },
        distinct: ['vendedorId'],
      }),

      // Grabaciones activas ahora
      prisma.grabacionProximidad.count({
        where: {
          estadoGrabacion: { in: ['iniciada', 'en_curso'] },
          vendedor: {
            agenciaId: session.user.agenciaId,
          },
        },
      }),

      // Grabaciones completadas hoy
      prisma.grabacionProximidad.count({
        where: {
          estadoGrabacion: 'completada',
          horaEntrada: {
            gte: fechaHoy,
          },
          vendedor: {
            agenciaId: session.user.agenciaId,
          },
        },
      }),

      // Grabaciones de ayer para comparación
      prisma.grabacionProximidad.count({
        where: {
          estadoGrabacion: 'completada',
          horaEntrada: {
            gte: fechaAyer,
            lt: fechaHoy,
          },
          vendedor: {
            agenciaId: session.user.agenciaId,
          },
        },
      }),
    ]);

    const [
      zonasActivas,
      vendedoresActivos,
      grabacionesActivas,
      grabacionesHoy,
      grabacionesAyer,
    ] = estadoGeneral;

    let estadoVendedor = null;
    if (vendedorId || session.user.rol === 'VENDEDOR') {
      const targetVendedorId = vendedorId || session.user.id;
      
      // Estado específico del vendedor
      const [configuracion, grabacionActiva, grabacionesRecientes] = await Promise.all([
        // Configuración del vendedor
        prisma.configuracionProximidad.findFirst({
          where: {
            vendedorId: targetVendedorId,
            zonaProximidadId: null, // Configuración global
            activo: true,
          },
        }),

        // Grabación activa del vendedor
        prisma.grabacionProximidad.findFirst({
          where: {
            vendedorId: targetVendedorId,
            estadoGrabacion: { in: ['iniciada', 'en_curso'] },
          },
          include: {
            zonaProximidad: {
              select: {
                nombre: true,
                tipo: true,
              },
            },
          },
        }),

        // Grabaciones recientes del vendedor (últimas 24h)
        prisma.grabacionProximidad.findMany({
          where: {
            vendedorId: targetVendedorId,
            horaEntrada: {
              gte: fechaAyer,
            },
          },
          include: {
            zonaProximidad: {
              select: {
                nombre: true,
                tipo: true,
              },
            },
            grabacionConversacion: {
              select: {
                duracion: true,
                scoreConversacion: true,
              },
            },
          },
          orderBy: {
            horaEntrada: 'desc',
          },
          take: 10,
        }),
      ]);

      estadoVendedor = {
        sistemaActivo: configuracion?.sistemaActivo ?? false,
        modoFuncionamiento: configuracion?.modoFuncionamiento ?? 'automatico',
        grabacionActiva: grabacionActiva ? {
          id: grabacionActiva.id,
          zona: grabacionActiva.zonaProximidad?.nombre,
          tipoZona: grabacionActiva.zonaProximidad?.tipo,
          horaInicio: grabacionActiva.horaEntrada,
          tiempoTranscurrido: Math.round((Date.now() - grabacionActiva.horaEntrada.getTime()) / 60000), // minutos
        } : null,
        grabacionesRecientes: grabacionesRecientes.map(g => ({
          id: g.id,
          zona: g.zonaProximidad?.nombre,
          tipoZona: g.zonaProximidad?.tipo,
          horaEntrada: g.horaEntrada,
          horaSalida: g.horaSalida,
          tiempoEnZona: g.tiempoEnZona,
          estadoGrabacion: g.estadoGrabacion,
          duracionGrabacion: g.grabacionConversacion?.duracion,
          scoreConversacion: g.grabacionConversacion?.scoreConversacion,
        })),
      };
    }

    // Estadísticas adicionales si se solicitan
    let estadisticasDetalladas = null;
    if (detalle) {
      const [zonasConActividad, vendedoresPorZona, erroresRecientes] = await Promise.all([
        // Zonas con más actividad (últimos 7 días)
        prisma.grabacionProximidad.groupBy({
          by: ['zonaProximidadId'],
          where: {
            horaEntrada: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            },
            vendedor: {
              agenciaId: session.user.agenciaId,
            },
          },
          _count: {
            id: true,
          },
          _avg: {
            tiempoEnZona: true,
          },
          orderBy: {
            _count: {
              id: 'desc',
            },
          },
          take: 5,
        }),

        // Distribución de vendedores por zona
        prisma.configuracionProximidad.groupBy({
          by: ['zonaProximidadId'],
          where: {
            activo: true,
            sistemaActivo: true,
            vendedor: {
              agenciaId: session.user.agenciaId,
            },
          },
          _count: {
            vendedorId: true,
          },
        }),

        // Errores recientes en logs
        prisma.logProximidad.count({
          where: {
            tipoEvento: 'error_gps',
            timestamp: {
              gte: fechaHoy,
            },
            vendedor: {
              agenciaId: session.user.agenciaId,
            },
          },
        }),
      ]);

      // Enriquecer datos de zonas con actividad
      const zonasConNombres = await Promise.all(
        zonasConActividad.map(async (zona) => {
          const zonaInfo = await prisma.zonaProximidad.findUnique({
            where: { id: zona.zonaProximidadId || 0 },
            select: {
              nombre: true,
              tipo: true,
            },
          });
          return {
            ...zona,
            zona: zonaInfo?.nombre || 'Zona desconocida',
            tipo: zonaInfo?.tipo || 'unknown',
            tiempoPromedioMinutos: zona._avg.tiempoEnZona ? Math.round(zona._avg.tiempoEnZona / 60) : 0,
          };
        })
      );

      estadisticasDetalladas = {
        zonasConActividad: zonasConNombres,
        vendedoresPorZona,
        erroresHoy: erroresRecientes,
        tendencia: {
          grabacionesHoy: grabacionesHoy,
          grabacionesAyer: grabacionesAyer,
          cambio: grabacionesAyer > 0 ? Math.round(((grabacionesHoy - grabacionesAyer) / grabacionesAyer) * 100) : 0,
        },
      };
    }

    // Estado del sistema de monitoreo
    const estadoSistema = {
      agenciaId: session.user.agenciaId,
      zonasActivas,
      vendedoresActivos,
      grabacionesActivas,
      grabacionesHoy,
      rendimiento: {
        grabacionesCompletadas: grabacionesHoy,
        tasaExito: grabacionesHoy > 0 ? Math.round((grabacionesHoy / (grabacionesHoy + 0)) * 100) : 0, // Simplificado por ahora
        tiempoPromedioZona: null, // Se podría calcular si se necesita
      },
      ultimaActualizacion: new Date(),
    };

    return NextResponse.json({
      estadoSistema,
      estadoVendedor,
      estadisticasDetalladas,
      alertas: [] as any[], // Se podrían agregar alertas del sistema
    });

  } catch (error) {
    console.error('Error fetching proximity status:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * POST - Registrar evento de proximidad
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (session.user.rol !== 'VENDEDOR') {
      return NextResponse.json({ error: 'Solo vendedores pueden registrar eventos' }, { status: 403 });
    }

    const body = await request.json();
    const {
      tipoEvento,
      latitud,
      longitud,
      precision,
      zonaProximidadId,
      datosAdicionales,
      observaciones,
    } = body;

    // Validaciones
    if (!tipoEvento) {
      return NextResponse.json(
        { error: 'Tipo de evento requerido' },
        { status: 400 }
      );
    }

    const eventosValidos = [
      'deteccion_ubicacion',
      'entrada_zona',
      'salida_zona',
      'error_gps',
      'grabacion_iniciada',
      'grabacion_finalizada'
    ];

    if (!eventosValidos.includes(tipoEvento)) {
      return NextResponse.json(
        { error: 'Tipo de evento no válido' },
        { status: 400 }
      );
    }

    // Calcular distancia a zona si se proporciona
    let distanciaZona = null;
    if (zonaProximidadId && latitud && longitud) {
      const zona = await prisma.zonaProximidad.findUnique({
        where: { id: parseInt(zonaProximidadId) },
        select: { latitud: true, longitud: true },
      });

      if (zona?.latitud && zona?.longitud) {
        const R = 6371000; // Radio de la Tierra en metros
        const dLat = (zona.latitud.toNumber() - parseFloat(latitud)) * Math.PI / 180;
        const dLon = (zona.longitud.toNumber() - parseFloat(longitud)) * Math.PI / 180;
        const a = 
          Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(parseFloat(latitud) * Math.PI / 180) * Math.cos(zona.latitud.toNumber() * Math.PI / 180) * 
          Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        distanciaZona = R * c;
      }
    }

    // Crear log de proximidad
    const nuevoLog = await prisma.logProximidad.create({
      data: {
        vendedorId: session.user.id,
        zonaProximidadId: zonaProximidadId ? parseInt(zonaProximidadId) : null,
        tipoEvento,
        latitud: latitud ? parseFloat(latitud) : null,
        longitud: longitud ? parseFloat(longitud) : null,
        precision: precision ? parseFloat(precision) : null,
        distanciaZona,
        confianzaDeteccion: precision ? Math.max(0, Math.min(100, (100 - precision))) : null,
        proveedor: 'gps',
        timestamp: new Date(),
        observaciones,
        datosAdicionales: datosAdicionales ? JSON.stringify(datosAdicionales) : null,
      },
    });

    return NextResponse.json({
      success: true,
      logId: nuevoLog.id,
      message: `Evento ${tipoEvento} registrado exitosamente`,
    });

  } catch (error) {
    console.error('Error registering proximity event:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
