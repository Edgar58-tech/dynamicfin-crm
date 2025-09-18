
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Settings,
  RefreshCw,
  CheckCircle,
  Plus,
  Database,
  Globe,
  ArrowLeftRight,
  Info,
  BarChart3,
  AlertTriangle,
  Target,
  UserPlus,
  User,
  Zap
} from 'lucide-react';
import FieldMappingEditor from './field-mapping-editor';
import SyncLogsViewer from './sync-logs-viewer';

interface CrmConfig {
  id: number;
  nombre: string;
  crmTipo: 'salesforce' | 'hubspot' | 'pipedrive' | 'zoho' | 'dynamics' | 'custom';
  activo: boolean;
  ultimaSincronizacion?: string;
  frecuenciaSincronizacion: number;
  estadoConexion: 'conectado' | 'desconectado' | 'error';
  registrosSincronizados: {
    prospectos: number;
    vehiculos: number;
    ventas: number;
    contactos: number;
  };
  webhooks: number;
}

export default function CrmIntegrationPanel() {
  const [configuraciones, setConfiguraciones] = useState<CrmConfig[]>([]);
  const [metricas, setMetricas] = useState({
    totalSyncs: 1247,
    tasaExito: 97.4,
    tiempoPromedio: 2.3,
    errores: 32,
    webhooksRecibidos: 247,
    alertasActivas: 2
  });
  const [loading, setLoading] = useState(true);
  const [showMappingEditor, setShowMappingEditor] = useState(false);
  const [showLogsViewer, setShowLogsViewer] = useState(false);
  const [selectedCrmForMapping, setSelectedCrmForMapping] = useState<CrmConfig | null>(null);

  useEffect(() => {
    // Simular carga de configuraciones CRM
    setTimeout(() => {
      setConfiguraciones([
        {
          id: 1,
          nombre: 'Salesforce Principal',
          crmTipo: 'salesforce',
          activo: true,
          ultimaSincronizacion: 'Hace 5 min',
          frecuenciaSincronizacion: 15,
          estadoConexion: 'conectado',
          registrosSincronizados: {
            prospectos: 89,
            vehiculos: 12,
            ventas: 15,
            contactos: 45
          },
          webhooks: 5
        },
        {
          id: 2,
          nombre: 'HubSpot Marketing',
          crmTipo: 'hubspot',
          activo: true,
          ultimaSincronizacion: 'Hace 12 min',
          frecuenciaSincronizacion: 30,
          estadoConexion: 'conectado',
          registrosSincronizados: {
            prospectos: 45,
            vehiculos: 0,
            ventas: 8,
            contactos: 67
          },
          webhooks: 3
        },
        {
          id: 3,
          nombre: 'Pipedrive Ventas',
          crmTipo: 'pipedrive',
          activo: false,
          ultimaSincronizacion: undefined,
          frecuenciaSincronizacion: 60,
          estadoConexion: 'desconectado',
          registrosSincronizados: {
            prospectos: 0,
            vehiculos: 0,
            ventas: 0,
            contactos: 0
          },
          webhooks: 0
        }
      ]);
      setLoading(false);
    }, 500);
  }, []);

  const getCrmIcon = (tipo: string) => {
    switch (tipo) {
      case 'salesforce': return <Database className="w-5 h-5 text-blue-600" />;
      case 'hubspot': return <Globe className="w-5 h-5 text-orange-600" />;
      case 'pipedrive': return <Target className="w-5 h-5 text-purple-600" />;
      case 'zoho': return <User className="w-5 h-5 text-red-600" />;
      case 'dynamics': return <Settings className="w-5 h-5 text-green-600" />;
      default: return <Database className="w-5 h-5 text-slate-600" />;
    }
  };

  const getCrmColor = (tipo: string) => {
    switch (tipo) {
      case 'salesforce': return 'blue';
      case 'hubspot': return 'orange';
      case 'pipedrive': return 'purple';
      case 'zoho': return 'red';
      case 'dynamics': return 'green';
      default: return 'slate';
    }
  };

  const handleSyncAll = () => {
    alert(`🔄 SINCRONIZACIÓN COMPLETA INICIADA\n\n⏳ PROCESANDO:\n• Salesforce: 45 prospectos → CRM\n• HubSpot: 23 contactos ← CRM\n• Pipedrive: Inactivo (omitido)\n\n📊 PROGRESO EN TIEMPO REAL:\n• Prospectos: 67/70 procesados\n• Vehículos: 89/95 actualizados\n• Ventas: 12/15 sincronizadas\n\n⚡ ESTIMADO: 3-4 minutos\n📧 Notificación por email al completar`);
  };

  const handleTestConnections = () => {
    alert(`🧪 PRUEBA DE CONEXIONES\n\n🔍 VERIFICANDO TODAS LAS CONFIGURACIONES:\n\n✅ Salesforce Principal:\n• Estado: Conectado\n• Latencia: 145ms\n• API Límites: 4,234/10,000 calls\n• Última sync: Hace 5 min\n\n✅ HubSpot Marketing:\n• Estado: Conectado\n• Latencia: 89ms\n• API Límites: 876/1,000 calls/día\n• Última sync: Hace 12 min\n\n❌ Pipedrive Ventas:\n• Estado: Inactivo\n• Error: API Key no configurada\n• Acción requerida: Completar configuración\n\n📊 RESULTADO: 2/3 conexiones activas`);
  };

  const handleNewConfig = () => {
    alert(`➕ AGREGAR NUEVA CONFIGURACIÓN CRM\n\n🔧 PROCESO:\n• Selecciona tipo de CRM (Salesforce, HubSpot, Pipedrive, etc.)\n• Configura credenciales de conexión\n• Define mapeo de campos automático\n• Establece webhooks bidireccionales\n• Prueba conexión y sincronización\n\n📋 TIPOS SOPORTADOS:\n• Salesforce - API v58.0\n• HubSpot - API v3\n• Pipedrive - API v1\n• Zoho CRM - API v2\n• Microsoft Dynamics - API 9.0\n• API Personalizada\n\n✨ Configuración guiada paso a paso`);
  };

  const handleConfigureCrm = (config: CrmConfig) => {
    setSelectedCrmForMapping(config);
    setShowMappingEditor(true);
  };

  const handleViewLogs = () => {
    setShowLogsViewer(true);
  };

  const handleViewMetrics = () => {
    alert(`📈 DASHBOARD DE MÉTRICAS\n\n📊 MÉTRICAS DISPONIBLES:\n• Rendimiento por CRM\n• Evolución temporal de syncs\n• Distribución de errores\n• Uso de API limits\n• Latencia promedio por endpoint\n\n🎯 ALERTAS CONFIGURADAS:\n• Rate limit próximo al 80%\n• Tasa de error > 5%\n• Latencia > 10 segundos\n• Fallos consecutivos > 3\n\n⚡ DATOS EN TIEMPO REAL:\n• Salesforce: 234ms latencia\n• HubSpot: 145ms latencia\n• API calls hoy: 2,847/10,000\n\n📈 Abriendo dashboard de métricas...`);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-32 bg-slate-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Renderizar componentes modales
  if (showMappingEditor && selectedCrmForMapping) {
    return (
      <FieldMappingEditor 
        crmConfig={selectedCrmForMapping}
        onClose={() => {
          setShowMappingEditor(false);
          setSelectedCrmForMapping(null);
        }}
      />
    );
  }

  if (showLogsViewer) {
    return (
      <SyncLogsViewer 
        onClose={() => setShowLogsViewer(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header de Sistema CRM */}
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-blue-600" />
            Sistema CRM Externo
          </CardTitle>
          <CardDescription>
            Integración bidireccional con Salesforce, HubSpot, Pipedrive y más
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Estado Global CRM */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 bg-white rounded-lg border border-green-200">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                <div>
                  <p className="font-semibold text-green-800">
                    {configuraciones.filter(c => c.activo).length} CRMs Activos
                  </p>
                  <p className="text-xs text-green-600">
                    {configuraciones.filter(c => c.activo).map(c => c.crmTipo).join(', ')}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-4 bg-white rounded-lg border border-blue-200">
              <div className="flex items-center gap-3">
                <RefreshCw className="w-4 h-4 text-blue-600" />
                <div>
                  <p className="font-semibold text-blue-800">Última Sync</p>
                  <p className="text-xs text-blue-600">Hace 5 min - Exitosa</p>
                </div>
              </div>
            </div>
            <div className="p-4 bg-white rounded-lg border border-amber-200">
              <div className="flex items-center gap-3">
                <Database className="w-4 h-4 text-amber-600" />
                <div>
                  <p className="font-semibold text-amber-800">147 Registros</p>
                  <p className="text-xs text-amber-600">Sincronizados hoy</p>
                </div>
              </div>
            </div>
          </div>

          {/* Gestión de Configuraciones CRM */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Configuraciones CRM</h3>
              <p className="text-sm text-slate-600">Administra múltiples integraciones CRM</p>
            </div>
            <Button 
              onClick={handleNewConfig}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nueva Configuración
            </Button>
          </div>

          {/* Lista de Configuraciones CRM */}
          <div className="space-y-3">
            {configuraciones.map((config) => (
              <Card 
                key={config.id} 
                className={`border-${getCrmColor(config.crmTipo)}-200 ${!config.activo ? 'opacity-60' : ''}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 bg-${getCrmColor(config.crmTipo)}-100 rounded-lg flex items-center justify-center`}>
                        {getCrmIcon(config.crmTipo)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{config.nombre}</h4>
                          <Badge 
                            className={config.activo 
                              ? "bg-green-100 text-green-800 border-green-200" 
                              : "bg-slate-100 text-slate-600 border-slate-200"
                            }
                          >
                            {config.activo ? 'Activo' : 'Inactivo'}
                          </Badge>
                          {config.estadoConexion === 'conectado' && (
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          )}
                        </div>
                        <p className="text-sm text-slate-600">
                          {config.crmTipo} • {config.activo 
                            ? `Sync cada ${config.frecuenciaSincronizacion} min` 
                            : 'Configuración pendiente'
                          }
                        </p>
                        {config.ultimaSincronizacion && (
                          <p className="text-xs text-slate-500">
                            Última sincronización: {config.ultimaSincronizacion}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleConfigureCrm(config)}
                      >
                        <Settings className="w-4 h-4 mr-1" />
                        Configurar
                      </Button>
                      <Switch checked={config.activo} />
                    </div>
                  </div>
                  
                  {config.activo && (
                    <div className="mt-3 grid grid-cols-5 gap-4 text-xs">
                      <div className="text-center p-2 bg-slate-50 rounded">
                        <p className="font-medium">Prospectos</p>
                        <p className="text-slate-600">{config.registrosSincronizados.prospectos} campos</p>
                      </div>
                      <div className="text-center p-2 bg-slate-50 rounded">
                        <p className="font-medium">Vehículos</p>
                        <p className="text-slate-600">{config.registrosSincronizados.vehiculos} campos</p>
                      </div>
                      <div className="text-center p-2 bg-slate-50 rounded">
                        <p className="font-medium">Ventas</p>
                        <p className="text-slate-600">{config.registrosSincronizados.ventas} campos</p>
                      </div>
                      <div className="text-center p-2 bg-slate-50 rounded">
                        <p className="font-medium">Contactos</p>
                        <p className="text-slate-600">{config.registrosSincronizados.contactos} campos</p>
                      </div>
                      <div className="text-center p-2 bg-slate-50 rounded">
                        <p className="font-medium">Webhooks</p>
                        <p className="text-slate-600">{config.webhooks} eventos</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Panel de Control de Sincronización */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5" />
              Control de Sincronización
            </CardTitle>
            <CardDescription>
              Gestiona la sincronización de datos con CRMs externos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Button 
                variant="outline" 
                className="h-16 flex-col gap-1"
                onClick={handleSyncAll}
              >
                <RefreshCw className="w-5 h-5" />
                <span className="text-xs">Sincronizar Todo</span>
              </Button>

              <Button 
                variant="outline" 
                className="h-16 flex-col gap-1"
                onClick={handleTestConnections}
              >
                <CheckCircle className="w-5 h-5" />
                <span className="text-xs">Probar Conexiones</span>
              </Button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium">Auto-Sincronización</p>
                  <p className="text-xs text-slate-600">Sincronizar automáticamente</p>
                </div>
                <Switch checked={true} />
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Frecuencia Global (minutos)</Label>
                <Input 
                  type="number" 
                  defaultValue={15} 
                  min={5} 
                  max={1440} 
                  className="h-8"
                />
                <p className="text-xs text-slate-500">Mínimo 5 min, máximo 24 horas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Sistema de Webhooks
            </CardTitle>
            <CardDescription>
              Notificaciones en tiempo real desde CRMs externos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-2xl font-bold text-green-600">{metricas.webhooksRecibidos}</p>
                <p className="text-xs text-green-700">Webhooks recibidos</p>
                <p className="text-xs text-slate-500">Últimas 24h</p>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-2xl font-bold text-blue-600">{metricas.tasaExito}%</p>
                <p className="text-xs text-blue-700">Tasa de éxito</p>
                <p className="text-xs text-slate-500">Última semana</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">URL Base para Webhooks</Label>
              <div className="flex gap-2">
                <Input 
                  value="https://dynamicfin.mx/api/crm/webhook-receive"
                  readOnly
                  className="h-8 text-xs bg-slate-50"
                />
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText('https://dynamicfin.mx/api/crm/webhook-receive');
                    alert('🔗 URL copiada al portapapeles');
                  }}
                >
                  Copiar
                </Button>
              </div>
            </div>

            <Button variant="outline" className="w-full">
              <Settings className="w-4 h-4 mr-2" />
              Configurar Webhooks
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Monitoreo y Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Monitoreo y Logs de Sincronización
          </CardTitle>
          <CardDescription>
            Supervisa el rendimiento y diagnostica problemas de integración
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-2xl font-bold text-green-600">{metricas.totalSyncs.toLocaleString()}</p>
              <p className="text-sm text-green-700">Total Syncs</p>
              <p className="text-xs text-slate-500">Últimos 30 días</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-2xl font-bold text-blue-600">{metricas.tasaExito}%</p>
              <p className="text-sm text-blue-700">Tasa Éxito</p>
              <p className="text-xs text-slate-500">Promedio mensual</p>
            </div>
            <div className="text-center p-4 bg-amber-50 rounded-lg border border-amber-200">
              <p className="text-2xl font-bold text-amber-600">{metricas.tiempoPromedio}s</p>
              <p className="text-sm text-amber-700">Tiempo Prom.</p>
              <p className="text-xs text-slate-500">Por sincronización</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
              <p className="text-2xl font-bold text-red-600">{metricas.errores}</p>
              <p className="text-sm text-red-700">Errores</p>
              <p className="text-xs text-slate-500">Últimos 30 días</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Button 
              variant="outline" 
              className="h-16 flex-col gap-2"
              onClick={handleViewLogs}
            >
              <Info className="w-5 h-5" />
              <span className="text-sm">Ver Logs Detallados</span>
            </Button>

            <Button 
              variant="outline" 
              className="h-16 flex-col gap-2"
              onClick={handleViewMetrics}
            >
              <BarChart3 className="w-5 h-5" />
              <span className="text-sm">Dashboard Métricas</span>
            </Button>
          </div>

          {/* Alertas Activas */}
          {metricas.alertasActivas > 0 && (
            <div className="mt-6 space-y-2">
              <h4 className="font-semibold text-sm">Alertas Activas</h4>
              <div className="space-y-2">
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span className="text-sm font-medium text-amber-800">Salesforce API Limit</span>
                  </div>
                  <p className="text-xs text-amber-700 mt-1">
                    Utilizando 78% del límite diario (7,800/10,000 calls). Resetea en 6 horas.
                  </p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">HubSpot Webhook Configurado</span>
                  </div>
                  <p className="text-xs text-blue-700 mt-1">
                    Nuevo webhook configurado exitosamente para evento 'contact.updated'.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
