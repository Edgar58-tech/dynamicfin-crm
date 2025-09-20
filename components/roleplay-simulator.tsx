
'use client';
import { RolePlayScenario as Scenario } from '@prisma/client';
import { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MessageSquare, 
  Send, 
  Star, 
  Clock, 
  Target, 
  TrendingUp,
  Play,
  Square,
  RotateCcw,
  User,
  Bot,
  CheckCircle,
  AlertTriangle,
  Award,
  Brain
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

interface Message {
  id: string;
  content: string;
  sender: 'vendedor' | 'cliente_ia';
  timestamp: string;
}


interface RolePlaySimulatorProps {
  scenario: Scenario | undefined;
  onComplete?: (sessionData: any) => void;
  onEvaluate?: (sessionId: number) => void;
}

export default function RolePlaySimulator({ 
  scenario, 
  onComplete, 
  onEvaluate 
}: RolePlaySimulatorProps) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [evaluation, setEvaluation] = useState<any>(null);
  const [showEvaluation, setShowEvaluation] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<Date>(new Date());

  // Timer para duración de sesión
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (sessionStarted && !sessionCompleted) {
      interval = setInterval(() => {
        setSessionDuration(Math.floor((Date.now() - startTimeRef.current.getTime()) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [sessionStarted, sessionCompleted]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startSimulation = async () => {
    if (!scenario) {
      toast.error('Selecciona un escenario para comenzar');
      return;
    }

    try {
      setIsSimulating(true);
      startTimeRef.current = new Date();
      
      // Iniciar la simulación sin mensaje
      const response = await sendMessage('', true);
      setSessionStarted(true);
      
      // Mensaje de bienvenida del sistema
      const welcomeMessage: Message = {
        id: `welcome-${Date.now()}`,
        content: `¡Bienvenido al simulador de ventas! Estás practicando el escenario: "${scenario.titulo}". Tu cliente es ${scenario.tipoCliente}. ${scenario.vehiculoInteres ? `Está interesado en: ${scenario.vehiculoInteres}` : ''} ¡Comienza la conversación!`,
        sender: 'cliente_ia',
        timestamp: new Date().toISOString()
      };
      
      setMessages([welcomeMessage]);
      
    } catch (error) {
      console.error('Error starting simulation:', error);
      toast.error('Error al iniciar la simulación');
      setIsSimulating(false);
    }
  };

  const sendMessage = async (message: string = currentMessage, isStart = false) => {
    if (!message.trim() && !isStart) return;
    if (isTyping) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content: message,
      sender: 'vendedor',
      timestamp: new Date().toISOString()
    };

    if (!isStart) {
      setMessages(prev => [...prev, userMessage]);
      setCurrentMessage('');
    }
    setIsTyping(true);

    try {
      const response = await fetch('/api/roleplay/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenarioId: scenario?.id,
          message: isStart ? undefined : message,
          sessionId: sessionId
        })
      });

      if (!response.ok) throw new Error('Error en la simulación');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let aiResponseContent = '';

      while (true) {
        const { done, value } = await reader?.read() || {};
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') break;
            
            try {
              const parsed = JSON.parse(data);
              
              if (parsed.status === 'streaming' && parsed.content) {
                aiResponseContent += parsed.content;
                // Actualizar mensaje en tiempo real
                setMessages(prev => {
                  const newMessages = [...prev];
                  const lastMessage = newMessages[newMessages.length - 1];
                  
                  if (lastMessage?.sender === 'cliente_ia') {
                    lastMessage.content = buffer + aiResponseContent;
                  } else {
                    newMessages.push({
                      id: `ai-${Date.now()}`,
                      content: buffer + aiResponseContent,
                      sender: 'cliente_ia',
                      timestamp: new Date().toISOString()
                    });
                  }
                  
                  return newMessages;
                });
              } else if (parsed.status === 'completed') {
                setSessionId(parsed.sessionId);
                aiResponseContent = parsed.response;
                
                // Mensaje final del AI
                const aiMessage: Message = {
                  id: `ai-${Date.now()}`,
                  content: aiResponseContent,
                  sender: 'cliente_ia',
                  timestamp: new Date().toISOString()
                };

                setMessages(prev => {
                  const filtered = prev.filter(m => !m.id.startsWith('ai-temp'));
                  return [...filtered, aiMessage];
                });
                
                break;
              }
            } catch (e) {
              // Ignorar errores de parsing
            }
          }
        }
      }

    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Error en la comunicación');
    } finally {
      setIsTyping(false);
    }
  };

  const finishSession = async () => {
    if (!sessionId) return;

    try {
      setLoading(true);
      
      // Finalizar sesión
      const finishResponse = await fetch('/api/roleplay/simulate', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          ventaLograda: true, // Esto se podría hacer más sofisticado
          clienteSatisfecho: true,
          observaciones: `Sesión completada en ${Math.floor(sessionDuration / 60)} minutos`
        })
      });

      if (!finishResponse.ok) throw new Error('Error finalizando sesión');

      // Evaluar sesión automáticamente
      const evaluateResponse = await fetch('/api/roleplay/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      });

      if (evaluateResponse.ok) {
        const evalResult = await evaluateResponse.json();
        setEvaluation(evalResult.evaluation);
        setShowEvaluation(true);
      }

      setSessionCompleted(true);
      setIsSimulating(false);
      
      toast.success('¡Sesión completada! Revisando tu desempeño...');
      
      if (onComplete) {
        onComplete({
          sessionId,
          duration: sessionDuration,
          messageCount: messages.length
        });
      }

    } catch (error) {
      console.error('Error finishing session:', error);
      toast.error('Error al finalizar la sesión');
    } finally {
      setLoading(false);
    }
  };

  const resetSimulation = () => {
    setMessages([]);
    setCurrentMessage('');
    setIsSimulating(false);
    setSessionId(null);
    setSessionStarted(false);
    setSessionCompleted(false);
    setIsTyping(false);
    setSessionDuration(0);
    setEvaluation(null);
    setShowEvaluation(false);
    startTimeRef.current = new Date();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 85) return 'bg-green-100 text-green-800';
    if (score >= 70) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  if (!scenario) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Target className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-800 mb-2">
            Selecciona un Escenario
          </h3>
          <p className="text-slate-600">
            Elige un escenario de role play para comenzar tu entrenamiento
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header del Simulador */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-blue-600" />
                {scenario.titulo}
              </CardTitle>
              <div className="flex items-center gap-4 text-sm text-slate-600">
                <Badge variant="outline">{scenario.categoria}</Badge>
                <Badge variant="outline">{scenario.tipoCliente}</Badge>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {scenario.duracionEstimada} min
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {sessionStarted && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-500" />
                  <span className="font-mono text-sm">
                    {formatTime(sessionDuration)}
                  </span>
                </div>
              )}
              
              {!sessionStarted ? (
                <Button onClick={startSimulation} className="gap-2">
                  <Play className="w-4 h-4" />
                  Comenzar Simulación
                </Button>
              ) : sessionCompleted ? (
                <Button onClick={resetSimulation} variant="outline" className="gap-2">
                  <RotateCcw className="w-4 h-4" />
                  Nueva Simulación
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button 
                    onClick={finishSession} 
                    variant="outline"
                    disabled={loading}
                  >
                    {loading ? 'Evaluando...' : 'Finalizar'}
                  </Button>
                  <Button 
                    onClick={resetSimulation} 
                    variant="ghost" 
                    size="sm"
                    className="gap-2"
                  >
                    <Square className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Chat Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="h-[600px] flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Conversación de Venta
              </CardTitle>
            </CardHeader>
            
            <CardContent className="flex-1 flex flex-col p-4">
              {/* Messages Area */}
              <ScrollArea className="flex-1 pr-4">
                <div className="space-y-4">
                  <AnimatePresence>
                    {messages.map((message) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className={`flex ${
                          message.sender === 'vendedor' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg px-4 py-3 ${
                            message.sender === 'vendedor'
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            {message.sender === 'vendedor' ? (
                              <User className="w-4 h-4" />
                            ) : (
                              <Bot className="w-4 h-4" />
                            )}
                            <span className="text-xs opacity-75">
                              {message.sender === 'vendedor' ? 'Tú' : 'Cliente'}
                            </span>
                          </div>
                          <p className="text-sm leading-relaxed">
                            {message.content}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  
                  {isTyping && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex justify-start"
                    >
                      <div className="bg-slate-100 rounded-lg px-4 py-3 max-w-[80%]">
                        <div className="flex items-center gap-2">
                          <Bot className="w-4 h-4" />
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
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
                <div className="mt-4 pt-4 border-t">
                  <div className="flex gap-2">
                    <Input
                      value={currentMessage}
                      onChange={(e) => setCurrentMessage(e.target.value)}
                      placeholder="Escribe tu respuesta como vendedor..."
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                      disabled={isTyping}
                    />
                    <Button 
                      onClick={() => sendMessage()}
                      disabled={!currentMessage.trim() || isTyping}
                      size="sm"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Sidebar Info */}
        <div className="space-y-4">
          {/* Scenario Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Información del Escenario</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium text-slate-700 mb-1">Descripción:</p>
                <p className="text-sm text-slate-600">{scenario.descripcion}</p>
              </div>
              
              {scenario.vehiculoInteres && (
                <div>
                  <p className="text-sm font-medium text-slate-700 mb-1">Vehículo de Interés:</p>
                  <p className="text-sm text-slate-600">{scenario.vehiculoInteres}</p>
                </div>
              )}
              
              {scenario.presupuestoCliente && (
                <div>
                  <p className="text-sm font-medium text-slate-700 mb-1">Presupuesto:</p>
                  <p className="text-sm text-slate-600">
                    ${scenario.presupuestoCliente.toLocaleString()}
                  </p>
                </div>
              )}
              
              <div>
                <p className="text-sm font-medium text-slate-700 mb-1">Nivel de Dificultad:</p>
                <Badge variant="outline">{scenario.nivelDificultad}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Session Stats */}
          {sessionStarted && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Estadísticas de Sesión</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Mensajes enviados:</span>
                  <span className="font-semibold">
                    {messages.filter(m => m.sender === 'vendedor').length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Duración:</span>
                  <span className="font-semibold">{formatTime(sessionDuration)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Progreso:</span>
                  <Progress 
                    value={(sessionDuration / (scenario.duracionEstimada * 60)) * 100} 
                    className="w-20"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Live Evaluation */}
          {showEvaluation && evaluation && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Award className="w-5 h-5 text-yellow-600" />
                  Tu Evaluación
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold mb-2">
                    <span className={getScoreColor(evaluation.puntuacionGeneral)}>
                      {evaluation.puntuacionGeneral}
                    </span>
                    <span className="text-slate-400 text-lg">/100</span>
                  </div>
                  <Badge className={getScoreBadgeColor(evaluation.puntuacionGeneral)}>
                    {evaluation.puntuacionGeneral >= 85 ? '🏆 Excelente' :
                     evaluation.puntuacionGeneral >= 70 ? '👍 Bien' : '💪 A Mejorar'}
                  </Badge>
                </div>

                <div>
                  <p className="text-sm font-medium text-slate-700 mb-2">Fortalezas:</p>
                  <div className="space-y-1">
                    {evaluation.fortalezas?.slice(0, 2).map((fortaleza: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span className="text-xs text-slate-600">{fortaleza}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-slate-700 mb-2">A Mejorar:</p>
                  <div className="space-y-1">
                    {evaluation.areasDeporMejora?.slice(0, 2).map((area: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                        <span className="text-xs text-slate-600">{area}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {onEvaluate && (
                  <Button 
                    onClick={() => onEvaluate(sessionId!)}
                    variant="outline" 
                    size="sm"
                    className="w-full gap-2"
                  >
                    <TrendingUp className="w-4 h-4" />
                    Ver Evaluación Completa
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
