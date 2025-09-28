
'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertTriangle, User, Calendar, Scale } from 'lucide-react';

interface GuardiaBalance {
  vendedorId: string;
  nombre: string;
  totalGuardias: number;
  sabados: number;
  domingos: number;
  diasSemana: number;
  cargaActual: number;
  disponible: boolean;
}

interface BalanceValidation {
  isBalanced: boolean;
  issues: string[];
  suggestions: string[];
  balanceReport: GuardiaBalance[];
  statistics: {
    totalGuardias: number;
    promedioGuardias: number;
    desviacionMaxima: number;
    sabadosBalanceados: boolean;
    domingosBalanceados: boolean;
  };
}

interface GuardiaAssignment {
  fecha: Date;
  vendedorId: string;
  tipo: 'SABADO' | 'DOMINGO' | 'SEMANA';
  justificacion: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  agenciaId: number;
  mes: number;
  year: number;
  onBalanceApplied?: () => void;
}

export function GuardiaBalanceModal({
  isOpen,
  onClose,
  agenciaId,
  mes,
  year,
  onBalanceApplied
}: Props) {
  const [loading, setLoading] = useState(false);
  const [validation, setValidation] = useState<BalanceValidation | null>(null);
  const [assignments, setAssignments] = useState<GuardiaAssignment[]>([]);
  const [observaciones, setObservaciones] = useState('');

  const validateBalance = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/vendedores-guardia/balance?action=validate&agenciaId=${agenciaId}&mes=${mes}&year=${year}`
      );
      const data = await response.json();
      
      if (data.success) {
        setValidation(data.validation);
        if (!data.validation.isBalanced) {
          generateAssignments();
        }
      }
    } catch (error) {
      console.error('Error validating balance:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateAssignments = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/vendedores-guardia/balance?action=generate&agenciaId=${agenciaId}&mes=${mes}&year=${year}`
      );
      const data = await response.json();
      
      if (data.success) {
        setAssignments(data.assignment || []);
      }
    } catch (error) {
      console.error('Error generating assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyBalance = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/vendedores-guardia/balance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'apply',
          agenciaId,
          assignments,
          observaciones,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        onBalanceApplied?.();
        onClose();
      }
    } catch (error) {
      console.error('Error applying balance:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Balance de Guardias - {mes}/{year}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {!validation && (
            <div className="text-center">
              <Button onClick={validateBalance} disabled={loading}>
                {loading ? 'Validando...' : 'Analizar Balance Actual'}
              </Button>
            </div>
          )}

          {validation && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {validation.isBalanced ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                <span className="font-semibold">
                  {validation.isBalanced
                    ? 'Las guardias están balanceadas'
                    : 'Se requiere balance de guardias'}
                </span>
              </div>

              {validation.issues.length > 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      <p className="font-medium">Problemas detectados:</p>
                      <ul className="list-disc list-inside">
                        {validation.issues.map((issue, index) => (
                          <li key={index}>{issue}</li>
                        ))}
                      </ul>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {validation.suggestions.length > 0 && (
                <Alert>
                  <AlertDescription>
                    <div className="space-y-1">
                      <p className="font-medium">Recomendaciones:</p>
                      <ul className="list-disc list-inside">
                        {validation.suggestions.map((suggestion, index) => (
                          <li key={index}>{suggestion}</li>
                        ))}
                      </ul>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Distribución Actual</h4>
                  <div className="space-y-2">
                    {validation.balanceReport.map((balance) => (
                      <div
                        key={balance.vendedorId}
                        className="p-3 border rounded-lg"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{balance.nombre}</span>
                          <Badge
                            variant={balance.disponible ? 'default' : 'secondary'}
                          >
                            {balance.disponible ? 'Disponible' : 'No disponible'}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          Total: {balance.totalGuardias} | 
                          Sáb: {balance.sabados} | 
                          Dom: {balance.domingos} |
                          Semana: {balance.diasSemana}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Estadísticas</h4>
                  <div className="p-3 border rounded-lg">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>Total guardias: {validation.statistics.totalGuardias}</div>
                      <div>Promedio: {validation.statistics.promedioGuardias.toFixed(1)}</div>
                      <div>
                        Sábados: {validation.statistics.sabadosBalanceados ? (
                          <CheckCircle className="inline h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="inline h-4 w-4 text-red-500" />
                        )}
                      </div>
                      <div>
                        Domingos: {validation.statistics.domingosBalanceados ? (
                          <CheckCircle className="inline h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="inline h-4 w-4 text-red-500" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {assignments.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Propuesta de Balance Automático</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {assignments.map((assignment, index) => (
                      <div key={index} className="p-2 border rounded-lg text-sm">
                        <div className="font-medium">
                          {assignment.fecha.toDateString()} - {assignment.tipo}
                        </div>
                        <div className="text-muted-foreground">
                          Vendedor ID: {assignment.vendedorId}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {assignment.justificacion}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="font-medium">Observaciones (opcional)</label>
                <Textarea
                  placeholder="Observaciones sobre la asignación de guardias..."
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  rows={3}
                />
              </div>

              {assignments.length > 0 && (
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={onClose}>
                    Cancelar
                  </Button>
                  <Button onClick={applyBalance} disabled={loading}>
                    {loading ? 'Aplicando...' : 'Autorizar Distribución Automática'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
