
'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Mic, 
  MicOff, 
  Play, 
  Pause, 
  Square, 
  Upload,
  Download,
  Trash2,
  Clock,
  FileAudio,
  AlertCircle,
  CheckCircle,
  Loader2,
  User,
  Phone,
  Calendar,
  DollarSign
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Prospecto {
  id: number;
  nombre: string;
  apellido?: string;
  telefono?: string;
  vehiculo?: {
    descripcion: string;
  };
  estatus: string;
  clasificacion?: string;
  presupuesto?: number;
}

interface Grabacion {
  id: number;
  prospectoId: number;
  tipoLlamada: string;
  duracion: number;
  rutaArchivo?: string;
  transcripcion?: string;
  analisisIA?: string;
  scoreConversacion?: number;
  calidad: string;
  procesado: boolean;
  fechaGrabacion: string;
  observacionesVendedor?: string;
  prospecto: {
    nombre: string;
    apellido?: string;
    vehiculoInteres?: string;
    clasificacion?: string;
  };
  vendedor: {
    nombre: string;
    apellido?: string;
  };
}

const TIPOS_LLAMADA = [
  { value: 'prospectacion', label: 'Prospectación', icon: Phone },
  { value: 'seguimiento', label: 'Seguimiento', icon: Calendar },
  { value: 'cierre', label: 'Cierre de Venta', icon: DollarSign },
  { value: 'postventa', label: 'Post-venta', icon: CheckCircle },
  { value: 'visita_presencial', label: 'Visita Presencial', icon: User },
];

const CALIDAD_LABELS = {
  'EXCELENTE': { label: 'Excelente', color: 'bg-green-100 text-green-800' },
  'BUENA': { label: 'Buena', color: 'bg-blue-100 text-blue-800' },
  'REGULAR': { label: 'Regular', color: 'bg-yellow-100 text-yellow-800' },
  'MALA': { label: 'Mala', color: 'bg-red-100 text-red-800' },
};

export default function GrabacionProspectos() {
  const { data: session } = useSession();
  const [prospectos, setProspectos] = useState<Prospecto[]>([]);
  const [grabaciones, setGrabaciones] = useState<Grabacion[]>([]);
  const [selectedProspecto, setSelectedProspecto] = useState<number | null>(null);
  const [tipoLlamada, setTipoLlamada] = useState('prospectacion');
  const [observaciones, setObservaciones] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingProspectos, setLoadingProspectos] = useState(true);
  const [loadingGrabaciones, setLoadingGrabaciones] = useState(true);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Cargar prospectos del vendedor
  const fetchProspectos = async () => {
    try {
      setLoadingProspectos(true);
      const response = await fetch(`/api/prospectos?vendedorId=${session?.user?.id}&limite=50`);
      if (!response.ok) throw new Error('Error al cargar prospectos');

      const data = await response.json();
      setProspectos(data.prospectos || []);
    } catch (error) {
      console.error('Error fetching prospectos:', error);
      toast.error('Error al cargar los prospectos');
    } finally {
      setLoadingProspectos(false);
    }
  };

  // Cargar grabaciones
  const fetchGrabaciones = async () => {
    try {
      setLoadingGrabaciones(true);
      const response = await fetch(`/api/grabaciones?vendedorId=${session?.user?.id}&limit=20`);
      if (!response.ok) throw new Error('Error al cargar grabaciones');

      const data = await response.json();
      setGrabaciones(data.grabaciones || []);
    } catch (error) {
      console.error('Error fetching grabaciones:', error);
      toast.error('Error al cargar las grabaciones');
    } finally {
      setLoadingGrabaciones(false);
    }
  };

  useEffect(() => {
    if (session?.user?.id) {
      fetchProspectos();
      fetchGrabaciones();
    }
  }, [session?.user?.id]);

  // Timer para grabación
  useEffect(() => {
    if (isRecording && !isPaused) {
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording, isPaused]);

  // Iniciar grabación
  const startRecording = async () => {
    if (!selectedProspecto) {
      toast.error('Selecciona un prospecto primero');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(1000); // Capturar datos cada segundo
      setIsRecording(true);
      setIsPaused(false);
      setRecordingTime(0);
      toast.success('Grabación iniciada');
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Error al acceder al micrófono');
    }
  };

  // Pausar/reanudar grabación
  const togglePauseRecording = () => {
    if (mediaRecorderRef.current) {
      if (isPaused) {
        mediaRecorderRef.current.resume();
        setIsPaused(false);
        toast.success('Grabación reanudada');
      } else {
        mediaRecorderRef.current.pause();
        setIsPaused(true);
        toast.success('Grabación pausada');
      }
    }
  };

  // Detener grabación
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      toast.success('Grabación finalizada');
    }
  };

  // Guardar grabación
  const saveRecording = async () => {
    if (!audioBlob || !selectedProspecto) {
      toast.error('No hay grabación para guardar');
      return;
    }

    try {
      setLoading(true);

      // Crear FormData para enviar el archivo
      const formData = new FormData();
      formData.append('audio', audioBlob, `grabacion_${Date.now()}.webm`);
      formData.append('prospectoId', selectedProspecto.toString());
      formData.append('tipoLlamada', tipoLlamada);
      formData.append('duracion', recordingTime.toString());
      formData.append('observacionesVendedor', observaciones);
      formData.append('tamanoArchivo', audioBlob.size.toString());
      formData.append('formatoAudio', 'webm');
      formData.append('dispositivoGrabacion', 'web');

      // Primero subir el archivo (esto debería ir a Supabase Storage)
      // Por ahora simulamos la URL
      const rutaArchivo = `grabaciones/${session?.user?.id}/${Date.now()}.webm`;

      // Crear registro en base de datos
      const response = await fetch('/api/grabaciones', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prospectoId: selectedProspecto,
          tipoLlamada,
          duracion: recordingTime,
          rutaArchivo,
          observacionesVendedor: observaciones,
          tamanoArchivo: audioBlob.size,
          formatoAudio: 'webm',
          dispositivoGrabacion: 'web',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al guardar grabación');
      }

      const data = await response.json();
      toast.success('Grabación guardada exitosamente');

      // Limpiar formulario
      setAudioBlob(null);
      setSelectedProspecto(null);
      setObservaciones('');
      setRecordingTime(0);
      
      // Recargar grabaciones
      fetchGrabaciones();

    } catch (error) {
      console.error('Error saving recording:', error);
      toast.error(error instanceof Error ? error.message : 'Error al guardar la grabación');
    } finally {
      setLoading(false);
    }
  };

  // Reproducir audio
  const playAudio = (audioBlob: Blob) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    audio.play().catch(error => {
      console.error('Error playing audio:', error);
      toast.error('Error al reproducir audio');
    });

    audio.onended = () => {
      URL.revokeObjectURL(audioUrl);
    };
  };

  // Descargar grabación
  const downloadRecording = (audioBlob: Blob, filename: string) => {
    const url = URL.createObjectURL(audioBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Eliminar grabación
  const deleteGrabacion = async (grabacionId: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta grabación?')) return;

    try {
      const response = await fetch(`/api/grabaciones?id=${grabacionId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Error al eliminar grabación');

      toast.success('Grabación eliminada exitosamente');
      fetchGrabaciones();
    } catch (error) {
      console.error('Error deleting grabacion:', error);
      toast.error('Error al eliminar la grabación');
    }
  };

  // Formatear tiempo
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Formatear duración en minutos
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const remainingSecs = seconds % 60;
    return mins > 0 ? `${mins}m ${remainingSecs}s` : `${remainingSecs}s`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Grabación de Conversaciones</h2>
        <p className="text-gray-600">
          Graba y analiza tus conversaciones con prospectos para mejorar tu técnica de ventas
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel de Grabación */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Mic className="h-5 w-5 mr-2" />
              Nueva Grabación
            </CardTitle>
            <CardDescription>
              Selecciona un prospecto y comienza a grabar tu conversación
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Selección de prospecto */}
            <div>
              <Label htmlFor="prospecto">Prospecto</Label>
              {loadingProspectos ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Cargando prospectos...
                </div>
              ) : (
                <Select 
                  value={selectedProspecto?.toString() || ''} 
                  onValueChange={(value) => setSelectedProspecto(parseInt(value))}
                  disabled={isRecording}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un prospecto" />
                  </SelectTrigger>
                  <SelectContent>
                    {prospectos.map((prospecto) => (
                      <SelectItem key={prospecto.id} value={prospecto.id.toString()}>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {prospecto.nombre} {prospecto.apellido}
                          </span>
                          <span className="text-sm text-gray-500">
                            {prospecto.vehiculo?.descripcion || prospecto.telefono}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Tipo de llamada */}
            <div>
              <Label htmlFor="tipoLlamada">Tipo de Conversación</Label>
              <Select 
                value={tipoLlamada} 
                onValueChange={setTipoLlamada}
                disabled={isRecording}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_LLAMADA.map((tipo) => (
                    <SelectItem key={tipo.value} value={tipo.value}>
                      <div className="flex items-center">
                        <tipo.icon className="h-4 w-4 mr-2" />
                        {tipo.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Estado de grabación */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Estado:</span>
                <Badge variant={isRecording ? (isPaused ? 'secondary' : 'destructive') : 'outline'}>
                  {isRecording ? (isPaused ? 'Pausada' : 'Grabando') : 'Detenida'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Tiempo:</span>
                <span className="text-lg font-mono">{formatTime(recordingTime)}</span>
              </div>
            </div>

            {/* Controles de grabación */}
            <div className="flex space-x-2">
              {!isRecording ? (
                <Button 
                  onClick={startRecording}
                  disabled={!selectedProspecto}
                  className="flex-1"
                >
                  <Mic className="h-4 w-4 mr-2" />
                  Iniciar Grabación
                </Button>
              ) : (
                <>
                  <Button 
                    onClick={togglePauseRecording}
                    variant="outline"
                    className="flex-1"
                  >
                    {isPaused ? (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Reanudar
                      </>
                    ) : (
                      <>
                        <Pause className="h-4 w-4 mr-2" />
                        Pausar
                      </>
                    )}
                  </Button>
                  <Button 
                    onClick={stopRecording}
                    variant="destructive"
                    className="flex-1"
                  >
                    <Square className="h-4 w-4 mr-2" />
                    Detener
                  </Button>
                </>
              )}
            </div>

            {/* Observaciones */}
            <div>
              <Label htmlFor="observaciones">Observaciones</Label>
              <Textarea
                id="observaciones"
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Notas sobre la conversación..."
                rows={3}
                disabled={isRecording}
              />
            </div>

            {/* Reproducir y guardar */}
            {audioBlob && (
              <div className="space-y-2">
                <div className="flex space-x-2">
                  <Button 
                    onClick={() => playAudio(audioBlob)}
                    variant="outline"
                    className="flex-1"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Reproducir
                  </Button>
                  <Button 
                    onClick={() => downloadRecording(audioBlob, `grabacion_${Date.now()}.webm`)}
                    variant="outline"
                    className="flex-1"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Descargar
                  </Button>
                </div>
                <Button 
                  onClick={saveRecording}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Guardar Grabación
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Historial de Grabaciones */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileAudio className="h-5 w-5 mr-2" />
              Grabaciones Recientes
            </CardTitle>
            <CardDescription>
              Tus últimas grabaciones y su estado de procesamiento
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingGrabaciones ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                Cargando grabaciones...
              </div>
            ) : grabaciones.length === 0 ? (
              <div className="text-center p-8">
                <FileAudio className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No hay grabaciones
                </h3>
                <p className="text-gray-600">
                  Comienza grabando tu primera conversación con un prospecto
                </p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {grabaciones.map((grabacion) => {
                  const calidad = CALIDAD_LABELS[grabacion.calidad as keyof typeof CALIDAD_LABELS];
                  const tipoLlamada = TIPOS_LLAMADA.find(t => t.value === grabacion.tipoLlamada);

                  return (
                    <div key={grabacion.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h4 className="font-medium">
                            {grabacion.prospecto.nombre} {grabacion.prospecto.apellido}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {grabacion.prospecto.vehiculoInteres || 'Sin vehículo especificado'}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteGrabacion(grabacion.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-3">
                        {tipoLlamada && (
                          <Badge variant="outline" className="flex items-center">
                            <tipoLlamada.icon className="h-3 w-3 mr-1" />
                            {tipoLlamada.label}
                          </Badge>
                        )}
                        {calidad && (
                          <Badge className={calidad.color}>
                            {calidad.label}
                          </Badge>
                        )}
                        <Badge variant={grabacion.procesado ? 'default' : 'secondary'}>
                          {grabacion.procesado ? (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Procesado
                            </>
                          ) : (
                            <>
                              <Clock className="h-3 w-3 mr-1" />
                              Pendiente
                            </>
                          )}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {formatDuration(grabacion.duracion)}
                        </div>
                        <div>
                          {new Date(grabacion.fechaGrabacion).toLocaleDateString()}
                        </div>
                      </div>

                      {grabacion.scoreConversacion && (
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>Score de Conversación:</span>
                            <span className="font-medium">{grabacion.scoreConversacion}/100</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${grabacion.scoreConversacion}%` }}
                            ></div>
                          </div>
                        </div>
                      )}

                      {grabacion.observacionesVendedor && (
                        <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                          <strong>Observaciones:</strong> {grabacion.observacionesVendedor}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
