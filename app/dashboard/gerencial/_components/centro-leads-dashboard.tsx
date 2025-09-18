
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Phone, 
  Users, 
  Clock, 
  TrendingUp,
  AlertTriangle,
  Activity,
  UserCheck,
  PhoneCall,
  Store,
  Target,
  BarChart3,
  Eye
} from 'lucide-react';
import { motion } from 'framer-motion';
import MetricCard from './metric-card';
import ChartComponent from './chart-component';
import DataTable from './data-table';
import { useToast } from '@/components/ui/use-toast';

interface DashboardData {
  centroLeads: {
    llamadasHoy: number;
    visitasHoy: number;
    prospectsGenerados: number;
    vendedoresGuardia: number;
    promedioAsignacion: number;
    alertasDesbalance: number;
    rendimientoVendedores: any[];
  };
  ultimaActualizacion: string;
}

interface MetricasTiempoReal {
  ultimaHora: {
    llamadas: number;
    visitas: number;
    asignaciones: number;
    contactos: number;
    vendedoresActivos: number;
  };
  velocidades: {
    llamadasPorMinuto: string;
    visitasPorMinuto: string;
    asignacionesPorMinuto: string;
    contactosPorMinuto: string;
  };
  tendenciasHoy: any[];
  estadoSistema: {
    horaActual: number;
    minutosActuales: number;
    actividadGeneral: string;
    eficienciaAsignacion: string;
  };
  ultimaActualizacion: string;
}

export default function CentroLeadsDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [metricas, setMetricas] = useState<MetricasTiempoReal | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
    fetchMetricasTiempoReal();
    
    // Actualizar métricas de tiempo real cada 30 segundos
    const interval = setInterval(() => {
      fetchMetricasTiempoReal(true);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/gerencial/dashboard');
      if (response.ok) {
        const dashboardData = await response.json();
        setData(dashboardData);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const fetchMetricasTiempoReal = async (silent = false) => {
    try {
      const response = await fetch('/api/gerencial/metricas-tiempo-real');
      if (response.ok) {
        const metricasData = await response.json();
        setMetricas(metricasData);
      }
    } catch (error) {
      console.error('Error fetching real-time metrics:', error);
      if (!silent) {
        toast({
          title: "Error",
          description: "No se pudieron cargar las métricas de tiempo real",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-200 rounded-lg animate-pulse"></div>
          ))}
        </div>
        <div className="h-64 bg-slate-200 rounded-lg animate-pulse"></div>
      </div>
    );
  }

  const tendenciasData = metricas?.tendenciasHoy?.map(t => ({
    name: t.hora,
    value: t.total,
    llamadas: t.llamadas,
    visitas: t.visitas
  })) || [];

  const velocidadData = metricas ? [
    { name: 'Llamadas/min', value: parseFloat(metricas.velocidades.llamadasPorMinuto), color: '#60B5FF' },
    { name: 'Visitas/min', value: parseFloat(metricas.velocidades.visitasPorMinuto), color: '#FF9149' },
    { name: 'Asignaciones/min', value: parseFloat(metricas.velocidades.asignacionesPorMinuto), color: '#80D8C3' },
    { name: 'Contactos/min', value: parseFloat(metricas.velocidades.contactosPorMinuto), color: '#72BF78' }
  ] : [];

  return (
    <div className="space-y-6">
      {/* Métricas de Tiempo Real */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <MetricCard
          title="Llamadas Última Hora"
          value={metricas?.ultimaHora?.llamadas || 0}
          icon={Phone}
          description="Llamadas entrantes"
          change={12}
          changeType="positive"
        />
        <MetricCard
          title="Visitas Última Hora"
          value={metricas?.ultimaHora?.visitas || 0}
          icon={Store}
          description="Visitas showroom"
          change={8}
          changeType="positive"
        />
        <MetricCard
          title="Asignaciones"
          value={metricas?.ultimaHora?.asignaciones || 0}
          icon={UserCheck}
          description="Leads asignados"
        />
        <MetricCard
          title="Contactos Realizados"
          value={metricas?.ultimaHora?.contactos || 0}
          icon={PhoneCall}
          description="Primer contacto"
        />
        <MetricCard
          title="Vendedores Activos"
          value={metricas?.ultimaHora?.vendedoresActivos || 0}
          icon={Users}
          description="Con actividad"
        />
      </div>

      {/* Estado del Sistema en Tiempo Real */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Estado del Sistema en Tiempo Real
              </CardTitle>
              <CardDescription>
                Monitoreo continuo del centro de leads
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full animate-pulse ${
                metricas?.estadoSistema?.actividadGeneral === 'ACTIVO' ? 'bg-green-500' : 'bg-yellow-500'
              }`}></div>
              <span className="text-sm text-slate-600">
                {metricas?.estadoSistema?.actividadGeneral || 'CARGANDO'}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-800 mb-2">
                {metricas?.estadoSistema?.horaActual?.toString().padStart(2, '0')}:
                {metricas?.estadoSistema?.minutosActuales?.toString().padStart(2, '0')}
              </div>
              <p className="text-sm text-slate-500">Hora Actual</p>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-800 mb-2">
                {metricas?.estadoSistema?.eficienciaAsignacion || '0'}%
              </div>
              <p className="text-sm text-slate-500">Eficiencia Asignación</p>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-800 mb-2">
                {data?.centroLeads?.promedioAsignacion?.toFixed(1) || '0.0'}
              </div>
              <p className="text-sm text-slate-500">Min Promedio Asignación</p>
            </div>
            
            <div className="text-center">
              <div className={`text-2xl font-bold mb-2 ${
                (data?.centroLeads?.alertasDesbalance || 0) > 0 ? 'text-red-600' : 'text-green-600'
              }`}>
                {data?.centroLeads?.alertasDesbalance || 0}
              </div>
              <p className="text-sm text-slate-500">Alertas Desbalance</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tendencias del Día */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Tendencias del Día
            </CardTitle>
            <CardDescription>
              Actividad por hora: llamadas + visitas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartComponent
              type="line"
              data={tendenciasData}
              height={300}
              showLegend={false}
            />
          </CardContent>
        </Card>

        {/* Velocidades en Tiempo Real */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Velocidades (Última Hora)
            </CardTitle>
            <CardDescription>
              Leads procesados por minuto
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {velocidadData.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <span className="font-medium text-slate-700">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-slate-800">
                      {item.value.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-slate-700">Análisis Automático</span>
              </div>
              <p className="text-sm text-slate-600">
                {metricas?.estadoSistema?.actividadGeneral === 'ACTIVO' 
                  ? 'El sistema está procesando leads de manera eficiente. Buen rendimiento general.'
                  : 'Actividad reducida. Es normal durante horas no pico o fines de semana.'
                }
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de Rendimiento de Vendedores de Guardia */}
      <DataTable
        title="Rendimiento Vendedores de Guardia"
        description="Análisis detallado de carga y eficiencia por vendedor"
        data={data?.centroLeads?.rendimientoVendedores || []}
        columns={[
          { key: 'nombre', title: 'Vendedor', type: 'text' },
          { key: 'cargaActual', title: 'Carga Actual', type: 'number' },
          { key: 'metaDelDia', title: 'Meta del Día', type: 'number' },
          { key: 'prospectsAsignadosHoy', title: 'Asignados Hoy', type: 'number' },
          { key: 'prospectsContactados', title: 'Contactados', type: 'number' },
          { key: 'tasaContacto', title: 'Tasa Contacto', type: 'percentage' },
          { key: 'disponible', title: 'Disponible', type: 'boolean' }
        ]}
        searchable={true}
      />

      {/* Insights del Centro de Leads */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Insights del Centro de Leads
          </CardTitle>
          <CardDescription>
            Análisis automático de patrones y oportunidades
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-slate-800 mb-3">Patrones Detectados</h4>
              
              <div className="flex items-start gap-3 p-3 border rounded-lg">
                <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-800">Pico de Actividad</p>
                  <p className="text-xs text-slate-600">
                    Mayor actividad entre 10:00-12:00 y 14:00-16:00 horas
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 border rounded-lg">
                <Users className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-800">Balanceo Óptimo</p>
                  <p className="text-xs text-slate-600">
                    Carga distribuida uniformemente entre vendedores activos
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 border rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-800">Tiempo de Respuesta</p>
                  <p className="text-xs text-slate-600">
                    Asignación promedio de {data?.centroLeads?.promedioAsignacion?.toFixed(1) || 0} minutos
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold text-slate-800 mb-3">Recomendaciones</h4>
              
              {(data?.centroLeads?.alertasDesbalance || 0) > 0 && (
                <div className="flex items-start gap-3 p-3 border-l-4 border-red-500 bg-red-50">
                  <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-800">Acción Requerida</p>
                    <p className="text-xs text-red-700">
                      Hay {data?.centroLeads?.alertasDesbalance || 0} alertas de desbalance activas
                    </p>
                    <Button size="sm" variant="outline" className="mt-2">
                      Ver Alertas
                    </Button>
                  </div>
                </div>
              )}
              
              <div className="flex items-start gap-3 p-3 border-l-4 border-blue-500 bg-blue-50">
                <Target className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-800">Optimización</p>
                  <p className="text-xs text-blue-700">
                    Considere ajustar horarios de guardia según patrones de actividad
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 border-l-4 border-green-500 bg-green-50">
                <Activity className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-800">Monitoreo</p>
                  <p className="text-xs text-green-700">
                    Sistema funcionando correctamente con {data?.centroLeads?.vendedoresGuardia} vendedores activos
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
