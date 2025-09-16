
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.rol !== 'GERENTE_VENTAS') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { vendedorId, tipoCoaching, objetivos, fechaSesion, duracionEstimada } = body;

    // Validar que el vendedor pertenece a la agencia
    const vendedor = await prisma.user.findFirst({
      where: {
        id: vendedorId,
        agenciaId: session.user.agenciaId,
        rol: 'VENDEDOR'
      }
    });

    if (!vendedor) {
      return NextResponse.json({ error: 'Vendedor no encontrado' }, { status: 404 });
    }

    // Crear sesión de coaching
    const sesionCoaching = await prisma.sesionCoaching.create({
      data: {
        vendedorId: vendedorId,
        gerenteId: session.user.id,
        tipoCoaching: tipoCoaching,
        problemasIdentificados: JSON.stringify([]),
        planMejora: JSON.stringify(objetivos || []),
        fechaSesion: new Date(fechaSesion),
        duracion: duracionEstimada || 60,
        completado: false
      }
    });

    return NextResponse.json({ 
      success: true, 
      sessionId: sesionCoaching.id,
      message: 'Sesión de coaching programada exitosamente' 
    });

  } catch (error) {
    console.error('Error en programar coaching:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
