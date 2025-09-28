
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import type { TipoRol } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, nombre, apellido, rol, agenciaId, marcaId, grupoId } = body;

    if (!email || !password || !nombre || !rol) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'El usuario ya existe' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: `${nombre} ${apellido || ''}`.trim(),
        nombre,
        apellido,
        rol: rol as TipoRol,
        agenciaId: agenciaId || null,
        marcaId: marcaId || null,
        grupoId: grupoId || null,
        activo: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        nombre: true,
        apellido: true,
        rol: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      message: 'Usuario creado exitosamente',
      user,
    }, { status: 201 });

  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
