
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  MapPin,
  Plus,
  Edit,
  Trash2,
  Target,
  Clock,
  Settings,
  AlertTriangle,
  CheckCircle,
  Users,
  Activity,
  Loader2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

interface Zona {
  id: number;
  nombre: string;
  descripcion?: string;
  tipo: string;
  latitud: number;
  longitud: number;
  radioMetros: number;
  activo: boolean;
  configuraciones: any[];
  _count: {
    grabaciones: number;
    logs: number;
  };
}

export default function ZoneManagement() {
  const { data: session } = useSession() || {};
  const [zonas, setZonas] = useState<Zona[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogoAbierto, setDialogoAbierto] = useState(false);
  const [zonaEditando, setZonaEditando] = useState<Zona | null>(null);
  const [guardando, setGuardando] = useState(false);

  // Estados del formulario
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    tipo: 'showroom',
    latitud: '',
    longitud: '',
    radioMetros: 50,
    activarGrabacion: true,
    tipoGrabacion: 'automatica',
    duracionMaxima: 3600,
    calidadGrabacion: 'media',
    notificarEntrada: true,
    notificarSalida: true,
    notificarGerente: false,
    diasActivos: '1,2,3,4,5,6,7',
    observaciones: '',
  });

  /**
   * Cargar zonas al montar el componente
   */
  useEffect(() => {
    cargarZonas();
  }, []);

  /**
   * Cargar zonas desde la API
   */
  const cargarZonas = async () => {
    try {
      setCargando(true);
      setError(null);

      const response = await fetch('/api/proximity/zones?activo=true');
      const data = await response.json();

      if (response.ok) {
        setZonas(data.zonas || []);
      } else {
        throw new Error(data.error || 'Error al cargar zonas');
      }
    } catch (error) {
      console.error('Error cargando zonas:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setCargando(false);
    }
  };

  /**
   * Abrir diálogo para crear nueva zona
   */
  const abrirDialogoNuevo = () => {
    setZonaEditando(null);
    setFormData({
      nombre: '',
      descripcion: '',
      tipo: 'showroom',
      latitud: '',
      longitud: '',
      radioMetros: 50,
      activarGrabacion: true,
      tipoGrabacion: 'automatica',
      duracionMaxima: 3600,
      calidadGrabacion: 'media',
      notificarEntrada: true,
      notificarSalida: true,
      notificarGerente: false,
      diasActivos: '1,2,3,4,5,6,7',
      observaciones: '',
    });
    setDialogoAbierto(true);
  };

  /**
   * Abrir diálogo para editar zona existente
   */
  const abrirDialogoEditar = (zona: Zona) => {
    setZonaEditando(zona);
    setFormData({
      nombre: zona.nombre,
      descripcion: zona.descripcion || '',
      tipo: zona.tipo,
      latitud: zona.latitud.toString(),
      longitud: zona.longitud.toString(),
      radioMetros: zona.radioMetros,
      activarGrabacion: true, // Estos campos vienen del schema completo
      tipoGrabacion: 'automatica',
      duracionMaxima: 3600,
      calidadGrabacion: 'media',
      notificarEntrada: true,
      notificarSalida: true,
      notificarGerente: false,
      diasActivos: '1,2,3,4,5,6,7',
      observaciones: '',
    });
    setDialogoAbierto(true);
  };

  /**
   * Guardar zona (crear o actualizar)
   */
  const guardarZona = async () => {
    try {
      setGuardando(true);

      // Validaciones básicas
      if (!formData.nombre.trim()) {
        throw new Error('El nombre es requerido');
      }

      if (!formData.latitud || !formData.longitud) {
        throw new Error('Las coordenadas son requeridas');
      }

      const lat = parseFloat(formData.latitud);
      const lng = parseFloat(formData.longitud);

      if (isNaN(lat) || isNaN(lng)) {
        throw new Error('Las coordenadas deben ser números válidos');
      }

      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        throw new Error('Las coordenadas están fuera del rango válido');
      }

      if (formData.radioMetros < 10 || formData.radioMetros > 1000) {
        throw new Error('El radio debe estar entre 10 y 1000 metros');
      }

      const url = zonaEditando 
        ? '/api/proximity/zones' 
        : '/api/proximity/zones';
      
      const method = zonaEditando ? 'PUT' : 'POST';
      
      const body = zonaEditando 
        ? { ...formData, id: zonaEditando.id }
        : formData;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(
          zonaEditando 
            ? 'Zona actualizada exitosamente' 
            : 'Zona creada exitosamente'
        );
        
        setDialogoAbierto(false);
        await cargarZonas(); // Recargar lista
      } else {
        throw new Error(data.error || 'Error al guardar zona');
      }
    } catch (error) {
      console.error('Error guardando zona:', error);
      toast.error(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setGuardando(false);
    }
  };

  /**
   * Eliminar zona
   */
  const eliminarZona = async (zona: Zona) => {
    const confirmar = window.confirm(
      `¿Estás seguro de que deseas eliminar la zona "${zona.nombre}"?\n\n` +
      `Esto desactivará ${zona.configuraciones.length} configuraciones de vendedores.`
    );

    if (!confirmar) return;

    try {
      const response = await fetch(`/api/proximity/zones?id=${zona.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`Zona "${zona.nombre}" eliminada exitosamente`);
        await cargarZonas(); // Recargar lista
      } else {
        throw new Error(data.error || 'Error al eliminar zona');
      }
    } catch (error) {
      console.error('Error eliminando zona:', error);
      toast.error(error instanceof Error ? error.message : 'Error desconocido');
    }
  };

  /**
   * Obtener ubicación actual del usuario
   */
  const obtenerUbicacionActual = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocalización no disponible en tu navegador');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData(prev => ({
          ...prev,
          latitud: position.coords.latitude.toFixed(6),
          longitud: position.coords.longitude.toFixed(6),
        }));
        toast.success('Ubicación actual obtenida');
      },
      (error) => {
        console.error('Error obteniendo ubicación:', error);
        toast.error('Error al obtener ubicación actual');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      }
    );
  };

  /**
   * Renderizar tipo de zona con icono
   */
  const renderTipoZona = (tipo: string) => {
    const tipos = {
      showroom: { label: 'Showroom', color: 'bg-blue-100 text-blue-800' },
      test_drive: { label: 'Test Drive', color: 'bg-green-100 text-green-800' },
      estacionamiento: { label: 'Estacionamiento', color: 'bg-gray-100 text-gray-800' },
      oficina: { label: 'Oficina', color: 'bg-purple-100 text-purple-800' },
      custom: { label: 'Personalizada', color: 'bg-orange-100 text-orange-800' },
    };

    const config = tipos[tipo as keyof typeof tipos] || tipos.custom;
    
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  if (cargando) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="w-8 h-8 animate-spin mr-3" />
          <span>Cargando zonas de proximidad...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {error}
            <Button
              variant="ghost"
              size="sm"
              className="ml-2 h-6 px-2 text-red-600 hover:text-red-700"
              onClick={() => setError(null)}
            >
              ✕
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Zonas</h2>
          <p className="text-gray-600">
            Configura las zonas geográficas para activación automática de grabación
          </p>
        </div>

        <Dialog open={dialogoAbierto} onOpenChange={setDialogoAbierto}>
          <DialogTrigger asChild>
            <Button onClick={abrirDialogoNuevo} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Nueva Zona
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {zonaEditando ? 'Editar Zona' : 'Nueva Zona de Proximidad'}
              </DialogTitle>
              <DialogDescription>
                Configura una zona geográfica donde se activará automáticamente la grabación
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Información básica */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nombre">Nombre de la Zona *</Label>
                    <Input
                      id="nombre"
                      value={formData.nombre}
                      onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                      placeholder="Ej: Showroom Principal"
                    />
                  </div>

                  <div>
                    <Label htmlFor="tipo">Tipo de Zona</Label>
                    <Select 
                      value={formData.tipo} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, tipo: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="showroom">Showroom</SelectItem>
                        <SelectItem value="test_drive">Área Test Drive</SelectItem>
                        <SelectItem value="estacionamiento">Estacionamiento</SelectItem>
                        <SelectItem value="oficina">Oficina</SelectItem>
                        <SelectItem value="custom">Personalizada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="descripcion">Descripción</Label>
                  <Textarea
                    id="descripcion"
                    value={formData.descripcion}
                    onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                    placeholder="Descripción opcional de la zona..."
                    rows={2}
                  />
                </div>
              </div>

              {/* Coordenadas */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-lg font-semibold">Ubicación</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={obtenerUbicacionActual}
                    className="flex items-center gap-2"
                  >
                    <Target className="w-4 h-4" />
                    Mi Ubicación
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="latitud">Latitud *</Label>
                    <Input
                      id="latitud"
                      type="number"
                      step="0.000001"
                      value={formData.latitud}
                      onChange={(e) => setFormData(prev => ({ ...prev, latitud: e.target.value }))}
                      placeholder="Ej: 19.432608"
                    />
                  </div>

                  <div>
                    <Label htmlFor="longitud">Longitud *</Label>
                    <Input
                      id="longitud"
                      type="number"
                      step="0.000001"
                      value={formData.longitud}
                      onChange={(e) => setFormData(prev => ({ ...prev, longitud: e.target.value }))}
                      placeholder="Ej: -99.133209"
                    />
                  </div>

                  <div>
                    <Label htmlFor="radio">Radio (metros)</Label>
                    <Input
                      id="radio"
                      type="number"
                      min="10"
                      max="1000"
                      value={formData.radioMetros}
                      onChange={(e) => setFormData(prev => ({ ...prev, radioMetros: parseInt(e.target.value) }))}
                    />
                  </div>
                </div>
              </div>

              {/* Configuración de grabación */}
              <div className="space-y-4">
                <Label className="text-lg font-semibold">Configuración de Grabación</Label>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <Label>Activar grabación</Label>
                    <Switch
                      checked={formData.activarGrabacion}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, activarGrabacion: checked }))}
                    />
                  </div>

                  <div>
                    <Label>Tipo de grabación</Label>
                    <Select 
                      value={formData.tipoGrabacion} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, tipoGrabacion: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="automatica">Automática</SelectItem>
                        <SelectItem value="confirmacion">Con confirmación</SelectItem>
                        <SelectItem value="manual">Manual únicamente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Duración máxima (segundos)</Label>
                    <Input
                      type="number"
                      min="60"
                      max="14400"
                      value={formData.duracionMaxima}
                      onChange={(e) => setFormData(prev => ({ ...prev, duracionMaxima: parseInt(e.target.value) }))}
                    />
                  </div>

                  <div>
                    <Label>Calidad de grabación</Label>
                    <Select 
                      value={formData.calidadGrabacion} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, calidadGrabacion: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="baja">Baja</SelectItem>
                        <SelectItem value="media">Media</SelectItem>
                        <SelectItem value="alta">Alta</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center justify-between">
                    <Label>Notificar entrada</Label>
                    <Switch
                      checked={formData.notificarEntrada}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, notificarEntrada: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Notificar salida</Label>
                    <Switch
                      checked={formData.notificarSalida}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, notificarSalida: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Notificar gerente</Label>
                    <Switch
                      checked={formData.notificarGerente}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, notificarGerente: checked }))}
                    />
                  </div>
                </div>
              </div>

              {/* Observaciones */}
              <div>
                <Label htmlFor="observaciones">Observaciones</Label>
                <Textarea
                  id="observaciones"
                  value={formData.observaciones}
                  onChange={(e) => setFormData(prev => ({ ...prev, observaciones: e.target.value }))}
                  placeholder="Notas adicionales sobre esta zona..."
                  rows={2}
                />
              </div>

              {/* Botones */}
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setDialogoAbierto(false)}
                  disabled={guardando}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={guardarZona}
                  disabled={guardando}
                  className="flex items-center gap-2"
                >
                  {guardando && <Loader2 className="w-4 h-4 animate-spin" />}
                  {guardando ? 'Guardando...' : (zonaEditando ? 'Actualizar' : 'Crear Zona')}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de zonas */}
      {zonas.length === 0 ? (
        <Card>
          <CardContent className="text-center p-8">
            <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">No hay zonas de proximidad configuradas</p>
            <p className="text-sm text-gray-500 mb-4">
              Crea tu primera zona para comenzar con la grabación automática por proximidad
            </p>
            <Button onClick={abrirDialogoNuevo} className="flex items-center gap-2 mx-auto">
              <Plus className="w-4 h-4" />
              Crear Primera Zona
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {zonas.map((zona) => (
              <motion.div
                key={zona.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{zona.nombre}</CardTitle>
                        {zona.descripcion && (
                          <CardDescription className="mt-1">
                            {zona.descripcion}
                          </CardDescription>
                        )}
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => abrirDialogoEditar(zona)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => eliminarZona(zona)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      {renderTipoZona(zona.tipo)}
                      <Badge variant={zona.activo ? 'default' : 'secondary'}>
                        {zona.activo ? 'Activa' : 'Inactiva'}
                      </Badge>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <span className="font-mono">
                          {zona.latitud.toFixed(4)}, {zona.longitud.toFixed(4)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-gray-500" />
                        <span>Radio: {zona.radioMetros}m</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-500" />
                        <span>{zona.configuraciones.length} vendedores activos</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-gray-500" />
                        <span>{zona._count.grabaciones} grabaciones realizadas</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

