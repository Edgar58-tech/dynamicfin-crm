

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { RolePlayScenario } from '@prisma/client';
import type { Prisma } from '@prisma/client';

import { 
  PlayCircle, 
  BookOpen, 
  Target, 
  TrendingUp,
  Award,
  Clock,
  MessageSquare,
  Brain,
  Star,
  Trophy,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  Calendar,
  Users,
  Zap
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import RolePlaySimulator from '@/components/roleplay-simulator';
import RolePlayScenarios from '@/components/roleplay-scenarios';
// import { redirect } from 'next/navigation';

interface Progress {
  totalSesiones: number;
  sesionesCompletadas: number;
  puntuacionPromedio: number;
  puntuacionMejor: number;
  ventasSimuladas: number;
  nivelActual: string;
  puntosGameficacion: number;
  badges: string[];
  mejoraGeneral: number;
  escenariosPorCategoria: any;
}

interface RecentSession {
  id: number;
  scenario: {
    titulo: string;
    categoria: string;
    tipoCliente: string;
  };
  puntuacionGeneral: number;
  fechaEvaluacion: string;
  duracionSesion: number;
}

export default function RolePlayPage() {
  const { data: session, status } = useSession() || {};
  // const session = null;
  // const status = 'unauthenticated';
  const [activeTab, setActiveTab] = useState('simulador');
  const [selectedScenario, setSelectedScenario] = useState<RolePlayScenario | undefined>(undefined);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // if (status === 'authenticated') {
      // fetchProgress();
      // fetchRecentSessions();
    // }
  }, [status]);

  const fetchProgress = async () => {
    try {
      const response = await fetch('/api/roleplay/progress');
      if (response.ok) {
        const data = await response.json();
        setProgress(data.progress);
      }
    } catch (error) {
      console.error('Error fetching progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentSessions = async () => {
    try {
      const response = await fetch('/api/roleplay/evaluate?limit=5');
      if (response.ok) {
        const data = await response.json();
        setRecentSessions(data.evaluations);
      }
    } catch (error) {
      console.error('Error fetching recent sessions:', error);
    }
  };

  const handleScenarioSelect = (scenario: RolePlayScenario) => {
    setSelectedScenario(scenario);
    setActiveTab('simulador');
  };

  const handleStartSimulation = (scenario: RolePlayScenario) => {
    setSelectedScenario(scenario);
    setActiveTab('simulador');
    toast.success(`Iniciando simulación: ${scenario.titulo}`);
  };

  const handleSessionComplete = (sessionData: any) => {
    // Refrescar datos después de completar sesión
    fetchProgress();
    fetchRecentSessions();
    toast.success('¡Sesión completada! Revisa tu progreso.');
  };

  const handleViewEvaluation = (sessionId: number) => {
    // Aquí podrías navegar a una página de evaluación detallada
    toast.success('Abriendo evaluación detallada...');
  };

  const getNivelColor = (nivel: string) => {
    switch (nivel) {
      case 'experto': return 'text-purple-600';
      case 'avanzado': return 'text-blue-600';
      case 'medio': return 'text-green-600';
      default: return 'text-slate-600';
    }
  };

  const getNivelIcon = (nivel: string) => {
    switch (nivel) {
      case 'experto': return <Trophy className="w-5 h-5" />;
      case 'avanzado': return <Award className="w-5 h-5" />;
      case 'medio': return <Target className="w-5 h-5" />;
      default: return <PlayCircle className="w-5 h-5" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (status === 'loading') {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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

  // Temporarily bypass authentication for debugging
  // if (!session || !['VENDEDOR', 'GERENTE_VENTAS', 'GERENTE_GENERAL', 'DIRECTOR_MARCA', 'DIRECTOR_GENERAL', 'DYNAMICFIN_ADMIN'].includes(session.user.rol)) {
  //   redirect('/dashboard');
  // }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            🎭 Entrenamiento Role Play
          </h1>
          <p className="text-slate-600 mt-1">
            Practica y perfecciona tus habilidades de venta con IA avanzada
          </p>
        </div>
        
        {progress && (
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="flex items-center gap-2">
                <span className={`font-semibold ${getNivelColor(progress.nivelActual)}`}>
                  Nivel {progress.nivelActual}
                </span>
                {getNivelIcon(progress.nivelActual)}
              </div>
              <div className="text-sm text-slate-600">
                {progress.puntosGameficacion} puntos
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Dashboard Stats */}
      {progress && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-8 h-8 text-blue-600" />
                  <div>
                    <p className="text-sm text-slate-600">Sesiones Completadas</p>
                    <p className="text-2xl font-bold text-slate-800">
                      {progress.sesionesCompletadas}
                    </p>
                    <p className="text-xs text-green-600">
                      de {progress.totalSesiones} iniciadas
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <BarChart3 className="w-8 h-8 text-green-600" />
                  <div>
                    <p className="text-sm text-slate-600">Puntuación Promedio</p>
                    <p className={`text-2xl font-bold ${getScoreColor(progress.puntuacionPromedio)}`}>
                      {Math.round(progress.puntuacionPromedio)}
                    </p>
                    <p className="text-xs text-slate-500">
                      Mejor: {Math.round(progress.puntuacionMejor)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-8 h-8 text-purple-600" />
                  <div>
                    <p className="text-sm text-slate-600">Ventas Logradas</p>
                    <p className="text-2xl font-bold text-slate-800">
                      {progress.ventasSimuladas}
                    </p>
                    <p className="text-xs text-purple-600">
                      {progress.sesionesCompletadas > 0 ? 
                        Math.round((progress.ventasSimuladas / progress.sesionesCompletadas) * 100) : 0
                      }% efectividad
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-8 h-8 text-yellow-600" />
                  <div>
                    <p className="text-sm text-slate-600">Mejora Mensual</p>
                    <p className={`text-2xl font-bold ${
                      progress.mejoraGeneral >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {progress.mejoraGeneral >= 0 ? '+' : ''}{Math.round(progress.mejoraGeneral)}%
                    </p>
                    <p className="text-xs text-slate-500">vs mes anterior</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="simulador" className="gap-2">
            <Brain className="w-4 h-4" />
            Simulador
          </TabsTrigger>
          <TabsTrigger value="escenarios" className="gap-2">
            <BookOpen className="w-4 h-4" />
            Escenarios
          </TabsTrigger>
          <TabsTrigger value="progreso" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            Mi Progreso
          </TabsTrigger>
          <TabsTrigger value="estadisticas" className="gap-2">
            <Award className="w-4 h-4" />
            Estadísticas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="simulador" className="space-y-6">
          <RolePlaySimulator
            scenario={selectedScenario}
            onComplete={handleSessionComplete}
            onEvaluate={handleViewEvaluation}
          />
        </TabsContent>

        <TabsContent value="escenarios" className="space-y-6">
          <RolePlayScenarios
            selectedScenario={selectedScenario}
            onSelectScenario={handleScenarioSelect}
            onStartSimulation={handleStartSimulation}
            showManagement={true}
          />
        </TabsContent>

        <TabsContent value="progreso" className="space-y-6">
          {progress && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Progreso General */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-blue-600" />
                    Progreso General
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-slate-600">Nivel de Experiencia</span>
                      <Badge className={getNivelColor(progress.nivelActual)}>
                        {progress.nivelActual}
                      </Badge>
                    </div>
                    <Progress value={(progress.puntosGameficacion % 1000) / 10} />
                    <p className="text-xs text-slate-500 mt-1">
                      {progress.puntosGameficacion} / {Math.ceil(progress.puntosGameficacion / 1000) * 1000} puntos
                    </p>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-slate-600">Tasa de Finalización</span>
                      <span className="text-sm font-semibold">
                        {progress.totalSesiones > 0 ? 
                          Math.round((progress.sesionesCompletadas / progress.totalSesiones) * 100) : 0
                        }%
                      </span>
                    </div>
                    <Progress value={progress.totalSesiones > 0 ? 
                      (progress.sesionesCompletadas / progress.totalSesiones) * 100 : 0
                    } />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-slate-600">Efectividad de Ventas</span>
                      <span className="text-sm font-semibold">
                        {progress.sesionesCompletadas > 0 ? 
                          Math.round((progress.ventasSimuladas / progress.sesionesCompletadas) * 100) : 0
                        }%
                      </span>
                    </div>
                    <Progress value={progress.sesionesCompletadas > 0 ? 
                      (progress.ventasSimuladas / progress.sesionesCompletadas) * 100 : 0
                    } />
                  </div>
                </CardContent>
              </Card>

              {/* Badges y Logros */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-yellow-600" />
                    Logros Desbloqueados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {progress.badges.length > 0 ? (
                    <div className="space-y-3">
                      {progress.badges.map((badge, index) => (
                        <motion.div
                          key={badge}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-center gap-3 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border"
                        >
                          <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                            <Award className="w-4 h-4 text-yellow-600" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-800">{badge}</p>
                            <p className="text-xs text-slate-600">
                              Logro desbloqueado
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <Trophy className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                      <p className="text-slate-600">Completa más sesiones para desbloquear logros</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Rendimiento por Categoría */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-green-600" />
                    Rendimiento por Categoría
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(progress.escenariosPorCategoria || {}).map(([categoria, data]: [string, any]) => (
                      <div key={categoria} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium capitalize">
                            {categoria.replace('_', ' ')}
                          </span>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-slate-600">
                              {data.completadas}/{data.total} completadas
                            </span>
                            {data.puntuacionPromedio > 0 && (
                              <span className={`font-semibold ${getScoreColor(data.puntuacionPromedio)}`}>
                                {Math.round(data.puntuacionPromedio)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Progress 
                            value={data.total > 0 ? (data.completadas / data.total) * 100 : 0} 
                            className="flex-1"
                          />
                          {data.puntuacionPromedio > 0 && (
                            <Progress 
                              value={data.puntuacionPromedio} 
                              className="flex-1"
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="estadisticas" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sesiones Recientes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  Sesiones Recientes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentSessions.length > 0 ? (
                  <div className="space-y-3">
                    {recentSessions.map((session, index) => (
                      <motion.div
                        key={session.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-sm text-slate-800 line-clamp-1">
                            {session.scenario.titulo}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {session.scenario.categoria}
                            </Badge>
                            <span className="text-xs text-slate-500">
                              {session.duracionSesion} min
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${getScoreColor(session.puntuacionGeneral)}`}>
                            {Math.round(session.puntuacionGeneral)}
                          </p>
                          <p className="text-xs text-slate-500">
                            {new Date(session.fechaEvaluacion).toLocaleDateString()}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <MessageSquare className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                    <p className="text-slate-600">No hay sesiones completadas aún</p>
                    <Button
                      size="sm"
                      onClick={() => setActiveTab('escenarios')}
                      className="mt-2 gap-2"
                    >
                      <PlayCircle className="w-4 h-4" />
                      Comenzar Primera Sesión
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-purple-600" />
                  Acciones Rápidas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={() => setActiveTab('escenarios')}
                  className="w-full justify-start gap-2"
                  variant="outline"
                >
                  <BookOpen className="w-4 h-4" />
                  Explorar Escenarios
                </Button>
                
                <Button
                  onClick={() => {
                    // Seleccionar escenario aleatorio para práctica rápida
                    setActiveTab('simulador');
                    toast('Cargando escenario de práctica rápida...');
                  }}
                  className="w-full justify-start gap-2"
                  variant="outline"
                >
                  <PlayCircle className="w-4 h-4" />
                  Práctica Rápida
                </Button>
                
                <Button
                  onClick={() => {
                    // Ir a feedback pendiente
                    toast.success('Revisando feedback pendiente...');
                  }}
                  className="w-full justify-start gap-2"
                  variant="outline"
                >
                  <MessageSquare className="w-4 h-4" />
                  Feedback Pendiente
                </Button>
                
                <Button
                  onClick={() => setActiveTab('progreso')}
                  className="w-full justify-start gap-2"
                  variant="outline"
                >
                  <BarChart3 className="w-4 h-4" />
                  Ver Progreso Detallado
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

