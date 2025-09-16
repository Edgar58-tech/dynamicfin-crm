
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.rol !== 'GERENTE_VENTAS') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { leadId, vendedorNuevoId, vendedorAnteriorId, motivoReasignacion, comentarios } = body;

    // Validar que el lead existe y pertenece a la agencia
    const prospecto = await prisma.prospecto.findFirst({
      where: {
        id: leadId,
        agenciaId: session.user.agenciaId || undefined,
        vendedorId: vendedorAnteriorId
      }
    });

    if (!prospecto) {
      return NextResponse.json({ error: 'Lead no encontrado' }, { status: 404 });
    }

    // Realizar la reasignación
    await prisma.$transaction(async (tx) => {
      // Actualizar el vendedor del prospecto
      await tx.prospecto.update({
        where: { id: leadId },
        data: { vendedorId: vendedorNuevoId }
      });

      // Registrar la reasignación
      await tx.reasignacionLead.create({
        data: {
          prospectoId: leadId,
          vendedorAnteriorId: vendedorAnteriorId,
          vendedorNuevoId: vendedorNuevoId,
          gerenteId: session.user.id,
          motivoReasignacion: motivoReasignacion,
          comentarios: comentarios
        }
      });

      // Crear interacción de reasignación
      await tx.interaccion.create({
        data: {
          prospectoId: leadId,
          usuarioId: session.user.id,
          tipoContacto: 'Reasignación',
          resultado: 'Positivo',
          notas: `Lead reasignado de ${vendedorAnteriorId} a ${vendedorNuevoId}. Motivo: ${motivoReasignacion}`,
          proximaAccion: 'Contacto inicial por nuevo vendedor'
        }
      });
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Lead reasignado exitosamente' 
    });

  } catch (error) {
    console.error('Error en reasignación:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
