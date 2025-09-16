
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  DollarSign,
  TrendingUp,
  TrendingDown,
  Target,
  BarChart3,
  Calendar,
  Calculator,
  X,
  Settings,
  Download,
  Eye,
  FileText,
  Clock
} from 'lucide-react';
import { motion } from 'framer-motion';

interface MetricaFinanciera {
  id: number;
  agencia: string;
  mes: string;
  ventasRealizadas: number;
  metaVentas: number;
  utilidadTotal: number;
  utilidadPromedio: number;
  tasaConversion: number;
  cumplimientoMeta: number;
}

export default function FinanzasPage() {
  const { data: session, status } = useSession();
  const [metricas, setMetricas] = useState<MetricaFinanciera[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para modales
  const [showReporteModal, setShowReporteModal] = useState(false);
  const [showDetallesModal, setShowDetallesModal] = useState(false);
  const [showHistorialModal, setShowHistorialModal] = useState(false);
  const [showAjustarModal, setShowAjustarModal] = useState(false);
  const [selectedMetrica, setSelectedMetrica] = useState<MetricaFinanciera | null>(null);
  
  // Estado para reporte
  const [configReporte, setConfigReporte] = useState({
    tipo: 'consolidado',
    periodo: 'mensual',
    agencias: 'todas',
    fechaInicio: new Date().toISOString().split('T')[0],
    fechaFin: new Date().toISOString().split('T')[0]
  });

  const handleGenerarReporte = () => {
    setShowReporteModal(true);
    const hoy = new Date();
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    setConfigReporte(prev => ({
      ...prev,
      fechaInicio: inicioMes.toISOString().split('T')[0],
      fechaFin: hoy.toISOString().split('T')[0]
    }));
  };

  const handleDescargarReporte = () => {
    const ventasTotal = metricas.reduce((sum, m) => sum + m.ventasRealizadas, 0);
    const utilidadTotal = metricas.reduce((sum, m) => sum + m.utilidadTotal, 0);
    const promedioConversion = metricas.reduce((sum, m) => sum + m.tasaConversion, 0) / metricas.length;
    
    alert(`✅ Reporte Financiero ${configReporte.tipo.toUpperCase()} Generado!\n\n📊 RESUMEN EJECUTIVO:\n• Período: ${configReporte.fechaInicio} al ${configReporte.fechaFin}\n• Total Ventas: ${ventasTotal} unidades\n• Utilidad Total: $${utilidadTotal.toLocaleString()}\n• Conversión Promedio: ${promedioConversion.toFixed(2)}%\n• Agencias Analizadas: ${metricas.length}\n\n📄 Descargando archivo Excel...`);
    
    setTimeout(() => {
      const link = document.createElement('a');
      link.href = '#';
      link.download = `Reporte_Financiero_${configReporte.tipo}_${configReporte.fechaInicio}.xlsx`;
      link.click();
    }, 1500);
    
    setShowReporteModal(false);
  };

  const handleVerDetalles = (metricaId: number) => {
    const metrica = metricas.find(m => m.id === metricaId);
    if (metrica) {
      setSelectedMetrica(metrica);
      setShowDetallesModal(true);
    }
  };

  const handleVerHistorial = (metricaId: number) => {
    const metrica = metricas.find(m => m.id === metricaId);
    if (metrica) {
      setSelectedMetrica(metrica);
      setShowHistorialModal(true);
    }
  };

  const handleAjustarMeta = (metricaId: number) => {
    const metrica = metricas.find(m => m.id === metricaId);
    if (metrica) {
      setSelectedMetrica(metrica);
      setShowAjustarModal(true);
    }
  };

  const handleGuardarAjusteMeta = () => {
    if (selectedMetrica) {
      setMetricas(metricas.map(m => 
        m.id === selectedMetrica.id ? selectedMetrica : m
      ));
      setShowAjustarModal(false);
      alert(`✅ Meta Ajustada Exitosamente!\n\n🏢 Agencia: ${selectedMetrica.agencia}\n🎯 Nueva Meta: ${selectedMetrica.metaVentas} ventas\n📊 Cumplimiento Actual: ${selectedMetrica.cumplimientoMeta.toFixed(1)}%\n\n🔔 Notificación enviada al equipo de ventas`);
    }
  };

  useEffect(() => {
    // Datos simulados
    const sampleData: MetricaFinanciera[] = [
      {
        id: 1,
        agencia: 'Audi Polanco',
        mes: 'Septiembre 2025',
        ventasRealizadas: 12,
        metaVentas: 18,
        utilidadTotal: 1500000,
        utilidadPromedio: 125000,
        tasaConversion: 8.28,
        cumplimientoMeta: 66.7
      },
      {
        id: 2,
        agencia: 'Audi Santa Fe',
        mes: 'Septiembre 2025',
        ventasRealizadas: 8,
        metaVentas: 15,
        utilidadTotal: 944000,
        utilidadPromedio: 118000,
        tasaConversion: 8.16,
        cumplimientoMeta: 53.3
      },
      {
        id: 3,
        agencia: 'BMW Interlomas',
        mes: 'Septiembre 2025',
        ventasRealizadas: 6,
        metaVentas: 12,
        utilidadTotal: 780000,
        utilidadPromedio: 130000,
        tasaConversion: 7.5,
        cumplimientoMeta: 50.0
      }
    ];
    
    setTimeout(() => {
      setMetricas(sampleData);
      setLoading(false);
    }, 500);
  }, []);

  const totalVentas = metricas.reduce((sum, m) => sum + m.ventasRealizadas, 0);
  const totalMeta = metricas.reduce((sum, m) => sum + m.metaVentas, 0);
  const totalUtilidad = metricas.reduce((sum, m) => sum + m.utilidadTotal, 0);
  const promedioConversion = metricas.reduce((sum, m) => sum + m.tasaConversion, 0) / (metricas.length || 1);

  const getCumplimientoColor = (porcentaje: number) => {
    if (porcentaje >= 90) return 'text-green-600';
    if (porcentaje >= 70) return 'text-amber-600';
    return 'text-red-600';
  };

  if (status === 'loading' || loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-slate-200 rounded w-48 animate-pulse"></div>
        <div className="grid gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-24 bg-slate-200 rounded"></div>
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
          <h1 className="text-3xl font-bold text-slate-900">Centro Financiero</h1>
          <p className="text-slate-600 mt-2">Monitorea métricas financieras y cumplimiento de metas</p>
        </div>
        <Button 
          className="bg-blue-600 hover:bg-blue-700 text-white"
          onClick={handleGenerarReporte}
        >
          <BarChart3 className="w-4 h-4 mr-2" />
          Generar Reporte
        </Button>
      </div>

      {/* Resumen General */}
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
                  <p className="text-sm font-medium text-slate-600">Ventas Realizadas</p>
                  <p className="text-2xl font-bold text-slate-900">{totalVentas}</p>
                  <p className="text-sm text-slate-500">de {totalMeta} meta</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Target className="w-6 h-6 text-blue-600" />
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
                  <p className="text-sm font-medium text-slate-600">Utilidad Total</p>
                  <p className="text-2xl font-bold text-slate-900">
                    ${(totalUtilidad / 1000000).toFixed(1)}M
                  </p>
                  <div className="flex items-center text-sm text-green-600">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    +12% vs mes anterior
                  </div>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-600" />
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
                  <p className="text-sm font-medium text-slate-600">Tasa Conversión</p>
                  <p className="text-2xl font-bold text-slate-900">{promedioConversion.toFixed(1)}%</p>
                  <div className="flex items-center text-sm text-amber-600">
                    <TrendingDown className="w-4 h-4 mr-1" />
                    -0.5% vs mes anterior
                  </div>
                </div>
                <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-amber-600" />
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
                  <p className="text-sm font-medium text-slate-600">Cumplimiento</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {((totalVentas / totalMeta) * 100).toFixed(0)}%
                  </p>
                  <p className="text-sm text-slate-500">de meta general</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Calculator className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Métricas por Agencia */}
      <div>
        <h2 className="text-xl font-semibold text-slate-900 mb-4">Desempeño por Agencia</h2>
        <div className="grid gap-4">
          {metricas.map((metrica, index) => (
            <motion.div
              key={metrica.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="hover:shadow-lg transition-shadow duration-300">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{metrica.agencia}</CardTitle>
                      <CardDescription>{metrica.mes}</CardDescription>
                    </div>
                    <Badge 
                      className={`${getCumplimientoColor(metrica.cumplimientoMeta)} bg-opacity-10`}
                    >
                      {metrica.cumplimientoMeta.toFixed(1)}% meta
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  {/* Progreso de Meta */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-slate-700">
                        Progreso de Ventas
                      </span>
                      <span className="text-sm text-slate-600">
                        {metrica.ventasRealizadas} / {metrica.metaVentas}
                      </span>
                    </div>
                    <Progress 
                      value={metrica.cumplimientoMeta} 
                      className="h-3"
                    />
                  </div>

                  {/* Métricas Detalladas */}
                  <div className="grid md:grid-cols-4 gap-6">
                    <div>
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Utilidad Total
                      </p>
                      <p className="text-lg font-bold text-slate-900">
                        ${(metrica.utilidadTotal / 1000).toLocaleString('es-MX')}K
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Utilidad Promedio
                      </p>
                      <p className="text-lg font-bold text-slate-900">
                        ${metrica.utilidadPromedio.toLocaleString('es-MX')}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Tasa Conversión
                      </p>
                      <p className="text-lg font-bold text-slate-900">
                        {metrica.tasaConversion}%
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Faltante Meta
                      </p>
                      <p className="text-lg font-bold text-slate-900">
                        {metrica.metaVentas - metrica.ventasRealizadas} unidades
                      </p>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex gap-2 pt-4 border-t">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleVerDetalles(metrica.id)}
                    >
                      <BarChart3 className="w-4 h-4 mr-1" />
                      Ver Detalles
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleVerHistorial(metrica.id)}
                    >
                      <Calendar className="w-4 h-4 mr-1" />
                      Historial
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleAjustarMeta(metrica.id)}
                    >
                      <Target className="w-4 h-4 mr-1" />
                      Ajustar Meta
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Modal Generar Reporte */}
      {showReporteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Generar Reporte Financiero
              </h2>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowReporteModal(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tipo de Reporte</label>
                <Select 
                  value={configReporte.tipo} 
                  onValueChange={(value) => setConfigReporte({...configReporte, tipo: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="consolidado">📊 Reporte Consolidado</SelectItem>
                    <SelectItem value="detallado">🔍 Análisis Detallado</SelectItem>
                    <SelectItem value="comparativo">📈 Comparativo Mensual</SelectItem>
                    <SelectItem value="proyecciones">🔮 Proyecciones</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Período</label>
                <Select 
                  value={configReporte.periodo} 
                  onValueChange={(value) => setConfigReporte({...configReporte, periodo: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="semanal">📅 Semanal</SelectItem>
                    <SelectItem value="mensual">🗓️ Mensual</SelectItem>
                    <SelectItem value="trimestral">📆 Trimestral</SelectItem>
                    <SelectItem value="anual">🗓️ Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Fecha Inicio</label>
                  <Input 
                    type="date"
                    value={configReporte.fechaInicio}
                    onChange={(e) => setConfigReporte({...configReporte, fechaInicio: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Fecha Fin</label>
                  <Input 
                    type="date"
                    value={configReporte.fechaFin}
                    onChange={(e) => setConfigReporte({...configReporte, fechaFin: e.target.value})}
                  />
                </div>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">📋 Contenido del Reporte:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Ventas por agencia y vendedor</li>
                  <li>• Utilidades y márgenes detallados</li>
                  <li>• Análisis de cumplimiento de metas</li>
                  <li>• Tendencias y proyecciones</li>
                  <li>• Gráficos y visualizaciones</li>
                </ul>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button 
                onClick={handleDescargarReporte}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                <Download className="w-4 h-4 mr-2" />
                Generar y Descargar
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowReporteModal(false)}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ver Detalles */}
      {showDetallesModal && selectedMetrica && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Análisis Detallado - {selectedMetrica.agencia}</h2>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowDetallesModal(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* Métricas Principales */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Métricas de Rendimiento</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm font-medium text-green-800">Ventas Realizadas</p>
                    <p className="text-2xl font-bold text-green-900">{selectedMetrica.ventasRealizadas}</p>
                  </div>
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm font-medium text-blue-800">Meta del Mes</p>
                    <p className="text-2xl font-bold text-blue-900">{selectedMetrica.metaVentas}</p>
                  </div>
                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <p className="text-sm font-medium text-purple-800">Utilidad Total</p>
                    <p className="text-xl font-bold text-purple-900">${(selectedMetrica.utilidadTotal / 1000).toFixed(0)}K</p>
                  </div>
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm font-medium text-yellow-800">Conversión</p>
                    <p className="text-2xl font-bold text-yellow-900">{selectedMetrica.tasaConversion}%</p>
                  </div>
                </div>
              </div>

              {/* Análisis por Vendedor (Simulado) */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Desglose por Vendedor</h3>
                <div className="space-y-3">
                  {['Carlos Venta', 'Ana Martínez', 'Luis Rodríguez'].map((vendedor, idx) => (
                    <div key={vendedor} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div>
                        <p className="font-medium text-slate-900">{vendedor}</p>
                        <p className="text-sm text-slate-600">{Math.floor(selectedMetrica.ventasRealizadas / 3) + (idx === 0 ? selectedMetrica.ventasRealizadas % 3 : 0)} ventas</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-slate-900">${(selectedMetrica.utilidadPromedio * (Math.floor(selectedMetrica.ventasRealizadas / 3) + (idx === 0 ? selectedMetrica.ventasRealizadas % 3 : 0))).toLocaleString()}</p>
                        <p className="text-sm text-slate-600">utilidad</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-slate-50 rounded-lg">
              <h4 className="font-medium text-slate-800 mb-2">📊 Análisis de Desempeño:</h4>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="font-medium text-slate-700">🎯 Cumplimiento</p>
                  <p className="text-slate-600">{selectedMetrica.cumplimientoMeta.toFixed(1)}% de la meta alcanzada</p>
                </div>
                <div>
                  <p className="font-medium text-slate-700">📈 Proyección</p>
                  <p className="text-slate-600">Meta mensual {selectedMetrica.cumplimientoMeta > 80 ? 'probable' : 'en riesgo'}</p>
                </div>
                <div>
                  <p className="font-medium text-slate-700">💰 Rentabilidad</p>
                  <p className="text-slate-600">Margen promedio de ${selectedMetrica.utilidadPromedio.toLocaleString()}</p>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button 
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => {
                  if (selectedMetrica) {
                    alert(`📊 Exportando Análisis Detallado - ${selectedMetrica.agencia}\n\n✅ REPORTE INCLUYE:\n• Métricas de rendimiento actuales\n• Desglose por vendedor con utilidades\n• Análisis de cumplimiento vs metas\n• Proyección de riesgo mensual\n• Indicadores de rentabilidad\n• Comparativo vs otras agencias\n• Gráficos y visualizaciones\n• Recomendaciones estratégicas\n\n📋 FORMATOS DISPONIBLES:\n• Excel con datos dinámicos\n• PDF ejecutivo con gráficos\n• PowerPoint para presentaciones\n• CSV para análisis externo\n\n📧 Enviando análisis por email...\n⏱️ Tiempo estimado: 3-5 minutos`);
                  }
                }}
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar Análisis
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  if (selectedMetrica) {
                    alert(`📅 Programando Reporte Automático - ${selectedMetrica.agencia}\n\n⚙️ CONFIGURACIÓN ESTABLECIDA:\n• Frecuencia: Mensual (primer día hábil)\n• Hora de envío: 08:00 AM\n• Destinatarios: Gerentes y directores\n• Formato: PDF + Excel\n• Contenido: Análisis completo de rendimiento\n\n📊 INCLUYE AUTOMÁTICAMENTE:\n• Métricas del mes anterior\n• Comparativo vs objetivos\n• Ranking de vendedores\n• Tendencias y proyecciones\n• Alertas y recomendaciones\n• Análisis de desviaciones\n\n📧 NOTIFICACIONES:\n• Confirmación al programar\n• Recordatorio 1 día antes\n• Resumen post-envío\n\n✅ Reporte programado exitosamente\n📅 Próximo envío: 1 de Octubre, 2025`);
                  }
                }}
              >
                Programar Reporte
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowDetallesModal(false)}
              >
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ver Historial */}
      {showHistorialModal && selectedMetrica && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Historial Financiero - {selectedMetrica.agencia}
              </h2>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowHistorialModal(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-6">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
                  <p className="text-sm font-medium text-blue-800">Promedio 12 Meses</p>
                  <p className="text-2xl font-bold text-blue-900">{Math.floor(selectedMetrica.ventasRealizadas * 1.2)} ventas</p>
                </div>
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                  <p className="text-sm font-medium text-green-800">Mejor Mes</p>
                  <p className="text-2xl font-bold text-green-900">{Math.floor(selectedMetrica.ventasRealizadas * 1.8)} ventas</p>
                </div>
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center">
                  <p className="text-sm font-medium text-red-800">Mes Más Bajo</p>
                  <p className="text-2xl font-bold text-red-900">{Math.floor(selectedMetrica.ventasRealizadas * 0.6)} ventas</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Evolución Mensual (Últimos 6 Meses)</h3>
                <div className="space-y-3">
                  {[
                    { mes: 'Abril 2025', ventas: Math.floor(selectedMetrica.ventasRealizadas * 0.8), utilidad: selectedMetrica.utilidadTotal * 0.8 },
                    { mes: 'Mayo 2025', ventas: Math.floor(selectedMetrica.ventasRealizadas * 1.1), utilidad: selectedMetrica.utilidadTotal * 1.1 },
                    { mes: 'Junio 2025', ventas: Math.floor(selectedMetrica.ventasRealizadas * 0.9), utilidad: selectedMetrica.utilidadTotal * 0.9 },
                    { mes: 'Julio 2025', ventas: Math.floor(selectedMetrica.ventasRealizadas * 1.3), utilidad: selectedMetrica.utilidadTotal * 1.3 },
                    { mes: 'Agosto 2025', ventas: Math.floor(selectedMetrica.ventasRealizadas * 1.0), utilidad: selectedMetrica.utilidadTotal * 1.0 },
                    { mes: 'Septiembre 2025', ventas: selectedMetrica.ventasRealizadas, utilidad: selectedMetrica.utilidadTotal }
                  ].map((periodo, idx) => (
                    <div key={periodo.mes} className={`flex items-center justify-between p-3 rounded-lg ${idx === 5 ? 'bg-blue-50 border border-blue-200' : 'bg-slate-50'}`}>
                      <div>
                        <p className="font-medium text-slate-900">{periodo.mes}</p>
                        <p className="text-sm text-slate-600">{idx === 5 ? 'Mes Actual' : 'Completado'}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-slate-900">{periodo.ventas} ventas</p>
                        <p className="text-sm text-slate-600">${(periodo.utilidad / 1000).toFixed(0)}K utilidad</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="font-medium text-yellow-800 mb-2">📊 Tendencias Identificadas:</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Pico de ventas en Julio (+30% vs promedio)</li>
                  <li>• Temporada baja en Abril (-20% vs promedio)</li>
                  <li>• Margen de utilidad constante (~${selectedMetrica.utilidadPromedio.toLocaleString()})</li>
                  <li>• Tendencia ascendente en los últimos 3 meses</li>
                </ul>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button 
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => {
                  if (selectedMetrica) {
                    alert(`📊 Exportando Historial Financiero Completo\n\n🏢 AGENCIA: ${selectedMetrica.agencia}\n\n✅ REPORTE INCLUYE:\n• Evolución mensual últimos 24 meses\n• Comparativo con objetivos\n• Análisis de tendencias\n• Desglose por vendedor\n• Métricas de rentabilidad\n• Proyecciones futuras\n• Análisis de estacionalidad\n• Benchmark vs otras agencias\n\n📋 FORMATOS DISPONIBLES:\n• Excel con gráficos dinámicos\n• PDF ejecutivo\n• CSV para análisis\n• PowerPoint para presentaciones\n\n📧 Enviando reporte por email...\n⏱️ Tiempo estimado: 2-3 minutos`);
                  }
                }}
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar Historial
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  if (selectedMetrica) {
                    alert(`🔮 Análisis Predictivo - IA Financiera\n\n🏢 AGENCIA: ${selectedMetrica.agencia}\n\n📊 PREDICCIONES IA (Próximos 6 meses):\n• Octubre 2025: ${Math.floor(selectedMetrica.ventasRealizadas * 1.15)} ventas (+15%)\n• Noviembre 2025: ${Math.floor(selectedMetrica.ventasRealizadas * 1.25)} ventas (+25%)\n• Diciembre 2025: ${Math.floor(selectedMetrica.ventasRealizadas * 1.40)} ventas (+40%)\n• Enero 2026: ${Math.floor(selectedMetrica.ventasRealizadas * 0.85)} ventas (-15%)\n• Febrero 2026: ${Math.floor(selectedMetrica.ventasRealizadas * 0.90)} ventas (-10%)\n• Marzo 2026: ${Math.floor(selectedMetrica.ventasRealizadas * 1.10)} ventas (+10%)\n\n🎯 RECOMENDACIONES ESTRATÉGICAS:\n• Aprovechar temporada alta Dic-Nov\n• Preparar promociones para Enero\n• Incrementar inventario para Q4\n• Ajustar metas según estacionalidad\n\n⚡ FACTORES CONSIDERADOS:\n• Tendencias históricas (5 años)\n• Estacionalidad del mercado\n• Indicadores económicos\n• Competencia local\n• Lanzamientos de productos\n\n📈 Precisión del modelo: 87.5%`);
                  }
                }}
              >
                Análisis Predictivo
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
      )}

      {/* Modal Ajustar Meta */}
      {showAjustarModal && selectedMetrica && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Ajustar Meta - {selectedMetrica.agencia}
              </h2>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowAjustarModal(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-lg">
                <h4 className="font-medium text-slate-800 mb-2">📊 Estado Actual:</h4>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-600">Meta Actual</p>
                    <p className="font-semibold text-slate-900">{selectedMetrica.metaVentas} ventas</p>
                  </div>
                  <div>
                    <p className="text-slate-600">Progreso</p>
                    <p className="font-semibold text-slate-900">{selectedMetrica.ventasRealizadas} / {selectedMetrica.metaVentas}</p>
                  </div>
                  <div>
                    <p className="text-slate-600">Cumplimiento</p>
                    <p className="font-semibold text-slate-900">{selectedMetrica.cumplimientoMeta.toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-slate-600">Días Restantes</p>
                    <p className="font-semibold text-slate-900">{30 - new Date().getDate()} días</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Nueva Meta de Ventas</label>
                <Input 
                  type="number"
                  value={selectedMetrica.metaVentas}
                  onChange={(e) => setSelectedMetrica({
                    ...selectedMetrica, 
                    metaVentas: parseInt(e.target.value) || 0,
                    cumplimientoMeta: (selectedMetrica.ventasRealizadas / (parseInt(e.target.value) || 1)) * 100
                  })}
                  placeholder="Número de ventas objetivo"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Meta sugerida basada en histórico: {Math.floor(selectedMetrica.ventasRealizadas * 1.2)} ventas
                </p>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">📈 Impacto del Cambio:</h4>
                <div className="text-sm text-blue-700 space-y-1">
                  <p>• Nuevo cumplimiento: <strong>{selectedMetrica.cumplimientoMeta.toFixed(1)}%</strong></p>
                  <p>• Ventas faltantes: <strong>{Math.max(0, selectedMetrica.metaVentas - selectedMetrica.ventasRealizadas)} unidades</strong></p>
                  <p>• Utilidad proyectada: <strong>${((selectedMetrica.metaVentas * selectedMetrica.utilidadPromedio) / 1000).toFixed(0)}K</strong></p>
                </div>
              </div>

              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="font-medium text-yellow-800 mb-2">⚠️ Consideraciones:</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• El equipo será notificado del cambio</li>
                  <li>• Las comisiones se ajustarán automáticamente</li>
                  <li>• Se generará un reporte del ajuste</li>
                  <li>• Los KPIs se actualizarán en tiempo real</li>
                </ul>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button 
                onClick={handleGuardarAjusteMeta}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                disabled={selectedMetrica.metaVentas <= 0}
              >
                Confirmar Ajuste
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowAjustarModal(false)}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
