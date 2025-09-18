
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Store,
  Clock,
  AlertTriangle,
  CheckCircle,
  User,
  Car,
  DollarSign,
  MessageSquare,
  Users,
  Zap,
  RefreshCw,
  Eye,
  Camera
} from 'lucide-react';
import { toast } from 'sonner';

interface CapturaVisitaModalProps {
  open: boolean;
  onClose: () => void;
  onProspectoCreado: () => void;
  guardiaDefinida: boolean;
}

interface VehiculoCatalogo {
  id: number;
  marca: string;
  modelo: string;
  year: number;
}

export function CapturaVisitaModal({ open, onClose, onProspectoCreado, guardiaDefinida }: CapturaVisitaModalProps) {
  // Datos del prospecto
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    telefono: '',
    email: '',
    vehiculoInteresId: '',
    vehiculoInteres: '',
    presupuesto: '',
    nivelUrgencia: 'MEDIA',
    tiempoEsperado: 'FLEXIBLE',
    acompanantes: '1',
    observaciones: ''
  });

  // Datos específicos de visita
  const [datosVisita, setDatosVisita] = useState({
    tipoVisita: 'informacion',
    tiempoVisita: '',
    formaPagoPreferida: 'credito',
    horaIngreso: new Date().toLocaleTimeString('es-MX', { hour12: false, hour: '2-digit', minute: '2-digit' })
  });

  const [vehiculosCatalogo, setVehiculosCatalogo] = useState<VehiculoCatalogo[]>([]);
  const [loading, setLoading] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [paso, setPaso] = useState(1); // 1: datos basicos, 2: detalles visita, 3: confirmacion

  // Datos preservados para cuando no hay guardia
  const [datosPreservados, setDatosPreservados] = useState<any>(null);
  const [esperandoGuardia, setEsperandoGuardia] = useState(false);

  // Cargar vehículos del catálogo
  useEffect(() => {
    if (open) {
      cargarVehiculos();
    }
  }, [open]);

  const cargarVehiculos = async () => {
    try {
      const response = await fetch('/api/vehiculos-catalogo/dropdown');
      if (response.ok) {
        const data = await response.json();
        setVehiculosCatalogo(data.vehiculos || []);
      }
    } catch (error) {
      console.error('Error al cargar vehículos:', error);
    }
  };

  // Resetear formulario al abrir/cerrar
  useEffect(() => {
    if (!open) {
      setFormData({
        nombre: '',
        apellido: '',
        telefono: '',
        email: '',
        vehiculoInteresId: '',
        vehiculoInteres: '',
        presupuesto: '',
        nivelUrgencia: 'MEDIA',
        tiempoEsperado: 'FLEXIBLE',
        acompanantes: '1',
        observaciones: ''
      });
      setDatosVisita({
        tipoVisita: 'informacion',
        tiempoVisita: '',
        formaPagoPreferida: 'credito',
        horaIngreso: new Date().toLocaleTimeString('es-MX', { hour12: false, hour: '2-digit', minute: '2-digit' })
      });
      setPaso(1);
      setEsperandoGuardia(false);
      setDatosPreservados(null);
    }
  }, [open]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleVisitaChange = (field: string, value: string) => {
    setDatosVisita(prev => ({ ...prev, [field]: value }));
  };

  const validarPaso1 = () => {
    return formData.nombre.trim() && formData.telefono.trim();
  };

  const validarPaso2 = () => {
    return datosVisita.tipoVisita && formData.acompanantes;
  };

  const crearProspecto = async () => {
    if (!validarPaso1()) {
      toast.error('Nombre y teléfono son requeridos');
      return;
    }

    try {
      setGuardando(true);

      const payload = {
        ...formData,
        ...datosVisita,
        origenLead: 'VISITA_SHOWROOM',
        vehiculoInteresId: formData.vehiculoInteresId ? parseInt(formData.vehiculoInteresId) : null,
        presupuesto: formData.presupuesto ? parseFloat(formData.presupuesto) : null,
        acompanantes: parseInt(formData.acompanantes) || 1,
        tiempoVisita: datosVisita.tiempoVisita ? parseInt(datosVisita.tiempoVisita) : null
      };

      const response = await fetch('/api/centro-leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const resultado = await response.json();

      if (!response.ok) {
        if (resultado.error === 'NO_GUARDIA_DEFINIDA') {
          // Preservar datos y mostrar estado de espera
          setDatosPreservados(payload);
          setEsperandoGuardia(true);
          toast.warning('Datos preservados. Esperando que el gerente defina vendedores de guardia...');
          return;
        }
        throw new Error(resultado.message || 'Error al crear prospecto');
      }

      toast.success(`Prospecto creado y asignado a ${resultado.vendedorAsignado.nombre}`);
      onProspectoCreado();
      onClose();

    } catch (error) {
      console.error('Error:', error);
      toast.error(error instanceof Error ? error.message : 'Error al crear prospecto');
    } finally {
      setGuardando(false);
    }
  };

  // Función para intentar guardar cuando se detecte guardia
  const intentarGuardarPreservado = async () => {
    if (!datosPreservados) return;

    try {
      setGuardando(true);
      
      const response = await fetch('/api/centro-leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(datosPreservados)
      });

      if (response.ok) {
        const resultado = await response.json();
        toast.success(`Prospecto guardado y asignado a ${resultado.vendedorAsignado.nombre}`);
        onProspectoCreado();
        onClose();
      } else {
        const error = await response.json();
        if (error.error !== 'NO_GUARDIA_DEFINIDA') {
          throw new Error(error.message);
        }
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al guardar prospecto preservado');
    } finally {
      setGuardando(false);
    }
  };

  // Verificar guardia cada 30 segundos si estamos esperando
  useEffect(() => {
    if (esperandoGuardia && !guardiaDefinida) {
      const interval = setInterval(() => {
        // Verificar si ahora hay guardia definida
        fetch('/api/centro-leads')
          .then(res => res.json())
          .then(data => {
            if (data.guardiaDefinida) {
              setEsperandoGuardia(false);
              intentarGuardarPreservado();
            }
          })
          .catch(console.error);
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [esperandoGuardia, guardiaDefinida]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center text-emerald-700">
            <Store className="h-5 w-5 mr-2" />
            Captura de Visita al Showroom
          </DialogTitle>
          <DialogDescription>
            Registre los datos del cliente que visita el showroom
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Indicador de estado de guardia */}
          {esperandoGuardia && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Alert className="border-amber-200 bg-amber-50">
                <Clock className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800">
                  <strong>Datos Preservados:</strong> Esperando que el Gerente de Ventas defina vendedores de guardia.
                  Los datos no se perderán y se guardará automáticamente cuando la guardia esté lista.
                  <div className="mt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={intentarGuardarPreservado}
                      disabled={guardando}
                      className="border-amber-300"
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Verificar Guardia
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            </motion.div>
          )}

          {!guardiaDefinida && !esperandoGuardia && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong>Sin Guardia Definida:</strong> Puede capturar los datos del visitante, 
                pero no se guardarán hasta que haya vendedores de guardia disponibles.
              </AlertDescription>
            </Alert>
          )}

          {/* Progreso */}
          <div className="flex items-center justify-between">
            <div className="flex space-x-2">
              {[1, 2, 3].map((num) => (
                <div
                  key={num}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    paso >= num
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {num}
                </div>
              ))}
            </div>
            <Badge variant="outline">
              {paso === 1 ? 'Datos del Visitante' : paso === 2 ? 'Detalles de Visita' : 'Confirmación'}
            </Badge>
          </div>

          <AnimatePresence mode="wait">
            {paso === 1 && (
              <motion.div
                key="paso1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nombre" className="flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      Nombre del Visitante *
                    </Label>
                    <Input
                      id="nombre"
                      placeholder="Nombre del cliente"
                      value={formData.nombre}
                      onChange={(e) => handleInputChange('nombre', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="apellido">Apellido</Label>
                    <Input
                      id="apellido"
                      placeholder="Apellido del cliente"
                      value={formData.apellido}
                      onChange={(e) => handleInputChange('apellido', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="telefono" className="flex items-center">
                      <Store className="h-4 w-4 mr-2" />
                      Teléfono *
                    </Label>
                    <Input
                      id="telefono"
                      placeholder="Número de teléfono"
                      value={formData.telefono}
                      onChange={(e) => handleInputChange('telefono', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="acompanantes" className="flex items-center">
                      <Users className="h-4 w-4 mr-2" />
                      Número de Acompañantes
                    </Label>
                    <Select onValueChange={(value) => handleInputChange('acompanantes', value)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="¿Cuántas personas?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Solo (1 persona)</SelectItem>
                        <SelectItem value="2">Pareja (2 personas)</SelectItem>
                        <SelectItem value="3">3 personas</SelectItem>
                        <SelectItem value="4">4 personas</SelectItem>
                        <SelectItem value="5">5+ personas (familia)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="vehiculo" className="flex items-center">
                    <Car className="h-4 w-4 mr-2" />
                    Vehículo de Interés
                  </Label>
                  <Select onValueChange={(value) => handleInputChange('vehiculoInteresId', value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="¿Qué vehículo les interesa?" />
                    </SelectTrigger>
                    <SelectContent>
                      {vehiculosCatalogo.map((vehiculo) => (
                        <SelectItem key={vehiculo.id} value={vehiculo.id.toString()}>
                          {vehiculo.marca} {vehiculo.modelo} {vehiculo.year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="O escriba el vehículo específico"
                    value={formData.vehiculoInteres}
                    onChange={(e) => handleInputChange('vehiculoInteres', e.target.value)}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="presupuesto" className="flex items-center">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Presupuesto Mencionado
                  </Label>
                  <Input
                    id="presupuesto"
                    type="number"
                    placeholder="¿Cuál es su presupuesto?"
                    value={formData.presupuesto}
                    onChange={(e) => handleInputChange('presupuesto', e.target.value)}
                    className="mt-1"
                  />
                </div>
              </motion.div>
            )}

            {paso === 2 && (
              <motion.div
                key="paso2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tipoVisita" className="flex items-center">
                      <Eye className="h-4 w-4 mr-2" />
                      Tipo de Visita
                    </Label>
                    <Select onValueChange={(value) => handleVisitaChange('tipoVisita', value)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="¿Qué buscan?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="informacion">Solo Información</SelectItem>
                        <SelectItem value="test_drive">Test Drive</SelectItem>
                        <SelectItem value="cotizacion">Cotización</SelectItem>
                        <SelectItem value="entrega">Entrega de Vehículo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="tiempoVisita" className="flex items-center">
                      <Clock className="h-4 w-4 mr-2" />
                      Tiempo de Visita (minutos)
                    </Label>
                    <Input
                      id="tiempoVisita"
                      type="number"
                      placeholder="30"
                      value={datosVisita.tiempoVisita}
                      onChange={(e) => handleVisitaChange('tiempoVisita', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nivelInteres" className="flex items-center">
                      <Zap className="h-4 w-4 mr-2" />
                      Nivel de Interés
                    </Label>
                    <Select onValueChange={(value) => handleInputChange('nivelUrgencia', value)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="¿Qué tan interesados están?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BAJA">Bajo - Solo explorando</SelectItem>
                        <SelectItem value="MEDIA">Medio - Considerando opciones</SelectItem>
                        <SelectItem value="ALTA">Alto - Listos para comprar</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="formaPago">Forma de Pago Preferida</Label>
                    <Select onValueChange={(value) => handleVisitaChange('formaPagoPreferida', value)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="¿Cómo piensan pagar?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="contado">Contado</SelectItem>
                        <SelectItem value="credito">Crédito</SelectItem>
                        <SelectItem value="arrendamiento">Arrendamiento</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="tiempoEsperado">Tiempo para Decisión</Label>
                  <Select onValueChange={(value) => handleInputChange('tiempoEsperado', value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="¿Cuándo planean decidir?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INMEDIATO">Hoy mismo</SelectItem>
                      <SelectItem value="1_SEMANA">Esta semana</SelectItem>
                      <SelectItem value="1_MES">Este mes</SelectItem>
                      <SelectItem value="FLEXIBLE">No tienen prisa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="observaciones" className="flex items-center">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Observaciones de la Visita
                  </Label>
                  <Textarea
                    id="observaciones"
                    placeholder="Detalles importantes de la visita, preguntas específicas, comentarios..."
                    value={formData.observaciones}
                    onChange={(e) => handleInputChange('observaciones', e.target.value)}
                    className="mt-1 resize-none"
                    rows={3}
                  />
                </div>
              </motion.div>
            )}

            {paso === 3 && (
              <motion.div
                key="paso3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-3">Resumen de la Visita</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>Visitante:</strong> {formData.nombre} {formData.apellido}</div>
                    <div><strong>Teléfono:</strong> {formData.telefono}</div>
                    <div><strong>Acompañantes:</strong> {formData.acompanantes} {parseInt(formData.acompanantes) === 1 ? 'persona' : 'personas'}</div>
                    {formData.vehiculoInteres && <div><strong>Vehículo:</strong> {formData.vehiculoInteres}</div>}
                    {formData.presupuesto && <div><strong>Presupuesto:</strong> ${formData.presupuesto}</div>}
                    <div><strong>Tipo de Visita:</strong> {datosVisita.tipoVisita}</div>
                    <div><strong>Nivel de Interés:</strong> {formData.nivelUrgencia}</div>
                    <div><strong>Forma de Pago:</strong> {datosVisita.formaPagoPreferida}</div>
                    {datosVisita.tiempoVisita && (
                      <div><strong>Tiempo de Visita:</strong> {datosVisita.tiempoVisita} minutos</div>
                    )}
                    <div><strong>Tiempo para Decisión:</strong> {formData.tiempoEsperado}</div>
                    {formData.observaciones && (
                      <div><strong>Observaciones:</strong> {formData.observaciones}</div>
                    )}
                  </div>
                </div>

                {!guardiaDefinida && (
                  <Alert className="border-amber-200 bg-amber-50">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-800">
                      Los datos se preservarán y el prospecto se guardará automáticamente 
                      cuando haya vendedores de guardia disponibles.
                    </AlertDescription>
                  </Alert>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <Separator />

          {/* Botones de navegación */}
          <div className="flex justify-between">
            <div>
              {paso > 1 && (
                <Button
                  variant="outline"
                  onClick={() => setPaso(paso - 1)}
                  disabled={guardando}
                >
                  Anterior
                </Button>
              )}
            </div>
            
            <div className="space-x-2">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={guardando}
              >
                Cancelar
              </Button>
              
              {paso < 3 ? (
                <Button
                  onClick={() => setPaso(paso + 1)}
                  disabled={paso === 1 ? !validarPaso1() : paso === 2 ? !validarPaso2() : false}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  Siguiente
                </Button>
              ) : (
                <Button
                  onClick={crearProspecto}
                  disabled={guardando || (!guardiaDefinida && !esperandoGuardia)}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {guardando ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      {esperandoGuardia ? 'Preservando...' : 'Guardando...'}
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {guardiaDefinida ? 'Crear Prospecto' : 'Preservar Datos'}
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
