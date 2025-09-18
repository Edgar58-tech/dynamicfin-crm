
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

// GET - Obtener configuraciones CRM
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
    const configId = url.searchParams.get('id');
    const agenciaId = session.user.agenciaId;

    if (!agenciaId) {
      return NextResponse.json(
        { error: 'Usuario sin agencia asignada' },
        { status: 400 }
      );
    }

    if (configId) {
      // Obtener configuración específica
      const config = await prisma.crmConfiguration.findFirst({
        where: {
          id: parseInt(configId),
          agenciaId: agenciaId as number
        },
        include: {
          mapeosCampos: true,
          configuracionesWebhook: true,
          metricas: {
            orderBy: { fecha: 'desc' },
            take: 30
          }
        }
      });

      if (!config) {
        return NextResponse.json(
          { error: 'Configuración CRM no encontrada' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          ...config,
          // Ocultar claves sensibles en la respuesta
          crmApiKey: config.crmApiKey ? '***' + config.crmApiKey.slice(-4) : '',
          crmSecretKey: config.crmSecretKey ? '***' + config.crmSecretKey.slice(-4) : '',
          webhookSecret: config.webhookSecret ? '***' + config.webhookSecret.slice(-4) : ''
        }
      });
    } else {
      // Obtener todas las configuraciones
      const configs = await prisma.crmConfiguration.findMany({
        where: {
          agenciaId: agenciaId as number
        },
        include: {
          _count: {
            select: {
              mapeosCampos: true,
              logsSync: true,
              configuracionesWebhook: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      return NextResponse.json({
        success: true,
        data: configs.map(config => ({
          ...config,
          // Ocultar claves sensibles
          crmApiKey: config.crmApiKey ? '***' + config.crmApiKey.slice(-4) : '',
          crmSecretKey: config.crmSecretKey ? '***' + config.crmSecretKey.slice(-4) : '',
          webhookSecret: config.webhookSecret ? '***' + config.webhookSecret.slice(-4) : ''
        }))
      });
    }

  } catch (error: any) {
    console.error('Error en GET /api/crm/config:', error);
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

// POST - Crear nueva configuración CRM
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const agenciaId = session.user.agenciaId;
    if (!agenciaId) {
      return NextResponse.json(
        { error: 'Usuario sin agencia asignada' },
        { status: 400 }
      );
    }

    const data = await request.json();
    
    // Validar campos requeridos
    const requiredFields = ['nombre', 'crmTipo', 'crmApiUrl', 'crmApiKey'];
    for (const field of requiredFields) {
      if (!data[field]) {
        return NextResponse.json(
          { error: `Campo requerido: ${field}` },
          { status: 400 }
        );
      }
    }

    // Crear configuración CRM
    const newConfig = await prisma.crmConfiguration.create({
      data: {
        agenciaId: agenciaId,
        nombre: data.nombre,
        crmTipo: data.crmTipo,
        crmApiUrl: data.crmApiUrl,
        crmApiKey: data.crmApiKey,
        crmSecretKey: data.crmSecretKey || '',
        webhookUrl: data.webhookUrl || null,
        webhookSecret: data.webhookSecret || null,
        activo: data.activo !== undefined ? data.activo : true,
        sincronizacionBidireccional: data.sincronizacionBidireccional !== undefined ? data.sincronizacionBidireccional : true,
        frecuenciaSincronizacion: data.frecuenciaSincronizacion || 15,
        configuracionAvanzada: data.configuracionAvanzada ? JSON.stringify(data.configuracionAvanzada) : null,
        limitesAPI: data.limitesAPI ? JSON.stringify(data.limitesAPI) : null,
        credencialesExpiran: data.credencialesExpiran ? new Date(data.credencialesExpiran) : null,
        notificarExpiracion: data.notificarExpiracion !== undefined ? data.notificarExpiracion : true
      },
      include: {
        mapeosCampos: true,
        configuracionesWebhook: true
      }
    });

    // Crear mapeos de campos por defecto basado en el tipo de CRM
    const defaultMappings = getDefaultFieldMappings(data.crmTipo);
    
    for (const mapping of defaultMappings) {
      await prisma.crmFieldMapping.create({
        data: {
          crmConfigurationId: newConfig.id,
          ...mapping
        }
      });
    }

    // Log de la creación
    await prisma.crmSyncLog.create({
      data: {
        crmConfigurationId: newConfig.id,
        tipoOperacion: 'config_created',
        entidad: 'configuracion',
        accion: 'create',
        estadoSync: 'exitoso',
        registrosProcesados: 1,
        registrosExitosos: 1,
        detalleOperacion: JSON.stringify({
          mensaje: 'Configuración CRM creada exitosamente',
          usuario: session.user.email,
          tipoCreado: data.crmTipo
        }),
        usuarioId: session.user.id
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Configuración CRM creada exitosamente',
      data: {
        ...newConfig,
        // Ocultar claves sensibles en respuesta
        crmApiKey: newConfig.crmApiKey ? '***' + newConfig.crmApiKey.slice(-4) : '',
        crmSecretKey: newConfig.crmSecretKey ? '***' + newConfig.crmSecretKey.slice(-4) : ''
      }
    });

  } catch (error: any) {
    console.error('Error en POST /api/crm/config:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Error al crear configuración CRM',
        details: error.message
      },
      { status: 500 }
    );
  }
}

// PUT - Actualizar configuración CRM existente
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const data = await request.json();
    const { configId, ...updateData } = data;

    if (!configId) {
      return NextResponse.json(
        { error: 'ID de configuración requerido' },
        { status: 400 }
      );
    }

    // Verificar que la configuración pertenece a la agencia del usuario
    const existingConfig = await prisma.crmConfiguration.findFirst({
      where: {
        id: configId,
        agenciaId: session.user.agenciaId as number
      }
    });

    if (!existingConfig) {
      return NextResponse.json(
        { error: 'Configuración no encontrada o no autorizada' },
        { status: 404 }
      );
    }

    // Actualizar configuración
    const updatedConfig = await prisma.crmConfiguration.update({
      where: { id: configId },
      data: {
        nombre: updateData.nombre || existingConfig.nombre,
        crmTipo: updateData.crmTipo || existingConfig.crmTipo,
        crmApiUrl: updateData.crmApiUrl || existingConfig.crmApiUrl,
        crmApiKey: updateData.crmApiKey || existingConfig.crmApiKey,
        crmSecretKey: updateData.crmSecretKey !== undefined ? updateData.crmSecretKey : existingConfig.crmSecretKey,
        webhookUrl: updateData.webhookUrl !== undefined ? updateData.webhookUrl : existingConfig.webhookUrl,
        webhookSecret: updateData.webhookSecret !== undefined ? updateData.webhookSecret : existingConfig.webhookSecret,
        activo: updateData.activo !== undefined ? updateData.activo : existingConfig.activo,
        sincronizacionBidireccional: updateData.sincronizacionBidireccional !== undefined ? updateData.sincronizacionBidireccional : existingConfig.sincronizacionBidireccional,
        frecuenciaSincronizacion: updateData.frecuenciaSincronizacion || existingConfig.frecuenciaSincronizacion,
        configuracionAvanzada: updateData.configuracionAvanzada ? JSON.stringify(updateData.configuracionAvanzada) : existingConfig.configuracionAvanzada,
        limitesAPI: updateData.limitesAPI ? JSON.stringify(updateData.limitesAPI) : existingConfig.limitesAPI,
        credencialesExpiran: updateData.credencialesExpiran ? new Date(updateData.credencialesExpiran) : existingConfig.credencialesExpiran,
        notificarExpiracion: updateData.notificarExpiracion !== undefined ? updateData.notificarExpiracion : existingConfig.notificarExpiracion,
        updatedAt: new Date()
      },
      include: {
        mapeosCampos: true,
        configuracionesWebhook: true
      }
    });

    // Log de la actualización
    await prisma.crmSyncLog.create({
      data: {
        crmConfigurationId: configId,
        tipoOperacion: 'config_updated',
        entidad: 'configuracion',
        accion: 'update',
        estadoSync: 'exitoso',
        registrosProcesados: 1,
        registrosExitosos: 1,
        detalleOperacion: JSON.stringify({
          mensaje: 'Configuración CRM actualizada exitosamente',
          usuario: session.user.email,
          cambiosRealizados: Object.keys(updateData)
        }),
        usuarioId: session.user.id
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Configuración CRM actualizada exitosamente',
      data: {
        ...updatedConfig,
        // Ocultar claves sensibles en respuesta
        crmApiKey: updatedConfig.crmApiKey ? '***' + updatedConfig.crmApiKey.slice(-4) : '',
        crmSecretKey: updatedConfig.crmSecretKey ? '***' + updatedConfig.crmSecretKey.slice(-4) : ''
      }
    });

  } catch (error: any) {
    console.error('Error en PUT /api/crm/config:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Error al actualizar configuración CRM',
        details: error.message
      },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar configuración CRM
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const configId = url.searchParams.get('id');

    if (!configId) {
      return NextResponse.json(
        { error: 'ID de configuración requerido' },
        { status: 400 }
      );
    }

    // Verificar que la configuración pertenece a la agencia del usuario
    const existingConfig = await prisma.crmConfiguration.findFirst({
      where: {
        id: parseInt(configId),
        agenciaId: session.user.agenciaId as number
      }
    });

    if (!existingConfig) {
      return NextResponse.json(
        { error: 'Configuración no encontrada o no autorizada' },
        { status: 404 }
      );
    }

    // Eliminar configuración (cascade elimina relaciones)
    await prisma.crmConfiguration.delete({
      where: { id: parseInt(configId) }
    });

    return NextResponse.json({
      success: true,
      message: 'Configuración CRM eliminada exitosamente'
    });

  } catch (error: any) {
    console.error('Error en DELETE /api/crm/config:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Error al eliminar configuración CRM',
        details: error.message
      },
      { status: 500 }
    );
  }
}

// Función helper para obtener mapeos por defecto según tipo de CRM
function getDefaultFieldMappings(crmTipo: string) {
  const baseMappings = [
    // Mapeos para Prospectos
    { entidad: 'prospecto', campoDynamicFin: 'nombre', campoCrm: 'first_name', tipoDato: 'string', requerido: true },
    { entidad: 'prospecto', campoDynamicFin: 'apellido', campoCrm: 'last_name', tipoDato: 'string', requerido: false },
    { entidad: 'prospecto', campoDynamicFin: 'email', campoCrm: 'email', tipoDato: 'string', requerido: true },
    { entidad: 'prospecto', campoDynamicFin: 'telefono', campoCrm: 'phone', tipoDato: 'string', requerido: true },
    { entidad: 'prospecto', campoDynamicFin: 'presupuesto', campoCrm: 'budget', tipoDato: 'number', requerido: false },
    { entidad: 'prospecto', campoDynamicFin: 'clasificacion', campoCrm: 'lead_score', tipoDato: 'string', requerido: false },
    
    // Mapeos para Vehículos
    { entidad: 'vehiculo', campoDynamicFin: 'marca', campoCrm: 'make', tipoDato: 'string', requerido: true },
    { entidad: 'vehiculo', campoDynamicFin: 'modelo', campoCrm: 'model', tipoDato: 'string', requerido: true },
    { entidad: 'vehiculo', campoDynamicFin: 'year', campoCrm: 'year', tipoDato: 'number', requerido: true },
    { entidad: 'vehiculo', campoDynamicFin: 'precio', campoCrm: 'price', tipoDato: 'number', requerido: true },
    
    // Mapeos para Ventas
    { entidad: 'venta', campoDynamicFin: 'fechaVenta', campoCrm: 'close_date', tipoDato: 'date', requerido: true },
    { entidad: 'venta', campoDynamicFin: 'montoVenta', campoCrm: 'amount', tipoDato: 'number', requerido: true },
    { entidad: 'venta', campoDynamicFin: 'vendedorId', campoCrm: 'owner_id', tipoDato: 'string', requerido: true },
  ];

  // Ajustar mapeos específicos por tipo de CRM
  switch (crmTipo) {
    case 'salesforce':
      return baseMappings.map(mapping => ({
        ...mapping,
        campoCrm: mapping.campoCrm.replace('_', '__c') // Salesforce custom field format
      }));
    
    case 'hubspot':
      return baseMappings.map(mapping => ({
        ...mapping,
        campoCrm: mapping.campoCrm.toLowerCase()
      }));
    
    case 'pipedrive':
      return baseMappings.map(mapping => ({
        ...mapping,
        campoCrm: `custom_${mapping.campoCrm}`
      }));
    
    default:
      return baseMappings;
  }
}
