
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Target,
  User,
  Users,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  BarChart3,
  Zap,
  RefreshCw,
  Crown,
  Shield
} from 'lucide-react';
import { toast } from 'sonner';

interface AsignacionManualModalProps {
  open: boolean;
  onClose: () => void;
  onAsignacionRealizada: () => void;
}

interface VendedorDisponible {
  id: string;
  nombre: string;
  apellido?: string;
  nombreCompleto: string;
  cargaActual: number;
  metaDelDia: number;
  porcentajeMeta: number;
  recomendado: boolean;
  sobrecargado: boolean;
}

interface ProspectoDisponible {
  id: number;
  nombre: string;
  apellido?: string;
  telefono?: string;
  origenLead?: string;
  nivelUrgencia?: string;
  fechaContacto: string;
  estadoAsignacion: string;
}

interface EstadisticasAsignacion {
  cargaPromedio: number;
  maxCarga: number;
  minCarga: number;
  diferencia: number;
  hayDesbalance: boolean;
}

export function AsignacionManualModal({ open, onClose, onAsignacionRealizada }: AsignacionManualModalProps) {
  const [vendedoresDisponibles, setVendedoresDisponibles] = useState<VendedorDisponible[]>([]);
  const [prospectosDisponibles, setProspectosDisponibles] = useState<ProspectoDisponible[]>([]);
  const [estadisticas, setEstadisticas] = useState<EstadisticasAsignacion | null>(null);
  const [hayGuardia, setHayGuardia] = useState(false);
  const [vendedorRecomendado, setVendedorRecomendado] = useState<{ vendedorId: string; razon: string } | null>(null);

  // Datos del formulario
  const [prospectoSeleccionado, setProspectoSeleccionado] = useState('');
  const [vendedorSeleccionado, setVendedorSeleccionado] = useState('');
  const [prioridad, setPrioridad] = useState('NORMAL');
  const [observaciones, setObservaciones] = useState('');
  const [forzarDesbalance, setForzarDesbalance] = useState(false);

  const [loading, setLoading] = useState(false);
  const [asignando, setAsignando] = useState(false);
  const [alertaDesbalance, setAlertaDesbalance] = useState<any>(null);

  // Cargar datos de asignación
  useEffect(() => {
    if (open) {
      cargarDatosAsignacion();
      cargarProspectosDisponibles();
    }
  }, [open]);

  const cargarDatosAsignacion = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/centro-leads/asignar');
      
      if (!response.ok) {
        throw new Error('Error al cargar datos de asignación');
      }

      const data = await response.json();
      setVendedoresDisponibles(data.vendedores || []);
      setEstadisticas(data.estadisticas);
      setHayGuardia(data.hayGuardia);
      setVendedorRecomendado(data.recomendacion);

      // Auto-seleccionar vendedor recomendado
      if (data.recomendacion?.vendedorId && !vendedorSeleccionado) {
        setVendedorSeleccionado(data.recomendacion.vendedorId);
      }

    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar vendedores disponibles');
    } finally {
      setLoading(false);
    }
  };

  const cargarProspectosDisponibles = async () => {
    try {
      // Obtener prospectos pendientes de asignación
      const response = await fetch('/api/prospectos?estadoAsignacion=PENDIENTE&limite=20');
      if (response.ok) {
        const data = await response.json();
        setProspectosDisponibles(data.prospectos || []);
      }
    } catch (error) {
      console.error('Error al cargar prospectos:', error);
    }
  };

  // Resetear formulario al cerrar
  useEffect(() => {
    if (!open) {
      setProspectoSeleccionado('');
      setVendedorSeleccionado('');
      setPrioridad('NORMAL');
      setObservaciones('');
      setForzarDesbalance(false);
      setAlertaDesbalance(null);
    }
  }, [open]);

  const realizarAsignacion = async () => {
    if (!prospectoSeleccionado || !vendedorSeleccionado) {
      toast.error('Debe seleccionar prospecto y vendedor');
      return;
    }

    try {
      setAsignando(true);

      const payload = {
        prospectoId: parseInt(prospectoSeleccionado),
        vendedorId: vendedorSeleccionado,
        prioridad,
        metodo: 'MANUAL',
        observaciones,
        forzarDesbalance
      };

      const response = await fetch('/api/centro-leads/asignar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const resultado = await response.json();

      if (!response.ok) {
        if (response.status === 409 && resultado.error === 'DESBALANCE_DETECTADO') {
          // Mostrar alerta de desbalance
          setAlertaDesbalance(resultado.alertaDesbalance);
          return;
        }
        throw new Error(resultado.message || 'Error al asignar lead');
      }

      toast.success(`Lead asignado exitosamente a ${resultado.vendedorAsignado.nombre}`);
      onAsignacionRealizada();
      onClose();

    } catch (error) {
      console.error('Error:', error);
      toast.error(error instanceof Error ? error.message : 'Error al asignar lead');
    } finally {
      setAsignando(false);
    }
  };

  const forzarAsignacion = () => {
    setForzarDesbalance(true);
    setAlertaDesbalance(null);
    realizarAsignacion();
  };

  const vendedorSeleccionadoInfo = vendedoresDisponibles.find(v => v.id === vendedorSeleccionado);
  const prospectoSeleccionadoInfo = prospectosDisponibles.find(p => p.id.toString() === prospectoSeleccionado);

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center text-purple-700">
            <Target className="h-5 w-5 mr-2" />
            Asignación Manual de Lead
          </DialogTitle>
          <DialogDescription>
            Asigne un prospecto específico a un vendedor de guardia con control de balance de carga
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Estado de Guardia */}
          {!hayGuardia ? (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong>Sin Guardia Definida:</strong> No hay vendedores de guardia disponibles para asignación.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>Guardia Activa:</strong> {vendedoresDisponibles.length} vendedores disponibles para asignación.
              </AlertDescription>
            </Alert>
          )}

          {/* Alerta de Desbalance */}
          {alertaDesbalance && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Alert className="border-amber-200 bg-amber-50">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800">
                  <strong>Desbalance Detectado:</strong> Esta asignación creará una diferencia de {alertaDesbalance?.diferencia} leads.
                  <div className="mt-3 space-y-2">
                    <div><strong>Vendedor seleccionado:</strong> {alertaDesbalance?.vendedorSeleccionado.nombre} (carga: {alertaDesbalance?.vendedorSeleccionado.cargaActual} → {alertaDesbalance?.vendedorSeleccionado.cargaNueva})</div>
                    {alertaDesbalance?.vendedorSugerido && (
                      <div><strong>Vendedor sugerido:</strong> {alertaDesbalance.vendedorSugerido.nombre} (carga: {alertaDesbalance.vendedorSugerido.carga})</div>
                    )}
                  </div>
                  <div className="mt-4 space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setAlertaDesbalance(null)}
                      className="border-amber-300"
                    >
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      onClick={forzarAsignacion}
                      disabled={asignando}
                      className="bg-amber-600 hover:bg-amber-700 text-white"
                    >
                      <Shield className="h-3 w-3 mr-1" />
                      Forzar Asignación
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            </motion.div>
          )}

          {/* Estadísticas de Balance */}
          {estadisticas && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-3 rounded-lg text-center">
                <div className="text-lg font-bold text-blue-600">{estadisticas.cargaPromedio}</div>
                <div className="text-xs text-blue-500">Carga Promedio</div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg text-center">
                <div className="text-lg font-bold text-green-600">{estadisticas.minCarga}</div>
                <div className="text-xs text-green-500">Carga Mínima</div>
              </div>
              <div className="bg-orange-50 p-3 rounded-lg text-center">
                <div className="text-lg font-bold text-orange-600">{estadisticas.maxCarga}</div>
                <div className="text-xs text-orange-500">Carga Máxima</div>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg text-center">
                <div className="text-lg font-bold text-purple-600">{estadisticas.diferencia}</div>
                <div className="text-xs text-purple-500">Diferencia</div>
              </div>
            </div>
          )}

          {hayGuardia && (
            <>
              {/* Selección de Prospecto */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="prospecto" className="flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    Seleccionar Prospecto
                  </Label>
                  <Select onValueChange={setProspectoSeleccionado}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Seleccione un prospecto pendiente..." />
                    </SelectTrigger>
                    <SelectContent>
                      {prospectosDisponibles.map((prospecto) => (
                        <SelectItem key={prospecto.id} value={prospecto.id.toString()}>
                          <div className="flex items-center justify-between w-full">
                            <span>{prospecto.nombre} {prospecto.apellido}</span>
                            <div className="flex items-center space-x-2 ml-4">
                              <Badge variant="outline" className="text-xs">
                                {prospecto.origenLead}
                              </Badge>
                              {prospecto.nivelUrgencia && (
                                <Badge 
                                  variant={prospecto.nivelUrgencia === 'ALTA' ? 'destructive' : 'secondary'}
                                  className="text-xs"
                                >
                                  {prospecto.nivelUrgencia}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {prospectoSeleccionadoInfo && (
                    <div className="mt-2 p-3 bg-gray-50 rounded-lg text-sm">
                      <div><strong>Teléfono:</strong> {prospectoSeleccionadoInfo.telefono}</div>
                      <div><strong>Origen:</strong> {prospectoSeleccionadoInfo.origenLead}</div>
                      <div><strong>Fecha Contacto:</strong> {new Date(prospectoSeleccionadoInfo.fechaContacto).toLocaleString()}</div>
                    </div>
                  )}
                </div>

                {/* Selección de Vendedor */}
                <div>
                  <Label htmlFor="vendedor" className="flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    Seleccionar Vendedor de Guardia
                  </Label>
                  <Select onValueChange={setVendedorSeleccionado} value={vendedorSeleccionado}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Seleccione un vendedor..." />
                    </SelectTrigger>
                    <SelectContent>
                      {vendedoresDisponibles.map((vendedor) => (
                        <SelectItem key={vendedor.id} value={vendedor.id}>
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center space-x-2">
                              <span>{vendedor.nombreCompleto}</span>
                              {vendedor.recomendado && (
                                <Crown className="h-3 w-3 text-yellow-500" />
                              )}
                              {vendedor.sobrecargado && (
                                <AlertTriangle className="h-3 w-3 text-red-500" />
                              )}
                            </div>
                            <div className="flex items-center space-x-2 ml-4">
                              <Badge 
                                variant={vendedor.sobrecargado ? 'destructive' : vendedor.recomendado ? 'default' : 'secondary'}
                                className="text-xs"
                              >
                                {vendedor.cargaActual}/{vendedor.metaDelDia}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                {vendedor.porcentajeMeta}%
                              </span>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {vendedorSeleccionadoInfo && (
                    <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-medium">{vendedorSeleccionadoInfo.nombreCompleto}</div>
                        <div className="flex items-center space-x-2">
                          {vendedorSeleccionadoInfo.recomendado && (
                            <Badge variant="default" className="text-xs">
                              <Crown className="h-3 w-3 mr-1" />
                              Recomendado
                            </Badge>
                          )}
                          {vendedorSeleccionadoInfo.sobrecargado && (
                            <Badge variant="destructive" className="text-xs">
                              Sobrecargado
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Carga Actual:</span>
                          <span>{vendedorSeleccionadoInfo.cargaActual}/{vendedorSeleccionadoInfo.metaDelDia}</span>
                        </div>
                        <Progress 
                          value={vendedorSeleccionadoInfo.porcentajeMeta} 
                          className="h-2"
                        />
                        <div className="text-xs text-gray-500">
                          {vendedorSeleccionadoInfo.porcentajeMeta}% de la meta diaria
                        </div>
                      </div>
                    </div>
                  )}

                  {vendedorRecomendado && vendedorSeleccionado === vendedorRecomendado.vendedorId && (
                    <Alert className="border-green-200 bg-green-50 mt-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800 text-sm">
                        <strong>Selección Recomendada:</strong> {vendedorRecomendado.razon}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                {/* Configuración de Asignación */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="prioridad" className="flex items-center">
                      <Zap className="h-4 w-4 mr-2" />
                      Prioridad de Asignación
                    </Label>
                    <Select onValueChange={setPrioridad} value={prioridad}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BAJA">Baja</SelectItem>
                        <SelectItem value="NORMAL">Normal</SelectItem>
                        <SelectItem value="ALTA">Alta</SelectItem>
                        <SelectItem value="URGENTE">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Observaciones */}
                <div>
                  <Label htmlFor="observaciones">Observaciones de la Asignación</Label>
                  <Textarea
                    id="observaciones"
                    placeholder="Motivos o notas especiales para esta asignación manual..."
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    className="mt-1 resize-none"
                    rows={3}
                  />
                </div>
              </div>

              <Separator />

              {/* Botones de Acción */}
              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={asignando}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={realizarAsignacion}
                  disabled={asignando || !prospectoSeleccionado || !vendedorSeleccionado}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {asignando ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Asignando...
                    </>
                  ) : (
                    <>
                      <Target className="h-4 w-4 mr-2" />
                      Asignar Lead
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
