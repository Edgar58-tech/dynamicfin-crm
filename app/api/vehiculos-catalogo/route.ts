
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { TipoRol } from '@prisma/client';

// GET - Obtener todos los vehículos del catálogo
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const marca = searchParams.get('marca') || '';
    const activo = searchParams.get('activo');

    const where = {
      AND: [
        activo !== null ? { activo: activo === 'true' } : {},
        search ? {
          OR: [
            { marca: { contains: search, mode: 'insensitive' as any } },
            { modelo: { contains: search, mode: 'insensitive' as any } },
          ]
        } : {},
        marca ? { marca: { equals: marca } } : {},
      ]
    };

    const vehiculos = await prisma.vehiculoCatalogo.findMany({
      where,
      orderBy: [
        { marca: 'asc' },
        { modelo: 'asc' },
        { year: 'desc' }
      ],
      include: {
        _count: {
          select: {
            prospectos: true
          }
        }
      }
    });

    // Formatear para el frontend
    const vehiculosFormatted = vehiculos.map(vehiculo => ({
      ...vehiculo,
      displayName: `${vehiculo.marca} ${vehiculo.modelo} ${vehiculo.year}`,
      prospectosCount: vehiculo._count.prospectos
    }));

    return NextResponse.json({
      vehiculos: vehiculosFormatted,
      total: vehiculos.length
    });

  } catch (error) {
    console.error('Error fetching vehicle catalog:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// POST - Crear nuevo vehículo en el catálogo
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    const allowedRoles: TipoRol[] = [TipoRol.GERENTE_GENERAL, TipoRol.GERENTE_VENTAS, TipoRol.DYNAMICFIN_ADMIN];
    if (!session?.user || !allowedRoles.includes(session.user.rol as TipoRol)) {
      return NextResponse.json({ error: 'Sin permisos suficientes' }, { status: 403 });
    }

    const body = await request.json();
    const { marca, modelo, year } = body;

    // Validaciones
    if (!marca || !modelo || !year) {
      return NextResponse.json({ error: 'Marca, modelo y año son requeridos' }, { status: 400 });
    }

    if (year < 2000 || year > new Date().getFullYear() + 2) {
      return NextResponse.json({ error: 'Año debe estar entre 2000 y ' + (new Date().getFullYear() + 2) }, { status: 400 });
    }

    // Verificar duplicados
    const existingVehicle = await prisma.vehiculoCatalogo.findFirst({
      where: {
        marca: marca.trim(),
        modelo: modelo.trim(),
        year: parseInt(year)
      }
    });

    if (existingVehicle) {
      return NextResponse.json({ error: 'Ya existe un vehículo con esta combinación marca/modelo/año' }, { status: 400 });
    }

    const nuevoVehiculo = await prisma.vehiculoCatalogo.create({
      data: {
        marca: marca.trim(),
        modelo: modelo.trim(),
        year: parseInt(year),
        activo: true
      }
    });

    return NextResponse.json({
      message: 'Vehículo agregado exitosamente al catálogo',
      vehiculo: {
        ...nuevoVehiculo,
        displayName: `${nuevoVehiculo.marca} ${nuevoVehiculo.modelo} ${nuevoVehiculo.year}`,
        prospectosCount: 0
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating vehicle:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
