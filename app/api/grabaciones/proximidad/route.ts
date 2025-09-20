
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.rol !== 'VENDEDOR') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get('lat') || '0');
    const lng = parseFloat(searchParams.get('lng') || '0');

    if (!lat || !lng) {
      return NextResponse.json({ error: 'Coordenadas requeridas' }, { status: 400 });
    }

    // Buscar zonas de proximidad cercanas
    const zonasProximidad = await prisma.zonaProximidad.findMany({
      where: {
        agenciaId: session.user.agenciaId!,
        activo: true
      }
    });

    // Calcular distancias y encontrar zonas en rango
    const zonasEnRango = zonasProximidad.filter(zona => {
      const distancia = calcularDistancia(lat, lng, 
        parseFloat(zona.latitud.toString()), 
        parseFloat(zona.longitud.toString())
      );
      return distancia <= zona.radioMetros;
    });

    if (zonasEnRango.length === 0) {
      return NextResponse.json({
        success: true,
        enZonaProximidad: false,
        mensaje: 'No estás en una zona de grabación automática'
      });
    }

    // Verificar configuración del vendedor
    const configuracion = await prisma.configuracionProximidad.findFirst({
      where: {
        vendedorId: session.user.id,
        sistemaActivo: true
      }
    });

    if (!configuracion) {
      return NextResponse.json({
        success: true,
        enZonaProximidad: true,
        zonas: zonasEnRango,
        grabacionAutomatica: false,
        mensaje: 'Sistema de grabación por proximidad desactivado'
      });
    }

    return NextResponse.json({
      success: true,
      enZonaProximidad: true,
      zonas: zonasEnRango,
      grabacionAutomatica: configuracion.inicioAutomatico,
      configuracion: {
        confirmarAntes: configuracion.confirmarAntes,
        calidadAudio: configuracion.calidadAudio,
        notificacionesSonido: configuracion.notificacionesSonido
      }
    });

  } catch (error) {
    console.error('Error verificando proximidad:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.rol !== 'VENDEDOR') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      zonaProximidadId, 
      prospectoId, 
      ubicacionDetectada, 
      tipoActivacion = 'automatica' 
    } = body;

    // Crear registro de grabación por proximidad
    const grabacionProximidad = await prisma.grabacionProximidad.create({
      data: {
        vendedorId: session.user.id,
        zonaProximidadId,
        prospectoId: prospectoId || null,
        ubicacionDetectada: JSON.stringify(ubicacionDetectada),
        horaEntrada: new Date(),
        estadoGrabacion: 'iniciada',
        tipoActivacion,
        configuracionAplicada: JSON.stringify({
          timestamp: new Date().toISOString(),
          vendedor: session.user.id
        })
      }
    });

    return NextResponse.json({
      success: true,
      grabacionProximidadId: grabacionProximidad.id,
      mensaje: 'Grabación por proximidad iniciada'
    });

  } catch (error) {
    console.error('Error iniciando grabación por proximidad:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// Función auxiliar para calcular distancia entre dos puntos
function calcularDistancia(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371e3; // Radio de la Tierra en metros
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lng2-lng1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // Distancia en metros
}
