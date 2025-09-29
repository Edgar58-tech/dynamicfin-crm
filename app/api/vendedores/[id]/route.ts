
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const vendedorId = parseInt(params.id);
    
    const vendedor = await prisma.user.findFirst({
      where: {
        id: vendedorId,
        rol: 'VENDEDOR'
      },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        email: true,
        telefono: true,
        activo: true,
        fechaCreacion: true,
        fechaUltimoAcceso: true,
        configuracion: true
      }
    });

    if (!vendedor) {
      return NextResponse.json({ error: 'Vendedor no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ vendedor }, { status: 200 });
  } catch (error) {
    console.error('Error al obtener vendedor:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (!['DYNAMICFIN_ADMIN', 'GERENTE_VENTAS'].includes(session.user.rol)) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
    }

    const vendedorId = parseInt(params.id);
    const { nombre, apellido, email, telefono, configuracion } = await request.json();

    // Verificar que el vendedor existe
    const vendedorExistente = await prisma.user.findFirst({
      where: {
        id: vendedorId,
        rol: 'VENDEDOR'
      }
    });

    if (!vendedorExistente) {
      return NextResponse.json({ error: 'Vendedor no encontrado' }, { status: 404 });
    }

    // Verificar email único si cambió
    if (email && email !== vendedorExistente.email) {
      const emailEnUso = await prisma.user.findUnique({
        where: { email }
      });

      if (emailEnUso) {
        return NextResponse.json(
          { error: 'El email ya está en uso' },
          { status: 400 }
        );
      }
    }

    const vendedorActualizado = await prisma.user.update({
      where: { id: vendedorId },
      data: {
        ...(nombre && { nombre }),
        ...(apellido && { apellido }),
        ...(email && { email }),
        ...(telefono !== undefined && { telefono }),
        ...(configuracion && { configuracion })
      },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        email: true,
        telefono: true,
        activo: true,
        fechaCreacion: true,
        configuracion: true
      }
    });

    return NextResponse.json({
      vendedor: vendedorActualizado,
      message: 'Vendedor actualizado exitosamente'
    }, { status: 200 });

  } catch (error) {
    console.error('Error al actualizar vendedor:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (!['DYNAMICFIN_ADMIN'].includes(session.user.rol)) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
    }

    const vendedorId = parseInt(params.id);

    // Verificar que el vendedor existe
    const vendedor = await prisma.user.findFirst({
      where: {
        id: vendedorId,
        rol: 'VENDEDOR'
      }
    });

    if (!vendedor) {
      return NextResponse.json({ error: 'Vendedor no encontrado' }, { status: 404 });
    }

    // En lugar de eliminar, desactivar (soft delete)
    await prisma.user.update({
      where: { id: vendedorId },
      data: { activo: false }
    });

    return NextResponse.json({
      message: 'Vendedor desactivado exitosamente'
    }, { status: 200 });

  } catch (error) {
    console.error('Error al desactivar vendedor:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
