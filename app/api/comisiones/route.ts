
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Solo gerentes, directores y admins pueden ver comisiones
    if (!['GERENTE_VENTAS', 'GERENTE_GENERAL', 'DIRECTOR_MARCA', 'DIRECTOR_GENERAL', 'DYNAMICFIN_ADMIN'].includes(session.user.rol)) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const vendedorId = searchParams.get('vendedorId');
    const mes = searchParams.get('mes');
    const year = searchParams.get('year');

    switch (action) {
      case 'resumen-vendedor':
        if (!vendedorId) {
          return NextResponse.json({ error: 'ID de vendedor requerido' }, { status: 400 });
        }

        const resumenVendedor = await calcularResumenComisionesVendedor(vendedorId, mes ? parseInt(mes) : undefined, year ? parseInt(year) : undefined);
        return NextResponse.json({ success: true, data: resumenVendedor });

      case 'historial-vendedor':
        if (!vendedorId) {
          return NextResponse.json({ error: 'ID de vendedor requerido' }, { status: 400 });
        }

        const historial = await prisma.registroComision.findMany({
          where: { vendedorId },
          include: {
            vendedor: {
              select: { nombre: true, apellido: true }
            },
            esquemaComision: {
              select: { nombre: true, porcentajeBase: true }
            },
            prospecto: {
              select: { nombre: true, vehiculoInteres: true }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 50
        });

        return NextResponse.json({ success: true, data: historial });

      case 'esquemas-activos':
        const esquemas = await prisma.esquemaComision.findMany({
          where: { activo: true },
          include: {
            vendedor: {
              select: { id: true, nombre: true, apellido: true }
            },
            _count: {
              select: { comisionesGeneradas: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({ success: true, data: esquemas });

      case 'resumen-general':
        const fechaActual = new Date();
        const mesActual = parseInt(mes) || fechaActual.getMonth() + 1;
        const yearActual = parseInt(year) || fechaActual.getFullYear();

        const comisionesTotales = await prisma.registroComision.aggregate({
          where: {
            mes: mesActual,
            year: yearActual
          },
          _sum: { montoComision: true },
          _count: { id: true }
        });

        const comisionesPagadas = await prisma.registroComision.aggregate({
          where: {
            mes: mesActual,
            year: yearActual,
            pagado: true
          },
          _sum: { montoComision: true },
          _count: { id: true }
        });

        const comisionesPendientes = await prisma.registroComision.aggregate({
          where: {
            mes: mesActual,
            year: yearActual,
            pagado: false
          },
          _sum: { montoComision: true },
          _count: { id: true }
        });

        const topVendedores = await prisma.registroComision.groupBy({
          by: ['vendedorId'],
          where: {
            mes: mesActual,
            year: yearActual
          },
          _sum: { montoComision: true },
          orderBy: {
            _sum: { montoComision: 'desc' }
          },
          take: 10
        });

        const topVendedoresConNombres = await Promise.all(
          topVendedores.map(async (top) => {
            const vendedor = await prisma.user.findUnique({
              where: { id: top.vendedorId },
              select: { nombre: true, apellido: true }
            });
            return {
              vendedorId: top.vendedorId,
              nombre: `${vendedor?.nombre} ${vendedor?.apellido || ''}`.trim(),
              montoTotal: top._sum.montoComision || 0
            };
          })
        );

        return NextResponse.json({
          success: true,
          data: {
            resumen: {
              totalComisiones: comisionesTotales._sum.montoComision || 0,
              totalRegistros: comisionesTotales._count || 0,
              montosPagados: comisionesPagadas._sum.montoComision || 0,
              registrosPagados: comisionesPagadas._count || 0,
              montosPendientes: comisionesPendientes._sum.montoComision || 0,
              registrosPendientes: comisionesPendientes._count || 0
            },
            topVendedores: topVendedoresConNombres,
            mes: mesActual,
            year: yearActual
          }
        });

      default:
        // Listar todas las comisiones con filtros
        const where: any = {};
        
        if (vendedorId) where.vendedorId = vendedorId;
        if (mes) where.mes = parseInt(mes);
        if (year) where.year = parseInt(year);

        const comisiones = await prisma.registroComision.findMany({
          where,
          include: {
            vendedor: {
              select: { nombre: true, apellido: true }
            },
            esquemaComision: {
              select: { nombre: true, porcentajeBase: true }
            },
            prospecto: {
              select: { nombre: true, vehiculoInteres: true }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 100
        });

        return NextResponse.json({ success: true, data: comisiones });
    }

  } catch (error) {
    console.error('Error en API de comisiones:', error);
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

    // Solo gerentes y admins pueden crear/modificar comisiones
    if (!['GERENTE_VENTAS', 'GERENTE_GENERAL', 'DYNAMICFIN_ADMIN'].includes(session.user.rol)) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
    }

    const { action } = await request.json();

    switch (action) {
      case 'crear-esquema':
        return await crearEsquemaComision(request);

      case 'calcular-comisiones':
        return await calcularComisionesPorMes(request);

      case 'marcar-pagado':
        return await marcarComisionPagada(request);

      case 'generar-reporte':
        return await generarReporteComisiones(request);

      default:
        return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
    }

  } catch (error) {
    console.error('Error en POST de comisiones:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// Funciones auxiliares
async function calcularResumenComisionesVendedor(vendedorId: string, mes?: number, year?: number) {
  const fechaActual = new Date();
  const mesConsulta = mes || fechaActual.getMonth() + 1;
  const yearConsulta = year || fechaActual.getFullYear();

  const comisionesDelPeriodo = await prisma.registroComision.findMany({
    where: {
      vendedorId,
      mes: mesConsulta,
      year: yearConsulta
    },
    include: {
      esquemaComision: true,
      prospecto: {
        select: { nombre: true, vehiculoInteres: true }
      }
    }
  });

  const totalComisiones = comisionesDelPeriodo.reduce((acc, com) => acc + Number(com.montoComision), 0);
  const totalPagado = comisionesDelPeriodo.filter(c => c.pagado).reduce((acc, com) => acc + Number(com.montoComision), 0);
  const totalPendiente = totalComisiones - totalPagado;

  const ventasCerradas = comisionesDelPeriodo.filter(c => c.tipoComision === 'base').length;

  // Obtener esquema actual del vendedor
  const esquemaActual = await prisma.esquemaComision.findFirst({
    where: {
      vendedorId,
      activo: true
    },
    orderBy: { fechaInicio: 'desc' }
  });

  return {
    vendedorId,
    mes: mesConsulta,
    year: yearConsulta,
    totalComisiones,
    totalPagado,
    totalPendiente,
    ventasCerradas,
    esquemaActual,
    detalleComisiones: comisionesDelPeriodo
  };
}

async function crearEsquemaComision(request: NextRequest) {
  const { 
    vendedorId, 
    nombre, 
    porcentajeBase, 
    bonoVolumen, 
    bonoMargen, 
    incentiveReferencia, 
    incentiveMejora 
  } = await request.json();

  if (!vendedorId || !nombre || !porcentajeBase) {
    return NextResponse.json({ error: 'Campos requeridos: vendedorId, nombre, porcentajeBase' }, { status: 400 });
  }

  // Desactivar esquema anterior si existe
  await prisma.esquemaComision.updateMany({
    where: { vendedorId, activo: true },
    data: { activo: false, fechaFin: new Date() }
  });

  // Crear nuevo esquema
  const nuevoEsquema = await prisma.esquemaComision.create({
    data: {
      vendedorId,
      nombre,
      porcentajeBase: Number(porcentajeBase),
      bonoVolumen: Number(bonoVolumen) || 0,
      bonoMargen: Number(bonoMargen) || 0,
      incentiveReferencia: Number(incentiveReferencia) || 0,
      incentiveMejora: Number(incentiveMejora) || 0
    }
  });

  return NextResponse.json({ success: true, data: nuevoEsquema });
}

async function calcularComisionesPorMes(request: NextRequest) {
  const { mes, year, vendedorId } = await request.json();

  if (!mes || !year) {
    return NextResponse.json({ error: 'Mes y año son requeridos' }, { status: 400 });
  }

  // Buscar ventas cerradas del mes
  const ventas = await prisma.prospecto.findMany({
    where: {
      AND: [
        { estadoVenta: 'VENDIDO' },
        {
          OR: [
            { fechaCierre: { 
              gte: new Date(year, mes - 1, 1),
              lt: new Date(year, mes, 1)
            }},
            { fechaEntrega: {
              gte: new Date(year, mes - 1, 1),
              lt: new Date(year, mes, 1)
            }}
          ]
        },
        vendedorId ? { vendedorId } : {}
      ]
    },
    include: {
      vendedor: {
        select: { id: true, nombre: true, apellido: true }
      }
    }
  });

  const comisionesCreadas = [];

  for (const venta of ventas) {
    if (!venta.vendedorId) continue;

    // Obtener esquema del vendedor para esa fecha
    const esquema = await prisma.esquemaComision.findFirst({
      where: {
        vendedorId: venta.vendedorId,
        fechaInicio: { lte: venta.fechaCierre || new Date() },
        OR: [
          { fechaFin: null },
          { fechaFin: { gte: venta.fechaCierre || new Date() } }
        ]
      }
    });

    if (!esquema) continue;

    const montoVenta = Number(venta.valorVenta || 0);
    const porcentaje = Number(esquema.porcentajeBase);
    const montoComision = (montoVenta * porcentaje);

    // Verificar si ya existe el registro
    const existeComision = await prisma.registroComision.findFirst({
      where: {
        vendedorId: venta.vendedorId,
        prospectoId: venta.id,
        mes,
        year,
        tipoComision: 'base'
      }
    });

    if (!existeComision) {
      const nuevaComision = await prisma.registroComision.create({
        data: {
          vendedorId: venta.vendedorId,
          esquemaComisionId: esquema.id,
          prospectoId: venta.id,
          mes,
          year,
          tipoComision: 'base',
          montoVenta,
          porcentaje,
          montoComision,
          notas: `Comisión base por venta de ${venta.vehiculoInteres}`
        }
      });

      comisionesCreadas.push(nuevaComision);
    }
  }

  return NextResponse.json({
    success: true,
    data: {
      ventasProcesadas: ventas.length,
      comisionesCreadas: comisionesCreadas.length,
      detalles: comisionesCreadas
    }
  });
}

async function marcarComisionPagada(request: NextRequest) {
  const { comisionIds, fechaPago, notas } = await request.json();

  if (!comisionIds || !Array.isArray(comisionIds)) {
    return NextResponse.json({ error: 'IDs de comisiones requeridos' }, { status: 400 });
  }

  const comisionesActualizadas = await prisma.registroComision.updateMany({
    where: { id: { in: comisionIds } },
    data: {
      pagado: true,
      fechaPago: fechaPago ? new Date(fechaPago) : new Date(),
      notas: notas || 'Marcado como pagado'
    }
  });

  return NextResponse.json({
    success: true,
    data: { comisionesActualizadas: comisionesActualizadas.count }
  });
}

async function generarReporteComisiones(request: NextRequest) {
  const { mes, year, vendedorId, formato } = await request.json();

  const where: any = {};
  if (mes) where.mes = parseInt(mes);
  if (year) where.year = parseInt(year);
  if (vendedorId) where.vendedorId = vendedorId;

  const comisiones = await prisma.registroComision.findMany({
    where,
    include: {
      vendedor: {
        select: { nombre: true, apellido: true, email: true }
      },
      esquemaComision: {
        select: { nombre: true, porcentajeBase: true }
      },
      prospecto: {
        select: { nombre: true, vehiculoInteres: true, valorVenta: true }
      }
    },
    orderBy: [
      { vendedorId: 'asc' },
      { createdAt: 'desc' }
    ]
  });

  // Agrupar por vendedor
  const reportePorVendedor = comisiones.reduce((acc: any, comision) => {
    const key = comision.vendedorId;
    if (!acc[key]) {
      acc[key] = {
        vendedor: comision.vendedor,
        totalComisiones: 0,
        totalPagado: 0,
        totalPendiente: 0,
        ventasCerradas: 0,
        detalles: []
      };
    }

    acc[key].totalComisiones += Number(comision.montoComision);
    if (comision.pagado) {
      acc[key].totalPagado += Number(comision.montoComision);
    } else {
      acc[key].totalPendiente += Number(comision.montoComision);
    }
    acc[key].ventasCerradas += 1;
    acc[key].detalles.push(comision);

    return acc;
  }, {});

  return NextResponse.json({
    success: true,
    data: {
      resumen: {
        totalVendedores: Object.keys(reportePorVendedor).length,
        totalComisiones: comisiones.reduce((acc, c) => acc + Number(c.montoComision), 0),
        totalPagado: comisiones.filter(c => c.pagado).reduce((acc, c) => acc + Number(c.montoComision), 0),
        totalPendiente: comisiones.filter(c => !c.pagado).reduce((acc, c) => acc + Number(c.montoComision), 0)
      },
      reportePorVendedor: Object.values(reportePorVendedor),
      detalleCompleto: comisiones,
      parametros: { mes, year, vendedorId, formato }
    }
  });
}
