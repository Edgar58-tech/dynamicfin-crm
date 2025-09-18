
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, 
  Mic, 
  TrendingUp, 
  Clock, 
  Target,
  Users,
  MessageCircle,
  Lightbulb,
  DollarSign,
  RefreshCw,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import MetricCard from './metric-card';
import ChartComponent from './chart-component';
import { useToast } from '@/components/ui/use-toast';

interface AnalisisIA {
  totalGrabacionesProcesadas: number;
  tiempoPromedioLlamadas: number;
  scorePromedioConversacion: number;
  rendimientoPorVendedor: any[];
  palabrasClaveEfectivas: any[];
  objecionesComunes: any[];
  mejoresHorarios: any[];
  analisisSentimiento: {
    positivo: number;
    neutro: number;
    negativo: number;
  };
  recomendaciones: any[];
  costosIA: any;
  fechaAnalisis: string;
}

export default function GrabacionesDashboard() {
  const [analisisIA, setAnalisisIA] = useState<AnalisisIA | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchAnalisisIA();
  }, []);

  const fetchAnalisisIA = async () => {
    try {
      const response = await fetch('/api/gerencial/analisis-ia');
      if (response.ok) {
        const data = await response.json();
        setAnalisisIA(data);
      }
    } catch (error) {
      console.error('Error fetching AI analysis:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar el análisis de IA",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-200 rounded-lg animate-pulse"></div>
          ))}
        </div>
        <div className="h-64 bg-slate-200 rounded-lg animate-pulse"></div>
      </div>
    );
  }

  const sentimientoData = analisisIA ? [
    { name: 'Positivo', value: analisisIA.analisisSentimiento.positivo, color: '#72BF78' },
    { name: 'Neutro', value: analisisIA.analisisSentimiento.neutro, color: '#A19AD3' },
    { name: 'Negativo', value: analisisIA.analisisSentimiento.negativo, color: '#FF6363' }
  ] : [];

  const horariosData = analisisIA?.mejoresHorarios?.map(h => ({
    name: h.horario,
    value: h.tasaConversion,
    llamadas: h.llamadas
  })) || [];

  return (
    <div className="space-y-6">
      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          title="Grabaciones Procesadas"
          value={analisisIA?.totalGrabacionesProcesadas || 0}
          icon={Mic}
          description="Total del mes"
          change={15}
          changeType="positive"
        />
        <MetricCard
          title="Duración Promedio"
          value={analisisIA?.tiempoPromedioLlamadas || 0}
          icon={Clock}
          description="Minutos por llamada"
          unit="min"
          alert={(analisisIA?.tiempoPromedioLlamadas || 0) < 3}
        />
        <MetricCard
          title="Score IA Promedio"
          value={analisisIA?.scorePromedioConversacion || 0}
          icon={Brain}
          description="Calidad de conversación"
          unit="%"
          change={8}
          changeType="positive"
          alert={(analisisIA?.scorePromedioConversacion || 0) < 70}
        />
        <MetricCard
          title="Costo por Grabación"
          value={Number(analisisIA?.costosIA?.costoPromedioPorGrabacion || 0).toFixed(2)}
          icon={DollarSign}
          description="Costo promedio IA"
          unit="MXN"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rendimiento por Vendedor */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Top Vendedores (IA Score)
                </CardTitle>
                <CardDescription>
                  Basado en análisis automático de conversaciones
                </CardDescription>
              </div>
              <Badge variant="outline" className="gap-1">
                <Brain className="w-3 h-3" />
                IA Analysis
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analisisIA?.rendimientoPorVendedor?.slice(0, 5)?.map((vendedor, index) => (
                <motion.div
                  key={vendedor.vendedorId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                      index === 0 ? 'bg-yellow-100 text-yellow-800' :
                      index === 1 ? 'bg-gray-100 text-gray-800' :
                      index === 2 ? 'bg-orange-100 text-orange-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">{vendedor.nombre}</p>
                      <p className="text-xs text-slate-500">
                        {vendedor.grabaciones} grabaciones • {vendedor.duracionPromedio} min promedio
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <Badge variant={vendedor.scorePromedio >= 80 ? "default" : "outline"}>
                        {vendedor.scorePromedio}% IA
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {vendedor.tasaConversion}% conversión
                      </Badge>
                    </div>
                  </div>
                </motion.div>
              )) || (
                <p className="text-center text-slate-500 py-8">
                  No hay datos de rendimiento disponibles
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Análisis de Sentimiento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Análisis de Sentimiento
            </CardTitle>
            <CardDescription>
              Clasificación automática del tono de las conversaciones
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <ChartComponent
                type="pie"
                data={sentimientoData}
                height={200}
                showLegend={false}
              />
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium text-slate-700">Positivo</span>
                  </div>
                  <p className="text-lg font-bold text-slate-800">
                    {analisisIA?.analisisSentimiento?.positivo || 0}
                  </p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                    <span className="text-sm font-medium text-slate-700">Neutro</span>
                  </div>
                  <p className="text-lg font-bold text-slate-800">
                    {analisisIA?.analisisSentimiento?.neutro || 0}
                  </p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-sm font-medium text-slate-700">Negativo</span>
                  </div>
                  <p className="text-lg font-bold text-slate-800">
                    {analisisIA?.analisisSentimiento?.negativo || 0}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mejores Horarios para Llamar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Mejores Horarios de Contacto
            </CardTitle>
            <CardDescription>
              Horarios con mayor tasa de conversión según IA
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartComponent
              type="bar"
              data={horariosData}
              height={250}
              showLegend={false}
            />
          </CardContent>
        </Card>

        {/* Palabras Clave Más Efectivas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Palabras Clave Efectivas
            </CardTitle>
            <CardDescription>
              Términos que generan mayor conversión
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analisisIA?.palabrasClaveEfectivas?.map((palabra, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-slate-800 capitalize">
                      "{palabra.palabra}"
                    </p>
                    <p className="text-sm text-slate-500">
                      Usado {palabra.frecuencia} veces
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant={palabra.tasaEfectividad >= 50 ? "default" : "outline"}>
                      {palabra.tasaEfectividad}% efectividad
                    </Badge>
                  </div>
                </div>
              )) || (
                <p className="text-center text-slate-500 py-8">
                  No hay datos de palabras clave disponibles
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recomendaciones Automáticas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5" />
            Recomendaciones Automáticas
          </CardTitle>
          <CardDescription>
            Insights generados por IA para mejorar el rendimiento del equipo
          </CardDescription>
        </CardHeader>
        <CardContent>
          {analisisIA?.recomendaciones && analisisIA.recomendaciones.length > 0 ? (
            <div className="space-y-4">
              {analisisIA.recomendaciones.map((rec, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className={`p-4 border rounded-lg ${
                    rec.prioridad === 'alta' ? 'border-red-200 bg-red-50' :
                    rec.prioridad === 'media' ? 'border-yellow-200 bg-yellow-50' :
                    'border-blue-200 bg-blue-50'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      rec.prioridad === 'alta' ? 'bg-red-100' :
                      rec.prioridad === 'media' ? 'bg-yellow-100' :
                      'bg-blue-100'
                    }`}>
                      {rec.prioridad === 'alta' ? (
                        <AlertCircle className="w-5 h-5 text-red-600" />
                      ) : (
                        <Lightbulb className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className={`font-semibold ${
                            rec.prioridad === 'alta' ? 'text-red-800' :
                            rec.prioridad === 'media' ? 'text-yellow-800' :
                            'text-blue-800'
                          }`}>
                            {rec.titulo}
                          </h4>
                          <p className={`text-sm mt-1 ${
                            rec.prioridad === 'alta' ? 'text-red-700' :
                            rec.prioridad === 'media' ? 'text-yellow-700' :
                            'text-blue-700'
                          }`}>
                            {rec.descripcion}
                          </p>
                        </div>
                        <Badge variant={rec.prioridad === 'alta' ? 'destructive' : 'outline'}>
                          {rec.prioridad}
                        </Badge>
                      </div>
                      <Button size="sm" variant="outline" className="mt-2">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Implementar
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-800 mb-2">
                Rendimiento Óptimo
              </h3>
              <p className="text-slate-500">
                No hay recomendaciones de mejora en este momento. El equipo está funcionando bien.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Costos de IA */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Análisis de Costos IA
          </CardTitle>
          <CardDescription>
            Desglose de costos de transcripción y análisis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <p className="text-sm text-slate-600 mb-1">Total Transcripción</p>
              <p className="text-lg font-bold text-slate-800">
                ${(analisisIA?.costosIA?.totalTranscripcion || 0).toFixed(2)}
              </p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <p className="text-sm text-slate-600 mb-1">Total Análisis</p>
              <p className="text-lg font-bold text-slate-800">
                ${(analisisIA?.costosIA?.totalAnalisis || 0).toFixed(2)}
              </p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <p className="text-sm text-slate-600 mb-1">Promedio por Grabación</p>
              <p className="text-lg font-bold text-slate-800">
                ${(analisisIA?.costosIA?.costoPromedioPorGrabacion || 0).toFixed(2)}
              </p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <p className="text-sm text-slate-600 mb-1">Total Procesadas</p>
              <p className="text-lg font-bold text-slate-800">
                {analisisIA?.costosIA?.totalProcesadas || 0}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
