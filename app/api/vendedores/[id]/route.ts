
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !['GERENTE_VENTAS', 'GERENTE_GENERAL', 'DIRECTOR_GENERAL'].includes(session.user.rol)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const vendedor = await prisma.user.findFirst({
      where: {
        id: params.id,
        rol: 'VENDEDOR',
        agenciaId: session.user.agenciaId
      },
      include: {
        agencia: {
          select: {
            id: true,
            nombreAgencia: true
          }
        },
        marca: {
          select: {
            id: true,
            nombreMarca: true
          }
        },
        metas: {
          where: {
            mes: new Date().getMonth() + 1,
            year: new Date().getFullYear()
          },
          take: 1
        },
        prospectosVendedor: {
          where: {
            createdAt: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            }
          },
          select: {
            id: true,
            estatus: true
          }
        }
      }
    });

    if (!vendedor) {
      return NextResponse.json({ error: 'Vendedor no encontrado' }, { status: 404 });
    }

    // Calcular estadísticas
    const prospectosMes = vendedor.prospectosVendedor.length;
    const ventasMes = vendedor.prospectosVendedor.filter(p => p.estatus === 'Vendido').length;
    const conversionMes = prospectosMes > 0 ? Math.round((ventasMes / prospectosMes) * 100) : 0;

    const vendedorFormateado = {
      id: vendedor.id,
      nombre: vendedor.nombre,
      apellido: vendedor.apellido,
      email: vendedor.email,
      activo: vendedor.activo,
      cargaProspectos: vendedor.cargaProspectos,
      fechaIngreso: vendedor.createdAt.toISOString(),
      especialidad: vendedor.metas[0]?.especialidad || null,
      metaMensual: vendedor.metas[0]?.metaAutos || 5,
      ventasRealizadas: vendedor.metas[0]?.autosVendidos || 0,
      agencia: vendedor.agencia,
      marca: vendedor.marca,
      estadisticas: {
        prospectosMes,
        ventasMes,
        conversionMes,
        ingresosMes: ventasMes * 25000
      }
    };

    return NextResponse.json({
      success: true,
      vendedor: vendedorFormateado
    });

  } catch (error) {
    console.error('Error obteniendo vendedor:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !['GERENTE_VENTAS', 'GERENTE_GENERAL', 'DIRECTOR_GENERAL'].includes(session.user.rol)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { nombre, apellido, email, telefono, especialidad, metaMensual, activo } = body;

    // Verificar que el vendedor existe y pertenece a la agencia
    const vendedorExistente = await prisma.user.findFirst({
      where: {
        id: params.id,
        rol: 'VENDEDOR',
        agenciaId: session.user.agenciaId
      }
    });

    if (!vendedorExistente) {
      return NextResponse.json({ error: 'Vendedor no encontrado' }, { status: 404 });
    }

    // Verificar email único (excluyendo el vendedor actual)
    if (email !== vendedorExistente.email) {
      const emailExistente = await prisma.user.findFirst({
        where: {
          email,
          id: { not: params.id }
        }
      });

      if (emailExistente) {
        return NextResponse.json({ 
          error: 'Ya existe un usuario con este email' 
        }, { status: 400 });
      }
    }

    // Actualizar vendedor
    const vendedorActualizado = await prisma.$transaction(async (tx) => {
      // Actualizar datos básicos
      const usuario = await tx.user.update({
        where: { id: params.id },
        data: {
          nombre,
          apellido: apellido || '',
          email,
          activo: activo !== false
        }
      });

      // Actualizar o crear meta del mes actual
      if (metaMensual && metaMensual > 0) {
        await tx.metaVendedor.upsert({
          where: {
            vendedorId_mes_year: {
              vendedorId: params.id,
              mes: new Date().getMonth() + 1,
              year: new Date().getFullYear()
            }
          },
          update: {
            metaAutos: metaMensual,
            especialidad: especialidad || null
          },
          create: {
            vendedorId: params.id,
            mes: new Date().getMonth() + 1,
            year: new Date().getFullYear(),
            metaAutos: metaMensual,
            especialidad: especialidad || null,
            autosVendidos: 0,
            ingresosReales: 0,
            porcentajeCumplimiento: 0
          }
        });
      }

      return usuario;
    });

    return NextResponse.json({
      success: true,
      message: 'Vendedor actualizado exitosamente',
      vendedor: {
        id: vendedorActualizado.id,
        nombre: vendedorActualizado.nombre,
        apellido: vendedorActualizado.apellido,
        email: vendedorActualizado.email,
        activo: vendedorActualizado.activo
      }
    });

  } catch (error) {
    console.error('Error actualizando vendedor:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    // Solo directores pueden eliminar vendedores
    if (!session || session.user.rol !== 'DIRECTOR_GENERAL') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar que el vendedor existe
    const vendedor = await prisma.user.findFirst({
      where: {
        id: params.id,
        rol: 'VENDEDOR',
        agenciaId: session.user.agenciaId
      },
      include: {
        prospectosVendedor: {
          where: {
            estatus: {
              in: ['Nuevo', 'Contactado', 'PENDIENTE_CALIFICACION']
            }
          }
        }
      }
    });

    if (!vendedor) {
      return NextResponse.json({ error: 'Vendedor no encontrado' }, { status: 404 });
    }

    // Verificar si tiene prospectos activos
    if (vendedor.prospectosVendedor.length > 0) {
      return NextResponse.json({ 
        error: `No se puede eliminar el vendedor. Tiene ${vendedor.prospectosVendedor.length} prospectos activos. Reasígnalos primero.` 
      }, { status: 400 });
    }

    // Eliminar vendedor y datos relacionados
    await prisma.$transaction(async (tx) => {
      // Eliminar metas
      await tx.metaVendedor.deleteMany({
        where: { vendedorId: params.id }
      });

      // Eliminar guardias
      await tx.vendedorGuardia.deleteMany({
        where: { vendedorId: params.id }
      });

      // Eliminar sesiones de coaching
      await tx.sesionCoaching.deleteMany({
        where: { vendedorId: params.id }
      });

      // Eliminar el usuario
      await tx.user.delete({
        where: { id: params.id }
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Vendedor eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error eliminando vendedor:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
