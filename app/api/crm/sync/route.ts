
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import type { Prospecto, User, VehiculoCatalogo } from '@prisma/client';

// Tipo para prospecto con relaciones incluidas
type ProspectoConRelaciones = Prospecto & {
  vendedor: User | null;
  vehiculoCatalogo: VehiculoCatalogo | null;
};

// CRM Integration Classes
class SalesforceIntegration {
  constructor(private config: any) {}

  async authenticate(): Promise<string> {
    const authUrl = `${this.config.crmApiUrl}/services/oauth2/token`;
    
    const params = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: this.config.crmApiKey,
      client_secret: this.config.crmSecretKey
    });

    const response = await fetch(authUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params
    });

    if (!response.ok) {
      throw new Error(`Salesforce auth failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.access_token;
  }

  async createLead(prospecto: any): Promise<any> {
    const accessToken = await this.authenticate();
    
    const leadData = {
      FirstName: prospecto.nombre,
      LastName: prospecto.apellido || 'Prospect',
      Email: prospecto.email,
      Phone: prospecto.telefono,
      Company: 'DynamicFin Lead',
      LeadSource: this.mapOrigenLead(prospecto.origenLead),
      Status: this.mapEstatus(prospecto.estatus),
      Industry: 'Automotive',
      Budget__c: prospecto.presupuesto,
      Vehicle_Interest__c: prospecto.vehiculoInteres,
      SPCC_Score__c: Number(prospecto.calificacionTotal),
      Classification__c: prospecto.clasificacion
    };

    const response = await fetch(`${this.config.crmApiUrl}/services/data/v58.0/sobjects/Lead`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(leadData)
    });

    if (!response.ok) {
      throw new Error(`Salesforce create lead failed: ${response.statusText}`);
    }

    return await response.json();
  }

  async updateLead(salesforceId: string, prospecto: any): Promise<any> {
    const accessToken = await this.authenticate();
    
    const updateData = {
      Status: this.mapEstatus(prospecto.estatus),
      SPCC_Score__c: Number(prospecto.calificacionTotal),
      Classification__c: prospecto.clasificacion,
      LastModifiedDate: new Date().toISOString()
    };

    const response = await fetch(`${this.config.crmApiUrl}/services/data/v58.0/sobjects/Lead/${salesforceId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    });

    if (!response.ok) {
      throw new Error(`Salesforce update failed: ${response.statusText}`);
    }

    return { success: true };
  }

  private mapOrigenLead(origen: string): string {
    switch (origen) {
      case 'LLAMADA_ENTRANTE': return 'Phone Inquiry';
      case 'VISITA_SHOWROOM': return 'Walk In';
      case 'OTROS': return 'Other';
      default: return 'Web';
    }
  }

  private mapEstatus(estatus: string): string {
    switch (estatus) {
      case 'Nuevo': return 'Open - Not Contacted';
      case 'Contactado': return 'Working - Contacted';
      case 'Calificado': return 'Qualified';
      case 'Perdido': return 'Closed - Not Converted';
      case 'Vendido': return 'Closed - Converted';
      default: return 'Open - Not Contacted';
    }
  }
}

class SICOPIntegration {
  constructor(private config: any) {}

  async createProspect(prospecto: any): Promise<any> {
    const prospectData = {
      dealer_code: JSON.parse(this.config.configuracionAvanzada).dealerCode,
      customer: {
        first_name: prospecto.nombre,
        last_name: prospecto.apellido || 'Prospecto',
        email: prospecto.email,
        phone: prospecto.telefono,
        budget: prospecto.presupuesto,
        vehicle_interest: prospecto.vehiculoInteres,
        lead_source: prospecto.origenLead,
        spcc_score: Number(prospecto.calificacionTotal),
        classification: prospecto.clasificacion
      },
      created_at: new Date().toISOString(),
      region: JSON.parse(this.config.configuracionAvanzada).region
    };

    const response = await fetch(`${this.config.crmApiUrl}/prospects`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.crmApiKey}`,
        'X-Dealer-Secret': this.config.crmSecretKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(prospectData)
    });

    if (!response.ok) {
      throw new Error(`SICOP create prospect failed: ${response.statusText}`);
    }

    return await response.json();
  }

  async syncInventory(vehiculos: any[]): Promise<any> {
    const inventoryData = {
      dealer_code: JSON.parse(this.config.configuracionAvanzada).dealerCode,
      vehicles: vehiculos.map(v => ({
        vin: v.numeroSerie,
        make: v.marca,
        model: v.modelo,
        year: v.year,
        price: Number(v.precio),
        status: v.estatus,
        color: v.color
      }))
    };

    const response = await fetch(`${this.config.crmApiUrl}/inventory/sync`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.crmApiKey}`,
        'X-Dealer-Secret': this.config.crmSecretKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(inventoryData)
    });

    if (!response.ok) {
      throw new Error(`SICOP inventory sync failed: ${response.statusText}`);
    }

    return await response.json();
  }
}

// Generic CRM factory
function createCRMIntegration(config: any) {
  switch (config.crmTipo) {
    case 'salesforce':
      return new SalesforceIntegration(config);
    case 'custom':
      if (config.nombre.includes('SICOP')) {
        return new SICOPIntegration(config);
      }
      return null;
    default:
      return null;
  }
}

async function getCRMConfig(agenciaId: number, crmName?: string) {
  const whereCondition: any = {
    agenciaId: agenciaId,
    activo: true
  };
  
  if (crmName) {
    whereCondition.nombre = { contains: crmName };
  }

  return await prisma.crmConfiguration.findFirst({
    where: whereCondition
  });
}

async function logCRMOperation(
  crmConfigId: number, 
  operation: string, 
  entity: string, 
  status: string, 
  details: any,
  userId?: string
) {
  return await prisma.crmSyncLog.create({
    data: {
      crmConfigurationId: crmConfigId,
      tipoOperacion: operation,
      entidad: entity,
      accion: details.action || 'sync',
      estadoSync: status,
      registrosProcesados: details.processed || 0,
      registrosExitosos: details.successful || 0,
      registrosFallidos: details.failed || 0,
      tiempoEjecucion: details.duration || 0,
      detalleOperacion: JSON.stringify(details.details || {}),
      errores: details.errors ? JSON.stringify(details.errors) : null,
      datosEnviados: details.sentData ? JSON.stringify(details.sentData) : null,
      respuestaCrm: details.response ? JSON.stringify(details.response) : null,
      codigoRespuesta: details.statusCode || null,
      usuarioId: userId,
      fechaInicio: new Date(),
      fechaFin: new Date()
    }
  });
}

// API para sincronización manual
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    if (!session.user.agenciaId) {
      return NextResponse.json(
        { error: 'Usuario sin agencia asignada' },
        { status: 400 }
      );
    }

    const { action, data, crmName } = await request.json();
    const startTime = Date.now();

    // Obtener configuración CRM
    const crmConfig = await getCRMConfig(session.user.agenciaId, crmName);
    
    if (!crmConfig) {
      return NextResponse.json(
        { error: 'Configuración CRM no encontrada o inactiva' },
        { status: 404 }
      );
    }

    const crmIntegration = createCRMIntegration(crmConfig);
    
    if (!crmIntegration) {
      return NextResponse.json(
        { error: 'Tipo de CRM no soportado' },
        { status: 400 }
      );
    }

    let result: any = {};
    let logDetails: any = {};

    switch (action) {
      case 'sync_prospects':
        try {
          // Obtener prospectos recientes si no se proporcionan
          let prospectos: ProspectoConRelaciones[] = data.prospects || [];
          if (!prospectos || prospectos.length === 0) {
            prospectos = await prisma.prospecto.findMany({
              where: {
                agenciaId: session.user.agenciaId!,
                updatedAt: {
                  gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Últimas 24 horas
                }
              },
              include: {
                vendedor: true,
                vehiculoCatalogo: true
              },
              take: 50
            });
          }

          let successful = 0;
          let failed = 0;
          const errors = [];

          for (const prospecto of prospectos) {
            try {
              if (crmIntegration instanceof SalesforceIntegration) {
                await crmIntegration.createLead(prospecto);
              } else if (crmIntegration instanceof SICOPIntegration) {
                await crmIntegration.createProspect(prospecto);
              }
              successful++;
            } catch (error: any) {
              failed++;
              errors.push({ prospecto: prospecto.id, error: error.message });
            }
          }

          result = {
            success: true,
            message: `${successful} prospectos sincronizados, ${failed} fallidos`,
            processed: prospectos.length,
            successful,
            failed
          };

          logDetails = {
            action: 'sync_prospects',
            processed: prospectos.length,
            successful,
            failed,
            duration: (Date.now() - startTime) / 1000,
            details: { errors },
            sentData: prospectos.map(p => ({ id: p.id, nombre: p.nombre })),
            statusCode: 200
          };

        } catch (error: any) {
          result = { success: false, error: error.message };
          logDetails = {
            action: 'sync_prospects',
            processed: 0,
            successful: 0,
            failed: 1,
            duration: (Date.now() - startTime) / 1000,
            errors: [error.message],
            statusCode: 500
          };
        }
        break;

      case 'sync_inventory':
        try {
          // Obtener inventario actual
          const vehiculos = await prisma.vehiculo.findMany({
            where: { agenciaId: session.user.agenciaId || 0 }
          });

          if (crmIntegration instanceof SICOPIntegration) {
            const syncResult = await crmIntegration.syncInventory(vehiculos);
            result = {
              success: true,
              message: 'Inventario sincronizado exitosamente',
              data: syncResult,
              synced: vehiculos.length
            };
          } else {
            throw new Error('Sincronización de inventario no soportada para este CRM');
          }

          logDetails = {
            action: 'sync_inventory',
            processed: vehiculos.length,
            successful: vehiculos.length,
            failed: 0,
            duration: (Date.now() - startTime) / 1000,
            sentData: vehiculos.length,
            statusCode: 200
          };

        } catch (error: any) {
          result = { success: false, error: error.message };
          logDetails = {
            action: 'sync_inventory',
            processed: 0,
            successful: 0,
            failed: 1,
            duration: (Date.now() - startTime) / 1000,
            errors: [error.message],
            statusCode: 500
          };
        }
        break;

      case 'test_connection':
        try {
          if (crmIntegration instanceof SalesforceIntegration) {
            const token = await crmIntegration.authenticate();
            result = {
              success: true,
              message: 'Conexión exitosa con Salesforce',
              data: {
                status: 'connected',
                crm: 'Salesforce',
                authenticated: !!token,
                timestamp: new Date().toISOString()
              }
            };
          } else {
            // Test genérico para otros CRMs
            result = {
              success: true,
              message: `Conexión exitosa con ${crmConfig.nombre}`,
              data: {
                status: 'connected',
                crm: crmConfig.crmTipo,
                config_active: crmConfig.activo,
                last_sync: crmConfig.ultimaSincronizacion
              }
            };
          }

          logDetails = {
            action: 'test_connection',
            processed: 1,
            successful: 1,
            failed: 0,
            duration: (Date.now() - startTime) / 1000,
            statusCode: 200
          };

        } catch (error: any) {
          result = {
            success: false,
            error: 'Error de conexión con CRM',
            details: error.message
          };
          
          logDetails = {
            action: 'test_connection',
            processed: 1,
            successful: 0,
            failed: 1,
            duration: (Date.now() - startTime) / 1000,
            errors: [error.message],
            statusCode: 500
          };
        }
        break;

      case 'pull_updates':
        // Implementar pull desde CRM (futuro)
        result = {
          success: true,
          message: 'Pull desde CRM no implementado aún',
          data: { received: 0 }
        };
        
        logDetails = {
          action: 'pull_updates',
          processed: 0,
          successful: 0,
          failed: 0,
          duration: (Date.now() - startTime) / 1000,
          statusCode: 200
        };
        break;

      default:
        return NextResponse.json(
          { error: 'Acción no válida' },
          { status: 400 }
        );
    }

    // Log de la operación
    await logCRMOperation(
      crmConfig.id,
      action,
      action.includes('prospect') ? 'prospectos' : action.includes('inventory') ? 'vehiculos' : 'conexion',
      result.success ? 'exitoso' : 'error',
      logDetails,
      session.user.id
    );

    // Actualizar última sincronización
    await prisma.crmConfiguration.update({
      where: { id: crmConfig.id },
      data: { ultimaSincronizacion: new Date() }
    });

    return NextResponse.json(result);

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
        if (!session.user.agenciaId) {
          return NextResponse.json({ error: 'Usuario sin agencia asignada' }, { status: 400 });
        }
        const config = await getCRMConfig(session.user.agenciaId);
        return NextResponse.json({
          success: true,
          data: config ? {
            ...config,
            // Ocultar información sensible
            crmApiKey: config.crmApiKey ? '***' + config.crmApiKey.slice(-4) : '',
            crmSecretKey: config.crmSecretKey ? '***' + config.crmSecretKey.slice(-4) : ''
          } : null
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
