
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

// GET - Obtener configuraciones de webhooks
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
    const tipo = url.searchParams.get('tipo');

    if (!configId) {
      return NextResponse.json(
        { error: 'ID de configuración CRM requerido' },
        { status: 400 }
      );
    }

    // Verificar que la configuración pertenece a la agencia del usuario
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

    // Construir filtros
    const whereClause: any = {
      crmConfigurationId: parseInt(configId)
    };

    if (tipo) {
      whereClause.tipoWebhook = tipo;
    }

    // Obtener configuraciones de webhooks
    const webhooks = await prisma.webhookConfiguration.findMany({
      where: whereClause,
      include: {
        crmConfiguration: {
          select: {
            id: true,
            nombre: true,
            crmTipo: true
          }
        },
        _count: {
          select: {
            ejecuciones: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      data: webhooks.map(webhook => ({
        ...webhook,
        // Ocultar secreto en la respuesta
        secretoValidacion: webhook.secretoValidacion ? '***' + webhook.secretoValidacion.slice(-4) : null
      }))
    });

  } catch (error: any) {
    console.error('Error en GET /api/crm/webhooks:', error);
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

// POST - Crear configuración de webhook
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
    const requiredFields = ['crmConfigurationId', 'tipoWebhook', 'evento', 'url'];
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

    // Generar secreto de validación si no se proporciona
    const secretoValidacion = data.secretoValidacion || crypto.randomBytes(32).toString('hex');

    // Crear configuración de webhook
    const newWebhook = await prisma.webhookConfiguration.create({
      data: {
        crmConfigurationId: data.crmConfigurationId,
        tipoWebhook: data.tipoWebhook,
        evento: data.evento,
        url: data.url,
        metodoHttp: data.metodoHttp || 'POST',
        headers: data.headers ? JSON.stringify(data.headers) : null,
        secretoValidacion: secretoValidacion,
        formatoPayload: data.formatoPayload || 'json',
        templatePayload: data.templatePayload || null,
        condicionesFiltro: data.condicionesFiltro ? JSON.stringify(data.condicionesFiltro) : null,
        reintentosMaximos: data.reintentosMaximos || 3,
        tiempoEsperaReintentos: data.tiempoEsperaReintentos || 30,
        activo: data.activo !== undefined ? data.activo : true,
        observaciones: data.observaciones || null
      },
      include: {
        crmConfiguration: {
          select: {
            id: true,
            nombre: true,
            crmTipo: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Configuración de webhook creada exitosamente',
      data: {
        ...newWebhook,
        // Ocultar secreto en la respuesta
        secretoValidacion: newWebhook.secretoValidacion ? '***' + newWebhook.secretoValidacion.slice(-4) : null
      }
    });

  } catch (error: any) {
    console.error('Error en POST /api/crm/webhooks:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Error al crear configuración de webhook',
        details: error.message
      },
      { status: 500 }
    );
  }
}

// PUT - Actualizar configuración de webhook
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
    const { webhookId, ...updateData } = data;

    if (!webhookId) {
      return NextResponse.json(
        { error: 'ID de webhook requerido' },
        { status: 400 }
      );
    }

    // Verificar que el webhook existe y pertenece a la agencia del usuario
    const existingWebhook = await prisma.webhookConfiguration.findFirst({
      where: {
        id: webhookId
      },
      include: {
        crmConfiguration: {
          select: {
            id: true,
            agenciaId: true
          }
        }
      }
    });

    if (!existingWebhook || existingWebhook.crmConfiguration.agenciaId !== session.user.agenciaId) {
      return NextResponse.json(
        { error: 'Webhook no encontrado o no autorizado' },
        { status: 404 }
      );
    }

    // Actualizar configuración de webhook
    const updatedWebhook = await prisma.webhookConfiguration.update({
      where: { id: webhookId },
      data: {
        tipoWebhook: updateData.tipoWebhook || existingWebhook.tipoWebhook,
        evento: updateData.evento || existingWebhook.evento,
        url: updateData.url || existingWebhook.url,
        metodoHttp: updateData.metodoHttp || existingWebhook.metodoHttp,
        headers: updateData.headers ? JSON.stringify(updateData.headers) : existingWebhook.headers,
        secretoValidacion: updateData.secretoValidacion || existingWebhook.secretoValidacion,
        formatoPayload: updateData.formatoPayload || existingWebhook.formatoPayload,
        templatePayload: updateData.templatePayload !== undefined ? updateData.templatePayload : existingWebhook.templatePayload,
        condicionesFiltro: updateData.condicionesFiltro ? JSON.stringify(updateData.condicionesFiltro) : existingWebhook.condicionesFiltro,
        reintentosMaximos: updateData.reintentosMaximos !== undefined ? updateData.reintentosMaximos : existingWebhook.reintentosMaximos,
        tiempoEsperaReintentos: updateData.tiempoEsperaReintentos !== undefined ? updateData.tiempoEsperaReintentos : existingWebhook.tiempoEsperaReintentos,
        activo: updateData.activo !== undefined ? updateData.activo : existingWebhook.activo,
        observaciones: updateData.observaciones !== undefined ? updateData.observaciones : existingWebhook.observaciones,
        updatedAt: new Date()
      },
      include: {
        crmConfiguration: {
          select: {
            id: true,
            nombre: true,
            crmTipo: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Configuración de webhook actualizada exitosamente',
      data: {
        ...updatedWebhook,
        // Ocultar secreto en la respuesta
        secretoValidacion: updatedWebhook.secretoValidacion ? '***' + updatedWebhook.secretoValidacion.slice(-4) : null
      }
    });

  } catch (error: any) {
    console.error('Error en PUT /api/crm/webhooks:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Error al actualizar configuración de webhook',
        details: error.message
      },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar configuración de webhook
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
    const webhookId = url.searchParams.get('id');

    if (!webhookId) {
      return NextResponse.json(
        { error: 'ID de webhook requerido' },
        { status: 400 }
      );
    }

    // Verificar que el webhook existe y pertenece a la agencia del usuario
    const existingWebhook = await prisma.webhookConfiguration.findFirst({
      where: {
        id: parseInt(webhookId)
      },
      include: {
        crmConfiguration: {
          select: {
            id: true,
            agenciaId: true
          }
        }
      }
    });

    if (!existingWebhook || existingWebhook.crmConfiguration.agenciaId !== session.user.agenciaId) {
      return NextResponse.json(
        { error: 'Webhook no encontrado o no autorizado' },
        { status: 404 }
      );
    }

    // Eliminar configuración de webhook (cascade elimina ejecuciones)
    await prisma.webhookConfiguration.delete({
      where: { id: parseInt(webhookId) }
    });

    return NextResponse.json({
      success: true,
      message: 'Configuración de webhook eliminada exitosamente'
    });

  } catch (error: any) {
    console.error('Error en DELETE /api/crm/webhooks:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Error al eliminar configuración de webhook',
        details: error.message
      },
      { status: 500 }
    );
  }
}
