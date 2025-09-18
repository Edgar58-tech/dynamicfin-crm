
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

// POST - Recibir webhooks de CRMs externos
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let webhookConfig: any = null;
  
  try {
    const url = new URL(request.url);
    const configId = url.searchParams.get('configId');
    const evento = url.searchParams.get('evento');

    if (!configId) {
      return NextResponse.json(
        { error: 'ID de configuración requerido' },
        { status: 400 }
      );
    }

    // Obtener configuración de webhook
    webhookConfig = await prisma.webhookConfiguration.findFirst({
      where: {
        crmConfigurationId: parseInt(configId),
        evento: evento || undefined,
        tipoWebhook: 'entrante',
        activo: true
      },
      include: {
        crmConfiguration: true
      }
    });

    if (!webhookConfig) {
      return NextResponse.json(
        { error: 'Configuración de webhook no encontrada' },
        { status: 404 }
      );
    }

    // Obtener payload del webhook
    const payload = await request.json();
    const headers = Object.fromEntries(request.headers.entries());

    // Validar firma del webhook si está configurada
    if (webhookConfig.secretoValidacion) {
      const signature = headers['x-hub-signature-256'] || headers['x-signature'] || headers['authorization'];
      
      if (!signature) {
        await logWebhookExecution(webhookConfig.id, {
          tipoEjecucion: 'automatica',
          payloadRecibido: JSON.stringify(payload),
          estadoEjecucion: 'fallido',
          errorDetalle: 'Firma de webhook faltante',
          codigoRespuesta: 401,
          tiempoRespuesta: Date.now() - startTime,
          ipOrigen: headers['x-forwarded-for'] || headers['x-real-ip'] || 'unknown',
          userAgent: headers['user-agent'] || 'unknown'
        });

        return NextResponse.json(
          { error: 'Firma de webhook requerida' },
          { status: 401 }
        );
      }

      const isValidSignature = validateWebhookSignature(
        JSON.stringify(payload),
        signature,
        webhookConfig.secretoValidacion
      );

      if (!isValidSignature) {
        await logWebhookExecution(webhookConfig.id, {
          tipoEjecucion: 'automatica',
          payloadRecibido: JSON.stringify(payload),
          estadoEjecucion: 'fallido',
          errorDetalle: 'Firma de webhook inválida',
          codigoRespuesta: 403,
          tiempoRespuesta: Date.now() - startTime,
          ipOrigen: headers['x-forwarded-for'] || headers['x-real-ip'] || 'unknown',
          userAgent: headers['user-agent'] || 'unknown'
        });

        return NextResponse.json(
          { error: 'Firma de webhook inválida' },
          { status: 403 }
        );
      }
    }

    // Procesar webhook según el evento
    const processResult = await processWebhookPayload(
      webhookConfig,
      payload,
      evento || 'unknown'
    );

    // Log de ejecución exitosa
    await logWebhookExecution(webhookConfig.id, {
      tipoEjecucion: 'automatica',
      payloadRecibido: JSON.stringify(payload),
      respuestaWebhook: JSON.stringify(processResult),
      estadoEjecucion: processResult.success ? 'exitoso' : 'fallido',
      errorDetalle: processResult.success ? null : processResult.error,
      codigoRespuesta: processResult.success ? 200 : 400,
      tiempoRespuesta: Date.now() - startTime,
      ipOrigen: headers['x-forwarded-for'] || headers['x-real-ip'] || 'unknown',
      userAgent: headers['user-agent'] || 'unknown'
    });

    // Actualizar estadísticas del webhook
    await prisma.webhookConfiguration.update({
      where: { id: webhookConfig.id },
      data: {
        ultimaEjecucion: new Date(),
        vecesEjecutado: { increment: 1 },
        vecesExitoso: processResult.success ? { increment: 1 } : undefined,
        vecesFallido: !processResult.success ? { increment: 1 } : undefined
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Webhook procesado exitosamente',
      data: {
        evento: evento,
        processed: processResult.recordsProcessed || 0,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('Error en POST /api/crm/webhook-receive:', error);
    
    // Log de error si tenemos configuración
    if (webhookConfig) {
      await logWebhookExecution(webhookConfig.id, {
        tipoEjecucion: 'automatica',
        estadoEjecucion: 'fallido',
        errorDetalle: error.message,
        codigoRespuesta: 500,
        tiempoRespuesta: Date.now() - startTime
      });

      // Actualizar estadísticas de error
      await prisma.webhookConfiguration.update({
        where: { id: webhookConfig.id },
        data: {
          ultimaEjecucion: new Date(),
          vecesEjecutado: { increment: 1 },
          vecesFallido: { increment: 1 }
        }
      });
    }
    
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

// Función para validar firma de webhook
function validateWebhookSignature(payload: string, signature: string, secret: string): boolean {
  try {
    // Soportar diferentes formatos de firma
    let expectedSignature: string;
    
    if (signature.startsWith('sha256=')) {
      // GitHub/GitLab style
      expectedSignature = 'sha256=' + crypto.createHmac('sha256', secret).update(payload).digest('hex');
    } else if (signature.startsWith('Bearer ')) {
      // Bearer token style
      expectedSignature = signature;
    } else {
      // Raw HMAC
      expectedSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    }

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    console.error('Error validating webhook signature:', error);
    return false;
  }
}

// Función para procesar payload del webhook
async function processWebhookPayload(webhookConfig: any, payload: any, evento: string): Promise<any> {
  try {
    let recordsProcessed = 0;
    
    switch (evento) {
      case 'prospecto_creado':
      case 'lead_created':
        recordsProcessed = await processLeadCreated(webhookConfig, payload);
        break;
        
      case 'prospecto_actualizado':
      case 'lead_updated':
        recordsProcessed = await processLeadUpdated(webhookConfig, payload);
        break;
        
      case 'venta_cerrada':
      case 'deal_closed':
        recordsProcessed = await processDealClosed(webhookConfig, payload);
        break;
        
      case 'contacto_actualizado':
      case 'contact_updated':
        recordsProcessed = await processContactUpdated(webhookConfig, payload);
        break;
        
      default:
        // Evento genérico
        recordsProcessed = await processGenericEvent(webhookConfig, payload, evento);
        break;
    }

    // Log de sincronización
    await prisma.crmSyncLog.create({
      data: {
        crmConfigurationId: webhookConfig.crmConfigurationId,
        tipoOperacion: 'webhook_received',
        entidad: 'webhook_event',
        accion: evento,
        estadoSync: 'exitoso',
        registrosProcesados: recordsProcessed,
        registrosExitosos: recordsProcessed,
        detalleOperacion: JSON.stringify({
          evento: evento,
          webhook_id: webhookConfig.id,
          payload_size: JSON.stringify(payload).length
        }),
        datosEnviados: JSON.stringify(payload)
      }
    });

    return {
      success: true,
      recordsProcessed: recordsProcessed
    };

  } catch (error: any) {
    // Log de error en sincronización
    await prisma.crmSyncLog.create({
      data: {
        crmConfigurationId: webhookConfig.crmConfigurationId,
        tipoOperacion: 'webhook_received',
        entidad: 'webhook_event',
        accion: evento,
        estadoSync: 'error',
        registrosProcesados: 0,
        registrosExitosos: 0,
        registrosFallidos: 1,
        errores: JSON.stringify({
          error: error.message,
          evento: evento
        }),
        datosEnviados: JSON.stringify(payload)
      }
    });

    return {
      success: false,
      error: error.message
    };
  }
}

// Procesadores específicos por tipo de evento
async function processLeadCreated(webhookConfig: any, payload: any): Promise<number> {
  // Mapear campos del CRM a DynamicFin
  const mappings = await prisma.crmFieldMapping.findMany({
    where: {
      crmConfigurationId: webhookConfig.crmConfigurationId,
      entidad: 'prospecto',
      direccionSincronizacion: { in: ['crm_to_dinamicfin', 'bidireccional'] },
      activo: true
    }
  });

  // Transformar datos según mapeos
  const prospectoData: any = {
    agenciaId: webhookConfig.crmConfiguration.agenciaId,
    estatus: 'Nuevo',
    origenLead: 'OTROS'
  };

  for (const mapping of mappings) {
    const crmValue = payload[mapping.campoCrm];
    if (crmValue !== undefined && crmValue !== null) {
      // Aplicar transformaciones si existen
      const transformedValue = applyFieldTransformation(crmValue, mapping);
      prospectoData[mapping.campoDynamicFin] = transformedValue;
    }
  }

  // Crear prospecto si tiene datos mínimos requeridos
  if (prospectoData.nombre || prospectoData.email) {
    await prisma.prospecto.create({
      data: prospectoData
    });
    return 1;
  }

  return 0;
}

async function processLeadUpdated(webhookConfig: any, payload: any): Promise<number> {
  // Similar a processLeadCreated pero actualiza registro existente
  const externalId = payload.id || payload.lead_id;
  if (!externalId) return 0;

  // Buscar prospecto por ID externo o email
  const existingProspecto = await prisma.prospecto.findFirst({
    where: {
      OR: [
        { email: payload.email },
        { telefono: payload.phone }
      ],
      agenciaId: webhookConfig.crmConfiguration.agenciaId
    }
  });

  if (!existingProspecto) return 0;

  // Aplicar actualizaciones según mapeos
  const mappings = await prisma.crmFieldMapping.findMany({
    where: {
      crmConfigurationId: webhookConfig.crmConfigurationId,
      entidad: 'prospecto',
      direccionSincronizacion: { in: ['crm_to_dinamicfin', 'bidireccional'] },
      activo: true
    }
  });

  const updateData: any = {};
  for (const mapping of mappings) {
    const crmValue = payload[mapping.campoCrm];
    if (crmValue !== undefined && crmValue !== null) {
      const transformedValue = applyFieldTransformation(crmValue, mapping);
      updateData[mapping.campoDynamicFin] = transformedValue;
    }
  }

  if (Object.keys(updateData).length > 0) {
    await prisma.prospecto.update({
      where: { id: existingProspecto.id },
      data: updateData
    });
    return 1;
  }

  return 0;
}

async function processDealClosed(webhookConfig: any, payload: any): Promise<number> {
  // Procesar cierre de venta
  // Implementar lógica específica para ventas cerradas
  return 1;
}

async function processContactUpdated(webhookConfig: any, payload: any): Promise<number> {
  // Procesar actualización de contacto
  // Implementar lógica específica para contactos
  return 1;
}

async function processGenericEvent(webhookConfig: any, payload: any, evento: string): Promise<number> {
  // Procesamiento genérico para eventos no específicos
  console.log(`Procesando evento genérico: ${evento}`, payload);
  return 1;
}

// Función para aplicar transformaciones de campo
function applyFieldTransformation(value: any, mapping: any): any {
  try {
    if (!mapping.transformacion) return value;
    
    const transformRules = JSON.parse(mapping.transformacion);
    
    // Aplicar transformaciones según tipo
    switch (mapping.tipoDato) {
      case 'string':
        if (transformRules.uppercase) return String(value).toUpperCase();
        if (transformRules.lowercase) return String(value).toLowerCase();
        if (transformRules.trim) return String(value).trim();
        break;
        
      case 'number':
        if (transformRules.multiply) return Number(value) * transformRules.multiply;
        if (transformRules.divide) return Number(value) / transformRules.divide;
        break;
        
      case 'date':
        if (transformRules.format) {
          return new Date(value);
        }
        break;
        
      case 'boolean':
        if (transformRules.invert) return !Boolean(value);
        break;
    }
    
    return value;
  } catch (error) {
    console.error('Error applying field transformation:', error);
    return value;
  }
}

// Función helper para log de ejecuciones
async function logWebhookExecution(webhookConfigurationId: number, data: any) {
  try {
    await prisma.webhookExecution.create({
      data: {
        webhookConfigurationId,
        ...data
      }
    });
  } catch (error) {
    console.error('Error logging webhook execution:', error);
  }
}
