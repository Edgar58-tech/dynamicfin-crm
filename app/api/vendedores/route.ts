
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Solo admins y gerentes pueden ver vendedores
    if (!['DYNAMICFIN_ADMIN', 'GERENTE_VENTAS', 'GERENTE_GENERAL'].includes(session.user.rol)) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
    }

    const vendedores = await prisma.user.findMany({
      where: {
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
      },
      orderBy: {
        fechaCreacion: 'desc'
      }
    });

    return NextResponse.json({ vendedores }, { status: 200 });
  } catch (error) {
    console.error('Error al obtener vendedores:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Solo admins pueden crear vendedores
    if (!['DYNAMICFIN_ADMIN'].includes(session.user.rol)) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
    }

    const { nombre, apellido, email, telefono, configuracionInicial } = await request.json();

    // Validaciones
    if (!nombre || !apellido || !email) {
      return NextResponse.json(
        { error: 'Nombre, apellido y email son requeridos' },
        { status: 400 }
      );
    }

    // Verificar email único
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'El email ya está registrado' },
        { status: 400 }
      );
    }

    // Generar contraseña temporal
    const tempPassword = `Temp${Date.now().toString().slice(-6)}!`;
    const hashedPassword = await bcrypt.hash(tempPassword, 12);

    const nuevoVendedor = await prisma.user.create({
      data: {
        nombre,
        apellido,
        email,
        telefono: telefono || null,
        password: hashedPassword,
        rol: 'VENDEDOR',
        activo: true,
        requiereCambioPassword: true,
        configuracion: {
          notificaciones: true,
          tema: 'light',
          ...configuracionInicial
        }
      },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        email: true,
        telefono: true,
        activo: true,
        fechaCreacion: true
      }
    });

    return NextResponse.json({
      vendedor: nuevoVendedor,
      tempPassword,
      message: 'Vendedor creado exitosamente'
    }, { status: 201 });

  } catch (error) {
    console.error('Error al crear vendedor:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
