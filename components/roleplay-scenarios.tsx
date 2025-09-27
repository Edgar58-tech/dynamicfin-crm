
'use client';
import { RolePlayScenario } from '@prisma/client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Search, 
  Filter, 
  Plus,
  Play,
  Edit,
  Trash2,
  Star,
  Clock,
  Target,
  Users,
  TrendingUp,
  BookOpen,
  Brain,
  Award,
  AlertTriangle,
  CheckCircle,
  RefreshCw
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
// Importar datos de prueba
import { roleplayScenarios, CATEGORIAS_ROLEPLAY, NIVELES_DIFICULTAD_ROLEPLAY, TIPOS_CLIENTE_AUTOMOTRIZ } from '@/app/roleplay-test/roleplayData';

// Ya no necesitamos interface manual - usaremos el tipo de Prisma directamente
type Scenario = RolePlayScenario;

interface RolePlayScenariosProps {
  onSelectScenario?: (scenario: Scenario) => void;
  onStartSimulation?: (scenario: Scenario) => void;
  selectedScenario?: Scenario | null | undefined;
  showManagement?: boolean;
}

// Usar constantes importadas de los datos de prueba
const CATEGORIAS = CATEGORIAS_ROLEPLAY;
const TIPOS_CLIENTE = TIPOS_CLIENTE_AUTOMOTRIZ;
const NIVELES_DIFICULTAD = NIVELES_DIFICULTAD_ROLEPLAY;

export default function RolePlayScenarios({ 
  onSelectScenario, 
  onStartSimulation,
  selectedScenario,
  showManagement = false
}: RolePlayScenariosProps) {
  // const { data: session } = useSession();
  const session = null;
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [clientTypeFilter, setClientTypeFilter] = useState('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingScenario, setEditingScenario] = useState<Scenario | null>(null);

  // Form state para crear/editar escenarios
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    categoria: '',
    nivelDificultad: 'medio',
    tipoCliente: '',
    vehiculoInteres: '',
    presupuestoCliente: '',
    duracionEstimada: 15,
    objetivosAprendizaje: '',
    objecionesComunes: '',
    contextoPreventa: '',
    etiquetas: ''
  });

  useEffect(() => {
    fetchScenarios();
  }, [categoryFilter, difficultyFilter, clientTypeFilter]);

  const fetchScenarios = async () => {
    try {
      setLoading(true);
      
      // Simular delay de API para realismo
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Filtrar escenarios según los filtros aplicados
      let filteredScenarios = roleplayScenarios.filter(scenario => scenario.activo);
      
      if (categoryFilter && categoryFilter !== 'all') {
        filteredScenarios = filteredScenarios.filter(scenario => 
          scenario.categoria === categoryFilter
        );
      }
      
      if (difficultyFilter && difficultyFilter !== 'all') {
        filteredScenarios = filteredScenarios.filter(scenario => 
          scenario.nivelDificultad === difficultyFilter
        );
      }
      
      if (clientTypeFilter && clientTypeFilter !== 'all') {
        filteredScenarios = filteredScenarios.filter(scenario => 
          scenario.tipoCliente === clientTypeFilter
        );
      }
      
      setScenarios(filteredScenarios);
      toast.success(`${filteredScenarios.length} escenarios cargados exitosamente`);
    } catch (error) {
      console.error('Error fetching scenarios:', error);
      toast.error('Error al cargar escenarios');
    } finally {
      setLoading(false);
    }
  };

  const createScenario = async () => {
    try {
      // Simular creación de escenario (en implementación real se enviaría a API)
      const newScenario = {
        id: Math.max(...roleplayScenarios.map(s => s.id)) + 1,
        ...formData,
        presupuestoCliente: formData.presupuestoCliente ? parseFloat(formData.presupuestoCliente) : undefined,
        activo: true,
        completadoVeces: 0,
        etiquetas: formData.etiquetas.split(',').map(s => s.trim()).filter(s => s),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        // Campos específicos SPCC (valores por defecto para demo)
        pilaresSPCC: ["Saludo y Primera Impresión", "Prospección Efectiva"],
        contextoCliente: "Cliente de prueba creado desde interfaz",
        objetivoEscenario: "Practicar habilidades básicas de venta",
        objecionesEsperadas: ["Necesito pensarlo", "Está muy caro"],
        respuestasSugeridas: ["Entiendo su preocupación", "Permíteme explicarte el valor"],
        metricasExito: ["Obtener información de contacto", "Agendar segunda cita"],
        situacionInicial: "Cliente entra al showroom",
        trasfondoCliente: "Cliente potencial interesado",
        desafiosEspecificos: ["Establecer rapport inicial"]
      };

      // En implementación real, esto se enviaría a la API
      roleplayScenarios.push(newScenario as any);
      
      toast.success('Escenario creado exitosamente (modo demo)');
      setShowCreateDialog(false);
      resetForm();
      fetchScenarios();
    } catch (error) {
      console.error('Error creating scenario:', error);
      toast.error('Error al crear escenario');
    }
  };

  const updateScenario = async () => {
    if (!editingScenario) return;

    try {
      // Simular actualización de escenario (en implementación real se enviaría a API)
      const scenarioIndex = roleplayScenarios.findIndex(s => s.id === editingScenario.id);
      if (scenarioIndex !== -1) {
        roleplayScenarios[scenarioIndex] = {
          ...roleplayScenarios[scenarioIndex],
          ...formData,
          presupuestoCliente: formData.presupuestoCliente ? parseFloat(formData.presupuestoCliente) : undefined,
          etiquetas: formData.etiquetas.split(',').map(s => s.trim()).filter(s => s),
          updatedAt: new Date().toISOString()
        };
      }

      toast.success('Escenario actualizado exitosamente (modo demo)');
      setEditingScenario(null);
      resetForm();
      fetchScenarios();
    } catch (error) {
      console.error('Error updating scenario:', error);
      toast.error('Error al actualizar escenario');
    }
  };

  const deleteScenario = async (id: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este escenario?')) return;

    try {
      // Simular eliminación de escenario (en implementación real se enviaría a API)
      const scenarioIndex = roleplayScenarios.findIndex(s => s.id === id);
      if (scenarioIndex !== -1) {
        roleplayScenarios.splice(scenarioIndex, 1);
      }

      toast.success('Escenario eliminado exitosamente (modo demo)');
      fetchScenarios();
    } catch (error) {
      console.error('Error deleting scenario:', error);
      toast.error('Error al eliminar escenario');
    }
  };

  const resetForm = () => {
    setFormData({
      titulo: '',
      descripcion: '',
      categoria: '',
      nivelDificultad: 'medio',
      tipoCliente: '',
      vehiculoInteres: '',
      presupuestoCliente: '',
      duracionEstimada: 15,
      objetivosAprendizaje: '',
      objecionesComunes: '',
      contextoPreventa: '',
      etiquetas: ''
    });
  };

  const startEdit = (scenario: Scenario) => {
    setEditingScenario(scenario);
    setFormData({
      titulo: scenario.titulo,
      descripcion: scenario.descripcion,
      categoria: scenario.categoria,
      nivelDificultad: scenario.nivelDificultad,
      tipoCliente: scenario.tipoCliente,
      vehiculoInteres: scenario.vehiculoInteres || '',
      presupuestoCliente: scenario.presupuestoCliente ? scenario.presupuestoCliente.toString() : '',
      duracionEstimada: scenario.duracionEstimada,
      objetivosAprendizaje: scenario.objetivosAprendizaje,
      objecionesComunes: scenario.objecionesComunes,
      contextoPreventa: scenario.contextoPreventa || '',
      etiquetas: Array.isArray(scenario.etiquetas) 
        ? scenario.etiquetas.join(', ') 
        : scenario.etiquetas || ''
    });
    setShowCreateDialog(true);
  };

  const filteredScenarios = scenarios.filter(scenario =>
    scenario.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    scenario.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
    scenario.tipoCliente.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getDifficultyIcon = (nivel: string) => {
    switch (nivel.toLowerCase()) {
      case 'principiante': return <Target className="w-4 h-4 text-green-600" />;
      case 'medio': return <TrendingUp className="w-4 h-4 text-yellow-600" />;
      case 'avanzado': return <Award className="w-4 h-4 text-red-600" />;
      case 'experto': return <Brain className="w-4 h-4 text-purple-600" />;
      default: return <Target className="w-4 h-4 text-slate-600" />;
    }
  };

  const getCategoryIcon = (categoria: string) => {
    switch (categoria.toLowerCase()) {
      case 'prospección': return <Users className="w-4 h-4" />;
      case 'calificación': return <CheckCircle className="w-4 h-4" />;
      case 'presentación': return <BookOpen className="w-4 h-4" />;
      case 'manejo_objeciones': return <AlertTriangle className="w-4 h-4" />;
      case 'cierre': return <Star className="w-4 h-4" />;
      default: return <BookOpen className="w-4 h-4" />;
    }
  };
  
  const getScoreColor = (score: number | undefined | null) => {
    if (!score) return 'text-slate-400';
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const canManageScenarios = ['GERENTE_VENTAS', 'GERENTE_GENERAL', 'DIRECTOR_MARCA', 'DIRECTOR_GENERAL', 'DYNAMICFIN_ADMIN'].includes(session?.user?.rol ?? '');

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

  return (
    <div className="space-y-6">
      {/* Header y Controles */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-blue-600" />
            Biblioteca de Escenarios
          </h2>
          <p className="text-slate-600 mt-1">
            Selecciona un escenario para practicar tus habilidades de venta
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button onClick={fetchScenarios} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4" />
          </Button>
          
          {showManagement && canManageScenarios && (
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Crear Escenario
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingScenario ? 'Editar Escenario' : 'Crear Nuevo Escenario'}
                  </DialogTitle>
                  <DialogDescription>
                    Configura los detalles del escenario de role play
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <Label>Título del Escenario</Label>
                    <Input
                      value={formData.titulo}
                      onChange={(e) => setFormData(prev => ({...prev, titulo: e.target.value}))}
                      placeholder="Ej: Cliente indeciso que necesita pensarlo"
                    />
                  </div>
                  
                  <div>
                    <Label>Descripción</Label>
                    <Textarea
                      value={formData.descripcion}
                      onChange={(e) => setFormData(prev => ({...prev, descripcion: e.target.value}))}
                      placeholder="Describe la situación y contexto del escenario..."
                      rows={3}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Categoría</Label>
                      <Select 
                        value={formData.categoria} 
                        onValueChange={(value) => setFormData(prev => ({...prev, categoria: value}))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona categoría" />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIAS.filter(cat => cat.value && cat.value.trim() !== '').map(cat => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>Tipo de Cliente</Label>
                      <Select 
                        value={formData.tipoCliente} 
                        onValueChange={(value) => setFormData(prev => ({...prev, tipoCliente: value}))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          {TIPOS_CLIENTE.filter(tipo => tipo.value && tipo.value.trim() !== '').map(tipo => (
                            <SelectItem key={tipo.value} value={tipo.value}>
                              {tipo.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Nivel de Dificultad</Label>
                      <Select 
                        value={formData.nivelDificultad} 
                        onValueChange={(value) => setFormData(prev => ({...prev, nivelDificultad: value}))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {NIVELES_DIFICULTAD.filter(nivel => nivel.value && nivel.value.trim() !== '').map(nivel => (
                            <SelectItem key={nivel.value} value={nivel.value}>
                              {nivel.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>Duración Estimada (minutos)</Label>
                      <Input
                        type="number"
                        value={formData.duracionEstimada}
                        onChange={(e) => setFormData(prev => ({...prev, duracionEstimada: parseInt(e.target.value) || 15}))}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Vehículo de Interés (opcional)</Label>
                      <Input
                        value={formData.vehiculoInteres}
                        onChange={(e) => setFormData(prev => ({...prev, vehiculoInteres: e.target.value}))}
                        placeholder="Ej: SUV Premium"
                      />
                    </div>
                    
                    <div>
                      <Label>Presupuesto (opcional)</Label>
                      <Input
                        type="number"
                        value={formData.presupuestoCliente}
                        onChange={(e) => setFormData(prev => ({...prev, presupuestoCliente: e.target.value}))}
                        placeholder="500000"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label>Etiquetas (separadas por comas)</Label>
                    <Input
                      value={formData.etiquetas}
                      onChange={(e) => setFormData(prev => ({...prev, etiquetas: e.target.value}))}
                      placeholder="prospección, primer contacto, SUV"
                    />
                  </div>
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => {
                    setShowCreateDialog(false);
                    setEditingScenario(null);
                    resetForm();
                  }}>
                    Cancelar
                  </Button>
                  <Button onClick={editingScenario ? updateScenario : createScenario}>
                    {editingScenario ? 'Actualizar' : 'Crear'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Filtros y Búsqueda */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input
            placeholder="Buscar escenarios..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Todas las categorías" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {CATEGORIAS.filter(cat => cat.value && cat.value.trim() !== '').map(cat => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Dificultad" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {NIVELES_DIFICULTAD.filter(nivel => nivel.value && nivel.value.trim() !== '').map(nivel => (
              <SelectItem key={nivel.value} value={nivel.value}>
                {nivel.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Grid de Escenarios */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredScenarios.map((scenario, index) => (
          <motion.div
            key={scenario.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className={`h-full transition-all duration-200 hover:shadow-lg cursor-pointer ${
              selectedScenario?.id === scenario.id 
                ? 'ring-2 ring-blue-500 bg-blue-50' 
                : 'hover:shadow-md'
            }`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(scenario.categoria)}
                    <Badge variant="outline" className="text-xs">
                      {scenario.categoria.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    {getDifficultyIcon(scenario.nivelDificultad)}
                    {showManagement && canManageScenarios && (
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            startEdit(scenario);
                          }}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteScenario(scenario.id);
                          }}
                        >
                          <Trash2 className="w-3 h-3 text-red-500" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                
                <CardTitle className="text-lg leading-tight line-clamp-2">
                  {scenario.titulo}
                </CardTitle>
                
                <CardDescription className="line-clamp-3 text-sm">
                  {scenario.descripcion}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {/* Información del Cliente */}
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4 text-slate-500" />
                    <span className="font-medium text-slate-700">
                      {scenario.tipoCliente.replace('_', ' ')}
                    </span>
                  </div>
                  
                  {/* Duración y Dificultad */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4 text-slate-500" />
                      <span>{scenario.duracionEstimada} min</span>
                    </div>
                    <Badge 
                      variant={scenario.nivelDificultad === 'principiante' ? 'default' : 
                               scenario.nivelDificultad === 'medio' ? 'secondary' : 'destructive'}
                      className="text-xs"
                    >
                      {scenario.nivelDificultad}
                    </Badge>
                  </div>
                  
                  {/* Estadísticas */}
                  {(scenario.completadoVeces > 0 || scenario.puntuacionPromedio) && (
                    <div className="flex items-center justify-between text-sm border-t pt-2">
                      <div className="flex items-center gap-1">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span>{scenario.completadoVeces} completadas</span>
                      </div>
                      {scenario.puntuacionPromedio && (
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500" />
                          <span className={`font-medium ${getScoreColor(Number(scenario.puntuacionPromedio))}`}>
                            {Math.round(Number(scenario.puntuacionPromedio))}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Vehículo de Interés */}
                  {scenario.vehiculoInteres && (
                    <div className="flex items-center gap-1 text-sm">
                      <span className="text-slate-600">Vehículo:</span>
                      <Badge variant="outline" className="text-xs">
                        {scenario.vehiculoInteres}
                      </Badge>
                    </div>
                  )}
                  
                  {/* Botones de Acción */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 gap-1"
                      onClick={() => onSelectScenario?.(scenario)}
                    >
                      <BookOpen className="w-4 h-4" />
                      Ver Detalles
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 gap-1"
                      onClick={() => onStartSimulation?.(scenario)}
                    >
                      <Play className="w-4 h-4" />
                      Iniciar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Estado vacío */}
      {filteredScenarios.length === 0 && !loading && (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-600 mb-2">
            No se encontraron escenarios
          </h3>
          <p className="text-slate-500 mb-4">
            Prueba ajustando los filtros o creando un nuevo escenario
          </p>
          {showManagement && canManageScenarios && (
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Crear Primer Escenario
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
