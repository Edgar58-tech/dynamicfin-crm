
'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, User, Phone, Car, Calendar, AlertTriangle, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface CalificarLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: any;
  onSuccess: () => void;
}

export function CalificarLeadModal({ isOpen, onClose, lead, onSuccess }: CalificarLeadModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [paso, setPaso] = useState<'confirmacion' | 'spcc'>('confirmacion');
  
  // Datos del lead que se pueden editar/completar
  const [datosLead, setDatosLead] = useState({
    nombre: lead?.nombre || '',
    apellido: lead?.apellido || '',
    telefono: lead?.telefono || '',
    email: lead?.email || '',
    vehiculoInteres: lead?.vehiculoInteresTexto || '',
    presupuesto: lead?.presupuesto || '',
    notas: lead?.notas || ''
  });

  useEffect(() => {
    if (lead) {
      setDatosLead({
        nombre: lead.nombre || '',
        apellido: lead.apellido || '',
        telefono: lead.telefono || '',
        email: lead.email || '',
        vehiculoInteres: lead.vehiculoInteresTexto || '',
        presupuesto: lead.presupuesto || '',
        notas: lead.notas || ''
      });
    }
  }, [lead]);

  // Iniciar proceso de calificación
  const iniciarCalificacion = async () => {
    try {
      setLoading(true);
      
      // Marcar como iniciada la calificación
      const response = await fetch('/api/vendedores/pendientes-calificacion', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prospectoId: lead.id,
          accion: 'iniciar_calificacion'
        })
      });

      if (response.ok) {
        toast.success('Calificación iniciada exitosamente');
        onSuccess();
        
        // Redirigir al formulario SPCC con el ID del prospecto
        router.push(`/dashboard/prospectos/${lead.id}?modo=spcc&origen=centro_leads`);
      } else {
        const error = await response.json();
        toast.error(error.message || 'Error al iniciar calificación');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  // Continuar a SPCC (paso 2)
  const continuarASPCC = () => {
    setPaso('spcc');
  };

  const formatearTiempo = (horas: number, minutos: number) => {
    if (horas >= 1) {
      return `${horas}h ${minutos % 60}m`;
    }
    return `${minutos}m`;
  };

  const getAlertaColor = (alerta: string) => {
    switch (alerta) {
      case 'ROJA': return 'bg-red-500 text-white';
      case 'NARANJA': return 'bg-orange-500 text-white';
      case 'AMARILLA': return 'bg-yellow-500 text-black';
      default: return 'bg-green-500 text-white';
    }
  };

  if (!lead) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Calificar Lead - {lead.nombre} {lead.apellido}
          </DialogTitle>
        </DialogHeader>

        {paso === 'confirmacion' && (
          <div className="space-y-6">
            {/* Alerta de Tiempo */}
            <div className="flex items-center justify-center">
              <Badge className={`${getAlertaColor(lead.alertaTiempo)} px-4 py-2 text-sm`}>
                <AlertTriangle className="w-4 h-4 mr-2" />
                Esperando {formatearTiempo(lead.horasEspera, lead.minutosEspera)}
                {lead.alertaTiempo === 'ROJA' && ' - URGENTE'}
              </Badge>
            </div>

            {/* Información del Lead */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Datos Capturados por Centro de Leads</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Nombre Completo</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <User className="w-4 h-4 text-gray-500" />
                      <span>{lead.nombre} {lead.apellido}</span>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700">Teléfono</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <span>{lead.telefono || 'No proporcionado'}</span>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700">Vehículo de Interés</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Car className="w-4 h-4 text-gray-500" />
                      <span>{lead.vehiculoInteresTexto || 'No especificado'}</span>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700">Fecha de Asignación</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span>{new Date(lead.fechaAsignacion || lead.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Información Adicional */}
                <div className="border-t pt-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label className="text-gray-600">Origen del Lead</Label>
                      <p className="font-medium">{lead.origenLead || 'No especificado'}</p>
                    </div>
                    <div>
                      <Label className="text-gray-600">Coordinador</Label>
                      <p className="font-medium">{lead.coordinadorNombre}</p>
                    </div>
                  </div>
                </div>

                {/* Observaciones del Coordinador */}
                {lead.asignacionLead?.[0]?.observaciones && (
                  <div className="bg-blue-50 p-3 rounded">
                    <Label className="text-sm font-medium text-blue-800">Observaciones del Coordinador:</Label>
                    <p className="text-sm text-blue-700 mt-1">
                      {lead.asignacionLead[0].observaciones}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Proceso a Seguir */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-orange-700">¿Qué sucede ahora?</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center">
                      <span className="text-orange-700 text-sm font-bold">1</span>
                    </div>
                    <div>
                      <p className="font-medium">Contactar al prospecto</p>
                      <p className="text-sm text-gray-600">Confirma la información y agenda una cita o llamada</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center">
                      <span className="text-orange-700 text-sm font-bold">2</span>
                    </div>
                    <div>
                      <p className="font-medium">Completar calificación SPCC</p>
                      <p className="text-sm text-gray-600">Calificar los 15 pilares para determinar el potencial del cliente</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-700 text-sm font-bold">3</span>
                    </div>
                    <div>
                      <p className="font-medium">Ingreso al pipeline normal</p>
                      <p className="text-sm text-gray-600">El lead se integra al flujo de ventas según su calificación</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Botones de Acción */}
            <div className="flex gap-3 pt-4">
              <Button 
                variant="outline" 
                onClick={onClose}
                disabled={loading}
                className="flex-1"
              >
                Cerrar
              </Button>
              
              <Button 
                onClick={iniciarCalificacion}
                disabled={loading}
                className={`flex-1 ${lead.alertaTiempo === 'ROJA' ? 'bg-red-600 hover:bg-red-700' : ''}`}
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <ArrowRight className="w-4 h-4 mr-2" />
                )}
                Iniciar Calificación SPCC
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
