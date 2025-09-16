
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// Función para verificar la firma del webhook
const verifyWebhookSignature = (payload: string, signature: string, secret: string): boolean => {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );
};

// Función para procesar actualizaciones de prospectos
const processProspectUpdate = async (data: any) => {
  console.log('Actualizando prospecto desde CRM:', data);
  
  // Aquí iría la lógica para actualizar la base de datos
  // Por ahora simulamos el procesamiento
  
  return {
    processed: true,
    prospectId: data.id,
    changes: data.changes || []
  };
};

// Función para procesar nuevos leads del CRM
const processNewLead = async (data: any) => {
  console.log('Nuevo lead desde CRM:', data);
  
  // Aquí iría la lógica para crear el prospecto en DynamicFin
  // Por ahora simulamos el procesamiento
  
  return {
    created: true,
    leadId: data.id,
    dynamicfinProspectId: `DF_${Date.now()}`
  };
};

// Función para procesar actualizaciones de inventario
const processInventoryUpdate = async (data: any) => {
  console.log('Actualizando inventario desde CRM:', data);
  
  // Aquí iría la lógica para actualizar el inventario
  // Por ahora simulamos el procesamiento
  
  return {
    updated: true,
    vehicleId: data.id,
    changes: data.changes || []
  };
};

// Webhook para recibir actualizaciones del CRM
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-webhook-signature') || '';
    const webhookSecret = process.env.CRM_WEBHOOK_SECRET || 'default_secret';
    
    // Verificar la firma del webhook (en producción)
    if (process.env.NODE_ENV === 'production') {
      if (!verifyWebhookSignature(body, signature, webhookSecret)) {
        return NextResponse.json(
          { error: 'Invalid webhook signature' },
          { status: 401 }
        );
      }
    }

    const data = JSON.parse(body);
    console.log('Webhook recibido del CRM:', {
      type: data.type,
      timestamp: new Date().toISOString(),
      dataKeys: Object.keys(data)
    });

    let result;

    switch (data.type) {
      case 'prospect.updated':
        result = await processProspectUpdate(data.prospect);
        break;

      case 'lead.created':
        result = await processNewLead(data.lead);
        break;

      case 'contact.updated':
        result = await processProspectUpdate(data.contact);
        break;

      case 'inventory.updated':
        result = await processInventoryUpdate(data.inventory);
        break;

      case 'sale.completed':
        console.log('Venta completada en CRM:', data.sale);
        result = {
          acknowledged: true,
          saleId: data.sale.id
        };
        break;

      case 'ping':
        // Webhook de prueba
        return NextResponse.json({
          success: true,
          message: 'Webhook is working',
          timestamp: new Date().toISOString()
        });

      default:
        console.warn('Tipo de webhook no reconocido:', data.type);
        return NextResponse.json(
          { error: 'Unsupported webhook type' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: 'Webhook processed successfully',
      result,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Error procesando webhook CRM:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        details: error.message
      },
      { status: 500 }
    );
  }
}

// Health check para el webhook
export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'CRM Webhook endpoint is healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
}
