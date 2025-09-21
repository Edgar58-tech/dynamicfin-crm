'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle, 
  AlertTriangle, 
  Users, 
  Calendar,
  BarChart3,
  RefreshCw,
  Save,
  Eye,
  TrendingUp
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

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

interface GuardiaBalanceModalProps {
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
}: GuardiaBalanceModalProps) {
  const [loading, setLoading] = useState(false);
  const [validation, setValidation] = useState<BalanceValidation | null>(null);
  const [proposedAssignment, setProposedAssignment] = useState<{
    assignments: GuardiaAssignment[];
    validation: BalanceValidation;
  } | null>(null);
  const [observaciones, setObservaciones] = useState('');
  const [applying, setApplying] = useState(false);
  const [activeTab, setActiveTab] = useState('current');

  useEffect(() => {
    if (isOpen && agenciaId) {
      loadCurrentBalance();
    }
  }, [isOpen, agenciaId, mes, year]);

  const loadCurrentBalance = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/vendedores-guardia/balance?action=validate&agenciaId=${agenciaId}&mes=${mes}&year=${year}`
      );
      const data = await response.json();
      
      if (data.success) {
        setValidation(data.validation);
      }
    } catch (error) {
      console.error('Error loading balance:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateBalancedProposal = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/vendedores-guardia/balance?action=generate&agenciaId=${agenciaId}&mes=${mes}&year=${year}`
      );
      const data = await response.json();
      
      if (data.success && data.assignment.success) {
        setProposedAssignment({
          assignments: data.assignment.assignments,
          validation: data.assignment.validation
        });
        setActiveTab('proposal');
      }
    } catch (error) {
      console.error('Error generating proposal:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyBalancedAssignment = async () => {
    if (!proposedAssignment) return;

    setApplying(true);
    try {
      const response = await fetch('/api/vendedores-guardia/balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'apply',
          agenciaId,
          assignments: proposedAssignment.assignments,
          observaciones: observaciones || 'Asignación balanceada automática aplicada'
        })
      });

      const data = await response.json();
      
      if (data.success && data.result.success) {
        onBalanceApplied?.();
        onClose();
      }
    } catch (error) {
      console.error('Error applying assignment:', error);
    } finally {
      setApplying(false);
    }
  };

  const getBalanceColor = (balance: GuardiaBalance) => {
    if (!validation) return 'default';
    
    const promedio = validation.statistics.promedioGuardias;
    const diferencia = Math.abs(balance.totalGuardias - promedio);
    
    if (diferencia <= 1) return 'default';
    if (diferencia <= 2) return 'secondary';
    return 'destructive';
  };

  const getBalanceIcon = (isBalanced: boolean) => {
    return isBalanced ? (
      <CheckCircle className="h-5 w-5 text-green-500" />
    ) : (
      <AlertTriangle className="h-5 w-5 text-yellow-500" />
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Sistema de Guardias Balanceadas - {format(new Date(year, mes - 1), 'MMMM yyyy', { locale: es })}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="current" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Estado Actual
            </TabsTrigger>
            <TabsTrigger value="proposal" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Propuesta Balanceada
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Estadísticas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="current" className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin" />
                <span className="ml-2">Analizando balance actual...</span>
              </div>
            ) : validation ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {getBalanceIcon(validation.isBalanced)}
                      Estado del Balance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{validation.statistics.totalGuardias}</div>
                        <div className="text-sm text-muted-foreground">Total Guardias</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{validation.statistics.promedioGuardias.toFixed(1)}</div>
                        <div className="text-sm text-muted-foreground">Promedio</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{validation.statistics.desviacionMaxima.toFixed(1)}</div>
                        <div className="text-sm text-muted-foreground">Desviación Máx</div>
                      </div>
                      <div className="text-center">
                        <div className="flex justify-center gap-1">
                          <Badge variant={validation.statistics.sabadosBalanceados ? 'default' : 'destructive'}>
                            Sáb
                          </Badge>
                          <Badge variant={validation.statistics.domingosBalanceados ? 'default' : 'destructive'}>
                            Dom
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">Fines de Semana</div>
                      </div>
                    </div>

                    {validation.issues.length > 0 && (
                      <Alert className="mb-4">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Problemas detectados:</strong>
                          <ul className="list-disc list-inside mt-2">
                            {validation.issues.map((issue, index) => (
                              <li key={index}>{issue}</li>
                            ))}
                          </ul>
                        </AlertDescription>
                      </Alert>
                    )}

                    {validation.suggestions.length > 0 && (
                      <Alert>
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Sugerencias:</strong>
                          <ul className="list-disc list-inside mt-2">
                            {validation.suggestions.map((suggestion, index) => (
                              <li key={index}>{suggestion}</li>
                            ))}
                          </ul>
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Distribución por Vendedor</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {validation.balanceReport.map((balance) => (
                        <div key={balance.vendedorId} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Users className="h-4 w-4" />
                            <span className="font-medium">{balance.nombre}</span>
                            <Badge variant={getBalanceColor(balance)}>
                              {balance.totalGuardias} guardias
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>Sáb: {balance.sabados}</span>
                            <span>Dom: {balance.domingos}</span>
                            <span>Sem: {balance.diasSemana}</span>
                            <span>Carga: {balance.cargaActual}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {!validation.isBalanced && (
                  <div className="flex justify-center">
                    <Button onClick={generateBalancedProposal} disabled={loading}>
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Generar Propuesta Balanceada
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <Button onClick={loadCurrentBalance}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Cargar Análisis de Balance
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="proposal" className="space-y-4">
            {proposedAssignment ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {getBalanceIcon(proposedAssignment.validation.isBalanced)}
                      Propuesta de Balance Optimizado
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {proposedAssignment.assignments.length}
                        </div>
                        <div className="text-sm text-muted-foreground">Asignaciones</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">
                          {proposedAssignment.validation.statistics.promedioGuardias.toFixed(1)}
                        </div>
                        <div className="text-sm text-muted-foreground">Promedio</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {proposedAssignment.validation.statistics.desviacionMaxima.toFixed(1)}
                        </div>
                        <div className="text-sm text-muted-foreground">Desviación Máx</div>
                      </div>
                      <div className="text-center">
                        <div className="flex justify-center gap-1">
                          <Badge variant={proposedAssignment.validation.statistics.sabadosBalanceados ? 'default' : 'secondary'}>
                            Sáb ✓
                          </Badge>
                          <Badge variant={proposedAssignment.validation.statistics.domingosBalanceados ? 'default' : 'secondary'}>
                            Dom ✓
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">Balanceados</div>
                      </div>
                    </div>

                    <Alert className="mb-4">
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Mejoras de la propuesta:</strong>
                        <ul className="list-disc list-inside mt-2">
                          {proposedAssignment.validation.suggestions.map((suggestion, index) => (
                            <li key={index}>{suggestion}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Nueva Distribución por Vendedor</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {proposedAssignment.validation.balanceReport.map((balance) => (
                        <div key={balance.vendedorId} className="flex items-center justify-between p-3 border rounded-lg bg-green-50">
                          <div className="flex items-center gap-3">
                            <Users className="h-4 w-4" />
                            <span className="font-medium">{balance.nombre}</span>
                            <Badge variant="default">
                              {balance.totalGuardias} guardias
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>Sáb: {balance.sabados}</span>
                            <span>Dom: {balance.domingos}</span>
                            <span>Sem: {balance.diasSemana}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Observaciones del Gerente</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      placeholder="Agregue observaciones sobre esta asignación balanceada (opcional)..."
                      value={observaciones}
                      onChange={(e) => setObservaciones(e.target.value)}
                      rows={3}
                    />
                  </CardContent>
                </Card>

                <div className="flex justify-center gap-4">
                  <Button variant="outline" onClick={() => setActiveTab('current')}>
                    Revisar Estado Actual
                  </Button>
                  <Button 
                    onClick={applyBalancedAssignment} 
                    disabled={applying}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {applying ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Confirmar y Aplicar Balance
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  No hay propuesta generada. Vaya al estado actual y genere una propuesta balanceada.
                </p>
                <Button onClick={() => setActiveTab('current')}>
                  Ver Estado Actual
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="stats" className="space-y-4">
            {validation && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Métricas de Balance</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span>Total de Guardias:</span>
                      <span className="font-bold">{validation.statistics.totalGuardias}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Promedio por Vendedor:</span>
                      <span className="font-bold">{validation.statistics.promedioGuardias.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Desviación Máxima:</span>
                      <span className={`font-bold ${validation.statistics.desviacionMaxima > 3 ? 'text-red-600' : 'text-green-600'}`}>
                        {validation.statistics.desviacionMaxima.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sábados Balanceados:</span>
                      <span className={`font-bold ${validation.statistics.sabadosBalanceados ? 'text-green-600' : 'text-red-600'}`}>
                        {validation.statistics.sabadosBalanceados ? 'Sí' : 'No'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Domingos Balanceados:</span>
                      <span className={`font-bold ${validation.statistics.domingosBalanceados ? 'text-green-600' : 'text-red-600'}`}>
                        {validation.statistics.domingosBalanceados ? 'Sí' : 'No'}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Distribución de Guardias</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {validation.balanceReport.map((balance, index) => (
                        <div key={balance.vendedorId} className="flex items-center gap-2">
                          <div className="w-20 text-sm truncate">{balance.nombre}</div>
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ 
                                width: `${Math.max(5, (balance.totalGuardias / Math.max(...validation.balanceReport.map(b => b.totalGuardias))) * 100)}%` 
                              }}
                            />
                          </div>
                          <div className="w-8 text-sm text-right">{balance.totalGuardias}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
