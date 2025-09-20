'use client';
import { RolePlayScenario as Scenario } from '@prisma/client';
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

interface RolePlayScenariosProps {
  onSelectScenario?: (scenario: Scenario) => void;
  onStartSimulation?: (scenario: Scenario) => void;
  selectedScenario?: Scenario | null | undefined;
  showManagement?: boolean;
}

const CATEGORIAS = [
  { value: 'prospectacion', label: 'Prospección Inicial' },
  { value: 'objeciones', label: 'Manejo de Objeciones' },
  { value: 'cierre', label: 'Técnicas de Cierre' },
  { value: 'situaciones_dificiles', label: 'Situaciones Difíciles' }
];

const TIPOS_CLIENTE = [
  { value: 'indeciso', label: 'Cliente Indeciso' },
  { value: 'precio_sensible', label: 'Sensible al Precio' },
  { value: 'tecnico', label: 'Cliente Técnico' },
  { value: 'impulsivo', label: 'Cliente Impulsivo' },
  { value: 'desconfiado', label: 'Cliente Desconfiado' },
  { value: 'informado', label: 'Cliente Informado' }
];

const NIVELES_DIFICULTAD = [
  { value: 'principiante', label: '⭐ Principiante' },
  { value: 'medio', label: '⭐⭐ Medio' },
  { value: 'avanzado', label: '⭐⭐⭐ Avanzado' },
  { value: 'experto', label: '⭐⭐⭐⭐ Experto' }
];

export default function RolePlayScenarios({ 
  onSelectScenario, 
  onStartSimulation,
  selectedScenario,
  showManagement = false
}: RolePlayScenariosProps) {
  const { data: session } = useSession();
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
      const params = new URLSearchParams();
      if (categoryFilter && categoryFilter !== 'all') params.append('categoria', categoryFilter);
      if (difficultyFilter && difficultyFilter !== 'all') params.append('nivel', difficultyFilter);
      if (clientTypeFilter && clientTypeFilter !== 'all') params.append('tipoCliente', clientTypeFilter);
      params.append('activo', 'true');

      const response = await fetch(`/api/roleplay/scenarios?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setScenarios(data.scenarios);
      } else {
        toast.error('Error al cargar escenarios');
      }
    } catch (error) {
      console.error('Error fetching scenarios:', error);
      toast.error('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const createScenario = async () => {
    // Lógica para crear...
  };

  const updateScenario = async () => {
    // Lógica para actualizar...
  };

  const deleteScenario = async (id: number) => {
    // Lógica para borrar...
  };

  const resetForm = () => {
    // Lógica para resetear formulario...
  };

  const startEdit = (scenario: Scenario) => {
    // Lógica para empezar a editar...
  };

  const filteredScenarios = scenarios.filter(scenario =>
    scenario.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    scenario.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
    scenario.tipoCliente.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getDifficultyIcon = (nivel: string) => {
    // Lógica de íconos...
  };

  const getCategoryIcon = (categoria: string) => {
    // Lógica de íconos...
  };
  
  const getScoreColor = (score: number) => {
    // Lógica de colores...
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
        
        {/* ... (resto del JSX del return, que no necesita cambios de sintaxis) ... */}

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
            {CATEGORIAS.map(cat => (
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
            {NIVELES_DIFICULTAD.map(nivel => (
              <SelectItem key={nivel.value} value={nivel.value}>
                {nivel.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {/* ... (Resto del JSX que no necesita cambios) ... */}
    </div>
  );
}