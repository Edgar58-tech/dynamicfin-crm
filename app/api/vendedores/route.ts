
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !['GERENTE_VENTAS', 'GERENTE_GENERAL', 'DIRECTOR_GENERAL'].includes(session.user.rol)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limite = parseInt(searchParams.get('limite') || '50');
    const pagina = parseInt(searchParams.get('pagina') || '1');
    const busqueda = searchParams.get('busqueda') || '';
    const estado = searchParams.get('estado') || 'todos';

    // Construir filtros
    const filtros: any = {
      rol: 'VENDEDOR',
      agenciaId: session.user.agenciaId
    };

    if (busqueda) {
      filtros.OR = [
        { nombre: { contains: busqueda, mode: 'insensitive' } },
        { apellido: { contains: busqueda, mode: 'insensitive' } },
        { email: { contains: busqueda, mode: 'insensitive' } }
      ];
    }

    if (estado === 'activos') {
      filtros.activo = true;
    } else if (estado === 'inactivos') {
      filtros.activo = false;
    }

    // Obtener vendedores con estadísticas
    const vendedores = await prisma.user.findMany({
      where: filtros,
      select: {
        id: true,
        nombre: true,
        apellido: true,
        email: true,
        activo: true,
        cargaProspectos: true,
        createdAt: true,
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
        // Obtener metas del mes actual
        metas: {
          where: {
            mes: new Date().getMonth() + 1,
            year: new Date().getFullYear()
          },
          select: {
            metaAutos: true,
            autosVendidos: true,
            especialidad: true
          },
          take: 1
        },
        // Obtener prospectos del mes actual para estadísticas
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
      },
      orderBy: [
        { activo: 'desc' },
        { nombre: 'asc' }
      ],
      skip: (pagina - 1) * limite,
      take: limite
    });

    // Formatear datos con estadísticas calculadas
    const vendedoresFormateados = vendedores.map(vendedor => {
      const prospectosMes = vendedor.prospectosVendedor.length;
      const ventasMes = vendedor.prospectosVendedor.filter(p => p.estatus === 'Vendido').length;
      const conversionMes = prospectosMes > 0 ? Math.round((ventasMes / prospectosMes) * 100) : 0;
      
      return {
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
          ingresosMes: ventasMes * 25000 // Estimación promedio
        }
      };
    });

    // Obtener total para paginación
    const total = await prisma.user.count({
      where: filtros
    });

    return NextResponse.json({
      success: true,
      vendedores: vendedoresFormateados,
      pagination: {
        total,
        pagina,
        limite,
        totalPaginas: Math.ceil(total / limite)
      }
    });

  } catch (error) {
    console.error('Error obteniendo vendedores:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !['GERENTE_VENTAS', 'GERENTE_GENERAL', 'DIRECTOR_GENERAL'].includes(session.user.rol)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { nombre, apellido, email, telefono, especialidad, metaMensual, activo } = body;

    // Validaciones
    if (!nombre || !email) {
      return NextResponse.json({ 
        error: 'Nombre y email son requeridos' 
      }, { status: 400 });
    }

    // Verificar que el email no exista
    const emailExistente = await prisma.user.findUnique({
      where: { email }
    });

    if (emailExistente) {
      return NextResponse.json({ 
        error: 'Ya existe un usuario con este email' 
      }, { status: 400 });
    }

    // Generar contraseña temporal
    const contraseñaTemporal = `${nombre.toLowerCase()}${new Date().getFullYear()}`;
    const contraseñaHash = await bcrypt.hash(contraseñaTemporal, 12);

    // Crear vendedor
    const nuevoVendedor = await prisma.$transaction(async (tx) => {
      // Crear usuario
      const usuario = await tx.user.create({
        data: {
          nombre,
          apellido: apellido || '',
          email,
          password: contraseñaHash,
          rol: 'VENDEDOR',
          activo: activo !== false,
          agenciaId: session.user.agenciaId,
          marcaId: session.user.marcaId,
          grupoId: session.user.grupoId,
          cargaProspectos: 0
        }
      });

      // Crear meta inicial si se especifica
      if (metaMensual && metaMensual > 0) {
        await tx.metaVendedor.create({
          data: {
            vendedorId: usuario.id,
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
      message: 'Vendedor creado exitosamente',
      vendedor: {
        id: nuevoVendedor.id,
        nombre: nuevoVendedor.nombre,
        apellido: nuevoVendedor.apellido,
        email: nuevoVendedor.email,
        contraseñaTemporal // Solo para mostrar al admin
      }
    });

  } catch (error) {
    console.error('Error creando vendedor:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
