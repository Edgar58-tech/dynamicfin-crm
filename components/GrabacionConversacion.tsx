
'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  Volume2
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

interface GrabacionConversacionProps {
  prospectoId: number;
  vendedorId: string;
  prospectoNombre: string;
  onGrabacionGuardada?: () => void;
}

interface AnalisisIA {
  sentiment: 'positivo' | 'neutro' | 'negativo';
  palabrasClave: string[];
  momentosImportantes: { tiempo: number; descripcion: string }[];
  objecionesDetectadas: string[];
  recomendaciones: string[];
  scoreGeneralLlamada: number;
  duracionOptima: boolean;
  tonoDeLlamada: string;
}

export default function GrabacionConversacion({ 
  prospectoId, 
  vendedorId, 
  prospectoNombre,
  onGrabacionGuardada 
}: GrabacionConversacionProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [transcripcion, setTranscripcion] = useState('');
  const [analisisIA, setAnalisisIA] = useState<AnalisisIA | null>(null);
  const [tipoLlamada, setTipoLlamada] = useState('prospectacion');
  const [notas, setNotas] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);

  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      audioChunks.current = [];

      mediaRecorder.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.current.push(event.data);
        }
      };

      mediaRecorder.current.onstop = () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/wav' });
        setAudioBlob(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.current.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Iniciar contador de tiempo
      intervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      toast.success('Grabación iniciada');
    } catch (error) {
      console.error('Error al iniciar grabación:', error);
      toast.error('Error al acceder al micrófono');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      toast.success('Grabación finalizada');
    }
  };

  const pauseRecording = () => {
    if (mediaRecorder.current && isRecording) {
      if (isPaused) {
        mediaRecorder.current.resume();
        intervalRef.current = setInterval(() => {
          setRecordingTime(prev => prev + 1);
        }, 1000);
      } else {
        mediaRecorder.current.pause();
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      }
      setIsPaused(!isPaused);
    }
  };

  const procesarConIA = async () => {
    if (!audioBlob) return;

    setIsProcessing(true);
    try {
      // Simular procesamiento de IA (en producción sería una llamada a API)
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Simular transcripción
      const mockTranscripcion = `
Vendedor: Buenos días ${prospectoNombre}, habla Juan de la agencia Honda. ¿Cómo está usted?

Cliente: Hola, bien gracias. Me dijeron que me iban a llamar por el SUV que vi en internet.

Vendedor: Perfecto, sí, exactamente. Vi que consultó sobre nuestro CR-V 2025. Es una excelente opción para familias. ¿Me podría platicar un poco sobre qué está buscando específicamente?

Cliente: Bueno, necesitamos algo espacioso para la familia, que sea confiable y no muy caro de mantener. Tenemos dos hijos pequeños.

Vendedor: Entiendo perfectamente. El CR-V es ideal para eso. ¿Cuál sería su presupuesto aproximado para esta compra?

Cliente: Pues... estábamos pensando entre 450 y 500 mil pesos. ¿Cree que alcance?

Vendedor: Sí, perfecto. Con ese presupuesto tenemos varias opciones excelentes. ¿Le interesaría agendar una cita para que venga a conocer el vehículo y le pueda mostrar todas las características?

Cliente: Me interesa, pero primero quisiera saber si manejan financiamiento.

Vendedor: ¡Por supuesto! Manejamos financiamiento con las mejores tasas del mercado. ¿Qué le parece si agenda su cita para mañana por la tarde y le preparo toda la información financiera?

Cliente: Perfecto, ¿a qué hora estaría bien?

Vendedor: ¿Le conviene a las 4 de la tarde?

Cliente: Excelente, ahí estaremos.
      `;

      // Simular análisis de IA
      const mockAnalisis: AnalisisIA = {
        sentiment: 'positivo',
        palabrasClave: ['SUV', 'familia', 'financiamiento', 'presupuesto', 'cita'],
        momentosImportantes: [
          { tiempo: 45, descripcion: 'Cliente reveló necesidad específica (espacio familiar)' },
          { tiempo: 78, descripcion: 'Cliente mencionó presupuesto (450-500k)' },
          { tiempo: 120, descripcion: 'Cliente mostró interés en financiamiento' },
          { tiempo: 145, descripcion: 'Cita agendada exitosamente' }
        ],
        objecionesDetectadas: [
          'Preocupación por costos de mantenimiento',
          'Necesidad de confirmar financiamiento antes de decidir'
        ],
        recomendaciones: [
          'Preparar información detallada de costos de mantenimiento para la cita',
          'Tener lista simulación de crédito con diferentes plazos',
          'Mostrar características de seguridad para niños',
          'Preparar comparativo con modelos similares de la competencia'
        ],
        scoreGeneralLlamada: 87,
        duracionOptima: true,
        tonoDeLlamada: 'Profesional y empático'
      };

      setTranscripcion(mockTranscripcion);
      setAnalisisIA(mockAnalisis);
      toast.success('Análisis completado con IA');
      
    } catch (error) {
      console.error('Error al procesar con IA:', error);
      toast.error('Error en el análisis de IA');
    } finally {
      setIsProcessing(false);
    }
  };

  const guardarGrabacion = async () => {
    if (!audioBlob) return;

    try {
      // Aquí se guardaría en la base de datos
      const formData = new FormData();
      formData.append('audio', audioBlob, `grabacion_${prospectoId}_${Date.now()}.wav`);
      formData.append('prospectoId', prospectoId.toString());
      formData.append('vendedorId', vendedorId);
      formData.append('tipoLlamada', tipoLlamada);
      formData.append('duracion', recordingTime.toString());
      formData.append('transcripcion', transcripcion);
      formData.append('analisisIA', JSON.stringify(analisisIA));
      formData.append('notas', notas);

      // const response = await fetch('/api/grabaciones', {
      //   method: 'POST',
      //   body: formData
      // });

      // if (response.ok) {
        toast.success('Grabación guardada exitosamente');
        if (onGrabacionGuardada) onGrabacionGuardada();
        resetRecording();
      // }
      
    } catch (error) {
      console.error('Error al guardar grabación:', error);
      toast.error('Error al guardar la grabación');
    }
  };

  const resetRecording = () => {
    setAudioBlob(null);
    setTranscripcion('');
    setAnalisisIA(null);
    setRecordingTime(0);
    setNotas('');
    setShowAnalysis(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positivo': return 'text-green-600';
      case 'negativo': return 'text-red-600';
      default: return 'text-yellow-600';
    }
  };

  const getSentimentBg = (sentiment: string) => {
    switch (sentiment) {
      case 'positivo': return 'bg-green-100 text-green-800';
      case 'negativo': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Control de Grabación */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="w-5 h-5" />
            Grabación de Conversación - {prospectoNombre}
          </CardTitle>
          <CardDescription>
            Graba, transcribe y analiza conversaciones con IA para mejorar tu técnica de ventas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center space-x-4 mb-6">
            {!isRecording && !audioBlob && (
              <Button 
                onClick={startRecording}
                className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 text-lg"
              >
                <Mic className="w-6 h-6 mr-2" />
                Iniciar Grabación
              </Button>
            )}

            {isRecording && (
              <>
                <Button 
                  onClick={pauseRecording}
                  variant="outline"
                  className="px-6 py-4"
                >
                  {isPaused ? <Play className="w-5 h-5 mr-2" /> : <Pause className="w-5 h-5 mr-2" />}
                  {isPaused ? 'Reanudar' : 'Pausar'}
                </Button>

                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full ${isRecording && !isPaused ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`}></div>
                  <span className="text-2xl font-mono font-bold">
                    {formatTime(recordingTime)}
                  </span>
                </div>

                <Button 
                  onClick={stopRecording}
                  className="bg-gray-800 hover:bg-gray-900 px-6 py-4"
                >
                  <Square className="w-5 h-5 mr-2" />
                  Finalizar
                </Button>
              </>
            )}

            {audioBlob && (
              <div className="flex items-center space-x-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-medium">Grabación completa: {formatTime(recordingTime)}</span>
                </div>
                <audio controls src={URL.createObjectURL(audioBlob)} className="h-10" />
              </div>
            )}
          </div>

          {audioBlob && !transcripcion && (
            <div className="text-center">
              <Button 
                onClick={procesarConIA}
                disabled={isProcessing}
                className="bg-purple-600 hover:bg-purple-700 px-6 py-3"
              >
                {isProcessing ? (
                  <>
                    <div className="w-5 h-5 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Procesando con IA...
                  </>
                ) : (
                  <>
                    <Brain className="w-5 h-5 mr-2" />
                    Analizar con IA
                  </>
                )}
              </Button>
            </div>
          )}

          {transcripcion && (
            <div className="space-y-6">
              {/* Configuración de la llamada */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="notas">Notas Adicionales</Label>
                  <Textarea
                    id="notas"
                    value={notas}
                    onChange={(e) => setNotas(e.target.value)}
                    placeholder="Observaciones importantes..."
                    rows={3}
                  />
                </div>
              </div>

              {/* Análisis de IA */}
              {analisisIA && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Brain className="w-5 h-5 text-purple-600" />
                        Análisis Inteligente de la Conversación
                      </CardTitle>
                      <Badge className="bg-purple-100 text-purple-800">
                        Score: {analisisIA.scoreGeneralLlamada}/100
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Resumen General */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <MessageSquare className="w-5 h-5 text-blue-600" />
                          <h5 className="font-semibold text-blue-800">Sentimiento</h5>
                        </div>
                        <Badge className={getSentimentBg(analisisIA.sentiment)}>
                          {analisisIA.sentiment === 'positivo' ? '😊 Positivo' :
                           analisisIA.sentiment === 'negativo' ? '😞 Negativo' :
                           '😐 Neutro'}
                        </Badge>
                        <p className="text-sm text-blue-700 mt-1">{analisisIA.tonoDeLlamada}</p>
                      </div>

                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="w-5 h-5 text-green-600" />
                          <h5 className="font-semibold text-green-800">Duración</h5>
                        </div>
                        <p className="font-bold text-green-900">{formatTime(recordingTime)}</p>
                        <p className="text-sm text-green-700">
                          {analisisIA.duracionOptima ? '✅ Duración óptima' : '⚠️ Muy corta/larga'}
                        </p>
                      </div>

                      <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="w-5 h-5 text-purple-600" />
                          <h5 className="font-semibold text-purple-800">Efectividad</h5>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-full bg-purple-200 rounded-full h-2">
                            <div 
                              className="bg-purple-600 h-2 rounded-full transition-all duration-1000"
                              style={{ width: `${analisisIA.scoreGeneralLlamada}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium">{analisisIA.scoreGeneralLlamada}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Palabras Clave */}
                    <div>
                      <h5 className="font-semibold mb-2">Palabras Clave Detectadas:</h5>
                      <div className="flex flex-wrap gap-2">
                        {analisisIA.palabrasClave.map((palabra, idx) => (
                          <Badge key={idx} variant="outline" className="bg-blue-50">
                            {palabra}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Momentos Importantes */}
                    <div>
                      <h5 className="font-semibold mb-2">Momentos Importantes:</h5>
                      <div className="space-y-2">
                        {analisisIA.momentosImportantes.map((momento, idx) => (
                          <div key={idx} className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-bold text-green-700">
                                {Math.floor(momento.tiempo / 60)}:{(momento.tiempo % 60).toString().padStart(2, '0')}
                              </span>
                            </div>
                            <p className="text-sm text-green-800">{momento.descripcion}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Objeciones */}
                    {analisisIA.objecionesDetectadas.length > 0 && (
                      <div>
                        <h5 className="font-semibold mb-2">Objeciones Detectadas:</h5>
                        <div className="space-y-2">
                          {analisisIA.objecionesDetectadas.map((objecion, idx) => (
                            <div key={idx} className="flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                              <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                              <p className="text-sm text-yellow-800">{objecion}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recomendaciones */}
                    <div>
                      <h5 className="font-semibold mb-2">💡 Recomendaciones para Mejorar:</h5>
                      <div className="space-y-2">
                        {analisisIA.recomendaciones.map((rec, idx) => (
                          <div key={idx} className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-blue-800">{rec}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Button 
                      onClick={() => setShowAnalysis(!showAnalysis)}
                      variant="outline" 
                      className="w-full"
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      {showAnalysis ? 'Ocultar' : 'Ver'} Transcripción Completa
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Transcripción */}
              {showAnalysis && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Volume2 className="w-5 h-5" />
                      Transcripción Completa
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-50 p-4 rounded-lg border max-h-96 overflow-y-auto">
                      <pre className="text-sm whitespace-pre-wrap">{transcripcion}</pre>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Botones de Acción */}
              <div className="flex items-center justify-center space-x-4">
                <Button 
                  onClick={guardarGrabacion}
                  className="bg-green-600 hover:bg-green-700 px-8 py-3"
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Guardar Grabación y Análisis
                </Button>

                <Button 
                  onClick={resetRecording}
                  variant="outline"
                  className="px-8 py-3"
                >
                  Hacer Nueva Grabación
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
