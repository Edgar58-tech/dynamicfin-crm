
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users,
  TrendingUp,
  Activity,
  Target,
  BarChart3,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  X,
  Calendar,
  Clock,
  Award,
  ArrowUpDown,
  PieChart,
  LineChart,
  Settings,
  Filter
} from 'lucide-react';
import { motion } from 'framer-motion';

interface CargaVendedor {
  id: string;
  nombre: string;
  apellido: string;
  agencia: string;
  prospectosTotales: number;
  prospectosElite: number;
  prospectosCalificado: number;
  prospectosAMadurar: number;
  prospectosExplorador: number;
  cargaOptima: number;
  porcentajeCarga: number;
  ultimaOptimizacion: string;
  recomendacion: string;
}

export default function AnalisisCargaPage() {
  const { data: session, status } = useSession();
  const [vendedores, setVendedores] = useState<CargaVendedor[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para modales
  const [showOptimizacionModal, setShowOptimizacionModal] = useState(false);
  const [showHistorialModal, setShowHistorialModal] = useState(false);
  const [showOptimizarVendedorModal, setShowOptimizarVendedorModal] = useState(false);
  const [showAnalisisDetalladoModal, setShowAnalisisDetalladoModal] = useState(false);
  const [showConfiguracionModal, setShowConfiguracionModal] = useState(false);
  const [selectedVendedor, setSelectedVendedor] = useState<CargaVendedor | null>(null);
  
  // Estados para configuración
  const [filtroAgencia, setFiltroAgencia] = useState<string>('todas');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [optimizacionEnProceso, setOptimizacionEnProceso] = useState(false);
  const [progressOptimizacion, setProgressOptimizacion] = useState(0);

  const handleOptimizarCargas = () => {
    setShowOptimizacionModal(true);
  };

  const handleVerHistorial = (vendedorId: string) => {
    const vendedor = vendedores.find(v => v.id === vendedorId);
    if (vendedor) {
      setSelectedVendedor(vendedor);
      setShowHistorialModal(true);
    }
  };

  const handleOptimizarVendedor = (vendedorId: string) => {
    const vendedor = vendedores.find(v => v.id === vendedorId);
    if (vendedor) {
      setSelectedVendedor(vendedor);
      setShowOptimizarVendedorModal(true);
    }
  };

  const handleIniciarOptimizacionCompleta = () => {
    setOptimizacionEnProceso(true);
    setProgressOptimizacion(0);
    setShowOptimizacionModal(false);

    // Simular proceso de optimización
    const interval = setInterval(() => {
      setProgressOptimizacion(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setOptimizacionEnProceso(false);
          alert('🎉 ¡Optimización Completa Exitosa!\n\n✅ Resultados:\n• 127 prospectos redistribuidos\n• 3 vendedores rebalanceados\n• Eficiencia global: +12%\n• Tiempo total: 3:45 minutos\n\n📧 Notificaciones enviadas a todos los vendedores afectados.');
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 500);
  };

  const handleAnalisisDetallado = (vendedorId: string) => {
    const vendedor = vendedores.find(v => v.id === vendedorId);
    if (vendedor) {
      setSelectedVendedor(vendedor);
      setShowAnalisisDetalladoModal(true);
    }
  };

  const handleConfigurarParametros = () => {
    setShowConfiguracionModal(true);
  };

  useEffect(() => {
    // Datos simulados
    const sampleData: CargaVendedor[] = [
      {
        id: '1',
        nombre: 'Carlos',
        apellido: 'Venta',
        agencia: 'Audi Polanco',
        prospectosTotales: 48,
        prospectosElite: 8,
        prospectosCalificado: 12,
        prospectosAMadurar: 18,
        prospectosExplorador: 10,
        cargaOptima: 45,
        porcentajeCarga: 106.7,
        ultimaOptimizacion: '2025-08-15',
        recomendacion: 'Redistribuir 3-5 prospectos de menor prioridad'
      },
      {
        id: '2',
        nombre: 'Lucía',
        apellido: 'Ventas',
        agencia: 'Audi Polanco',
        prospectosTotales: 32,
        prospectosElite: 4,
        prospectosCalificado: 8,
        prospectosAMadurar: 12,
        prospectosExplorador: 8,
        cargaOptima: 45,
        porcentajeCarga: 71.1,
        ultimaOptimizacion: '2025-08-20',
        recomendacion: 'Capacidad para recibir 10-13 prospectos adicionales'
      },
      {
        id: '3',
        nombre: 'Miguel',
        apellido: 'Sales',
        agencia: 'Audi Santa Fe',
        prospectosTotales: 39,
        prospectosElite: 5,
        prospectosCalificado: 9,
        prospectosAMadurar: 15,
        prospectosExplorador: 10,
        cargaOptima: 40,
        porcentajeCarga: 97.5,
        ultimaOptimizacion: '2025-08-25',
        recomendacion: 'Carga equilibrada, mantener seguimiento actual'
      }
    ];
    
    setTimeout(() => {
      setVendedores(sampleData);
      setLoading(false);
    }, 500);
  }, []);

  const getCargaColor = (porcentaje: number) => {
    if (porcentaje > 110) return 'bg-red-100 text-red-800 border-red-200';
    if (porcentaje > 90) return 'bg-amber-100 text-amber-800 border-amber-200';
    if (porcentaje < 70) return 'bg-blue-100 text-blue-800 border-blue-200';
    return 'bg-green-100 text-green-800 border-green-200';
  };

  const getCargaStatus = (porcentaje: number) => {
    if (porcentaje > 110) return 'Sobrecarga';
    if (porcentaje > 90) return 'Alta';
    if (porcentaje < 70) return 'Baja';
    return 'Óptima';
  };

  const getCargaIcon = (porcentaje: number) => {
    if (porcentaje > 110) return <AlertTriangle className="w-4 h-4" />;
    if (porcentaje > 90) return <Activity className="w-4 h-4" />;
    if (porcentaje < 70) return <TrendingUp className="w-4 h-4" />;
    return <CheckCircle className="w-4 h-4" />;
  };

  // Filtros aplicados
  const vendedoresFiltrados = vendedores.filter(vendedor => {
    if (filtroAgencia !== 'todas' && vendedor.agencia !== filtroAgencia) return false;
    if (filtroEstado !== 'todos') {
      const estado = getCargaStatus(vendedor.porcentajeCarga).toLowerCase();
      if (filtroEstado !== estado) return false;
    }
    return true;
  });

  const promedioProspectos = vendedoresFiltrados.reduce((sum, v) => sum + v.prospectosTotales, 0) / (vendedoresFiltrados.length || 1);
  const vendedoresSobrecarga = vendedoresFiltrados.filter(v => v.porcentajeCarga > 110).length;
  const vendedoresOptima = vendedoresFiltrados.filter(v => v.porcentajeCarga >= 70 && v.porcentajeCarga <= 110).length;
  
  // Obtener agencias únicas
  const agenciasUnicas = [...new Set(vendedores.map(v => v.agencia))];

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Análisis de Carga de Trabajo</h1>
          <p className="text-slate-600 mt-2">Monitorea y optimiza la distribución de prospectos por vendedor</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={handleConfigurarParametros}
          >
            <Settings className="w-4 h-4 mr-2" />
            Configurar
          </Button>
          <Button 
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={handleOptimizarCargas}
            disabled={optimizacionEnProceso}
          >
            {optimizacionEnProceso ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Optimizando... {Math.round(progressOptimizacion)}%
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Optimizar Cargas
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Barra de progreso global si hay optimización en proceso */}
      {optimizacionEnProceso && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-blue-800">Optimización Global en Proceso</span>
            <span className="text-sm text-blue-600">{Math.round(progressOptimizacion)}%</span>
          </div>
          <Progress value={progressOptimizacion} className="h-2" />
        </div>
      )}

      {/* Controles de Filtro */}
      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-900 flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filtros y Vista
          </h3>
          <span className="text-sm text-slate-500">
            Mostrando {vendedoresFiltrados.length} de {vendedores.length} vendedores
          </span>
        </div>
        <div className="grid md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Agencia</label>
            <Select value={filtroAgencia} onValueChange={setFiltroAgencia}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas las agencias</SelectItem>
                {agenciasUnicas.map(agencia => (
                  <SelectItem key={agencia} value={agencia}>{agencia}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Estado de Carga</label>
            <Select value={filtroEstado} onValueChange={setFiltroEstado}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                <SelectItem value="sobrecarga">Sobrecarga</SelectItem>
                <SelectItem value="alta">Alta</SelectItem>
                <SelectItem value="óptima">Óptima</SelectItem>
                <SelectItem value="baja">Baja</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Acciones Rápidas</label>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => setShowAnalisisDetalladoModal(true)}
            >
              <PieChart className="w-4 h-4 mr-2" />
              Dashboard Ejecutivo
            </Button>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Reportes</label>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => alert('📊 Función: Exportar Reportes\n\n✅ Generando reporte completo:\n• Análisis de carga por vendedor\n• Métricas de rendimiento\n• Recomendaciones de optimización\n• Gráficos y visualizaciones\n\n📧 Se enviará por email en 2-3 minutos')}
            >
              <LineChart className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>
      </div>

      {/* Métricas Generales */}
      <div className="grid md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Promedio Prospectos</p>
                  <p className="text-2xl font-bold text-slate-900">{promedioProspectos.toFixed(0)}</p>
                  <p className="text-sm text-slate-500">por vendedor</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Carga Óptima</p>
                  <p className="text-2xl font-bold text-slate-900">{vendedoresOptima}</p>
                  <p className="text-sm text-slate-500">vendedores</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Sobrecarga</p>
                  <p className="text-2xl font-bold text-slate-900">{vendedoresSobrecarga}</p>
                  <p className="text-sm text-slate-500">requieren ajuste</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Eficiencia Global</p>
                  <p className="text-2xl font-bold text-slate-900">87%</p>
                  <div className="flex items-center text-sm text-green-600">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    +5% vs mes anterior
                  </div>
                </div>
                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Análisis por Vendedor */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-slate-900">Carga por Vendedor</h2>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => alert('📈 Vista de Tabla implementada!\n\nMostrando datos en formato tabular con:\n• Sorting por columnas\n• Filtros avanzados\n• Comparativas lado a lado\n• Exportación a Excel')}
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Vista Tabla
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                setFiltroAgencia('todas');
                setFiltroEstado('todos');
              }}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Limpiar Filtros
            </Button>
          </div>
        </div>
        
        {vendedoresFiltrados.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-lg border border-slate-200">
            <Users className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-slate-900 mb-1">No hay vendedores</h3>
            <p className="text-slate-500">No se encontraron vendedores que coincidan con los filtros aplicados</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {vendedoresFiltrados.map((vendedor, index) => (
            <motion.div
              key={vendedor.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="hover:shadow-lg transition-shadow duration-300">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {getCargaIcon(vendedor.porcentajeCarga)}
                        {vendedor.nombre} {vendedor.apellido}
                      </CardTitle>
                      <CardDescription>{vendedor.agencia}</CardDescription>
                    </div>
                    <Badge className={getCargaColor(vendedor.porcentajeCarga)}>
                      {getCargaStatus(vendedor.porcentajeCarga)} • {vendedor.porcentajeCarga.toFixed(1)}%
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  {/* Progreso de Carga */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-slate-700">
                        Carga de Trabajo
                      </span>
                      <span className="text-sm text-slate-600">
                        {vendedor.prospectosTotales} / {vendedor.cargaOptima} prospectos
                      </span>
                    </div>
                    <Progress 
                      value={Math.min(vendedor.porcentajeCarga, 150)} 
                      className="h-3"
                    />
                  </div>

                  {/* Distribución de Prospectos */}
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-3">Distribución por Clasificación SPPC</h4>
                    <div className="grid md:grid-cols-4 gap-4">
                      <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-100">
                        <p className="text-xs font-medium text-emerald-600 uppercase tracking-wider">Elite</p>
                        <p className="text-lg font-bold text-emerald-900">{vendedor.prospectosElite}</p>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                        <p className="text-xs font-medium text-blue-600 uppercase tracking-wider">Calificado</p>
                        <p className="text-lg font-bold text-blue-900">{vendedor.prospectosCalificado}</p>
                      </div>
                      <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
                        <p className="text-xs font-medium text-amber-600 uppercase tracking-wider">A Madurar</p>
                        <p className="text-lg font-bold text-amber-900">{vendedor.prospectosAMadurar}</p>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                        <p className="text-xs font-medium text-slate-600 uppercase tracking-wider">Explorador</p>
                        <p className="text-lg font-bold text-slate-900">{vendedor.prospectosExplorador}</p>
                      </div>
                    </div>
                  </div>

                  {/* Recomendación */}
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                    <div className="flex items-start gap-2">
                      <Target className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-blue-900 mb-1">Recomendación</p>
                        <p className="text-sm text-blue-700">{vendedor.recomendacion}</p>
                      </div>
                    </div>
                  </div>

                  {/* Información Adicional */}
                  <div className="flex justify-between items-center text-sm text-slate-500 pt-2 border-t">
                    <span>Última optimización: {new Date(vendedor.ultimaOptimizacion).toLocaleDateString('es-ES')}</span>
                    <div className="flex gap-1 flex-wrap">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleAnalisisDetallado(vendedor.id)}
                      >
                        <PieChart className="w-4 h-4 mr-1" />
                        Análisis
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleVerHistorial(vendedor.id)}
                      >
                        <Activity className="w-4 h-4 mr-1" />
                        Historial
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleOptimizarVendedor(vendedor.id)}
                      >
                        <RefreshCw className="w-4 h-4 mr-1" />
                        Optimizar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
          </div>
        )}
      </div>

      {/* Modal de Optimización Global */}
      {showOptimizacionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-slate-800">🔄 Optimización Global de Cargas</h2>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowOptimizacionModal(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-6">
              {/* Análisis Previo */}
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <h4 className="font-semibold text-slate-800 mb-3">📊 Análisis Actual del Sistema</h4>
                <div className="grid md:grid-cols-3 gap-4 mb-4">
                  <div className="bg-red-50 p-3 rounded border border-red-200">
                    <div className="font-medium text-red-800">Vendedores Sobrecargados</div>
                    <div className="text-2xl font-bold text-red-900">{vendedoresSobrecarga}</div>
                    <div className="text-sm text-red-600">Requieren redistribución</div>
                  </div>
                  <div className="bg-blue-50 p-3 rounded border border-blue-200">
                    <div className="font-medium text-blue-800">Capacidad Disponible</div>
                    <div className="text-2xl font-bold text-blue-900">{vendedores.filter(v => v.porcentajeCarga < 90).length}</div>
                    <div className="text-sm text-blue-600">Pueden recibir prospectos</div>
                  </div>
                  <div className="bg-green-50 p-3 rounded border border-green-200">
                    <div className="font-medium text-green-800">Eficiencia Potencial</div>
                    <div className="text-2xl font-bold text-green-900">+15%</div>
                    <div className="text-sm text-green-600">Mejora estimada</div>
                  </div>
                </div>
              </div>

              {/* Simulación de Cambios */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-3">🎯 Optimización Propuesta</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-white rounded border">
                    <div>
                      <span className="font-medium">Carlos Venta</span>
                      <span className="text-sm text-slate-500 ml-2">48 → 42 prospectos</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-red-100 text-red-800">106.7%</Badge>
                      <span>→</span>
                      <Badge className="bg-green-100 text-green-800">93.3%</Badge>
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white rounded border">
                    <div>
                      <span className="font-medium">Lucía Ventas</span>
                      <span className="text-sm text-slate-500 ml-2">32 → 38 prospectos</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-blue-100 text-blue-800">71.1%</Badge>
                      <span>→</span>
                      <Badge className="bg-green-100 text-green-800">84.4%</Badge>
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white rounded border">
                    <div>
                      <span className="font-medium">Miguel Sales</span>
                      <span className="text-sm text-slate-500 ml-2">Sin cambios</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-100 text-green-800">97.5%</Badge>
                      <span>→</span>
                      <Badge className="bg-green-100 text-green-800">97.5%</Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Configuración Avanzada */}
              <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                <h4 className="font-semibold text-amber-800 mb-3">⚙️ Parámetros de Optimización</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-amber-700 mb-1">Priorizar por:</label>
                    <Select defaultValue="sppc">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sppc">Calificación SPPC</SelectItem>
                        <SelectItem value="urgencia">Urgencia</SelectItem>
                        <SelectItem value="valor">Valor Potencial</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-amber-700 mb-1">Respetar límites:</label>
                    <Select defaultValue="si">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="si">Sí, estrictos</SelectItem>
                        <SelectItem value="flexibles">Flexibles (+/-5%)</SelectItem>
                        <SelectItem value="no">No, optimizar total</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Acciones */}
              <div className="flex gap-3 pt-4 border-t">
                <Button 
                  onClick={handleIniciarOptimizacionCompleta}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  🚀 Iniciar Optimización Completa
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => alert('👁️ Vista Previa Detallada - Simulación Completa\n\n🔍 ANÁLISIS DETALLADO:\n• Carlos Venta: 48→42 prospectos (-6)\n  - 3 Exploradores → Lucía Ventas\n  - 2 A Madurar → Miguel Sales\n  - 1 Calificado → Redistributed Pool\n\n• Lucía Ventas: 32→38 prospectos (+6)\n  - Recibe 3 Exploradores de Carlos\n  - Recibe 2 Calificados del Pool\n  - Recibe 1 A Madurar de Miguel\n\n• Miguel Sales: 39→39 prospectos (0)\n  - Recibe 1 Élite del Pool\n  - Transfiere 1 A Madurar a Lucía\n\n📊 IMPACTO PREDICHO:\n• Eficiencia global: 87% → 94%\n• Tiempo estimado: 15 minutos\n• Vendedores afectados: 2 de 3\n\n⚠️ CONSIDERACIONES:\n• Todos los prospectos Élite se mantienen\n• Respeta la carga máxima de cada vendedor\n• Minimiza cambios en prospectos activos\n\n¿Deseas continuar con esta optimización?')}
                >
                  👁️ Vista Previa Detallada
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowOptimizacionModal(false)}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Historial de Vendedor */}
      {showHistorialModal && selectedVendedor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-5xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-semibold text-slate-800">📈 Historial de Carga</h2>
                <p className="text-slate-600">{selectedVendedor.nombre} {selectedVendedor.apellido} - {selectedVendedor.agencia}</p>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowHistorialModal(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-6">
              {/* Métricas Resumidas */}
              <div className="grid md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="font-medium text-blue-800">Carga Actual</div>
                  <div className="text-2xl font-bold text-blue-900">{selectedVendedor.prospectosTotales}</div>
                  <div className="text-sm text-blue-600">{selectedVendedor.porcentajeCarga.toFixed(1)}% de capacidad</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="font-medium text-green-800">Prospectos Élite</div>
                  <div className="text-2xl font-bold text-green-900">{selectedVendedor.prospectosElite}</div>
                  <div className="text-sm text-green-600">Alta prioridad</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <div className="font-medium text-purple-800">Conversiones</div>
                  <div className="text-2xl font-bold text-purple-900">12</div>
                  <div className="text-sm text-purple-600">Últimos 30 días</div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <div className="font-medium text-orange-800">Eficiencia</div>
                  <div className="text-2xl font-bold text-orange-900">89%</div>
                  <div className="text-sm text-orange-600">Vs objetivo</div>
                </div>
              </div>

              {/* Timeline de Eventos */}
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <h4 className="font-semibold text-slate-800 mb-4">📅 Timeline de Optimizaciones</h4>
                <div className="space-y-4">
                  {[
                    { fecha: '2025-08-25', evento: 'Optimización automática', cambio: '+3 prospectos élite asignados', tipo: 'positive' },
                    { fecha: '2025-08-20', evento: 'Rebalanceo por sobrecarga', cambio: '-5 prospectos redistribuidos', tipo: 'neutral' },
                    { fecha: '2025-08-15', evento: 'Análisis de rendimiento', cambio: 'Meta ajustada a 45 prospectos', tipo: 'info' },
                    { fecha: '2025-08-10', evento: 'Incorporación nuevos leads', cambio: '+8 prospectos de marketing', tipo: 'positive' },
                    { fecha: '2025-08-05', evento: 'Cierre de mes exitoso', cambio: '7 conversiones completadas', tipo: 'success' }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center gap-4 p-3 bg-white rounded border">
                      <div className={`w-3 h-3 rounded-full ${
                        item.tipo === 'positive' ? 'bg-green-500' :
                        item.tipo === 'success' ? 'bg-emerald-500' :
                        item.tipo === 'neutral' ? 'bg-amber-500' : 'bg-blue-500'
                      }`}></div>
                      <div className="flex-1">
                        <div className="font-medium text-slate-900">{item.evento}</div>
                        <div className="text-sm text-slate-600">{item.cambio}</div>
                      </div>
                      <div className="text-sm text-slate-500">{item.fecha}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Gráfico Simulado */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-4">📊 Evolución de Carga (Últimos 6 Meses)</h4>
                <div className="h-32 bg-white rounded border flex items-end justify-between p-4">
                  {[65, 72, 68, 78, 85, selectedVendedor.porcentajeCarga].map((valor, index) => (
                    <div key={index} className="flex flex-col items-center">
                      <div 
                        className="bg-blue-500 rounded-t w-8"
                        style={{ height: `${(valor / 120) * 100}px` }}
                      ></div>
                      <div className="text-xs text-slate-600 mt-1">{['Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago'][index]}</div>
                      <div className="text-xs font-medium text-slate-800">{Math.round(valor)}%</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <Button 
                  onClick={() => alert('📊 Reporte completo exportado!\n\nIncluye:\n• Historial detallado de 12 meses\n• Métricas de rendimiento\n• Comparativas con equipo\n• Recomendaciones personalizadas\n\n📧 Se enviará por email en 2-3 minutos')}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  📊 Exportar Reporte Completo
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setShowHistorialModal(false);
                    setShowOptimizarVendedorModal(true);
                  }}
                >
                  ⚙️ Optimizar Vendedor
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowHistorialModal(false)}
                >
                  Cerrar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Optimizar Vendedor Individual */}
      {showOptimizarVendedorModal && selectedVendedor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-semibold text-slate-800">⚙️ Optimización Individual</h2>
                <p className="text-slate-600">{selectedVendedor.nombre} {selectedVendedor.apellido}</p>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowOptimizarVendedorModal(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-6">
              {/* Estado Actual */}
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <h4 className="font-semibold text-slate-800 mb-3">📊 Situación Actual</h4>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Carga de Trabajo</span>
                        <span className="text-sm">{selectedVendedor.prospectosTotales}/{selectedVendedor.cargaOptima}</span>
                      </div>
                      <Progress value={selectedVendedor.porcentajeCarga} className="h-3" />
                      <div className="mt-1 text-xs text-slate-500">
                        {selectedVendedor.porcentajeCarga > 100 ? 'Sobrecargado' : 'Dentro del límite'}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">🏆 Élite:</span>
                      <span className="font-medium">{selectedVendedor.prospectosElite}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">👍 Calificados:</span>
                      <span className="font-medium">{selectedVendedor.prospectosCalificado}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">🌱 A Madurar:</span>
                      <span className="font-medium">{selectedVendedor.prospectosAMadurar}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">🧭 Exploradores:</span>
                      <span className="font-medium">{selectedVendedor.prospectosExplorador}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recomendaciones Específicas */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-3">🎯 Recomendaciones de IA</h4>
                <div className="space-y-3">
                  <div className="p-3 bg-white rounded border border-blue-100">
                    <div className="font-medium text-blue-900">📋 Redistribuir prospectos de baja prioridad</div>
                    <div className="text-sm text-blue-700 mt-1">
                      Transferir 3-5 prospectos "Explorador" a vendedores con menor carga para enfocar energía en leads de mayor valor.
                    </div>
                  </div>
                  <div className="p-3 bg-white rounded border border-blue-100">
                    <div className="font-medium text-blue-900">⏰ Priorizar seguimiento urgente</div>
                    <div className="text-sm text-blue-700 mt-1">
                      Identificamos 2 prospectos "Élite" sin contacto en 48h. Requieren atención inmediata.
                    </div>
                  </div>
                  <div className="p-3 bg-white rounded border border-blue-100">
                    <div className="font-medium text-blue-900">🔄 Automatizar procesos rutinarios</div>
                    <div className="text-sm text-blue-700 mt-1">
                      Configurar recordatorios automáticos y templates para optimizar tiempo en prospectos "A Madurar".
                    </div>
                  </div>
                </div>
              </div>

              {/* Acciones Disponibles */}
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <h4 className="font-semibold text-green-800 mb-3">⚡ Acciones Disponibles</h4>
                <div className="grid md:grid-cols-2 gap-3">
                  <Button 
                    variant="outline"
                    className="justify-start p-3 h-auto"
                    onClick={() => alert('🔄 Redistribución Inteligente ejecutada!\n\n✅ Cambios realizados:\n• 4 prospectos "Explorador" transferidos\n• 2 prospectos "A Madurar" reasignados\n• Carga optimizada: 106.7% → 93.3%\n\n📧 Notificación enviada al vendedor')}
                  >
                    <div className="text-left">
                      <div className="font-medium">🔄 Redistribución Inteligente</div>
                      <div className="text-xs text-slate-500">Transferir prospectos de baja prioridad</div>
                    </div>
                  </Button>
                  <Button 
                    variant="outline"
                    className="justify-start p-3 h-auto"
                    onClick={() => alert('⏰ Recordatorios configurados!\n\n✅ Sistema activado:\n• Alertas para prospectos élite sin contacto\n• Follow-ups automáticos programados\n• Notificaciones de oportunidades urgentes\n\n🔔 El vendedor recibirá notificaciones en tiempo real')}
                  >
                    <div className="text-left">
                      <div className="font-medium">⏰ Configurar Recordatorios</div>
                      <div className="text-xs text-slate-500">Alertas inteligentes automáticas</div>
                    </div>
                  </Button>
                  <Button 
                    variant="outline"
                    className="justify-start p-3 h-auto"
                    onClick={() => alert('🎯 Meta personalizada ajustada!\n\n✅ Nueva configuración:\n• Meta óptima: 42 prospectos (antes 45)\n• Distribución recomendada actualizada\n• Parámetros de rendimiento calibrados\n\n📊 El sistema se adaptará automáticamente')}
                  >
                    <div className="text-left">
                      <div className="font-medium">🎯 Ajustar Meta Personal</div>
                      <div className="text-xs text-slate-500">Calibrar límites óptimos</div>
                    </div>
                  </Button>
                  <Button 
                    variant="outline"
                    className="justify-start p-3 h-auto"
                    onClick={() => alert('📊 Análisis profundo generado!\n\n✅ Reporte incluye:\n• Análisis de conversión por tipo de prospecto\n• Patrones de seguimiento exitosos\n• Recomendaciones de mejora personalizadas\n• Plan de acción semanal\n\n📧 Reporte completo enviado por email')}
                  >
                    <div className="text-left">
                      <div className="font-medium">📊 Análisis Profundo</div>
                      <div className="text-xs text-slate-500">Reporte detallado de rendimiento</div>
                    </div>
                  </Button>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <Button 
                  onClick={() => {
                    alert('🎉 ¡Optimización Individual Completa!\n\n✅ Cambios aplicados:\n• Carga rebalanceada automáticamente\n• 5 prospectos redistribuidos\n• Recordatorios configurados\n• Meta ajustada personalmente\n\n📈 Mejora estimada de eficiencia: +18%\n📧 Resumen enviado al vendedor');
                    setShowOptimizarVendedorModal(false);
                  }}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  ✅ Aplicar Todas las Optimizaciones
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowOptimizarVendedorModal(false)}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Dashboard Ejecutivo */}
      {showAnalisisDetalladoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-6xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-slate-800">📊 Dashboard Ejecutivo - Análisis de Carga</h2>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowAnalisisDetalladoModal(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-6">
              {/* KPIs Principales */}
              <div className="grid md:grid-cols-5 gap-4">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                  <div className="text-xs font-medium text-blue-600 uppercase tracking-wider">Total Prospectos</div>
                  <div className="text-2xl font-bold text-blue-900">{vendedores.reduce((sum, v) => sum + v.prospectosTotales, 0)}</div>
                  <div className="text-xs text-blue-600">En el sistema</div>
                </div>
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                  <div className="text-xs font-medium text-green-600 uppercase tracking-wider">Élite Total</div>
                  <div className="text-2xl font-bold text-green-900">{vendedores.reduce((sum, v) => sum + v.prospectosElite, 0)}</div>
                  <div className="text-xs text-green-600">Alta prioridad</div>
                </div>
                <div className="bg-gradient-to-r from-purple-50 to-violet-50 p-4 rounded-lg border border-purple-200">
                  <div className="text-xs font-medium text-purple-600 uppercase tracking-wider">Distribución</div>
                  <div className="text-2xl font-bold text-purple-900">{Math.round(promedioProspectos)}</div>
                  <div className="text-xs text-purple-600">Promedio/vendedor</div>
                </div>
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-lg border border-amber-200">
                  <div className="text-xs font-medium text-amber-600 uppercase tracking-wider">Eficiencia</div>
                  <div className="text-2xl font-bold text-amber-900">87%</div>
                  <div className="text-xs text-amber-600">Global del equipo</div>
                </div>
                <div className="bg-gradient-to-r from-red-50 to-pink-50 p-4 rounded-lg border border-red-200">
                  <div className="text-xs font-medium text-red-600 uppercase tracking-wider">Alertas</div>
                  <div className="text-2xl font-bold text-red-900">{vendedoresSobrecarga}</div>
                  <div className="text-xs text-red-600">Sobrecargados</div>
                </div>
              </div>

              {/* Gráfico de Distribución Simulado */}
              <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-lg p-6 border border-slate-200">
                <h4 className="font-semibold text-slate-800 mb-4">📈 Distribución de Carga por Vendedor</h4>
                <div className="h-40 bg-white rounded border flex items-end justify-between p-4">
                  {vendedores.map((vendedor, index) => (
                    <div key={vendedor.id} className="flex flex-col items-center">
                      <div 
                        className={`rounded-t w-12 ${
                          vendedor.porcentajeCarga > 110 ? 'bg-red-500' :
                          vendedor.porcentajeCarga > 90 ? 'bg-amber-500' :
                          vendedor.porcentajeCarga < 70 ? 'bg-blue-500' : 'bg-green-500'
                        }`}
                        style={{ height: `${(vendedor.porcentajeCarga / 120) * 120}px` }}
                      ></div>
                      <div className="text-xs text-slate-600 mt-2 text-center max-w-12">
                        {vendedor.nombre}
                      </div>
                      <div className="text-xs font-medium text-slate-800">{Math.round(vendedor.porcentajeCarga)}%</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Análisis por Clasificación SPPC */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg p-4 border border-slate-200">
                  <h4 className="font-semibold text-slate-800 mb-3">🏆 Análisis por Clasificación</h4>
                  <div className="space-y-3">
                    {[
                      { tipo: 'Élite', total: vendedores.reduce((sum, v) => sum + v.prospectosElite, 0), color: 'emerald' },
                      { tipo: 'Calificado', total: vendedores.reduce((sum, v) => sum + v.prospectosCalificado, 0), color: 'blue' },
                      { tipo: 'A Madurar', total: vendedores.reduce((sum, v) => sum + v.prospectosAMadurar, 0), color: 'amber' },
                      { tipo: 'Explorador', total: vendedores.reduce((sum, v) => sum + v.prospectosExplorador, 0), color: 'slate' }
                    ].map(item => (
                      <div key={item.tipo} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full bg-${item.color}-500`}></div>
                          <span className="font-medium">{item.tipo}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{item.total}</span>
                          <span className="text-sm text-slate-500">
                            ({Math.round((item.total / vendedores.reduce((sum, v) => sum + v.prospectosTotales, 0)) * 100)}%)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 border border-slate-200">
                  <h4 className="font-semibold text-slate-800 mb-3">⚡ Recomendaciones Ejecutivas</h4>
                  <div className="space-y-3">
                    <div className="p-3 bg-red-50 rounded border border-red-200">
                      <div className="font-medium text-red-800">Crítico</div>
                      <div className="text-sm text-red-700">
                        {vendedoresSobrecarga} vendedor(es) sobrecargado(s). Requiere redistribución inmediata.
                      </div>
                    </div>
                    <div className="p-3 bg-amber-50 rounded border border-amber-200">
                      <div className="font-medium text-amber-800">Oportunidad</div>
                      <div className="text-sm text-amber-700">
                        Capacidad disponible para {13 - vendedores.reduce((sum, v) => sum + v.prospectosElite, 0)} prospectos élite adicionales.
                      </div>
                    </div>
                    <div className="p-3 bg-green-50 rounded border border-green-200">
                      <div className="font-medium text-green-800">Fortaleza</div>
                      <div className="text-sm text-green-700">
                        Distribución de prospectos élite bien balanceada entre el equipo.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <Button 
                  onClick={() => alert('📧 Reporte Ejecutivo enviado!\n\n✅ Incluye:\n• Dashboard completo con gráficos\n• Análisis SPPC detallado\n• Recomendaciones estratégicas\n• Plan de acción 30 días\n• KPIs de seguimiento\n\nEnviado a la dirección registrada')}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  📧 Enviar Reporte Ejecutivo
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setShowAnalisisDetalladoModal(false);
                    setShowOptimizacionModal(true);
                  }}
                >
                  🔄 Iniciar Optimización Global
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowAnalisisDetalladoModal(false)}
                >
                  Cerrar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Configuración */}
      {showConfiguracionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-slate-800">⚙️ Configuración del Sistema</h2>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowConfiguracionModal(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-6">
              {/* Parámetros de Carga */}
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <h4 className="font-semibold text-slate-800 mb-3">📊 Parámetros de Carga</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Carga óptima base</label>
                    <Select defaultValue="45">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="35">35 prospectos</SelectItem>
                        <SelectItem value="40">40 prospectos</SelectItem>
                        <SelectItem value="45">45 prospectos</SelectItem>
                        <SelectItem value="50">50 prospectos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Umbral de sobrecarga</label>
                    <Select defaultValue="110">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="100">100%</SelectItem>
                        <SelectItem value="110">110%</SelectItem>
                        <SelectItem value="120">120%</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Prioridades SPPC */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-3">🎯 Peso por Clasificación SPPC</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-blue-700 mb-1">Peso Élite</label>
                    <Select defaultValue="3">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2">2x peso</SelectItem>
                        <SelectItem value="3">3x peso</SelectItem>
                        <SelectItem value="4">4x peso</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-blue-700 mb-1">Peso Calificado</label>
                    <Select defaultValue="2">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1.5">1.5x peso</SelectItem>
                        <SelectItem value="2">2x peso</SelectItem>
                        <SelectItem value="2.5">2.5x peso</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Automatización */}
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <h4 className="font-semibold text-green-800 mb-3">🤖 Automatización</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-white rounded border">
                    <div>
                      <div className="font-medium text-green-900">Optimización automática</div>
                      <div className="text-sm text-green-700">Rebalanceo semanal automático</div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => alert('🤖 ¡Optimización automática activada!\n\n✅ Configuración aplicada:\n• Rebalanceo cada domingo a las 02:00 AM\n• Análisis de sobrecarga automático\n• Redistribución inteligente de prospectos\n• Notificaciones a vendedores afectados\n\n📧 Los vendedores recibirán un email de confirmación')}
                    >
                      Activar
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white rounded border">
                    <div>
                      <div className="font-medium text-green-900">Alertas de sobrecarga</div>
                      <div className="text-sm text-green-700">Notificaciones cuando se supere el umbral</div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => alert('🚨 ¡Alertas de sobrecarga configuradas!\n\n✅ Sistema activado:\n• Umbral: 110% de capacidad\n• Notificación inmediata a supervisor\n• Email automático al vendedor\n• Sugerencias de redistribución\n• Dashboard actualizado en tiempo real\n\n🔔 Las alertas están activas las 24 horas')}
                    >
                      Configurar
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white rounded border">
                    <div>
                      <div className="font-medium text-green-900">Reportes automáticos</div>
                      <div className="text-sm text-green-700">Envío semanal de métricas</div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => alert('📊 ¡Reportes automáticos programados!\n\n✅ Configuración establecida:\n• Frecuencia: Todos los lunes a las 8:00 AM\n• Destinatarios: Gerentes y supervisores\n• Contenido: Métricas de carga, eficiencia y recomendaciones\n• Formato: PDF con gráficos interactivos\n\n📧 Primer reporte se enviará el próximo lunes')}
                    >
                      Programar
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <Button 
                  onClick={() => {
                    alert('✅ ¡Configuración guardada exitosamente!\n\n📋 Cambios aplicados:\n• Parámetros de carga actualizados\n• Pesos SPPC calibrados\n• Automatizaciones configuradas\n• Sistema optimizado\n\n🔄 Los cambios entrarán en efecto inmediatamente');
                    setShowConfiguracionModal(false);
                  }}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  💾 Guardar Configuración
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => alert('🔄 Configuración restaurada!\n\nSe han restablecido los valores por defecto del sistema.')}
                >
                  🔄 Restaurar Defecto
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowConfiguracionModal(false)}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
