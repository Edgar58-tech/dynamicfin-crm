
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  Target, 
  DollarSign, 
  Users, 
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  BarChart3,
  PieChart,
  Calendar,
  Clock,
  Phone,
  Mail,
  User,
  MapPin,
  MessageSquare,
  ArrowRight,
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingDown
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface KPIsGerenciales {
  pipelineTotal: number;
  forecastMensual: number;
  metaMensual: number;
  vendedoresActivos: number;
  tasaConversionEquipo: number;
  ingresosProyectados: number;
  comisionesEquipo: number;
  leadsNuevos: number;
  leadsCriticos: number;
}

interface RendimientoVendedor {
  id: string;
  nombre: string;
  apellido: string;
  especialidad: string;
  metaAutos: number;
  autosVendidos: number;
  porcentajeCumplimiento: number;
  leadsActivos: number;
  tasaConversion: number;
  ingresosMes: number;
  estado: 'excelente' | 'bueno' | 'necesita_coaching';
}

interface AlertaGerencial {
  id: number;
  tipo: 'lead_critico' | 'sobrecarga_vendedor' | 'meta_riesgo' | 'oportunidad';
  prioridad: 'alta' | 'media' | 'baja';
  titulo: string;
  mensaje: string;
  vendedor?: string;
  accion: string;
  fechaCreacion: string;
  leida: boolean;
}

export default function DashboardGerencialPage() {
  const { data: session, status } = useSession();
  const [data, setData] = useState<{
    kpis: KPIsGerenciales;
    vendedores: RendimientoVendedor[];
    alertas: AlertaGerencial[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('mes_actual');

  useEffect(() => {
    fetchDashboardData();
  }, [selectedPeriod]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Simular data hasta que la API esté lista
      const mockData = {
        kpis: {
          pipelineTotal: 89500000,
          forecastMensual: 33600000,
          metaMensual: 27000000,
          vendedoresActivos: 8,
          tasaConversionEquipo: 18.5,
          ingresosProyectados: 36800000,
          comisionesEquipo: 1680000,
          leadsNuevos: 45,
          leadsCriticos: 12
        },
        vendedores: [
          {
            id: '1',
            nombre: 'Carlos',
            apellido: 'Hernández',
            especialidad: 'SUVs Premium',
            metaAutos: 8,
            autosVendidos: 8,
            porcentajeCumplimiento: 100,
            leadsActivos: 22,
            tasaConversion: 28,
            ingresosMes: 5840000,
            estado: 'excelente' as const
          },
          {
            id: '2',
            nombre: 'María',
            apellido: 'González',
            especialidad: 'Autos Familiares',
            metaAutos: 6,
            autosVendidos: 7,
            porcentajeCumplimiento: 117,
            leadsActivos: 18,
            tasaConversion: 22,
            ingresosMes: 4950000,
            estado: 'excelente' as const
          },
          {
            id: '3',
            nombre: 'Ana',
            apellido: 'López',
            especialidad: 'Autos Compactos',
            metaAutos: 5,
            autosVendidos: 2,
            porcentajeCumplimiento: 40,
            leadsActivos: 32,
            tasaConversion: 8,
            ingresosMes: 1280000,
            estado: 'necesita_coaching' as const
          },
          {
            id: '4',
            nombre: 'Pedro',
            apellido: 'Ramírez',
            especialidad: 'Sedanes',
            metaAutos: 4,
            autosVendidos: 5,
            porcentajeCumplimiento: 125,
            leadsActivos: 12,
            tasaConversion: 15,
            ingresosMes: 2150000,
            estado: 'bueno' as const
          }
        ],
        alertas: [
          {
            id: 1,
            tipo: 'lead_critico' as const,
            prioridad: 'alta' as const,
            titulo: 'Lead Premium sin seguimiento',
            mensaje: 'Roberto Martínez - Empresario constructor - $750,000 - Sin contacto hace 3 días',
            vendedor: 'Ana López',
            accion: 'Reasignar a Carlos Hernández',
            fechaCreacion: new Date().toISOString(),
            leida: false
          },
          {
            id: 2,
            tipo: 'sobrecarga_vendedor' as const,
            prioridad: 'media' as const,
            titulo: 'Vendedor sobrecargado',
            mensaje: 'Ana López tiene 32 leads activos con conversión del 8%',
            vendedor: 'Ana López',
            accion: 'Redistribuir leads y coaching',
            fechaCreacion: new Date().toISOString(),
            leida: false
          },
          {
            id: 3,
            tipo: 'oportunidad' as const,
            prioridad: 'alta' as const,
            titulo: 'Vendedor con capacidad disponible',
            mensaje: 'Carlos Hernández tiene solo 22 leads activos con 28% conversión',
            vendedor: 'Carlos Hernández',
            accion: 'Asignar más leads premium',
            fechaCreacion: new Date().toISOString(),
            leida: false
          }
        ]
      };
      
      setData(mockData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'excelente':
        return 'bg-green-100 text-green-800';
      case 'bueno':
        return 'bg-blue-100 text-blue-800';
      case 'necesita_coaching':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPrioridadIcon = (prioridad: string) => {
    switch (prioridad) {
      case 'alta':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'media':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'baja':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  if (status === 'loading' || loading) {
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
      </div>
    );
  }

  if (!session || session.user.rol !== 'GERENTE_VENTAS') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-slate-600">Acceso restringido a gerentes de ventas únicamente</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Gerencial */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            👔 Dashboard Gerencial
          </h1>
          <p className="text-slate-600 mt-1">
            Centro de Comando - Agencia Automotriz {session.user.agencia?.nombreAgencia}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mes_actual">Este Mes</SelectItem>
              <SelectItem value="trimestre">Trimestre</SelectItem>
              <SelectItem value="year">Año</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            onClick={fetchDashboardData}
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* KPIs Gerenciales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="relative overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">
                    Pipeline Total Agencia
                  </p>
                  <motion.p 
                    className="text-2xl font-bold text-slate-800"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8 }}
                  >
                    ${(data?.kpis?.pipelineTotal || 0).toLocaleString('es-MX', {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })}
                  </motion.p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Target className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div className="flex items-center mt-4 text-sm">
                <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-green-600 font-medium">
                  {data?.kpis?.leadsCriticos || 0} leads críticos
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="relative overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">
                    Forecast Mensual
                  </p>
                  <motion.p 
                    className="text-2xl font-bold text-slate-800"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8 }}
                  >
                    ${(data?.kpis?.forecastMensual || 0).toLocaleString('es-MX', {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })}
                  </motion.p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <div className="flex items-center mt-4 text-sm">
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full transition-all duration-1000"
                    style={{ 
                      width: `${Math.min(
                        ((data?.kpis?.forecastMensual || 0) / (data?.kpis?.metaMensual || 1)) * 100, 
                        100
                      )}%` 
                    }}
                  ></div>
                </div>
                <span className="ml-2 text-xs text-slate-600">
                  {((data?.kpis?.forecastMensual || 0) / (data?.kpis?.metaMensual || 1) * 100).toFixed(0)}%
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="relative overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">
                    Comisiones Equipo
                  </p>
                  <motion.p 
                    className="text-2xl font-bold text-slate-800"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8 }}
                  >
                    ${(data?.kpis?.comisionesEquipo || 0).toLocaleString('es-MX', {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })}
                  </motion.p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <div className="flex items-center mt-4 text-sm">
                <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-green-600 font-medium">+23%</span>
                <span className="text-slate-500 ml-2">vs mes anterior</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="relative overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">
                    Equipo de Ventas
                  </p>
                  <motion.p 
                    className="text-2xl font-bold text-slate-800"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8 }}
                  >
                    {data?.kpis?.vendedoresActivos || 0}
                  </motion.p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-orange-600" />
                </div>
              </div>
              <div className="flex items-center mt-4 text-sm">
                <Activity className="w-4 h-4 text-slate-500 mr-1" />
                <span className="text-slate-600">
                  {data?.kpis?.tasaConversionEquipo?.toFixed(1) || '0.0'}% conversión equipo
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Alertas Críticas */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Alertas Gerenciales - Requieren Acción Inmediata
              </CardTitle>
              <CardDescription>
                Situaciones que necesitan tu intervención como gerente
              </CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <CheckCircle className="w-4 h-4 mr-2" />
              Marcar Todas como Leídas
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data?.alertas?.map((alerta, index) => (
              <motion.div
                key={alerta.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`flex items-center justify-between p-4 border-l-4 rounded-lg ${
                  alerta.prioridad === 'alta' ? 'border-red-500 bg-red-50' :
                  alerta.prioridad === 'media' ? 'border-yellow-500 bg-yellow-50' :
                  'border-green-500 bg-green-50'
                } transition-all hover:shadow-md`}
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center">
                    {getPrioridadIcon(alerta.prioridad)}
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-slate-800">
                        {alerta.titulo}
                      </span>
                      <Badge variant="outline">
                        {alerta.vendedor}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600 mb-2">
                      {alerta.mensaje}
                    </p>
                    <p className="text-xs text-slate-500">
                      💡 Acción sugerida: {alerta.accion}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline">
                    Ver Detalles
                  </Button>
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                    Tomar Acción
                  </Button>
                </div>
              </motion.div>
            )) || (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                <p className="text-slate-500">No hay alertas críticas en este momento</p>
                <p className="text-sm text-slate-400 mt-1">Tu equipo está funcionando correctamente</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Rendimiento del Equipo */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Rendimiento del Equipo de Ventas
              </CardTitle>
              <CardDescription>
                Métricas individuales y estado de cada vendedor automotriz
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <a href="/dashboard/gerente/coaching">
                  💡 Coaching
                </a>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a href="/dashboard/gerente/reasignacion">
                  🔄 Reasignar Leads
                </a>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {data?.vendedores?.map((vendedor, index) => (
              <motion.div
                key={vendedor.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="p-6 border rounded-lg hover:shadow-lg transition-all"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg text-slate-800">
                      {vendedor.nombre} {vendedor.apellido}
                    </h3>
                    <p className="text-sm text-slate-600">{vendedor.especialidad}</p>
                  </div>
                  <Badge className={getEstadoColor(vendedor.estado)}>
                    {vendedor.estado === 'excelente' ? '🏆 Excelente' :
                     vendedor.estado === 'bueno' ? '✅ Bueno' :
                     '⚠️ Necesita Coaching'}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-slate-500">Meta vs Vendido</p>
                    <p className="font-semibold">
                      {vendedor.autosVendidos}/{vendedor.metaAutos} autos
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Cumplimiento</p>
                    <p className={`font-semibold ${
                      vendedor.porcentajeCumplimiento >= 100 ? 'text-green-600' :
                      vendedor.porcentajeCumplimiento >= 80 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {vendedor.porcentajeCumplimiento}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Leads Activos</p>
                    <p className="font-semibold">{vendedor.leadsActivos}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Conversión</p>
                    <p className="font-semibold">{vendedor.tasaConversion}%</p>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-xs text-slate-500 mb-1">Ingresos del Mes</p>
                  <p className="font-bold text-slate-800">
                    ${vendedor.ingresosMes.toLocaleString('es-MX', {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" className="flex-1">
                    Ver Pipeline
                  </Button>
                  {vendedor.estado === 'necesita_coaching' && (
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                      💡 Coaching
                    </Button>
                  )}
                </div>
              </motion.div>
            )) || (
              <p className="text-center text-slate-500 py-8 col-span-2">
                No hay datos de vendedores disponibles
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
