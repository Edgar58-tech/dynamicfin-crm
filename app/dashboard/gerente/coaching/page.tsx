
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  GraduationCap, 
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  User,
  Calendar,
  MessageSquare,
  BarChart3,
  Target,
  Award,
  BookOpen,
  Users,
  Play
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import toast from 'react-hot-toast';
import { Progress } from '@/components/ui/progress';

interface VendedorCoaching {
  id: string;
  nombre: string;
  apellido: string;
  especialidad: string;
  estadoRendimiento: 'excelente' | 'bueno' | 'necesita_coaching' | 'critico';
  metricas: {
    tasaConversion: number;
    metaMensual: number;
    autosVendidos: number;
    leadsActivos: number;
    tiempoPromedioLlamada: number;
    seguimientosPromedio: number;
    conversionSospechoso: number;
    conversionProspecto: number;
    conversionPrueba: number;
  };
  problemasPrincipales: string[];
  fortalezas: string[];
  ultimasSesiones: SesionCoaching[];
  proximaSesion?: Date;
  progreso: number; // 0-100
}

interface SesionCoaching {
  id: number;
  fecha: Date;
  tipoCoaching: string;
  duracion: number;
  problemasIdentificados: string[];
  planMejora: string[];
  resultados?: string[];
  completado: boolean;
}

interface PlanCoaching {
  vendedorId: string;
  tipoCoaching: string;
  problemasIdentificados: string[];
  objetivos: string[];
  actividades: string[];
  fechaSesion: Date;
  duracionEstimada: number;
}

export default function CoachingPage() {
  const { data: session, status } = useSession();
  const [vendedores, setVendedores] = useState<VendedorCoaching[]>([]);
  const [selectedVendedor, setSelectedVendedor] = useState<VendedorCoaching | null>(null);
  const [nuevoCoaching, setNuevoCoaching] = useState<PlanCoaching | null>(null);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('todos');
  
  // Estados para el formulario de coaching
  const [formData, setFormData] = useState({
    tipoCoaching: '',
    fechaSesion: '',
    objetivos: ''
  });
  const [currentVendedorId, setCurrentVendedorId] = useState<string | null>(null);

  useEffect(() => {
    fetchCoachingData();
  }, []);

  const fetchCoachingData = async () => {
    try {
      setLoading(true);
      
      // Simular data hasta que la API esté lista
      const mockVendedores: VendedorCoaching[] = [
        {
          id: '1',
          nombre: 'Carlos',
          apellido: 'Hernández',
          especialidad: 'SUVs Premium',
          estadoRendimiento: 'excelente',
          metricas: {
            tasaConversion: 28,
            metaMensual: 8,
            autosVendidos: 8,
            leadsActivos: 22,
            tiempoPromedioLlamada: 18,
            seguimientosPromedio: 5.2,
            conversionSospechoso: 78,
            conversionProspecto: 65,
            conversionPrueba: 85
          },
          problemasPrincipales: [],
          fortalezas: [
            'Excelente técnica de cierre',
            'Especialista en SUVs premium',
            'Alta satisfacción del cliente',
            'Seguimientos consistentes'
          ],
          ultimasSesiones: [
            {
              id: 1,
              fecha: new Date('2025-08-15'),
              tipoCoaching: 'mejora_continua',
              duracion: 45,
              problemasIdentificados: [],
              planMejora: ['Técnicas avanzadas de venta consultiva'],
              resultados: ['Aumento 12% en ticket promedio'],
              completado: true
            }
          ],
          progreso: 95
        },
        {
          id: '2',
          nombre: 'María',
          apellido: 'González',
          especialidad: 'Autos Familiares',
          estadoRendimiento: 'bueno',
          metricas: {
            tasaConversion: 22,
            metaMensual: 6,
            autosVendidos: 7,
            leadsActivos: 18,
            tiempoPromedioLlamada: 15,
            seguimientosPromedio: 4.1,
            conversionSospechoso: 72,
            conversionProspecto: 58,
            conversionPrueba: 78
          },
          problemasPrincipales: [
            'Puede mejorar conversión de Prospecto a Prueba'
          ],
          fortalezas: [
            'Excelente rapport con clientes',
            'Conocimiento técnico sólido',
            'Puntual y organizada'
          ],
          ultimasSesiones: [],
          progreso: 82
        },
        {
          id: '3',
          nombre: 'Ana',
          apellido: 'López',
          especialidad: 'Autos Compactos',
          estadoRendimiento: 'necesita_coaching',
          metricas: {
            tasaConversion: 8,
            metaMensual: 5,
            autosVendidos: 2,
            leadsActivos: 32,
            tiempoPromedioLlamada: 8,
            seguimientosPromedio: 2.1,
            conversionSospechoso: 45,
            conversionProspecto: 28,
            conversionPrueba: 55
          },
          problemasPrincipales: [
            'Conversión muy baja en todas las etapas',
            'Llamadas muy cortas (8 min vs 15 min meta)',
            'Pocos seguimientos (2.1 vs 4.5 meta)',
            'Muchos leads estancados en Prospecto',
            'No pregunta sobre presupuesto en 78% de llamadas'
          ],
          fortalezas: [
            'Puntual y responsable',
            'Buena actitud para aprender',
            'Conocimiento básico de productos'
          ],
          ultimasSesiones: [
            {
              id: 2,
              fecha: new Date('2025-09-01'),
              tipoCoaching: 'conversion',
              duracion: 60,
              problemasIdentificados: [
                'Falta de técnicas de calificación',
                'No maneja objeciones correctamente'
              ],
              planMejora: [
                'Script de calificación financiera',
                'Role playing con manejo de objeciones',
                'Sistema de seguimientos organizados'
              ],
              resultados: [
                'Mejora 125% en conversión (8% a 18%)',
                'Reducción 57% en leads estancados',
                'Aumento tiempo promedio llamada a 16 min'
              ],
              completado: true
            }
          ],
          proximaSesion: new Date('2025-09-20'),
          progreso: 45
        },
        {
          id: '4',
          nombre: 'Pedro',
          apellido: 'Ramírez',
          especialidad: 'Sedanes',
          estadoRendimiento: 'bueno',
          metricas: {
            tasaConversion: 15,
            metaMensual: 4,
            autosVendidos: 5,
            leadsActivos: 12,
            tiempoPromedioLlamada: 12,
            seguimientosPromedio: 3.8,
            conversionSospechoso: 58,
            conversionProspecto: 38,
            conversionPrueba: 65
          },
          problemasPrincipales: [
            'Puede expandir especialización a otros modelos',
            'Mejorar técnicas de prospección inicial'
          ],
          fortalezas: [
            'Buen cierre en etapa Prueba',
            'Clientes satisfechos (9.2/10)',
            'Especialista emergente en compactos'
          ],
          ultimasSesiones: [],
          proximaSesion: new Date('2025-09-18'),
          progreso: 78
        }
      ];

      setVendedores(mockVendedores);
      
    } catch (error) {
      console.error('Error fetching coaching data:', error);
      toast.error('Error al cargar datos de coaching');
    } finally {
      setLoading(false);
    }
  };

  const programarSesionCoaching = async () => {
    if (!currentVendedorId || !formData.tipoCoaching || !formData.fechaSesion || !formData.objetivos) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    try {
      const coachingData = {
        vendedorId: currentVendedorId,
        tipoCoaching: formData.tipoCoaching,
        objetivos: [formData.objetivos],
        fechaSesion: formData.fechaSesion,
        duracionEstimada: 60
      };

      const response = await fetch('/api/gerente/coaching/programar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(coachingData)
      });

      if (response.ok) {
        const resultado = await response.json();
        toast.success('Sesión de coaching programada exitosamente');
        setFormData({ tipoCoaching: '', fechaSesion: '', objetivos: '' });
        setCurrentVendedorId(null);
        fetchCoachingData(); // Recargar datos
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Error al programar sesión de coaching');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error de conexión al servidor');
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'excelente':
        return 'bg-green-100 text-green-800';
      case 'bueno':
        return 'bg-blue-100 text-blue-800';
      case 'necesita_coaching':
        return 'bg-yellow-100 text-yellow-800';
      case 'critico':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'excelente':
        return <Award className="w-5 h-5 text-green-600" />;
      case 'bueno':
        return <CheckCircle className="w-5 h-5 text-blue-600" />;
      case 'necesita_coaching':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'critico':
        return <TrendingDown className="w-5 h-5 text-red-600" />;
      default:
        return <User className="w-5 h-5 text-gray-600" />;
    }
  };

  const vendedoresFiltered = vendedores.filter(vendedor => {
    if (filtroEstado === 'todos') return true;
    return vendedor.estadoRendimiento === filtroEstado;
  });

  if (status === 'loading' || loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
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
            🎓 Coaching y Desarrollo del Equipo
          </h1>
          <p className="text-slate-600 mt-1">
            Desarrolla el potencial de cada vendedor con coaching basado en datos
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={filtroEstado} onValueChange={setFiltroEstado}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los Estados</SelectItem>
              <SelectItem value="excelente">Excelente</SelectItem>
              <SelectItem value="bueno">Bueno</SelectItem>
              <SelectItem value="necesita_coaching">Necesita Coaching</SelectItem>
              <SelectItem value="critico">Crítico</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            onClick={fetchCoachingData}
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Resumen General */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Award className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm text-slate-600">Excelentes</p>
                <p className="text-2xl font-bold text-green-600">
                  {vendedores.filter(v => v.estadoRendimiento === 'excelente').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-slate-600">Buenos</p>
                <p className="text-2xl font-bold text-blue-600">
                  {vendedores.filter(v => v.estadoRendimiento === 'bueno').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-yellow-600" />
              <div>
                <p className="text-sm text-slate-600">Necesitan Coaching</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {vendedores.filter(v => v.estadoRendimiento === 'necesita_coaching').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <TrendingDown className="w-8 h-8 text-red-600" />
              <div>
                <p className="text-sm text-slate-600">Críticos</p>
                <p className="text-2xl font-bold text-red-600">
                  {vendedores.filter(v => v.estadoRendimiento === 'critico').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Vendedores */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {vendedoresFiltered.map((vendedor, index) => (
          <motion.div
            key={vendedor.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getEstadoIcon(vendedor.estadoRendimiento)}
                    <div>
                      <CardTitle className="text-lg">
                        {vendedor.nombre} {vendedor.apellido}
                      </CardTitle>
                      <CardDescription>
                        {vendedor.especialidad}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge className={getEstadoColor(vendedor.estadoRendimiento)}>
                    {vendedor.estadoRendimiento === 'excelente' ? '🏆 Excelente' :
                     vendedor.estadoRendimiento === 'bueno' ? '✅ Bueno' :
                     vendedor.estadoRendimiento === 'necesita_coaching' ? '⚠️ Necesita Coaching' :
                     '🚨 Crítico'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Métricas Principales */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500">Conversión</p>
                    <div className="flex items-center gap-2">
                      <p className={`font-semibold ${
                        vendedor.metricas.tasaConversion >= 25 ? 'text-green-600' :
                        vendedor.metricas.tasaConversion >= 15 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {vendedor.metricas.tasaConversion}%
                      </p>
                      {vendedor.metricas.tasaConversion >= 20 ? (
                        <TrendingUp className="w-4 h-4 text-green-500" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Ventas / Meta</p>
                    <p className="font-semibold">
                      {vendedor.metricas.autosVendidos}/{vendedor.metricas.metaMensual}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Leads Activos</p>
                    <p className={`font-semibold ${
                      vendedor.metricas.leadsActivos > 30 ? 'text-red-600' :
                      vendedor.metricas.leadsActivos > 20 ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>
                      {vendedor.metricas.leadsActivos}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Seguimientos</p>
                    <p className="font-semibold">
                      {vendedor.metricas.seguimientosPromedio.toFixed(1)}
                    </p>
                  </div>
                </div>

                {/* Progreso */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-slate-500">Progreso General</p>
                    <p className="text-xs font-medium">{vendedor.progreso}%</p>
                  </div>
                  <Progress value={vendedor.progreso} className="h-2" />
                </div>

                {/* Problemas Principales */}
                {vendedor.problemasPrincipales.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-slate-700 mb-2">Áreas de Mejora:</p>
                    <div className="space-y-1">
                      {vendedor.problemasPrincipales.slice(0, 2).map((problema, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <AlertTriangle className="w-3 h-3 text-yellow-500 flex-shrink-0" />
                          <p className="text-xs text-slate-600">{problema}</p>
                        </div>
                      ))}
                      {vendedor.problemasPrincipales.length > 2 && (
                        <p className="text-xs text-slate-500">
                          +{vendedor.problemasPrincipales.length - 2} más...
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Fortalezas */}
                {vendedor.fortalezas.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-slate-700 mb-2">Fortalezas:</p>
                    <div className="space-y-1">
                      {vendedor.fortalezas.slice(0, 2).map((fortaleza, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                          <p className="text-xs text-slate-600">{fortaleza}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Próxima Sesión */}
                {vendedor.proximaSesion && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      <p className="text-sm font-medium text-blue-800">Próxima Sesión</p>
                    </div>
                    <p className="text-sm text-blue-700">
                      {vendedor.proximaSesion.toLocaleDateString('es-ES', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                )}

                {/* Acciones */}
                <div className="flex gap-2 pt-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => setSelectedVendedor(vendedor)}
                      >
                        <BarChart3 className="w-4 h-4 mr-1" />
                        Ver Detalles
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          {getEstadoIcon(selectedVendedor?.estadoRendimiento || '')}
                          Análisis Detallado: {selectedVendedor?.nombre} {selectedVendedor?.apellido}
                        </DialogTitle>
                        <DialogDescription>
                          Análisis completo de rendimiento y plan de desarrollo
                        </DialogDescription>
                      </DialogHeader>
                      
                      {selectedVendedor && (
                        <div className="space-y-6">
                          {/* Métricas Detalladas */}
                          <div>
                            <h4 className="font-semibold mb-3">Métricas de Conversión SPPC</h4>
                            <div className="grid grid-cols-3 gap-4">
                              <div className="p-3 border rounded-lg">
                                <p className="text-sm text-slate-600">Sospechoso → Prospecto</p>
                                <div className="flex items-center gap-2">
                                  <p className="text-lg font-bold">{selectedVendedor.metricas.conversionSospechoso}%</p>
                                  {selectedVendedor.metricas.conversionSospechoso >= 65 ? (
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                  ) : (
                                    <AlertTriangle className="w-4 h-4 text-red-500" />
                                  )}
                                </div>
                                <p className="text-xs text-slate-500">Meta: {'>'}65%</p>
                              </div>
                              
                              <div className="p-3 border rounded-lg">
                                <p className="text-sm text-slate-600">Prospecto → Prueba</p>
                                <div className="flex items-center gap-2">
                                  <p className="text-lg font-bold">{selectedVendedor.metricas.conversionProspecto}%</p>
                                  {selectedVendedor.metricas.conversionProspecto >= 45 ? (
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                  ) : (
                                    <AlertTriangle className="w-4 h-4 text-red-500" />
                                  )}
                                </div>
                                <p className="text-xs text-slate-500">Meta: {'>'}45%</p>
                              </div>
                              
                              <div className="p-3 border rounded-lg">
                                <p className="text-sm text-slate-600">Prueba → Cliente</p>
                                <div className="flex items-center gap-2">
                                  <p className="text-lg font-bold">{selectedVendedor.metricas.conversionPrueba}%</p>
                                  {selectedVendedor.metricas.conversionPrueba >= 70 ? (
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                  ) : (
                                    <AlertTriangle className="w-4 h-4 text-red-500" />
                                  )}
                                </div>
                                <p className="text-xs text-slate-500">Meta: {'>'}70%</p>
                              </div>
                            </div>
                          </div>

                          {/* Historial de Coaching */}
                          {selectedVendedor.ultimasSesiones.length > 0 && (
                            <div>
                              <h4 className="font-semibold mb-3">Historial de Coaching</h4>
                              <div className="space-y-3">
                                {selectedVendedor.ultimasSesiones.map((sesion) => (
                                  <div key={sesion.id} className="p-4 border rounded-lg">
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center gap-2">
                                        <BookOpen className="w-4 h-4 text-blue-600" />
                                        <p className="font-medium">
                                          Sesión de {sesion.tipoCoaching.replace('_', ' ')}
                                        </p>
                                      </div>
                                      <Badge variant={sesion.completado ? 'default' : 'secondary'}>
                                        {sesion.completado ? 'Completado' : 'Pendiente'}
                                      </Badge>
                                    </div>
                                    
                                    <p className="text-sm text-slate-600 mb-2">
                                      {sesion.fecha.toLocaleDateString('es-ES')} • {sesion.duracion} minutos
                                    </p>
                                    
                                    {sesion.resultados && sesion.resultados.length > 0 && (
                                      <div>
                                        <p className="text-sm font-medium mb-1">Resultados obtenidos:</p>
                                        <ul className="text-sm text-slate-600 space-y-1">
                                          {sesion.resultados.map((resultado, idx) => (
                                            <li key={idx} className="flex items-center gap-2">
                                              <CheckCircle className="w-3 h-3 text-green-500" />
                                              {resultado}
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setSelectedVendedor(null)}>
                          Cerrar
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  {vendedor.estadoRendimiento !== 'excelente' && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          size="sm" 
                          className="flex-1"
                          onClick={() => setCurrentVendedorId(vendedor.id)}
                        >
                          <GraduationCap className="w-4 h-4 mr-1" />
                          Coaching
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Programar Sesión de Coaching</DialogTitle>
                          <DialogDescription>
                            Planifica una sesión de coaching personalizada para {vendedor.nombre}
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="space-y-4">
                          <div>
                            <Label>Tipo de Coaching</Label>
                            <Select 
                              value={formData.tipoCoaching} 
                              onValueChange={(value) => setFormData(prev => ({...prev, tipoCoaching: value}))}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona el tipo..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="conversion">Técnicas de Conversión</SelectItem>
                                <SelectItem value="seguimiento">Sistemas de Seguimiento</SelectItem>
                                <SelectItem value="cierre">Técnicas de Cierre</SelectItem>
                                <SelectItem value="presentacion">Presentaciones Efectivas</SelectItem>
                                <SelectItem value="objeciones">Manejo de Objeciones</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label>Fecha y Hora</Label>
                            <Input 
                              type="datetime-local" 
                              value={formData.fechaSesion}
                              onChange={(e) => setFormData(prev => ({...prev, fechaSesion: e.target.value}))}
                            />
                          </div>

                          <div>
                            <Label>Objetivos de la Sesión</Label>
                            <Textarea 
                              placeholder="Describe los objetivos específicos..."
                              rows={3}
                              value={formData.objetivos}
                              onChange={(e) => setFormData(prev => ({...prev, objetivos: e.target.value}))}
                            />
                          </div>
                        </div>

                        <DialogFooter>
                          <Button variant="outline">Cancelar</Button>
                          <Button onClick={programarSesionCoaching}>
                            Programar Sesión
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {vendedoresFiltered.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-800 mb-2">
            No hay vendedores en este filtro
          </h3>
          <p className="text-slate-600 mb-4">
            Ajusta los filtros para ver diferentes vendedores
          </p>
          <Button variant="outline" onClick={() => setFiltroEstado('todos')}>
            Mostrar Todos
          </Button>
        </div>
      )}
    </div>
  );
}
