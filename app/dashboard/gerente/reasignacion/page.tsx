
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
  Users, 
  ArrowRight,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  User,
  Phone,
  Mail,
  DollarSign,
  Calendar,
  MessageSquare
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import toast from 'react-hot-toast';

interface LeadParaReasignar {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  vehiculoInteres: string;
  presupuesto: number;
  clasificacion: string;
  calificacionTotal: number;
  vendedorActual: {
    id: string;
    nombre: string;
    apellido: string;
  };
  ultimoContacto: string;
  diasSinContacto: number;
  etapaActual: string;
  razonReasignacion: string;
}

interface VendedorDisponible {
  id: string;
  nombre: string;
  apellido: string;
  especialidad: string;
  leadsActivos: number;
  tasaConversion: number;
  disponibilidad: 'alta' | 'media' | 'baja';
  recomendado: boolean;
}

export default function ReasignacionLeadsPage() {
  const { data: session, status } = useSession();
  const [leadsParaReasignar, setLeadsParaReasignar] = useState<LeadParaReasignar[]>([]);
  const [vendedoresDisponibles, setVendedoresDisponibles] = useState<VendedorDisponible[]>([]);
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [filtroVendedor, setFiltroVendedor] = useState('todos');
  const [busqueda, setBusqueda] = useState('');
  const [selectedLead, setSelectedLead] = useState<LeadParaReasignar | null>(null);
  const [selectedVendedor, setSelectedVendedor] = useState('');
  const [motivoReasignacion, setMotivoReasignacion] = useState('');
  const [comentarios, setComentarios] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReasignacionData();
  }, []);

  const fetchReasignacionData = async () => {
    try {
      setLoading(true);
      
      // Simular data hasta que la API esté lista
      const mockLeads: LeadParaReasignar[] = [
        {
          id: 1,
          nombre: 'Roberto',
          apellido: 'Martínez',
          email: 'roberto@constructor.com',
          telefono: '+52 55 1234-5678',
          vehiculoInteres: 'SUV Premium',
          presupuesto: 750000,
          clasificacion: 'Elite',
          calificacionTotal: 92.5,
          vendedorActual: { id: '3', nombre: 'Ana', apellido: 'López' },
          ultimoContacto: '2025-09-13',
          diasSinContacto: 3,
          etapaActual: 'Prospecto',
          razonReasignacion: 'Lead sin seguimiento por 3+ días'
        },
        {
          id: 2,
          nombre: 'Laura',
          apellido: 'Fernández',
          email: 'laura@empresa.com',
          telefono: '+52 55 9876-5432',
          vehiculoInteres: 'Pickup Comercial',
          presupuesto: 680000,
          clasificacion: 'Calificado',
          calificacionTotal: 78.3,
          vendedorActual: { id: '3', nombre: 'Ana', apellido: 'López' },
          ultimoContacto: '2025-09-12',
          diasSinContacto: 4,
          etapaActual: 'Prospecto',
          razonReasignacion: 'Vendedor sobrecargado (32 leads activos)'
        },
        {
          id: 3,
          nombre: 'Miguel',
          apellido: 'Sánchez',
          email: 'miguel@negocio.mx',
          telefono: '+52 55 5555-1111',
          vehiculoInteres: 'Sedan Ejecutivo',
          presupuesto: 520000,
          clasificacion: 'Calificado',
          calificacionTotal: 85.7,
          vendedorActual: { id: '4', nombre: 'Pedro', apellido: 'Ramírez' },
          ultimoContacto: '2025-09-11',
          diasSinContacto: 5,
          etapaActual: 'Prueba',
          razonReasignacion: 'Lead estancado en etapa Prueba >2 semanas'
        }
      ];

      const mockVendedores: VendedorDisponible[] = [
        {
          id: '1',
          nombre: 'Carlos',
          apellido: 'Hernández',
          especialidad: 'SUVs Premium',
          leadsActivos: 22,
          tasaConversion: 28,
          disponibilidad: 'alta',
          recomendado: true
        },
        {
          id: '2',
          nombre: 'María',
          apellido: 'González',
          especialidad: 'Autos Familiares',
          leadsActivos: 18,
          tasaConversion: 22,
          disponibilidad: 'alta',
          recomendado: false
        },
        {
          id: '4',
          nombre: 'Pedro',
          apellido: 'Ramírez',
          especialidad: 'Sedanes',
          leadsActivos: 12,
          tasaConversion: 15,
          disponibilidad: 'alta',
          recomendado: false
        },
        {
          id: '5',
          nombre: 'Luis',
          apellido: 'Torres',
          especialidad: 'Pickups Comerciales',
          leadsActivos: 28,
          tasaConversion: 19,
          disponibilidad: 'media',
          recomendado: false
        }
      ];

      setLeadsParaReasignar(mockLeads);
      setVendedoresDisponibles(mockVendedores);
      
    } catch (error) {
      console.error('Error fetching reasignacion data:', error);
      toast.error('Error al cargar datos de reasignación');
    } finally {
      setLoading(false);
    }
  };

  const handleReasignarLead = async () => {
    if (!selectedLead || !selectedVendedor || !motivoReasignacion) {
      toast.error('Por favor completa todos los campos obligatorios');
      return;
    }

    try {
      // Aquí iría la llamada a la API
      const response = await fetch('/api/gerente/reasignar-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: selectedLead.id,
          vendedorNuevoId: selectedVendedor,
          vendedorAnteriorId: selectedLead.vendedorActual.id,
          motivoReasignacion,
          comentarios
        })
      });

      if (response.ok) {
        toast.success('Lead reasignado exitosamente');
        setSelectedLead(null);
        setSelectedVendedor('');
        setMotivoReasignacion('');
        setComentarios('');
        fetchReasignacionData(); // Recargar datos
      } else {
        toast.error('Error al reasignar el lead');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error de conexión');
    }
  };

  const getClassificationColor = (classification: string) => {
    switch (classification) {
      case 'Elite':
        return 'bg-emerald-100 text-emerald-800';
      case 'Calificado':
        return 'bg-blue-100 text-blue-800';
      case 'A Madurar':
        return 'bg-amber-100 text-amber-800';
      case 'Explorador':
        return 'bg-slate-100 text-slate-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDisponibilidadColor = (disponibilidad: string) => {
    switch (disponibilidad) {
      case 'alta':
        return 'bg-green-100 text-green-800';
      case 'media':
        return 'bg-yellow-100 text-yellow-800';
      case 'baja':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const leadsFiltered = leadsParaReasignar.filter(lead => {
    const matchesBusqueda = busqueda === '' || 
      `${lead.nombre} ${lead.apellido}`.toLowerCase().includes(busqueda.toLowerCase()) ||
      lead.vehiculoInteres.toLowerCase().includes(busqueda.toLowerCase());
    
    const matchesEstado = filtroEstado === 'todos' || lead.clasificacion === filtroEstado;
    
    const matchesVendedor = filtroVendedor === 'todos' || lead.vendedorActual.id === filtroVendedor;
    
    return matchesBusqueda && matchesEstado && matchesVendedor;
  });

  if (status === 'loading' || loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6">
          {[...Array(3)].map((_, i) => (
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
            🔄 Reasignación Inteligente de Leads
          </h1>
          <p className="text-slate-600 mt-1">
            Optimiza la distribución de leads para maximizar conversiones
          </p>
        </div>
        <Button 
          onClick={fetchReasignacionData}
          variant="outline"
          className="gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Actualizar
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros de Búsqueda
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="busqueda">Buscar Lead</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="busqueda"
                  placeholder="Nombre o vehículo..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="filtroEstado">Clasificación</Label>
              <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas</SelectItem>
                  <SelectItem value="Elite">Elite</SelectItem>
                  <SelectItem value="Calificado">Calificado</SelectItem>
                  <SelectItem value="A Madurar">A Madurar</SelectItem>
                  <SelectItem value="Explorador">Explorador</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="filtroVendedor">Vendedor Actual</Label>
              <Select value={filtroVendedor} onValueChange={setFiltroVendedor}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="3">Ana López</SelectItem>
                  <SelectItem value="4">Pedro Ramírez</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => {
                  setBusqueda('');
                  setFiltroEstado('todos');
                  setFiltroVendedor('todos');
                }}
              >
                Limpiar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leads Para Reasignar */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Leads que Requieren Reasignación ({leadsFiltered.length})
              </CardTitle>
              <CardDescription>
                Leads identificados automáticamente que necesitan nueva asignación
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {leadsFiltered.map((lead, index) => (
              <motion.div
                key={lead.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="p-6 border rounded-lg hover:shadow-lg transition-all"
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                  {/* Información del Lead */}
                  <div className="lg:col-span-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">
                          {lead.nombre} {lead.apellido}
                        </h3>
                        <p className="text-sm text-slate-600">{lead.vehiculoInteres}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getClassificationColor(lead.clasificacion)}>
                        {lead.clasificacion}
                      </Badge>
                      <span className="text-sm font-medium">
                        {lead.calificacionTotal.toFixed(1)}% SPPC
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-slate-600">
                      <div className="flex items-center gap-1">
                        <Phone className="w-4 h-4" />
                        {lead.telefono}
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        ${lead.presupuesto.toLocaleString('es-MX')}
                      </div>
                    </div>
                  </div>

                  {/* Estado Actual */}
                  <div className="lg:col-span-3">
                    <div className="mb-2">
                      <p className="text-xs text-slate-500">Vendedor Actual</p>
                      <p className="font-medium">
                        {lead.vendedorActual.nombre} {lead.vendedorActual.apellido}
                      </p>
                    </div>
                    
                    <div className="mb-2">
                      <p className="text-xs text-slate-500">Último Contacto</p>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">
                          Hace {lead.diasSinContacto} días
                        </span>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">Etapa Actual</p>
                      <Badge variant="outline">{lead.etapaActual}</Badge>
                    </div>
                  </div>

                  {/* Razón de Reasignación */}
                  <div className="lg:col-span-3">
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle className="w-4 h-4 text-yellow-600" />
                        <span className="text-sm font-medium text-yellow-800">
                          Razón de Reasignación
                        </span>
                      </div>
                      <p className="text-sm text-yellow-700">
                        {lead.razonReasignacion}
                      </p>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="lg:col-span-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          className="w-full"
                          onClick={() => setSelectedLead(lead)}
                        >
                          🔄 Reasignar
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Reasignar Lead a Nuevo Vendedor</DialogTitle>
                          <DialogDescription>
                            Selecciona el vendedor más adecuado para este lead basándose en especialización y disponibilidad
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="space-y-6">
                          {/* Información del Lead */}
                          <div className="p-4 bg-slate-50 rounded-lg">
                            <h4 className="font-semibold mb-2">Lead a Reasignar:</h4>
                            <p><strong>{selectedLead?.nombre} {selectedLead?.apellido}</strong></p>
                            <p className="text-sm text-slate-600">{selectedLead?.vehiculoInteres} - ${selectedLead?.presupuesto?.toLocaleString('es-MX')}</p>
                          </div>

                          {/* Selección de Vendedor */}
                          <div>
                            <Label htmlFor="vendedorNuevo">Nuevo Vendedor *</Label>
                            <div className="space-y-3 mt-2">
                              {vendedoresDisponibles.map((vendedor) => (
                                <div
                                  key={vendedor.id}
                                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                                    selectedVendedor === vendedor.id 
                                      ? 'border-blue-500 bg-blue-50' 
                                      : 'border-gray-200 hover:border-gray-300'
                                  }`}
                                  onClick={() => setSelectedVendedor(vendedor.id)}
                                >
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <h5 className="font-medium">
                                          {vendedor.nombre} {vendedor.apellido}
                                        </h5>
                                        {vendedor.recomendado && (
                                          <Badge className="bg-green-100 text-green-800">
                                            ⭐ Recomendado
                                          </Badge>
                                        )}
                                      </div>
                                      <p className="text-sm text-slate-600">{vendedor.especialidad}</p>
                                      <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
                                        <span>{vendedor.leadsActivos} leads activos</span>
                                        <span>{vendedor.tasaConversion}% conversión</span>
                                      </div>
                                    </div>
                                    <Badge className={getDisponibilidadColor(vendedor.disponibilidad)}>
                                      {vendedor.disponibilidad === 'alta' ? 'Alta Disponibilidad' :
                                       vendedor.disponibilidad === 'media' ? 'Media Disponibilidad' :
                                       'Baja Disponibilidad'}
                                    </Badge>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Motivo */}
                          <div>
                            <Label htmlFor="motivo">Motivo de Reasignación *</Label>
                            <Select value={motivoReasignacion} onValueChange={setMotivoReasignacion}>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona un motivo..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="falta_seguimiento">Falta de seguimiento</SelectItem>
                                <SelectItem value="sobrecarga_vendedor">Vendedor sobrecargado</SelectItem>
                                <SelectItem value="especializacion">Mejor especialización</SelectItem>
                                <SelectItem value="baja_conversion">Baja conversión vendedor actual</SelectItem>
                                <SelectItem value="disponibilidad">Mayor disponibilidad</SelectItem>
                                <SelectItem value="otro">Otro</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Comentarios */}
                          <div>
                            <Label htmlFor="comentarios">Comentarios Adicionales</Label>
                            <Textarea
                              id="comentarios"
                              placeholder="Información adicional sobre la reasignación..."
                              value={comentarios}
                              onChange={(e) => setComentarios(e.target.value)}
                              rows={3}
                            />
                          </div>
                        </div>

                        <DialogFooter>
                          <Button variant="outline" onClick={() => setSelectedLead(null)}>
                            Cancelar
                          </Button>
                          <Button 
                            onClick={handleReasignarLead}
                            disabled={!selectedVendedor || !motivoReasignacion}
                          >
                            Confirmar Reasignación
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </motion.div>
            ))}

            {leadsFiltered.length === 0 && (
              <div className="text-center py-12">
                <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-800 mb-2">
                  ¡Excelente! No hay leads que requieran reasignación
                </h3>
                <p className="text-slate-600 mb-4">
                  Todos los leads están siendo atendidos adecuadamente por tu equipo
                </p>
                <Button variant="outline" onClick={fetchReasignacionData}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Verificar Nuevamente
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
