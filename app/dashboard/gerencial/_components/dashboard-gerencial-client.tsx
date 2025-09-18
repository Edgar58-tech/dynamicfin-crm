
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  RefreshCw, 
  TrendingUp, 
  AlertCircle, 
  Phone, 
  Users, 
  Clock,
  BarChart3,
  Activity,
  Zap,
  Brain,
  Target,
  Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Componentes especializados
import MetricCard from './metric-card';
import ChartComponent from './chart-component';
import AlertPanel from './alert-panel';
import DataTable from './data-table';
import GrabacionesDashboard from './grabaciones-dashboard';
import CentroLeadsDashboard from './centro-leads-dashboard';
import CrmMetricsWidget from './crm-metrics-widget';
import { useToast } from '@/components/ui/use-toast';

interface DashboardData {
  resumenEjecutivo: {
    leadsRecibidosHoy: number;
    vendedoresGuardiaActivos: number;
    prospectosPendientes: number;
    alertasCriticas: number;
    tiempoPromedioAsignacion: number;
  };
  centroLeads: any;
  grabaciones: any;
  catalogo: any;
  pipeline: any;
  kpis: any;
  metasVendedores: any[];
  alertasCriticas: any[];
  ultimaActualizacion: string;
}

interface DashboardGerencialClientProps {
  initialData: DashboardData | null;
}

export default function DashboardGerencialClient({ initialData }: DashboardGerencialClientProps) {
  const [data, setData] = useState<DashboardData | null>(initialData);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [activeTab, setActiveTab] = useState('resumen');
  const { toast } = useToast();

  // Actualización automática cada 30 segundos
  useEffect(() => {
    fetchDashboardData();
    
    const interval = setInterval(() => {
      fetchDashboardData(true); // Silent refresh
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async (silent = false) => {
    if (!silent) setLoading(true);
    
    try {
      const response = await fetch('/api/gerencial/dashboard');
      
      if (!response.ok) {
        throw new Error('Error al cargar datos');
      }
      
      const dashboardData = await response.json();
      setData(dashboardData);
      setLastUpdate(new Date().toLocaleTimeString('es-ES'));
      
      if (!silent) {
        toast({
          title: "Datos actualizados",
          description: "Dashboard actualizado exitosamente",
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos del dashboard",
        variant: "destructive",
      });
    } finally {
      if (!silent) setLoading(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-slate-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="h-96 bg-slate-200 rounded-lg animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resumen Ejecutivo - Siempre visible */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <MetricCard
            title="Leads Recibidos Hoy"
            value={data?.resumenEjecutivo?.leadsRecibidosHoy || 0}
            change={12}
            changeType="positive"
            icon={Phone}
            description="Llamadas + Visitas"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <MetricCard
            title="Vendedores Guardia"
            value={data?.resumenEjecutivo?.vendedoresGuardiaActivos || 0}
            change={0}
            changeType="neutral"
            icon={Users}
            description="Activos hoy"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <MetricCard
            title="Pendientes Calificación"
            value={data?.resumenEjecutivo?.prospectosPendientes || 0}
            change={-5}
            changeType="negative"
            icon={Clock}
            description="Requieren atención"
            alert={(data?.resumenEjecutivo?.prospectosPendientes || 0) > 10}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <MetricCard
            title="Alertas Críticas"
            value={data?.resumenEjecutivo?.alertasCriticas || 0}
            change={0}
            changeType="neutral"
            icon={AlertCircle}
            description="Requieren acción"
            alert={(data?.resumenEjecutivo?.alertasCriticas || 0) > 0}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <MetricCard
            title="Tiempo Asignación"
            value={data?.resumenEjecutivo?.tiempoPromedioAsignacion || 0}
            change={8}
            changeType="positive"
            icon={TrendingUp}
            description="Minutos promedio"
            unit="min"
          />
        </motion.div>
      </div>

      {/* Barra de actualizaciones y acciones */}
      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-slate-600">
              Última actualización: {lastUpdate || 'Cargando...'}
            </span>
          </div>
          <Badge variant="outline" className="gap-1">
            <Activity className="w-3 h-3" />
            Tiempo Real
          </Badge>
        </div>
        
        <Button
          onClick={() => fetchDashboardData()}
          disabled={loading}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      {/* Dashboard principal con pestañas */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="resumen" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            Resumen
          </TabsTrigger>
          <TabsTrigger value="centro-leads" className="gap-2">
            <Phone className="w-4 h-4" />
            Centro Leads
          </TabsTrigger>
          <TabsTrigger value="grabaciones" className="gap-2">
            <Brain className="w-4 h-4" />
            IA & Grabaciones
          </TabsTrigger>
          <TabsTrigger value="crm-metrics" className="gap-2">
            <Activity className="w-4 h-4" />
            CRM Externo
          </TabsTrigger>
          <TabsTrigger value="pipeline" className="gap-2">
            <Target className="w-4 h-4" />
            Pipeline
          </TabsTrigger>
          <TabsTrigger value="alertas" className="gap-2">
            <AlertCircle className="w-4 h-4" />
            Alertas
            {(data?.resumenEjecutivo?.alertasCriticas || 0) > 0 && (
              <Badge variant="destructive" className="ml-1 px-1 text-xs">
                {data?.resumenEjecutivo?.alertasCriticas || 0}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="configuracion" className="gap-2">
            <Zap className="w-4 h-4" />
            Config
          </TabsTrigger>
        </TabsList>

        {/* Contenido de las pestañas */}
        <AnimatePresence mode="wait">
          <TabsContent value="resumen" className="space-y-6">
            <motion.div
              key="resumen"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              {/* Gráfico del Pipeline */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Pipeline Integrado
                  </CardTitle>
                  <CardDescription>
                    Flujo completo: Leads → Asignación → Calificación → Cierre
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartComponent
                    type="funnel"
                    data={[
                      { name: 'Leads Recibidos', value: data?.pipeline?.leadsRecibidos || 0, color: '#60B5FF' },
                      { name: 'Asignados', value: data?.pipeline?.leadsAsignados || 0, color: '#FF9149' },
                      { name: 'Contactados', value: data?.pipeline?.leadsContactados || 0, color: '#FF9898' },
                      { name: 'Calificados', value: data?.pipeline?.leadsCalificados || 0, color: '#80D8C3' },
                      { name: 'Ventas', value: data?.pipeline?.ventasRealizadas || 0, color: '#72BF78' }
                    ]}
                    height={300}
                  />
                </CardContent>
              </Card>

              {/* Rendimiento por Vendedor */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Top Vendedores (Metas)
                  </CardTitle>
                  <CardDescription>
                    Cumplimiento de metas mensuales
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {data?.metasVendedores?.slice(0, 5)?.map((meta, index) => (
                      <div key={meta.vendedorId} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                            index === 0 ? 'bg-yellow-100 text-yellow-800' :
                            index === 1 ? 'bg-gray-100 text-gray-800' :
                            index === 2 ? 'bg-orange-100 text-orange-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium text-slate-800">{meta.nombre}</p>
                            <p className="text-sm text-slate-500">
                              {meta.autosVendidos}/{meta.metaAutos} autos
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-slate-800">
                            {Number(meta.cumplimiento).toFixed(1)}%
                          </p>
                          <div className="w-20 bg-slate-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all duration-1000 ${
                                meta.cumplimiento >= 100 ? 'bg-green-500' :
                                meta.cumplimiento >= 75 ? 'bg-blue-500' :
                                meta.cumplimiento >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${Math.min(meta.cumplimiento, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    )) || (
                      <p className="text-center text-slate-500 py-8">
                        No hay datos de metas disponibles
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="centro-leads" className="space-y-6">
            <motion.div
              key="centro-leads"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <CentroLeadsDashboard />
            </motion.div>
          </TabsContent>

          <TabsContent value="grabaciones" className="space-y-6">
            <motion.div
              key="grabaciones"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <GrabacionesDashboard />
            </motion.div>
          </TabsContent>

          <TabsContent value="crm-metrics" className="space-y-6">
            <motion.div
              key="crm-metrics"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <CrmMetricsWidget />
            </motion.div>
          </TabsContent>

          <TabsContent value="pipeline" className="space-y-6">
            <motion.div
              key="pipeline"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>KPIs Generales</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600">Prospectos Totales</span>
                        <span className="font-bold text-slate-800">{data?.kpis?.prospectosTotales || 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600">Calificados</span>
                        <span className="font-bold text-blue-600">{data?.kpis?.prospectosCalificados || 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600">Vendidos</span>
                        <span className="font-bold text-green-600">{data?.kpis?.prospectosVendidos || 0}</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t">
                        <span className="text-slate-600">Tasa Conversión General</span>
                        <Badge variant="outline">
                          {data?.kpis?.tasaConversionGeneral?.toFixed(1) || 0}%
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Meta Mensual</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600">Meta del Mes</span>
                        <span className="font-bold text-slate-800">{data?.kpis?.metaMensual || 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600">Ventas Realizadas</span>
                        <span className="font-bold text-green-600">{data?.kpis?.ventasRealizadas || 0}</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-3">
                        <div 
                          className="bg-green-500 h-3 rounded-full transition-all duration-1000"
                          style={{ 
                            width: `${Math.min(data?.kpis?.cumplimientoMeta || 0, 100)}%` 
                          }}
                        ></div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600">Cumplimiento</span>
                        <Badge variant={data?.kpis?.cumplimientoMeta >= 100 ? "default" : "outline"}>
                          {data?.kpis?.cumplimientoMeta?.toFixed(1) || 0}%
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          </TabsContent>

          <TabsContent value="alertas" className="space-y-6">
            <motion.div
              key="alertas"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <AlertPanel alertas={data?.alertasCriticas || []} />
            </motion.div>
          </TabsContent>

          <TabsContent value="configuracion" className="space-y-6">
            <motion.div
              key="configuracion"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    Configuración del Dashboard
                  </CardTitle>
                  <CardDescription>
                    Personaliza tu experiencia del dashboard gerencial
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-slate-500">
                    <Zap className="w-12 h-12 mx-auto mb-2 text-slate-400" />
                    <p>Configuraciones avanzadas disponibles próximamente</p>
                    <p className="text-sm mt-1">Incluirá widgets personalizables, notificaciones y reportes automatizados</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </AnimatePresence>
      </Tabs>
    </div>
  );
}
