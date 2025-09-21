
'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { GuardiaBalanceModal } from '@/components/guardia-balance-modal';
import {
  Users,
  UserCheck,
  AlertTriangle,
  Calendar,
  Clock,
  Target,
  CheckCircle,
  XCircle,
  RefreshCw,
  BarChart3,
  TrendingUp,
  Bell,
  Scale
} from 'lucide-react';
import { toast } from 'sonner';

interface VendedorInfo {
  id: string;
  nombre: string;
  apellido?: string;
  cargaProspectos: number;
}

interface VendedorGuardia {
  id: number;
  vendedorId: string;
  vendedor: VendedorInfo;
  activo: boolean;
  horaInicio: string;
  horaFin: string;
  cargaActual: number;
  metaDelDia: number;
  observaciones?: string;
}

interface EstadisticasGuardia {
  totalVendedoresGuardia: number;
  cargaPromedio: number;
  maxCarga: number;
  minCarga: number;
  desbalance: boolean;
  diferenciaMaxima: number;
}

export function VendedoresGuardiaClient() {
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date().toISOString().split('T')[0]);
  const [vendedoresGuardia, setVendedoresGuardia] = useState<VendedorGuardia[]>([]);
  const [vendedoresDisponibles, setVendedoresDisponibles] = useState<VendedorInfo[]>([]);
  const [vendedoresSeleccionados, setVendedoresSeleccionados] = useState<string[]>([]);
  const [estadisticas, setEstadisticas] = useState<EstadisticasGuardia | null>(null);
  const [hayGuardiaDefinida, setHayGuardiaDefinida] = useState(false);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [observaciones, setObservaciones] = useState('');
  const [showBalanceModal, setShowBalanceModal] = useState(false);

  // Estados para configuración
  const [horaInicio, setHoraInicio] = useState('09:00');
  const [horaFin, setHoraFin] = useState('18:00');

  // Cargar datos de vendedores de guardia
  const cargarVendedoresGuardia = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/vendedores-guardia?fecha=${fechaSeleccionada}`);
      
      if (!response.ok) {
        throw new Error('Error al cargar vendedores de guardia');
      }

      const data = await response.json();
      setVendedoresGuardia(data.vendedoresGuardia || []);
      setVendedoresDisponibles(data.vendedoresDisponibles || []);
      setEstadisticas(data.estadisticas);
      setHayGuardiaDefinida(data.hayGuardiaDefinida);

      // Si hay guardia definida, seleccionar los vendedores activos
      if (data.hayGuardiaDefinida) {
        const activos = data.vendedoresGuardia
          .filter((vg: VendedorGuardia) => vg.activo)
          .map((vg: VendedorGuardia) => vg.vendedorId);
        setVendedoresSeleccionados(activos);
      } else {
        setVendedoresSeleccionados([]);
      }

    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar vendedores de guardia');
    } finally {
      setLoading(false);
    }
  }, [fechaSeleccionada]);

  useEffect(() => {
    cargarVendedoresGuardia();
  }, [cargarVendedoresGuardia]);

  // Manejar selección de vendedores
  const toggleVendedor = (vendedorId: string) => {
    setVendedoresSeleccionados(prev => 
      prev.includes(vendedorId) 
        ? prev.filter(id => id !== vendedorId)
        : [...prev, vendedorId]
    );
  };

  // Definir vendedores de guardia
  const definirGuardia = async () => {
    if (vendedoresSeleccionados.length === 0) {
      toast.error('Debe seleccionar al menos un vendedor');
      return;
    }

    try {
      setGuardando(true);

      const response = await fetch('/api/vendedores-guardia', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          vendedoresIds: vendedoresSeleccionados,
          fecha: fechaSeleccionada,
          horaInicio,
          horaFin,
          observaciones: observaciones || `Guardia definida para ${new Date(fechaSeleccionada).toLocaleDateString()}`
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al definir vendedores de guardia');
      }

      const resultado = await response.json();
      toast.success(`Vendedores de guardia definidos exitosamente: ${resultado.total} vendedores`);
      
      // Recargar datos
      await cargarVendedoresGuardia();
      setObservaciones('');

    } catch (error) {
      console.error('Error:', error);
      toast.error(error instanceof Error ? error.message : 'Error al definir vendedores de guardia');
    } finally {
      setGuardando(false);
    }
  };

  // Limpiar guardia
  const limpiarGuardia = async () => {
    try {
      const response = await fetch(`/api/vendedores-guardia?fecha=${fechaSeleccionada}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Error al limpiar vendedores de guardia');
      }

      toast.success('Vendedores de guardia eliminados exitosamente');
      await cargarVendedoresGuardia();
      setVendedoresSeleccionados([]);
      
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al limpiar vendedores de guardia');
    }
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
      {/* Panel de Control */}
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Calendar className="h-6 w-6" />
              <div>
                <CardTitle className="text-xl">Panel de Control de Guardia</CardTitle>
                <CardDescription className="text-blue-100">
                  Gestione los vendedores de guardia diarios
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBalanceModal(true)}
              >
                <Scale className="h-4 w-4 mr-2" />
                Balance Guardias
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={cargarVendedoresGuardia}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {/* Selector de Fecha */}
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de Guardia
              </label>
              <Input
                type="date"
                value={fechaSeleccionada}
                onChange={(e) => setFechaSeleccionada(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hora Inicio
              </label>
              <Input
                type="time"
                value={horaInicio}
                onChange={(e) => setHoraInicio(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hora Fin
              </label>
              <Input
                type="time"
                value={horaFin}
                onChange={(e) => setHoraFin(e.target.value)}
              />
            </div>
          </div>

          {/* Estado Actual */}
          <div className="mb-6">
            <AnimatePresence>
              {hayGuardiaDefinida ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      <strong>Guardia Definida:</strong> {estadisticas?.totalVendedoresGuardia} vendedores activos para {new Date(fechaSeleccionada).toLocaleDateString()}
                      {estadisticas?.desbalance && (
                        <span className="ml-2 text-amber-600">
                          ⚠️ Desbalance detectado (diferencia: {estadisticas.diferenciaMaxima} leads)
                        </span>
                      )}
                    </AlertDescription>
                  </Alert>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <Alert className="border-amber-200 bg-amber-50">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-800">
                      <strong>Sin Guardia Definida:</strong> Los coordinadores de Centro de Leads no podrán asignar prospectos hasta que se defina la guardia para {new Date(fechaSeleccionada).toLocaleDateString()}
                    </AlertDescription>
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Estadísticas Rápidas */}
          {estadisticas && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-600">{estadisticas.totalVendedoresGuardia}</div>
                <div className="text-xs text-blue-500">Vendedores Guardia</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">{estadisticas.cargaPromedio}</div>
                <div className="text-xs text-green-500">Carga Promedio</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-purple-600">{estadisticas.maxCarga}</div>
                <div className="text-xs text-purple-500">Carga Máxima</div>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-orange-600">{estadisticas.diferenciaMaxima}</div>
                <div className="text-xs text-orange-500">Diferencia Max</div>
              </div>
            </div>
          )}

          <Separator className="my-6" />

          {/* Observaciones */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observaciones (opcional)
            </label>
            <Textarea
              placeholder="Notas sobre la guardia del día..."
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              className="resize-none"
              rows={3}
            />
          </div>

          {/* Botones de Acción */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={definirGuardia}
              disabled={guardando || vendedoresSeleccionados.length === 0}
              className="flex-1 bg-green-600 hover:bg-green-700"
              size="lg"
            >
              {guardando ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Definir Guardia ({vendedoresSeleccionados.length})
                </>
              )}
            </Button>

            {hayGuardiaDefinida && (
              <Button
                variant="destructive"
                onClick={limpiarGuardia}
                disabled={guardando}
                size="lg"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Limpiar Guardia
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lista de Vendedores */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Vendedores Disponibles */}
        <Card className="shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-t-lg">
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Vendedores Disponibles ({vendedoresDisponibles.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-96 overflow-y-auto">
              {vendedoresDisponibles.map((vendedor, index) => (
                <motion.div
                  key={vendedor.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-4 border-b cursor-pointer transition-colors hover:bg-gray-50 ${
                    vendedoresSeleccionados.includes(vendedor.id) ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                  onClick={() => toggleVendedor(vendedor.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        vendedoresSeleccionados.includes(vendedor.id)
                          ? 'bg-blue-600 border-blue-600'
                          : 'border-gray-300'
                      }`}>
                        {vendedoresSeleccionados.includes(vendedor.id) && (
                          <CheckCircle className="h-3 w-3 text-white" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {vendedor.nombre} {vendedor.apellido}
                        </div>
                        <div className="text-sm text-gray-500">
                          Carga actual: {vendedor.cargaProspectos} leads
                        </div>
                      </div>
                    </div>
                    
                    {vendedor.cargaProspectos > 0 && (
                      <div className="flex items-center space-x-2">
                        <Progress 
                          value={Math.min((vendedor.cargaProspectos / 10) * 100, 100)} 
                          className="w-16 h-2"
                        />
                        <Badge variant={vendedor.cargaProspectos > 8 ? 'destructive' : vendedor.cargaProspectos > 5 ? 'default' : 'secondary'}>
                          {vendedor.cargaProspectos}
                        </Badge>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
              
              {vendedoresDisponibles.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay vendedores disponibles</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Vendedores de Guardia Actuales */}
        <Card className="shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center">
              <UserCheck className="h-5 w-5 mr-2" />
              Vendedores de Guardia ({vendedoresGuardia.filter(vg => vg.activo).length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-96 overflow-y-auto">
              {vendedoresGuardia
                .filter(vg => vg.activo)
                .map((vendedorGuardia, index) => (
                  <motion.div
                    key={vendedorGuardia.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 border-b bg-green-50"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-5 h-5 bg-green-600 rounded flex items-center justify-center">
                          <CheckCircle className="h-3 w-3 text-white" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {vendedorGuardia.vendedor.nombre} {vendedorGuardia.vendedor.apellido}
                          </div>
                          <div className="text-sm text-gray-500">
                            {vendedorGuardia.horaInicio} - {vendedorGuardia.horaFin}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="bg-white">
                            <Target className="h-3 w-3 mr-1" />
                            {vendedorGuardia.cargaActual}/{vendedorGuardia.metaDelDia}
                          </Badge>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {vendedorGuardia.metaDelDia > 0 
                            ? Math.round((vendedorGuardia.cargaActual / vendedorGuardia.metaDelDia) * 100)
                            : 0}% completado
                        </div>
                      </div>
                    </div>
                    
                    {vendedorGuardia.observaciones && (
                      <div className="mt-3 p-3 bg-white rounded-md text-sm text-gray-600">
                        {vendedorGuardia.observaciones}
                      </div>
                    )}
                  </motion.div>
                ))}
              
              {vendedoresGuardia.filter(vg => vg.activo).length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  <UserCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay vendedores de guardia definidos</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal de Balance de Guardias */}
      <GuardiaBalanceModal
        isOpen={showBalanceModal}
        onClose={() => setShowBalanceModal(false)}
        agenciaId={1} // TODO: Obtener de la sesión del usuario
        mes={new Date().getMonth() + 1}
        year={new Date().getFullYear()}
        onBalanceApplied={() => {
          cargarVendedoresGuardia();
          toast.success('Balance de guardias aplicado exitosamente');
        }}
      />
    </div>
  );
}
