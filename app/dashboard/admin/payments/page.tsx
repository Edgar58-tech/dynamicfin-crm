'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DollarSign,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  Building2,
  FileText,
  TrendingUp,
  Users,
  Calendar,
  RefreshCw,
  Download,
  Eye,
  Ban,
  Play,
  Settings
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface GlobalStats {
  totalAgencies: number;
  activeAgencies: number;
  suspendedAgencies: number;
  totalRecordings: number;
  totalRevenue: number;
  averageUsagePerAgency: number;
  topTierDistribution: {
    BASICO: number;
    PROFESIONAL: number;
    PREMIUM: number;
  };
}

interface PendingPayment {
  id: number;
  nombreAgencia: string;
  estadoPago: string;
  saldoPendiente: number;
  fechaUltimoPago: Date | null;
  marca: {
    nombreMarca: string;
  };
  facturas: Array<{
    id: number;
    numeroFactura: string;
    total: number;
    fechaVencimiento: Date;
    estatus: string;
  }>;
}

export default function PaymentsAdminPage() {
  const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null);
  const [pendingPayments, setPendingPayments] = useState<PendingPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgency, setSelectedAgency] = useState<PendingPayment | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('transferencia');
  const [paymentReference, setPaymentReference] = useState('');
  const [suspendReason, setSuspendReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Cargar estadísticas globales
      const statsResponse = await fetch('/api/payments?action=global-stats');
      const statsData = await statsResponse.json();
      if (statsData.success) {
        setGlobalStats(statsData.stats.stats);
      }

      // Cargar pagos pendientes
      const paymentsResponse = await fetch('/api/payments?action=pending-payments');
      const paymentsData = await paymentsResponse.json();
      if (paymentsData.success) {
        setPendingPayments(paymentsData.pendingPayments);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const processPayment = async () => {
    if (!selectedAgency || !paymentAmount) return;

    setProcessing(true);
    try {
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'process-payment',
          agenciaId: selectedAgency.id,
          amount: parseFloat(paymentAmount),
          paymentMethod,
          reference: paymentReference
        })
      });

      const data = await response.json();
      if (data.success) {
        await loadData();
        setSelectedAgency(null);
        setPaymentAmount('');
        setPaymentReference('');
      }
    } catch (error) {
      console.error('Error processing payment:', error);
    } finally {
      setProcessing(false);
    }
  };

  const suspendAgency = async (agencyId: number) => {
    if (!suspendReason) return;

    setProcessing(true);
    try {
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'suspend-agency',
          agenciaId: agencyId,
          reason: suspendReason
        })
      });

      const data = await response.json();
      if (data.success) {
        await loadData();
        setSuspendReason('');
      }
    } catch (error) {
      console.error('Error suspending agency:', error);
    } finally {
      setProcessing(false);
    }
  };

  const updateTier = async (agencyId: number, newTier: string) => {
    setProcessing(true);
    try {
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update-tier',
          agenciaId: agencyId,
          newTier
        })
      });

      const data = await response.json();
      if (data.success) {
        await loadData();
      }
    } catch (error) {
      console.error('Error updating tier:', error);
    } finally {
      setProcessing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVO': return 'default';
      case 'MOROSO': return 'destructive';
      case 'SUSPENDIDO': return 'secondary';
      default: return 'outline';
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'PREMIUM': return 'default';
      case 'PROFESIONAL': return 'secondary';
      case 'BASICO': return 'outline';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Cargando sistema de pagos...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sistema de Pagos DynamicFin</h1>
          <p className="text-muted-foreground">
            Administración de facturación y control de servicios
          </p>
        </div>
        <Button onClick={loadData} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>

      {/* Estadísticas Globales */}
      {globalStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Agencias</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{globalStats.totalAgencies}</div>
              <p className="text-xs text-muted-foreground">
                {globalStats.activeAgencies} activas, {globalStats.suspendedAgencies} suspendidas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${globalStats.totalRevenue.toLocaleString('es-MX')}
              </div>
              <p className="text-xs text-muted-foreground">
                Saldo pendiente total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Grabaciones</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{globalStats.totalRecordings.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {globalStats.averageUsagePerAgency.toFixed(1)} promedio por agencia
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Distribución Tiers</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex gap-1">
                <Badge variant="outline">{globalStats.topTierDistribution.BASICO} Básico</Badge>
                <Badge variant="secondary">{globalStats.topTierDistribution.PROFESIONAL} Pro</Badge>
                <Badge variant="default">{globalStats.topTierDistribution.PREMIUM} Premium</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">Pagos Pendientes</TabsTrigger>
          <TabsTrigger value="invoices">Facturación</TabsTrigger>
          <TabsTrigger value="settings">Configuración</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Agencias con Pagos Pendientes ({pendingPayments.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pendingPayments.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-lg font-medium">¡Todos los pagos están al día!</p>
                  <p className="text-muted-foreground">No hay agencias con pagos pendientes.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingPayments.map((agency) => (
                    <div key={agency.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Building2 className="h-5 w-5" />
                          <div>
                            <h3 className="font-medium">{agency.nombreAgencia}</h3>
                            <p className="text-sm text-muted-foreground">
                              {agency.marca.nombreMarca}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={getStatusColor(agency.estadoPago)}>
                            {agency.estadoPago}
                          </Badge>
                          <span className="text-lg font-bold text-red-600">
                            ${agency.saldoPendiente.toLocaleString('es-MX')}
                          </span>
                        </div>
                      </div>

                      {agency.facturas.length > 0 && (
                        <div className="mb-3">
                          <p className="text-sm font-medium mb-2">Facturas pendientes:</p>
                          <div className="space-y-1">
                            {agency.facturas.map((factura) => (
                              <div key={factura.id} className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded">
                                <span>{factura.numeroFactura}</span>
                                <span>${factura.total.toLocaleString('es-MX')}</span>
                                <span className="text-red-600">
                                  Vence: {format(new Date(factura.fechaVencimiento), 'dd/MM/yyyy')}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              size="sm" 
                              onClick={() => setSelectedAgency(agency)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CreditCard className="h-4 w-4 mr-2" />
                              Procesar Pago
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Procesar Pago - {agency.nombreAgencia}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label>Monto del Pago</Label>
                                <Input
                                  type="number"
                                  placeholder="0.00"
                                  value={paymentAmount}
                                  onChange={(e) => setPaymentAmount(e.target.value)}
                                />
                              </div>
                              <div>
                                <Label>Método de Pago</Label>
                                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="transferencia">Transferencia Bancaria</SelectItem>
                                    <SelectItem value="tarjeta">Tarjeta de Crédito</SelectItem>
                                    <SelectItem value="efectivo">Efectivo</SelectItem>
                                    <SelectItem value="cheque">Cheque</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label>Referencia/Comprobante</Label>
                                <Input
                                  placeholder="Número de referencia o comprobante"
                                  value={paymentReference}
                                  onChange={(e) => setPaymentReference(e.target.value)}
                                />
                              </div>
                              <Button 
                                onClick={processPayment} 
                                disabled={processing || !paymentAmount}
                                className="w-full"
                              >
                                {processing ? (
                                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                )}
                                Confirmar Pago
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>

                        {agency.estadoPago !== 'SUSPENDIDO' && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="destructive">
                                <Ban className="h-4 w-4 mr-2" />
                                Suspender
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Suspender Agencia - {agency.nombreAgencia}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <Alert>
                                  <AlertTriangle className="h-4 w-4" />
                                  <AlertDescription>
                                    Esta acción suspenderá todos los servicios de grabación para la agencia.
                                  </AlertDescription>
                                </Alert>
                                <div>
                                  <Label>Motivo de Suspensión</Label>
                                  <Textarea
                                    placeholder="Especifique el motivo de la suspensión..."
                                    value={suspendReason}
                                    onChange={(e) => setSuspendReason(e.target.value)}
                                  />
                                </div>
                                <Button 
                                  onClick={() => suspendAgency(agency.id)} 
                                  disabled={processing || !suspendReason}
                                  variant="destructive"
                                  className="w-full"
                                >
                                  {processing ? (
                                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                  ) : (
                                    <Ban className="h-4 w-4 mr-2" />
                                  )}
                                  Confirmar Suspensión
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}

                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline">
                              <Settings className="h-4 w-4 mr-2" />
                              Cambiar Tier
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Cambiar Tier de Servicio - {agency.nombreAgencia}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="grid grid-cols-3 gap-2">
                                <Button
                                  variant="outline"
                                  onClick={() => updateTier(agency.id, 'BASICO')}
                                  disabled={processing}
                                >
                                  Básico
                                  <br />
                                  <span className="text-xs">100 grab/mes</span>
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={() => updateTier(agency.id, 'PROFESIONAL')}
                                  disabled={processing}
                                >
                                  Profesional
                                  <br />
                                  <span className="text-xs">500 grab/mes</span>
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={() => updateTier(agency.id, 'PREMIUM')}
                                  disabled={processing}
                                >
                                  Premium
                                  <br />
                                  <span className="text-xs">2000 grab/mes</span>
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Generación de Facturas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Funcionalidad de generación automática de facturas en desarrollo.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuración del Sistema de Pagos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Configuraciones avanzadas del sistema de pagos en desarrollo.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
