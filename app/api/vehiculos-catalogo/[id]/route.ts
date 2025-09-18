
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { TipoRol } from '@prisma/client';

// PUT - Actualizar vehículo del catálogo
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    
    const allowedRoles: TipoRol[] = [TipoRol.GERENTE_GENERAL, TipoRol.GERENTE_VENTAS, TipoRol.DYNAMICFIN_ADMIN];
    if (!session?.user || !allowedRoles.includes(session.user.rol as TipoRol)) {
      return NextResponse.json({ error: 'Sin permisos suficientes' }, { status: 403 });
    }

    const body = await request.json();
    const { marca, modelo, year, activo } = body;
    const vehicleId = parseInt(params.id);

    if (isNaN(vehicleId)) {
      return NextResponse.json({ error: 'ID de vehículo inválido' }, { status: 400 });
    }

    // Validaciones
    if (!marca || !modelo || !year) {
      return NextResponse.json({ error: 'Marca, modelo y año son requeridos' }, { status: 400 });
    }

    if (year < 2000 || year > new Date().getFullYear() + 2) {
      return NextResponse.json({ error: 'Año debe estar entre 2000 y ' + (new Date().getFullYear() + 2) }, { status: 400 });
    }

    // Verificar que el vehículo existe
    const existingVehicle = await prisma.vehiculoCatalogo.findUnique({
      where: { id: vehicleId }
    });

    if (!existingVehicle) {
      return NextResponse.json({ error: 'Vehículo no encontrado' }, { status: 404 });
    }

    // Verificar duplicados (excluyendo el actual)
    const duplicateVehicle = await prisma.vehiculoCatalogo.findFirst({
      where: {
        marca: marca.trim(),
        modelo: modelo.trim(),
        year: parseInt(year),
        id: { not: vehicleId }
      }
    });

    if (duplicateVehicle) {
      return NextResponse.json({ error: 'Ya existe otro vehículo con esta combinación marca/modelo/año' }, { status: 400 });
    }

    const vehiculoActualizado = await prisma.vehiculoCatalogo.update({
      where: { id: vehicleId },
      data: {
        marca: marca.trim(),
        modelo: modelo.trim(),
        year: parseInt(year),
        activo: activo !== undefined ? activo : existingVehicle.activo
      },
      include: {
        _count: {
          select: {
            prospectos: true
          }
        }
      }
    });

    return NextResponse.json({
      message: 'Vehículo actualizado exitosamente',
      vehiculo: {
        ...vehiculoActualizado,
        displayName: `${vehiculoActualizado.marca} ${vehiculoActualizado.modelo} ${vehiculoActualizado.year}`,
        prospectosCount: vehiculoActualizado._count.prospectos
      }
    });

  } catch (error) {
    console.error('Error updating vehicle:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// DELETE - Eliminar vehículo del catálogo
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    
    const allowedRoles: TipoRol[] = [TipoRol.GERENTE_GENERAL, TipoRol.DYNAMICFIN_ADMIN];
    if (!session?.user || !allowedRoles.includes(session.user.rol as TipoRol)) {
      return NextResponse.json({ error: 'Sin permisos suficientes' }, { status: 403 });
    }

    const vehicleId = parseInt(params.id);

    if (isNaN(vehicleId)) {
      return NextResponse.json({ error: 'ID de vehículo inválido' }, { status: 400 });
    }

    // Verificar que el vehículo existe
    const existingVehicle = await prisma.vehiculoCatalogo.findUnique({
      where: { id: vehicleId },
      include: {
        _count: {
          select: {
            prospectos: true
          }
        }
      }
    });

    if (!existingVehicle) {
      return NextResponse.json({ error: 'Vehículo no encontrado' }, { status: 404 });
    }

    // Verificar si tiene prospectos asociados
    if (existingVehicle._count.prospectos > 0) {
      // En lugar de eliminar, desactivar
      await prisma.vehiculoCatalogo.update({
        where: { id: vehicleId },
        data: { activo: false }
      });

      return NextResponse.json({
        message: `Vehículo desactivado (tenía ${existingVehicle._count.prospectos} prospectos asociados)`,
        action: 'deactivated'
      });
    } else {
      // Eliminar completamente si no tiene prospectos
      await prisma.vehiculoCatalogo.delete({
        where: { id: vehicleId }
      });

      return NextResponse.json({
        message: 'Vehículo eliminado exitosamente del catálogo',
        action: 'deleted'
      });
    }

  } catch (error) {
    console.error('Error deleting vehicle:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
