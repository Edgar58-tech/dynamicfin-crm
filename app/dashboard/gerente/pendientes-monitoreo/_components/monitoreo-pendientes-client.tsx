
'use client';

import { useState, useEffect } from 'react';
import type { TipoRol } from '@prisma/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertTriangle, 
  Clock, 
  Users, 
  TrendingUp, 
  CheckCircle, 
  AlertCircle, 
  BarChart3,
  Filter,
  RefreshCw,
  User,
  Phone,
  Calendar
} from 'lucide-react';
import { toast } from 'sonner';

interface MonitoreoPendientesClientProps {
  userRole: TipoRol;
  agenciaId?: number | null;
}

interface EstadisticasGerenciales {
  totalPendientes: number;
  totalCalificadas: number;
  promedioHorasCalificacion: number;
  rendimientoPorVendedor: {
    vendedorId: string;
    nombre: string;
    pendientes: number;
    completadas: number;
    promedioHoras: number;
    alertas: number;
  }[];
  tendenciaUltimos7Dias: {
    fecha: string;
    asignadas: number;
    completadas: number;
    pendientes: number;
  }[];
}

interface VendedorRendimiento {
  id: string;
  nombre: string;
  totalPendientes: number;
  alertasRojas: number;
  promedioCalificacion: number;
  eficiencia: number;
  ultimaActividad: Date;
}

export function MonitoreoPendientesClient({ userRole, agenciaId }: MonitoreoPendientesClientProps) {
  const [loading, setLoading] = useState(true);
  const [estadisticas, setEstadisticas] = useState<EstadisticasGerenciales | null>(null);
  const [vendedores, setVendedores] = useState<VendedorRendimiento[]>([]);
  const [filtroTiempo, setFiltroTiempo] = useState('7');
  const [tabActiva, setTabActiva] = useState('resumen');

  // Cargar datos gerenciales
  const cargarDatosGerenciales = async () => {
    try {
      setLoading(true);
      
      // Cargar estadísticas generales
      const [responsePendientes, responseCompletadas] = await Promise.all([
        fetch('/api/vendedores/pendientes-calificacion?vendedor=all'),
        fetch(`/api/prospectos/completar-calificacion?periodo=${filtroTiempo}&vendedor=all`)
      ]);

      if (responsePendientes.ok && responseCompletadas.ok) {
        const dataPendientes = await responsePendientes.json();
        const dataCompletadas = await responseCompletadas.json();
        
        // Procesar estadísticas
        const stats: EstadisticasGerenciales = {
          totalPendientes: dataPendientes.estadisticas?.total || 0,
          totalCalificadas: dataCompletadas.estadisticas?.totalCalificadas || 0,
          promedioHorasCalificacion: dataPendientes.estadisticas?.promedioHoras || 0,
          rendimientoPorVendedor: [], // Se llenará con datos específicos
          tendenciaUltimos7Dias: [] // Se calculará
        };
        
        setEstadisticas(stats);
      }
    } catch (error) {
      console.error('Error al cargar datos gerenciales:', error);
      toast.error('Error al cargar estadísticas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatosGerenciales();
    
    // Recargar datos cada 2 minutos
    const interval = setInterval(cargarDatosGerenciales, 120000);
    return () => clearInterval(interval);
  }, [filtroTiempo]);

  // Funciones de utilidad
  const getRendimientoColor = (eficiencia: number) => {
    if (eficiencia >= 80) return 'text-green-600 bg-green-50';
    if (eficiencia >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getAlertLevel = (alertas: number) => {
    if (alertas >= 5) return { color: 'bg-red-500', text: 'Crítico' };
    if (alertas >= 3) return { color: 'bg-orange-500', text: 'Alto' };
    if (alertas >= 1) return { color: 'bg-yellow-500', text: 'Medio' };
    return { color: 'bg-green-500', text: 'Normal' };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPIs Principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pendientes Actuales</p>
                <p className="text-3xl font-bold text-red-600">{estadisticas?.totalPendientes || 0}</p>
              </div>
              <AlertTriangle className="w-10 h-10 text-red-600" />
            </div>
            <div className="mt-4">
              <Badge variant="destructive" className="text-xs">
                Requieren atención
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Calificadas (7 días)</p>
                <p className="text-3xl font-bold text-green-600">{estadisticas?.totalCalificadas || 0}</p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <div className="mt-4">
              <Badge variant="secondary" className="text-xs">
                Completadas
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Promedio Calificación</p>
                <p className="text-3xl font-bold text-blue-600">{estadisticas?.promedioHorasCalificacion || 0}h</p>
              </div>
              <Clock className="w-10 h-10 text-blue-600" />
            </div>
            <div className="mt-4">
              <Badge variant="outline" className="text-xs">
                Tiempo promedio
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Eficiencia Equipo</p>
                <p className="text-3xl font-bold text-purple-600">
                  {estadisticas && estadisticas.totalCalificadas > 0 
                    ? Math.round((estadisticas.totalCalificadas / (estadisticas.totalPendientes + estadisticas.totalCalificadas)) * 100)
                    : 0}%
                </p>
              </div>
              <TrendingUp className="w-10 h-10 text-purple-600" />
            </div>
            <div className="mt-4">
              <Badge className="text-xs">
                Ratio calificación
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros y Controles */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-48">
                <Select value={filtroTiempo} onValueChange={setFiltroTiempo}>
                  <SelectTrigger>
                    <SelectValue placeholder="Período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Último día</SelectItem>
                    <SelectItem value="7">Últimos 7 días</SelectItem>
                    <SelectItem value="30">Últimos 30 días</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <Button onClick={cargarDatosGerenciales} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualizar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs de Contenido */}
      <Tabs value={tabActiva} onValueChange={setTabActiva}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="resumen">Resumen Ejecutivo</TabsTrigger>
          <TabsTrigger value="vendedores">Por Vendedor</TabsTrigger>
          <TabsTrigger value="alertas">Alertas y Acciones</TabsTrigger>
        </TabsList>

        <TabsContent value="resumen" className="space-y-6">
          {/* Métricas de Rendimiento */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Distribución de Estados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Pendientes de Calificación</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div className="bg-red-500 h-2 rounded-full" style={{
                          width: `${estadisticas?.totalPendientes ? (estadisticas.totalPendientes / (estadisticas.totalPendientes + estadisticas.totalCalificadas)) * 100 : 0}%`
                        }}></div>
                      </div>
                      <span className="text-sm font-medium">{estadisticas?.totalPendientes || 0}</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Calificadas</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{
                          width: `${estadisticas?.totalCalificadas ? (estadisticas.totalCalificadas / (estadisticas.totalPendientes + estadisticas.totalCalificadas)) * 100 : 0}%`
                        }}></div>
                      </div>
                      <span className="text-sm font-medium">{estadisticas?.totalCalificadas || 0}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Niveles de Alerta
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="text-sm">Crítico (8+ horas)</span>
                    </div>
                    <Badge variant="destructive">3 leads</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                      <span className="text-sm">Alto (4+ horas)</span>
                    </div>
                    <Badge className="bg-orange-500">2 leads</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span className="text-sm">Medio (2+ horas)</span>
                    </div>
                    <Badge className="bg-yellow-500 text-black">5 leads</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="vendedores" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Rendimiento por Vendedor</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">Vendedor</th>
                      <th className="text-center p-3">Pendientes</th>
                      <th className="text-center p-3">Completadas</th>
                      <th className="text-center p-3">Alertas</th>
                      <th className="text-center p-3">Eficiencia</th>
                      <th className="text-center p-3">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Datos de ejemplo - esto se llenará con datos reales */}
                    <tr className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-500" />
                          <span>Juan Pérez</span>
                        </div>
                      </td>
                      <td className="text-center p-3">
                        <Badge variant="destructive">3</Badge>
                      </td>
                      <td className="text-center p-3">
                        <Badge variant="secondary">12</Badge>
                      </td>
                      <td className="text-center p-3">
                        <Badge className="bg-red-500">2 críticas</Badge>
                      </td>
                      <td className="text-center p-3">
                        <span className="text-yellow-600">75%</span>
                      </td>
                      <td className="text-center p-3">
                        <Button size="sm" variant="outline">Ver Detalles</Button>
                      </td>
                    </tr>
                    
                    <tr className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-500" />
                          <span>María López</span>
                        </div>
                      </td>
                      <td className="text-center p-3">
                        <Badge variant="destructive">1</Badge>
                      </td>
                      <td className="text-center p-3">
                        <Badge variant="secondary">15</Badge>
                      </td>
                      <td className="text-center p-3">
                        <Badge className="bg-green-500">0</Badge>
                      </td>
                      <td className="text-center p-3">
                        <span className="text-green-600">94%</span>
                      </td>
                      <td className="text-center p-3">
                        <Button size="sm" variant="outline">Ver Detalles</Button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alertas" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">Alertas Críticas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded">
                    <div>
                      <p className="font-medium text-red-800">Cliente: Ana García</p>
                      <p className="text-sm text-red-600">Pendiente hace 10 horas</p>
                    </div>
                    <Button size="sm" variant="destructive">Reasignar</Button>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded">
                    <div>
                      <p className="font-medium text-red-800">Cliente: Carlos Ruiz</p>
                      <p className="text-sm text-red-600">Pendiente hace 9 horas</p>
                    </div>
                    <Button size="sm" variant="destructive">Reasignar</Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-orange-600">Acciones Sugeridas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-orange-50 rounded">
                    <p className="font-medium text-orange-800">Redistribuir Carga</p>
                    <p className="text-sm text-orange-600">Juan Pérez tiene 3 pendientes vs. 0 de otros</p>
                    <Button size="sm" className="mt-2 bg-orange-600">Redistribuir</Button>
                  </div>
                  
                  <div className="p-3 bg-blue-50 rounded">
                    <p className="font-medium text-blue-800">Coaching Recomendado</p>
                    <p className="text-sm text-blue-600">Tiempo promedio alto en calificaciones</p>
                    <Button size="sm" className="mt-2 bg-blue-600">Programar</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
