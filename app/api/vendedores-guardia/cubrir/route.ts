
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
    const {
      guardiaId,
      vendedorOriginalId,
      vendedorSustitutoId,
      motivoCobertura,
      observaciones,
      fecha,
      horaInicio,
      horaFin
    } = body;

    // Validar que el vendedor sustituto existe y está disponible
    const vendedorSustituto = await prisma.user.findFirst({
      where: {
        id: vendedorSustitutoId,
        rol: 'VENDEDOR',
        activo: true,
        agenciaId: session.user.agenciaId
      }
    });

    if (!vendedorSustituto) {
      return NextResponse.json({ 
        error: 'Vendedor sustituto no encontrado o no disponible' 
      }, { status: 404 });
    }

    // Verificar que el vendedor sustituto no tenga guardia ese día
    const guardiaExistente = await prisma.vendedorGuardia.findFirst({
      where: {
        vendedorId: vendedorSustitutoId,
        fecha: new Date(fecha),
        activo: true
      }
    });

    if (guardiaExistente) {
      return NextResponse.json({ 
        error: 'El vendedor sustituto ya tiene guardia asignada ese día' 
      }, { status: 400 });
    }

    // Realizar la transacción de cobertura
    const resultado = await prisma.$transaction(async (tx) => {
      // 1. Desactivar la guardia original
      await tx.vendedorGuardia.update({
        where: { id: guardiaId },
        data: { 
          activo: false,
          observaciones: `${observaciones || ''} - CUBIERTA POR: ${vendedorSustituto.nombre} ${vendedorSustituto.apellido || ''} - MOTIVO: ${motivoCobertura}`
        }
      });

      // 2. Crear nueva guardia para el sustituto
      const nuevaGuardia = await tx.vendedorGuardia.create({
        data: {
          vendedorId: vendedorSustitutoId,
          fecha: new Date(fecha),
          horaInicio: horaInicio || '09:00',
          horaFin: horaFin || '18:00',
          activo: true,
          cargaActual: 0,
          metaDelDia: 5,
          observaciones: `COBERTURA DE GUARDIA - Original: ${vendedorOriginalId} - Motivo: ${motivoCobertura} - ${observaciones || ''}`,
          creadoPor: session.user.id
        }
      });

      // 3. Registrar el cambio en un log (si tienes tabla de logs)
      // Aquí podrías crear un registro de auditoría

      // 4. Transferir leads activos si los hay
      const leadsActivos = await tx.prospecto.findMany({
        where: {
          vendedorId: vendedorOriginalId,
          estatus: {
            in: ['Nuevo', 'Contactado', 'PENDIENTE_CALIFICACION']
          }
        }
      });

      if (leadsActivos.length > 0) {
        // Reasignar leads al vendedor sustituto
        await tx.prospecto.updateMany({
          where: {
            vendedorId: vendedorOriginalId,
            estatus: {
              in: ['Nuevo', 'Contactado', 'PENDIENTE_CALIFICACION']
            }
          },
          data: {
            vendedorId: vendedorSustitutoId
          }
        });

        // Actualizar carga del vendedor sustituto
        await tx.user.update({
          where: { id: vendedorSustitutoId },
          data: {
            cargaProspectos: {
              increment: leadsActivos.length
            }
          }
        });

        // Actualizar carga del vendedor original
        await tx.user.update({
          where: { id: vendedorOriginalId },
          data: {
            cargaProspectos: {
              decrement: leadsActivos.length
            }
          }
        });

        // Actualizar carga actual de la nueva guardia
        await tx.vendedorGuardia.update({
          where: { id: nuevaGuardia.id },
          data: {
            cargaActual: leadsActivos.length
          }
        });
      }

      return {
        nuevaGuardia,
        leadsTransferidos: leadsActivos.length
      };
    });

    return NextResponse.json({
      success: true,
      message: 'Guardia cubierta exitosamente',
      vendedorSustituto: `${vendedorSustituto.nombre} ${vendedorSustituto.apellido || ''}`,
      leadsTransferidos: resultado.leadsTransferidos,
      nuevaGuardiaId: resultado.nuevaGuardia.id
    });

  } catch (error) {
    console.error('Error cubriendo guardia:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
