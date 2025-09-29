
'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  MessageSquare, 
  Send, 
  Play,
  Square,
  RotateCcw,
  User,
  Bot,
  CheckCircle,
  XCircle,
  Award,
  Clock,
  Target
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

interface Message {
  id: string;
  content: string;
  sender: 'vendedor' | 'cliente_ia';
  timestamp: string;
}

interface Scenario {
  id: number;
  titulo: string;
  descripcion: string;
  categoria: string;
  tipoCliente: string;
  vehiculoInteres?: string;
  presupuesto?: number;
  nivelDificultad: string;
  duracionEstimada: number;
}

interface RolePlaySimpleSimulatorProps {
  scenario?: Scenario;
  onComplete?: (sessionData: any) => void;
  onEvaluate?: (sessionId: number) => void;
}

export default function RolePlaySimpleSimulator({ 
  scenario, 
  onComplete, 
  onEvaluate 
}: RolePlaySimpleSimulatorProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [showEvaluationDialog, setShowEvaluationDialog] = useState(false);
  const [evaluation, setEvaluation] = useState<any>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<Date>(new Date());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Timer para duración de sesión
  useEffect(() => {
    if (sessionStarted && !sessionCompleted) {
      intervalRef.current = setInterval(() => {
        setSessionDuration(Math.floor((Date.now() - startTimeRef.current.getTime()) / 1000));
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [sessionStarted, sessionCompleted]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const startSimulation = async () => {
    if (!scenario) {
      toast.error('Selecciona un escenario para comenzar');
      return;
    }

    try {
      setIsSimulating(true);
      setSessionStarted(true);
      setSessionCompleted(false);
      startTimeRef.current = new Date();
      setMessages([]);
      setSessionId(null);
      
      const welcomeMessage: Message = {
        id: `welcome-${Date.now()}`,
        content: `¡Bienvenido! Estás practicando: "${scenario.titulo}". Tu cliente es ${scenario.tipoCliente}. ${scenario.vehiculoInteres ? `Interesado en: ${scenario.vehiculoInteres}` : ''} ¡Comienza la conversación!`,
        sender: 'cliente_ia',
        timestamp: new Date().toISOString()
      };
      
      setMessages([welcomeMessage]);
      
      // Enviar mensaje inicial del cliente
      await sendInitialMessage();
      
    } catch (error) {
      console.error('Error starting simulation:', error);
      toast.error('Error al iniciar la simulación');
      resetSimulation();
    }
  };

  const sendInitialMessage = async () => {
    setIsTyping(true);
    
    try {
      const response = await fetch('/api/roleplay/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenarioId: scenario?.id,
          message: undefined,
          sessionId: null
        })
      });

      if (!response.ok) {
        throw new Error('Error en la simulación');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');
      
      const decoder = new TextDecoder();
      let aiResponse = '';
      let newSessionId = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') break;
            
            try {
              const parsed = JSON.parse(data);
              
              if (parsed.status === 'completed') {
                aiResponse = parsed.response;
                newSessionId = parsed.sessionId;
                break;
              }
            } catch (e) {
              console.warn('Error parsing data:', e);
            }
          }
        }
      }

      if (aiResponse && newSessionId) {
        setSessionId(newSessionId);
        
        const aiMessage: Message = {
          id: `ai-initial-${Date.now()}`,
          content: aiResponse,
          sender: 'cliente_ia',
          timestamp: new Date().toISOString()
        };
        
        setMessages(prev => [...prev, aiMessage]);
      }

    } catch (error) {
      console.error('Error:', error);
      toast.error('Error iniciando la conversación');
      resetSimulation();
    } finally {
      setIsTyping(false);
    }
  };

  const sendMessage = async () => {
    if (!currentMessage.trim() || isTyping || !sessionId) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content: currentMessage,
      sender: 'vendedor',
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    const messageToSend = currentMessage;
    setCurrentMessage('');
    setIsTyping(true);

    try {
      const response = await fetch('/api/roleplay/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenarioId: scenario?.id,
          message: messageToSend,
          sessionId: sessionId
        })
      });

      if (!response.ok) {
        throw new Error('Error en la simulación');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');
      
      const decoder = new TextDecoder();
      let aiResponse = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') break;
            
            try {
              const parsed = JSON.parse(data);
              
              if (parsed.status === 'completed') {
                aiResponse = parsed.response;
                break;
              }
            } catch (e) {
              console.warn('Error parsing data:', e);
            }
          }
        }
      }

      if (aiResponse) {
        const aiMessage: Message = {
          id: `ai-${Date.now()}`,
          content: aiResponse,
          sender: 'cliente_ia',
          timestamp: new Date().toISOString()
        };
        
        setMessages(prev => [...prev, aiMessage]);
      }

    } catch (error) {
      console.error('Error:', error);
      toast.error('Error en la conversación');
    } finally {
      setIsTyping(false);
    }
  };

  const completeSession = async (ventaLograda: boolean) => {
    if (!sessionId) return;

    try {
      const response = await fetch('/api/roleplay/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionId,
          ventaLograda: ventaLograda
        })
      });

      if (response.ok) {
        const data = await response.json();
        setEvaluation(data.evaluation);
        setSessionCompleted(true);
        setShowEvaluationDialog(true);
        
        if (onComplete) {
          onComplete({
            sessionId: sessionId,
            score: data.evaluation.puntuacionGeneral,
            duration: sessionDuration
          });
        }
        
        toast.success('Sesión completada y evaluada');
      } else {
        throw new Error('Error al evaluar sesión');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al completar la sesión');
    }
  };

  const resetSimulation = () => {
    setIsSimulating(false);
    setSessionStarted(false);
    setSessionCompleted(false);
    setMessages([]);
    setCurrentMessage('');
    setIsTyping(false);
    setSessionDuration(0);
    setSessionId(null);
    setEvaluation(null);
    setShowEvaluationDialog(false);
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!scenario) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <MessageSquare className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Selecciona un Escenario</h3>
            <p className="text-slate-600">Elige un escenario de roleplay para comenzar a practicar</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="h-[600px] flex flex-col">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                {scenario.titulo}
              </CardTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline">{scenario.categoria}</Badge>
                <Badge variant="secondary">{scenario.nivelDificultad}</Badge>
                <Badge variant="outline">{scenario.tipoCliente}</Badge>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {sessionStarted && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Clock className="w-4 h-4" />
                  {formatTime(sessionDuration)}
                </div>
              )}
              
              {!sessionStarted ? (
                <Button onClick={startSimulation} className="gap-2">
                  <Play className="w-4 h-4" />
                  Iniciar Simulación
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    onClick={() => completeSession(true)}
                    disabled={sessionCompleted || messages.length < 4}
                    size="sm"
                    className="gap-2 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Venta Exitosa
                  </Button>
                  <Button
                    onClick={() => completeSession(false)}
                    disabled={sessionCompleted || messages.length < 4}
                    size="sm"
                    variant="outline"
                    className="gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    Sin Venta
                  </Button>
                  <Button
                    onClick={resetSimulation}
                    size="sm"
                    variant="outline"
                    className="gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Reiniciar
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-4">
          {/* Messages Area */}
          <ScrollArea className="flex-1 mb-4 border rounded-lg p-4">
            <div className="space-y-4">
              <AnimatePresence>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`flex gap-3 ${
                      message.sender === 'vendedor' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div className={`flex gap-2 max-w-[80%] ${
                      message.sender === 'vendedor' ? 'flex-row-reverse' : 'flex-row'
                    }`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        message.sender === 'vendedor' 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-slate-200 text-slate-600'
                      }`}>
                        {message.sender === 'vendedor' ? (
                          <User className="w-4 h-4" />
                        ) : (
                          <Bot className="w-4 h-4" />
                        )}
                      </div>
                      
                      <div className={`px-4 py-2 rounded-lg ${
                        message.sender === 'vendedor'
                          ? 'bg-blue-500 text-white'
                          : 'bg-slate-100 text-slate-800'
                      }`}>
                        <p className="text-sm">{message.content}</p>
                        <p className={`text-xs mt-1 ${
                          message.sender === 'vendedor' 
                            ? 'text-blue-100' 
                            : 'text-slate-500'
                        }`}>
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-3 justify-start"
                >
                  <div className="flex gap-2">
                    <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="px-4 py-2 rounded-lg bg-slate-100">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input Area */}
          {sessionStarted && !sessionCompleted && (
            <div className="flex gap-2">
              <Input
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Escribe tu mensaje al cliente..."
                disabled={isTyping}
                className="flex-1"
              />
              <Button
                onClick={sendMessage}
                disabled={!currentMessage.trim() || isTyping}
                className="gap-2"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Evaluation Dialog */}
      <Dialog open={showEvaluationDialog} onOpenChange={setShowEvaluationDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-500" />
              Evaluación de Sesión
            </DialogTitle>
            <DialogDescription>
              Resultado de tu práctica de roleplay
            </DialogDescription>
          </DialogHeader>

          {evaluation && (
            <div className="space-y-6">
              {/* Score Overview */}
              <div className="text-center">
                <div className="text-4xl font-bold text-slate-800 mb-2">
                  {evaluation.puntuacionGeneral}
                </div>
                <p className="text-slate-600">Puntuación General</p>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <Clock className="w-4 h-4 text-slate-500" />
                  <span className="text-sm text-slate-500">
                    Duración: {formatTime(sessionDuration)}
                  </span>
                </div>
              </div>

              {/* Detailed Scores */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {evaluation.puntuacionProspectacion}
                  </div>
                  <p className="text-sm text-slate-600">Prospección</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {evaluation.puntuacionPresentacion}
                  </div>
                  <p className="text-sm text-slate-600">Presentación</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {evaluation.puntuacionManejoObjeciones}
                  </div>
                  <p className="text-sm text-slate-600">Objeciones</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {evaluation.puntuacionCierre}
                  </div>
                  <p className="text-sm text-slate-600">Cierre</p>
                </div>
              </div>

              {/* Feedback */}
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-slate-800 mb-2">Feedback</h4>
                  <p className="text-sm text-slate-600">{evaluation.feedback}</p>
                </div>

                {evaluation.recomendaciones && (
                  <div>
                    <h4 className="font-semibold text-slate-800 mb-2">Recomendaciones</h4>
                    <p className="text-sm text-slate-600">{evaluation.recomendaciones}</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowEvaluationDialog(false)}>
                  Cerrar
                </Button>
                <Button onClick={resetSimulation} className="gap-2">
                  <RotateCcw className="w-4 h-4" />
                  Nueva Práctica
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
