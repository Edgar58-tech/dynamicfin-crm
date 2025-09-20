
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !['GERENTE_VENTAS', 'GERENTE_GENERAL'].includes(session.user.rol)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { nombreVendedor, fechaGuardia, horaEntrada, horaSalida, observaciones } = body;

    // Buscar vendedor por nombre
    const vendedor = await prisma.user.findFirst({
      where: {
        rol: 'VENDEDOR',
        activo: true,
        agenciaId: session.user.agenciaId,
        OR: [
          { nombre: { contains: nombreVendedor, mode: 'insensitive' } },
          { 
            AND: [
              { nombre: { contains: nombreVendedor.split(' ')[0], mode: 'insensitive' } },
              { apellido: { contains: nombreVendedor.split(' ').slice(1).join(' '), mode: 'insensitive' } }
            ]
          }
        ]
      }
    });

    if (!vendedor) {
      return NextResponse.json({ 
        error: `Vendedor "${nombreVendedor}" no encontrado` 
      }, { status: 404 });
    }

    // Verificar si ya existe guardia para esa fecha
    const guardiaExistente = await prisma.vendedorGuardia.findFirst({
      where: {
        vendedorId: vendedor.id,
        fecha: new Date(fechaGuardia)
      }
    });

    if (guardiaExistente) {
      // Actualizar guardia existente
      const guardiaActualizada = await prisma.vendedorGuardia.update({
        where: { id: guardiaExistente.id },
        data: {
          horaInicio: horaEntrada || '09:00',
          horaFin: horaSalida || '18:00',
          observaciones: observaciones || `Importado automáticamente - ${new Date().toLocaleString()}`,
          activo: true
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Guardia actualizada desde importación',
        guardia: guardiaActualizada
      });
    } else {
      // Crear nueva guardia
      const nuevaGuardia = await prisma.vendedorGuardia.create({
        data: {
          vendedorId: vendedor.id,
          fecha: new Date(fechaGuardia),
          horaInicio: horaEntrada || '09:00',
          horaFin: horaSalida || '18:00',
          activo: true,
          cargaActual: 0,
          metaDelDia: 5,
          observaciones: observaciones || `Importado automáticamente - ${new Date().toLocaleString()}`,
          creadoPor: session.user.id
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Guardia creada desde importación',
        guardia: nuevaGuardia
      });
    }

  } catch (error) {
    console.error('Error importando guardia:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
