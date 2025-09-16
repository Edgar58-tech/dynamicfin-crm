
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Target,
  Calendar,
  Download,
  Filter,
  RefreshCw,
  PieChart,
  Activity,
  Award,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell
} from 'recharts';

interface ReporteRendimiento {
  vendedor: string;
  metaAutos: number;
  autosVendidos: number;
  porcentajeCumplimiento: number;
  ingresosMes: number;
  tasaConversion: number;
  leadsActivos: number;
  clientesSatisfechos: number;
}

interface ReporteRentabilidad {
  modelo: string;
  unidadesVendidas: number;
  ingresoPromedio: number;
  margenPromedio: number;
  rentabilidadTotal: number;
}

interface ReporteEstacional {
  mes: string;
  suvsFamiliares: number;
  sedanesEjecutivos: number;
  pickupsComerciales: number;
  autosCompactos: number;
}

interface ReporteFuentesLeads {
  fuente: string;
  leads: number;
  conversiones: number;
  tasaConversion: number;
  costoPromedio: number;
  roi: number;
}

export default function ReportesPage() {
  const { data: session, status } = useSession();
  const [reporteRendimiento, setReporteRendimiento] = useState<ReporteRendimiento[]>([]);
  const [reporteRentabilidad, setReporteRentabilidad] = useState<ReporteRentabilidad[]>([]);
  const [reporteEstacional, setReporteEstacional] = useState<ReporteEstacional[]>([]);
  const [reporteFuentes, setReporteFuentes] = useState<ReporteFuentesLeads[]>([]);
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState('mes_actual');
  const [loading, setLoading] = useState(true);

  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  useEffect(() => {
    fetchReportesData();
  }, [periodoSeleccionado]);

  const fetchReportesData = async () => {
    try {
      setLoading(true);
      
      // Simular data hasta que la API esté lista
      const mockRendimiento: ReporteRendimiento[] = [
        {
          vendedor: 'Carlos Hernández',
          metaAutos: 8,
          autosVendidos: 8,
          porcentajeCumplimiento: 100,
          ingresosMes: 5840000,
          tasaConversion: 28,
          leadsActivos: 22,
          clientesSatisfechos: 95
        },
        {
          vendedor: 'María González',
          metaAutos: 6,
          autosVendidos: 7,
          porcentajeCumplimiento: 117,
          ingresosMes: 4950000,
          tasaConversion: 22,
          leadsActivos: 18,
          clientesSatisfechos: 92
        },
        {
          vendedor: 'Pedro Ramírez',
          metaAutos: 5,
          autosVendidos: 5,
          porcentajeCumplimiento: 100,
          ingresosMes: 2850000,
          tasaConversion: 15,
          leadsActivos: 12,
          clientesSatisfechos: 89
        },
        {
          vendedor: 'Ana López',
          metaAutos: 4,
          autosVendidos: 2,
          porcentajeCumplimiento: 50,
          ingresosMes: 1280000,
          tasaConversion: 8,
          leadsActivos: 32,
          clientesSatisfechos: 85
        }
      ];

      const mockRentabilidad: ReporteRentabilidad[] = [
        {
          modelo: 'SUV Familiar',
          unidadesVendidas: 18,
          ingresoPromedio: 650000,
          margenPromedio: 18,
          rentabilidadTotal: 11700000
        },
        {
          modelo: 'Sedan Ejecutivo',
          unidadesVendidas: 14,
          ingresoPromedio: 580000,
          margenPromedio: 22,
          rentabilidadTotal: 8120000
        },
        {
          modelo: 'Pickup Comercial',
          unidadesVendidas: 12,
          ingresoPromedio: 725000,
          margenPromedio: 15,
          rentabilidadTotal: 8700000
        },
        {
          modelo: 'Auto Compacto',
          unidadesVendidas: 6,
          ingresoPromedio: 350000,
          margenPromedio: 12,
          rentabilidadTotal: 2100000
        }
      ];

      const mockEstacional: ReporteEstacional[] = [
        { mes: 'Enero', suvsFamiliares: 12, sedanesEjecutivos: 8, pickupsComerciales: 6, autosCompactos: 15 },
        { mes: 'Febrero', suvsFamiliares: 14, sedanesEjecutivos: 10, pickupsComerciales: 8, autosCompactos: 18 },
        { mes: 'Marzo', suvsFamiliares: 16, sedanesEjecutivos: 12, pickupsComerciales: 10, autosCompactos: 14 },
        { mes: 'Abril', suvsFamiliares: 18, sedanesEjecutivos: 14, pickupsComerciales: 12, autosCompactos: 8 },
        { mes: 'Mayo', suvsFamiliares: 22, sedanesEjecutivos: 16, pickupsComerciales: 14, autosCompactos: 6 },
        { mes: 'Junio', suvsFamiliares: 20, sedanesEjecutivos: 18, pickupsComerciales: 16, autosCompactos: 8 },
        { mes: 'Julio', suvsFamiliares: 18, sedanesEjecutivos: 15, pickupsComerciales: 18, autosCompactos: 10 },
        { mes: 'Agosto', suvsFamiliares: 16, sedanesEjecutivos: 12, pickupsComerciales: 22, autosCompactos: 12 },
        { mes: 'Septiembre', suvsFamiliares: 18, sedanesEjecutivos: 14, pickupsComerciales: 20, autosCompactos: 10 },
        { mes: 'Octubre', suvsFamiliares: 20, sedanesEjecutivos: 16, pickupsComerciales: 15, autosCompactos: 8 },
        { mes: 'Noviembre', suvsFamiliares: 24, sedanesEjecutivos: 20, pickupsComerciales: 12, autosCompactos: 6 },
        { mes: 'Diciembre', suvsFamiliares: 22, sedanesEjecutivos: 22, pickupsComerciales: 10, autosCompactos: 8 }
      ];

      const mockFuentes: ReporteFuentesLeads[] = [
        {
          fuente: 'Sitio Web',
          leads: 150,
          conversiones: 51,
          tasaConversion: 34,
          costoPromedio: 280,
          roi: 4.2
        },
        {
          fuente: 'Referencias',
          leads: 80,
          conversiones: 36,
          tasaConversion: 45,
          costoPromedio: 150,
          roi: 8.1
        },
        {
          fuente: 'AutoShow',
          leads: 120,
          conversiones: 34,
          tasaConversion: 28,
          costoPromedio: 380,
          roi: 3.8
        },
        {
          fuente: 'Facebook Ads',
          leads: 200,
          conversiones: 36,
          tasaConversion: 18,
          costoPromedio: 420,
          roi: 2.1
        },
        {
          fuente: 'Google Ads',
          leads: 180,
          conversiones: 43,
          tasaConversion: 24,
          costoPromedio: 320,
          roi: 3.6
        }
      ];

      setReporteRendimiento(mockRendimiento);
      setReporteRentabilidad(mockRentabilidad);
      setReporteEstacional(mockEstacional);
      setReporteFuentes(mockFuentes);
      
    } catch (error) {
      console.error('Error fetching reportes data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportarReporte = (tipoReporte: string) => {
    // Aquí implementarías la lógica para exportar
    console.log(`Exportando reporte: ${tipoReporte}`);
  };

  const pieDataRentabilidad = reporteRentabilidad.map((item, index) => ({
    name: item.modelo,
    value: item.rentabilidadTotal,
    color: colors[index % colors.length]
  }));

  const pieDataFuentes = reporteFuentes.map((item, index) => ({
    name: item.fuente,
    value: item.conversiones,
    color: colors[index % colors.length]
  }));

  if (status === 'loading' || loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-64 bg-slate-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!session || session.user.rol !== 'GERENTE_VENTAS') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-slate-600">Acceso restringido a gerentes de ventas únicamente</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            📈 Reportes Gerenciales Avanzados
          </h1>
          <p className="text-slate-600 mt-1">
            Análisis profundos para tomar decisiones estratégicas basadas en datos
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={periodoSeleccionado} onValueChange={setPeriodoSeleccionado}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mes_actual">Este Mes</SelectItem>
              <SelectItem value="trimestre">Trimestre Actual</SelectItem>
              <SelectItem value="semestre">Semestre</SelectItem>
              <SelectItem value="year">Año Completo</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            onClick={fetchReportesData}
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* KPIs Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Target className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-slate-600">Cumplimiento Promedio</p>
                <p className="text-2xl font-bold text-blue-600">
                  {Math.round(reporteRendimiento.reduce((acc, v) => acc + v.porcentajeCumplimiento, 0) / reporteRendimiento.length)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <DollarSign className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm text-slate-600">Ingresos Totales</p>
                <p className="text-2xl font-bold text-green-600">
                  ${reporteRendimiento.reduce((acc, v) => acc + v.ingresosMes, 0).toLocaleString('es-MX')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-sm text-slate-600">Conversión Promedio</p>
                <p className="text-2xl font-bold text-purple-600">
                  {Math.round(reporteRendimiento.reduce((acc, v) => acc + v.tasaConversion, 0) / reporteRendimiento.length)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-orange-600" />
              <div>
                <p className="text-sm text-slate-600">Autos Vendidos</p>
                <p className="text-2xl font-bold text-orange-600">
                  {reporteRendimiento.reduce((acc, v) => acc + v.autosVendidos, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de Reportes */}
      <Tabs defaultValue="rendimiento" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="rendimiento" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Rendimiento Equipo
          </TabsTrigger>
          <TabsTrigger value="rentabilidad" className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Rentabilidad
          </TabsTrigger>
          <TabsTrigger value="estacional" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Análisis Estacional
          </TabsTrigger>
          <TabsTrigger value="fuentes" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            ROI Marketing
          </TabsTrigger>
        </TabsList>

        {/* Reporte Rendimiento Individual */}
        <TabsContent value="rendimiento">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Análisis de Rendimiento Individual
                  </CardTitle>
                  <CardDescription>
                    Métricas detalladas del desempeño de cada vendedor
                  </CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => exportarReporte('rendimiento')}
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  Exportar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Gráfico de barras */}
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reporteRendimiento}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="vendedor" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="autosVendidos" fill="#3B82F6" name="Autos Vendidos" />
                      <Bar dataKey="metaAutos" fill="#E5E7EB" name="Meta Autos" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Tabla detallada */}
                <div className="space-y-4">
                  {reporteRendimiento.map((vendedor, index) => (
                    <motion.div
                      key={vendedor.vendedor}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className="p-4 border rounded-lg hover:shadow-md transition-all"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                            vendedor.porcentajeCumplimiento >= 100 ? 'bg-green-100' :
                            vendedor.porcentajeCumplimiento >= 80 ? 'bg-yellow-100' :
                            'bg-red-100'
                          }`}>
                            {vendedor.porcentajeCumplimiento >= 100 ? (
                              <Award className="w-6 h-6 text-green-600" />
                            ) : vendedor.porcentajeCumplimiento >= 80 ? (
                              <Target className="w-6 h-6 text-yellow-600" />
                            ) : (
                              <AlertTriangle className="w-6 h-6 text-red-600" />
                            )}
                          </div>
                          <div>
                            <h4 className="font-semibold text-lg">{vendedor.vendedor}</h4>
                            <p className="text-sm text-slate-600">
                              {vendedor.autosVendidos}/{vendedor.metaAutos} autos vendidos
                            </p>
                          </div>
                        </div>
                        <Badge className={
                          vendedor.porcentajeCumplimiento >= 100 ? 'bg-green-100 text-green-800' :
                          vendedor.porcentajeCumplimiento >= 80 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }>
                          {vendedor.porcentajeCumplimiento}% Cumplimiento
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div>
                          <p className="text-xs text-slate-500">Ingresos Mes</p>
                          <p className="font-bold text-lg">
                            ${vendedor.ingresosMes.toLocaleString('es-MX')}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Conversión</p>
                          <p className="font-bold text-lg">{vendedor.tasaConversion}%</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Leads Activos</p>
                          <p className={`font-bold text-lg ${
                            vendedor.leadsActivos > 30 ? 'text-red-600' :
                            vendedor.leadsActivos > 20 ? 'text-yellow-600' :
                            'text-green-600'
                          }`}>
                            {vendedor.leadsActivos}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Satisfacción</p>
                          <p className="font-bold text-lg">{vendedor.clientesSatisfechos}%</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Progreso Meta</p>
                          <Progress value={vendedor.porcentajeCumplimiento} className="mt-1" />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reporte Rentabilidad */}
        <TabsContent value="rentabilidad">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5" />
                  Distribución de Rentabilidad
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={pieDataRentabilidad}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, value }: { name: string; value: number }) => `${name}: $${(value/1000000).toFixed(1)}M`}
                      >
                        {pieDataRentabilidad.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any) => [`$${value.toLocaleString('es-MX')}`, 'Rentabilidad']} />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Análisis por Modelo
                  </CardTitle>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => exportarReporte('rentabilidad')}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Exportar
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reporteRentabilidad.map((modelo, index) => (
                    <div key={modelo.modelo} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">{modelo.modelo}</h4>
                        <Badge className="bg-green-100 text-green-800">
                          {modelo.margenPromedio}% margen
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-slate-500">Unidades</p>
                          <p className="font-bold">{modelo.unidadesVendidas}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Precio Promedio</p>
                          <p className="font-bold">
                            ${modelo.ingresoPromedio.toLocaleString('es-MX')}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500">Rentabilidad Total</p>
                          <p className="font-bold text-green-600">
                            ${modelo.rentabilidadTotal.toLocaleString('es-MX')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                    <h5 className="font-semibold text-blue-800">Insight Estratégico</h5>
                  </div>
                  <p className="text-sm text-blue-700">
                    Los sedanes ejecutivos muestran el mejor margen (22%) pero menor volumen. 
                    Considera incentivar más este modelo para maximizar rentabilidad.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Análisis Estacional */}
        <TabsContent value="estacional">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Patrones de Venta Estacionales
                  </CardTitle>
                  <CardDescription>
                    Tendencias de demanda por tipo de vehículo a lo largo del año
                  </CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => exportarReporte('estacional')}
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  Exportar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-96 mb-6">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={reporteEstacional}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="suvsFamiliares" 
                      stroke="#3B82F6" 
                      strokeWidth={2}
                      name="SUVs Familiares"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="sedanesEjecutivos" 
                      stroke="#10B981" 
                      strokeWidth={2}
                      name="Sedanes Ejecutivos"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="pickupsComerciales" 
                      stroke="#F59E0B" 
                      strokeWidth={2}
                      name="Pickups Comerciales"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="autosCompactos" 
                      stroke="#EF4444" 
                      strokeWidth={2}
                      name="Autos Compactos"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <h5 className="font-semibold text-blue-800">SUVs Familiares</h5>
                  </div>
                  <p className="text-sm text-blue-700 mb-2">
                    <strong>Pico:</strong> Mayo-Junio (+28%)
                  </p>
                  <p className="text-xs text-blue-600">
                    💡 Ideal para vacaciones familiares
                  </p>
                </div>

                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <h5 className="font-semibold text-green-800">Sedanes Ejecutivos</h5>
                  </div>
                  <p className="text-sm text-green-700 mb-2">
                    <strong>Pico:</strong> Nov-Dic (+18%)
                  </p>
                  <p className="text-xs text-green-600">
                    💡 Compras de fin de año fiscal
                  </p>
                </div>

                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <h5 className="font-semibold text-yellow-800">Pickups Comerciales</h5>
                  </div>
                  <p className="text-sm text-yellow-700 mb-2">
                    <strong>Pico:</strong> Ago-Sep (+42%)
                  </p>
                  <p className="text-xs text-yellow-600">
                    💡 Preparación fin de año comercial
                  </p>
                </div>

                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <h5 className="font-semibold text-red-800">Autos Compactos</h5>
                  </div>
                  <p className="text-sm text-red-700 mb-2">
                    <strong>Pico:</strong> Ene-Feb (+35%)
                  </p>
                  <p className="text-xs text-red-600">
                    💡 Primer auto del año, economía
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ROI Marketing */}
        <TabsContent value="fuentes">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5" />
                  Conversiones por Fuente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={pieDataFuentes}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, value }: { name: string; value: number }) => `${name}: ${value}`}
                      >
                        {pieDataFuentes.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any) => [`${value} conversiones`, 'Total']} />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    ROI por Canal
                  </CardTitle>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => exportarReporte('fuentes')}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Exportar
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reporteFuentes
                    .sort((a, b) => b.roi - a.roi)
                    .map((fuente, index) => (
                    <div key={fuente.fuente} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold">{fuente.fuente}</h4>
                        <Badge className={
                          fuente.roi >= 6 ? 'bg-green-100 text-green-800' :
                          fuente.roi >= 3 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }>
                          ROI: {fuente.roi}x
                        </Badge>
                      </div>

                      <div className="grid grid-cols-4 gap-4 text-sm mb-3">
                        <div>
                          <p className="text-slate-500">Leads</p>
                          <p className="font-bold">{fuente.leads}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Conversiones</p>
                          <p className="font-bold text-green-600">{fuente.conversiones}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Tasa Conv.</p>
                          <p className="font-bold">{fuente.tasaConversion}%</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Costo/Lead</p>
                          <p className="font-bold">${fuente.costoPromedio}</p>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs text-slate-500 mb-1">Eficiencia</p>
                        <Progress 
                          value={Math.min((fuente.roi / 10) * 100, 100)} 
                          className="h-2" 
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    <h5 className="font-semibold text-green-800">Recomendación Estratégica</h5>
                  </div>
                  <p className="text-sm text-green-700">
                    Las referencias tienen el mejor ROI (8.1x) y mayor conversión (45%). 
                    Considera intensificar el programa de referidos para optimizar el presupuesto de marketing.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
