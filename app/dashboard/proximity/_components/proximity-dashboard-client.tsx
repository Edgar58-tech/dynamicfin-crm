
'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import {
  MapPin,
  Mic,
  MicOff,
  Play,
  Pause,
  Square,
  Download,
  Upload,
  Settings,
  AlertTriangle,
  CheckCircle,
  Clock,
  Volume2,
  Signal,
  Battery,
  Wifi,
  Target
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

interface RecordingSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  location: LocationData;
  duration: number;
  fileSize?: number;
  status: 'recording' | 'paused' | 'completed' | 'uploading' | 'uploaded';
}

interface ProximityZone {
  id: string;
  name: string;
  centerLat: number;
  centerLng: number;
  radius: number;
  isActive: boolean;
}

export default function ProximityDashboardClient() {
  const { data: session } = useSession();
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [recordingSessions, setRecordingSessions] = useState<RecordingSession[]>([]);
  const [currentSession, setCurrentSession] = useState<RecordingSession | null>(null);
  const [proximityZones, setProximityZones] = useState<ProximityZone[]>([]);
  const [autoRecording, setAutoRecording] = useState(false);
  const [recordingQuality, setRecordingQuality] = useState('high');
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'pending'>('pending');
  const [audioLevel, setAudioLevel] = useState(0);
  const [batteryLevel, setBatteryLevel] = useState(100);
  const [connectionStatus, setConnectionStatus] = useState<'online' | 'offline'>('online');
  const [uploadProgress, setUploadProgress] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const locationWatcherRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    initializeRecording();
    loadProximityZones();
    startLocationTracking();
    checkBatteryStatus();
    
    return () => {
      cleanup();
    };
  }, []);

  const initializeRecording = async () => {
    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      audioStreamRef.current = stream;
      setPermissionStatus('granted');
      
      // Set up MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = handleRecordingStop;
      mediaRecorderRef.current = mediaRecorder;
      
      // Audio level monitoring
      const audioContext = new AudioContext();
      const analyzer = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      microphone.connect(analyzer);
      
      const dataArray = new Uint8Array(analyzer.frequencyBinCount);
      
      const updateAudioLevel = () => {
        analyzer.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setAudioLevel(average);
        
        if (isRecording && !isPaused) {
          animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
        }
      };
      
      updateAudioLevel();
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setPermissionStatus('denied');
      toast.error('Error al acceder al micrófono');
    }
  };

  const startLocationTracking = () => {
    if ('geolocation' in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const locationData: LocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: Date.now()
          };
          
          setCurrentLocation(locationData);
          checkProximityZones(locationData);
        },
        (error) => {
          console.error('Error tracking location:', error);
          toast.error('Error al rastrear ubicación');
        },
        {
          enableHighAccuracy: true,
          maximumAge: 30000,
          timeout: 27000
        }
      );
      
      locationWatcherRef.current = watchId;
    }
  };

  const checkProximityZones = (location: LocationData) => {
    proximityZones.forEach(zone => {
      const distance = calculateDistance(
        location.latitude,
        location.longitude,
        zone.centerLat,
        zone.centerLng
      );
      
      if (distance <= zone.radius && zone.isActive && autoRecording && !isRecording) {
        toast.success(`Entrando en zona: ${zone.name}. Iniciando grabación automática.`);
        startRecording();
      }
    });
  };

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c * 1000; // Distance in meters
  };

  const startRecording = () => {
    if (!mediaRecorderRef.current || !currentLocation) {
      toast.error('Recorder or location not available');
      return;
    }

    const session: RecordingSession = {
      id: Date.now().toString(),
      startTime: new Date(),
      location: currentLocation,
      duration: 0,
      status: 'recording'
    };

    setCurrentSession(session);
    setIsRecording(true);
    setIsPaused(false);
    
    recordedChunksRef.current = [];
    mediaRecorderRef.current.start(1000); // Collect data every second
    
    toast.success('Grabación iniciada');
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      toast.success('Grabación pausada');
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      toast.success('Grabación reanudada');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }
  };

  const handleRecordingStop = async () => {
    if (recordedChunksRef.current.length > 0 && currentSession) {
      const blob = new Blob(recordedChunksRef.current, { type: 'audio/webm' });
      const fileSize = blob.size;
      
      const updatedSession: RecordingSession = {
        ...currentSession,
        endTime: new Date(),
        duration: Date.now() - currentSession.startTime.getTime(),
        fileSize,
        status: 'completed'
      };
      
      setRecordingSessions(prev => [...prev, updatedSession]);
      setCurrentSession(null);
      
      // Auto-upload if configured
      if (autoRecording) {
        await uploadRecording(blob, updatedSession);
      }
      
      toast.success('Grabación completada');
    }
  };

  const uploadRecording = async (blob: Blob, session: RecordingSession) => {
    try {
      setUploadProgress(0);
      const updatedSession = { ...session, status: 'uploading' as const };
      setRecordingSessions(prev => 
        prev.map(s => s.id === session.id ? updatedSession : s)
      );

      const formData = new FormData();
      formData.append('audio', blob, `recording-${session.id}.webm`);
      formData.append('metadata', JSON.stringify({
        sessionId: session.id,
        startTime: session.startTime,
        endTime: session.endTime,
        location: session.location,
        duration: session.duration
      }));

      // Simulate upload progress
      const uploadPromise = fetch('/api/proximity/upload', {
        method: 'POST',
        body: formData
      });

      // Simulate progress
      let progress = 0;
      const progressInterval = setInterval(() => {
        progress += Math.random() * 20;
        if (progress > 90) progress = 90;
        setUploadProgress(progress);
      }, 500);

      const response = await uploadPromise;
      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.ok) {
        const finalSession = { ...updatedSession, status: 'uploaded' as const };
        setRecordingSessions(prev => 
          prev.map(s => s.id === session.id ? finalSession : s)
        );
        toast.success('Grabación subida exitosamente');
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setRecordingSessions(prev => 
        prev.map(s => s.id === session.id ? { ...s, status: 'completed' } : s)
      );
      toast.error('Error al subir grabación');
    } finally {
      setUploadProgress(0);
    }
  };

  const loadProximityZones = async () => {
    // Mock data - replace with actual API call
    const mockZones: ProximityZone[] = [
      {
        id: '1',
        name: 'Showroom Principal',
        centerLat: 21.161908,
        centerLng: -86.851528,
        radius: 100,
        isActive: true
      },
      {
        id: '2',
        name: 'Centro de Servicio',
        centerLat: 21.165000,
        centerLng: -86.850000,
        radius: 50,
        isActive: true
      }
    ];
    
    setProximityZones(mockZones);
  };

  const checkBatteryStatus = async () => {
    if ('getBattery' in navigator) {
      try {
        const battery = await (navigator as any).getBattery();
        setBatteryLevel(Math.round(battery.level * 100));
        
        battery.addEventListener('levelchange', () => {
          setBatteryLevel(Math.round(battery.level * 100));
        });
      } catch (error) {
        console.error('Error checking battery:', error);
      }
    }
  };

  const cleanup = () => {
    if (locationWatcherRef.current) {
      navigator.geolocation.clearWatch(locationWatcherRef.current);
    }
    
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop());
    }
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000) % 60;
    const minutes = Math.floor(ms / (1000 * 60)) % 60;
    const hours = Math.floor(ms / (1000 * 60 * 60));
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (permissionStatus === 'denied') {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Permisos Requeridos</h2>
        <p className="text-slate-600 mb-4">
          Se requiere acceso al micrófono y ubicación para usar esta función.
        </p>
        <Button onClick={initializeRecording} className="gap-2">
          <Mic className="w-4 h-4" />
          Solicitar Permisos
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Bar */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Signal className={`w-4 h-4 ${connectionStatus === 'online' ? 'text-green-500' : 'text-red-500'}`} />
            <span className="text-sm text-slate-600 capitalize">{connectionStatus}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Battery className={`w-4 h-4 ${batteryLevel > 20 ? 'text-green-500' : 'text-red-500'}`} />
            <span className="text-sm text-slate-600">{batteryLevel}%</span>
          </div>
          
          {currentLocation && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-500" />
              <span className="text-sm text-slate-600">
                {currentLocation.accuracy < 50 ? 'GPS Preciso' : 'GPS Aproximado'}
              </span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Label htmlFor="auto-recording" className="text-sm">Grabación Automática</Label>
          <Switch
            id="auto-recording"
            checked={autoRecording}
            onCheckedChange={setAutoRecording}
          />
        </div>
      </div>

      {/* Recording Control */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mic className="w-5 h-5" />
              Control de Grabación
            </CardTitle>
            <CardDescription>
              Controles manuales para iniciar, pausar y detener grabaciones
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Audio Level */}
            <div className="space-y-2">
              <Label>Nivel de Audio</Label>
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-slate-500" />
                <Progress value={audioLevel} className="flex-1" />
                <span className="text-sm text-slate-600">{Math.round(audioLevel)}%</span>
              </div>
            </div>

            {/* Recording Status */}
            {currentSession && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="font-medium text-red-800">
                    {isPaused ? 'PAUSADO' : 'GRABANDO'}
                  </span>
                </div>
                <div className="text-sm text-red-700">
                  Duración: {formatDuration(Date.now() - currentSession.startTime.getTime())}
                </div>
              </div>
            )}

            {/* Controls */}
            <div className="flex gap-2">
              {!isRecording ? (
                <Button
                  onClick={startRecording}
                  disabled={!currentLocation || permissionStatus !== 'granted'}
                  className="gap-2 bg-red-500 hover:bg-red-600"
                >
                  <Mic className="w-4 h-4" />
                  Iniciar Grabación
                </Button>
              ) : (
                <>
                  {!isPaused ? (
                    <Button
                      onClick={pauseRecording}
                      variant="outline"
                      className="gap-2"
                    >
                      <Pause className="w-4 h-4" />
                      Pausar
                    </Button>
                  ) : (
                    <Button
                      onClick={resumeRecording}
                      variant="outline"
                      className="gap-2"
                    >
                      <Play className="w-4 h-4" />
                      Reanudar
                    </Button>
                  )}
                  
                  <Button
                    onClick={stopRecording}
                    variant="destructive"
                    className="gap-2"
                  >
                    <Square className="w-4 h-4" />
                    Detener
                  </Button>
                </>
              )}
            </div>

            {/* Upload Progress */}
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="space-y-2">
                <Label>Subiendo grabación...</Label>
                <Progress value={uploadProgress} />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Location & Zones */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Zonas de Proximidad
            </CardTitle>
            <CardDescription>
              Zonas configuradas para grabación automática
            </CardDescription>
          </CardHeader>
          <CardContent>
            {currentLocation ? (
              <div className="space-y-4">
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="font-medium text-green-800">Ubicación Activa</span>
                  </div>
                  <div className="text-sm text-green-700">
                    Lat: {currentLocation.latitude.toFixed(6)}<br />
                    Lng: {currentLocation.longitude.toFixed(6)}<br />
                    Precisión: ±{Math.round(currentLocation.accuracy)}m
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Zonas Configuradas</Label>
                  {proximityZones.map(zone => {
                    const distance = currentLocation ? calculateDistance(
                      currentLocation.latitude,
                      currentLocation.longitude,
                      zone.centerLat,
                      zone.centerLng
                    ) : 0;

                    const isInZone = distance <= zone.radius;

                    return (
                      <div
                        key={zone.id}
                        className={`p-3 border rounded-lg ${
                          isInZone ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">{zone.name}</span>
                          <Badge variant={zone.isActive ? 'default' : 'secondary'}>
                            {zone.isActive ? 'Activa' : 'Inactiva'}
                          </Badge>
                        </div>
                        <div className="text-sm text-slate-600">
                          Distancia: {Math.round(distance)}m / {zone.radius}m
                          {isInZone && (
                            <span className="ml-2 text-blue-600 font-medium">
                              ¡Dentro de zona!
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <MapPin className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                <p className="text-slate-600">Obteniendo ubicación...</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recording Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Sesiones de Grabación
          </CardTitle>
          <CardDescription>
            Historial de grabaciones realizadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recordingSessions.length > 0 ? (
            <div className="space-y-3">
              {recordingSessions.slice().reverse().map((session, index) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge 
                        variant={
                          session.status === 'uploaded' ? 'default' : 
                          session.status === 'uploading' ? 'secondary' : 
                          'outline'
                        }
                      >
                        {session.status === 'uploaded' && <CheckCircle className="w-3 h-3 mr-1" />}
                        {session.status}
                      </Badge>
                      <span className="text-sm text-slate-600">
                        {session.startTime.toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="text-sm text-slate-600">
                      Duración: {formatDuration(session.duration)}
                      {session.fileSize && (
                        <span className="ml-3">
                          Tamaño: {formatFileSize(session.fileSize)}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" className="gap-1">
                      <Download className="w-3 h-3" />
                      Descargar
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Mic className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-800 mb-2">
                No hay grabaciones
              </h3>
              <p className="text-slate-600">
                Las grabaciones aparecerán aquí una vez completadas
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
