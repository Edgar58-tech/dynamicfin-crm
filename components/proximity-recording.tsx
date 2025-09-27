

/**
 * Componente principal para grabación por proximidad
 * Integra Geolocation API, detección de zonas y grabación automática
 */

'use client';
// Force GitHub sync - deployment fix
import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  MapPin,
  Mic,
  MicOff,
  Settings,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  Zap,
  Bell,
  BellOff,
  Smartphone,
  Wifi,
  WifiOff,
  Battery,
  Navigation,
  Volume2,
  VolumeX,
  Play,
  Square,
  Loader2,
  MapIcon,
  Target,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { AudioRecorder, getOptimalSettings } from '@/lib/audio-utils';

interface ProximityRecordingProps {
  onRecordingStart?: (data: any) => void;
  onRecordingEnd?: (data: any) => void;
  onLocationUpdate?: (location: any) => void;
}

interface ZonaProximidad {
  id: number;
  nombre: string;
  descripcion?: string;
  tipo: string;
  latitud: number;
  longitud: number;
  radioMetros: number;
  activo: boolean;
  distanciaMetros?: number;
}

interface ConfiguracionProximidad {
  id?: number;
  sistemaActivo: boolean;
  modoFuncionamiento: string;
  precisonGPS: string;
  intervaloDeteccion: number;
  inicioAutomatico: boolean;
  confirmarAntes: boolean;
  grabarEnBackground: boolean;
  notificacionesSonido: boolean;
  notificacionesVibrar: boolean;
  calidadAudio: string;
  compresionAudio: string;
  cancelarRuido: boolean;
  compartirUbicacion: boolean;
  almacenarUbicaciones: boolean;
}

interface GrabacionProximidad {
  id: number;
  zona?: {
    nombre: string;
    tipo: string;
  };
  horaInicio: string;
  tiempoTranscurrido?: number;
  estadoGrabacion: string;
}

interface UbicacionActual {
  latitud: number;
  longitud: number;
  precision: number;
  timestamp: Date;
  proveedor: string;
}

export default function ProximityRecording({
  onRecordingStart,
  onRecordingEnd,
  onLocationUpdate,
}: ProximityRecordingProps) {
  const { data: session } = useSession();
  
  // Estados principales
  const [sistemaActivo, setSistemaActivo] = useState(false);
  const [configuracion, setConfiguracion] = useState<ConfiguracionProximidad | null>(null);
  const [zonas, setZonas] = useState<ZonaProximidad[]>([]);
  const [ubicacionActual, setUbicacionActual] = useState<UbicacionActual | null>(null);
  const [grabacionActiva, setGrabacionActiva] = useState<GrabacionProximidad | null>(null);
  
  // Estados de UI
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permisoUbicacion, setPermisoUbicacion] = useState<string>('unknown');
  const [estadoConexion, setEstadoConexion] = useState<string>('online');
  const [nivelBateria, setNivelBateria] = useState<number | null>(null);
  
  // Estados de grabación
  const [audioRecorder, setAudioRecorder] = useState<AudioRecorder | null>(null);
  const [grabando, setGrabando] = useState(false);
  const [tiempoGrabacion, setTiempoGrabacion] = useState(0);
  
  // Referencias
  const watchId = useRef<number | null>(null);
  const intervalosRef = useRef<{[key: string]: ReturnType<typeof setInterval>}>({});
  const notificacionesRef = useRef<any[]>([]);

  /**
   * Inicialización del componente
   */
  useEffect(() => {
    if (session?.user?.rol === 'VENDEDOR') {
      inicializarSistema();
    }

    return () => {
      limpiarRecursos();
    };
  }, [session]);

  /**
   * Inicializar sistema de proximidad
   */
  const inicializarSistema = async () => {
    setCargando(true);
    try {
      await Promise.all([
        cargarConfiguracion(),
        cargarZonas(),
        verificarPermisos(),
        inicializarDeteccionUbicacion(),
      ]);
    } catch (error) {
      console.error('Error inicializando sistema de proximidad:', error);
      setError('Error al inicializar el sistema de proximidad');
    } finally {
      setCargando(false);
    }
  };

  /**
   * Cargar configuración del vendedor
   */
  const cargarConfiguracion = async () => {
    try {
      const response = await fetch('/api/proximity/configure');
      const data = await response.json();
      
      if (response.ok && data.configuraciones?.length > 0) {
        const configPrincipal = data.configuraciones.find((c: any) => !c.zonaProximidadId) || data.configuraciones[0];
        setConfiguracion(configPrincipal);
        setSistemaActivo(configPrincipal.sistemaActivo);
      } else {
        // Crear configuración por defecto
        await crearConfiguracionPorDefecto();
      }
    } catch (error) {
      console.error('Error cargando configuración:', error);
    }
  };

  /**
   * Cargar zonas de proximidad de la agencia
   */
  const cargarZonas = async () => {
    try {
      const response = await fetch('/api/proximity/zones?activo=true');
      const data = await response.json();
      
      if (response.ok) {
        setZonas(data.zonas || []);
      }
    } catch (error) {
      console.error('Error cargando zonas:', error);
    }
  };

  /**
   * Verificar permisos del navegador
   */
  const verificarPermisos = async () => {
    try {
      // Verificar geolocalización
      if ('geolocation' in navigator) {
        const permission = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
        setPermisoUbicacion(permission.state);
        
        permission.addEventListener('change', () => {
          setPermisoUbicacion(permission.state);
        });
      } else {
        setPermisoUbicacion('denied');
        setError('Tu navegador no soporta geolocalización');
      }

      // Verificar estado de conexión
      if ('onLine' in navigator) {
        setEstadoConexion(navigator.onLine ? 'online' : 'offline');
        
        window.addEventListener('online', () => setEstadoConexion('online'));
        window.addEventListener('offline', () => setEstadoConexion('offline'));
      }

      // Verificar nivel de batería (si está disponible)
      if ('getBattery' in navigator) {
        try {
          const battery = await (navigator as any).getBattery();
          setNivelBateria(Math.round(battery.level * 100));
          
          battery.addEventListener('levelchange', () => {
            setNivelBateria(Math.round(battery.level * 100));
          });
        } catch (e) {
          // Battery API no disponible
        }
      }
    } catch (error) {
      console.error('Error verificando permisos:', error);
    }
  };

  /**
   * Inicializar detección de ubicación
   */
  const inicializarDeteccionUbicacion = () => {
    if (!navigator.geolocation) return;

    const opciones: PositionOptions = {
      enableHighAccuracy: configuracion?.precisonGPS === 'alta',
      timeout: 10000,
      maximumAge: 5000,
    };

    watchId.current = navigator.geolocation.watchPosition(
      manejarUbicacion,
      manejarErrorUbicacion,
      opciones
    );
  };

  /**
   * Manejar actualización de ubicación
   */
  const manejarUbicacion = useCallback((position: GeolocationPosition) => {
    const nuevaUbicacion: UbicacionActual = {
      latitud: position.coords.latitude,
      longitud: position.coords.longitude,
      precision: position.coords.accuracy,
      timestamp: new Date(),
      proveedor: 'gps',
    };

    setUbicacionActual(nuevaUbicacion);
    
    if (onLocationUpdate) {
      onLocationUpdate(nuevaUbicacion);
    }

    // Verificar proximidad a zonas solo si el sistema está activo
    if (sistemaActivo && configuracion?.sistemaActivo) {
      verificarProximidadZonas(nuevaUbicacion);
    }

    // Registrar evento de ubicación
    registrarEventoProximidad('deteccion_ubicacion', nuevaUbicacion);
  }, [sistemaActivo, configuracion, onLocationUpdate]);

  /**
   * Manejar errores de ubicación
   */
  const manejarErrorUbicacion = (error: GeolocationPositionError) => {
    let mensaje = 'Error de ubicación: ';
    
    switch (error.code) {
      case error.PERMISSION_DENIED:
        mensaje += 'Permisos de ubicación denegados';
        setPermisoUbicacion('denied');
        break;
      case error.POSITION_UNAVAILABLE:
        mensaje += 'Ubicación no disponible';
        break;
      case error.TIMEOUT:
        mensaje += 'Tiempo de espera agotado';
        break;
      default:
        mensaje += 'Error desconocido';
        break;
    }

    console.error('Error de geolocalización:', error);
    setError(mensaje);

    // Registrar error
    registrarEventoProximidad('error_gps', null, {
      codigo: error.code,
      mensaje: error.message,
    });
  };

  /**
   * Verificar proximidad a zonas
   */
  const verificarProximidadZonas = (ubicacion: UbicacionActual) => {
    if (!zonas.length) return;

    const zonasConDistancia = zonas.map(zona => ({
      ...zona,
      distanciaMetros: calcularDistancia(
        ubicacion.latitud,
        ubicacion.longitud,
        zona.latitud,
        zona.longitud
      ),
    })).sort((a, b) => a.distanciaMetros - b.distanciaMetros);

    const zonaCercana = zonasConDistancia[0];
    
    if (zonaCercana.distanciaMetros <= zonaCercana.radioMetros) {
      // Estamos dentro de una zona
      manejarEntradaZona(zonaCercana, ubicacion);
    } else if (grabacionActiva) {
      // Estamos grabando pero salimos de la zona
      manejarSalidaZona(ubicacion);
    }

    // Actualizar zonas con distancias para la UI
    setZonas(zonasConDistancia);
  };

  /**
   * Calcular distancia entre dos puntos (Haversine)
   */
  const calcularDistancia = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371000; // Radio de la Tierra en metros
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  /**
   * Manejar entrada a zona de proximidad
   */
  const manejarEntradaZona = async (zona: ZonaProximidad, ubicacion: UbicacionActual) => {
    if (grabacionActiva) return; // Ya estamos grabando

    try {
      mostrarNotificacion(`Zona detectada: ${zona.nombre}`, {
        icon: 'success',
        action: configuracion?.confirmarAntes ? 'confirm' : 'auto',
      });

      if (configuracion?.inicioAutomatico && !configuracion?.confirmarAntes) {
        await iniciarGrabacionProximidad(zona, ubicacion);
      } else if (configuracion?.confirmarAntes) {
        // Mostrar confirmación
        const confirmar = await mostrarConfirmacion(
          `¿Iniciar grabación en ${zona.nombre}?`,
          `Estás a ${Math.round(zona.distanciaMetros || 0)} metros del ${zona.tipo}`
        );
        
        if (confirmar) {
          await iniciarGrabacionProximidad(zona, ubicacion);
        }
      }
    } catch (error) {
      console.error('Error al manejar entrada a zona:', error);
      setError('Error al activar grabación por proximidad');
    }
  };

  /**
   * Manejar salida de zona de proximidad
   */
  const manejarSalidaZona = async (ubicacion: UbicacionActual) => {
    if (!grabacionActiva) return;

    try {
      await finalizarGrabacionProximidad(ubicacion);
      
      mostrarNotificacion('Grabación finalizada', {
        icon: 'info',
        message: `Saliste de la zona ${grabacionActiva.zona?.nombre}`,
      });
    } catch (error) {
      console.error('Error al manejar salida de zona:', error);
      setError('Error al finalizar grabación por proximidad');
    }
  };

  /**
   * Iniciar grabación por proximidad
   */
  const iniciarGrabacionProximidad = async (zona: ZonaProximidad, ubicacion: UbicacionActual) => {
    try {
      setCargando(true);

      // Crear grabación por proximidad
      const response = await fetch('/api/proximity/auto-record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitud: ubicacion.latitud,
          longitud: ubicacion.longitud,
          precision: ubicacion.precision,
          tipoActivacion: configuracion?.confirmarAntes ? 'confirmacion' : 'automatica',
          contextoDetectado: zona.tipo,
          dispositivoDeteccion: 'web',
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setGrabacionActiva({
          id: data.grabacionProximidad.id,
          zona: data.grabacionProximidad.zona,
          horaInicio: new Date().toISOString(),
          estadoGrabacion: 'en_curso',
        });

        // Iniciar grabación de audio real
        await iniciarGrabacionAudio();

        // Iniciar contador de tiempo
        iniciarContadorTiempo();

        if (onRecordingStart) {
          onRecordingStart(data.grabacionProximidad);
        }

        toast.success(`🎙️ Grabación iniciada en ${zona.nombre}`);
      } else {
        throw new Error(data.error || 'Error al iniciar grabación');
      }
    } catch (error) {
      console.error('Error iniciando grabación por proximidad:', error);
      setError('Error al iniciar grabación automática');
    } finally {
      setCargando(false);
    }
  };

  /**
   * Finalizar grabación por proximidad
   */
  const finalizarGrabacionProximidad = async (ubicacion: UbicacionActual) => {
    if (!grabacionActiva) return;

    try {
      setCargando(true);

      // Finalizar grabación de audio
      const resultadoAudio = await finalizarGrabacionAudio();

      // Actualizar grabación por proximidad
      const response = await fetch('/api/proximity/auto-record', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grabacionProximidadId: grabacionActiva.id,
          latitud: ubicacion.latitud,
          longitud: ubicacion.longitud,
          precision: ubicacion.precision,
          grabacionConversacionId: resultadoAudio?.grabacionId,
          motivoFinalizacion: 'salida_zona',
          calidadDetectada: resultadoAudio?.metadata?.quality,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        if (onRecordingEnd) {
          onRecordingEnd({
            ...data.grabacionProximidad,
            audioResult: resultadoAudio,
          });
        }

        detenerContadorTiempo();
        setGrabacionActiva(null);
        setTiempoGrabacion(0);

        toast.success('✅ Grabación por proximidad completada');
      } else {
        throw new Error(data.error || 'Error al finalizar grabación');
      }
    } catch (error) {
      console.error('Error finalizando grabación por proximidad:', error);
      setError('Error al finalizar grabación automática');
    } finally {
      setCargando(false);
    }
  };

  /**
   * Iniciar grabación de audio real
   */
  const iniciarGrabacionAudio = async () => {
    try {
      const settings = getOptimalSettings();
      // Aplicar configuración personalizada
      if (configuracion?.calidadAudio === 'alta') {
        settings.sampleRate = 48000;
        settings.bitsPerSecond = 256000;
      } else if (configuracion?.calidadAudio === 'baja') {
        settings.sampleRate = 16000;
        settings.bitsPerSecond = 32000;
      }

      const recorder = new AudioRecorder();
      await recorder.start();
      
      setAudioRecorder(recorder);
      setGrabando(true);
    } catch (error) {
      console.error('Error iniciando grabación de audio:', error);
      throw new Error('No se pudo acceder al micrófono');
    }
  };

  /**
   * Finalizar grabación de audio
   */
  const finalizarGrabacionAudio = async () => {
    if (!audioRecorder || !grabando) return null;

    try {
      const result = await audioRecorder.stop();      setGrabando(false);
      setAudioRecorder(null);

      // Aquí se integraría con el sistema de subida y procesamiento existente
      // Por simplicidad, retornamos el resultado del audio
      return {
        blob: result,
        metadata: {}, // Devolvemos metadata vacía ya que result no la contiene
        grabacionId: null, // Se obtendría del sistema de grabación principal
      };
    } catch (error) {
      console.error('Error finalizando grabación de audio:', error);
      throw error;
    }
  };

  /**
   * Iniciar contador de tiempo de grabación
   */
  const iniciarContadorTiempo = () => {
    intervalosRef.current.contadorTiempo = setInterval(() => {
      setTiempoGrabacion(prev => prev + 1);
    }, 1000);
  };

  /**
   * Detener contador de tiempo
   */
  const detenerContadorTiempo = () => {
    if (intervalosRef.current.contadorTiempo) {
      clearInterval(intervalosRef.current.contadorTiempo);
      delete intervalosRef.current.contadorTiempo;
    }
  };

  /**
   * Registrar evento de proximidad
   */
  const registrarEventoProximidad = async (
    tipoEvento: string, 
    ubicacion?: UbicacionActual | null,
    datosAdicionales?: any
  ) => {
    try {
      await fetch('/api/proximity/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipoEvento,
          latitud: ubicacion?.latitud,
          longitud: ubicacion?.longitud,
          precision: ubicacion?.precision,
          datosAdicionales,
          observaciones: `Evento ${tipoEvento} desde componente web`,
        }),
      });
    } catch (error) {
      console.error('Error registrando evento:', error);
    }
  };

  /**
   * Mostrar notificación
   */
  const mostrarNotificacion = (titulo: string, opciones: any = {}) => {
    if (!configuracion?.notificacionesSonido) return;

    // Notificación nativa del navegador
    if (Notification.permission === 'granted') {
      const notif = new Notification(titulo, {
        body: opciones.message || '',
        icon: '/favicon.ico',
        tag: 'proximity-recording',
      });

      notificacionesRef.current.push(notif);

      setTimeout(() => {
        notif.close();
      }, 5000);
    }

    // Toast en la interfaz
    const tipoIcon = opciones.icon || 'info';
    if (tipoIcon === 'success') {
      toast.success(titulo);
    } else if (tipoIcon === 'error') {
      toast.error(titulo);
    } else {
      toast(titulo);
    }
  };

  /**
   * Mostrar confirmación
   */
  const mostrarConfirmacion = async (titulo: string, mensaje: string): Promise<boolean> => {
    return window.confirm(`${titulo}\n\n${mensaje}`);
  };

  /**
   * Crear configuración por defecto
   */
  const crearConfiguracionPorDefecto = async () => {
    try {
      const configPorDefecto: Partial<ConfiguracionProximidad> = {
        sistemaActivo: true,
        modoFuncionamiento: 'automatico',
        precisonGPS: 'alta',
        intervaloDeteccion: 30,
        inicioAutomatico: true,
        confirmarAntes: false,
        grabarEnBackground: true,
        notificacionesSonido: true,
        notificacionesVibrar: true,
        calidadAudio: 'media',
        compresionAudio: 'media',
        cancelarRuido: true,
        compartirUbicacion: true,
        almacenarUbicaciones: true,
      };

      const response = await fetch('/api/proximity/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configPorDefecto),
      });

      if (response.ok) {
        const data = await response.json();
        setConfiguracion(data.configuracion);
        setSistemaActivo(data.configuracion.sistemaActivo);
      }
    } catch (error) {
      console.error('Error creando configuración por defecto:', error);
    }
  };

  /**
   * Actualizar configuración
   */
  const actualizarConfiguracion = async (nuevaConfig: Partial<ConfiguracionProximidad>) => {
    try {
      setCargando(true);

      const response = await fetch('/api/proximity/configure', {
        method: configuracion?.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...configuracion,
          ...nuevaConfig,
          id: configuracion?.id,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setConfiguracion(data.configuracion);
        setSistemaActivo(data.configuracion.sistemaActivo);
        toast.success('Configuración actualizada');
      } else {
        throw new Error('Error al actualizar configuración');
      }
    } catch (error) {
      console.error('Error actualizando configuración:', error);
      setError('Error al guardar configuración');
    } finally {
      setCargando(false);
    }
  };

  /**
   * Alternar sistema activo/inactivo
   */
  const alternarSistema = async () => {
    if (sistemaActivo && grabacionActiva) {
      const confirmar = await mostrarConfirmacion(
        'Sistema activo',
        'Tienes una grabación activa. ¿Deseas detener el sistema?'
      );
      
      if (!confirmar) return;
      
      // Finalizar grabación activa
      if (ubicacionActual) {
        await finalizarGrabacionProximidad(ubicacionActual);
      }
    }

    const nuevoEstado = !sistemaActivo;
    setSistemaActivo(nuevoEstado);
    
    await actualizarConfiguracion({
      sistemaActivo: nuevoEstado,
    });

    if (nuevoEstado) {
      inicializarDeteccionUbicacion();
      toast.success('🟢 Sistema de proximidad activado');
    } else {
      limpiarRecursos();
      toast.success('🔴 Sistema de proximidad desactivado');
    }
  };

  /**
   * Limpiar recursos
   */
  const limpiarRecursos = () => {
    // Detener detección de ubicación
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }

    // Limpiar intervalos
    Object.values(intervalosRef.current).forEach(interval => {
      clearInterval(interval);
    });
    intervalosRef.current = {};

    // Cerrar notificaciones
    notificacionesRef.current.forEach(notif => {
      notif.close();
    });
    notificacionesRef.current = [];

    // Limpiar grabación
    if (audioRecorder) {
      audioRecorder.cancelRecording();
      setAudioRecorder(null);
    }
    setGrabando(false);
  };

  /**
   * Formatear tiempo
   */
  const formatearTiempo = (segundos: number) => {
    const mins = Math.floor(segundos / 60);
    const secs = segundos % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  /**
   * Obtener estado de conexión
   */
  const obtenerEstadoConexion = () => {
    if (permisoUbicacion === 'denied') return 'sin_permisos';
    if (estadoConexion === 'offline') return 'sin_conexion';
    if (!ubicacionActual) return 'detectando';
    return 'conectado';
  };

  /**
   * Obtener color del estado
   */
  const obtenerColorEstado = () => {
    const estado = obtenerEstadoConexion();
    switch (estado) {
      case 'conectado': return 'text-green-600 bg-green-50 border-green-200';
      case 'detectando': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'sin_conexion': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'sin_permisos': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (cargando) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="w-8 h-8 animate-spin mr-3" />
          <span>Inicializando sistema de proximidad...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
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

      {/* Estado Principal del Sistema */}
      <Card className="overflow-hidden">
        <CardHeader className={`${grabacionActiva ? 'bg-gradient-to-r from-red-50 to-pink-50' : 'bg-gradient-to-r from-blue-50 to-indigo-50'} border-b`}>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg shadow-sm ${grabacionActiva ? 'bg-red-100' : 'bg-blue-100'}`}>
                {grabacionActiva ? (
                  <Mic className="w-6 h-6 text-red-600" />
                ) : (
                  <MapPin className="w-6 h-6 text-blue-600" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Grabación por Proximidad
                </h2>
                <p className={`text-sm font-medium ${grabacionActiva ? 'text-red-600' : 'text-blue-600'}`}>
                  {grabacionActiva ? `Grabando en ${grabacionActiva.zona?.nombre}` : 'Sistema de detección automática'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Estado de conexión */}
              <Badge className={`${obtenerColorEstado()} flex items-center gap-1`}>
                {obtenerEstadoConexion() === 'conectado' && <CheckCircle className="w-3 h-3" />}
                {obtenerEstadoConexion() === 'detectando' && <Loader2 className="w-3 h-3 animate-spin" />}
                {obtenerEstadoConexion() === 'sin_conexion' && <WifiOff className="w-3 h-3" />}
                {obtenerEstadoConexion() === 'sin_permisos' && <AlertTriangle className="w-3 h-3" />}
                {obtenerEstadoConexion()}
              </Badge>

              {/* Switch principal */}
              <div className="flex items-center gap-2">
                <Switch
                  checked={sistemaActivo}
                  onCheckedChange={alternarSistema}
                  disabled={cargando}
                />
                <span className="text-sm font-medium">
                  {sistemaActivo ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            </div>
          </CardTitle>
          <CardDescription className="text-gray-600">
            {grabacionActiva 
              ? `Grabando automáticamente desde ${formatearTiempo(tiempoGrabacion)}`
              : 'Detecta automáticamente cuando estás en zonas configuradas e inicia grabación'
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent className="p-6">
          {/* Panel de grabación activa */}
          {grabacionActiva && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                  <div>
                    <p className="font-semibold text-red-900">
                      Grabando en {grabacionActiva.zona?.nombre}
                    </p>
                    <p className="text-sm text-red-700">
                      Tiempo: {formatearTiempo(tiempoGrabacion)} • Tipo: {grabacionActiva.zona?.tipo}
                    </p>
                  </div>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => ubicacionActual && finalizarGrabacionProximidad(ubicacionActual)}
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  <Square className="w-4 h-4 mr-2" />
                  Finalizar
                </Button>
              </div>
            </motion.div>
          )}

          <Tabs defaultValue="estado" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="estado">Estado</TabsTrigger>
              <TabsTrigger value="zonas">Zonas</TabsTrigger>
              <TabsTrigger value="configuracion">Configuración</TabsTrigger>
              <TabsTrigger value="historial">Historial</TabsTrigger>
            </TabsList>

            {/* Tab Estado */}
            <TabsContent value="estado" className="space-y-4">
              {/* Información de ubicación actual */}
              {ubicacionActual && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Navigation className="w-5 h-5" />
                      Ubicación Actual
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Latitud</p>
                        <p className="font-mono text-sm">{ubicacionActual.latitud.toFixed(6)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Longitud</p>
                        <p className="font-mono text-sm">{ubicacionActual.longitud.toFixed(6)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Precisión</p>
                        <p className="font-mono text-sm">{Math.round(ubicacionActual.precision)}m</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Actualizado</p>
                        <p className="text-sm">{ubicacionActual.timestamp.toLocaleTimeString()}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Información del dispositivo */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="flex items-center gap-3 p-4">
                    {estadoConexion === 'online' ? (
                      <Wifi className="w-5 h-5 text-green-600" />
                    ) : (
                      <WifiOff className="w-5 h-5 text-red-600" />
                    )}
                    <div>
                      <p className="font-medium">Conexión</p>
                      <p className="text-sm text-gray-600 capitalize">{estadoConexion}</p>
                    </div>
                  </CardContent>
                </Card>

                {nivelBateria !== null && (
                  <Card>
                    <CardContent className="flex items-center gap-3 p-4">
                      <Battery className={`w-5 h-5 ${nivelBateria > 20 ? 'text-green-600' : 'text-red-600'}`} />
                      <div>
                        <p className="font-medium">Batería</p>
                        <p className="text-sm text-gray-600">{nivelBateria}%</p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardContent className="flex items-center gap-3 p-4">
                    {configuracion?.notificacionesSonido ? (
                      <Volume2 className="w-5 h-5 text-green-600" />
                    ) : (
                      <VolumeX className="w-5 h-5 text-gray-400" />
                    )}
                    <div>
                      <p className="font-medium">Notificaciones</p>
                      <p className="text-sm text-gray-600">
                        {configuracion?.notificacionesSonido ? 'Activadas' : 'Silenciadas'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Tab Zonas */}
            <TabsContent value="zonas" className="space-y-4">
              {zonas.length === 0 ? (
                <Card>
                  <CardContent className="text-center p-8">
                    <MapIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No hay zonas de proximidad configuradas</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Contacta a tu gerente para configurar zonas
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {zonas.map((zona) => (
                    <Card key={zona.id} className={`${zona.distanciaMetros && zona.distanciaMetros <= zona.radioMetros ? 'ring-2 ring-green-200 bg-green-50' : ''}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${zona.distanciaMetros && zona.distanciaMetros <= zona.radioMetros ? 'bg-green-100' : 'bg-gray-100'}`}>
                              <Target className={`w-4 h-4 ${zona.distanciaMetros && zona.distanciaMetros <= zona.radioMetros ? 'text-green-600' : 'text-gray-600'}`} />
                            </div>
                            <div>
                              <p className="font-medium">{zona.nombre}</p>
                              <p className="text-sm text-gray-600 capitalize">
                                {zona.tipo} • Radio: {zona.radioMetros}m
                              </p>
                            </div>
                          </div>
                          
                          {zona.distanciaMetros !== undefined && (
                            <Badge variant={zona.distanciaMetros <= zona.radioMetros ? 'default' : 'secondary'}>
                              {Math.round(zona.distanciaMetros)}m
                            </Badge>
                          )}
                        </div>
                        
                        {zona.descripcion && (
                          <p className="text-sm text-gray-600 mt-2">{zona.descripcion}</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Tab Configuración */}
            <TabsContent value="configuracion" className="space-y-4">
              {configuracion && (
                <div className="space-y-6">
                  {/* Configuración de detección */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Detección</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            Precisión GPS
                          </label>
                          <Select 
                            value={configuracion.precisonGPS}
                            onValueChange={(value) => actualizarConfiguracion({ precisonGPS: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="baja">Baja (menos batería)</SelectItem>
                              <SelectItem value="media">Media</SelectItem>
                              <SelectItem value="alta">Alta (más precisa)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            Intervalo de detección: {configuracion.intervaloDeteccion}s
                          </label>
                          <Slider
                            value={[configuracion.intervaloDeteccion]}
                            onValueChange={([value]) => actualizarConfiguracion({ intervaloDeteccion: value })}
                            min={10}
                            max={120}
                            step={10}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Configuración de grabación */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Grabación</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span>Inicio automático</span>
                          <Switch
                            checked={configuracion.inicioAutomatico}
                            onCheckedChange={(checked) => actualizarConfiguracion({ inicioAutomatico: checked })}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span>Confirmar antes de grabar</span>
                          <Switch
                            checked={configuracion.confirmarAntes}
                            onCheckedChange={(checked) => actualizarConfiguracion({ confirmarAntes: checked })}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span>Grabar en segundo plano</span>
                          <Switch
                            checked={configuracion.grabarEnBackground}
                            onCheckedChange={(checked) => actualizarConfiguracion({ grabarEnBackground: checked })}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            Calidad de audio
                          </label>
                          <Select 
                            value={configuracion.calidadAudio}
                            onValueChange={(value) => actualizarConfiguracion({ calidadAudio: value })}
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
                        
                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            Compresión
                          </label>
                          <Select 
                            value={configuracion.compresionAudio}
                            onValueChange={(value) => actualizarConfiguracion({ compresionAudio: value })}
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
                    </CardContent>
                  </Card>

                  {/* Configuración de notificaciones */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Notificaciones</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span>Sonidos</span>
                        <Switch
                          checked={configuracion.notificacionesSonido}
                          onCheckedChange={(checked) => actualizarConfiguracion({ notificacionesSonido: checked })}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span>Vibración</span>
                        <Switch
                          checked={configuracion.notificacionesVibrar}
                          onCheckedChange={(checked) => actualizarConfiguracion({ notificacionesVibrar: checked })}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            {/* Tab Historial */}
            <TabsContent value="historial">
              <Card>
                <CardContent className="text-center p-8">
                  <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Historial de grabaciones por proximidad</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Esta funcionalidad se implementará en la siguiente fase
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
