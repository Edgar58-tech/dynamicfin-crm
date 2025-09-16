
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
  ArrowRight
} from 'lucide-react';
import { motion } from 'framer-motion';

interface KPIs {
  optimizaciones: number;
  utilidadPromedio: number;
  metaMensual: number;
  vendedoresActivos: number;
  tasaConversion: number;
  prospectosProcesados: number;
  ventasRealizadas: number;
}

interface ProspectosSummary {
  elite: number;
  calificado: number;
  amadurar: number;
  explorador: number;
  total: number;
}

interface Actividad {
  id: number;
  fecha: string;
  hora: string;
  tipo: string;
  prospecto: {
    nombre: string;
    apellido: string;
    clasificacion: string;
    sppc: number;
  };
  vendedorAsignado: string;
  comentarios: string;
  estado: string;
}

interface DashboardData {
  prospectosSummary: ProspectosSummary;
  kpis: KPIs;
  recentProspectos: any[];
  proximasActividades?: Actividad[];
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  if (status === 'loading') {
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

  if (!session) {
    return null;
  }

  const fetchData = async () => {
    try {
      const response = await fetch('/api/dashboard/stats');
      if (response.ok) {
        const dashboardData = await response.json();
        setData(dashboardData);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
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

  const getClassificationColor = (classification: string) => {
    switch (classification) {
      case 'Elite':
        return 'bg-emerald-100 text-emerald-800';
      case 'Calificado':
        return 'bg-blue-100 text-blue-800';
      case 'A Madurar':
        return 'bg-amber-100 text-amber-800';
      case 'Explorador':
        return 'bg-slate-100 text-slate-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">
            Panel de Control
          </h1>
          <p className="text-slate-600 mt-1">
            Sistema de Perfilamiento y Potencial de Cliente (SPPC)
          </p>
        </div>
        <Button 
          onClick={fetchData}
          variant="outline"
          className="gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Actualizar
        </Button>
      </div>

      {/* KPI Cards */}
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
                    Optimizaciones
                  </p>
                  <motion.p 
                    className="text-2xl font-bold text-slate-800"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8 }}
                  >
                    {data?.kpis?.optimizaciones || 0}
                  </motion.p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Target className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div className="flex items-center mt-4 text-sm">
                <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-green-600 font-medium">+12%</span>
                <span className="text-slate-500 ml-2">vs mes anterior</span>
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
                    Utilidad Promedio
                  </p>
                  <motion.p 
                    className="text-2xl font-bold text-slate-800"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8 }}
                  >
                    ${Number(data?.kpis?.utilidadPromedio || 0).toLocaleString('es-MX', {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })}
                  </motion.p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <div className="flex items-center mt-4 text-sm">
                <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-green-600 font-medium">+8%</span>
                <span className="text-slate-500 ml-2">vs mes anterior</span>
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
                    Meta Mensual
                  </p>
                  <motion.p 
                    className="text-2xl font-bold text-slate-800"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8 }}
                  >
                    {data?.kpis?.ventasRealizadas || 0}/{data?.kpis?.metaMensual || 0}
                  </motion.p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <div className="flex items-center mt-4 text-sm">
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div 
                    className="bg-purple-600 h-2 rounded-full transition-all duration-1000"
                    style={{ 
                      width: `${Math.min(
                        ((data?.kpis?.ventasRealizadas || 0) / (data?.kpis?.metaMensual || 1)) * 100, 
                        100
                      )}%` 
                    }}
                  ></div>
                </div>
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
                    Vendedores Activos
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
                  {data?.kpis?.tasaConversion ? Number(data.kpis.tasaConversion).toFixed(1) : '0.0'}% conversión
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Próximas Actividades */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Próximas Actividades - Hoy
              </CardTitle>
              <CardDescription>
                Actividades programadas para hoy {new Date().toLocaleDateString('es-ES')}
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <a href="/dashboard/calendario">
                Ver Todas
                <ArrowRight className="w-4 h-4 ml-2" />
              </a>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              {
                id: 1,
                hora: '06:00',
                tipo: 'Llamada',
                prospecto: { nombre: 'María', apellido: 'Rodríguez', clasificacion: 'Elite', sppc: 92.5 },
                vendedorAsignado: 'Carlos Venta',
                comentarios: 'Seguimiento prioritario para cierre'
              },
              {
                id: 2,
                hora: '10:30',
                tipo: 'Email',
                prospecto: { nombre: 'José', apellido: 'Martínez', clasificacion: 'Calificado', sppc: 78.3 },
                vendedorAsignado: 'Lucía Ventas',
                comentarios: 'Envío de propuesta personalizada'
              },
              {
                id: 3,
                hora: '14:00',
                tipo: 'Reunión',
                prospecto: { nombre: 'Ana', apellido: 'García', clasificacion: 'A Madurar', sppc: 65.2 },
                vendedorAsignado: 'Miguel Sales',
                comentarios: 'Reunión presencial en showroom'
              }
            ].map((actividad, index) => (
              <motion.div
                key={actividad.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    actividad.tipo === 'Llamada' ? 'bg-blue-100' :
                    actividad.tipo === 'Email' ? 'bg-green-100' :
                    actividad.tipo === 'Reunión' ? 'bg-purple-100' :
                    actividad.tipo === 'WhatsApp' ? 'bg-emerald-100' :
                    actividad.tipo === 'Visita' ? 'bg-orange-100' : 'bg-slate-100'
                  }`}>
                    {actividad.tipo === 'Llamada' ? <Phone className="w-4 h-4" /> :
                     actividad.tipo === 'Email' ? <Mail className="w-4 h-4" /> :
                     actividad.tipo === 'Reunión' ? <User className="w-4 h-4" /> :
                     actividad.tipo === 'WhatsApp' ? <MessageSquare className="w-4 h-4" /> :
                     actividad.tipo === 'Visita' ? <MapPin className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-slate-800">
                        {actividad.prospecto.nombre} {actividad.prospecto.apellido}
                      </span>
                      <Badge className={getClassificationColor(actividad.prospecto.clasificacion)}>
                        {actividad.prospecto.clasificacion}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600">
                      {actividad.comentarios}
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="flex items-center gap-1 text-sm font-medium text-slate-800 mb-1">
                    <Clock className="w-4 h-4" />
                    {actividad.hora}
                  </div>
                  <p className="text-xs text-slate-500">{actividad.vendedorAsignado}</p>
                </div>
              </motion.div>
            ))}
            
            {/* No hay actividades */}
            {([].length === 0) && (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-500">No tienes actividades programadas para hoy</p>
                <Button variant="outline" size="sm" className="mt-2" asChild>
                  <a href="/dashboard/calendario">
                    Ver Calendario Completo
                  </a>
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Charts and Data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Prospect Classification */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Clasificación SPPC
            </CardTitle>
            <CardDescription>
              Distribución de prospectos por nivel de calificación
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Elite</span>
                  <Badge className={getClassificationColor('Elite')}>
                    {data?.prospectosSummary?.elite || 0}
                  </Badge>
                </div>
              </div>
              
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Calificado</span>
                  <Badge className={getClassificationColor('Calificado')}>
                    {data?.prospectosSummary?.calificado || 0}
                  </Badge>
                </div>
              </div>
              
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">A Madurar</span>
                  <Badge className={getClassificationColor('A Madurar')}>
                    {data?.prospectosSummary?.amadurar || 0}
                  </Badge>
                </div>
              </div>
              
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Explorador</span>
                  <Badge className={getClassificationColor('Explorador')}>
                    {data?.prospectosSummary?.explorador || 0}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold">Total Prospectos</span>
                <span className="text-2xl font-bold text-slate-800">
                  {data?.prospectosSummary?.total || 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Actividad Reciente
            </CardTitle>
            <CardDescription>
              Últimos prospectos procesados en el sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data?.recentProspectos?.slice(0, 5)?.map((prospecto, index) => (
                <div key={prospecto.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-slate-800">
                      {prospecto.nombre} {prospecto.apellido}
                    </p>
                    <p className="text-sm text-slate-500">
                      {prospecto.agencia?.nombreAgencia} • {prospecto.vendedor?.nombre}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getClassificationColor(prospecto.clasificacion || '')}>
                      {prospecto.clasificacion}
                    </Badge>
                    <span className="text-sm font-medium text-slate-600">
                      {prospecto.calificacionTotal ? Number(prospecto.calificacionTotal).toFixed(1) : '0.0'}%
                    </span>
                  </div>
                </div>
              )) || (
                <p className="text-center text-slate-500 py-8">
                  No hay prospectos recientes
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
