/**
 * API para gestionar Zonas de Proximidad
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient, ZonaProximidad } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

// Función para calcular distancia (movida aquí para reutilizarla)
function calcularDistancia(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000; // Radio de la Tierra en metros
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distancia en metros
}

/**
 * GET - Listar zonas de proximidad con filtros opcionales
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const latitud = searchParams.get('latitud');
    const longitud = searchParams.get('longitud');
    const radioKm = searchParams.get('radioKm');
    const activas = searchParams.get('activas') === 'true';
    const tipo = searchParams.get('tipo');
    const busqueda = searchParams.get('busqueda');

    const where: any = {
      agenciaId: session.user.agenciaId,
    };

    if (activas) {
      where.activo = true;
    }
    if (tipo) {
      where.tipo = tipo;
    }
    if (busqueda) {
      where.nombre = {
        contains: busqueda,
        mode: 'insensitive',
      };
    }

    const zonas = await prisma.zonaProximidad.findMany({
      where,
      orderBy: {
        nombre: 'asc',
      },
    });

    // LÓGICA CORREGIDA Y UNIFICADA
    const zonasConDistancia: (ZonaProximidad & { distanciaMetros: number | null })[] = zonas.map(zona => ({
      ...zona,
      // Se calcula la distancia solo si se proporcionan coordenadas
      distanciaMetros: (latitud && longitud && zona.latitud && zona.longitud) ? calcularDistancia(
        parseFloat(latitud),
        parseFloat(longitud),
        zona.latitud.toNumber(),
        zona.longitud.toNumber()
      ) : null,
    }));

    // Filtrar por radio si se especifica
    let zonasFiltradas = zonasConDistancia;
    if (radioKm && latitud && longitud) {
        const maxRadioMetros = parseFloat(radioKm) * 1000;
        zonasFiltradas = zonasConDistancia.filter(zona => 
            zona.distanciaMetros !== null && zona.distanciaMetros <= maxRadioMetros
        );
    }
    
    // Ordenar por distancia si hay coordenadas
    if (latitud && longitud) {
        zonasFiltradas.sort((a, b) => {
            if (a.distanciaMetros === null) return 1;
            if (b.distanciaMetros === null) return -1;
            return a.distanciaMetros - b.distanciaMetros;
        });
    }

    return NextResponse.json(zonasFiltradas);

  } catch (error) {
    console.error('Error fetching proximity zones:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}