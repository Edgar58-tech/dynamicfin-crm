
'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  UserX, 
  UserCheck, 
  AlertTriangle, 
  Clock,
  Users,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

interface VendedorGuardia {
  id: number;
  vendedorId: string;
  vendedor: {
    id: string;
    nombre: string;
    apellido?: string;
    cargaProspectos: number;
  };
  fecha: string;
  horaInicio: string;
  horaFin: string;
  cargaActual: number;
  metaDelDia: number;
  activo: boolean;
}

interface VendedorDisponible {
  id: string;
  nombre: string;
  apellido?: string;
  cargaProspectos: number;
  especialidad?: string;
  disponible: boolean;
}

interface CubrirGuardiaModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendedorGuardia: VendedorGuardia | null;
  onGuardiaCubierta: () => void;
}

const MOTIVOS_COBERTURA = [
  { value: 'ausencia', label: 'Ausencia', icon: UserX, color: 'bg-red-100 text-red-800' },
  { value: 'visita_cliente', label: 'Visita a Cliente', icon: Users, color: 'bg-blue-100 text-blue-800' },
  { value: 'sancion_administrativa', label: 'Sanción Administrativa', icon: AlertTriangle, color: 'bg-yellow-100 text-yellow-800' },
  { value: 'permiso', label: 'Permiso Personal', icon: Clock, color: 'bg-green-100 text-green-800' },
  { value: 'emergencia_personal', label: 'Emergencia Personal', icon: AlertTriangle, color: 'bg-orange-100 text-orange-800' },
  { value: 'otro_motivo', label: 'Otro Motivo', icon: UserX, color: 'bg-gray-100 text-gray-800' }
];

export function CubrirGuardiaModal({ 
  isOpen, 
  onClose, 
  vendedorGuardia, 
  onGuardiaCubierta 
}: CubrirGuardiaModalProps) {
  const [vendedoresDisponibles, setVendedoresDisponibles] = useState<VendedorDisponible[]>([]);
  const [vendedorSustituto, setVendedorSustituto] = useState<string>('');
  const [motivoCobertura, setMotivoCobertura] = useState<string>('');
  const [observaciones, setObservaciones] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [loadingVendedores, setLoadingVendedores] = useState(false);

  useEffect(() => {
    if (isOpen && vendedorGuardia) {
      cargarVendedoresDisponibles();
    }
  }, [isOpen, vendedorGuardia]);

  const cargarVendedoresDisponibles = async () => {
    if (!vendedorGuardia) return;

    try {
      setLoadingVendedores(true);
      
      const response = await fetch(
        `/api/vendedores-guardia/disponibles?fecha=${vendedorGuardia.fecha}&excluir=${vendedorGuardia.vendedorId}`
      );

      if (!response.ok) {
        throw new Error('Error al cargar vendedores disponibles');
      }

      const data = await response.json();
      setVendedoresDisponibles(data.vendedoresDisponibles || []);

    } catch (error) {
      console.error('Error cargando vendedores:', error);
      toast.error('Error al cargar vendedores disponibles');
    } finally {
      setLoadingVendedores(false);
    }
  };

  const manejarCobertura = async () => {
    if (!vendedorGuardia || !vendedorSustituto || !motivoCobertura) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch('/api/vendedores-guardia/cubrir', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          guardiaId: vendedorGuardia.id,
          vendedorOriginalId: vendedorGuardia.vendedorId,
          vendedorSustitutoId: vendedorSustituto,
          motivoCobertura,
          observaciones,
          fecha: vendedorGuardia.fecha,
          horaInicio: vendedorGuardia.horaInicio,
          horaFin: vendedorGuardia.horaFin
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al cubrir guardia');
      }

      const resultado = await response.json();
      
      toast.success(`Guardia cubierta exitosamente. ${resultado.vendedorSustituto} ahora está de guardia.`);
      
      // Limpiar formulario
      setVendedorSustituto('');
      setMotivoCobertura('');
      setObservaciones('');
      
      // Notificar al componente padre
      onGuardiaCubierta();
      onClose();

    } catch (error) {
      console.error('Error cubriendo guardia:', error);
      toast.error(error instanceof Error ? error.message : 'Error al cubrir guardia');
    } finally {
      setLoading(false);
    }
  };

  const getMotivoInfo = (motivo: string) => {
    return MOTIVOS_COBERTURA.find(m => m.value === motivo);
  };

  const getVendedorInfo = (vendedorId: string) => {
    return vendedoresDisponibles.find(v => v.id === vendedorId);
  };

  const limpiarFormulario = () => {
    setVendedorSustituto('');
    setMotivoCobertura('');
    setObservaciones('');
  };

  const manejarCerrar = () => {
    limpiarFormulario();
    onClose();
  };

  if (!vendedorGuardia) return null;

  return (
    <Dialog open={isOpen} onOpenChange={manejarCerrar}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <UserX className="h-5 w-5 mr-2 text-orange-600" />
            Cubrir Guardia de Vendedor
          </DialogTitle>
          <DialogDescription>
            Asigna un vendedor sustituto para cubrir la guardia de{' '}
            <strong>
              {vendedorGuardia.vendedor.nombre} {vendedorGuardia.vendedor.apellido}
            </strong>{' '}
            el {new Date(vendedorGuardia.fecha).toLocaleDateString('es-ES', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información de la Guardia Original */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Guardia Original</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Vendedor:</span>
                <p className="font-medium">
                  {vendedorGuardia.vendedor.nombre} {vendedorGuardia.vendedor.apellido}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Horario:</span>
                <p className="font-medium">
                  {vendedorGuardia.horaInicio} - {vendedorGuardia.horaFin}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Carga Actual:</span>
                <p className="font-medium">
                  {vendedorGuardia.cargaActual} / {vendedorGuardia.metaDelDia} leads
                </p>
              </div>
              <div>
                <span className="text-gray-600">Estado:</span>
                <Badge variant={vendedorGuardia.activo ? 'default' : 'secondary'}>
                  {vendedorGuardia.activo ? 'Activo' : 'Inactivo'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Motivo de Cobertura */}
          <div>
            <Label htmlFor="motivo">Motivo de Cobertura *</Label>
            <Select value={motivoCobertura} onValueChange={setMotivoCobertura}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Selecciona el motivo..." />
              </SelectTrigger>
              <SelectContent>
                {MOTIVOS_COBERTURA.map((motivo) => (
                  <SelectItem key={motivo.value} value={motivo.value}>
                    <div className="flex items-center">
                      <motivo.icon className="h-4 w-4 mr-2" />
                      {motivo.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {motivoCobertura && (
              <div className="mt-2">
                <Badge className={getMotivoInfo(motivoCobertura)?.color}>
                  {getMotivoInfo(motivoCobertura)?.label}
                </Badge>
              </div>
            )}
          </div>

          {/* Vendedor Sustituto */}
          <div>
            <Label htmlFor="sustituto">Vendedor Sustituto *</Label>
            {loadingVendedores ? (
              <div className="flex items-center justify-center p-4 border rounded-md mt-1">
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                Cargando vendedores disponibles...
              </div>
            ) : vendedoresDisponibles.length === 0 ? (
              <Alert className="mt-1">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  No hay vendedores disponibles para cubrir esta guardia.
                  Todos los vendedores ya tienen asignaciones o no están disponibles.
                </AlertDescription>
              </Alert>
            ) : (
              <Select value={vendedorSustituto} onValueChange={setVendedorSustituto}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecciona un vendedor sustituto..." />
                </SelectTrigger>
                <SelectContent>
                  {vendedoresDisponibles.map((vendedor) => (
                    <SelectItem key={vendedor.id} value={vendedor.id}>
                      <div className="flex items-center justify-between w-full">
                        <div>
                          <span className="font-medium">
                            {vendedor.nombre} {vendedor.apellido}
                          </span>
                          {vendedor.especialidad && (
                            <span className="text-sm text-gray-500 ml-2">
                              ({vendedor.especialidad})
                            </span>
                          )}
                        </div>
                        <Badge 
                          variant={vendedor.cargaProspectos > 8 ? 'destructive' : 
                                  vendedor.cargaProspectos > 5 ? 'default' : 'secondary'}
                          className="ml-2"
                        >
                          {vendedor.cargaProspectos} leads
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            
            {vendedorSustituto && (
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                {(() => {
                  const vendedorInfo = getVendedorInfo(vendedorSustituto);
                  if (!vendedorInfo) return null;
                  
                  return (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-blue-900">
                          {vendedorInfo.nombre} {vendedorInfo.apellido}
                        </span>
                        <Badge variant={
                          vendedorInfo.cargaProspectos > 8 ? 'destructive' : 
                          vendedorInfo.cargaProspectos > 5 ? 'default' : 'secondary'
                        }>
                          {vendedorInfo.cargaProspectos} leads actuales
                        </Badge>
                      </div>
                      {vendedorInfo.especialidad && (
                        <p className="text-sm text-blue-700">
                          Especialidad: {vendedorInfo.especialidad}
                        </p>
                      )}
                      {vendedorInfo.cargaProspectos > 8 && (
                        <Alert className="mt-2">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription className="text-sm">
                            Este vendedor ya tiene una carga alta de leads. 
                            Considera redistribuir la carga después de la cobertura.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          {/* Observaciones */}
          <div>
            <Label htmlFor="observaciones">Observaciones</Label>
            <Textarea
              id="observaciones"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Detalles adicionales sobre la cobertura de guardia..."
              rows={3}
              className="mt-1"
            />
          </div>

          {/* Resumen de la Cobertura */}
          {vendedorSustituto && motivoCobertura && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2 flex items-center">
                <UserCheck className="h-4 w-4 mr-2" />
                Resumen de Cobertura
              </h4>
              <div className="text-sm text-green-800">
                <p>
                  <strong>{getVendedorInfo(vendedorSustituto)?.nombre} {getVendedorInfo(vendedorSustituto)?.apellido}</strong>{' '}
                  cubrirá la guardia de{' '}
                  <strong>{vendedorGuardia.vendedor.nombre} {vendedorGuardia.vendedor.apellido}</strong>{' '}
                  por motivo de <strong>{getMotivoInfo(motivoCobertura)?.label.toLowerCase()}</strong>.
                </p>
                <p className="mt-1">
                  Horario: {vendedorGuardia.horaInicio} - {vendedorGuardia.horaFin}
                </p>
                <p>
                  Fecha: {new Date(vendedorGuardia.fecha).toLocaleDateString('es-ES')}
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={manejarCerrar} disabled={loading}>
            Cancelar
          </Button>
          <Button 
            onClick={manejarCobertura}
            disabled={loading || !vendedorSustituto || !motivoCobertura || vendedoresDisponibles.length === 0}
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                <UserCheck className="h-4 w-4 mr-2" />
                Confirmar Cobertura
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
