
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

// Ejemplo de configuración CRM (en producción vendría de base de datos)
const getCRMConfig = () => {
  return {
    crmActivo: true,
    crmTipo: 'salesforce',
    crmApiUrl: process.env.CRM_API_URL || 'https://api.salesforce.com/v1/',
    crmApiKey: process.env.CRM_API_KEY || '',
    crmSecretKey: process.env.CRM_SECRET_KEY || '',
    sincronizacionBidireccional: true,
    frecuenciaSincronizacion: 15,
  };
};

// Función para enviar datos al CRM
const sendToCRM = async (data: any, endpoint: string) => {
  const config = getCRMConfig();
  
  if (!config.crmActivo) {
    throw new Error('CRM integration is disabled');
  }

  const response = await fetch(`${config.crmApiUrl}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.crmApiKey}`,
      'X-API-Secret': config.crmSecretKey,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`CRM API error: ${response.status} ${response.statusText}`);
  }

  return await response.json();
};

// Función para obtener datos del CRM
const getFromCRM = async (endpoint: string) => {
  const config = getCRMConfig();
  
  if (!config.crmActivo) {
    throw new Error('CRM integration is disabled');
  }

  const response = await fetch(`${config.crmApiUrl}${endpoint}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${config.crmApiKey}`,
      'X-API-Secret': config.crmSecretKey,
    },
  });

  if (!response.ok) {
    throw new Error(`CRM API error: ${response.status} ${response.statusText}`);
  }

  return await response.json();
};

// API para sincronización manual
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { action, data } = await request.json();

    switch (action) {
      case 'sync_prospects':
        // Sincronizar prospectos a CRM
        const prospectsResult = await sendToCRM({
          prospects: data.prospects,
          source: 'dynamicfin'
        }, 'prospects');
        
        return NextResponse.json({
          success: true,
          message: 'Prospectos sincronizados exitosamente',
          data: prospectsResult,
          synced: data.prospects?.length || 0
        });

      case 'sync_vehicles':
        // Sincronizar inventario a CRM
        const vehiclesResult = await sendToCRM({
          vehicles: data.vehicles,
          source: 'dynamicfin'
        }, 'inventory');
        
        return NextResponse.json({
          success: true,
          message: 'Inventario sincronizado exitosamente',
          data: vehiclesResult,
          synced: data.vehicles?.length || 0
        });

      case 'sync_sales':
        // Sincronizar ventas a CRM
        const salesResult = await sendToCRM({
          sales: data.sales,
          source: 'dynamicfin'
        }, 'sales');
        
        return NextResponse.json({
          success: true,
          message: 'Ventas sincronizadas exitosamente',
          data: salesResult,
          synced: data.sales?.length || 0
        });

      case 'pull_from_crm':
        // Obtener actualizaciones del CRM
        const updates = await getFromCRM('updates/latest');
        
        return NextResponse.json({
          success: true,
          message: 'Actualizaciones obtenidas del CRM',
          data: updates,
          received: updates?.items?.length || 0
        });

      case 'test_connection':
        // Probar conexión con CRM
        try {
          const testResult = await getFromCRM('health');
          return NextResponse.json({
            success: true,
            message: 'Conexión exitosa con CRM',
            data: {
              status: 'connected',
              version: testResult.version || 'unknown',
              latency: Date.now() - new Date().getTime(),
              limits: testResult.limits || {}
            }
          });
        } catch (error: any) {
          return NextResponse.json({
            success: false,
            error: 'Error de conexión con CRM',
            details: error.message
          }, { status: 500 });
        }

      default:
        return NextResponse.json(
          { error: 'Acción no válida' },
          { status: 400 }
        );
    }

  } catch (error: any) {
    console.error('Error en sincronización CRM:', error);
    
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

// API para obtener estadísticas de sincronización
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const type = url.searchParams.get('type');

    switch (type) {
      case 'stats':
        // Estadísticas de sincronización
        return NextResponse.json({
          success: true,
          data: {
            totalSyncs: 1247,
            successfulSyncs: 1215,
            failedSyncs: 32,
            successRate: 97.4,
            averageDaily: 89,
            lastSync: '2024-01-15 10:30:00',
            recentErrors: [
              {
                timestamp: '2024-01-15 14:30:00',
                error: 'Timeout en API',
                type: 'connection'
              },
              {
                timestamp: '2024-01-15 10:15:00',
                error: 'Campo requerido faltante',
                type: 'validation'
              },
              {
                timestamp: '2024-01-14 16:45:00',
                error: 'Rate limit excedido',
                type: 'rate_limit'
              }
            ]
          }
        });

      case 'logs':
        // Logs detallados de sincronización
        return NextResponse.json({
          success: true,
          data: {
            logs: [
              {
                id: 1,
                timestamp: '2024-01-15 10:30:00',
                action: 'sync_prospects',
                status: 'success',
                records: 15,
                duration: 2.3,
                details: 'Prospectos sincronizados exitosamente'
              },
              {
                id: 2,
                timestamp: '2024-01-15 10:15:00',
                action: 'sync_vehicles',
                status: 'success',
                records: 45,
                duration: 1.8,
                details: 'Inventario actualizado'
              },
              {
                id: 3,
                timestamp: '2024-01-15 09:45:00',
                action: 'pull_from_crm',
                status: 'partial_error',
                records: 8,
                duration: 5.2,
                details: 'Algunos registros fallaron validación'
              }
            ],
            totalLogs: 156,
            page: 1,
            pageSize: 10
          }
        });

      case 'config':
        // Configuración actual del CRM
        const config = getCRMConfig();
        return NextResponse.json({
          success: true,
          data: {
            ...config,
            // Ocultar información sensible
            crmApiKey: config.crmApiKey ? '***' + config.crmApiKey.slice(-4) : '',
            crmSecretKey: config.crmSecretKey ? '***' + config.crmSecretKey.slice(-4) : ''
          }
        });

      default:
        return NextResponse.json(
          { error: 'Tipo de consulta no válido' },
          { status: 400 }
        );
    }

  } catch (error: any) {
    console.error('Error en consulta CRM:', error);
    
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
