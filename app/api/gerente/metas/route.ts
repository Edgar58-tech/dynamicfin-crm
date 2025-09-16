
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
    const { vendedorId, metaAutos, metaIngresos, mes, year } = body;

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

    // Crear o actualizar meta
    const meta = await prisma.metaVendedor.upsert({
      where: {
        vendedorId_mes_year: {
          vendedorId: vendedorId,
          mes: mes,
          year: year
        }
      },
      update: {
        metaAutos: metaAutos,
        metaIngresos: metaIngresos,
        activo: true
      },
      create: {
        vendedorId: vendedorId,
        mes: mes,
        year: year,
        metaAutos: metaAutos,
        metaIngresos: metaIngresos,
        activo: true
      }
    });

    return NextResponse.json({ 
      success: true, 
      metaId: meta.id,
      message: 'Meta guardada exitosamente' 
    });

  } catch (error) {
    console.error('Error en guardar meta:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
