
'use client';

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
  RefreshCw,
  Loader2
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface RolePlayScenario {
  id: number;
  titulo: string;
  descripcion: string;
  categoria: string;
  nivelDificultad: string;
  tipoCliente: string;
  vehiculoInteres?: string;
  presupuestoCliente?: number;
  duracionEstimada: number;
  activo: boolean;
  dificultadPromedio?: number;
  completadoVeces: number;
  puntuacionPromedio?: number;
  etiquetas: string[];
  createdAt: string;
  updatedAt: string;
}

interface ScenarioFormData {
  titulo: string;
  descripcion: string;
  categoria: string;
  nivelDificultad: string;
  tipoCliente: string;
  vehiculoInteres: string;
  presupuestoCliente: number | null;
  duracionEstimada: number;
  objetivosAprendizaje: string[];
  objecionesComunes: string[];
  contextoPreventa: string;
  etiquetas: string[];
  activo: boolean;
}

const CATEGORIAS = [
  { value: 'prospectacion', label: 'Prospectación', icon: Target },
  { value: 'objeciones', label: 'Manejo de Objeciones', icon: AlertTriangle },
  { value: 'cierre', label: 'Técnicas de Cierre', icon: CheckCircle },
  { value: 'seguimiento', label: 'Seguimiento', icon: RefreshCw },
];

const NIVELES_DIFICULTAD = [
  { value: 'facil', label: 'Fácil', color: 'bg-green-100 text-green-800' },
  { value: 'medio', label: 'Medio', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'avanzado', label: 'Avanzado', color: 'bg-red-100 text-red-800' },
];

const TIPOS_CLIENTE = [
  { value: 'indeciso', label: 'Indeciso' },
  { value: 'precio_sensible', label: 'Sensible al Precio' },
  { value: 'tecnico', label: 'Técnico' },
  { value: 'primerizo', label: 'Primerizo' },
  { value: 'empresario', label: 'Empresario' },
  { value: 'familiar', label: 'Familiar' },
  { value: 'premium', label: 'Premium' },
  { value: 'referido', label: 'Referido' },
];

export default function RolePlayScenarios() {
  const { data: session } = useSession();
  const [scenarios, setScenarios] = useState<RolePlayScenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState<string>('');
  const [selectedNivel, setSelectedNivel] = useState<string>('');
  const [selectedTipoCliente, setSelectedTipoCliente] = useState<string>('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingScenario, setEditingScenario] = useState<RolePlayScenario | null>(null);
  const [formData, setFormData] = useState<ScenarioFormData>({
    titulo: '',
    descripcion: '',
    categoria: 'prospectacion',
    nivelDificultad: 'medio',
    tipoCliente: 'indeciso',
    vehiculoInteres: '',
    presupuestoCliente: null,
    duracionEstimada: 15,
    objetivosAprendizaje: [],
    objecionesComunes: [],
    contextoPreventa: '',
    etiquetas: [],
    activo: true,
  });

  // Cargar escenarios
  const fetchScenarios = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCategoria) params.append('categoria', selectedCategoria);
      if (selectedNivel) params.append('nivel', selectedNivel);
      if (selectedTipoCliente) params.append('tipoCliente', selectedTipoCliente);
      params.append('activo', 'true');

      const response = await fetch(`/api/roleplay/scenarios?${params.toString()}`);
      if (!response.ok) throw new Error('Error al cargar escenarios');

      const data = await response.json();
      setScenarios(data.scenarios || []);
    } catch (error) {
      console.error('Error fetching scenarios:', error);
      toast.error('Error al cargar los escenarios');
      setScenarios([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScenarios();
  }, [selectedCategoria, selectedNivel, selectedTipoCliente]);

  // Filtrar escenarios por búsqueda
  const filteredScenarios = scenarios.filter(scenario =>
    scenario.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    scenario.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
    scenario.etiquetas.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Iniciar simulación
  const handleStartSimulation = async (scenarioId: number) => {
    try {
      const response = await fetch('/api/roleplay/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenarioId }),
      });

      if (!response.ok) throw new Error('Error al iniciar simulación');

      const data = await response.json();
      toast.success('Simulación iniciada exitosamente');
      
      // Redirigir a la página de simulación
      window.location.href = `/dashboard/roleplay/simulate/${data.sessionId}`;
    } catch (error) {
      console.error('Error starting simulation:', error);
      toast.error('Error al iniciar la simulación');
    }
  };

  // Crear/Actualizar escenario
  const handleSaveScenario = async () => {
    try {
      const method = editingScenario ? 'PUT' : 'POST';
      const body = editingScenario 
        ? { ...formData, id: editingScenario.id }
        : formData;

      const response = await fetch('/api/roleplay/scenarios', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) throw new Error('Error al guardar escenario');

      toast.success(editingScenario ? 'Escenario actualizado' : 'Escenario creado');
      setShowCreateDialog(false);
      setEditingScenario(null);
      resetForm();
      fetchScenarios();
    } catch (error) {
      console.error('Error saving scenario:', error);
      toast.error('Error al guardar el escenario');
    }
  };

  // Eliminar escenario
  const handleDeleteScenario = async (scenarioId: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este escenario?')) return;

    try {
      const response = await fetch(`/api/roleplay/scenarios?id=${scenarioId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Error al eliminar escenario');

      toast.success('Escenario eliminado exitosamente');
      fetchScenarios();
    } catch (error) {
      console.error('Error deleting scenario:', error);
      toast.error('Error al eliminar el escenario');
    }
  };

  // Resetear formulario
  const resetForm = () => {
    setFormData({
      titulo: '',
      descripcion: '',
      categoria: 'prospectacion',
      nivelDificultad: 'medio',
      tipoCliente: 'indeciso',
      vehiculoInteres: '',
      presupuestoCliente: null,
      duracionEstimada: 15,
      objetivosAprendizaje: [],
      objecionesComunes: [],
      contextoPreventa: '',
      etiquetas: [],
      activo: true,
    });
  };

  // Abrir diálogo de edición
  const handleEditScenario = (scenario: RolePlayScenario) => {
    setEditingScenario(scenario);
    setFormData({
      titulo: scenario.titulo,
      descripcion: scenario.descripcion,
      categoria: scenario.categoria,
      nivelDificultad: scenario.nivelDificultad,
      tipoCliente: scenario.tipoCliente,
      vehiculoInteres: scenario.vehiculoInteres || '',
      presupuestoCliente: scenario.presupuestoCliente || null,
      duracionEstimada: scenario.duracionEstimada,
      objetivosAprendizaje: [],
      objecionesComunes: [],
      contextoPreventa: '',
      etiquetas: scenario.etiquetas,
      activo: scenario.activo,
    });
    setShowCreateDialog(true);
  };

  const canManageScenarios = session?.user?.rol && [
    'GERENTE_VENTAS', 
    'GERENTE_GENERAL', 
    'DIRECTOR_MARCA', 
    'DIRECTOR_GENERAL', 
    'DYNAMICFIN_ADMIN'
  ].includes(session.user.rol);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Cargando escenarios...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Biblioteca de Escenarios Role Play</h2>
          <p className="text-gray-600">
            Practica diferentes situaciones de venta con clientes simulados
          </p>
        </div>
        {canManageScenarios && (
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setEditingScenario(null); }}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Escenario
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingScenario ? 'Editar Escenario' : 'Crear Nuevo Escenario'}
                </DialogTitle>
                <DialogDescription>
                  Define un nuevo escenario de práctica para el equipo de ventas
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="titulo">Título del Escenario</Label>
                  <Input
                    id="titulo"
                    value={formData.titulo}
                    onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                    placeholder="Ej: Cliente indeciso que necesita pensarlo"
                  />
                </div>

                <div>
                  <Label htmlFor="descripcion">Descripción</Label>
                  <Textarea
                    id="descripcion"
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    placeholder="Describe la situación y el comportamiento del cliente..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="categoria">Categoría</Label>
                    <Select value={formData.categoria} onValueChange={(value) => setFormData({ ...formData, categoria: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIAS.map(cat => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="nivelDificultad">Nivel de Dificultad</Label>
                    <Select value={formData.nivelDificultad} onValueChange={(value) => setFormData({ ...formData, nivelDificultad: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {NIVELES_DIFICULTAD.map(nivel => (
                          <SelectItem key={nivel.value} value={nivel.value}>
                            {nivel.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tipoCliente">Tipo de Cliente</Label>
                    <Select value={formData.tipoCliente} onValueChange={(value) => setFormData({ ...formData, tipoCliente: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIPOS_CLIENTE.map(tipo => (
                          <SelectItem key={tipo.value} value={tipo.value}>
                            {tipo.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="duracionEstimada">Duración (minutos)</Label>
                    <Input
                      id="duracionEstimada"
                      type="number"
                      value={formData.duracionEstimada}
                      onChange={(e) => setFormData({ ...formData, duracionEstimada: parseInt(e.target.value) || 15 })}
                      min="5"
                      max="60"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="vehiculoInteres">Vehículo de Interés</Label>
                    <Input
                      id="vehiculoInteres"
                      value={formData.vehiculoInteres}
                      onChange={(e) => setFormData({ ...formData, vehiculoInteres: e.target.value })}
                      placeholder="Ej: SUV Familiar"
                    />
                  </div>

                  <div>
                    <Label htmlFor="presupuestoCliente">Presupuesto del Cliente</Label>
                    <Input
                      id="presupuestoCliente"
                      type="number"
                      value={formData.presupuestoCliente || ''}
                      onChange={(e) => setFormData({ ...formData, presupuestoCliente: e.target.value ? parseInt(e.target.value) : null })}
                      placeholder="Ej: 450000"
                    />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveScenario}>
                  {editingScenario ? 'Actualizar' : 'Crear'} Escenario
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[300px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar escenarios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Select value={selectedCategoria} onValueChange={setSelectedCategoria}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Todas las categorías" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todas las categorías</SelectItem>
            {CATEGORIAS.map(cat => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedNivel} onValueChange={setSelectedNivel}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Todos los niveles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos los niveles</SelectItem>
            {NIVELES_DIFICULTAD.map(nivel => (
              <SelectItem key={nivel.value} value={nivel.value}>
                {nivel.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedTipoCliente} onValueChange={setSelectedTipoCliente}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Todos los tipos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos los tipos</SelectItem>
            {TIPOS_CLIENTE.map(tipo => (
              <SelectItem key={tipo.value} value={tipo.value}>
                {tipo.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Total Escenarios</p>
                <p className="text-2xl font-bold">{scenarios.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Target className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Prospectación</p>
                <p className="text-2xl font-bold">
                  {scenarios.filter(s => s.categoria === 'prospectacion').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Objeciones</p>
                <p className="text-2xl font-bold">
                  {scenarios.filter(s => s.categoria === 'objeciones').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Cierre</p>
                <p className="text-2xl font-bold">
                  {scenarios.filter(s => s.categoria === 'cierre').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de escenarios */}
      {filteredScenarios.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay escenarios disponibles
            </h3>
            <p className="text-gray-600 mb-4">
              {scenarios.length === 0 
                ? 'Aún no se han creado escenarios de Role Play.'
                : 'No se encontraron escenarios que coincidan con los filtros seleccionados.'
              }
            </p>
            {canManageScenarios && scenarios.length === 0 && (
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Primer Escenario
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredScenarios.map((scenario) => {
            const categoria = CATEGORIAS.find(c => c.value === scenario.categoria);
            const nivel = NIVELES_DIFICULTAD.find(n => n.value === scenario.nivelDificultad);
            const tipoCliente = TIPOS_CLIENTE.find(t => t.value === scenario.tipoCliente);

            return (
              <Card key={scenario.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{scenario.titulo}</CardTitle>
                      <CardDescription className="text-sm">
                        {scenario.descripcion.length > 100 
                          ? `${scenario.descripcion.substring(0, 100)}...`
                          : scenario.descripcion
                        }
                      </CardDescription>
                    </div>
                    {canManageScenarios && (
                      <div className="flex space-x-1 ml-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditScenario(scenario)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteScenario(scenario.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="space-y-3">
                    {/* Badges */}
                    <div className="flex flex-wrap gap-2">
                      {categoria && (
                        <Badge variant="secondary" className="flex items-center">
                          <categoria.icon className="h-3 w-3 mr-1" />
                          {categoria.label}
                        </Badge>
                      )}
                      {nivel && (
                        <Badge className={nivel.color}>
                          {nivel.label}
                        </Badge>
                      )}
                      {tipoCliente && (
                        <Badge variant="outline">
                          <Users className="h-3 w-3 mr-1" />
                          {tipoCliente.label}
                        </Badge>
                      )}
                    </div>

                    {/* Detalles */}
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {scenario.duracionEstimada} min
                      </div>
                      {scenario.completadoVeces > 0 && (
                        <div className="flex items-center">
                          <TrendingUp className="h-4 w-4 mr-1" />
                          {scenario.completadoVeces} veces
                        </div>
                      )}
                    </div>

                    {/* Vehículo y presupuesto */}
                    {(scenario.vehiculoInteres || scenario.presupuestoCliente) && (
                      <div className="text-sm text-gray-600">
                        {scenario.vehiculoInteres && (
                          <div>🚗 {scenario.vehiculoInteres}</div>
                        )}
                        {scenario.presupuestoCliente && (
                          <div>💰 ${scenario.presupuestoCliente.toLocaleString()}</div>
                        )}
                      </div>
                    )}

                    {/* Etiquetas */}
                    {scenario.etiquetas.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {scenario.etiquetas.slice(0, 3).map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {scenario.etiquetas.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{scenario.etiquetas.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Puntuación promedio */}
                    {scenario.puntuacionPromedio && (
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-500 mr-1" />
                        <span className="text-sm font-medium">
                          {scenario.puntuacionPromedio.toFixed(1)}/100
                        </span>
                      </div>
                    )}

                    {/* Botón de acción */}
                    <Button 
                      className="w-full mt-4"
                      onClick={() => handleStartSimulation(scenario.id)}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Iniciar Simulación
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
