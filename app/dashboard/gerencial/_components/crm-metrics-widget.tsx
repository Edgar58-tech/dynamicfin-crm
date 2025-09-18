
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Database,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  ArrowLeftRight,
  AlertTriangle,
  CheckCircle,
  Globe,
  Zap
} from 'lucide-react';

interface CrmMetrics {
  totalConfigurations: number;
  activeConfigurations: number;
  totalSyncsToday: number;
  successRate: number;
  totalRecordsSynced: number;
  webhooksReceived: number;
  errorCount: number;
  averageResponseTime: number;
  lastSyncTime: string;
  crmBreakdown: {
    salesforce: { syncs: number; records: number; status: 'active' | 'error' | 'warning' };
    hubspot: { syncs: number; records: number; status: 'active' | 'error' | 'warning' };
    pipedrive: { syncs: number; records: number; status: 'active' | 'error' | 'warning' };
  };
  alerts: {
    type: 'warning' | 'error' | 'info';
    message: string;
    crm: string;
  }[];
}

export default function CrmMetricsWidget() {
  const [metrics, setMetrics] = useState<CrmMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMetrics = async () => {
    // Simular llamada a API de métricas CRM
    setTimeout(() => {
      setMetrics({
        totalConfigurations: 3,
        activeConfigurations: 2,
        totalSyncsToday: 47,
        successRate: 97.4,
        totalRecordsSynced: 1834,
        webhooksReceived: 89,
        errorCount: 3,
        averageResponseTime: 1.8,
        lastSyncTime: 'Hace 5 min',
        crmBreakdown: {
          salesforce: { syncs: 23, records: 1245, status: 'active' },
          hubspot: { syncs: 18, records: 456, status: 'active' },
          pipedrive: { syncs: 0, records: 0, status: 'warning' }
        },
        alerts: [
          {
            type: 'warning',
            message: 'API limit al 78% - Salesforce',
            crm: 'salesforce'
          },
          {
            type: 'info',
            message: 'Nuevo webhook configurado - HubSpot',
            crm: 'hubspot'
          },
          {
            type: 'error',
            message: 'Configuración inactiva - Pipedrive',
            crm: 'pipedrive'
          }
        ]
      });
      setLoading(false);
      setRefreshing(false);
    }, 1000);
  };

  useEffect(() => {
    fetchMetrics();
    
    // Auto-refresh cada 30 segundos
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchMetrics();
  };

  const getCrmColor = (crm: string) => {
    switch (crm) {
      case 'salesforce': return 'blue';
      case 'hubspot': return 'orange';
      case 'pipedrive': return 'purple';
      default: return 'slate';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'error': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default: return <Database className="w-4 h-4 text-slate-500" />;
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'error': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'info': return <CheckCircle className="w-4 h-4 text-blue-500" />;
      default: return <AlertTriangle className="w-4 h-4 text-slate-500" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="w-5 h-5 animate-spin mr-2" />
            <span>Cargando métricas CRM...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!metrics) return null;

  return (
    <div className="space-y-6">
      {/* Header con métricas principales */}
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ArrowLeftRight className="w-5 h-5 text-blue-600" />
                Métricas CRM en Tiempo Real
              </CardTitle>
              <CardDescription>
                Integración con {metrics.activeConfigurations}/{metrics.totalConfigurations} CRMs activos
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-slate-600">{metrics.lastSyncTime}</span>
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-white rounded-lg border">
              <p className="text-2xl font-bold text-blue-600">{metrics.totalSyncsToday}</p>
              <p className="text-xs text-blue-700">Syncs Hoy</p>
              <div className="flex items-center justify-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3 text-green-500" />
                <span className="text-xs text-green-600">+12%</span>
              </div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg border">
              <p className="text-2xl font-bold text-green-600">{metrics.successRate}%</p>
              <p className="text-xs text-green-700">Tasa Éxito</p>
              <div className="flex items-center justify-center gap-1 mt-1">
                <CheckCircle className="w-3 h-3 text-green-500" />
                <span className="text-xs text-green-600">Estable</span>
              </div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg border">
              <p className="text-2xl font-bold text-purple-600">{metrics.totalRecordsSynced.toLocaleString()}</p>
              <p className="text-xs text-purple-700">Registros</p>
              <div className="flex items-center justify-center gap-1 mt-1">
                <Database className="w-3 h-3 text-purple-500" />
                <span className="text-xs text-purple-600">Total</span>
              </div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg border">
              <p className="text-2xl font-bold text-amber-600">{metrics.averageResponseTime}s</p>
              <p className="text-xs text-amber-700">Latencia</p>
              <div className="flex items-center justify-center gap-1 mt-1">
                <Zap className="w-3 h-3 text-amber-500" />
                <span className="text-xs text-amber-600">Promedio</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Desglose por CRM */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Estado por CRM
            </CardTitle>
            <CardDescription>
              Rendimiento individual de cada integración
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(metrics.crmBreakdown).map(([crm, data]) => (
              <div key={crm} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(data.status)}
                  <div>
                    <p className="font-semibold capitalize">{crm}</p>
                    <p className="text-xs text-slate-600">
                      {data.syncs} syncs • {data.records} registros
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge 
                    className={`${
                      data.status === 'active' ? 'bg-green-100 text-green-800' :
                      data.status === 'warning' ? 'bg-amber-100 text-amber-800' :
                      'bg-red-100 text-red-800'
                    }`}
                  >
                    {data.status}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Webhooks & APIs
            </CardTitle>
            <CardDescription>
              Notificaciones y conectividad en tiempo real
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-xl font-bold text-green-600">{metrics.webhooksReceived}</p>
                <p className="text-xs text-green-700">Webhooks Recibidos</p>
                <p className="text-xs text-slate-500">Últimas 24h</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                <p className="text-xl font-bold text-red-600">{metrics.errorCount}</p>
                <p className="text-xs text-red-700">Errores</p>
                <p className="text-xs text-slate-500">Últimas 24h</p>
              </div>
            </div>

            <div className="mt-4 p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium">Estado de Conectividad</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mx-auto mb-1"></div>
                  <p>Salesforce</p>
                </div>
                <div className="text-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mx-auto mb-1"></div>
                  <p>HubSpot</p>
                </div>
                <div className="text-center">
                  <div className="w-2 h-2 bg-red-500 rounded-full mx-auto mb-1"></div>
                  <p>Pipedrive</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertas activas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Alertas Activas ({metrics.alerts.length})
          </CardTitle>
          <CardDescription>
            Notificaciones importantes del sistema CRM
          </CardDescription>
        </CardHeader>
        <CardContent>
          {metrics.alerts.length === 0 ? (
            <div className="text-center py-6 text-slate-500">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
              <p>No hay alertas activas</p>
              <p className="text-xs">Todas las integraciones CRM funcionan correctamente</p>
            </div>
          ) : (
            <div className="space-y-3">
              {metrics.alerts.map((alert, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${
                    alert.type === 'error' ? 'bg-red-50 border-red-200' :
                    alert.type === 'warning' ? 'bg-amber-50 border-amber-200' :
                    'bg-blue-50 border-blue-200'
                  }`}
                >
                  {getAlertIcon(alert.type)}
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${
                      alert.type === 'error' ? 'text-red-800' :
                      alert.type === 'warning' ? 'text-amber-800' :
                      'text-blue-800'
                    }`}>
                      {alert.message}
                    </p>
                    <p className="text-xs text-slate-500 capitalize">
                      {alert.crm} • Hace 10 min
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Resolver
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
