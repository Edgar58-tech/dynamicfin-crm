
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  RefreshCw,
  Filter,
  Download,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Database,
  Globe,
  Target,
  User,
  Calendar,
  Info,
  Eye,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

interface SyncLog {
  id: string;
  timestamp: string;
  crmConfig: string;
  crmTipo: 'salesforce' | 'hubspot' | 'pipedrive' | 'zoho' | 'dynamics';
  tipoOperacion: 'sync_to_crm' | 'sync_from_crm' | 'webhook_received' | 'manual_sync';
  entidad: 'prospectos' | 'vehiculos' | 'ventas' | 'contactos';
  accion: 'create' | 'update' | 'delete' | 'bulk_sync';
  estado: 'exitoso' | 'error' | 'parcial' | 'en_proceso';
  registrosProcesados: number;
  registrosExitosos: number;
  registrosFallidos: number;
  tiempoEjecucion: number;
  usuario?: string;
  detalles?: any;
  errores?: any;
}

const SAMPLE_LOGS: SyncLog[] = [
  {
    id: '1',
    timestamp: '2024-01-15 14:30:15',
    crmConfig: 'Salesforce Principal',
    crmTipo: 'salesforce',
    tipoOperacion: 'sync_to_crm',
    entidad: 'prospectos',
    accion: 'bulk_sync',
    estado: 'exitoso',
    registrosProcesados: 45,
    registrosExitosos: 45,
    registrosFallidos: 0,
    tiempoEjecucion: 2.34,
    usuario: 'admin@dynamicfin.mx',
    detalles: {
      mensaje: 'Sincronización masiva de prospectos exitosa',
      prospectos_nuevos: 12,
      prospectos_actualizados: 33,
      clasificaciones_actualizadas: 45
    }
  },
  {
    id: '2',
    timestamp: '2024-01-15 14:15:42',
    crmConfig: 'HubSpot Marketing',
    crmTipo: 'hubspot',
    tipoOperacion: 'webhook_received',
    entidad: 'contactos',
    accion: 'update',
    estado: 'exitoso',
    registrosProcesados: 1,
    registrosExitosos: 1,
    registrosFallidos: 0,
    tiempoEjecucion: 0.89,
    detalles: {
      webhook_evento: 'contact.updated',
      contacto_id: 'hub_12345',
      campos_actualizados: ['email', 'phone', 'company']
    }
  },
  {
    id: '3',
    timestamp: '2024-01-15 14:00:08',
    crmConfig: 'Salesforce Principal',
    crmTipo: 'salesforce',
    tipoOperacion: 'manual_sync',
    entidad: 'ventas',
    accion: 'create',
    estado: 'error',
    registrosProcesados: 8,
    registrosExitosos: 5,
    registrosFallidos: 3,
    tiempoEjecucion: 1.67,
    usuario: 'gerente@dynamicfin.mx',
    errores: {
      error_principal: 'Validation failed',
      detalles: [
        'Campo requerido "CloseDate" faltante en registro ID 456',
        'Campo "Amount" debe ser mayor a 0 en registro ID 789',
        'Campo "OwnerId" no válido en registro ID 012'
      ]
    }
  },
  {
    id: '4',
    timestamp: '2024-01-15 13:45:23',
    crmConfig: 'Pipedrive Ventas',
    crmTipo: 'pipedrive',
    tipoOperacion: 'sync_from_crm',
    entidad: 'prospectos',
    accion: 'update',
    estado: 'parcial',
    registrosProcesados: 23,
    registrosExitosos: 19,
    registrosFallidos: 4,
    tiempoEjecucion: 3.12,
    detalles: {
      mensaje: 'Sincronización parcial completada',
      warnings: ['4 prospectos no pudieron actualizarse por duplicidad de email']
    },
    errores: {
      duplicados_email: ['juan@email.com', 'maria@email.com', 'carlos@email.com', 'ana@email.com']
    }
  },
  {
    id: '5',
    timestamp: '2024-01-15 13:30:45',
    crmConfig: 'HubSpot Marketing',
    crmTipo: 'hubspot',
    tipoOperacion: 'sync_to_crm',
    entidad: 'vehiculos',
    accion: 'bulk_sync',
    estado: 'exitoso',
    registrosProcesados: 67,
    registrosExitosos: 67,
    registrosFallidos: 0,
    tiempoEjecucion: 4.56,
    usuario: 'inventario@dynamicfin.mx',
    detalles: {
      mensaje: 'Inventario de vehículos sincronizado',
      vehiculos_nuevos: 15,
      vehiculos_actualizados: 52,
      precios_actualizados: 67
    }
  }
];

export default function SyncLogsViewer({ onClose }: { onClose: () => void }) {
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  
  // Filtros
  const [filters, setFilters] = useState({
    crm: 'all',
    tipo: 'all',
    entidad: 'all',
    estado: 'all',
    fechaDesde: '',
    fechaHasta: '',
    busqueda: ''
  });

  useEffect(() => {
    // Simular carga de logs
    setTimeout(() => {
      setLogs(SAMPLE_LOGS);
      setFilteredLogs(SAMPLE_LOGS);
      setLoading(false);
    }, 800);
  }, []);

  useEffect(() => {
    // Aplicar filtros
    let filtered = logs;

    if (filters.crm !== 'all') {
      filtered = filtered.filter(log => log.crmTipo === filters.crm);
    }
    
    if (filters.tipo !== 'all') {
      filtered = filtered.filter(log => log.tipoOperacion === filters.tipo);
    }
    
    if (filters.entidad !== 'all') {
      filtered = filtered.filter(log => log.entidad === filters.entidad);
    }
    
    if (filters.estado !== 'all') {
      filtered = filtered.filter(log => log.estado === filters.estado);
    }

    if (filters.busqueda) {
      const searchTerm = filters.busqueda.toLowerCase();
      filtered = filtered.filter(log => 
        log.crmConfig.toLowerCase().includes(searchTerm) ||
        log.entidad.toLowerCase().includes(searchTerm) ||
        log.usuario?.toLowerCase().includes(searchTerm)
      );
    }

    setFilteredLogs(filtered);
  }, [filters, logs]);

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'exitoso': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-600" />;
      case 'parcial': return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      case 'en_proceso': return <Clock className="w-4 h-4 text-blue-600" />;
      default: return <Info className="w-4 h-4 text-slate-600" />;
    }
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'exitoso': return <Badge className="bg-green-100 text-green-800">Exitoso</Badge>;
      case 'error': return <Badge className="bg-red-100 text-red-800">Error</Badge>;
      case 'parcial': return <Badge className="bg-amber-100 text-amber-800">Parcial</Badge>;
      case 'en_proceso': return <Badge className="bg-blue-100 text-blue-800">En Proceso</Badge>;
      default: return <Badge variant="secondary">{estado}</Badge>;
    }
  };

  const getEntidadIcon = (entidad: string) => {
    switch (entidad) {
      case 'prospectos': return <User className="w-4 h-4" />;
      case 'vehiculos': return <Database className="w-4 h-4" />;
      case 'ventas': return <Target className="w-4 h-4" />;
      case 'contactos': return <Globe className="w-4 h-4" />;
      default: return <Database className="w-4 h-4" />;
    }
  };

  const getCrmColor = (crmTipo: string) => {
    switch (crmTipo) {
      case 'salesforce': return 'blue';
      case 'hubspot': return 'orange';
      case 'pipedrive': return 'purple';
      case 'zoho': return 'red';
      case 'dynamics': return 'green';
      default: return 'slate';
    }
  };

  const clearFilters = () => {
    setFilters({
      crm: 'all',
      tipo: 'all',
      entidad: 'all',
      estado: 'all',
      fechaDesde: '',
      fechaHasta: '',
      busqueda: ''
    });
  };

  const exportLogs = () => {
    alert(`📊 EXPORTAR LOGS\n\n📁 FORMATOS DISPONIBLES:\n• CSV - Para análisis en Excel\n• JSON - Para integración con sistemas\n• PDF - Para reportes ejecutivos\n\n🔍 DATOS INCLUIDOS:\n• ${filteredLogs.length} registros seleccionados\n• Filtros aplicados actualmente\n• Detalles completos de cada sync\n• Errores y excepciones\n\n⬇️ Iniciando descarga...`);
  };

  if (loading) {
    return (
      <Card className="h-96">
        <CardContent className="p-6 flex items-center justify-center">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span>Cargando logs de sincronización...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-600" />
                Logs de Sincronización CRM
              </CardTitle>
              <CardDescription>
                Historial detallado de todas las operaciones de sincronización
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={exportLogs}>
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
              <Button variant="outline" onClick={onClose}>
                Cerrar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Estadísticas rápidas */}
          <div className="grid md:grid-cols-5 gap-4">
            <div className="text-center p-3 bg-white rounded-lg border">
              <p className="text-2xl font-bold text-slate-700">{filteredLogs.length}</p>
              <p className="text-xs text-slate-600">Total Logs</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
              <p className="text-2xl font-bold text-green-600">
                {filteredLogs.filter(l => l.estado === 'exitoso').length}
              </p>
              <p className="text-xs text-green-700">Exitosos</p>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
              <p className="text-2xl font-bold text-red-600">
                {filteredLogs.filter(l => l.estado === 'error').length}
              </p>
              <p className="text-xs text-red-700">Errores</p>
            </div>
            <div className="text-center p-3 bg-amber-50 rounded-lg border border-amber-200">
              <p className="text-2xl font-bold text-amber-600">
                {filteredLogs.filter(l => l.estado === 'parcial').length}
              </p>
              <p className="text-xs text-amber-700">Parciales</p>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-2xl font-bold text-blue-600">
                {filteredLogs.reduce((sum, l) => sum + l.registrosProcesados, 0)}
              </p>
              <p className="text-xs text-blue-700">Reg. Procesados</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtros de Búsqueda
            </CardTitle>
            <Button variant="outline" onClick={clearFilters} size="sm">
              Limpiar Filtros
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4 mb-4">
            <div>
              <Label className="text-sm">Tipo de CRM</Label>
              <Select value={filters.crm} onValueChange={(value) => setFilters({...filters, crm: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los CRMs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los CRMs</SelectItem>
                  <SelectItem value="salesforce">Salesforce</SelectItem>
                  <SelectItem value="hubspot">HubSpot</SelectItem>
                  <SelectItem value="pipedrive">Pipedrive</SelectItem>
                  <SelectItem value="zoho">Zoho</SelectItem>
                  <SelectItem value="dynamics">Dynamics</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm">Tipo de Operación</Label>
              <Select value={filters.tipo} onValueChange={(value) => setFilters({...filters, tipo: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas las operaciones" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las operaciones</SelectItem>
                  <SelectItem value="sync_to_crm">Sync → CRM</SelectItem>
                  <SelectItem value="sync_from_crm">Sync ← CRM</SelectItem>
                  <SelectItem value="webhook_received">Webhook recibido</SelectItem>
                  <SelectItem value="manual_sync">Sync manual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm">Entidad</Label>
              <Select value={filters.entidad} onValueChange={(value) => setFilters({...filters, entidad: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas las entidades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las entidades</SelectItem>
                  <SelectItem value="prospectos">Prospectos</SelectItem>
                  <SelectItem value="vehiculos">Vehículos</SelectItem>
                  <SelectItem value="ventas">Ventas</SelectItem>
                  <SelectItem value="contactos">Contactos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm">Estado</Label>
              <Select value={filters.estado} onValueChange={(value) => setFilters({...filters, estado: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="exitoso">Exitoso</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="parcial">Parcial</SelectItem>
                  <SelectItem value="en_proceso">En Proceso</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <Label className="text-sm">Búsqueda</Label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Buscar por CRM, entidad o usuario..."
                  value={filters.busqueda}
                  onChange={(e) => setFilters({...filters, busqueda: e.target.value})}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label className="text-sm">Desde</Label>
              <Input
                type="date"
                value={filters.fechaDesde}
                onChange={(e) => setFilters({...filters, fechaDesde: e.target.value})}
              />
            </div>
            <div>
              <Label className="text-sm">Hasta</Label>
              <Input
                type="date"
                value={filters.fechaHasta}
                onChange={(e) => setFilters({...filters, fechaHasta: e.target.value})}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Logs ({filteredLogs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredLogs.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <RefreshCw className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No se encontraron logs con los filtros aplicados</p>
              <Button variant="outline" onClick={clearFilters} className="mt-4">
                Limpiar filtros
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredLogs.map((log) => (
                <Card key={log.id} className={`border-${getCrmColor(log.crmTipo)}-200`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          {getEstadoIcon(log.estado)}
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold">{log.crmConfig}</h4>
                              {getEstadoBadge(log.estado)}
                              <Badge variant="outline" className={`text-${getCrmColor(log.crmTipo)}-600`}>
                                {log.crmTipo}
                              </Badge>
                            </div>
                            <p className="text-sm text-slate-600">
                              {getEntidadIcon(log.entidad)}
                              <span className="ml-1">{log.entidad} • {log.accion} • {log.tipoOperacion}</span>
                            </p>
                          </div>
                        </div>

                        <div className="text-center">
                          <p className="text-sm font-medium">{log.registrosProcesados}</p>
                          <p className="text-xs text-slate-500">Procesados</p>
                        </div>

                        <div className="text-center">
                          <p className="text-sm font-medium text-green-600">{log.registrosExitosos}</p>
                          <p className="text-xs text-slate-500">Exitosos</p>
                        </div>

                        {log.registrosFallidos > 0 && (
                          <div className="text-center">
                            <p className="text-sm font-medium text-red-600">{log.registrosFallidos}</p>
                            <p className="text-xs text-slate-500">Fallidos</p>
                          </div>
                        )}

                        <div className="text-center">
                          <p className="text-sm font-medium">{log.tiempoEjecucion}s</p>
                          <p className="text-xs text-slate-500">Duración</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <p className="text-sm font-medium">{log.timestamp}</p>
                          {log.usuario && (
                            <p className="text-xs text-slate-500">{log.usuario}</p>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                        >
                          {expandedLog === log.id ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Detalles expandidos */}
                    {expandedLog === log.id && (
                      <div className="mt-4 pt-4 border-t space-y-3">
                        {log.detalles && (
                          <div>
                            <Label className="text-sm font-medium">Detalles de la Operación</Label>
                            <div className="mt-2 p-3 bg-slate-50 rounded text-sm">
                              <pre className="whitespace-pre-wrap">
                                {JSON.stringify(log.detalles, null, 2)}
                              </pre>
                            </div>
                          </div>
                        )}

                        {log.errores && (
                          <div>
                            <Label className="text-sm font-medium text-red-600">Errores Detectados</Label>
                            <div className="mt-2 p-3 bg-red-50 rounded border border-red-200 text-sm">
                              <pre className="whitespace-pre-wrap text-red-700">
                                {JSON.stringify(log.errores, null, 2)}
                              </pre>
                            </div>
                          </div>
                        )}

                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="w-3 h-3 mr-1" />
                            Ver Completo
                          </Button>
                          <Button variant="outline" size="sm">
                            <RefreshCw className="w-3 h-3 mr-1" />
                            Reintentar
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
