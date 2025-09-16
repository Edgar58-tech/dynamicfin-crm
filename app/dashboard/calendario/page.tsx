

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Calendar,
  Clock,
  Phone,
  Mail,
  User,
  MapPin,
  Filter,
  Search,
  Edit,
  Trash2,
  CheckCircle,
  AlertCircle,
  Video,
  MessageSquare,
  X,
  Plus
} from 'lucide-react';
import { motion } from 'framer-motion';

interface Actividad {
  id: number;
  fecha: string;
  hora: string;
  tipo: string;
  prospecto: {
    nombre: string;
    apellido: string;
    clasificacion: string;
    sppc: number;
    telefono: string;
    email: string;
  };
  vendedorAsignado: string;
  comentarios: string;
  estado: string;
  fechaCreacion: string;
}

export default function CalendarioPage() {
  const { data: session, status } = useSession();
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [loading, setLoading] = useState(true);
  const [vistaCalendario, setVistaCalendario] = useState<'dia' | 'semana' | 'mes' | 'lista'>('lista');
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date().toISOString().split('T')[0]);
  const [filtros, setFiltros] = useState({
    vendedor: 'todos',
    tipo: 'todos',
    estado: 'todos',
    prospecto: ''
  });
  
  // Estados para modal de edición
  const [showEditModal, setShowEditModal] = useState(false);
  const [showNuevaModal, setShowNuevaModal] = useState(false);
  const [selectedActividad, setSelectedActividad] = useState<Actividad | null>(null);
  
  // Estado para nueva actividad
  const [nuevaActividad, setNuevaActividad] = useState({
    fecha: new Date().toISOString().split('T')[0],
    hora: '09:00',
    tipo: '',
    prospecto: '',
    vendedor: '',
    comentarios: ''
  });

  useEffect(() => {
    // Datos simulados de actividades agendadas
    const sampleData: Actividad[] = [
      {
        id: 1,
        fecha: '2025-09-09',
        hora: '06:00',
        tipo: 'Llamada',
        prospecto: {
          nombre: 'María',
          apellido: 'Rodríguez',
          clasificacion: 'Elite',
          sppc: 92.5,
          telefono: '+52 55 5555-1234',
          email: 'maria.rodriguez@email.com'
        },
        vendedorAsignado: 'Carlos Venta',
        comentarios: 'Seguimiento prioritario para cierre',
        estado: 'Programada',
        fechaCreacion: '2025-09-08'
      },
      {
        id: 2,
        fecha: '2025-09-09',
        hora: '10:30',
        tipo: 'Email',
        prospecto: {
          nombre: 'José',
          apellido: 'Martínez',
          clasificacion: 'Calificado',
          sppc: 78.3,
          telefono: '+52 55 5555-5678',
          email: 'jose.martinez@email.com'
        },
        vendedorAsignado: 'Lucía Ventas',
        comentarios: 'Envío de propuesta personalizada',
        estado: 'Completada',
        fechaCreacion: '2025-09-07'
      },
      {
        id: 3,
        fecha: '2025-09-10',
        hora: '14:00',
        tipo: 'Reunión',
        prospecto: {
          nombre: 'Ana',
          apellido: 'García',
          clasificacion: 'A Madurar',
          sppc: 65.2,
          telefono: '+52 55 5555-9012',
          email: 'ana.garcia@email.com'
        },
        vendedorAsignado: 'Miguel Sales',
        comentarios: 'Reunión presencial en showroom',
        estado: 'Programada',
        fechaCreacion: '2025-09-08'
      },
      {
        id: 4,
        fecha: '2025-09-11',
        hora: '09:15',
        tipo: 'WhatsApp',
        prospecto: {
          nombre: 'Carlos',
          apellido: 'López',
          clasificacion: 'Elite',
          sppc: 89.1,
          telefono: '+52 55 5555-3456',
          email: 'carlos.lopez@email.com'
        },
        vendedorAsignado: 'Ana Martínez',
        comentarios: 'Recordatorio de prueba de manejo',
        estado: 'Programada',
        fechaCreacion: '2025-09-09'
      },
      {
        id: 5,
        fecha: '2025-09-12',
        hora: '16:30',
        tipo: 'Visita',
        prospecto: {
          nombre: 'Luis',
          apellido: 'Sánchez',
          clasificacion: 'Calificado',
          sppc: 72.8,
          telefono: '+52 55 5555-7890',
          email: 'luis.sanchez@email.com'
        },
        vendedorAsignado: 'Luis Rodríguez',
        comentarios: 'Visita a agencia para firma de contrato',
        estado: 'Programada',
        fechaCreacion: '2025-09-08'
      }
    ];
    
    setTimeout(() => {
      setActividades(sampleData);
      setLoading(false);
    }, 500);
  }, []);

  // Filtrar actividades
  const actividadesFiltradas = actividades.filter(actividad => {
    const matchVendedor = filtros.vendedor === 'todos' || actividad.vendedorAsignado === filtros.vendedor;
    const matchTipo = filtros.tipo === 'todos' || actividad.tipo === filtros.tipo;
    const matchEstado = filtros.estado === 'todos' || actividad.estado === filtros.estado;
    const matchProspecto = filtros.prospecto === '' || 
      `${actividad.prospecto.nombre} ${actividad.prospecto.apellido}`.toLowerCase().includes(filtros.prospecto.toLowerCase());
    
    return matchVendedor && matchTipo && matchEstado && matchProspecto;
  });

  // Obtener actividades por fecha para la vista de calendario
  const getActividadesPorFecha = (fecha: string) => {
    return actividadesFiltradas.filter(act => act.fecha === fecha);
  };

  // Obtener actividades según la vista seleccionada
  const getActividadesPorVista = () => {
    const hoy = new Date().toISOString().split('T')[0];
    
    switch (vistaCalendario) {
      case 'dia':
        return actividadesFiltradas.filter(act => act.fecha === fechaSeleccionada);
      case 'semana':
        const fechaInicio = new Date(fechaSeleccionada);
        const fechaFin = new Date(fechaSeleccionada);
        fechaInicio.setDate(fechaInicio.getDate() - fechaInicio.getDay()); // Inicio de semana (Domingo)
        fechaFin.setDate(fechaFin.getDate() + (6 - fechaFin.getDay())); // Fin de semana (Sábado)
        
        return actividadesFiltradas.filter(act => {
          const fechaActividad = new Date(act.fecha);
          return fechaActividad >= fechaInicio && fechaActividad <= fechaFin;
        });
      case 'lista':
      default:
        return actividadesFiltradas;
    }
  };

  // Título dinámico según la vista
  const getTituloVista = () => {
    switch (vistaCalendario) {
      case 'dia':
        return `Actividades del Día - ${new Date(fechaSeleccionada).toLocaleDateString('es-ES', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}`;
      case 'semana':
        const fechaInicio = new Date(fechaSeleccionada);
        const fechaFin = new Date(fechaSeleccionada);
        fechaInicio.setDate(fechaInicio.getDate() - fechaInicio.getDay());
        fechaFin.setDate(fechaFin.getDate() + (6 - fechaFin.getDay()));
        return `Actividades de la Semana - ${fechaInicio.toLocaleDateString('es-ES')} al ${fechaFin.toLocaleDateString('es-ES')}`;
      case 'lista':
      default:
        return `Actividades (${getActividadesPorVista().length})`;
    }
  };

  // Iconos por tipo de actividad
  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'Llamada':
        return <Phone className="w-4 h-4" />;
      case 'Email':
        return <Mail className="w-4 h-4" />;
      case 'Reunión':
        return <User className="w-4 h-4" />;
      case 'WhatsApp':
        return <MessageSquare className="w-4 h-4" />;
      case 'Visita':
        return <MapPin className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  // Colores por estado
  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'Completada':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Programada':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'En Proceso':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Cancelada':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Colores por clasificación SPPC
  const getSppcColor = (clasificacion: string) => {
    switch (clasificacion) {
      case 'Elite':
        return 'bg-purple-100 text-purple-800';
      case 'Calificado':
        return 'bg-green-100 text-green-800';
      case 'A Madurar':
        return 'bg-yellow-100 text-yellow-800';
      case 'Explorador':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleEditarActividad = (actividad: Actividad) => {
    setSelectedActividad(actividad);
    setShowEditModal(true);
  };

  const handleEliminarActividad = (actividadId: number) => {
    if (confirm('¿Estás seguro de que deseas cancelar esta actividad?')) {
      setActividades(actividades.map(act => 
        act.id === actividadId ? { ...act, estado: 'Cancelada' } : act
      ));
      alert('✅ Actividad cancelada exitosamente');
    }
  };

  const handleMarcarCompletada = (actividadId: number) => {
    setActividades(actividades.map(act => 
      act.id === actividadId ? { ...act, estado: 'Completada' } : act
    ));
    alert('✅ Actividad marcada como completada');
  };

  const handleGuardarEdicion = () => {
    if (selectedActividad) {
      setActividades(actividades.map(act => 
        act.id === selectedActividad.id ? selectedActividad : act
      ));
      setShowEditModal(false);
      alert('✅ Actividad actualizada exitosamente');
    }
  };

  const handleNuevaActividad = () => {
    setShowNuevaModal(true);
  };

  const handleGuardarNuevaActividad = () => {
    if (!nuevaActividad.tipo || !nuevaActividad.prospecto || !nuevaActividad.vendedor) {
      alert('❌ Por favor completa todos los campos requeridos');
      return;
    }

    const nuevaActividadCompleta: Actividad = {
      id: actividades.length + 1,
      fecha: nuevaActividad.fecha,
      hora: nuevaActividad.hora,
      tipo: nuevaActividad.tipo,
      prospecto: {
        nombre: nuevaActividad.prospecto.split(' ')[0] || 'Nuevo',
        apellido: nuevaActividad.prospecto.split(' ')[1] || 'Prospecto',
        clasificacion: 'Calificado',
        sppc: 75.0,
        telefono: '+52 55 0000-0000',
        email: 'prospecto@email.com'
      },
      vendedorAsignado: nuevaActividad.vendedor,
      comentarios: nuevaActividad.comentarios,
      estado: 'Programada',
      fechaCreacion: new Date().toISOString().split('T')[0]
    };

    setActividades([...actividades, nuevaActividadCompleta]);
    setShowNuevaModal(false);
    setNuevaActividad({
      fecha: new Date().toISOString().split('T')[0],
      hora: '09:00',
      tipo: '',
      prospecto: '',
      vendedor: '',
      comentarios: ''
    });
    alert('✅ Nueva actividad creada exitosamente!\n\nLa actividad ha sido agregada a tu calendario.');
  };

  if (status === 'loading' || loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-slate-200 rounded w-48 animate-pulse"></div>
        <div className="grid gap-6">
          {[...Array(5)].map((_, i) => (
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">📅 Calendario de Actividades</h1>
          <p className="text-slate-600 mt-2">Gestiona todas tus actividades programadas con prospectos</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleNuevaActividad}>
            <Plus className="w-4 h-4 mr-2" />
            Nueva Actividad
          </Button>
        </div>
      </div>

      {/* Estadísticas Rápidas */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{actividades.length}</p>
                <p className="text-sm text-slate-600">Total Actividades</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {actividades.filter(act => act.estado === 'Programada').length}
                </p>
                <p className="text-sm text-slate-600">Programadas</p>
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
                <p className="text-2xl font-bold text-slate-900">
                  {actividades.filter(act => act.estado === 'Completada').length}
                </p>
                <p className="text-sm text-slate-600">Completadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {getActividadesPorFecha(new Date().toISOString().split('T')[0]).length}
                </p>
                <p className="text-sm text-slate-600">Hoy</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros y Vista */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Filtros y Vista</CardTitle>
            <div className="flex gap-2">
              <Button 
                variant={vistaCalendario === 'lista' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setVistaCalendario('lista')}
              >
                Lista
              </Button>
              <Button 
                variant={vistaCalendario === 'dia' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setVistaCalendario('dia')}
              >
                Día
              </Button>
              <Button 
                variant={vistaCalendario === 'semana' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setVistaCalendario('semana')}
              >
                Semana
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Navegación para vistas de día y semana */}
          {(vistaCalendario === 'dia' || vistaCalendario === 'semana') && (
            <div className="flex items-center justify-between mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  const fecha = new Date(fechaSeleccionada);
                  if (vistaCalendario === 'dia') {
                    fecha.setDate(fecha.getDate() - 1);
                  } else {
                    fecha.setDate(fecha.getDate() - 7);
                  }
                  setFechaSeleccionada(fecha.toISOString().split('T')[0]);
                }}
              >
                ← {vistaCalendario === 'dia' ? 'Día Anterior' : 'Semana Anterior'}
              </Button>
              
              <div className="text-center">
                <p className="font-medium text-blue-800">
                  {vistaCalendario === 'dia' ? '📅 Vista de Día' : '📊 Vista de Semana'}
                </p>
                <p className="text-sm text-blue-600">
                  {getActividadesPorVista().length} actividade(s) encontrada(s)
                </p>
              </div>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  const fecha = new Date(fechaSeleccionada);
                  if (vistaCalendario === 'dia') {
                    fecha.setDate(fecha.getDate() + 1);
                  } else {
                    fecha.setDate(fecha.getDate() + 7);
                  }
                  setFechaSeleccionada(fecha.toISOString().split('T')[0]);
                }}
              >
                {vistaCalendario === 'dia' ? 'Día Siguiente' : 'Semana Siguiente'} →
              </Button>
            </div>
          )}
          
          {/* Filtros normales */}
          <div className="grid md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Vendedor</label>
              <Select value={filtros.vendedor} onValueChange={(value) => setFiltros({...filtros, vendedor: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los vendedores</SelectItem>
                  <SelectItem value="Carlos Venta">Carlos Venta</SelectItem>
                  <SelectItem value="Lucía Ventas">Lucía Ventas</SelectItem>
                  <SelectItem value="Miguel Sales">Miguel Sales</SelectItem>
                  <SelectItem value="Ana Martínez">Ana Martínez</SelectItem>
                  <SelectItem value="Luis Rodríguez">Luis Rodríguez</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Tipo</label>
              <Select value={filtros.tipo} onValueChange={(value) => setFiltros({...filtros, tipo: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los tipos</SelectItem>
                  <SelectItem value="Llamada">📞 Llamada</SelectItem>
                  <SelectItem value="Email">📧 Email</SelectItem>
                  <SelectItem value="Reunión">🤝 Reunión</SelectItem>
                  <SelectItem value="WhatsApp">💬 WhatsApp</SelectItem>
                  <SelectItem value="Visita">🏢 Visita</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Estado</label>
              <Select value={filtros.estado} onValueChange={(value) => setFiltros({...filtros, estado: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los estados</SelectItem>
                  <SelectItem value="Programada">🕐 Programada</SelectItem>
                  <SelectItem value="Completada">✅ Completada</SelectItem>
                  <SelectItem value="En Proceso">⏳ En Proceso</SelectItem>
                  <SelectItem value="Cancelada">❌ Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Fecha</label>
              <Input 
                type="date"
                value={fechaSeleccionada}
                onChange={(e) => setFechaSeleccionada(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Buscar Prospecto</label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <Input 
                  placeholder="Nombre del prospecto..."
                  value={filtros.prospecto}
                  onChange={(e) => setFiltros({...filtros, prospecto: e.target.value})}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Actividades */}
      <div>
        <h2 className="text-xl font-semibold text-slate-900 mb-4">
          {getTituloVista()}
        </h2>
        
        <div className="space-y-4">
          {getActividadesPorVista().length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-600 mb-2">No hay actividades</h3>
                <p className="text-slate-500">No se encontraron actividades con los filtros aplicados.</p>
              </CardContent>
            </Card>
          ) : (
            getActividadesPorVista().map((actividad, index) => (
              <motion.div
                key={actividad.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card className="hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      {/* Información Principal */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            actividad.tipo === 'Llamada' ? 'bg-blue-100' :
                            actividad.tipo === 'Email' ? 'bg-green-100' :
                            actividad.tipo === 'Reunión' ? 'bg-purple-100' :
                            actividad.tipo === 'WhatsApp' ? 'bg-emerald-100' :
                            actividad.tipo === 'Visita' ? 'bg-orange-100' : 'bg-slate-100'
                          }`}>
                            {getTipoIcon(actividad.tipo)}
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-lg font-semibold text-slate-900">
                                {actividad.prospecto.nombre} {actividad.prospecto.apellido}
                              </h3>
                              <Badge className={getSppcColor(actividad.prospecto.clasificacion)}>
                                {actividad.prospecto.clasificacion}
                              </Badge>
                              <Badge variant="outline">
                                SPPC: {actividad.prospecto.sppc}%
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-slate-600">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {new Date(actividad.fecha).toLocaleDateString('es-ES')}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {actividad.hora}
                              </span>
                              <span className="flex items-center gap-1">
                                <User className="w-4 h-4" />
                                {actividad.vendedorAsignado}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Información de Contacto */}
                        <div className="bg-slate-50 rounded-lg p-3 mb-3">
                          <div className="grid md:grid-cols-2 gap-2 text-sm">
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-slate-500" />
                              <span>{actividad.prospecto.telefono}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4 text-slate-500" />
                              <span>{actividad.prospecto.email}</span>
                            </div>
                          </div>
                        </div>

                        {/* Comentarios */}
                        {actividad.comentarios && (
                          <div className="mb-3">
                            <p className="text-sm text-slate-700">
                              <strong>Comentarios:</strong> {actividad.comentarios}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Estado y Acciones */}
                      <div className="flex flex-col items-end gap-3">
                        <Badge className={getEstadoColor(actividad.estado)}>
                          {actividad.estado}
                        </Badge>
                        
                        <div className="flex gap-2">
                          {actividad.estado === 'Programada' && (
                            <>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleEditarActividad(actividad)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleMarcarCompletada(actividad.id)}
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleEliminarActividad(actividad.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Modal Nueva Actividad */}
      {showNuevaModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Crear Nueva Actividad
              </h2>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowNuevaModal(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Fecha *</label>
                  <Input 
                    type="date"
                    value={nuevaActividad.fecha}
                    onChange={(e) => setNuevaActividad({...nuevaActividad, fecha: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Hora *</label>
                  <Input 
                    type="time"
                    value={nuevaActividad.hora}
                    onChange={(e) => setNuevaActividad({...nuevaActividad, hora: e.target.value})}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Tipo de Actividad *</label>
                <Select 
                  value={nuevaActividad.tipo} 
                  onValueChange={(value) => setNuevaActividad({...nuevaActividad, tipo: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el tipo de actividad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Llamada">📞 Llamada Telefónica</SelectItem>
                    <SelectItem value="Email">📧 Envío de Email</SelectItem>
                    <SelectItem value="Reunión">🤝 Reunión Presencial</SelectItem>
                    <SelectItem value="WhatsApp">💬 Mensaje WhatsApp</SelectItem>
                    <SelectItem value="Visita">🏢 Visita a Agencia</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Nombre del Prospecto *</label>
                <Input 
                  value={nuevaActividad.prospecto}
                  onChange={(e) => setNuevaActividad({...nuevaActividad, prospecto: e.target.value})}
                  placeholder="Ej: María Rodríguez"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Ingresa el nombre completo del prospecto
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Vendedor Asignado *</label>
                <Select 
                  value={nuevaActividad.vendedor} 
                  onValueChange={(value) => setNuevaActividad({...nuevaActividad, vendedor: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el vendedor responsable" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Carlos Venta">Carlos Venta</SelectItem>
                    <SelectItem value="Lucía Ventas">Lucía Ventas</SelectItem>
                    <SelectItem value="Miguel Sales">Miguel Sales</SelectItem>
                    <SelectItem value="Ana Martínez">Ana Martínez</SelectItem>
                    <SelectItem value="Luis Rodríguez">Luis Rodríguez</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Comentarios</label>
                <Input 
                  value={nuevaActividad.comentarios}
                  onChange={(e) => setNuevaActividad({...nuevaActividad, comentarios: e.target.value})}
                  placeholder="Comentarios adicionales sobre la actividad..."
                />
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">📋 Información:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• La actividad será programada automáticamente</li>
                  <li>• Se enviará una notificación al vendedor asignado</li>
                  <li>• Podrás editarla o cancelarla desde el calendario</li>
                  <li>• Se creará un recordatorio automático</li>
                </ul>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button 
                onClick={handleGuardarNuevaActividad}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                disabled={!nuevaActividad.tipo || !nuevaActividad.prospecto || !nuevaActividad.vendedor}
              >
                Crear Actividad
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowNuevaModal(false)}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Actividad */}
      {showEditModal && selectedActividad && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Editar Actividad - {selectedActividad.prospecto.nombre}</h2>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowEditModal(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Fecha *</label>
                  <Input 
                    type="date"
                    value={selectedActividad.fecha}
                    onChange={(e) => setSelectedActividad({...selectedActividad, fecha: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Hora *</label>
                  <Input 
                    type="time"
                    value={selectedActividad.hora}
                    onChange={(e) => setSelectedActividad({...selectedActividad, hora: e.target.value})}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Tipo de Actividad *</label>
                <Select 
                  value={selectedActividad.tipo} 
                  onValueChange={(value) => setSelectedActividad({...selectedActividad, tipo: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Llamada">📞 Llamada Telefónica</SelectItem>
                    <SelectItem value="Email">📧 Envío de Email</SelectItem>
                    <SelectItem value="Reunión">🤝 Reunión Presencial</SelectItem>
                    <SelectItem value="WhatsApp">💬 Mensaje WhatsApp</SelectItem>
                    <SelectItem value="Visita">🏢 Visita a Agencia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Comentarios</label>
                <Input 
                  value={selectedActividad.comentarios}
                  onChange={(e) => setSelectedActividad({...selectedActividad, comentarios: e.target.value})}
                  placeholder="Comentarios adicionales..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Estado</label>
                <Select 
                  value={selectedActividad.estado} 
                  onValueChange={(value) => setSelectedActividad({...selectedActividad, estado: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Programada">🕐 Programada</SelectItem>
                    <SelectItem value="En Proceso">⏳ En Proceso</SelectItem>
                    <SelectItem value="Completada">✅ Completada</SelectItem>
                    <SelectItem value="Cancelada">❌ Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">Información del Prospecto:</h4>
                <p className="text-sm text-blue-700">• Clasificación: {selectedActividad.prospecto.clasificacion}</p>
                <p className="text-sm text-blue-700">• SPPC: {selectedActividad.prospecto.sppc}%</p>
                <p className="text-sm text-blue-700">• Teléfono: {selectedActividad.prospecto.telefono}</p>
                <p className="text-sm text-blue-700">• Email: {selectedActividad.prospecto.email}</p>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button 
                onClick={handleGuardarEdicion}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                Guardar Cambios
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowEditModal(false)}
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

