
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
    const fecha = searchParams.get('fecha');
    const excluir = searchParams.get('excluir');

    if (!fecha) {
      return NextResponse.json({ error: 'Fecha requerida' }, { status: 400 });
    }

    // Obtener vendedores disponibles (activos, no de guardia ese día)
    const vendedoresDisponibles = await prisma.user.findMany({
      where: {
        rol: 'VENDEDOR',
        activo: true,
        agenciaId: session.user.agenciaId,
        id: excluir ? { not: excluir } : undefined,
        // No tienen guardia ese día
        vendedoresGuardia: {
          none: {
            fecha: new Date(fecha),
            activo: true
          }
        }
      },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        cargaProspectos: true,
        // Obtener especialidad de metas si existe
        metas: {
          where: {
            mes: new Date().getMonth() + 1,
            year: new Date().getFullYear()
          },
          select: {
            especialidad: true
          },
          take: 1
        }
      },
      orderBy: [
        { cargaProspectos: 'asc' }, // Priorizar vendedores con menos carga
        { nombre: 'asc' }
      ]
    });

    const vendedoresFormateados = vendedoresDisponibles.map(vendedor => ({
      id: vendedor.id,
      nombre: vendedor.nombre,
      apellido: vendedor.apellido,
      cargaProspectos: vendedor.cargaProspectos,
      especialidad: vendedor.metas[0]?.especialidad || null,
      disponible: vendedor.cargaProspectos < 10 // Considerar disponible si tiene menos de 10 leads
    }));

    return NextResponse.json({
      success: true,
      vendedoresDisponibles: vendedoresFormateados
    });

  } catch (error) {
    console.error('Error obteniendo vendedores disponibles:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
