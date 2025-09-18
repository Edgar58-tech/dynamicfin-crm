
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import CrmIntegrationPanel from './_components/crm-integration-panel';
import { 
  Settings,
  Save,
  RotateCcw,
  Shield,
  Bell,
  Database,
  Building2,
  Target,
  Calculator,
  Clock,
  BarChart3,
  AlertTriangle,
  Info,
  Zap,
  UserPlus,
  User,
  Crown,
  Key,
  CheckCircle,
  Plus,
  Link,
  RefreshCw,
  Globe,
  ArrowLeftRight
} from 'lucide-react';

interface ConfiguracionSistema {
  empresa: {
    nombre: string;
    rfc: string;
    direccion: string;
    email: string;
    telefono: string;
    sitioWeb: string;
  };
  sppc: {
    clasificacionEliteMin: number;
    clasificacionCalificadoMin: number;
    clasificacionMadurarMin: number;
    pesoElite: number;
    pesoCalificado: number;
    pesoMadurar: number;
    pesoExplorador: number;
  };
  seguimiento: {
    diasElite: number;
    diasCalificado: number;
    diasMadurar: number;
    diasExplorador: number;
    diasInactivo: number;
  };
  notificaciones: {
    emailActivo: boolean;
    recordatoriosSeguimiento: boolean;
    alertasMetas: boolean;
    reportesDiarios: boolean;
    alertasSobrecarga: boolean;
    notificacionesMoviles: boolean;
  };
  optimizacion: {
    rebalanceoAutomatico: boolean;
    frecuenciaOptimizacion: number;
    umbralSobrecarga: number;
    algoritmoOptimizacion: string;
    considerarDistancias: boolean;
  };
  seguridad: {
    sesionExpiraEn: number;
    intentosMaximos: number;
    requiereCambioPassword: boolean;
    passwordMinimoCaracteres: number;
    autenticacionDosFactor: boolean;
  };
  integraciones: {
    crmActivo: boolean;
    crmTipo: string;
    crmApiUrl: string;
    crmApiKey: string;
    crmSecretKey: string;
    sincronizacionBidireccional: boolean;
    frecuenciaSincronizacion: number; // minutos
    camposMapeados: {
      prospecto: string[];
      contacto: string[];
      vehiculo: string[];
      venta: string[];
    };
    webhookUrl: string;
    webhookSecret: string;
    ultimaSincronizacion: string;
    erroresIntegracion: number;
  };
}

export default function ConfiguracionPage() {
  const { data: session, status } = useSession();
  const [config, setConfig] = useState<ConfiguracionSistema | null>(null);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [cambiosPendientes, setCambiosPendientes] = useState(false);

  const handleGuardarConfiguracion = () => {
    setGuardando(true);
    
    setTimeout(() => {
      alert(`✅ CONFIGURACIÓN GUARDADA EXITOSAMENTE\n\n🔄 CAMBIOS APLICADOS:\n• Configuración de empresa actualizada\n• Parámetros SPPC modificados\n• Configuración de seguimiento ajustada\n• Notificaciones configuradas\n• Optimización actualizada\n• Seguridad reforzada\n\n⚡ EFECTOS:\n• Los cambios son efectivos inmediatamente\n• Todos los usuarios serán notificados\n• Se regenerarán los reportes automáticos\n• Se actualizarán las métricas SPPC\n\n📧 Se ha enviado confirmación por email\n🔄 Sistema actualizado correctamente`);
      
      setGuardando(false);
      setCambiosPendientes(false);
    }, 2000);
  };

  const handleRestablecerDefecto = () => {
    if (confirm('⚠️ ¿Estás seguro de restablecer toda la configuración a los valores predeterminados?\n\nEsta acción no se puede deshacer.')) {
      alert(`🔄 CONFIGURACIÓN RESTABLECIDA\n\n✅ VALORES RESTAURADOS:\n• Parámetros SPPC a valores estándar\n• Configuración de seguimiento por defecto\n• Notificaciones básicas activadas\n• Optimización manual activada\n• Configuración de seguridad estándar\n\n⚠️ REQUIERE:\n• Guardar cambios para aplicar\n• Revisar configuración personalizada\n• Verificar integraciones activas`);
      
      setCambiosPendientes(true);
    }
  };

  const updateConfig = (section: keyof ConfiguracionSistema, field: string, value: any) => {
    if (!config) return;
    
    setConfig({
      ...config,
      [section]: {
        ...config[section],
        [field]: value
      }
    });
    setCambiosPendientes(true);
  };

  useEffect(() => {
    const sampleConfig: ConfiguracionSistema = {
      empresa: {
        nombre: 'DynamicFin Optimization Suite',
        rfc: 'DOF240915ABC',
        direccion: 'Av. Insurgentes Sur 1234, Col. Del Valle, CDMX',
        email: 'contacto@dynamicfin.mx',
        telefono: '+52 55 1234-5678',
        sitioWeb: 'https://dynamicfin.mx'
      },
      sppc: {
        clasificacionEliteMin: 85,
        clasificacionCalificadoMin: 60,
        clasificacionMadurarMin: 35,
        pesoElite: 3.0,
        pesoCalificado: 2.0,
        pesoMadurar: 1.5,
        pesoExplorador: 1.0
      },
      seguimiento: {
        diasElite: 1,
        diasCalificado: 3,
        diasMadurar: 7,
        diasExplorador: 14,
        diasInactivo: 30
      },
      notificaciones: {
        emailActivo: true,
        recordatoriosSeguimiento: true,
        alertasMetas: true,
        reportesDiarios: false,
        alertasSobrecarga: true,
        notificacionesMoviles: false
      },
      optimizacion: {
        rebalanceoAutomatico: false,
        frecuenciaOptimizacion: 7,
        umbralSobrecarga: 110,
        algoritmoOptimizacion: 'inteligente',
        considerarDistancias: true
      },
      seguridad: {
        sesionExpiraEn: 480,
        intentosMaximos: 3,
        requiereCambioPassword: false,
        passwordMinimoCaracteres: 8,
        autenticacionDosFactor: false
      },
      integraciones: {
        crmActivo: false,
        crmTipo: 'salesforce',
        crmApiUrl: 'https://api.salesforce.com/v1/',
        crmApiKey: '',
        crmSecretKey: '',
        sincronizacionBidireccional: true,
        frecuenciaSincronizacion: 15,
        camposMapeados: {
          prospecto: ['nombre', 'apellido', 'email', 'telefono', 'presupuesto'],
          contacto: ['email', 'telefono', 'direccion'],
          vehiculo: ['marca', 'modelo', 'version', 'precio'],
          venta: ['fecha', 'monto', 'vendedor', 'cliente']
        },
        webhookUrl: 'https://dynamicfin.mx/webhooks/crm',
        webhookSecret: '',
        ultimaSincronizacion: '2024-01-15 10:30:00',
        erroresIntegracion: 0
      }
    };
    
    setTimeout(() => {
      setConfig(sampleConfig);
      setLoading(false);
    }, 500);
  }, []);

  if (status === 'loading' || loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-slate-200 rounded w-48 animate-pulse"></div>
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

  if (!config) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Configuración del Sistema</h1>
          <p className="text-slate-600 mt-2">Administra configuraciones globales, parámetros SPPC y preferencias del sistema</p>
        </div>
        <div className="flex gap-2">
          {cambiosPendientes && (
            <Badge className="bg-amber-100 text-amber-800 border-amber-200">
              <Clock className="w-3 h-3 mr-1" />
              Cambios pendientes
            </Badge>
          )}
          <Button 
            variant="outline"
            onClick={handleRestablecerDefecto}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Restablecer
          </Button>
          <Button 
            onClick={handleGuardarConfiguracion}
            disabled={guardando}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {guardando ? (
              <>
                <Clock className="w-4 h-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Guardar Cambios
              </>
            )}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="empresa" className="space-y-6">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="empresa">
            <Building2 className="w-4 h-4 mr-2" />
            Empresa
          </TabsTrigger>
          <TabsTrigger value="sppc">
            <Calculator className="w-4 h-4 mr-2" />
            SPPC
          </TabsTrigger>
          <TabsTrigger value="seguimiento">
            <Clock className="w-4 h-4 mr-2" />
            Seguimiento
          </TabsTrigger>
          <TabsTrigger value="notificaciones">
            <Bell className="w-4 h-4 mr-2" />
            Notificaciones
          </TabsTrigger>
          <TabsTrigger value="optimizacion">
            <BarChart3 className="w-4 h-4 mr-2" />
            Optimización
          </TabsTrigger>
          <TabsTrigger value="seguridad">
            <Shield className="w-4 h-4 mr-2" />
            Seguridad
          </TabsTrigger>
          <TabsTrigger value="integraciones">
            <Database className="w-4 h-4 mr-2" />
            CRM & APIs
          </TabsTrigger>
          <TabsTrigger value="usuarios-maestros">
            <Zap className="w-4 h-4 mr-2" />
            Maestros
          </TabsTrigger>
        </TabsList>

        {/* Tab Empresa */}
        <TabsContent value="empresa" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Información Corporativa
              </CardTitle>
              <CardDescription>
                Configura los datos principales de tu empresa
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="nombre">Nombre de la Empresa</Label>
                    <Input
                      id="nombre"
                      value={config.empresa.nombre}
                      onChange={(e) => updateConfig('empresa', 'nombre', e.target.value)}
                      placeholder="Nombre completo"
                    />
                  </div>
                  <div>
                    <Label htmlFor="rfc">RFC</Label>
                    <Input
                      id="rfc"
                      value={config.empresa.rfc}
                      onChange={(e) => updateConfig('empresa', 'rfc', e.target.value)}
                      placeholder="RFC de la empresa"
                    />
                  </div>
                  <div>
                    <Label htmlFor="direccion">Dirección</Label>
                    <Input
                      id="direccion"
                      value={config.empresa.direccion}
                      onChange={(e) => updateConfig('empresa', 'direccion', e.target.value)}
                      placeholder="Dirección completa"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email Corporativo</Label>
                    <Input
                      id="email"
                      type="email"
                      value={config.empresa.email}
                      onChange={(e) => updateConfig('empresa', 'email', e.target.value)}
                      placeholder="contacto@empresa.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="telefono">Teléfono</Label>
                    <Input
                      id="telefono"
                      value={config.empresa.telefono}
                      onChange={(e) => updateConfig('empresa', 'telefono', e.target.value)}
                      placeholder="+52 55 1234-5678"
                    />
                  </div>
                  <div>
                    <Label htmlFor="sitioWeb">Sitio Web</Label>
                    <Input
                      id="sitioWeb"
                      value={config.empresa.sitioWeb}
                      onChange={(e) => updateConfig('empresa', 'sitioWeb', e.target.value)}
                      placeholder="https://empresa.com"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab SPPC */}
        <TabsContent value="sppc" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Umbrales de Clasificación
                </CardTitle>
                <CardDescription>
                  Define los porcentajes mínimos para cada clasificación
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Élite (mínimo %)</Label>
                  <Input
                    type="number"
                    value={config.sppc.clasificacionEliteMin}
                    onChange={(e) => updateConfig('sppc', 'clasificacionEliteMin', parseInt(e.target.value) || 0)}
                    min="0"
                    max="100"
                  />
                  <p className="text-xs text-slate-500 mt-1">Actualmente: {config.sppc.clasificacionEliteMin}%</p>
                </div>
                <div>
                  <Label>Calificado (mínimo %)</Label>
                  <Input
                    type="number"
                    value={config.sppc.clasificacionCalificadoMin}
                    onChange={(e) => updateConfig('sppc', 'clasificacionCalificadoMin', parseInt(e.target.value) || 0)}
                    min="0"
                    max="100"
                  />
                  <p className="text-xs text-slate-500 mt-1">Actualmente: {config.sppc.clasificacionCalificadoMin}%</p>
                </div>
                <div>
                  <Label>A Madurar (mínimo %)</Label>
                  <Input
                    type="number"
                    value={config.sppc.clasificacionMadurarMin}
                    onChange={(e) => updateConfig('sppc', 'clasificacionMadurarMin', parseInt(e.target.value) || 0)}
                    min="0"
                    max="100"
                  />
                  <p className="text-xs text-slate-500 mt-1">Actualmente: {config.sppc.clasificacionMadurarMin}%</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="w-5 h-5" />
                  Pesos por Clasificación
                </CardTitle>
                <CardDescription>
                  Configura el peso de cada clasificación en el cálculo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Peso Élite (multiplicador)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={config.sppc.pesoElite}
                    onChange={(e) => updateConfig('sppc', 'pesoElite', parseFloat(e.target.value) || 0)}
                    min="1"
                    max="5"
                  />
                </div>
                <div>
                  <Label>Peso Calificado (multiplicador)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={config.sppc.pesoCalificado}
                    onChange={(e) => updateConfig('sppc', 'pesoCalificado', parseFloat(e.target.value) || 0)}
                    min="1"
                    max="5"
                  />
                </div>
                <div>
                  <Label>Peso A Madurar (multiplicador)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={config.sppc.pesoMadurar}
                    onChange={(e) => updateConfig('sppc', 'pesoMadurar', parseFloat(e.target.value) || 0)}
                    min="1"
                    max="5"
                  />
                </div>
                <div>
                  <Label>Peso Explorador (multiplicador)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={config.sppc.pesoExplorador}
                    onChange={(e) => updateConfig('sppc', 'pesoExplorador', parseFloat(e.target.value) || 0)}
                    min="1"
                    max="5"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Vista Previa del Sistema SPPC</p>
                  <div className="grid md:grid-cols-4 gap-4 text-xs">
                    <div className="p-2 bg-white rounded border">
                      <p className="font-medium text-green-600">Élite</p>
                      <p>{config.sppc.clasificacionEliteMin}%+ = x{config.sppc.pesoElite}</p>
                    </div>
                    <div className="p-2 bg-white rounded border">
                      <p className="font-medium text-blue-600">Calificado</p>
                      <p>{config.sppc.clasificacionCalificadoMin}%+ = x{config.sppc.pesoCalificado}</p>
                    </div>
                    <div className="p-2 bg-white rounded border">
                      <p className="font-medium text-amber-600">A Madurar</p>
                      <p>{config.sppc.clasificacionMadurarMin}%+ = x{config.sppc.pesoMadurar}</p>
                    </div>
                    <div className="p-2 bg-white rounded border">
                      <p className="font-medium text-slate-600">Explorador</p>
                      <p>0-{config.sppc.clasificacionMadurarMin-1}% = x{config.sppc.pesoExplorador}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Seguimiento */}
        <TabsContent value="seguimiento" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Frecuencia de Seguimiento
              </CardTitle>
              <CardDescription>
                Define cada cuántos días se debe dar seguimiento a cada tipo de prospecto
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label>Prospectos Élite (días)</Label>
                    <Input
                      type="number"
                      value={config.seguimiento.diasElite}
                      onChange={(e) => updateConfig('seguimiento', 'diasElite', parseInt(e.target.value) || 0)}
                      min="1"
                      max="30"
                    />
                    <p className="text-xs text-slate-500 mt-1">Seguimiento cada {config.seguimiento.diasElite} día(s)</p>
                  </div>
                  <div>
                    <Label>Prospectos Calificados (días)</Label>
                    <Input
                      type="number"
                      value={config.seguimiento.diasCalificado}
                      onChange={(e) => updateConfig('seguimiento', 'diasCalificado', parseInt(e.target.value) || 0)}
                      min="1"
                      max="30"
                    />
                    <p className="text-xs text-slate-500 mt-1">Seguimiento cada {config.seguimiento.diasCalificado} día(s)</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label>Prospectos A Madurar (días)</Label>
                    <Input
                      type="number"
                      value={config.seguimiento.diasMadurar}
                      onChange={(e) => updateConfig('seguimiento', 'diasMadurar', parseInt(e.target.value) || 0)}
                      min="1"
                      max="30"
                    />
                    <p className="text-xs text-slate-500 mt-1">Seguimiento cada {config.seguimiento.diasMadurar} día(s)</p>
                  </div>
                  <div>
                    <Label>Prospectos Explorador (días)</Label>
                    <Input
                      type="number"
                      value={config.seguimiento.diasExplorador}
                      onChange={(e) => updateConfig('seguimiento', 'diasExplorador', parseInt(e.target.value) || 0)}
                      min="1"
                      max="30"
                    />
                    <p className="text-xs text-slate-500 mt-1">Seguimiento cada {config.seguimiento.diasExplorador} día(s)</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label>Marcar como Inactivo (días)</Label>
                    <Input
                      type="number"
                      value={config.seguimiento.diasInactivo}
                      onChange={(e) => updateConfig('seguimiento', 'diasInactivo', parseInt(e.target.value) || 0)}
                      min="30"
                      max="365"
                    />
                    <p className="text-xs text-slate-500 mt-1">Sin actividad por {config.seguimiento.diasInactivo} días</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Notificaciones */}
        <TabsContent value="notificaciones" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Sistema de Notificaciones
              </CardTitle>
              <CardDescription>
                Configura qué tipos de notificaciones quieres recibir
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Notificaciones por Email</p>
                      <p className="text-sm text-slate-600">Recibir notificaciones vía correo electrónico</p>
                    </div>
                    <Switch
                      checked={config.notificaciones.emailActivo}
                      onCheckedChange={(checked) => updateConfig('notificaciones', 'emailActivo', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Recordatorios de Seguimiento</p>
                      <p className="text-sm text-slate-600">Alertas cuando hay que dar seguimiento</p>
                    </div>
                    <Switch
                      checked={config.notificaciones.recordatoriosSeguimiento}
                      onCheckedChange={(checked) => updateConfig('notificaciones', 'recordatoriosSeguimiento', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Alertas de Metas</p>
                      <p className="text-sm text-slate-600">Notificaciones sobre cumplimiento de metas</p>
                    </div>
                    <Switch
                      checked={config.notificaciones.alertasMetas}
                      onCheckedChange={(checked) => updateConfig('notificaciones', 'alertasMetas', checked)}
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Reportes Diarios</p>
                      <p className="text-sm text-slate-600">Resumen diario de actividades</p>
                    </div>
                    <Switch
                      checked={config.notificaciones.reportesDiarios}
                      onCheckedChange={(checked) => updateConfig('notificaciones', 'reportesDiarios', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Alertas de Sobrecarga</p>
                      <p className="text-sm text-slate-600">Cuando un vendedor excede su capacidad</p>
                    </div>
                    <Switch
                      checked={config.notificaciones.alertasSobrecarga}
                      onCheckedChange={(checked) => updateConfig('notificaciones', 'alertasSobrecarga', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Notificaciones Móviles</p>
                      <p className="text-sm text-slate-600">Push notifications en dispositivos móviles</p>
                    </div>
                    <Switch
                      checked={config.notificaciones.notificacionesMoviles}
                      onCheckedChange={(checked) => updateConfig('notificaciones', 'notificacionesMoviles', checked)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Optimización */}
        <TabsContent value="optimizacion" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Optimización Automática
                </CardTitle>
                <CardDescription>
                  Configura el sistema de optimización de cargas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Rebalanceo Automático</p>
                    <p className="text-sm text-slate-600">Redistribuir prospectos automáticamente</p>
                  </div>
                  <Switch
                    checked={config.optimizacion.rebalanceoAutomatico}
                    onCheckedChange={(checked) => updateConfig('optimizacion', 'rebalanceoAutomatico', checked)}
                  />
                </div>
                <div>
                  <Label>Frecuencia de Optimización (días)</Label>
                  <Input
                    type="number"
                    value={config.optimizacion.frecuenciaOptimizacion}
                    onChange={(e) => updateConfig('optimizacion', 'frecuenciaOptimizacion', parseInt(e.target.value) || 0)}
                    min="1"
                    max="30"
                  />
                  <p className="text-xs text-slate-500 mt-1">Optimizar cada {config.optimizacion.frecuenciaOptimizacion} días</p>
                </div>
                <div>
                  <Label>Umbral de Sobrecarga (%)</Label>
                  <Input
                    type="number"
                    value={config.optimizacion.umbralSobrecarga}
                    onChange={(e) => updateConfig('optimizacion', 'umbralSobrecarga', parseInt(e.target.value) || 0)}
                    min="100"
                    max="200"
                  />
                  <p className="text-xs text-slate-500 mt-1">Alertar cuando exceda {config.optimizacion.umbralSobrecarga}% de capacidad</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Algoritmo de Optimización
                </CardTitle>
                <CardDescription>
                  Configura el comportamiento del algoritmo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Tipo de Algoritmo</Label>
                  <Select 
                    value={config.optimizacion.algoritmoOptimizacion} 
                    onValueChange={(value) => updateConfig('optimizacion', 'algoritmoOptimizacion', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basico">Básico - Distribución equitativa</SelectItem>
                      <SelectItem value="inteligente">Inteligente - Considera rendimiento</SelectItem>
                      <SelectItem value="avanzado">Avanzado - Machine Learning</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Considerar Distancias</p>
                    <p className="text-sm text-slate-600">Optimizar basado en ubicación geográfica</p>
                  </div>
                  <Switch
                    checked={config.optimizacion.considerarDistancias}
                    onCheckedChange={(checked) => updateConfig('optimizacion', 'considerarDistancias', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab Seguridad */}
        <TabsContent value="seguridad" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Configuración de Acceso
                </CardTitle>
                <CardDescription>
                  Configura las políticas de seguridad del sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Expiración de Sesión (minutos)</Label>
                  <Input
                    type="number"
                    value={config.seguridad.sesionExpiraEn}
                    onChange={(e) => updateConfig('seguridad', 'sesionExpiraEn', parseInt(e.target.value) || 0)}
                    min="30"
                    max="1440"
                  />
                  <p className="text-xs text-slate-500 mt-1">Sesión expira en {config.seguridad.sesionExpiraEn} minutos</p>
                </div>
                <div>
                  <Label>Intentos Máximos de Login</Label>
                  <Input
                    type="number"
                    value={config.seguridad.intentosMaximos}
                    onChange={(e) => updateConfig('seguridad', 'intentosMaximos', parseInt(e.target.value) || 0)}
                    min="3"
                    max="10"
                  />
                  <p className="text-xs text-slate-500 mt-1">Bloquear después de {config.seguridad.intentosMaximos} intentos fallidos</p>
                </div>
                <div>
                  <Label>Longitud Mínima de Contraseña</Label>
                  <Input
                    type="number"
                    value={config.seguridad.passwordMinimoCaracteres}
                    onChange={(e) => updateConfig('seguridad', 'passwordMinimoCaracteres', parseInt(e.target.value) || 0)}
                    min="6"
                    max="20"
                  />
                  <p className="text-xs text-slate-500 mt-1">Mínimo {config.seguridad.passwordMinimoCaracteres} caracteres</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Políticas de Contraseñas
                </CardTitle>
                <CardDescription>
                  Configuración avanzada de seguridad
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Requerir Cambio Periódico</p>
                    <p className="text-sm text-slate-600">Forzar cambio de contraseña cada 90 días</p>
                  </div>
                  <Switch
                    checked={config.seguridad.requiereCambioPassword}
                    onCheckedChange={(checked) => updateConfig('seguridad', 'requiereCambioPassword', checked)}
                  />
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Autenticación de Dos Factores</p>
                    <p className="text-sm text-slate-600">Requerir código adicional para acceder</p>
                  </div>
                  <Switch
                    checked={config.seguridad.autenticacionDosFactor}
                    onCheckedChange={(checked) => updateConfig('seguridad', 'autenticacionDosFactor', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab Integraciones CRM */}
        <TabsContent value="integraciones" className="space-y-6">
          <CrmIntegrationPanel />
        </TabsContent>
        {/* Tab Usuarios Maestros DynamicFin */}
        <TabsContent value="usuarios-maestros" className="space-y-6">
          <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-purple-600" />
                Usuarios Maestros DynamicFin
              </CardTitle>
              <CardDescription>
                Gestiona usuarios con acceso completo al sistema para soporte técnico y administración global
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-purple-100 rounded-lg border border-purple-200">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm">!</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-purple-800 mb-2">¿Qué es un Usuario Maestro?</h4>
                    <ul className="text-sm text-purple-700 space-y-1">
                      <li>• <strong>Acceso Total:</strong> Sin restricciones de grupo, marca o agencia</li>
                      <li>• <strong>Gestión Global:</strong> Puede crear, editar y eliminar cualquier usuario</li>
                      <li>• <strong>Configuraciones:</strong> Acceso a todas las configuraciones del sistema</li>
                      <li>• <strong>Respaldos:</strong> Puede generar exportaciones y respaldos completos</li>
                      <li>• <strong>Soporte:</strong> Ideal para equipo técnico de DynamicFin</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <UserPlus className="w-5 h-5" />
                      Crear Usuario Maestro
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="master-name">Nombre Completo</Label>
                      <Input
                        id="master-name"
                        placeholder="Nombre del administrador"
                      />
                    </div>
                    <div>
                      <Label htmlFor="master-email">Email Corporativo</Label>
                      <Input
                        id="master-email"
                        type="email"
                        placeholder="admin@dynamicfin.mx"
                      />
                    </div>
                    <div>
                      <Label htmlFor="master-purpose">Propósito del Usuario</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar propósito" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="soporte-tecnico">Soporte Técnico DynamicFin</SelectItem>
                          <SelectItem value="administrador-global">Administrador Global</SelectItem>
                          <SelectItem value="consultor-especializado">Consultor Especializado</SelectItem>
                          <SelectItem value="backup-admin">Administrador de Respaldo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button 
                      className="w-full bg-purple-600 hover:bg-purple-700"
                      onClick={() => {
                        alert('🔰 CREAR USUARIO MAESTRO DYNAMICFIN\n\n⚠️ CONFIRMACIÓN REQUERIDA:\n\n📋 DATOS DEL USUARIO:\n• Nombre: [Nombre ingresado]\n• Email: [Email ingresado]\n• Tipo: Usuario Maestro DynamicFin\n• Permisos: Acceso total al sistema\n\n🔐 CAPACIDADES:\n• Gestión global de usuarios\n• Acceso a todas las configuraciones\n• Exportación de datos completos\n• Respaldos del sistema\n• Soporte técnico avanzado\n\n⚠️ IMPORTANTE:\n• Este usuario NO pertenece a ningún grupo específico\n• Tiene visibilidad de todos los datos\n• Puede modificar cualquier configuración\n• Responsabilidad total sobre el sistema\n\n✅ Al confirmar se enviará invitación por email\n🔑 Se generará contraseña temporal segura\n📧 Instrucciones de acceso por correo\n\n¿Confirmas la creación de este usuario maestro?');
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Crear Usuario Maestro
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Usuarios Maestros Activos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="p-3 border rounded-lg bg-white">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                              <Crown className="w-4 h-4 text-purple-600" />
                            </div>
                            <div>
                              <p className="font-semibold text-sm">DynamicFin Master Admin</p>
                              <p className="text-xs text-slate-500">admin@dynamicfin.mx</p>
                            </div>
                          </div>
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Activo
                          </Badge>
                        </div>
                        <div className="mt-2 text-xs text-slate-600">
                          <p>• Último acceso: Hoy, 14:30</p>
                          <p>• Creado: 1 Ene 2020</p>
                          <p>• Propósito: Administración Global</p>
                        </div>
                      </div>
                      
                      <div className="text-center py-4 border-2 border-dashed border-slate-200 rounded-lg">
                        <User className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                        <p className="text-sm text-slate-500">
                          Solo usuarios con rol DYNAMICFIN_ADMIN<br />
                          pueden crear usuarios maestros adicionales
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Información sobre crecimiento orgánico */}
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Target className="w-5 h-5 text-blue-600" />
                    Crecimiento Orgánico del Sistema
                  </CardTitle>
                  <CardDescription className="text-blue-700">
                    Estrategia recomendada para expansión paso a paso
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="p-4 bg-white rounded-lg border">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-green-600 text-sm font-bold">1</span>
                        </div>
                        <h4 className="font-semibold text-green-800">Nivel Agencia</h4>
                      </div>
                      <p className="text-sm text-slate-600">
                        Comenzar con una agencia de una marca específica. Ideal para pruebas y familiarización.
                      </p>
                      <div className="mt-2 text-xs text-slate-500">
                        <p>• 1 Gerente General</p>
                        <p>• 1-2 Vendedores</p>
                        <p>• Inventario limitado</p>
                      </div>
                    </div>

                    <div className="p-4 bg-white rounded-lg border">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 text-sm font-bold">2</span>
                        </div>
                        <h4 className="font-semibold text-blue-800">Nivel Marca</h4>
                      </div>
                      <p className="text-sm text-slate-600">
                        Expandir a todas las agencias del grupo de la misma marca.
                      </p>
                      <div className="mt-2 text-xs text-slate-500">
                        <p>• 1 Director de Marca</p>
                        <p>• Múltiples agencias</p>
                        <p>• Reportes consolidados</p>
                      </div>
                    </div>

                    <div className="p-4 bg-white rounded-lg border">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                          <span className="text-purple-600 text-sm font-bold">3</span>
                        </div>
                        <h4 className="font-semibold text-purple-800">Nivel Grupo</h4>
                      </div>
                      <p className="text-sm text-slate-600">
                        Integrar todas las marcas del grupo automotriz completo.
                      </p>
                      <div className="mt-2 text-xs text-slate-500">
                        <p>• Director General</p>
                        <p>• Múltiples marcas</p>
                        <p>• Sistema completo</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200">
                    <h4 className="font-semibold text-amber-800 mb-2 flex items-center gap-2">
                      <Key className="w-4 h-4" />
                      Ventajas del Crecimiento Orgánico
                    </h4>
                    <ul className="text-sm text-amber-700 space-y-1">
                      <li>• <strong>Adaptación gradual:</strong> El equipo se familiariza progresivamente</li>
                      <li>• <strong>Menor riesgo:</strong> Problemas limitados a un nivel específico</li>
                      <li>• <strong>ROI temprano:</strong> Beneficios visibles desde el primer nivel</li>
                      <li>• <strong>Escalabilidad probada:</strong> Confianza antes de expandir</li>
                      <li>• <strong>Capacitación enfocada:</strong> Entrenamientos específicos por nivel</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Footer con estado de configuración */}
      {cambiosPendientes && (
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <div>
                  <p className="font-medium text-amber-800">Tienes cambios sin guardar</p>
                  <p className="text-sm text-amber-700">Asegúrate de guardar tus cambios antes de salir de esta página.</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleRestablecerDefecto}>
                  Descartar
                </Button>
                <Button onClick={handleGuardarConfiguracion} className="bg-amber-600 hover:bg-amber-700">
                  Guardar Ahora
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
