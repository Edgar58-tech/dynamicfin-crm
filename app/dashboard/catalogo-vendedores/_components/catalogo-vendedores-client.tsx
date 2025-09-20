
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Users, 
  UserPlus, 
  Edit, 
  Trash2, 
  Search, 
  Filter,
  MoreHorizontal,
  Eye,
  UserCheck,
  UserX,
  RefreshCw,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Target,
  Calendar
} from 'lucide-react';
import { toast } from 'sonner';

interface Vendedor {
  id: string;
  nombre: string;
  apellido?: string;
  email: string;
  telefono?: string;
  especialidad?: string;
  fechaIngreso: string;
  activo: boolean;
  cargaProspectos: number;
  metaMensual?: number;
  ventasRealizadas?: number;
  tasaConversion?: number;
  agencia?: {
    id: number;
    nombreAgencia: string;
  };
  marca?: {
    id: number;
    nombreMarca: string;
  };
  estadisticas?: {
    prospectosMes: number;
    ventasMes: number;
    conversionMes: number;
    ingresosMes: number;
  };
}

interface FormVendedor {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  especialidad: string;
  metaMensual: number;
  activo: boolean;
}

interface CatalogoVendedoresClientProps {
  userRole: string;
}

const ESPECIALIDADES = [
  'SUVs Premium',
  'Autos Compactos',
  'Sedanes',
  'Autos Familiares',
  'Vehículos Comerciales',
  'Autos Deportivos',
  'Híbridos y Eléctricos',
  'Generalista'
];

const FILTROS_ESTADO = [
  { value: 'todos', label: 'Todos los Vendedores' },
  { value: 'activos', label: 'Solo Activos' },
  { value: 'inactivos', label: 'Solo Inactivos' },
  { value: 'alta_carga', label: 'Alta Carga (>8 leads)' },
  { value: 'baja_carga', label: 'Baja Carga (<3 leads)' }
];

export function CatalogoVendedoresClient({ userRole }: CatalogoVendedoresClientProps) {
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [vendedoresFiltrados, setVendedoresFiltrados] = useState<Vendedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  
  // Estados de filtros y búsqueda
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [filtroEspecialidad, setFiltroEspecialidad] = useState('todas');
  
  // Estados de modales
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modalTipo, setModalTipo] = useState<'crear' | 'editar' | 'ver'>('crear');
  const [vendedorSeleccionado, setVendedorSeleccionado] = useState<Vendedor | null>(null);
  
  // Estado del formulario
  const [formData, setFormData] = useState<FormVendedor>({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    especialidad: '',
    metaMensual: 5,
    activo: true
  });

  useEffect(() => {
    cargarVendedores();
  }, []);

  useEffect(() => {
    aplicarFiltros();
  }, [vendedores, busqueda, filtroEstado, filtroEspecialidad]);

  const cargarVendedores = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/vendedores');
      
      if (!response.ok) {
        throw new Error('Error al cargar vendedores');
      }

      const data = await response.json();
      setVendedores(data.vendedores || []);
      
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar vendedores');
    } finally {
      setLoading(false);
    }
  };

  const aplicarFiltros = () => {
    let resultado = [...vendedores];

    // Filtro por búsqueda
    if (busqueda.trim()) {
      const termino = busqueda.toLowerCase();
      resultado = resultado.filter(v => 
        v.nombre.toLowerCase().includes(termino) ||
        v.apellido?.toLowerCase().includes(termino) ||
        v.email.toLowerCase().includes(termino) ||
        v.especialidad?.toLowerCase().includes(termino)
      );
    }

    // Filtro por estado
    switch (filtroEstado) {
      case 'activos':
        resultado = resultado.filter(v => v.activo);
        break;
      case 'inactivos':
        resultado = resultado.filter(v => !v.activo);
        break;
      case 'alta_carga':
        resultado = resultado.filter(v => v.cargaProspectos > 8);
        break;
      case 'baja_carga':
        resultado = resultado.filter(v => v.cargaProspectos < 3);
        break;
    }

    // Filtro por especialidad
    if (filtroEspecialidad !== 'todas') {
      resultado = resultado.filter(v => v.especialidad === filtroEspecialidad);
    }

    setVendedoresFiltrados(resultado);
  };

  const abrirModal = (tipo: 'crear' | 'editar' | 'ver', vendedor?: Vendedor) => {
    setModalTipo(tipo);
    setVendedorSeleccionado(vendedor || null);
    
    if (tipo === 'crear') {
      setFormData({
        nombre: '',
        apellido: '',
        email: '',
        telefono: '',
        especialidad: '',
        metaMensual: 5,
        activo: true
      });
    } else if (tipo === 'editar' && vendedor) {
      setFormData({
        nombre: vendedor.nombre,
        apellido: vendedor.apellido || '',
        email: vendedor.email,
        telefono: vendedor.telefono || '',
        especialidad: vendedor.especialidad || '',
        metaMensual: vendedor.metaMensual || 5,
        activo: vendedor.activo
      });
    }
    
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setVendedorSeleccionado(null);
    setFormData({
      nombre: '',
      apellido: '',
      email: '',
      telefono: '',
      especialidad: '',
      metaMensual: 5,
      activo: true
    });
  };

  const manejarSubmit = async () => {
    // Validaciones
    if (!formData.nombre.trim() || !formData.email.trim()) {
      toast.error('Nombre y email son requeridos');
      return;
    }

    if (!formData.email.includes('@')) {
      toast.error('Email inválido');
      return;
    }

    try {
      setGuardando(true);

      const url = modalTipo === 'crear' 
        ? '/api/vendedores' 
        : `/api/vendedores/${vendedorSeleccionado?.id}`;
      
      const method = modalTipo === 'crear' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al guardar vendedor');
      }

      const resultado = await response.json();
      
      toast.success(
        modalTipo === 'crear' 
          ? 'Vendedor creado exitosamente' 
          : 'Vendedor actualizado exitosamente'
      );

      cerrarModal();
      cargarVendedores();

    } catch (error) {
      console.error('Error:', error);
      toast.error(error instanceof Error ? error.message : 'Error al guardar vendedor');
    } finally {
      setGuardando(false);
    }
  };

  const eliminarVendedor = async (vendedor: Vendedor) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar a ${vendedor.nombre} ${vendedor.apellido}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/vendedores/${vendedor.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al eliminar vendedor');
      }

      toast.success('Vendedor eliminado exitosamente');
      cargarVendedores();

    } catch (error) {
      console.error('Error:', error);
      toast.error(error instanceof Error ? error.message : 'Error al eliminar vendedor');
    }
  };

  const toggleEstadoVendedor = async (vendedor: Vendedor) => {
    try {
      const response = await fetch(`/api/vendedores/${vendedor.id}/toggle-estado`, {
        method: 'PATCH'
      });

      if (!response.ok) {
        throw new Error('Error al cambiar estado del vendedor');
      }

      toast.success(`Vendedor ${vendedor.activo ? 'desactivado' : 'activado'} exitosamente`);
      cargarVendedores();

    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cambiar estado del vendedor');
    }
  };

  const exportarVendedores = () => {
    // Implementar exportación a Excel
    toast.success('Exportación iniciada...');
  };

  const getEstadisticasGenerales = () => {
    const total = vendedores.length;
    const activos = vendedores.filter(v => v.activo).length;
    const cargaPromedio = vendedores.reduce((acc, v) => acc + v.cargaProspectos, 0) / total || 0;
    const sobrecargados = vendedores.filter(v => v.cargaProspectos > 8).length;

    return { total, activos, cargaPromedio: Math.round(cargaPromedio), sobrecargados };
  };

  const estadisticas = getEstadisticasGenerales();

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estadísticas Generales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Vendedores</p>
                <p className="text-2xl font-bold text-blue-600">{estadisticas.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <UserCheck className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Activos</p>
                <p className="text-2xl font-bold text-green-600">{estadisticas.activos}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Target className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Carga Promedio</p>
                <p className="text-2xl font-bold text-purple-600">{estadisticas.cargaPromedio}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Sobrecargados</p>
                <p className="text-2xl font-bold text-orange-600">{estadisticas.sobrecargados}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Panel de Control */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gestión de Vendedores</CardTitle>
              <CardDescription>
                Administra el catálogo completo de vendedores
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={exportarVendedores}>
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
              <Button onClick={() => abrirModal('crear')}>
                <UserPlus className="h-4 w-4 mr-2" />
                Nuevo Vendedor
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filtros y Búsqueda */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div>
              <Label>Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Nombre, email, especialidad..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label>Estado</Label>
              <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FILTROS_ESTADO.map(filtro => (
                    <SelectItem key={filtro.value} value={filtro.value}>
                      {filtro.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Especialidad</Label>
              <Select value={filtroEspecialidad} onValueChange={setFiltroEspecialidad}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas las Especialidades</SelectItem>
                  {ESPECIALIDADES.map(esp => (
                    <SelectItem key={esp} value={esp}>{esp}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button variant="outline" onClick={cargarVendedores} className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualizar
              </Button>
            </div>
          </div>

          <Separator className="mb-6" />

          {/* Lista de Vendedores */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            <AnimatePresence>
              {vendedoresFiltrados.map((vendedor, index) => (
                <motion.div
                  key={vendedor.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card className="h-full hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${vendedor.activo ? 'bg-green-400' : 'bg-gray-400'}`}></div>
                          <div>
                            <CardTitle className="text-lg">
                              {vendedor.nombre} {vendedor.apellido}
                            </CardTitle>
                            <CardDescription>{vendedor.email}</CardDescription>
                          </div>
                        </div>
                        <Badge variant={vendedor.activo ? 'default' : 'secondary'}>
                          {vendedor.activo ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Información Básica */}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Especialidad:</span>
                          <p className="font-medium">{vendedor.especialidad || 'No definida'}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Carga Actual:</span>
                          <div className="flex items-center space-x-2">
                            <p className={`font-medium ${
                              vendedor.cargaProspectos > 8 ? 'text-red-600' :
                              vendedor.cargaProspectos > 5 ? 'text-yellow-600' :
                              'text-green-600'
                            }`}>
                              {vendedor.cargaProspectos} leads
                            </p>
                            {vendedor.cargaProspectos > 8 ? (
                              <TrendingUp className="w-4 h-4 text-red-500" />
                            ) : vendedor.cargaProspectos < 3 ? (
                              <TrendingDown className="w-4 h-4 text-blue-500" />
                            ) : null}
                          </div>
                        </div>
                      </div>

                      {/* Estadísticas del Mes */}
                      {vendedor.estadisticas && (
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <h5 className="text-sm font-medium text-gray-700 mb-2">Este Mes</h5>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-gray-600">Prospectos:</span>
                              <p className="font-medium">{vendedor.estadisticas.prospectosMes}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Ventas:</span>
                              <p className="font-medium">{vendedor.estadisticas.ventasMes}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Conversión:</span>
                              <p className="font-medium">{vendedor.estadisticas.conversionMes}%</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Ingresos:</span>
                              <p className="font-medium">${vendedor.estadisticas.ingresosMes.toLocaleString()}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Información Adicional */}
                      <div className="text-xs text-gray-500">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            Ingreso: {new Date(vendedor.fechaIngreso).toLocaleDateString()}
                          </div>
                          {vendedor.telefono && (
                            <div>Tel: {vendedor.telefono}</div>
                          )}
                        </div>
                      </div>

                      {/* Acciones */}
                      <div className="flex space-x-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => abrirModal('ver', vendedor)}
                          className="flex-1"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Ver
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => abrirModal('editar', vendedor)}
                          className="flex-1"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleEstadoVendedor(vendedor)}
                          className={vendedor.activo ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'}
                        >
                          {vendedor.activo ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                        </Button>
                        {userRole === 'DIRECTOR_GENERAL' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => eliminarVendedor(vendedor)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {vendedoresFiltrados.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                No se encontraron vendedores
              </h3>
              <p className="text-gray-600 mb-4">
                Ajusta los filtros o crea un nuevo vendedor
              </p>
              <Button onClick={() => abrirModal('crear')}>
                <UserPlus className="h-4 w-4 mr-2" />
                Crear Primer Vendedor
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Vendedor */}
      <Dialog open={modalAbierto} onOpenChange={cerrarModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              {modalTipo === 'crear' && <UserPlus className="h-5 w-5 mr-2" />}
              {modalTipo === 'editar' && <Edit className="h-5 w-5 mr-2" />}
              {modalTipo === 'ver' && <Eye className="h-5 w-5 mr-2" />}
              {modalTipo === 'crear' ? 'Nuevo Vendedor' : 
               modalTipo === 'editar' ? 'Editar Vendedor' : 'Detalles del Vendedor'}
            </DialogTitle>
            <DialogDescription>
              {modalTipo === 'crear' ? 'Crea un nuevo vendedor en el sistema' :
               modalTipo === 'editar' ? 'Modifica la información del vendedor' :
               'Información detallada del vendedor'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {modalTipo === 'ver' && vendedorSeleccionado ? (
              // Vista de solo lectura
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Nombre Completo</Label>
                    <p className="font-medium">{vendedorSeleccionado.nombre} {vendedorSeleccionado.apellido}</p>
                  </div>
                  <div>
                    <Label>Estado</Label>
                    <Badge variant={vendedorSeleccionado.activo ? 'default' : 'secondary'}>
                      {vendedorSeleccionado.activo ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Email</Label>
                    <p>{vendedorSeleccionado.email}</p>
                  </div>
                  <div>
                    <Label>Teléfono</Label>
                    <p>{vendedorSeleccionado.telefono || 'No registrado'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Especialidad</Label>
                    <p>{vendedorSeleccionado.especialidad || 'No definida'}</p>
                  </div>
                  <div>
                    <Label>Meta Mensual</Label>
                    <p>{vendedorSeleccionado.metaMensual || 5} ventas</p>
                  </div>
                </div>

                <div>
                  <Label>Fecha de Ingreso</Label>
                  <p>{new Date(vendedorSeleccionado.fechaIngreso).toLocaleDateString('es-ES', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}</p>
                </div>

                <div>
                  <Label>Carga Actual de Prospectos</Label>
                  <div className="flex items-center space-x-2">
                    <p className="font-medium">{vendedorSeleccionado.cargaProspectos} leads</p>
                    <Badge variant={
                      vendedorSeleccionado.cargaProspectos > 8 ? 'destructive' :
                      vendedorSeleccionado.cargaProspectos > 5 ? 'default' : 'secondary'
                    }>
                      {vendedorSeleccionado.cargaProspectos > 8 ? 'Alta Carga' :
                       vendedorSeleccionado.cargaProspectos > 5 ? 'Carga Normal' : 'Baja Carga'}
                    </Badge>
                  </div>
                </div>
              </div>
            ) : (
              // Formulario de creación/edición
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nombre">Nombre *</Label>
                    <Input
                      id="nombre"
                      value={formData.nombre}
                      onChange={(e) => setFormData(prev => ({...prev, nombre: e.target.value}))}
                      placeholder="Nombre del vendedor"
                    />
                  </div>
                  <div>
                    <Label htmlFor="apellido">Apellido</Label>
                    <Input
                      id="apellido"
                      value={formData.apellido}
                      onChange={(e) => setFormData(prev => ({...prev, apellido: e.target.value}))}
                      placeholder="Apellido del vendedor"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({...prev, email: e.target.value}))}
                      placeholder="email@ejemplo.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="telefono">Teléfono</Label>
                    <Input
                      id="telefono"
                      value={formData.telefono}
                      onChange={(e) => setFormData(prev => ({...prev, telefono: e.target.value}))}
                      placeholder="Número de teléfono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="especialidad">Especialidad</Label>
                    <Select 
                      value={formData.especialidad} 
                      onValueChange={(value) => setFormData(prev => ({...prev, especialidad: value}))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona especialidad" />
                      </SelectTrigger>
                      <SelectContent>
                        {ESPECIALIDADES.map(esp => (
                          <SelectItem key={esp} value={esp}>{esp}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="metaMensual">Meta Mensual</Label>
                    <Input
                      id="metaMensual"
                      type="number"
                      min="1"
                      max="20"
                      value={formData.metaMensual}
                      onChange={(e) => setFormData(prev => ({...prev, metaMensual: parseInt(e.target.value) || 5}))}
                    />
                  </div>
                </div>

                <div>
                  <Label>Estado</Label>
                  <Select 
                    value={formData.activo ? 'activo' : 'inactivo'} 
                    onValueChange={(value) => setFormData(prev => ({...prev, activo: value === 'activo'}))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="activo">Activo</SelectItem>
                      <SelectItem value="inactivo">Inactivo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={cerrarModal}>
              {modalTipo === 'ver' ? 'Cerrar' : 'Cancelar'}
            </Button>
            {modalTipo !== 'ver' && (
              <Button onClick={manejarSubmit} disabled={guardando}>
                {guardando ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {modalTipo === 'crear' ? 'Crear Vendedor' : 'Guardar Cambios'}
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
