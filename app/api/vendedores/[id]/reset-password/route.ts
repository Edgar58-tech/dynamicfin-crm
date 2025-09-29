
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

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (!['DYNAMICFIN_ADMIN', 'GERENTE_VENTAS'].includes(session.user.rol)) {
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

    // Generar nueva contraseña temporal
    const tempPassword = `Temp${Date.now().toString().slice(-6)}!`;
    const hashedPassword = await bcrypt.hash(tempPassword, 12);

    await prisma.user.update({
      where: { id: vendedorId },
      data: {
        password: hashedPassword,
        requiereCambioPassword: true
      }
    });

    return NextResponse.json({
      tempPassword,
      message: 'Contraseña restablecida exitosamente'
    }, { status: 200 });

  } catch (error) {
    console.error('Error al restablecer contraseña:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
