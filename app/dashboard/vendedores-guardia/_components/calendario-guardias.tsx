
'use client';

import { useState, useEffect } from 'react';
import { Calendar, momentLocalizer, View } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/es';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Calendar as CalendarIcon, 
  Users, 
  Clock, 
  ChevronLeft, 
  ChevronRight,
  Eye,
  UserCheck,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';

// Configurar moment en español
moment.locale('es');
const localizer = momentLocalizer(moment);

interface EventoGuardia {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: {
    vendedorId: string;
    vendedorNombre: string;
    cargaActual: number;
    metaDelDia: number;
    observaciones?: string;
    estado: 'activo' | 'inactivo' | 'sobrecargado';
  };
}

interface CalendarioGuardiasProps {
  onFechaSeleccionada?: (fecha: Date) => void;
  onEventoSeleccionado?: (evento: EventoGuardia) => void;
}

export function CalendarioGuardias({ onFechaSeleccionada, onEventoSeleccionado }: CalendarioGuardiasProps) {
  const [eventos, setEventos] = useState<EventoGuardia[]>([]);
  const [vistaActual, setVistaActual] = useState<View>('month');
  const [fechaActual, setFechaActual] = useState(new Date());
  const [eventoSeleccionado, setEventoSeleccionado] = useState<EventoGuardia | null>(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarEventosGuardia();
  }, [fechaActual, vistaActual]);

  const cargarEventosGuardia = async () => {
    try {
      setLoading(true);
      
      // Calcular rango de fechas basado en la vista
      const inicio = moment(fechaActual).startOf(vistaActual === 'month' ? 'month' : 'week').toDate();
      const fin = moment(fechaActual).endOf(vistaActual === 'month' ? 'month' : 'week').toDate();

      const response = await fetch(
        `/api/vendedores-guardia/calendario?inicio=${inicio.toISOString()}&fin=${fin.toISOString()}`
      );

      if (!response.ok) {
        throw new Error('Error al cargar eventos de guardia');
      }

      const data = await response.json();
      
      // Transformar datos a formato de eventos del calendario
      const eventosTransformados: EventoGuardia[] = data.guardias.map((guardia: any) => {
        const fechaGuardia = new Date(guardia.fecha);
        const [horaInicio] = guardia.horaInicio.split(':');
        const [horaFin] = guardia.horaFin.split(':');
        
        const inicio = new Date(fechaGuardia);
        inicio.setHours(parseInt(horaInicio), 0, 0, 0);
        
        const fin = new Date(fechaGuardia);
        fin.setHours(parseInt(horaFin), 0, 0, 0);

        return {
          id: `${guardia.vendedorId}-${guardia.fecha}`,
          title: `${guardia.vendedor.nombre} ${guardia.vendedor.apellido || ''}`,
          start: inicio,
          end: fin,
          resource: {
            vendedorId: guardia.vendedorId,
            vendedorNombre: `${guardia.vendedor.nombre} ${guardia.vendedor.apellido || ''}`,
            cargaActual: guardia.cargaActual || 0,
            metaDelDia: guardia.metaDelDia || 5,
            observaciones: guardia.observaciones,
            estado: guardia.cargaActual > (guardia.metaDelDia * 1.2) ? 'sobrecargado' : 
                   guardia.activo ? 'activo' : 'inactivo'
          }
        };
      });

      setEventos(eventosTransformados);
      
    } catch (error) {
      console.error('Error cargando eventos:', error);
      toast.error('Error al cargar el calendario de guardias');
    } finally {
      setLoading(false);
    }
  };

  const manejarSeleccionEvento = (evento: EventoGuardia) => {
    setEventoSeleccionado(evento);
    setModalAbierto(true);
    onEventoSeleccionado?.(evento);
  };

  const manejarSeleccionSlot = ({ start }: { start: Date }) => {
    onFechaSeleccionada?.(start);
  };

  const manejarNavegacion = (fecha: Date) => {
    setFechaActual(fecha);
  };

  const manejarCambioVista = (vista: View) => {
    setVistaActual(vista);
  };

  // Personalizar el estilo de los eventos
  const eventStyleGetter = (evento: EventoGuardia) => {
    const { estado } = evento.resource;
    
    let backgroundColor = '#3174ad';
    let borderColor = '#3174ad';
    
    switch (estado) {
      case 'activo':
        backgroundColor = '#10b981';
        borderColor = '#059669';
        break;
      case 'sobrecargado':
        backgroundColor = '#ef4444';
        borderColor = '#dc2626';
        break;
      case 'inactivo':
        backgroundColor = '#6b7280';
        borderColor = '#4b5563';
        break;
    }

    return {
      style: {
        backgroundColor,
        borderColor,
        color: 'white',
        border: `2px solid ${borderColor}`,
        borderRadius: '4px',
        fontSize: '12px',
        padding: '2px 4px'
      }
    };
  };

  // Personalizar componentes del calendario
  const CustomToolbar = ({ label, onNavigate, onView }: any) => (
    <div className="flex items-center justify-between mb-4 p-4 bg-white rounded-lg border">
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onNavigate('PREV')}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onNavigate('TODAY')}
        >
          Hoy
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onNavigate('NEXT')}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <h2 className="text-lg font-semibold">{label}</h2>

      <div className="flex items-center space-x-2">
        <Select value={vistaActual} onValueChange={(value: View) => onView(value)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="month">Mes</SelectItem>
            <SelectItem value="week">Semana</SelectItem>
            <SelectItem value="day">Día</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const CustomEvent = ({ event }: { event: EventoGuardia }) => {
    const { estado, cargaActual, metaDelDia } = event.resource;
    
    return (
      <div className="flex items-center justify-between w-full">
        <span className="truncate flex-1">{event.title}</span>
        <div className="flex items-center space-x-1 ml-2">
          {estado === 'sobrecargado' && (
            <AlertTriangle className="h-3 w-3" />
          )}
          {estado === 'activo' && (
            <UserCheck className="h-3 w-3" />
          )}
          <span className="text-xs">
            {cargaActual}/{metaDelDia}
          </span>
        </div>
      </div>
    );
  };

  const messages = {
    allDay: 'Todo el día',
    previous: 'Anterior',
    next: 'Siguiente',
    today: 'Hoy',
    month: 'Mes',
    week: 'Semana',
    day: 'Día',
    agenda: 'Agenda',
    date: 'Fecha',
    time: 'Hora',
    event: 'Evento',
    noEventsInRange: 'No hay guardias definidas en este rango de fechas',
    showMore: (total: number) => `+ Ver ${total} más`
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CalendarIcon className="h-5 w-5 mr-2" />
            Calendario de Vendedores de Guardia
          </CardTitle>
          <CardDescription>
            Vista mensual de las guardias programadas y su estado actual
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Leyenda */}
          <div className="flex flex-wrap items-center gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span className="text-sm">Activo</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span className="text-sm">Sobrecargado</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-gray-500 rounded"></div>
              <span className="text-sm">Inactivo</span>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-pulse" />
                <p className="text-gray-600">Cargando calendario...</p>
              </div>
            </div>
          ) : (
            <div style={{ height: '600px' }}>
              <Calendar
                localizer={localizer}
                events={eventos}
                startAccessor="start"
                endAccessor="end"
                style={{ height: '100%' }}
                onSelectEvent={manejarSeleccionEvento}
                onSelectSlot={manejarSeleccionSlot}
                onNavigate={manejarNavegacion}
                onView={manejarCambioVista}
                view={vistaActual}
                date={fechaActual}
                eventPropGetter={eventStyleGetter}
                components={{
                  toolbar: CustomToolbar,
                  event: CustomEvent
                }}
                messages={messages}
                selectable
                popup
                step={60}
                showMultiDayTimes
                formats={{
                  timeGutterFormat: 'HH:mm',
                  eventTimeRangeFormat: ({ start, end }) => 
                    `${moment(start).format('HH:mm')} - ${moment(end).format('HH:mm')}`
                }}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Detalles del Evento */}
      <Dialog open={modalAbierto} onOpenChange={setModalAbierto}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <UserCheck className="h-5 w-5 mr-2" />
              Detalles de Guardia
            </DialogTitle>
            <DialogDescription>
              Información detallada del vendedor de guardia
            </DialogDescription>
          </DialogHeader>

          {eventoSeleccionado && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900">
                  {eventoSeleccionado.resource.vendedorNombre}
                </h4>
                <p className="text-sm text-gray-600">
                  {moment(eventoSeleccionado.start).format('dddd, D [de] MMMM [de] YYYY')}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Horario</label>
                  <div className="flex items-center mt-1">
                    <Clock className="h-4 w-4 text-gray-400 mr-1" />
                    <span className="text-sm">
                      {moment(eventoSeleccionado.start).format('HH:mm')} - 
                      {moment(eventoSeleccionado.end).format('HH:mm')}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Estado</label>
                  <div className="mt-1">
                    <Badge variant={
                      eventoSeleccionado.resource.estado === 'activo' ? 'default' :
                      eventoSeleccionado.resource.estado === 'sobrecargado' ? 'destructive' :
                      'secondary'
                    }>
                      {eventoSeleccionado.resource.estado === 'activo' && <UserCheck className="h-3 w-3 mr-1" />}
                      {eventoSeleccionado.resource.estado === 'sobrecargado' && <AlertTriangle className="h-3 w-3 mr-1" />}
                      {eventoSeleccionado.resource.estado.charAt(0).toUpperCase() + 
                       eventoSeleccionado.resource.estado.slice(1)}
                    </Badge>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Carga de Trabajo</label>
                <div className="mt-2">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span>Leads asignados</span>
                    <span className="font-medium">
                      {eventoSeleccionado.resource.cargaActual} / {eventoSeleccionado.resource.metaDelDia}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        eventoSeleccionado.resource.cargaActual > eventoSeleccionado.resource.metaDelDia 
                          ? 'bg-red-500' 
                          : 'bg-green-500'
                      }`}
                      style={{ 
                        width: `${Math.min(
                          (eventoSeleccionado.resource.cargaActual / eventoSeleccionado.resource.metaDelDia) * 100, 
                          100
                        )}%` 
                      }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {Math.round((eventoSeleccionado.resource.cargaActual / eventoSeleccionado.resource.metaDelDia) * 100)}% 
                    de la meta diaria
                  </p>
                </div>
              </div>

              {eventoSeleccionado.resource.observaciones && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Observaciones</label>
                  <p className="text-sm text-gray-600 mt-1 p-2 bg-gray-50 rounded">
                    {eventoSeleccionado.resource.observaciones}
                  </p>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setModalAbierto(false)}>
                  Cerrar
                </Button>
                <Button onClick={() => {
                  // Navegar a la fecha del evento
                  onFechaSeleccionada?.(eventoSeleccionado.start);
                  setModalAbierto(false);
                }}>
                  <Eye className="h-4 w-4 mr-2" />
                  Ver Detalles
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
