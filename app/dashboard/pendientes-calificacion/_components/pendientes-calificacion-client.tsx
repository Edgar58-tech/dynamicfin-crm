
'use client';

import { useState, useEffect } from 'react';
import type { TipoRol } from '@prisma/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Clock, Phone, User, Car, Calendar, Search, Filter, CheckCircle } from 'lucide-react';
import { ProspectoPendienteCalificacion, AlertaTiempoPendiente } from '@/lib/types';
import { CalificarLeadModal } from './calificar-lead-modal';
import { toast } from 'sonner';

interface PendientesCalificacionClientProps {
  userRole: TipoRol;
  userId: string;
}

interface EstadisticasPendientes {
  total: number;
  normal: number;
  amarilla: number;
  naranja: number;
  roja: number;
  promedioHoras: number;
}

export function PendientesCalificacionClient({ userRole, userId }: PendientesCalificacionClientProps) {
  const [leadsPendientes, setLeadsPendientes] = useState<any[]>([]);
  const [estadisticas, setEstadisticas] = useState<EstadisticasPendientes>({
    total: 0,
    normal: 0,
    amarilla: 0,
    naranja: 0,
    roja: 0,
    promedioHoras: 0
  });
  const [loading, setLoading] = useState(true);
  const [filtroTiempo, setFiltroTiempo] = useState('all');
  const [busqueda, setBusqueda] = useState('');
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [modalCalificar, setModalCalificar] = useState(false);

  // Cargar leads pendientes
  const cargarLeadsPendientes = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/vendedores/pendientes-calificacion');
      const data = await response.json();
      
      if (response.ok) {
        setLeadsPendientes(data.leadsPendientes || []);
        setEstadisticas(data.estadisticas || {});
      } else {
        toast.error('Error al cargar leads pendientes');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarLeadsPendientes();
    
    // Recargar cada 30 segundos para mantener actualizado el tiempo
    const interval = setInterval(cargarLeadsPendientes, 30000);
    return () => clearInterval(interval);
  }, []);

  // Filtrar leads por tiempo y búsqueda
  const leadsFiltrados = leadsPendientes.filter(lead => {
    const matchBusqueda = busqueda === '' || 
      lead.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      lead.apellido?.toLowerCase().includes(busqueda.toLowerCase()) ||
      lead.telefono?.includes(busqueda) ||
      lead.vehiculoInteresTexto?.toLowerCase().includes(busqueda.toLowerCase());

    const matchTiempo = filtroTiempo === 'all' || lead.alertaTiempo === filtroTiempo.toUpperCase();

    return matchBusqueda && matchTiempo;
  });

  // Obtener color de alerta
  const getAlertaColor = (alerta: AlertaTiempoPendiente) => {
    switch (alerta) {
      case 'ROJA': return 'bg-red-500 text-white';
      case 'NARANJA': return 'bg-orange-500 text-white';
      case 'AMARILLA': return 'bg-yellow-500 text-black';
      default: return 'bg-green-500 text-white';
    }
  };

  const getAlertaIcon = (alerta: AlertaTiempoPendiente) => {
    switch (alerta) {
      case 'ROJA': return <AlertCircle className="w-4 h-4" />;
      case 'NARANJA': return <Clock className="w-4 h-4" />;
      case 'AMARILLA': return <Clock className="w-4 h-4" />;
      default: return <CheckCircle className="w-4 h-4" />;
    }
  };

  // Iniciar calificación
  const iniciarCalificacion = async (lead: any) => {
    setSelectedLead(lead);
    setModalCalificar(true);
  };

  // Formatear tiempo de espera
  const formatearTiempo = (horas: number, minutos: number) => {
    if (horas >= 1) {
      return `${horas}h ${minutos % 60}m`;
    }
    return `${minutos}m`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estadísticas de Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold">{estadisticas.total}</p>
              </div>
              <User className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Normal</p>
                <p className="text-2xl font-bold text-green-600">{estadisticas.normal}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">2+ Horas</p>
                <p className="text-2xl font-bold text-yellow-600">{estadisticas.amarilla}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">4+ Horas</p>
                <p className="text-2xl font-bold text-orange-600">{estadisticas.naranja}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">8+ Horas</p>
                <p className="text-2xl font-bold text-red-600">{estadisticas.roja}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Promedio</p>
                <p className="text-2xl font-bold text-blue-600">{estadisticas.promedioHoras}h</p>
              </div>
              <Clock className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros y Búsqueda */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar por nombre, teléfono o vehículo..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <Select value={filtroTiempo} onValueChange={setFiltroTiempo}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por tiempo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tiempos</SelectItem>
                  <SelectItem value="normal">Normal (&lt; 2h)</SelectItem>
                  <SelectItem value="amarilla">2+ Horas</SelectItem>
                  <SelectItem value="naranja">4+ Horas</SelectItem>
                  <SelectItem value="roja">8+ Horas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Leads Pendientes */}
      {leadsFiltrados.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              ¡Excelente trabajo!
            </h3>
            <p className="text-gray-600">
              {leadsPendientes.length === 0 
                ? 'No tienes leads pendientes de calificación en este momento.'
                : 'No hay leads que coincidan con los filtros seleccionados.'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {leadsFiltrados.map((lead) => (
            <Card key={lead.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">
                      {lead.nombre} {lead.apellido}
                    </CardTitle>
                    <p className="text-sm text-gray-600">
                      ID: {lead.id}
                    </p>
                  </div>
                  <Badge className={`${getAlertaColor(lead.alertaTiempo)} ml-2`}>
                    {getAlertaIcon(lead.alertaTiempo)}
                    <span className="ml-1">
                      {formatearTiempo(lead.horasEspera, lead.minutosEspera)}
                    </span>
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {/* Información de Contacto */}
                <div className="space-y-2">
                  {lead.telefono && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <span>{lead.telefono}</span>
                    </div>
                  )}
                  {lead.vehiculoInteresTexto && (
                    <div className="flex items-center gap-2 text-sm">
                      <Car className="w-4 h-4 text-gray-500" />
                      <span>{lead.vehiculoInteresTexto}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span>
                      Asignado: {new Date(lead.fechaAsignacion || lead.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Información Adicional */}
                <div className="space-y-1">
                  <p className="text-xs text-gray-500">
                    <strong>Origen:</strong> {lead.origenLead || 'No especificado'}
                  </p>
                  <p className="text-xs text-gray-500">
                    <strong>Coordinador:</strong> {lead.coordinadorNombre}
                  </p>
                  {lead.nivelUrgencia && (
                    <Badge variant={
                      lead.nivelUrgencia === 'ALTA' ? 'destructive' : 
                      lead.nivelUrgencia === 'MEDIA' ? 'default' : 'secondary'
                    }>
                      {lead.nivelUrgencia}
                    </Badge>
                  )}
                </div>

                {/* Observaciones */}
                {lead.asignacionLead?.[0]?.observaciones && (
                  <div className="bg-gray-50 p-2 rounded text-xs">
                    <strong>Observaciones:</strong> {lead.asignacionLead[0].observaciones}
                  </div>
                )}

                {/* Botón de Calificación */}
                <Button 
                  onClick={() => iniciarCalificacion(lead)}
                  className="w-full mt-4"
                  variant={lead.alertaTiempo === 'ROJA' ? 'destructive' : 'default'}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Calificar Ahora
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de Calificación */}
      {selectedLead && (
        <CalificarLeadModal
          isOpen={modalCalificar}
          onClose={() => {
            setModalCalificar(false);
            setSelectedLead(null);
          }}
          lead={selectedLead}
          onSuccess={() => {
            cargarLeadsPendientes();
            setModalCalificar(false);
            setSelectedLead(null);
          }}
        />
      )}
    </div>
  );
}
