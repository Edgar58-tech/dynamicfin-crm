
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !['GERENTE_VENTAS', 'GERENTE_GENERAL', 'DIRECTOR_GENERAL'].includes(session.user.rol)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar que el vendedor existe y pertenece a la agencia
    const vendedor = await prisma.user.findFirst({
      where: {
        id: params.id,
        rol: 'VENDEDOR',
        agenciaId: session.user.agenciaId
      }
    });

    if (!vendedor) {
      return NextResponse.json({ error: 'Vendedor no encontrado' }, { status: 404 });
    }

    // Cambiar estado
    const vendedorActualizado = await prisma.user.update({
      where: { id: params.id },
      data: {
        activo: !vendedor.activo
      }
    });

    // Si se desactiva, también desactivar sus guardias activas
    if (!vendedorActualizado.activo) {
      await prisma.vendedorGuardia.updateMany({
        where: {
          vendedorId: params.id,
          fecha: {
            gte: new Date()
          },
          activo: true
        },
        data: {
          activo: false,
          observaciones: 'Desactivado automáticamente - Vendedor inactivo'
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: `Vendedor ${vendedorActualizado.activo ? 'activado' : 'desactivado'} exitosamente`,
      vendedor: {
        id: vendedorActualizado.id,
        nombre: vendedorActualizado.nombre,
        activo: vendedorActualizado.activo
      }
    });

  } catch (error) {
    console.error('Error cambiando estado del vendedor:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
