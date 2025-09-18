
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { TipoRol } from '@prisma/client';

// GET - Obtener vehículos del catálogo para dropdown (solo activos)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar roles permitidos para usar el selector
    const allowedRoles: TipoRol[] = [
      TipoRol.VENDEDOR, 
      TipoRol.GERENTE_VENTAS, 
      TipoRol.GERENTE_GENERAL, 
      TipoRol.DYNAMICFIN_ADMIN
    ];
    
    if (!allowedRoles.includes(session.user.rol as TipoRol)) {
      return NextResponse.json({ error: 'Sin permisos para acceder al catálogo' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    const where = {
      AND: [
        { activo: true },
        search ? {
          OR: [
            { marca: { contains: search, mode: 'insensitive' as any } },
            { modelo: { contains: search, mode: 'insensitive' as any } },
          ]
        } : {}
      ]
    };

    const vehiculos = await prisma.vehiculoCatalogo.findMany({
      where,
      orderBy: [
        { marca: 'asc' },
        { modelo: 'asc' },
        { year: 'desc' }
      ],
      select: {
        id: true,
        marca: true,
        modelo: true,
        year: true
      }
    });

    // Formatear para el dropdown
    const options = vehiculos.map(vehiculo => ({
      value: vehiculo.id.toString(),
      label: `${vehiculo.marca} ${vehiculo.modelo} ${vehiculo.year}`,
      marca: vehiculo.marca,
      modelo: vehiculo.modelo,
      year: vehiculo.year
    }));

    // Agrupar por marca para mejor organización
    const groupedOptions = options.reduce((acc, option) => {
      if (!acc[option.marca]) {
        acc[option.marca] = [];
      }
      acc[option.marca].push(option);
      return acc;
    }, {} as { [key: string]: typeof options });

    return NextResponse.json({
      options,
      groupedOptions,
      total: options.length
    });

  } catch (error) {
    console.error('Error fetching dropdown options:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
