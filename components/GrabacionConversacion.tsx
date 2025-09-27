
'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Mic, 
  Square, 
  Play, 
  Pause, 
  Download,
  MessageSquare,
  Clock,
  Brain,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Users,
  Volume2,
  Upload,
  Loader2,
  X,
  FileAudio,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { AudioRecorder, checkAudioSupport, getOptimalSettings, formatDuration, formatFileSize } from '@/lib/audio-utils';

interface GrabacionConversacionProps {
  prospectoId: number;
  vendedorId: string;
  prospectoNombre: string;
  onGrabacionGuardada?: () => void;
}

interface AnalisisSPPC {
  analisisPilares: { [key: string]: { puntuacion: number; justificacion: string; evidencia: string } };
  resumenGeneral: {
    puntuacionTotal: number;
    clasificacion: string;
    sentimiento: string;
    palabrasClave: string[];
    momentosImportantes: { minuto: number; descripcion: string }[];
  };
  objeciones: { tipo: string; descripcion: string; severidad: string }[];
  recomendaciones: string[];
  proximosPasos: string[];
}

export default function GrabacionConversacion({ 
  prospectoId, 
  vendedorId, 
  prospectoNombre,
  onGrabacionGuardada 
}: GrabacionConversacionProps) {
  const { data: session } = useSession();
  const [audioRecorder, setAudioRecorder] = useState<AudioRecorder | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedAudio, setRecordedAudio] = useState<{ blob: Blob; metadata: any } | null>(null);
  
  // Estados del proceso
  const [isUploading, setIsUploading] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStep, setCurrentStep] = useState<'recording' | 'upload' | 'transcribe' | 'analyze' | 'complete'>('recording');
  
  // Datos de grabación
  const [grabacionId, setGrabacionId] = useState<number | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [transcripcion, setTranscripcion] = useState('');
  const [analisisSPPC, setAnalisisSPPC] = useState<AnalisisSPPC | null>(null);
  
  // Configuración
  const [tipoLlamada, setTipoLlamada] = useState('prospectacion');
  const [observaciones, setObservaciones] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<any>(null);
  const [showAnalysisDetails, setShowAnalysisDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Verificar soporte de audio al montar
  useEffect(() => {
    const audioSupport = checkAudioSupport();
    if (!audioSupport) {
      setError('Tu navegador no soporta la API de grabación de audio.');
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      // Cleanup audio recorder
      if (audioRecorder) {
        audioRecorder.cancelRecording();
      }
    };
  }, [audioRecorder]);

  const initializeRecorder = async () => {
    try {
      // Ya no necesitamos la variable 'settings' aquí.
      // Simplemente crea la instancia, y usará las opciones por defecto del micrófono.
      const recorder = new AudioRecorder();      setAudioRecorder(recorder);
      return recorder;
    } catch (error) {
      console.error('Error initializing recorder:', error);
      toast.error('Error inicializando grabadora');
      return null;
    }
  };

  const startRecording = async () => {
    try {
      setError(null);
      
      let recorder = audioRecorder;
      if (!recorder) {
        recorder = await initializeRecorder();
        if (!recorder) return;
      }

      await recorder.startRecording();
      setIsRecording(true);
      setRecordingTime(0);
      setCurrentStep('recording');

      // Iniciar contador de tiempo
      intervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      toast.success('🎙️ Grabación iniciada');
    } catch (error) {
      console.error('Error al iniciar grabación:', error);
      setError(`Error al iniciar grabación: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      toast.error('Error al acceder al micrófono');
    }
  };

  const stopRecording = async () => {
    try {
      if (!audioRecorder || !isRecording) return;

      const result = await audioRecorder.stopRecording();
      setIsRecording(false);
      setIsPaused(false);
      setRecordedAudio(result);
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      toast.success(`🎵 Grabación completada: ${formatDuration(result.metadata.duration)}`);
      setCurrentStep('upload');
    } catch (error) {
      console.error('Error al detener grabación:', error);
      setError(`Error al detener grabación: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      toast.error('Error al finalizar grabación');
    }
  };

  const pauseRecording = () => {
    if (!audioRecorder || !isRecording) return;

    if (isPaused) {
      audioRecorder.resumeRecording();
      intervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      toast.success('⏯️ Grabación reanudada');
    } else {
      audioRecorder.pauseRecording();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      toast.success('⏸️ Grabación pausada');
    }
    setIsPaused(!isPaused);
  };

  const uploadAudio = async () => {
    if (!recordedAudio || !session?.user) return;

    setIsUploading(true);
    setError(null);

    try {
      // Crear FormData para el upload
      const formData = new FormData();
      formData.append('audio', recordedAudio.blob, `grabacion_${prospectoId}_${Date.now()}.webm`);
      formData.append('prospectoId', prospectoId.toString());
      formData.append('tipoLlamada', tipoLlamada);
      formData.append('duracion', recordedAudio.metadata.duration.toString());

      // Subir archivo
      const uploadResponse = await fetch('/api/grabaciones/upload', {
        method: 'POST',
        body: formData,
      });

      const uploadResult = await uploadResponse.json();

      if (!uploadResponse.ok) {
        throw new Error(uploadResult.error || 'Error al subir archivo');
      }

      if (uploadResult.paymentStatus) {
        setPaymentStatus(uploadResult.paymentStatus);
      }

      setUploadedUrl(uploadResult.url);
      
      // Crear registro de grabación en base de datos
      const createResponse = await fetch('/api/grabaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prospectoId,
          tipoLlamada,
          duracion: recordedAudio.metadata.duration,
          rutaArchivo: uploadResult.path,
          observacionesVendedor: observaciones,
          tamanoArchivo: recordedAudio.metadata.size,
          formatoAudio: recordedAudio.metadata.format,
          dispositivoGrabacion: 'web',
        }),
      });

      const createResult = await createResponse.json();

      if (!createResponse.ok) {
        throw new Error(createResult.error || 'Error al crear grabación');
      }

      setGrabacionId(createResult.grabacion.id);
      toast.success('📁 Archivo subido exitosamente');
      setCurrentStep('transcribe');

    } catch (error) {
      console.error('Error uploading audio:', error);
      setError(`Error al subir audio: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      toast.error('Error al subir grabación');
    } finally {
      setIsUploading(false);
    }
  };

  const transcribeAudio = async () => {
    if (!grabacionId) return;

    setIsTranscribing(true);
    setError(null);

    try {
      const response = await fetch('/api/grabaciones/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grabacionId,
          language: 'es',
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error en transcripción');
      }

      setTranscripcion(result.transcripcion);
      toast.success('📝 Transcripción completada');
      setCurrentStep('analyze');

    } catch (error) {
      console.error('Error transcribing audio:', error);
      setError(`Error en transcripción: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      toast.error('Error en transcripción');
    } finally {
      setIsTranscribing(false);
    }
  };

  const analyzeWithSPPC = async () => {
    if (!grabacionId) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch('/api/grabaciones/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grabacionId,
          forceReanalysis: false,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error en análisis SPPC');
      }

      setAnalisisSPPC(result.analisis);
      toast.success('🧠 Análisis SPPC completado');
      setCurrentStep('complete');

    } catch (error) {
      console.error('Error analyzing with SPPC:', error);
      setError(`Error en análisis SPPC: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      toast.error('Error en análisis SPPC');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetRecording = () => {
    // Limpiar estado
    setRecordedAudio(null);
    setTranscripcion('');
    setAnalisisSPPC(null);
    setGrabacionId(null);
    setUploadedUrl(null);
    setRecordingTime(0);
    setObservaciones('');
    setCurrentStep('recording');
    setError(null);
    setShowAnalysisDetails(false);
    
    // Limpiar grabadora
    if (audioRecorder) {
      audioRecorder.cancelRecording();
    }
    
    toast.success('Listo para nueva grabación');
  };

  const handleGuardarYFinalizar = () => {
    toast.success('✅ Grabación procesada y guardada exitosamente');
    if (onGrabacionGuardada) {
      onGrabacionGuardada();
    }
    resetRecording();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positivo': return 'text-green-600 bg-green-50 border-green-200';
      case 'negativo': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    }
  };

  const getSentimentEmoji = (sentiment: string) => {
    switch (sentiment) {
      case 'positivo': return '😊';
      case 'negativo': return '😞';
      default: return '😐';
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
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
              <X className="w-3 h-3" />
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Payment Status Warning */}
      {paymentStatus && !paymentStatus.canUseService && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>Límite de servicios:</strong> {paymentStatus.reason}
          </AlertDescription>
        </Alert>
      )}

      {paymentStatus && paymentStatus.canUseService && paymentStatus.reason && (
        <Alert className="border-blue-200 bg-blue-50">
          <AlertTriangle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            {paymentStatus.reason}
          </AlertDescription>
        </Alert>
      )}

      {/* Main Recording Card */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b">
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <Mic className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Sistema de Grabación Inteligente
              </h2>
              <p className="text-sm font-medium text-blue-600">
                {prospectoNombre}
              </p>
            </div>
          </CardTitle>
          <CardDescription className="text-gray-600">
            Graba, transcribe y analiza conversaciones con IA para mejorar tu estrategia SPPC
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {/* Progress Stepper */}
          <div className="flex items-center justify-between mb-8">
            {['recording', 'upload', 'transcribe', 'analyze', 'complete'].map((step, index) => {
              const isActive = currentStep === step;
              const isCompleted = ['recording', 'upload', 'transcribe', 'analyze', 'complete'].indexOf(currentStep) > index;
              
              return (
                <div key={step} className="flex items-center">
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all
                    ${isActive ? 'bg-blue-600 text-white ring-4 ring-blue-100' : 
                      isCompleted ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'}
                  `}>
                    {isCompleted ? <CheckCircle className="w-5 h-5" /> : index + 1}
                  </div>
                  {index < 4 && (
                    <div className={`h-1 w-16 mx-2 transition-all ${
                      isCompleted ? 'bg-green-600' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Recording Controls */}
          {currentStep === 'recording' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-6"
            >
              <div className="flex items-center justify-center space-x-4">
                {!isRecording && !recordedAudio && (
                  <Button 
                    onClick={startRecording}
                    size="lg"
                    className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 text-lg shadow-lg"
                  >
                    <Mic className="w-6 h-6 mr-2" />
                    Iniciar Grabación
                  </Button>
                )}

                {isRecording && (
                  <div className="flex items-center space-x-4">
                    <Button 
                      onClick={pauseRecording}
                      variant="outline"
                      size="lg"
                      className="px-6 py-4"
                    >
                      {isPaused ? (
                        <>
                          <Play className="w-5 h-5 mr-2" />
                          Reanudar
                        </>
                      ) : (
                        <>
                          <Pause className="w-5 h-5 mr-2" />
                          Pausar
                        </>
                      )}
                    </Button>

                    <div className="flex items-center gap-4 px-6 py-3 bg-gray-50 rounded-lg">
                      <div className={`w-4 h-4 rounded-full ${
                        isRecording && !isPaused ? 'bg-red-500 animate-pulse' : 'bg-gray-400'
                      }`} />
                      <span className="text-2xl font-mono font-bold text-gray-900">
                        {formatTime(recordingTime)}
                      </span>
                    </div>

                    <Button 
                      onClick={stopRecording}
                      size="lg"
                      className="bg-gray-800 hover:bg-gray-900 px-6 py-4"
                    >
                      <Square className="w-5 h-5 mr-2" />
                      Finalizar
                    </Button>
                  </div>
                )}

                {recordedAudio && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-4 w-full max-w-lg"
                  >
                    <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="font-medium text-green-800">
                          Grabación completa: {formatDuration(recordedAudio.metadata.duration)}
                        </p>
                        <p className="text-sm text-green-600">
                          Tamaño: {formatFileSize(recordedAudio.metadata.size)} • Calidad: {recordedAudio.metadata.quality}
                        </p>
                      </div>
                    </div>
                    
                    <audio 
                      controls 
                      src={URL.createObjectURL(recordedAudio.blob)} 
                      className="w-full h-12 rounded-lg"
                    />

                    <div className="flex gap-3">
                      <Button onClick={() => setCurrentStep('upload')} className="flex-1">
                        Continuar Procesamiento
                      </Button>
                      <Button onClick={resetRecording} variant="outline">
                        Nueva Grabación
                      </Button>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Recording Configuration */}
              {!isRecording && !recordedAudio && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg mx-auto">
                  <div>
                    <Label htmlFor="tipoLlamada">Tipo de Llamada</Label>
                    <Select value={tipoLlamada} onValueChange={setTipoLlamada}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="prospectacion">Prospección</SelectItem>
                        <SelectItem value="seguimiento">Seguimiento</SelectItem>
                        <SelectItem value="cierre">Cierre de Venta</SelectItem>
                        <SelectItem value="postventa">Post-venta</SelectItem>
                        <SelectItem value="visita_presencial">Visita Presencial</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="observaciones">Observaciones</Label>
                    <Textarea
                      id="observaciones"
                      value={observaciones}
                      onChange={(e) => setObservaciones(e.target.value)}
                      placeholder="Notas previas..."
                      rows={1}
                    />
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Upload Step */}
          {currentStep === 'upload' && recordedAudio && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-6"
            >
              <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
                <Upload className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-blue-900 mb-2">
                  Subir Grabación al Sistema
                </h3>
                <p className="text-blue-700 mb-4">
                  Tu grabación se almacenará de forma segura y se preparará para el procesamiento con IA
                </p>
                
                <Button 
                  onClick={uploadAudio}
                  disabled={isUploading}
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Subiendo...
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5 mr-2" />
                      Subir y Procesar
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          )}

          {/* Transcribe Step */}
          {currentStep === 'transcribe' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-6"
            >
              <div className="p-6 bg-purple-50 border border-purple-200 rounded-lg">
                <FileAudio className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-purple-900 mb-2">
                  Transcripción con IA
                </h3>
                <p className="text-purple-700 mb-4">
                  Convertimos tu audio en texto usando tecnología de transcripción avanzada
                </p>
                
                <Button 
                  onClick={transcribeAudio}
                  disabled={isTranscribing}
                  size="lg"
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {isTranscribing ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Transcribiendo...
                    </>
                  ) : (
                    <>
                      <MessageSquare className="w-5 h-5 mr-2" />
                      Iniciar Transcripción
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          )}

          {/* Analyze Step */}
          {currentStep === 'analyze' && transcripcion && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Transcription Preview */}
              <Card className="bg-gray-50">
                <CardHeader>
                  <CardTitle className="text-lg">Transcripción Completada</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="max-h-32 overflow-y-auto text-sm text-gray-700 bg-white p-3 rounded border">
                    {transcripcion.substring(0, 300)}...
                  </div>
                </CardContent>
              </Card>

              <div className="text-center p-6 bg-green-50 border border-green-200 rounded-lg">
                <Sparkles className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-green-900 mb-2">
                  Análisis SPPC con IA
                </h3>
                <p className="text-green-700 mb-4">
                  Analizamos tu conversación con los 15 pilares del sistema SPPC para generar insights precisos
                </p>
                
                <Button 
                  onClick={analyzeWithSPPC}
                  disabled={isAnalyzing}
                  size="lg"
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Analizando con IA...
                    </>
                  ) : (
                    <>
                      <Brain className="w-5 h-5 mr-2" />
                      Iniciar Análisis SPPC
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          )}

          {/* Complete Step - Analysis Results */}
          {currentStep === 'complete' && analisisSPPC && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className={`border-2 ${getSentimentColor(analisisSPPC.resumenGeneral.sentimiento)}`}>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl mb-2">
                      {getSentimentEmoji(analisisSPPC.resumenGeneral.sentimiento)}
                    </div>
                    <p className="font-semibold">
                      {analisisSPPC.resumenGeneral.sentimiento.charAt(0).toUpperCase() + analisisSPPC.resumenGeneral.sentimiento.slice(1)}
                    </p>
                    <p className="text-sm opacity-75">Sentimiento general</p>
                  </CardContent>
                </Card>

                <Card className="border-2 border-blue-200 bg-blue-50">
                  <CardContent className="p-4 text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-1">
                      {analisisSPPC.resumenGeneral.puntuacionTotal}
                    </div>
                    <p className="font-semibold text-blue-900">Puntuación SPPC</p>
                    <p className="text-sm text-blue-700">{analisisSPPC.resumenGeneral.clasificacion}</p>
                  </CardContent>
                </Card>

                <Card className="border-2 border-green-200 bg-green-50">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl text-green-600 mb-2">
                      <TrendingUp className="w-8 h-8 mx-auto" />
                    </div>
                    <p className="font-semibold text-green-900">
                      {analisisSPPC.recomendaciones.length} Recomendaciones
                    </p>
                    <p className="text-sm text-green-700">Próximos pasos</p>
                  </CardContent>
                </Card>
              </div>

              {/* Key Insights */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Keywords */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Palabras Clave</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {analisisSPPC.resumenGeneral.palabrasClave?.map((keyword, idx) => (
                        <Badge key={idx} variant="outline" className="bg-blue-50">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Important Moments */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Momentos Importantes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {analisisSPPC.resumenGeneral.momentosImportantes?.slice(0, 3).map((momento, idx) => (
                        <div key={idx} className="flex items-start gap-2 p-2 bg-green-50 rounded">
                          <Badge variant="secondary" className="text-xs">
                            {momento.minuto}m
                          </Badge>
                          <p className="text-sm text-green-800">{momento.descripcion}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    Recomendaciones Estratégicas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {analisisSPPC.recomendaciones.map((rec, idx) => (
                      <div key={idx} className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded">
                        <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-blue-800">{rec}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button 
                  onClick={handleGuardarYFinalizar}
                  className="flex-1 bg-green-600 hover:bg-green-700 h-12"
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Finalizar y Guardar
                </Button>
                
                <Button 
                  onClick={() => setShowAnalysisDetails(true)}
                  variant="outline"
                  className="flex-1 h-12"
                >
                  <Brain className="w-5 h-5 mr-2" />
                  Ver Análisis Detallado
                </Button>
                
                <Button 
                  onClick={resetRecording}
                  variant="outline"
                  className="h-12"
                >
                  Nueva Grabación
                </Button>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Detailed Analysis Modal would go here */}
      {/* Implementation depends on your modal component preferences */}
    </div>
  );
}
