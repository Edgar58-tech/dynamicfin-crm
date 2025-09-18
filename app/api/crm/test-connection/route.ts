
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

// POST - Probar conexión con CRM
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
    const { configId, testConfig } = data;

    let config;
    
    if (configId) {
      // Probar conexión con configuración existente
      config = await prisma.crmConfiguration.findFirst({
        where: {
          id: configId,
          agenciaId: session.user.agenciaId as number
        }
      });

      if (!config) {
        return NextResponse.json(
          { error: 'Configuración CRM no encontrada' },
          { status: 404 }
        );
      }
    } else if (testConfig) {
      // Probar conexión con configuración temporal
      config = testConfig;
    } else {
      return NextResponse.json(
        { error: 'Se requiere configId o testConfig' },
        { status: 400 }
      );
    }

    // Realizar prueba de conexión según el tipo de CRM
    const testResult = await testCrmConnection(config);

    // Si es una configuración existente, registrar el test en logs
    if (configId) {
      await prisma.crmSyncLog.create({
        data: {
          crmConfigurationId: configId,
          tipoOperacion: 'test_connection',
          entidad: 'configuracion',
          accion: 'test',
          estadoSync: testResult.success ? 'exitoso' : 'error',
          registrosProcesados: 1,
          registrosExitosos: testResult.success ? 1 : 0,
          registrosFallidos: testResult.success ? 0 : 1,
          tiempoEjecucion: testResult.responseTime,
          detalleOperacion: JSON.stringify({
            mensaje: testResult.message,
            usuario: session.user.email,
            tiempoRespuesta: testResult.responseTime,
            datosConexion: testResult.connectionData
          }),
          errores: testResult.success ? null : JSON.stringify({
            error: testResult.error,
            detalles: testResult.details
          }),
          respuestaCrm: testResult.response ? JSON.stringify(testResult.response) : null,
          codigoRespuesta: testResult.statusCode || null,
          usuarioId: session.user.id
        }
      });
    }

    return NextResponse.json({
      success: testResult.success,
      message: testResult.message,
      data: {
        status: testResult.success ? 'connected' : 'failed',
        crmTipo: config.crmTipo,
        version: testResult.version,
        responseTime: testResult.responseTime,
        limits: testResult.limits,
        connectionData: testResult.connectionData,
        error: testResult.error,
        details: testResult.details
      }
    });

  } catch (error: any) {
    console.error('Error en POST /api/crm/test-connection:', error);
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

// Función para probar conexión específica por tipo de CRM
async function testCrmConnection(config: any): Promise<any> {
  const startTime = Date.now();
  
  try {
    switch (config.crmTipo) {
      case 'salesforce':
        return await testSalesforceConnection(config);
      
      case 'hubspot':
        return await testHubSpotConnection(config);
      
      case 'pipedrive':
        return await testPipedriveConnection(config);
      
      case 'zoho':
        return await testZohoConnection(config);
      
      case 'dynamics':
        return await testDynamicsConnection(config);
      
      case 'custom':
        return await testCustomCrmConnection(config);
      
      default:
        return {
          success: false,
          message: `Tipo de CRM no soportado: ${config.crmTipo}`,
          error: 'UNSUPPORTED_CRM_TYPE',
          responseTime: Date.now() - startTime
        };
    }
  } catch (error: any) {
    return {
      success: false,
      message: 'Error al probar conexión con CRM',
      error: error.message,
      responseTime: Date.now() - startTime
    };
  }
}

// Implementaciones específicas por CRM
async function testSalesforceConnection(config: any): Promise<any> {
  const startTime = Date.now();
  
  try {
    // Probar autenticación con Salesforce
    const authResponse = await fetch(`${config.crmApiUrl}oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: config.crmApiKey,
        client_secret: config.crmSecretKey
      })
    });

    if (!authResponse.ok) {
      return {
        success: false,
        message: 'Error de autenticación con Salesforce',
        error: 'AUTHENTICATION_FAILED',
        statusCode: authResponse.status,
        responseTime: Date.now() - startTime
      };
    }

    const authData = await authResponse.json();
    
    // Probar API con token obtenido
    const apiResponse = await fetch(`${config.crmApiUrl}services/data/v58.0/sobjects/`, {
      headers: {
        'Authorization': `Bearer ${authData.access_token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!apiResponse.ok) {
      return {
        success: false,
        message: 'Error al conectar con API de Salesforce',
        error: 'API_CONNECTION_FAILED',
        statusCode: apiResponse.status,
        responseTime: Date.now() - startTime
      };
    }

    const apiData = await apiResponse.json();
    
    return {
      success: true,
      message: 'Conexión exitosa con Salesforce',
      version: 'v58.0',
      responseTime: Date.now() - startTime,
      connectionData: {
        instanceUrl: authData.instance_url,
        objectsAvailable: apiData.sobjects?.length || 0
      },
      limits: {
        dailyApiRequests: 'Según plan Salesforce'
      },
      response: { authSuccess: true, apiObjects: apiData.sobjects?.length }
    };

  } catch (error: any) {
    return {
      success: false,
      message: 'Error de conexión con Salesforce',
      error: error.message,
      responseTime: Date.now() - startTime
    };
  }
}

async function testHubSpotConnection(config: any): Promise<any> {
  const startTime = Date.now();
  
  try {
    // Probar API de HubSpot
    const response = await fetch(`${config.crmApiUrl}contacts/v1/lists/all/contacts/all?count=1`, {
      headers: {
        'Authorization': `Bearer ${config.crmApiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      return {
        success: false,
        message: 'Error de conexión con HubSpot',
        error: 'CONNECTION_FAILED',
        statusCode: response.status,
        responseTime: Date.now() - startTime
      };
    }

    const data = await response.json();
    
    return {
      success: true,
      message: 'Conexión exitosa con HubSpot',
      version: 'v3',
      responseTime: Date.now() - startTime,
      connectionData: {
        portalId: data['portal-id'] || 'Unknown',
        contactsCount: data['total-count'] || 0
      },
      limits: {
        dailyApiRequests: '40,000 (Professional)'
      },
      response: { connected: true }
    };

  } catch (error: any) {
    return {
      success: false,
      message: 'Error de conexión con HubSpot',
      error: error.message,
      responseTime: Date.now() - startTime
    };
  }
}

async function testPipedriveConnection(config: any): Promise<any> {
  const startTime = Date.now();
  
  try {
    // Probar API de Pipedrive
    const response = await fetch(`${config.crmApiUrl}users?api_token=${config.crmApiKey}`, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      return {
        success: false,
        message: 'Error de conexión con Pipedrive',
        error: 'CONNECTION_FAILED',
        statusCode: response.status,
        responseTime: Date.now() - startTime
      };
    }

    const data = await response.json();
    
    return {
      success: true,
      message: 'Conexión exitosa con Pipedrive',
      version: 'v1',
      responseTime: Date.now() - startTime,
      connectionData: {
        companyDomain: data.additional_data?.company_domain || 'Unknown',
        usersCount: data.data?.length || 0
      },
      limits: {
        dailyApiRequests: 'Según plan Pipedrive'
      },
      response: { connected: true }
    };

  } catch (error: any) {
    return {
      success: false,
      message: 'Error de conexión con Pipedrive',
      error: error.message,
      responseTime: Date.now() - startTime
    };
  }
}

async function testZohoConnection(config: any): Promise<any> {
  const startTime = Date.now();
  
  try {
    // Probar API de Zoho CRM
    const response = await fetch(`${config.crmApiUrl}org`, {
      headers: {
        'Authorization': `Zoho-oauthtoken ${config.crmApiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      return {
        success: false,
        message: 'Error de conexión con Zoho CRM',
        error: 'CONNECTION_FAILED',
        statusCode: response.status,
        responseTime: Date.now() - startTime
      };
    }

    const data = await response.json();
    
    return {
      success: true,
      message: 'Conexión exitosa con Zoho CRM',
      version: 'v2',
      responseTime: Date.now() - startTime,
      connectionData: {
        orgId: data.org?.[0]?.id || 'Unknown',
        orgName: data.org?.[0]?.company_name || 'Unknown'
      },
      limits: {
        dailyApiRequests: '5,000 (Standard)'
      },
      response: { connected: true }
    };

  } catch (error: any) {
    return {
      success: false,
      message: 'Error de conexión con Zoho CRM',
      error: error.message,
      responseTime: Date.now() - startTime
    };
  }
}

async function testDynamicsConnection(config: any): Promise<any> {
  const startTime = Date.now();
  
  try {
    // Probar API de Microsoft Dynamics
    const response = await fetch(`${config.crmApiUrl}WhoAmI`, {
      headers: {
        'Authorization': `Bearer ${config.crmApiKey}`,
        'Content-Type': 'application/json',
        'OData-MaxVersion': '4.0',
        'OData-Version': '4.0'
      }
    });

    if (!response.ok) {
      return {
        success: false,
        message: 'Error de conexión con Microsoft Dynamics',
        error: 'CONNECTION_FAILED',
        statusCode: response.status,
        responseTime: Date.now() - startTime
      };
    }

    const data = await response.json();
    
    return {
      success: true,
      message: 'Conexión exitosa con Microsoft Dynamics',
      version: '9.0',
      responseTime: Date.now() - startTime,
      connectionData: {
        userId: data.UserId || 'Unknown',
        organizationId: data.OrganizationId || 'Unknown'
      },
      limits: {
        dailyApiRequests: 'Según licencia'
      },
      response: { connected: true }
    };

  } catch (error: any) {
    return {
      success: false,
      message: 'Error de conexión con Microsoft Dynamics',
      error: error.message,
      responseTime: Date.now() - startTime
    };
  }
}

async function testCustomCrmConnection(config: any): Promise<any> {
  const startTime = Date.now();
  
  try {
    // Probar API personalizada
    const response = await fetch(`${config.crmApiUrl}health`, {
      headers: {
        'Authorization': `Bearer ${config.crmApiKey}`,
        'Content-Type': 'application/json',
        ...(config.crmSecretKey && { 'X-API-Secret': config.crmSecretKey })
      }
    });

    if (!response.ok) {
      return {
        success: false,
        message: 'Error de conexión con API personalizada',
        error: 'CONNECTION_FAILED',
        statusCode: response.status,
        responseTime: Date.now() - startTime
      };
    }

    const data = await response.json();
    
    return {
      success: true,
      message: 'Conexión exitosa con API personalizada',
      version: data.version || 'Unknown',
      responseTime: Date.now() - startTime,
      connectionData: {
        apiName: data.name || 'Custom CRM',
        status: data.status || 'OK'
      },
      limits: {
        dailyApiRequests: data.limits?.daily || 'Unlimited'
      },
      response: data
    };

  } catch (error: any) {
    return {
      success: false,
      message: 'Error de conexión con API personalizada',
      error: error.message,
      responseTime: Date.now() - startTime
    };
  }
}
