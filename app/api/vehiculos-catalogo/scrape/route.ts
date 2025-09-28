
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { TipoRol } from '@/lib/types';

// POST - Scraping básico de marcas (simulado)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    const allowedRoles: TipoRol[] = [TipoRol.GERENTE_GENERAL, TipoRol.DYNAMICFIN_ADMIN];
    if (!session?.user || !allowedRoles.includes(session.user.rol as TipoRol)) {
      return NextResponse.json({ error: 'Sin permisos suficientes' }, { status: 403 });
    }

    const body = await request.json();
    const { marca } = body;

    if (!marca) {
      return NextResponse.json({ error: 'Marca es requerida' }, { status: 400 });
    }

    // Simulación de scraping para diferentes marcas
    const vehiculosScrapingData: { [key: string]: Array<{marca: string, modelo: string, year: number}> } = {
      'Audi': [
        { marca: 'Audi', modelo: 'A1 Sportback', year: 2024 },
        { marca: 'Audi', modelo: 'A3 Sportback', year: 2024 },
        { marca: 'Audi', modelo: 'A4 Sedan', year: 2024 },
        { marca: 'Audi', modelo: 'A6 Sedan', year: 2024 },
        { marca: 'Audi', modelo: 'Q2', year: 2024 },
        { marca: 'Audi', modelo: 'Q3 Sportback', year: 2024 },
        { marca: 'Audi', modelo: 'Q5 Sportback', year: 2024 },
        { marca: 'Audi', modelo: 'Q7', year: 2024 },
        { marca: 'Audi', modelo: 'e-tron GT', year: 2024 },
        { marca: 'Audi', modelo: 'Q4 e-tron', year: 2024 }
      ],
      'BMW': [
        { marca: 'BMW', modelo: 'Serie 1', year: 2024 },
        { marca: 'BMW', modelo: 'Serie 2 Gran Coupé', year: 2024 },
        { marca: 'BMW', modelo: 'Serie 3 Sedan', year: 2024 },
        { marca: 'BMW', modelo: 'Serie 5 Sedan', year: 2024 },
        { marca: 'BMW', modelo: 'X1', year: 2024 },
        { marca: 'BMW', modelo: 'X3', year: 2024 },
        { marca: 'BMW', modelo: 'X5', year: 2024 },
        { marca: 'BMW', modelo: 'iX', year: 2024 },
        { marca: 'BMW', modelo: 'i4', year: 2024 }
      ],
      'Mercedes-Benz': [
        { marca: 'Mercedes-Benz', modelo: 'Clase A', year: 2024 },
        { marca: 'Mercedes-Benz', modelo: 'Clase C Sedan', year: 2024 },
        { marca: 'Mercedes-Benz', modelo: 'Clase E Sedan', year: 2024 },
        { marca: 'Mercedes-Benz', modelo: 'Clase S', year: 2024 },
        { marca: 'Mercedes-Benz', modelo: 'GLA', year: 2024 },
        { marca: 'Mercedes-Benz', modelo: 'GLC', year: 2024 },
        { marca: 'Mercedes-Benz', modelo: 'GLE', year: 2024 },
        { marca: 'Mercedes-Benz', modelo: 'EQA', year: 2024 },
        { marca: 'Mercedes-Benz', modelo: 'EQC', year: 2024 }
      ]
    };

    const vehiculosData = vehiculosScrapingData[marca] || [];
    
    if (vehiculosData.length === 0) {
      return NextResponse.json({ 
        error: `Scraping no disponible para la marca: ${marca}. Marcas soportadas: Audi, BMW, Mercedes-Benz` 
      }, { status: 400 });
    }

    // Simular latencia de scraping
    await new Promise(resolve => setTimeout(resolve, 2000));

    const vehiculosCreados: any[] = [];
    const vehiculosExistentes: string[] = [];

    for (const vehiculo of vehiculosData) {
      const existing = await prisma.vehiculoCatalogo.findFirst({
        where: {
          marca: vehiculo.marca,
          modelo: vehiculo.modelo,
          year: vehiculo.year
        }
      });

      if (existing) {
        vehiculosExistentes.push(`${vehiculo.marca} ${vehiculo.modelo} ${vehiculo.year}`);
      } else {
        const nuevoVehiculo = await prisma.vehiculoCatalogo.create({
          data: {
            marca: vehiculo.marca,
            modelo: vehiculo.modelo,
            year: vehiculo.year,
            activo: true
          }
        });
        vehiculosCreados.push(nuevoVehiculo);
      }
    }

    return NextResponse.json({
      message: `Scraping completado para ${marca}`,
      resumen: {
        marca,
        totalEncontrados: vehiculosData.length,
        vehiculosCreados: vehiculosCreados.length,
        vehiculosExistentes: vehiculosExistentes.length
      },
      vehiculosCreados,
      vehiculosExistentes
    });

  } catch (error) {
    console.error('Error in vehicle scraping:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
