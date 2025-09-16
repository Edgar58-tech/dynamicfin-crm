
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
  Target,
  TrendingUp,
  Calculator,
  PlayCircle,
  CheckCircle,
  Clock,
  AlertCircle,
  BarChart3,
  X,
  Settings,
  Users,
  Calendar
} from 'lucide-react';
import { motion } from 'framer-motion';

interface Optimizacion {
  id: number;
  nombre: string;
  tipo: string;
  estatus: string;
  progreso: number;
  fechaInicio: string;
  fechaFinEstimada: string;
  vendedorAsignado: string;
  prospectoObjetivo: number;
  resultadosEsperados: string;
}

export default function OptimizacionPage() {
  const { data: session, status } = useSession();
  const [optimizaciones, setOptimizaciones] = useState<Optimizacion[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para modales
  const [showNuevaOptModal, setShowNuevaOptModal] = useState(false);
  const [showAnalisisModal, setShowAnalisisModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [selectedOptimizacion, setSelectedOptimizacion] = useState<Optimizacion | null>(null);
  
  // Estado para nueva optimización
  const [nuevaOpt, setNuevaOpt] = useState({
    nombre: '',
    tipo: '',
    vendedor: '',
    prospectoObjetivo: 0
  });

  const handleNuevaOptimizacion = () => {
    setShowNuevaOptModal(true);
  };

  const handleGuardarOptimizacion = () => {
    const nuevoId = optimizaciones.length + 1;
    const optimizacion: Optimizacion = {
      id: nuevoId,
      nombre: nuevaOpt.nombre,
      tipo: nuevaOpt.tipo,
      estatus: 'Programada',
      progreso: 0,
      fechaInicio: new Date().toISOString().split('T')[0],
      fechaFinEstimada: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      vendedorAsignado: nuevaOpt.vendedor,
      prospectoObjetivo: nuevaOpt.prospectoObjetivo,
      resultadosEsperados: `Mejora esperada del 15% en conversión`
    };
    
    setOptimizaciones([...optimizaciones, optimizacion]);
    setShowNuevaOptModal(false);
    setNuevaOpt({
      nombre: '',
      tipo: '',
      vendedor: '',
      prospectoObjetivo: 0
    });
    alert('✅ Optimización creada exitosamente!');
  };

  const handleExportarAnalisis = () => {
    if (selectedOptimizacion) {
      alert(`✅ Exportando Análisis Completo!\n\n📊 Optimización: ${selectedOptimizacion.nombre}\n📅 Período: ${selectedOptimizacion.fechaInicio} - ${selectedOptimizacion.fechaFinEstimada}\n📈 Progreso: ${selectedOptimizacion.progreso}%\n👥 Prospectos: ${selectedOptimizacion.prospectoObjetivo}\n\n📄 Generando archivo Excel con:\n• Métricas detalladas\n• Timeline completo\n• Análisis de conversiones\n• Recomendaciones específicas\n• Gráficos de progreso\n\n⏳ El archivo se descargará automáticamente...`);
      
      setTimeout(() => {
        // Crear contenido CSV que Excel puede abrir
        const csvContent = `ANÁLISIS DE OPTIMIZACIÓN - ${selectedOptimizacion.nombre}
Fecha de Análisis,${new Date().toLocaleDateString('es-ES')}
Período,${selectedOptimizacion.fechaInicio} - ${selectedOptimizacion.fechaFinEstimada}
Progreso Actual,${selectedOptimizacion.progreso}%
Vendedor Asignado,${selectedOptimizacion.vendedorAsignado}
Prospectos Objetivo,${selectedOptimizacion.prospectoObjetivo}

MÉTRICAS DE RENDIMIENTO
Métrica,Valor,Objetivo,Estado
Progreso Actual,100%,100%,✅ Completado
Prospectos,28,${selectedOptimizacion.prospectoObjetivo},📊 En proceso
Días Activo,251,365,⏰ Continuo
Conversiones,4,10,📈 En progreso

LOGROS ALCANZADOS
Descripción,Cantidad,Impacto
Prospectos reclasificados,16,🎯 Alto
Conversiones adicionales,4,💰 Medio
Mejora en tiempo de respuesta,23%,⚡ Alto
Reducción de prospectos inactivos,18%,📉 Alto

PRÓXIMAS ACCIONES
Prioridad,Acción,Responsable,Fecha
Alta,Implementar seguimiento automatizado,${selectedOptimizacion.vendedorAsignado},Inmediato
Media,Expandir a 42 prospectos,${selectedOptimizacion.vendedorAsignado},Esta semana
Baja,Configurar alertas predictivas,Gerente,Próxima semana
Media,Generar reporte semanal automático,Sistema,Configurado

INSIGHTS DEL ANÁLISIS
La optimización está funcionando por encima de las expectativas.
Los prospectos tipo "Elite" muestran una tasa de conversión 34% superior al promedio histórico.
Se recomienda expandir la estrategia a otros segmentos similares y automatizar el proceso de seguimiento para maximizar la eficiencia del equipo de ventas.

CONFIGURACIÓN TÉCNICA
Parámetro,Valor
Frecuencia de Análisis,Diario
Umbral de Conversión,15%
Máximo Prospectos por Vendedor,25
Prioridad SPPC Mínima,Calificado
Reasignación Automática,Activa
Seguimiento Predictivo,Activo
Alertas de Oportunidad,Activas
Reporte Semanal,Programado

Archivo generado automáticamente por DynamicFin Optimization Suite
© ${new Date().getFullYear()} - Todos los derechos reservados`;

        // Crear blob CSV
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        
        // Crear enlace de descarga
        const link = document.createElement('a');
        link.href = url;
        link.download = `Analisis_${selectedOptimizacion.nombre.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        // Mensaje de éxito
        setTimeout(() => {
          alert('✅ Análisis exportado exitosamente!\n\n📄 Archivo CSV generado y descargado.\n📊 Compatible con Excel, Google Sheets y LibreOffice.\n\n💡 El archivo contiene:\n• Métricas completas de rendimiento\n• Timeline del proceso\n• Logros y próximas acciones\n• Insights y recomendaciones\n• Configuración técnica actual');
        }, 500);
      }, 2000);
    }
  };

  const handleProgramarReporte = () => {
    if (selectedOptimizacion) {
      alert(`✅ Reporte Automático de Rebalanceo Programado!\n\n📊 Optimización: ${selectedOptimizacion.nombre}\n🔄 Frecuencia: Semanal (Lunes 8:00 AM)\n\n📧 DESTINATARIOS DE REPORTES:\n• 👤 Vendedor Asignado: ${selectedOptimizacion.vendedorAsignado}\n• 👨‍💼 Gerente de Ventas: Carlos López\n• 🏢 Director General: María Directora\n• 📱 Dashboard del Sistema (notificación push)\n• 📂 Repositorio Corporativo (archivo PDF)\n\n📄 EL REPORTE INCLUYE:\n• 📊 Estado actual del rebalanceo\n• 📈 Métricas de carga de trabajo por vendedor\n• 🔄 Reasignaciones automáticas realizadas\n• ⚠️ Alertas de sobrecarga detectadas\n• 🎯 Oportunidades de mejora identificadas\n• 📅 Próximas acciones recomendadas\n• 📋 Análisis predictivo de tendencias\n\n🔔 Primera entrega: Próximo Lunes a las 8:00 AM\n💾 Copia archivada automáticamente en el sistema`);
    }
  };

  const handleDuplicarOptimizacion = () => {
    if (selectedOptimizacion) {
      const optimizacionDuplicada: Optimizacion = {
        ...selectedOptimizacion,
        id: optimizaciones.length + 1,
        nombre: `${selectedOptimizacion.nombre} - Copia`,
        estatus: 'Programada',
        progreso: 0,
        fechaInicio: new Date().toISOString().split('T')[0],
        fechaFinEstimada: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      };
      
      setOptimizaciones([...optimizaciones, optimizacionDuplicada]);
      setShowAnalisisModal(false);
      alert(`✅ Optimización Duplicada Exitosamente!\n\n📊 Nueva Optimización: ${optimizacionDuplicada.nombre}\n👤 Asignado a: ${optimizacionDuplicada.vendedorAsignado}\n🎯 Prospectos: ${optimizacionDuplicada.prospectoObjetivo}\n📅 Inicio: Hoy\n\n🚀 La nueva optimización está lista para iniciarse`);
    }
  };

  const handleProbarConfiguracion = () => {
    if (selectedOptimizacion) {
      alert(`🧪 PRUEBA DE CONFIGURACIÓN INICIADA\n\n📊 Optimización: ${selectedOptimizacion.nombre}\n🔄 Simulando parámetros...\n\n✅ RESULTADOS DE LA PRUEBA:\n\n📈 Parámetros Principales:\n• Frecuencia: Diario ✓\n• Umbral de Conversión: 15% ✓\n• Máx. Prospectos/Vendedor: 25 ✓\n• Prioridad SPPC: Calificado+ ✓\n\n🤖 Automatizaciones:\n• Reasignación Automática: ACTIVA ✓\n• Seguimiento Predictivo: ACTIVO ✓\n• Alertas de Oportunidad: ACTIVAS ✓\n• Reporte Semanal: PROGRAMADO ✓\n\n⏰ Configuración Avanzada:\n• Horarios: 08:00 - 18:00 ✓\n• Días Activos: L-M-M-J-V ✓\n• Algoritmo ML: Configurado ✓\n\n🎯 SIMULACIÓN COMPLETADA:\n• 3 prospectos serían reasignados\n• 12% mejora estimada en conversión\n• 2 alertas de oportunidad detectadas\n• Sistema listo para ejecutar\n\n💡 Configuración VÁLIDA - Lista para guardar!`);
    }
  };

  const handleGuardarConfiguracion = () => {
    if (selectedOptimizacion) {
      setShowConfigModal(false);
      alert(`✅ Configuración Guardada Exitosamente!\n\n📊 Optimización: ${selectedOptimizacion.nombre}\n🔄 Parámetros actualizados correctamente\n\n📧 REPORTES AUTOMÁTICOS SE ENVIARÁN A:\n• 👤 Vendedor Asignado: ${selectedOptimizacion.vendedorAsignado}\n• 👨‍💼 Gerente de Ventas: Carlos López\n• 🏢 Director General: María Directora\n• 📊 Dashboard del Sistema (notificación)\n• 📂 Repositorio de Reportes (archivado)\n\n🔔 FRECUENCIA: Cada Lunes 08:00 AM\n📄 INCLUYE:\n• Estado actual del progreso\n• Métricas de rebalanceo de carga\n• Resultados de reasignaciones\n• Alertas y oportunidades detectadas\n• Proyecciones y recomendaciones\n\n⚡ Los nuevos parámetros se aplicarán en la próxima ejecución automática.`);
    }
  };

  const handleVerAnalisis = (optimizacionId: number) => {
    const optimizacion = optimizaciones.find(o => o.id === optimizacionId);
    if (optimizacion) {
      setSelectedOptimizacion(optimizacion);
      setShowAnalisisModal(true);
    }
  };

  const handleConfigurar = (optimizacionId: number) => {
    const optimizacion = optimizaciones.find(o => o.id === optimizacionId);
    if (optimizacion) {
      setSelectedOptimizacion(optimizacion);
      setShowConfigModal(true);
    }
  };

  const handleIniciar = (optimizacionId: number) => {
    const confirmed = confirm(`¿Iniciar optimización ID: ${optimizacionId}?\n\nEsto procesará todos los prospectos asignados.`);
    if (confirmed) {
      setOptimizaciones(optimizaciones.map(o => 
        o.id === optimizacionId ? { ...o, estatus: 'En Proceso', progreso: 25 } : o
      ));
      alert('✅ Optimización iniciada exitosamente!\n\nEstado: En Proceso\nTiempo estimado: 15-30 minutos\nSe notificará cuando termine.');
      
      // Simular progreso
      setTimeout(() => {
        setOptimizaciones(prev => prev.map(o => 
          o.id === optimizacionId ? { ...o, progreso: 75 } : o
        ));
      }, 3000);
      
      setTimeout(() => {
        setOptimizaciones(prev => prev.map(o => 
          o.id === optimizacionId ? { ...o, estatus: 'Completada', progreso: 100 } : o
        ));
        alert('🎉 Optimización completada!\n\nResultados disponibles en el análisis.');
      }, 6000);
    }
  };

  useEffect(() => {
    // Datos simulados
    const sampleData: Optimizacion[] = [
      {
        id: 1,
        nombre: 'Optimización Q1 2025 - Audi Polanco',
        tipo: 'Distribución de Cartera',
        estatus: 'En Proceso',
        progreso: 75,
        fechaInicio: '2025-01-15',
        fechaFinEstimada: '2025-03-31',
        vendedorAsignado: 'Carlos Venta',
        prospectoObjetivo: 45,
        resultadosEsperados: 'Incremento del 15% en tasa de conversión'
      },
      {
        id: 2,
        nombre: 'Análisis SPPC - Prospectos Elite',
        tipo: 'Clasificación Avanzada',
        estatus: 'Completada',
        progreso: 100,
        fechaInicio: '2025-01-01',
        fechaFinEstimada: '2025-01-31',
        vendedorAsignado: 'Lucía Ventas',
        prospectoObjetivo: 28,
        resultadosEsperados: 'Identificación de 12 prospectos Elite adicionales'
      },
      {
        id: 3,
        nombre: 'Rebalanceo de Carga de Trabajo',
        tipo: 'Carga de Trabajo',
        estatus: 'Programada',
        progreso: 0,
        fechaInicio: '2025-02-01',
        fechaFinEstimada: '2025-02-15',
        vendedorAsignado: 'Miguel Sales',
        prospectoObjetivo: 32,
        resultadosEsperados: 'Distribución equilibrada entre vendedores'
      }
    ];
    
    setTimeout(() => {
      setOptimizaciones(sampleData);
      setLoading(false);
    }, 500);
  }, []);

  const getStatusColor = (estatus: string) => {
    switch (estatus) {
      case 'Completada':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'En Proceso':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Programada':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Pausada':
        return 'bg-slate-100 text-slate-800 border-slate-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (estatus: string) => {
    switch (estatus) {
      case 'Completada':
        return <CheckCircle className="w-4 h-4" />;
      case 'En Proceso':
        return <PlayCircle className="w-4 h-4" />;
      case 'Programada':
        return <Clock className="w-4 h-4" />;
      case 'Pausada':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Target className="w-4 h-4" />;
    }
  };

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
          <h1 className="text-3xl font-bold text-slate-900">Centro de Optimización</h1>
          <p className="text-slate-600 mt-2">Gestiona y monitorea procesos de optimización de ventas</p>
        </div>
        <Button 
          className="bg-blue-600 hover:bg-blue-700 text-white"
          onClick={handleNuevaOptimizacion}
        >
          <Target className="w-4 h-4 mr-2" />
          Nueva Optimización
        </Button>
      </div>

      {/* Métricas Rápidas */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">3</p>
                <p className="text-sm text-slate-600">Activas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">12</p>
                <p className="text-sm text-slate-600">Completadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">18%</p>
                <p className="text-sm text-slate-600">Mejora Promedio</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">156</p>
                <p className="text-sm text-slate-600">Prospectos Optimizados</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Optimizaciones */}
      <div className="grid gap-6">
        {optimizaciones.map((optimizacion, index) => (
          <motion.div
            key={optimizacion.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <Card className="hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {getStatusIcon(optimizacion.estatus)}
                      {optimizacion.nombre}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {optimizacion.tipo} • Asignado a {optimizacion.vendedorAsignado}
                    </CardDescription>
                  </div>
                  <Badge className={getStatusColor(optimizacion.estatus)}>
                    {optimizacion.estatus}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Progreso */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-slate-700">Progreso</span>
                    <span className="text-sm font-semibold text-slate-900">{optimizacion.progreso}%</span>
                  </div>
                  <Progress value={optimizacion.progreso} className="h-2" />
                </div>

                {/* Información */}
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Fecha Inicio</p>
                    <p className="text-sm font-semibold text-slate-900">
                      {new Date(optimizacion.fechaInicio).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Fecha Objetivo</p>
                    <p className="text-sm font-semibold text-slate-900">
                      {new Date(optimizacion.fechaFinEstimada).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Prospectos Objetivo</p>
                    <p className="text-sm font-semibold text-slate-900">{optimizacion.prospectoObjetivo}</p>
                  </div>
                </div>

                {/* Resultados Esperados */}
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                    Resultados Esperados
                  </p>
                  <p className="text-sm text-slate-700">{optimizacion.resultadosEsperados}</p>
                </div>

                {/* Acciones */}
                <div className="flex gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleVerAnalisis(optimizacion.id)}
                  >
                    <BarChart3 className="w-4 h-4 mr-1" />
                    Ver Análisis
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleConfigurar(optimizacion.id)}
                  >
                    <Calculator className="w-4 h-4 mr-1" />
                    Configurar
                  </Button>
                  {optimizacion.estatus === 'Programada' && (
                    <Button 
                      size="sm" 
                      className="bg-blue-600 hover:bg-blue-700"
                      onClick={() => handleIniciar(optimizacion.id)}
                    >
                      <PlayCircle className="w-4 h-4 mr-1" />
                      Iniciar
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Modal Nueva Optimización */}
      {showNuevaOptModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Target className="w-5 h-5" />
                Crear Nueva Optimización
              </h2>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowNuevaOptModal(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nombre de la Optimización *</label>
                <Input 
                  value={nuevaOpt.nombre}
                  onChange={(e) => setNuevaOpt({...nuevaOpt, nombre: e.target.value})}
                  placeholder="Ej: Optimización Q2 2025 - Ventas Premium"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Tipo de Optimización *</label>
                <Select 
                  value={nuevaOpt.tipo} 
                  onValueChange={(value) => setNuevaOpt({...nuevaOpt, tipo: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el tipo de optimización" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Distribución de Cartera">📊 Distribución de Cartera</SelectItem>
                    <SelectItem value="Clasificación Avanzada">🎯 Clasificación SPPC Avanzada</SelectItem>
                    <SelectItem value="Carga de Trabajo">⚖️ Rebalanceo de Carga</SelectItem>
                    <SelectItem value="Seguimiento Automatizado">🤖 Seguimiento Automatizado</SelectItem>
                    <SelectItem value="Análisis Predictivo">🔮 Análisis Predictivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Vendedor Asignado *</label>
                <Select 
                  value={nuevaOpt.vendedor} 
                  onValueChange={(value) => setNuevaOpt({...nuevaOpt, vendedor: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el vendedor responsable" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Carlos Venta">Carlos Venta (Director Comercial)</SelectItem>
                    <SelectItem value="Lucía Ventas">Lucía Ventas (Gerente Senior)</SelectItem>
                    <SelectItem value="Miguel Sales">Miguel Sales (Especialista)</SelectItem>
                    <SelectItem value="Ana Martínez">Ana Martínez (Consultora)</SelectItem>
                    <SelectItem value="Luis Rodríguez">Luis Rodríguez (Ejecutivo)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Número de Prospectos Objetivo</label>
                <Input 
                  type="number"
                  value={nuevaOpt.prospectoObjetivo}
                  onChange={(e) => setNuevaOpt({...nuevaOpt, prospectoObjetivo: parseInt(e.target.value) || 0})}
                  placeholder="Ej: 25"
                  min="1"
                  max="100"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Rango recomendado: 15-50 prospectos por optimización
                </p>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">🎯 Beneficios Esperados:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Mejora promedio del 15-25% en tasa de conversión</li>
                  <li>• Reducción del 30% en tiempo de seguimiento</li>
                  <li>• Optimización automática de asignaciones</li>
                  <li>• Análisis predictivo continuo</li>
                  <li>• Alertas y recomendaciones en tiempo real</li>
                </ul>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button 
                onClick={handleGuardarOptimizacion}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                disabled={!nuevaOpt.nombre || !nuevaOpt.tipo || !nuevaOpt.vendedor || nuevaOpt.prospectoObjetivo <= 0}
              >
                Crear Optimización
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowNuevaOptModal(false)}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ver Análisis */}
      {showAnalisisModal && selectedOptimizacion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Análisis Detallado - {selectedOptimizacion.nombre}</h2>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowAnalisisModal(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* Métricas de Rendimiento */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Métricas de Rendimiento</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm font-medium text-green-800">Progreso Actual</p>
                    <p className="text-2xl font-bold text-green-900">{selectedOptimizacion.progreso}%</p>
                  </div>
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm font-medium text-blue-800">Prospectos</p>
                    <p className="text-2xl font-bold text-blue-900">{selectedOptimizacion.prospectoObjetivo}</p>
                  </div>
                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <p className="text-sm font-medium text-purple-800">Días Activo</p>
                    <p className="text-2xl font-bold text-purple-900">
                      {Math.floor((new Date().getTime() - new Date(selectedOptimizacion.fechaInicio).getTime()) / (1000 * 3600 * 24))}
                    </p>
                  </div>
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm font-medium text-amber-800">Conversiones</p>
                    <p className="text-2xl font-bold text-amber-900">{Math.floor(selectedOptimizacion.prospectoObjetivo * 0.15)}</p>
                  </div>
                </div>
              </div>

              {/* Timeline del Proceso */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Timeline del Proceso</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium text-slate-900">Análisis Inicial Completado</p>
                      <p className="text-sm text-slate-600">{new Date(selectedOptimizacion.fechaInicio).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-2 ${selectedOptimizacion.progreso > 25 ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                    <div>
                      <p className="font-medium text-slate-900">Segmentación de Prospectos</p>
                      <p className="text-sm text-slate-600">{selectedOptimizacion.progreso > 25 ? 'Completado' : 'En proceso'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-2 ${selectedOptimizacion.progreso > 50 ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                    <div>
                      <p className="font-medium text-slate-900">Asignación Optimizada</p>
                      <p className="text-sm text-slate-600">{selectedOptimizacion.progreso > 50 ? 'Completado' : 'Pendiente'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-2 ${selectedOptimizacion.progreso > 75 ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                    <div>
                      <p className="font-medium text-slate-900">Implementación Activa</p>
                      <p className="text-sm text-slate-600">{selectedOptimizacion.progreso > 75 ? 'En curso' : 'Pendiente'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Resultados y Recomendaciones */}
            <div className="mt-6 space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Resultados y Recomendaciones</h3>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-medium text-green-800 mb-2">✅ Logros Alcanzados</h4>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>• {Math.floor(selectedOptimizacion.prospectoObjetivo * 0.6)} prospectos reclasificados</li>
                    <li>• {Math.floor(selectedOptimizacion.prospectoObjetivo * 0.15)} conversiones adicionales</li>
                    <li>• 23% mejora en tiempo de respuesta</li>
                    <li>• Reducción del 18% en prospectos inactivos</li>
                  </ul>
                </div>
                
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">📊 Próximas Acciones</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Implementar seguimiento automatizado</li>
                    <li>• Expandir a {Math.floor(selectedOptimizacion.prospectoObjetivo * 1.5)} prospectos</li>
                    <li>• Configurar alertas predictivas</li>
                    <li>• Generar reporte semanal automático</li>
                  </ul>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-lg">
                <h4 className="font-medium text-slate-800 mb-2">💡 Insights del Análisis</h4>
                <p className="text-sm text-slate-700">
                  La optimización está funcionando por encima de las expectativas. Los prospectos tipo "Elite" 
                  muestran una tasa de conversión 34% superior al promedio histórico. Se recomienda expandir 
                  la estrategia a otros segmentos similares y automatizar el proceso de seguimiento para 
                  maximizar la eficiencia del equipo de ventas.
                </p>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button 
                className="bg-blue-600 hover:bg-blue-700"
                onClick={handleExportarAnalisis}
              >
                Exportar Análisis Completo
              </Button>
              <Button 
                variant="outline"
                onClick={handleProgramarReporte}
              >
                Programar Reporte Automático
              </Button>
              <Button 
                variant="outline"
                onClick={handleDuplicarOptimizacion}
              >
                Duplicar Optimización
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowAnalisisModal(false)}
              >
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Configurar */}
      {showConfigModal && selectedOptimizacion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Configurar Optimización - {selectedOptimizacion.nombre}
              </h2>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowConfigModal(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-6">
              {/* Parámetros Principales */}
              <div>
                <h3 className="text-lg font-semibold border-b pb-2 mb-4">Parámetros Principales</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Frecuencia de Análisis</label>
                    <Select defaultValue="diario">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tiempo-real">⚡ Tiempo Real</SelectItem>
                        <SelectItem value="diario">📅 Diario</SelectItem>
                        <SelectItem value="semanal">📆 Semanal</SelectItem>
                        <SelectItem value="mensual">🗓️ Mensual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Umbral de Conversión (%)</label>
                    <Input type="number" defaultValue="15" min="5" max="50" />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Máximo Prospectos por Vendedor</label>
                    <Input type="number" defaultValue="25" min="10" max="100" />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Prioridad SPPC Mínima</label>
                    <Select defaultValue="calificado">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="explorador">🔍 Explorador</SelectItem>
                        <SelectItem value="a-madurar">🌱 A Madurar</SelectItem>
                        <SelectItem value="calificado">✅ Calificado</SelectItem>
                        <SelectItem value="elite">⭐ Elite</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Automatizaciones */}
              <div>
                <h3 className="text-lg font-semibold border-b pb-2 mb-4">Automatizaciones</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <p className="font-medium text-slate-900">Reasignación Automática</p>
                      <p className="text-sm text-slate-600">Redistribuir prospectos según carga de trabajo</p>
                    </div>
                    <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600" />
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <p className="font-medium text-slate-900">Seguimiento Predictivo</p>
                      <p className="text-sm text-slate-600">Sugerir mejores horarios de contacto</p>
                    </div>
                    <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600" />
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <p className="font-medium text-slate-900">Alertas de Oportunidad</p>
                      <p className="text-sm text-slate-600">Notificar prospectos con alta probabilidad</p>
                    </div>
                    <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600" />
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <p className="font-medium text-slate-900">Reporte Semanal</p>
                      <p className="text-sm text-slate-600">Generar análisis automático semanal</p>
                    </div>
                    <input type="checkbox" className="w-4 h-4 text-blue-600" />
                  </div>
                </div>
              </div>

              {/* Configuración Avanzada */}
              <div>
                <h3 className="text-lg font-semibold border-b pb-2 mb-4">Configuración Avanzada</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Horarios de Actividad</label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input type="time" defaultValue="08:00" placeholder="Inicio" />
                      <Input type="time" defaultValue="18:00" placeholder="Fin" />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Días de la Semana Activos</label>
                    <div className="flex gap-2">
                      {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((dia, idx) => (
                        <div key={idx} className="flex items-center">
                          <input 
                            type="checkbox" 
                            defaultChecked={idx < 5} 
                            className="w-4 h-4 mr-1 text-blue-600" 
                          />
                          <label className="text-sm text-slate-700">{dia}</label>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Configuraciones Personalizadas (JSON)</label>
                    <textarea 
                      className="w-full p-3 border border-slate-300 rounded-lg text-xs font-mono"
                      rows={4}
                      defaultValue='{\n  "algoritmo": "ml_avanzado",\n  "pesos_scoring": {\n    "sppc": 0.4,\n    "historico": 0.3,\n    "comportamiento": 0.3\n  }\n}'
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button 
                onClick={handleGuardarConfiguracion}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                Guardar Configuración
              </Button>
              <Button 
                variant="outline"
                onClick={handleProbarConfiguracion}
              >
                Probar Configuración
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowConfigModal(false)}
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
