
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  CheckCircle,
  Clock,
  Users,
  TrendingDown,
  Zap,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

interface Alerta {
  id: string | number;
  tipo: string;
  prioridad: 'alta' | 'media' | 'baja';
  titulo: string;
  mensaje: string;
  datos?: any;
  accionSugerida?: string;
  fechaCreacion: string | Date;
}

interface AlertPanelProps {
  alertas: Alerta[];
  onDismiss?: (alertaId: string | number) => void;
}

export default function AlertPanel({ alertas, onDismiss }: AlertPanelProps) {
  const [alertasVisibles, setAlertasVisibles] = useState<Alerta[]>(alertas);

  const getAlertIcon = (tipo: string, prioridad: string) => {
    switch (prioridad) {
      case 'alta':
        return AlertTriangle;
      case 'media':
        return AlertCircle;
      default:
        return Info;
    }
  };

  const getAlertColor = (prioridad: string) => {
    switch (prioridad) {
      case 'alta':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          icon: 'text-red-600',
          text: 'text-red-800',
          badge: 'bg-red-100 text-red-800'
        };
      case 'media':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          icon: 'text-yellow-600',
          text: 'text-yellow-800',
          badge: 'bg-yellow-100 text-yellow-800'
        };
      default:
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          icon: 'text-blue-600',
          text: 'text-blue-800',
          badge: 'bg-blue-100 text-blue-800'
        };
    }
  };

  const getAccionIcon = (accion: string) => {
    switch (accion) {
      case 'reasignar_vendedor':
        return Users;
      case 'redistribuir_leads':
        return Users;
      case 'configurar_vendedores_guardia':
        return Clock;
      case 'sesion_coaching':
        return TrendingDown;
      case 'revisar_procesamiento_ia':
        return Zap;
      default:
        return CheckCircle;
    }
  };

  const getAccionTexto = (accion: string) => {
    switch (accion) {
      case 'reasignar_vendedor':
        return 'Reasignar Vendedor';
      case 'redistribuir_leads':
        return 'Redistribuir Leads';
      case 'configurar_vendedores_guardia':
        return 'Configurar Guardia';
      case 'sesion_coaching':
        return 'Programar Coaching';
      case 'revisar_procesamiento_ia':
        return 'Revisar IA';
      default:
        return 'Tomar Acción';
    }
  };

  const handleDismiss = (alertaId: string | number) => {
    setAlertasVisibles(prev => prev.filter(a => a.id !== alertaId));
    if (onDismiss) {
      onDismiss(alertaId);
    }
  };

  const formatFecha = (fecha: string | Date) => {
    const date = new Date(fecha);
    return date.toLocaleString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit',
      day: '2-digit',
      month: 'short'
    });
  };

  if (alertasVisibles.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Panel de Alertas
          </CardTitle>
          <CardDescription>
            Sistema de monitoreo en tiempo real
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-800 mb-2">
              Todo en orden
            </h3>
            <p className="text-slate-500">
              No hay alertas críticas en este momento. El sistema está funcionando correctamente.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Panel de Alertas
            </CardTitle>
            <CardDescription>
              {alertasVisibles.length} alertas requieren atención
            </CardDescription>
          </div>
          
          <div className="flex gap-2">
            <Badge variant="destructive" className="gap-1">
              <AlertTriangle className="w-3 h-3" />
              {alertasVisibles.filter(a => a.prioridad === 'alta').length} Críticas
            </Badge>
            <Badge variant="outline" className="gap-1">
              <AlertCircle className="w-3 h-3" />
              {alertasVisibles.filter(a => a.prioridad === 'media').length} Medias
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <Info className="w-3 h-3" />
              {alertasVisibles.filter(a => a.prioridad === 'baja').length} Bajas
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <AnimatePresence>
          <div className="space-y-4">
            {alertasVisibles.map((alerta, index) => {
              const AlertIcon = getAlertIcon(alerta.tipo, alerta.prioridad);
              const colors = getAlertColor(alerta.prioridad);
              const AccionIcon = getAccionIcon(alerta.accionSugerida || '');
              
              return (
                <motion.div
                  key={alerta.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className={`p-4 border rounded-lg ${colors.bg} ${colors.border} transition-all duration-200 hover:shadow-md`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors.badge}`}>
                      <AlertIcon className={`w-5 h-5 ${colors.icon}`} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className={`font-semibold ${colors.text}`}>
                            {alerta.titulo}
                          </h4>
                          <p className={`text-sm ${colors.text} opacity-80 mt-1`}>
                            {alerta.mensaje}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-2 ml-4">
                          <span className="text-xs text-slate-500">
                            {formatFecha(alerta.fechaCreacion)}
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDismiss(alerta.id)}
                            className="w-6 h-6 p-0 text-slate-400 hover:text-slate-600"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {/* Datos adicionales */}
                      {alerta.datos && (
                        <div className="mb-3">
                          {Array.isArray(alerta.datos) ? (
                            <div className="space-y-1">
                              {alerta.datos.slice(0, 3).map((item: any, idx: number) => (
                                <div key={idx} className={`text-xs ${colors.text} opacity-70`}>
                                  • {typeof item === 'object' ? 
                                    (item.nombre || item.vendedor || JSON.stringify(item)) : 
                                    item}
                                </div>
                              ))}
                              {alerta.datos.length > 3 && (
                                <div className={`text-xs ${colors.text} opacity-70`}>
                                  +{alerta.datos.length - 3} más...
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className={`text-xs ${colors.text} opacity-70`}>
                              {typeof alerta.datos === 'object' ? 
                                JSON.stringify(alerta.datos, null, 2) : 
                                alerta.datos}
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Acción sugerida */}
                      {alerta.accionSugerida && (
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className={`gap-1 ${colors.badge} text-xs`}>
                            <AccionIcon className="w-3 h-3" />
                            {getAccionTexto(alerta.accionSugerida)}
                          </Badge>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            className={`text-xs h-7 ${colors.text} hover:${colors.bg}`}
                            onClick={() => {
                              // Aquí implementar la acción específica
                              console.log('Ejecutar acción:', alerta.accionSugerida);
                            }}
                          >
                            Ejecutar
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </AnimatePresence>
        
        {alertasVisibles.length > 5 && (
          <div className="mt-4 text-center">
            <Button variant="outline" size="sm">
              Ver todas las alertas ({alertasVisibles.length})
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
