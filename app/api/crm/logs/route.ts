
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

// GET - Obtener logs de sincronización CRM
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const configId = url.searchParams.get('configId');
    const tipo = url.searchParams.get('tipo'); // 'sync' o 'webhook'
    const entidad = url.searchParams.get('entidad');
    const estado = url.searchParams.get('estado');
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = Math.min(parseInt(url.searchParams.get('pageSize') || '20'), 100);
    const fechaDesde = url.searchParams.get('fechaDesde');
    const fechaHasta = url.searchParams.get('fechaHasta');

    // Construir filtros base
    const whereClause: any = {};

    // Filtrar por configuraciones de la agencia del usuario
    if (configId) {
      const config = await prisma.crmConfiguration.findFirst({
        where: {
          id: parseInt(configId),
          agenciaId: session.user.agenciaId as number
        }
      });

      if (!config) {
        return NextResponse.json(
          { error: 'Configuración CRM no encontrada' },
          { status: 404 }
        );
      }

      whereClause.crmConfigurationId = parseInt(configId);
    } else {
      // Obtener todas las configuraciones de la agencia
      const configs = await prisma.crmConfiguration.findMany({
        where: { agenciaId: session.user.agenciaId as number },
        select: { id: true }
      });

      whereClause.crmConfigurationId = {
        in: configs.map(c => c.id)
      };
    }

    // Filtros adicionales
    if (tipo === 'sync') {
      whereClause.tipoOperacion = {
        in: ['sync_to_crm', 'sync_from_crm', 'manual_sync', 'bulk_sync']
      };
    } else if (tipo === 'webhook') {
      whereClause.tipoOperacion = 'webhook_received';
    }

    if (entidad) {
      whereClause.entidad = entidad;
    }

    if (estado) {
      whereClause.estadoSync = estado;
    }

    if (fechaDesde) {
      whereClause.fechaInicio = {
        ...whereClause.fechaInicio,
        gte: new Date(fechaDesde)
      };
    }

    if (fechaHasta) {
      whereClause.fechaInicio = {
        ...whereClause.fechaInicio,
        lte: new Date(fechaHasta)
      };
    }

    // Obtener logs con paginación
    const [logs, totalCount] = await Promise.all([
      prisma.crmSyncLog.findMany({
        where: whereClause,
        include: {
          crmConfiguration: {
            select: {
              id: true,
              nombre: true,
              crmTipo: true
            }
          },
          usuario: {
            select: {
              id: true,
              nombre: true,
              email: true
            }
          }
        },
        orderBy: { fechaInicio: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize
      }),
      prisma.crmSyncLog.count({ where: whereClause })
    ]);

    // Obtener estadísticas generales
    const estadisticas = await prisma.crmSyncLog.groupBy({
      by: ['estadoSync'],
      where: whereClause,
      _count: {
        id: true
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        logs: logs.map(log => ({
          ...log,
          // Parsear campos JSON para facilitar uso en frontend
          detalleOperacion: log.detalleOperacion ? JSON.parse(log.detalleOperacion) : null,
          errores: log.errores ? JSON.parse(log.errores) : null,
          datosEnviados: log.datosEnviados ? JSON.parse(log.datosEnviados) : null,
          respuestaCrm: log.respuestaCrm ? JSON.parse(log.respuestaCrm) : null
        })),
        pagination: {
          page,
          pageSize,
          totalCount,
          totalPages: Math.ceil(totalCount / pageSize)
        },
        estadisticas: {
          total: totalCount,
          porEstado: estadisticas.reduce((acc, stat) => {
            acc[stat.estadoSync] = stat._count.id;
            return acc;
          }, {} as Record<string, number>)
        }
      }
    });

  } catch (error: any) {
    console.error('Error en GET /api/crm/logs:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Error interno del servidor',
        details: error.message
      },
      { status: 500 }
    );
  }
}

// POST - Crear log manual (para testing o logs custom)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const data = await request.json();
    
    // Validar campos requeridos
    const requiredFields = ['crmConfigurationId', 'tipoOperacion', 'entidad', 'accion', 'estadoSync'];
    for (const field of requiredFields) {
      if (!data[field]) {
        return NextResponse.json(
          { error: `Campo requerido: ${field}` },
          { status: 400 }
        );
      }
    }

    // Verificar que la configuración pertenece a la agencia del usuario
    const config = await prisma.crmConfiguration.findFirst({
      where: {
        id: data.crmConfigurationId,
        agenciaId: session.user.agenciaId as number
      }
    });

    if (!config) {
      return NextResponse.json(
        { error: 'Configuración CRM no encontrada' },
        { status: 404 }
      );
    }

    // Crear log
    const newLog = await prisma.crmSyncLog.create({
      data: {
        crmConfigurationId: data.crmConfigurationId,
        tipoOperacion: data.tipoOperacion,
        entidad: data.entidad,
        accion: data.accion,
        estadoSync: data.estadoSync,
        registrosProcesados: data.registrosProcesados || 0,
        registrosExitosos: data.registrosExitosos || 0,
        registrosFallidos: data.registrosFallidos || 0,
        tiempoEjecucion: data.tiempoEjecucion || null,
        detalleOperacion: data.detalleOperacion ? JSON.stringify(data.detalleOperacion) : null,
        errores: data.errores ? JSON.stringify(data.errores) : null,
        datosEnviados: data.datosEnviados ? JSON.stringify(data.datosEnviados) : null,
        respuestaCrm: data.respuestaCrm ? JSON.stringify(data.respuestaCrm) : null,
        codigoRespuesta: data.codigoRespuesta || null,
        usuarioId: session.user.id,
        ipOrigen: data.ipOrigen || null,
        fechaFin: data.fechaFin ? new Date(data.fechaFin) : new Date()
      },
      include: {
        crmConfiguration: {
          select: {
            id: true,
            nombre: true,
            crmTipo: true
          }
        },
        usuario: {
          select: {
            id: true,
            nombre: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Log creado exitosamente',
      data: newLog
    });

  } catch (error: any) {
    console.error('Error en POST /api/crm/logs:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Error al crear log',
        details: error.message
      },
      { status: 500 }
    );
  }
}

// DELETE - Limpiar logs antiguos
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Solo administradores pueden limpiar logs
    if (!['GERENTE_GENERAL', 'DIRECTOR_MARCA', 'DIRECTOR_GENERAL', 'DYNAMICFIN_ADMIN'].includes(session.user.rol)) {
      return NextResponse.json(
        { error: 'Permisos insuficientes' },
        { status: 403 }
      );
    }

    const url = new URL(request.url);
    const dias = parseInt(url.searchParams.get('dias') || '30');
    const configId = url.searchParams.get('configId');

    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - dias);

    // Construir filtro
    const whereClause: any = {
      fechaInicio: {
        lt: fechaLimite
      }
    };

    if (configId) {
      // Verificar que la configuración pertenece a la agencia
      const config = await prisma.crmConfiguration.findFirst({
        where: {
          id: parseInt(configId),
          agenciaId: session.user.agenciaId as number
        }
      });

      if (!config) {
        return NextResponse.json(
          { error: 'Configuración CRM no encontrada' },
          { status: 404 }
        );
      }

      whereClause.crmConfigurationId = parseInt(configId);
    } else {
      // Limitar a configuraciones de la agencia
      const configs = await prisma.crmConfiguration.findMany({
        where: { agenciaId: session.user.agenciaId as number },
        select: { id: true }
      });

      whereClause.crmConfigurationId = {
        in: configs.map(c => c.id)
      };
    }

    // Eliminar logs antiguos
    const deleteResult = await prisma.crmSyncLog.deleteMany({
      where: whereClause
    });

    return NextResponse.json({
      success: true,
      message: `${deleteResult.count} logs eliminados exitosamente`,
      data: {
        logsEliminados: deleteResult.count,
        fechaLimite: fechaLimite.toISOString()
      }
    });

  } catch (error: any) {
    console.error('Error en DELETE /api/crm/logs:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Error al limpiar logs',
        details: error.message
      },
      { status: 500 }
    );
  }
}
