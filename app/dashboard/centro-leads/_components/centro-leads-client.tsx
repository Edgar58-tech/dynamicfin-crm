
'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  Phone,
  Store,
  Users,
  Clock,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Activity,
  PhoneCall,
  Car,
  Target,
  UserCheck,
  RefreshCw,
  Bell
} from 'lucide-react';
import { toast } from 'sonner';
import { CapturaLlamadaModal } from './captura-llamada-modal';
import { CapturaVisitaModal } from './captura-visita-modal';
import { AsignacionManualModal } from './asignacion-manual-modal';

interface EstadisticasCentroLeads {
  llamadasHoy: number;
  visitasHoy: number;
  prospectosGenerados: number;
  vendedoresGuardia: number;
  promedioAsignacion: number;
}

interface VendedorGuardiaInfo {
  id: string;
  nombre: string;
  apellido?: string;
  cargaActual: number;
  metaDelDia: number;
  porcentajeMeta: number;
}

interface AlertaDesbalanceInfo {
  tipo: string;
  diferencia: number;
  vendedorSobrecargado?: {
    nombre: string;
    carga: number;
  };
  vendedorMenorCarga?: {
    nombre: string;
    carga: number;
  };
}

interface UltimasActividades {
  llamadas: Array<{
    id: number;
    telefono?: string;
    duracion?: number;
    resultado?: string;
    coordinador: string;
    fecha: string;
  }>;
  visitas: Array<{
    id: number;
    visitante: string;
    acompanantes: number;
    vehiculo?: string;
    nivel?: string;
    coordinador: string;
    fecha: string;
  }>;
}

interface CentroLeadsClientProps {
  userRole: string;
}

export function CentroLeadsClient({ userRole }: CentroLeadsClientProps) {
  const [estadisticas, setEstadisticas] = useState<EstadisticasCentroLeads | null>(null);
  const [vendedoresGuardia, setVendedoresGuardia] = useState<VendedorGuardiaInfo[]>([]);
  const [guardiaDefinida, setGuardiaDefinida] = useState(false);
  const [alertaDesbalance, setAlertaDesbalance] = useState<AlertaDesbalanceInfo | null>(null);
  const [ultimasActividades, setUltimasActividades] = useState<UltimasActividades>({ llamadas: [], visitas: [] });
  const [loading, setLoading] = useState(true);
  const [actualizandoAutomatico, setActualizandoAutomatico] = useState(false);

  // Estados para modales
  const [mostrarModalLlamada, setMostrarModalLlamada] = useState(false);
  const [mostrarModalVisita, setMostrarModalVisita] = useState(false);
  const [mostrarModalAsignacion, setMostrarModalAsignacion] = useState(false);

  // Cargar datos del centro de leads
  const cargarDatos = useCallback(async (esActualizacionAutomatica = false) => {
    try {
      if (esActualizacionAutomatica) {
        setActualizandoAutomatico(true);
      } else {
        setLoading(true);
      }

      const response = await fetch('/api/centro-leads');
      
      if (!response.ok) {
        throw new Error('Error al cargar datos del centro de leads');
      }

      const data = await response.json();
      setEstadisticas(data.estadisticas);
      setVendedoresGuardia(data.vendedoresGuardia || []);
      setGuardiaDefinida(data.guardiaDefinida);
      setAlertaDesbalance(data.alertaDesbalance);
      setUltimasActividades(data.ultimasActividades || { llamadas: [], visitas: [] });

    } catch (error) {
      console.error('Error:', error);
      if (!esActualizacionAutomatica) {
        toast.error('Error al cargar datos del centro de leads');
      }
    } finally {
      setLoading(false);
      setActualizandoAutomatico(false);
    }
  }, []);

  // Cargar datos al montar el componente
  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Actualización automática cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      cargarDatos(true);
    }, 30000);

    return () => clearInterval(interval);
  }, [cargarDatos]);

  // Verificar estado de guardia cada 30 segundos si no está definida
  useEffect(() => {
    if (!guardiaDefinida) {
      const interval = setInterval(() => {
        cargarDatos(true);
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [guardiaDefinida, cargarDatos]);

  const handleProspectoCreado = () => {
    // Recargar datos después de crear un prospecto
    cargarDatos();
    toast.success('Prospecto creado y asignado exitosamente');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map(i => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estado de Guardia */}
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className={`w-4 h-4 rounded-full ${guardiaDefinida ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
              <h3 className="text-lg font-semibold text-gray-900">
                {guardiaDefinida ? 'Guardia Definida' : 'Sin Guardia Definida'}
              </h3>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => cargarDatos()}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${actualizandoAutomatico ? 'animate-spin' : ''}`} />
              {actualizandoAutomatico ? 'Actualizando...' : 'Actualizar'}
            </Button>
          </div>

          <AnimatePresence>
            {!guardiaDefinida ? (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Alert className="border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    <strong>Atención:</strong> No hay vendedores de guardia definidos para hoy. 
                    Puede capturar datos de prospectos, pero no se podrán guardar hasta que el 
                    Gerente de Ventas defina la guardia del día.
                  </AlertDescription>
                </Alert>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    <strong>Sistema Activo:</strong> {estadisticas?.vendedoresGuardia} vendedores de guardia disponibles para asignación de leads.
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Alerta de Desbalance */}
          {alertaDesbalance && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4"
            >
              <Alert className="border-amber-200 bg-amber-50">
                <Bell className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800">
                  <strong>Desbalance Detectado:</strong> Diferencia de {alertaDesbalance.diferencia} leads entre vendedores.
                  {alertaDesbalance.vendedorMenorCarga && (
                    <span className="block mt-1">
                      Sugerencia: Asignar a {alertaDesbalance.vendedorMenorCarga.nombre} (carga: {alertaDesbalance.vendedorMenorCarga.carga})
                    </span>
                  )}
                </AlertDescription>
              </Alert>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Estadísticas del Día */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="text-center shadow-lg border-0 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-4">
              <Phone className="h-8 w-8 mx-auto mb-2 opacity-90" />
              <div className="text-2xl font-bold">{estadisticas?.llamadasHoy || 0}</div>
              <div className="text-xs opacity-90">Llamadas Hoy</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="text-center shadow-lg border-0 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
            <CardContent className="p-4">
              <Store className="h-8 w-8 mx-auto mb-2 opacity-90" />
              <div className="text-2xl font-bold">{estadisticas?.visitasHoy || 0}</div>
              <div className="text-xs opacity-90">Visitas Hoy</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="text-center shadow-lg border-0 bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardContent className="p-4">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-90" />
              <div className="text-2xl font-bold">{estadisticas?.prospectosGenerados || 0}</div>
              <div className="text-xs opacity-90">Prospectos</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="text-center shadow-lg border-0 bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <CardContent className="p-4">
              <UserCheck className="h-8 w-8 mx-auto mb-2 opacity-90" />
              <div className="text-2xl font-bold">{estadisticas?.vendedoresGuardia || 0}</div>
              <div className="text-xs opacity-90">Vendedores Guardia</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="text-center shadow-lg border-0 bg-gradient-to-br from-teal-500 to-teal-600 text-white">
            <CardContent className="p-4">
              <Clock className="h-8 w-8 mx-auto mb-2 opacity-90" />
              <div className="text-2xl font-bold">{estadisticas?.promedioAsignacion || 0}m</div>
              <div className="text-xs opacity-90">Tiempo Asignación</div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Acciones Principales */}
      <Card className="shadow-lg border-0">
        <CardHeader className="bg-gradient-to-r from-slate-600 to-slate-700 text-white rounded-t-lg">
          <CardTitle className="flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            Acciones de Centro de Leads
          </CardTitle>
          <CardDescription className="text-slate-200">
            Captura rápida de leads desde llamadas entrantes y visitas de showroom
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid md:grid-cols-2 gap-4">
            <Button
              onClick={() => setMostrarModalLlamada(true)}
              size="lg"
              className="h-20 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg"
            >
              <div className="flex flex-col items-center">
                <PhoneCall className="h-8 w-8 mb-2" />
                <span className="font-semibold">Llamada Entrante</span>
              </div>
            </Button>

            <Button
              onClick={() => setMostrarModalVisita(true)}
              size="lg"
              className="h-20 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg"
            >
              <div className="flex flex-col items-center">
                <Store className="h-8 w-8 mb-2" />
                <span className="font-semibold">Visita Showroom</span>
              </div>
            </Button>
          </div>

          {userRole !== 'CENTRO_LEADS' && (
            <>
              <Separator className="my-4" />
              <Button
                onClick={() => setMostrarModalAsignacion(true)}
                variant="outline"
                size="lg"
                className="w-full h-14 border-dashed border-2"
                disabled={!guardiaDefinida}
              >
                <Target className="h-6 w-6 mr-2" />
                Asignación Manual de Lead
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Vendedores de Guardia Actuales */}
      {guardiaDefinida && (
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Vendedores de Guardia Activos
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-1">
              {vendedoresGuardia.map((vendedor, index) => (
                <motion.div
                  key={vendedor.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 border-b last:border-b-0"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {vendedor.nombre} {vendedor.apellido}
                      </div>
                      <div className="text-sm text-gray-500">
                        Carga: {vendedor.cargaActual}/{vendedor.metaDelDia}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge 
                      variant={vendedor.porcentajeMeta > 100 ? 'destructive' : vendedor.porcentajeMeta > 80 ? 'default' : 'secondary'}
                    >
                      {vendedor.porcentajeMeta}%
                    </Badge>
                    {vendedor.cargaActual === Math.min(...vendedoresGuardia.map(v => v.cargaActual)) && (
                      <Badge variant="outline" className="text-green-600 border-green-200">
                        Recomendado
                      </Badge>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Últimas Actividades */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Últimas Llamadas */}
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center text-blue-700">
              <Phone className="h-5 w-5 mr-2" />
              Últimas Llamadas
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-64 overflow-y-auto">
              {ultimasActividades.llamadas.map((llamada, index) => (
                <motion.div
                  key={llamada.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-3 border-b last:border-b-0 hover:bg-blue-50"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-sm">
                        {llamada.telefono || 'N/A'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {llamada.coordinador} • {llamada.duracion ? `${llamada.duracion}s` : 'N/A'}
                      </div>
                    </div>
                    <div className="text-xs text-gray-400">
                      {new Date(llamada.fecha).toLocaleTimeString()}
                    </div>
                  </div>
                  {llamada.resultado && (
                    <Badge variant="outline" className="text-xs mt-1">
                      {llamada.resultado}
                    </Badge>
                  )}
                </motion.div>
              ))}
              {ultimasActividades.llamadas.length === 0 && (
                <div className="p-6 text-center text-gray-500">
                  <Phone className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No hay llamadas recientes</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Últimas Visitas */}
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center text-emerald-700">
              <Store className="h-5 w-5 mr-2" />
              Últimas Visitas
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-64 overflow-y-auto">
              {ultimasActividades.visitas.map((visita, index) => (
                <motion.div
                  key={visita.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-3 border-b last:border-b-0 hover:bg-emerald-50"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-sm">
                        {visita.visitante}
                      </div>
                      <div className="text-xs text-gray-500">
                        {visita.coordinador} • {visita.acompanantes} {visita.acompanantes === 1 ? 'persona' : 'personas'}
                      </div>
                    </div>
                    <div className="text-xs text-gray-400">
                      {new Date(visita.fecha).toLocaleTimeString()}
                    </div>
                  </div>
                  <div className="flex space-x-2 mt-1">
                    {visita.vehiculo && (
                      <Badge variant="outline" className="text-xs">
                        <Car className="h-3 w-3 mr-1" />
                        {visita.vehiculo}
                      </Badge>
                    )}
                    {visita.nivel && (
                      <Badge 
                        variant={visita.nivel === 'alto' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {visita.nivel}
                      </Badge>
                    )}
                  </div>
                </motion.div>
              ))}
              {ultimasActividades.visitas.length === 0 && (
                <div className="p-6 text-center text-gray-500">
                  <Store className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No hay visitas recientes</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modales */}
      <CapturaLlamadaModal
        open={mostrarModalLlamada}
        onClose={() => setMostrarModalLlamada(false)}
        onProspectoCreado={handleProspectoCreado}
        guardiaDefinida={guardiaDefinida}
      />

      <CapturaVisitaModal
        open={mostrarModalVisita}
        onClose={() => setMostrarModalVisita(false)}
        onProspectoCreado={handleProspectoCreado}
        guardiaDefinida={guardiaDefinida}
      />

      {userRole !== 'CENTRO_LEADS' && (
        <AsignacionManualModal
          open={mostrarModalAsignacion}
          onClose={() => setMostrarModalAsignacion(false)}
          onAsignacionRealizada={handleProspectoCreado}
        />
      )}
    </div>
  );
}
