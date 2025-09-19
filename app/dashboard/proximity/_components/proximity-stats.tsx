
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Clock,
  MapPin,
  Activity,
  Users,
  Target,
  Zap,
  Calendar,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface ProximityStatsProps {
  estadoSistema: any;
}

export default function ProximityStats({ estadoSistema }: ProximityStatsProps) {
  const [estadisticas, setEstadisticas] = useState<any>(null);

  /**
   * Procesar estadísticas del estado del sistema
   */
  useEffect(() => {
    if (estadoSistema) {
      procesarEstadisticas();
    }
  }, [estadoSistema]);

  /**
   * Procesar y formatear estadísticas
   */
  const procesarEstadisticas = () => {
    const sistema = estadoSistema.estadoSistema || {};
    const detalles = estadoSistema.estadisticasDetalladas || {};

    const stats = {
      resumen: {
        zonasActivas: sistema.zonasActivas || 0,
        vendedoresActivos: sistema.vendedoresActivos || 0,
        grabacionesActivas: sistema.grabacionesActivas || 0,
        grabacionesHoy: sistema.grabacionesHoy || 0,
      },
      tendencia: detalles.tendencia || {
        grabacionesHoy: 0,
        grabacionesAyer: 0,
        cambio: 0,
      },
      zonasConActividad: detalles.zonasConActividad || [],
      rendimiento: sistema.rendimiento || {
        grabacionesCompletadas: 0,
        tasaExito: 0,
      },
      errores: detalles.erroresHoy || 0,
    };

    setEstadisticas(stats);
  };

  /**
   * Obtener color de tendencia
   */
  const obtenerColorTendencia = (cambio: number) => {
    if (cambio > 0) return 'text-green-600';
    if (cambio < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  /**
   * Obtener icono de tendencia
   */
  const obtenerIconoTendencia = (cambio: number) => {
    if (cambio > 0) return <TrendingUp className="w-4 h-4" />;
    if (cambio < 0) return <TrendingDown className="w-4 h-4" />;
    return <Activity className="w-4 h-4" />;
  };

  if (!estadisticas) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <MapPin className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-600">
                    {estadisticas.resumen.zonasActivas}
                  </p>
                  <p className="text-sm text-gray-600">Zonas Activas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">
                    {estadisticas.resumen.vendedoresActivos}
                  </p>
                  <p className="text-sm text-gray-600">Vendedores Activos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Activity className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-orange-600">
                    {estadisticas.resumen.grabacionesActivas}
                  </p>
                  <p className="text-sm text-gray-600">Grabando Ahora</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Calendar className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-600">
                    {estadisticas.resumen.grabacionesHoy}
                  </p>
                  <p className="text-sm text-gray-600">Grabaciones Hoy</p>
                  <div className={`flex items-center gap-1 text-xs ${obtenerColorTendencia(estadisticas.tendencia.cambio)}`}>
                    {obtenerIconoTendencia(estadisticas.tendencia.cambio)}
                    <span>
                      {estadisticas.tendencia.cambio > 0 ? '+' : ''}{estadisticas.tendencia.cambio}% vs ayer
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Métricas de rendimiento */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="w-5 h-5" />
                Rendimiento del Sistema
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm">Tasa de Éxito</span>
                  <span className="text-sm font-medium">
                    {estadisticas.rendimiento.tasaExito}%
                  </span>
                </div>
                <Progress value={estadisticas.rendimiento.tasaExito} className="h-2" />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm">Grabaciones Completadas</span>
                  <Badge variant="secondary">
                    {estadisticas.rendimiento.grabacionesCompletadas}
                  </Badge>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm">Errores Hoy</span>
                  <Badge variant={estadisticas.errores > 0 ? 'destructive' : 'secondary'}>
                    {estadisticas.errores}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Zonas Más Activas
              </CardTitle>
              <CardDescription>Últimos 7 días</CardDescription>
            </CardHeader>
            <CardContent>
              {estadisticas.zonasConActividad.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  No hay actividad registrada en los últimos 7 días
                </p>
              ) : (
                <div className="space-y-3">
                  {estadisticas.zonasConActividad.slice(0, 5).map((zona: any, index: number) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{zona.zona}</p>
                        <p className="text-xs text-gray-500 capitalize">
                          {zona.tipo} • Promedio: {zona.tiempoPromedioMinutos}min
                        </p>
                      </div>
                      <Badge variant="secondary">
                        {zona._count.id} grabaciones
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Gráficos de tendencias - Placeholder para futuras implementaciones */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.6 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Tendencias de Uso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {estadisticas.tendencia.grabacionesHoy}
                </p>
                <p className="text-sm text-gray-600">Grabaciones Hoy</p>
              </div>

              <div className="text-center">
                <p className="text-2xl font-bold text-gray-600">
                  {estadisticas.tendencia.grabacionesAyer}
                </p>
                <p className="text-sm text-gray-600">Grabaciones Ayer</p>
              </div>

              <div className="text-center">
                <p className={`text-2xl font-bold ${obtenerColorTendencia(estadisticas.tendencia.cambio)}`}>
                  {estadisticas.tendencia.cambio > 0 ? '+' : ''}{estadisticas.tendencia.cambio}%
                </p>
                <p className="text-sm text-gray-600">Cambio</p>
              </div>
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-center text-sm text-gray-600">
                📊 Los gráficos detallados de tendencias se implementarán en la siguiente fase
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Resumen de la semana */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.7 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Resumen Semanal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-lg font-semibold text-green-600">
                  {Math.round(estadisticas.rendimiento.tasaExito)}%
                </p>
                <p className="text-xs text-gray-600">Tasa de Éxito</p>
              </div>

              <div>
                <p className="text-lg font-semibold text-blue-600">
                  {estadisticas.resumen.zonasActivas}
                </p>
                <p className="text-xs text-gray-600">Zonas Configuradas</p>
              </div>

              <div>
                <p className="text-lg font-semibold text-purple-600">
                  {estadisticas.resumen.vendedoresActivos}
                </p>
                <p className="text-xs text-gray-600">Vendedores Activos</p>
              </div>

              <div>
                <p className="text-lg font-semibold text-orange-600">
                  {estadisticas.rendimiento.grabacionesCompletadas}
                </p>
                <p className="text-xs text-gray-600">Total Grabaciones</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
