

/**
 * API para grabación automática por proximidad
 * Maneja el inicio, fin y gestión de grabaciones activadas por ubicación
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { checkPaymentStatus, updateServiceUsage } from '@/lib/payment-guard';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

/**
 * Función helper para calcular distancia entre dos puntos (Haversine formula)
 */
function calcularDistancia(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Radio de la Tierra en metros
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Función para determinar si está dentro del horario activo
 */
function estaEnHorarioActivo(horariosActivos: any, diasActivos: string): boolean {
  if (!horariosActivos) return true; // Si no hay horarios específicos, siempre activo

  const ahora = new Date();
  const diaActual = ahora.getDay(); // 0 = domingo, 1 = lunes, etc.
  const horaActual = ahora.getHours();
  const minutoActual = ahora.getMinutes();
  const minutosDelDia = horaActual * 60 + minutoActual;

  // Verificar si hoy es un día activo
  const diasActivosArray = diasActivos.split(',').map(d => parseInt(d));
  if (!diasActivosArray.includes(diaActual === 0 ? 7 : diaActual)) {
    return false;
  }

  // Verificar horarios
  if (Array.isArray(horariosActivos)) {
    return horariosActivos.some((horario: any) => {
      const inicio = horario.inicio ? parseInt(horario.inicio.replace(':', '')) : 0;
      const fin = horario.fin ? parseInt(horario.fin.replace(':', '')) : 2359;
      const inicioMinutos = Math.floor(inicio / 100) * 60 + (inicio % 100);
      const finMinutos = Math.floor(fin / 100) * 60 + (fin % 100);

      return minutosDelDia >= inicioMinutos && minutosDelDia <= finMinutos;
    });
  }

  return true; // Si no se pueden parsear los horarios, asumir activo
}

/**
 * POST - Iniciar grabación automática por proximidad
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (session.user.rol !== 'VENDEDOR') {
      return NextResponse.json({ error: 'Solo vendedores pueden iniciar grabaciones por proximidad' }, { status: 403 });
    }

    if (!session.user.agenciaId) {
      return NextResponse.json(
        { error: 'Usuario no asociado a agencia' },
        { status: 400 }
      );
    }

    // Verificar estado de pago
    const paymentStatus = await checkPaymentStatus(session.user.agenciaId, 'grabacion');
    if (!paymentStatus.canUseService) {
      return NextResponse.json(
        { 
          error: paymentStatus.reason,
          paymentStatus,
          code: 'PAYMENT_REQUIRED',
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      latitud,
      longitud,
      precision = 10,
      prospectoId,
      tipoActivacion = 'automatica',
      contextoDetectado = 'otro',
      dispositivoDeteccion = 'web',
      versionApp,
    } = body;

    // Validaciones
    if (!latitud || !longitud) {
      return NextResponse.json(
        { error: 'Coordenadas requeridas' },
        { status: 400 }
      );
    }

    // Buscar zonas de proximidad activas de la agencia
    const zonas = await prisma.zonaProximidad.findMany({
      where: {
        agenciaId: session.user.agenciaId,
        activo: true,
        activarGrabacion: true,
      },
    });

    let zonaDetectada: any = null;
    let distanciaMinima = Infinity;

    // Encontrar la zona más cercana dentro del radio
    for (const zona of zonas) {
      const distancia = calcularDistancia(
        parseFloat(latitud),
        parseFloat(longitud),
        zona.latitud?.toNumber() || 0,
        zona.longitud?.toNumber() || 0
      );

      if (distancia <= zona.radioMetros && distancia < distanciaMinima) {
        // Verificar horarios activos
        const horariosActivos = zona.horariosActivos ? JSON.parse(zona.horariosActivos) : null;
        if (estaEnHorarioActivo(horariosActivos, zona.diasActivos)) {
          zonaDetectada = zona;
          distanciaMinima = distancia;
        }
      }
    }

    if (!zonaDetectada) {
      return NextResponse.json({
        success: false,
        message: 'No hay zonas de proximidad activas en tu ubicación actual',
        zonas_cercanas: zonas.map(zona => ({
          nombre: zona.nombre,
          distancia: Math.round(calcularDistancia(
            parseFloat(latitud),
            parseFloat(longitud),
            zona.latitud?.toNumber() || 0,
            zona.longitud?.toNumber() || 0
          )),
          radio: zona.radioMetros,
        })).filter(z => z.distancia <= 200), // Solo mostrar zonas dentro de 200m
      }, { status: 200 });
    }

    // Obtener configuración del vendedor para esta zona
    const configuracion = await prisma.configuracionProximidad.findFirst({
      where: {
        vendedorId: session.user.id,
        OR: [
          { zonaProximidadId: zonaDetectada.id },
          { zonaProximidadId: null }, // Configuración global
        ],
        activo: true,
      },
      orderBy: {
        zonaProximidadId: { sort: 'asc', nulls: 'last' }, // Preferir configuración específica de zona
      },
    });

    // Si el sistema está desactivado para este vendedor
    if (!configuracion?.sistemaActivo) {
      return NextResponse.json({
        success: false,
        message: 'Sistema de grabación por proximidad desactivado',
        zona: {
          nombre: zonaDetectada.nombre,
          tipo: zonaDetectada.tipo,
        },
      }, { status: 200 });
    }

    // Verificar si ya hay una grabación activa para este vendedor
    const grabacionActiva = await prisma.grabacionProximidad.findFirst({
      where: {
        vendedorId: session.user.id,
        estadoGrabacion: { in: ['iniciada', 'en_curso'] },
      },
    });

    if (grabacionActiva) {
      return NextResponse.json({
        success: false,
        message: 'Ya tienes una grabación por proximidad activa',
        grabacionActiva: {
          id: grabacionActiva.id,
          zona: grabacionActiva.zonaProximidadId,
          horaInicio: grabacionActiva.horaEntrada,
        },
      }, { status: 400 });
    }

    // Crear registro de grabación por proximidad
    const ubicacionDetectada = {
      latitud: parseFloat(latitud),
      longitud: parseFloat(longitud),
      precision,
      timestamp: new Date(),
    };

    const configuracionAplicada = {
      calidadAudio: configuracion?.calidadAudio || zonaDetectada.calidadGrabacion,
      duracionMaxima: zonaDetectada.duracionMaxima,
      compresionAudio: configuracion?.compresionAudio || 'media',
      cancelarRuido: configuracion?.cancelarRuido ?? true,
      notificacionesSonido: configuracion?.notificacionesSonido ?? true,
      notificacionesVibrar: configuracion?.notificacionesVibrar ?? true,
      confirmarAntes: configuracion?.confirmarAntes ?? false,
    };

    const nuevaGrabacion = await prisma.grabacionProximidad.create({
      data: {
        vendedorId: session.user.id,
        zonaProximidadId: zonaDetectada.id,
        configuracionProximidadId: configuracion?.id,
        prospectoId: prospectoId ? parseInt(prospectoId) : null,
        ubicacionDetectada: JSON.stringify(ubicacionDetectada),
        horaEntrada: new Date(),
        estadoGrabacion: 'iniciada',
        tipoActivacion,
        configuracionAplicada: JSON.stringify(configuracionAplicada),
        distanciaPromedio: distanciaMinima,
        precisionGPS: precision,
        contextoDetectado,
        dispositivoDeteccion,
        versionApp,
      },
      include: {
        zonaProximidad: {
          select: {
            nombre: true,
            tipo: true,
            descripcion: true,
          },
        },
      },
    });

    // Crear log de entrada a zona
    await prisma.logProximidad.create({
      data: {
        vendedorId: session.user.id,
        zonaProximidadId: zonaDetectada.id,
        tipoEvento: 'entrada_zona',
        latitud: parseFloat(latitud),
        longitud: parseFloat(longitud),
        precision,
        distanciaZona: distanciaMinima,
        confianzaDeteccion: Math.max(0, Math.min(100, (100 - precision))), // Más confianza = menos error
        proveedor: 'gps',
        timestamp: new Date(),
      },
    });

    // Si requiere confirmación, no crear la grabación aún
    if (configuracionAplicada.confirmarAntes && tipoActivacion === 'automatica') {
      return NextResponse.json({
        success: true,
        requiereConfirmacion: true,
        grabacionProximidad: {
          id: nuevaGrabacion.id,
          zona: nuevaGrabacion.zonaProximidad,
          distancia: Math.round(distanciaMinima),
          configuracion: configuracionAplicada,
        },
        message: 'Zona detectada. ¿Deseas iniciar la grabación?',
      });
    }

    // Si no requiere confirmación, continuar con la grabación
    // Aquí se integraría con el sistema de grabación existente
    // Por ahora, solo actualizamos el estado
    await prisma.grabacionProximidad.update({
      where: { id: nuevaGrabacion.id },
      data: {
        estadoGrabacion: 'en_curso',
      },
    });

    return NextResponse.json({
      success: true,
      grabacionProximidad: {
        id: nuevaGrabacion.id,
        zona: nuevaGrabacion.zonaProximidad,
        distancia: Math.round(distanciaMinima),
        configuracion: configuracionAplicada,
        horaInicio: nuevaGrabacion.horaEntrada,
      },
      message: `Grabación iniciada automáticamente en ${nuevaGrabacion.zonaProximidad?.nombre}`,
      paymentStatus,
    });

  } catch (error) {
    console.error('Error starting proximity recording:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * PUT - Finalizar grabación por proximidad
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (session.user.rol !== 'VENDEDOR') {
      return NextResponse.json({ error: 'Solo vendedores pueden finalizar grabaciones' }, { status: 403 });
    }

    const body = await request.json();
    const {
      grabacionProximidadId,
      latitud,
      longitud,
      precision = 10,
      grabacionConversacionId, // ID de la grabación principal creada
      motivoFinalizacion = 'salida_zona',
      calidadDetectada,
    } = body;

    if (!grabacionProximidadId) {
      return NextResponse.json(
        { error: 'ID de grabación de proximidad requerido' },
        { status: 400 }
      );
    }

    // Buscar grabación activa
    const grabacion = await prisma.grabacionProximidad.findFirst({
      where: {
        id: parseInt(grabacionProximidadId),
        vendedorId: session.user.id,
        estadoGrabacion: { in: ['iniciada', 'en_curso'] },
      },
      include: {
        zonaProximidad: true,
      },
    });

    if (!grabacion) {
      return NextResponse.json(
        { error: 'Grabación no encontrada o no está activa' },
        { status: 404 }
      );
    }

    const ahora = new Date();
    const tiempoEnZona = Math.round((ahora.getTime() - grabacion.horaEntrada.getTime()) / 1000);

    // Calcular distancia final si se proporcionan coordenadas
    let distanciaFinal = null;
    if (latitud && longitud) {
      distanciaFinal = calcularDistancia(
        parseFloat(latitud),
        parseFloat(longitud),
        grabacion.zonaProximidad.latitud?.toNumber() || 0,
        grabacion.zonaProximidad.longitud?.toNumber() || 0
      );
    }

    // Actualizar grabación por proximidad
    const grabacionFinalizada = await prisma.grabacionProximidad.update({
      where: { id: parseInt(grabacionProximidadId) },
      data: {
        horaSalida: ahora,
        tiempoEnZona,
        estadoGrabacion: 'completada',
        grabacionConversacionId: grabacionConversacionId ? parseInt(grabacionConversacionId) : null,
        calidadDetectada,
        motivoCancelacion: motivoFinalizacion === 'cancelada' ? 'Usuario canceló la grabación' : null,
        updatedAt: ahora,
      },
    });

    // Si se proporcionó una grabación de conversación, vincularla
    if (grabacionConversacionId) {
      await prisma.grabacionConversacion.update({
        where: { id: parseInt(grabacionConversacionId) },
        data: {
          esGrabacionProximidad: true,
          zonaProximidadId: grabacion.zonaProximidadId,
          ubicacionGrabacion: JSON.stringify({
            entrada: JSON.parse(grabacion.ubicacionDetectada),
            salida: latitud && longitud ? {
              latitud: parseFloat(latitud),
              longitud: parseFloat(longitud),
              precision,
            } : null,
          }),
          tipoActivacionProximidad: grabacion.tipoActivacion,
          distanciaZonaMetros: distanciaFinal || grabacion.distanciaPromedio,
          precisionGPSGrabacion: precision,
          contextoProximidad: grabacion.contextoDetectado,
        },
      });
    }

    // Crear log de salida de zona
    if (latitud && longitud) {
      await prisma.logProximidad.create({
        data: {
          vendedorId: session.user.id,
          zonaProximidadId: grabacion.zonaProximidadId,
          tipoEvento: 'salida_zona',
          latitud: parseFloat(latitud),
          longitud: parseFloat(longitud),
          precision,
          distanciaZona: distanciaFinal,
          tiempoEnZona,
          confianzaDeteccion: Math.max(0, Math.min(100, (100 - precision))),
          proveedor: 'gps',
          timestamp: ahora,
        },
      });
    }

    // Crear log de finalización de grabación
    await prisma.logProximidad.create({
      data: {
        vendedorId: session.user.id,
        zonaProximidadId: grabacion.zonaProximidadId,
        tipoEvento: 'grabacion_finalizada',
        tiempoEnZona,
        enGrabacion: false,
        timestamp: ahora,
        observaciones: `Grabación finalizada: ${motivoFinalizacion}`,
      },
    });

    // Actualizar costos si hay una grabación asociada
    if (grabacionConversacionId && session.user.agenciaId) {
      await updateServiceUsage(session.user.agenciaId, {
        grabacionesIncrement: 1,
        costoGrabacion: 0.5, // Costo menor para grabaciones automáticas
        costoTranscripcion: 0,
        costoAnalisis: 0,
      });
    }

    return NextResponse.json({
      success: true,
      grabacionProximidad: {
        id: grabacionFinalizada.id,
        tiempoEnZona,
        horaEntrada: grabacionFinalizada.horaEntrada,
        horaSalida: grabacionFinalizada.horaSalida,
        estadoFinal: grabacionFinalizada.estadoGrabacion,
        grabacionConversacionId: grabacionFinalizada.grabacionConversacionId,
      },
      message: `Grabación por proximidad finalizada. Tiempo en zona: ${Math.round(tiempoEnZona / 60)} minutos`,
    });

  } catch (error) {
    console.error('Error finishing proximity recording:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * GET - Obtener estado de grabaciones por proximidad activas
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const vendedorId = searchParams.get('vendedorId') || session.user.id;
    const estado = searchParams.get('estado');

    // Verificar permisos
    if (vendedorId !== session.user.id && 
        session.user.rol !== 'GERENTE_VENTAS' && 
        session.user.rol !== 'GERENTE_GENERAL') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    let whereClause: any = {
      vendedorId,
    };

    if (estado) {
      whereClause.estadoGrabacion = estado;
    }

    const grabaciones = await prisma.grabacionProximidad.findMany({
      where: whereClause,
      include: {
        zonaProximidad: {
          select: {
            nombre: true,
            tipo: true,
            descripcion: true,
            latitud: true,
            longitud: true,
            radioMetros: true,
          },
        },
        prospecto: {
          select: {
            nombre: true,
            apellido: true,
            telefono: true,
          },
        },
        grabacionConversacion: {
          select: {
            id: true,
            duracion: true,
            transcripcion: true,
            scoreConversacion: true,
          },
        },
      },
      orderBy: {
        horaEntrada: 'desc',
      },
      take: 50,
    });

    return NextResponse.json({
      grabaciones: grabaciones.map(grabacion => ({
        ...grabacion,
        ubicacionDetectada: JSON.parse(grabacion.ubicacionDetectada),
        configuracionAplicada: JSON.parse(grabacion.configuracionAplicada),
        distanciaPromedio: grabacion.distanciaPromedio?.toNumber(),
        precisionGPS: grabacion.precisionGPS?.toNumber(),
        velocidadDetectada: grabacion.velocidadDetectada?.toNumber(),
        zonaProximidad: grabacion.zonaProximidad ? {
          ...grabacion.zonaProximidad,
          latitud: grabacion.zonaProximidad.latitud?.toNumber(),
          longitud: grabacion.zonaProximidad.longitud?.toNumber(),
        } : null,
      })),
      total: grabaciones.length,
    });

  } catch (error) {
    console.error('Error fetching proximity recordings:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
