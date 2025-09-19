
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Clock,
  MapPin,
  Play,
  Calendar,
  Filter,
  Search,
  Download,
  Eye,
  Loader2,
  History,
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

interface GrabacionProximidad {
  id: number;
  horaEntrada: string;
  horaSalida: string | null;
  tiempoEnZona: number | null;
  estadoGrabacion: string;
  tipoActivacion: string;
  contextoDetectado: string | null;
  zonaProximidad: {
    nombre: string;
    tipo: string;
  } | null;
  prospecto: {
    nombre: string;
    apellido: string | null;
  } | null;
  grabacionConversacion: {
    id: number;
    duracion: number;
    scoreConversacion: number | null;
  } | null;
}

export default function ProximityHistory() {
  const { data: session } = useSession();
  const [grabaciones, setGrabaciones] = useState<GrabacionProximidad[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filtros
  const [filtros, setFiltros] = useState({
    buscar: '',
    estado: 'todos',
    zona: 'todas',
    fechaDesde: '',
    fechaHasta: '',
  });

  /**
   * Cargar historial al montar el componente
   */
  useEffect(() => {
    cargarHistorial();
  }, []);

  /**
   * Cargar historial de grabaciones por proximidad
   */
  const cargarHistorial = async () => {
    try {
      setCargando(true);
      setError(null);

      const params = new URLSearchParams();
      if (filtros.estado !== 'todos') {
        params.append('estado', filtros.estado);
      }

      const response = await fetch(`/api/proximity/auto-record?${params.toString()}`);
      const data = await response.json();

      if (response.ok) {
        setGrabaciones(data.grabaciones || []);
      } else {
        throw new Error(data.error || 'Error al cargar historial');
      }
    } catch (error) {
      console.error('Error cargando historial:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido');
      toast.error('Error al cargar el historial');
    } finally {
      setCargando(false);
    }
  };

  /**
   * Aplicar filtros
   */
  const aplicarFiltros = () => {
    cargarHistorial();
  };

  /**
   * Limpiar filtros
   */
  const limpiarFiltros = () => {
    setFiltros({
      buscar: '',
      estado: 'todos',
      zona: 'todas',
      fechaDesde: '',
      fechaHasta: '',
    });
  };

  /**
   * Formatear duración
   */
  const formatearDuracion = (segundos: number | null) => {
    if (!segundos) return '--';
    
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const segs = segundos % 60;
    
    if (horas > 0) {
      return `${horas}h ${minutos}m ${segs}s`;
    } else if (minutos > 0) {
      return `${minutos}m ${segs}s`;
    } else {
      return `${segs}s`;
    }
  };

  /**
   * Formatear fecha
   */
  const formatearFecha = (fecha: string) => {
    const date = new Date(fecha);
    return date.toLocaleString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  /**
   * Obtener color del estado
   */
  const obtenerColorEstado = (estado: string) => {
    switch (estado) {
      case 'completada':
        return 'bg-green-100 text-green-800';
      case 'en_curso':
        return 'bg-blue-100 text-blue-800';
      case 'iniciada':
        return 'bg-yellow-100 text-yellow-800';
      case 'fallida':
        return 'bg-red-100 text-red-800';
      case 'cancelada':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  /**
   * Ver detalles de grabación
   */
  const verDetalles = (grabacion: GrabacionProximidad) => {
    console.log('Ver detalles:', grabacion);
    // TODO: Implementar modal o navegación a detalles
    toast('Funcionalidad de detalles en desarrollo');
  };

  /**
   * Reproducir grabación
   */
  const reproducirGrabacion = (grabacion: GrabacionProximidad) => {
    if (!grabacion.grabacionConversacion) {
      toast.error('No hay grabación de audio disponible');
      return;
    }

    console.log('Reproducir:', grabacion.grabacionConversacion.id);
    // TODO: Implementar reproducción
    toast('Reproductor en desarrollo');
  };

  if (cargando) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="w-8 h-8 animate-spin mr-3" />
          <span>Cargando historial...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros de Búsqueda
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Input
                placeholder="Buscar..."
                value={filtros.buscar}
                onChange={(e) => setFiltros(prev => ({ ...prev, buscar: e.target.value }))}
                className="w-full"
              />
            </div>

            <div>
              <Select 
                value={filtros.estado} 
                onValueChange={(value) => setFiltros(prev => ({ ...prev, estado: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los estados</SelectItem>
                  <SelectItem value="completada">Completadas</SelectItem>
                  <SelectItem value="en_curso">En curso</SelectItem>
                  <SelectItem value="iniciada">Iniciadas</SelectItem>
                  <SelectItem value="fallida">Fallidas</SelectItem>
                  <SelectItem value="cancelada">Canceladas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Input
                type="date"
                value={filtros.fechaDesde}
                onChange={(e) => setFiltros(prev => ({ ...prev, fechaDesde: e.target.value }))}
              />
            </div>

            <div>
              <Input
                type="date"
                value={filtros.fechaHasta}
                onChange={(e) => setFiltros(prev => ({ ...prev, fechaHasta: e.target.value }))}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={aplicarFiltros} size="sm">
                <Search className="w-4 h-4 mr-2" />
                Filtrar
              </Button>
              <Button onClick={limpiarFiltros} variant="outline" size="sm">
                Limpiar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Historial */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Historial de Grabaciones por Proximidad
          </CardTitle>
          <Badge variant="secondary">
            {grabaciones.length} registros
          </Badge>
        </CardHeader>
        <CardContent>
          {grabaciones.length === 0 ? (
            <div className="text-center p-8">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">No hay grabaciones por proximidad</p>
              <p className="text-sm text-gray-500">
                Las grabaciones automáticas aparecerán aquí una vez que se activen por proximidad
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {grabaciones.map((grabacion, index) => (
                <motion.div
                  key={grabacion.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                >
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                          {/* Información de zona y fecha */}
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <MapPin className="w-4 h-4 text-gray-500" />
                              <span className="font-medium">
                                {grabacion.zonaProximidad?.nombre || 'Zona desconocida'}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500">
                              {formatearFecha(grabacion.horaEntrada)}
                            </p>
                            {grabacion.prospecto && (
                              <p className="text-sm text-blue-600">
                                {grabacion.prospecto.nombre} {grabacion.prospecto.apellido}
                              </p>
                            )}
                          </div>

                          {/* Estado y tipo */}
                          <div>
                            <Badge className={obtenerColorEstado(grabacion.estadoGrabacion)}>
                              {grabacion.estadoGrabacion}
                            </Badge>
                            <p className="text-sm text-gray-500 mt-1 capitalize">
                              {grabacion.tipoActivacion}
                            </p>
                            {grabacion.contextoDetectado && (
                              <p className="text-xs text-gray-400 capitalize">
                                {grabacion.contextoDetectado}
                              </p>
                            )}
                          </div>

                          {/* Duración */}
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Clock className="w-4 h-4 text-gray-500" />
                              <span className="font-medium">
                                {formatearDuracion(grabacion.tiempoEnZona)}
                              </span>
                            </div>
                            {grabacion.grabacionConversacion && (
                              <p className="text-sm text-gray-500">
                                Audio: {formatearDuracion(grabacion.grabacionConversacion.duracion)}
                              </p>
                            )}
                            {grabacion.grabacionConversacion?.scoreConversacion && (
                              <p className="text-sm text-green-600">
                                Score: {grabacion.grabacionConversacion.scoreConversacion}
                              </p>
                            )}
                          </div>

                          {/* Horarios */}
                          <div className="text-sm">
                            <p className="text-gray-500">
                              <strong>Entrada:</strong> {new Date(grabacion.horaEntrada).toLocaleTimeString('es-MX')}
                            </p>
                            {grabacion.horaSalida && (
                              <p className="text-gray-500">
                                <strong>Salida:</strong> {new Date(grabacion.horaSalida).toLocaleTimeString('es-MX')}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Acciones */}
                        <div className="flex flex-col gap-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => verDetalles(grabacion)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          
                          {grabacion.grabacionConversacion && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => reproducirGrabacion(grabacion)}
                            >
                              <Play className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Paginación - TODO: Implementar si es necesario */}
      {grabaciones.length > 0 && (
        <div className="flex justify-center">
          <p className="text-sm text-gray-500">
            Mostrando {grabaciones.length} grabaciones
          </p>
        </div>
      )}
    </div>
  );
}

