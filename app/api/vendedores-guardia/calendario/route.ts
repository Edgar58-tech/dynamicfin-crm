
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !['GERENTE_VENTAS', 'GERENTE_GENERAL'].includes(session.user.rol)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const inicio = searchParams.get('inicio');
    const fin = searchParams.get('fin');

    if (!inicio || !fin) {
      return NextResponse.json({ error: 'Fechas de inicio y fin requeridas' }, { status: 400 });
    }

    // Obtener guardias en el rango de fechas
    const guardias = await prisma.vendedorGuardia.findMany({
      where: {
        fecha: {
          gte: new Date(inicio),
          lte: new Date(fin)
        },
        vendedor: {
          agenciaId: session.user.agenciaId
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
        fecha: 'asc'
      }
    });

    return NextResponse.json({
      success: true,
      guardias: guardias.map(guardia => ({
        id: guardia.id,
        vendedorId: guardia.vendedorId,
        fecha: guardia.fecha.toISOString().split('T')[0],
        horaInicio: guardia.horaInicio,
        horaFin: guardia.horaFin,
        activo: guardia.activo,
        cargaActual: guardia.cargaActual,
        metaDelDia: guardia.metaDelDia,
        observaciones: guardia.observaciones,
        vendedor: guardia.vendedor
      }))
    });

  } catch (error) {
    console.error('Error en calendario de guardias:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
