
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown,
  Target,
  DollarSign,
  Users,
  Calendar,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Eye,
  Zap,
  BarChart3,
  Activity,
  Clock,
  Award
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  ComposedChart,
  Area,
  AreaChart
} from 'recharts';

interface ForecastGeneral {
  mes: string;
  year: number;
  pipelineTotal: number;
  probabilidadPonderada: number;
  ventasProyectadas: number;
  ingresosProyectados: number;
  confianzaForecast: number;
  metaVentas: number;
  metaIngresos: number;
  ultimaActualizacion: Date;
}

interface ForecastVendedor {
  vendedorId: string;
  nombre: string;
  apellido: string;
  especialidad: string;
  metaIndividual: number;
  forecastIndividual: number;
  confianza: number;
  ingresosProyectados: number;
  comisionProyectada: number;
  leadsEnPipeline: number;
  probabilidadPromedio: number;
  estado: 'superara_meta' | 'cumplira_meta' | 'riesgo' | 'critico';
}

interface FactorForecast {
  factor: string;
  peso: number;
  impacto: 'positivo' | 'negativo' | 'neutro';
  descripcion: string;
}

interface ForecastHistorico {
  mes: string;
  forecastInicial: number;
  forecastFinal: number;
  ventasReales: number;
  precision: number;
}

export default function ForecastingPage() {
  const { data: session, status } = useSession();
  const [forecastGeneral, setForecastGeneral] = useState<ForecastGeneral | null>(null);
  const [forecastVendedores, setForecastVendedores] = useState<ForecastVendedor[]>([]);
  const [factoresForecast, setFactoresForecast] = useState<FactorForecast[]>([]);
  const [forecastHistorico, setForecastHistorico] = useState<ForecastHistorico[]>([]);
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState('diciembre_2025');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchForecastingData();
  }, [periodoSeleccionado]);

  const fetchForecastingData = async () => {
    try {
      setLoading(true);
      
      // Simular data hasta que la API esté lista
      const mockForecastGeneral: ForecastGeneral = {
        mes: 'Diciembre',
        year: 2025,
        pipelineTotal: 89500000,
        probabilidadPonderada: 67200000,
        ventasProyectadas: 48,
        ingresosProyectados: 33600000,
        confianzaForecast: 89,
        metaVentas: 45,
        metaIngresos: 27000000,
        ultimaActualizacion: new Date()
      };

      const mockForecastVendedores: ForecastVendedor[] = [
        {
          vendedorId: '1',
          nombre: 'Carlos',
          apellido: 'Hernández',
          especialidad: 'SUVs Premium',
          metaIndividual: 9,
          forecastIndividual: 9,
          confianza: 92,
          ingresosProyectados: 6300000,
          comisionProyectada: 315000,
          leadsEnPipeline: 22,
          probabilidadPromedio: 78,
          estado: 'cumplira_meta'
        },
        {
          vendedorId: '2',
          nombre: 'María',
          apellido: 'González',
          especialidad: 'Autos Familiares',
          metaIndividual: 8,
          forecastIndividual: 8,
          confianza: 88,
          ingresosProyectados: 5200000,
          comisionProyectada: 260000,
          leadsEnPipeline: 18,
          probabilidadPromedio: 72,
          estado: 'cumplira_meta'
        },
        {
          vendedorId: '4',
          nombre: 'Pedro',
          apellido: 'Ramírez',
          especialidad: 'Sedanes',
          metaIndividual: 6,
          forecastIndividual: 6,
          confianza: 85,
          ingresosProyectados: 3600000,
          comisionProyectada: 162000,
          leadsEnPipeline: 12,
          probabilidadPromedio: 68,
          estado: 'cumplira_meta'
        },
        {
          vendedorId: '3',
          nombre: 'Ana',
          apellido: 'López',
          especialidad: 'Autos Compactos',
          metaIndividual: 4,
          forecastIndividual: 4,
          confianza: 68,
          ingresosProyectados: 2800000,
          comisionProyectada: 112000,
          leadsEnPipeline: 32,
          probabilidadPromedio: 45,
          estado: 'riesgo'
        }
      ];

      const mockFactores: FactorForecast[] = [
        {
          factor: 'Datos históricos (24 meses)',
          peso: 40,
          impacto: 'positivo',
          descripcion: 'Tendencias estacionales favorables para diciembre'
        },
        {
          factor: 'Pipeline actual robusto',
          peso: 35,
          impacto: 'positivo',
          descripcion: 'Alto número de leads en etapas avanzadas SPPC'
        },
        {
          factor: 'Rendimiento del equipo',
          peso: 15,
          impacto: 'positivo',
          descripcion: 'Mejora consistente en tasas de conversión'
        },
        {
          factor: 'Lanzamiento nuevo modelo SUV',
          peso: 8,
          impacto: 'positivo',
          descripcion: 'Incrementa demanda en segmento premium'
        },
        {
          factor: 'Competencia aumentó precios',
          peso: 2,
          impacto: 'positivo',
          descripcion: 'Ventaja competitiva temporal del 8%'
        }
      ];

      const mockHistorico: ForecastHistorico[] = [
        { mes: 'Jul', forecastInicial: 42, forecastFinal: 44, ventasReales: 43, precision: 95 },
        { mes: 'Ago', forecastInicial: 38, forecastFinal: 41, ventasReales: 40, precision: 97 },
        { mes: 'Sep', forecastInicial: 45, forecastFinal: 47, ventasReales: 46, precision: 98 },
        { mes: 'Oct', forecastInicial: 41, forecastFinal: 43, ventasReales: 44, precision: 97 },
        { mes: 'Nov', forecastInicial: 48, forecastFinal: 52, ventasReales: 52, precision: 100 },
        { mes: 'Dic*', forecastInicial: 45, forecastFinal: 48, ventasReales: 0, precision: 0 }
      ];

      setForecastGeneral(mockForecastGeneral);
      setForecastVendedores(mockForecastVendedores);
      setFactoresForecast(mockFactores);
      setForecastHistorico(mockHistorico);
      
    } catch (error) {
      console.error('Error fetching forecasting data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'superara_meta':
        return 'bg-emerald-100 text-emerald-800';
      case 'cumplira_meta':
        return 'bg-green-100 text-green-800';
      case 'riesgo':
        return 'bg-yellow-100 text-yellow-800';
      case 'critico':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'superara_meta':
        return <Award className="w-5 h-5 text-emerald-600" />;
      case 'cumplira_meta':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'riesgo':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'critico':
        return <TrendingDown className="w-5 h-5 text-red-600" />;
      default:
        return <Activity className="w-5 h-5 text-gray-600" />;
    }
  };

  const getImpactoColor = (impacto: string) => {
    switch (impacto) {
      case 'positivo':
        return 'text-green-600';
      case 'negativo':
        return 'text-red-600';
      case 'neutro':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
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
            🔮 Forecasting y Proyecciones de Ventas
          </h1>
          <p className="text-slate-600 mt-1">
            Predicciones inteligentes basadas en pipeline, históricos y tendencias del mercado
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={periodoSeleccionado} onValueChange={setPeriodoSeleccionado}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="diciembre_2025">Diciembre 2025</SelectItem>
              <SelectItem value="q1_2026">Q1 2026</SelectItem>
              <SelectItem value="semestre_2026">Semestre 2026</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            onClick={fetchForecastingData}
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Forecast General */}
      <Card className="relative overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Dashboard de Forecasting en Tiempo Real
              </CardTitle>
              <CardDescription>
                {forecastGeneral?.mes} {forecastGeneral?.year} - Proyección actualizada automáticamente
              </CardDescription>
            </div>
            <Badge className="bg-blue-100 text-blue-800">
              {forecastGeneral?.confianzaForecast}% Confianza
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="p-4 bg-blue-50 border border-blue-200 rounded-lg"
            >
              <div className="flex items-center gap-3 mb-2">
                <Target className="w-6 h-6 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-blue-800">Pipeline Total</p>
                  <p className="text-2xl font-bold text-blue-900">
                    ${(forecastGeneral?.pipelineTotal || 0).toLocaleString('es-MX', {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })}
                  </p>
                </div>
              </div>
              <p className="text-xs text-blue-600">
                Probabilidad ponderada: ${(forecastGeneral?.probabilidadPonderada || 0).toLocaleString('es-MX')}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="p-4 bg-green-50 border border-green-200 rounded-lg"
            >
              <div className="flex items-center gap-3 mb-2">
                <BarChart3 className="w-6 h-6 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-800">Ventas Proyectadas</p>
                  <p className="text-2xl font-bold text-green-900">
                    {forecastGeneral?.ventasProyectadas} autos
                  </p>
                </div>
              </div>
              <p className="text-xs text-green-600">
                Meta: {forecastGeneral?.metaVentas} autos ({Math.round(((forecastGeneral?.ventasProyectadas || 0) / (forecastGeneral?.metaVentas || 1)) * 100)}%)
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="p-4 bg-purple-50 border border-purple-200 rounded-lg"
            >
              <div className="flex items-center gap-3 mb-2">
                <DollarSign className="w-6 h-6 text-purple-600" />
                <div>
                  <p className="text-sm font-medium text-purple-800">Ingresos Proyectados</p>
                  <p className="text-2xl font-bold text-purple-900">
                    ${(forecastGeneral?.ingresosProyectados || 0).toLocaleString('es-MX', {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })}
                  </p>
                </div>
              </div>
              <p className="text-xs text-purple-600">
                🟢 Superará meta en {Math.round(((forecastGeneral?.ingresosProyectados || 0) / (forecastGeneral?.metaIngresos || 1) - 1) * 100)}%
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="p-4 bg-orange-50 border border-orange-200 rounded-lg"
            >
              <div className="flex items-center gap-3 mb-2">
                <Clock className="w-6 h-6 text-orange-600" />
                <div>
                  <p className="text-sm font-medium text-orange-800">Última Actualización</p>
                  <p className="text-lg font-bold text-orange-900">Tiempo real</p>
                </div>
              </div>
              <p className="text-xs text-orange-600">
                Actualizado: {forecastGeneral?.ultimaActualizacion?.toLocaleTimeString('es-ES')}
              </p>
            </motion.div>
          </div>

          {/* Progress hacia meta */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-slate-700">Progreso hacia Meta Mensual</p>
              <p className="text-sm font-semibold text-slate-800">
                {Math.round(((forecastGeneral?.ventasProyectadas || 0) / (forecastGeneral?.metaVentas || 1)) * 100)}%
              </p>
            </div>
            <Progress 
              value={Math.min(((forecastGeneral?.ventasProyectadas || 0) / (forecastGeneral?.metaVentas || 1)) * 100, 100)} 
              className="h-3" 
            />
          </div>
        </CardContent>
      </Card>

      {/* Forecast por Vendedor */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Forecast Individual por Vendedor
          </CardTitle>
          <CardDescription>
            Proyecciones personalizadas basadas en pipeline y rendimiento histórico
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {forecastVendedores.map((vendedor, index) => (
              <motion.div
                key={vendedor.vendedorId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="p-6 border rounded-lg hover:shadow-lg transition-all"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {getEstadoIcon(vendedor.estado)}
                    <div>
                      <h3 className="font-semibold text-lg">
                        {vendedor.nombre} {vendedor.apellido}
                      </h3>
                      <p className="text-sm text-slate-600">{vendedor.especialidad}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={getEstadoColor(vendedor.estado)}>
                      {vendedor.estado === 'superara_meta' ? '🚀 Superará Meta' :
                       vendedor.estado === 'cumplira_meta' ? '✅ Cumplirá Meta' :
                       vendedor.estado === 'riesgo' ? '⚠️ En Riesgo' :
                       '🚨 Crítico'}
                    </Badge>
                    <p className="text-sm text-slate-500 mt-1">
                      {vendedor.confianza}% confianza
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-slate-500">Forecast vs Meta</p>
                    <p className="font-semibold text-lg">
                      {vendedor.forecastIndividual}/{vendedor.metaIndividual} autos
                    </p>
                    <p className={`text-xs ${
                      vendedor.forecastIndividual >= vendedor.metaIndividual ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {Math.round((vendedor.forecastIndividual / vendedor.metaIndividual) * 100)}% de cumplimiento
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Ingresos Proyectados</p>
                    <p className="font-semibold text-lg">
                      ${vendedor.ingresosProyectados.toLocaleString('es-MX', {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })}
                    </p>
                    <p className="text-xs text-slate-600">
                      Comisión: ${vendedor.comisionProyectada.toLocaleString('es-MX')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Leads en Pipeline</p>
                    <p className="font-semibold text-lg">{vendedor.leadsEnPipeline}</p>
                    <p className={`text-xs ${
                      vendedor.leadsEnPipeline > 30 ? 'text-red-600' :
                      vendedor.leadsEnPipeline > 20 ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>
                      {vendedor.leadsEnPipeline > 30 ? 'Sobrecargado' :
                       vendedor.leadsEnPipeline > 20 ? 'Carga alta' :
                       'Carga normal'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Prob. Promedio</p>
                    <p className="font-semibold text-lg">{vendedor.probabilidadPromedio}%</p>
                    <p className={`text-xs ${
                      vendedor.probabilidadPromedio >= 70 ? 'text-green-600' :
                      vendedor.probabilidadPromedio >= 50 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {vendedor.probabilidadPromedio >= 70 ? 'Excelente' :
                       vendedor.probabilidadPromedio >= 50 ? 'Bueno' :
                       'Necesita mejora'}
                    </p>
                  </div>
                </div>

                <div className="mb-3">
                  <p className="text-xs text-slate-500 mb-1">Progreso hacia Meta</p>
                  <Progress 
                    value={Math.min((vendedor.forecastIndividual / vendedor.metaIndividual) * 100, 100)} 
                    className="h-2" 
                  />
                </div>

                {vendedor.estado === 'riesgo' && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-600" />
                      <p className="text-sm font-medium text-yellow-800">Recomendación</p>
                    </div>
                    <p className="text-xs text-yellow-700 mt-1">
                      Considerar redistribución de leads y coaching intensivo
                    </p>
                  </div>
                )}

                {vendedor.estado === 'cumplira_meta' && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <p className="text-sm font-medium text-green-800">Estado Óptimo</p>
                    </div>
                    <p className="text-xs text-green-700 mt-1">
                      En camino de cumplir meta con probabilidad alta
                    </p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Factores del Forecast */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Factores que Influyen en el Forecast
            </CardTitle>
            <CardDescription>
              Algoritmo de predicción inteligente con múltiples variables
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {factoresForecast.map((factor, index) => (
                <motion.div
                  key={factor.factor}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h5 className="font-medium text-sm">{factor.factor}</h5>
                      <Badge variant="outline" className={getImpactoColor(factor.impacto)}>
                        {factor.impacto === 'positivo' ? '↗️' :
                         factor.impacto === 'negativo' ? '↘️' :
                         '→'}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-600">{factor.descripcion}</p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="font-bold text-lg">{factor.peso}%</p>
                    <p className="text-xs text-slate-500">peso</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-5 h-5 text-blue-600" />
                <h5 className="font-semibold text-blue-800">Cómo funciona el algoritmo</h5>
              </div>
              <p className="text-sm text-blue-700">
                El sistema combina datos históricos (40%), pipeline actual (35%), 
                rendimiento del equipo (15%) y factores externos (10%) para generar 
                proyecciones con 89% de precisión promedio.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Precisión Histórica */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Precisión Histórica del Forecast
            </CardTitle>
            <CardDescription>
              Track record de exactitud en proyecciones pasadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={forecastHistorico.filter(item => item.mes !== 'Dic*')}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="forecastInicial" fill="#E5E7EB" name="Forecast Inicial" />
                  <Bar dataKey="forecastFinal" fill="#3B82F6" name="Forecast Final" />
                  <Bar dataKey="ventasReales" fill="#10B981" name="Ventas Reales" />
                  <Line type="monotone" dataKey="precision" stroke="#F59E0B" strokeWidth={2} name="Precisión %" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">97%</p>
                <p className="text-xs text-slate-600">Precisión Promedio</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">±2.1</p>
                <p className="text-xs text-slate-600">Desviación Promedio</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">89%</p>
                <p className="text-xs text-slate-600">Confianza Actual</p>
              </div>
            </div>

            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <h5 className="font-semibold text-green-800">Historial Exitoso</h5>
              </div>
              <p className="text-sm text-green-700">
                Los últimos 6 meses muestran una precisión excepcional del 97%. 
                El sistema se ha vuelto más preciso con más datos históricos.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerta de Oportunidad */}
      {((forecastGeneral?.ventasProyectadas || 0) / (forecastGeneral?.metaVentas || 1)) > 1.15 && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-green-800 mb-1">
                  🚀 Oportunidad de Récord Mensual Detectada
                </h3>
                <p className="text-green-700 mb-2">
                  El forecast indica que superarás la meta en {Math.round(((forecastGeneral?.ventasProyectadas || 0) / (forecastGeneral?.metaVentas || 1) - 1) * 100)}%. 
                  Es una excelente oportunidad para establecer un nuevo récord de agencia.
                </p>
                <p className="text-sm text-green-600">
                  💡 <strong>Acción sugerida:</strong> Considera incentivos especiales para el equipo 
                  para maximizar el momentum y cerrar aún más ventas este mes.
                </p>
              </div>
              <Button className="bg-green-600 hover:bg-green-700">
                Ver Estrategias
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
