
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, CheckCircle, XCircle, Clock, RefreshCw, Play, FileText } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

interface HealthCheck {
  service: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  responseTime: number;
  error?: string;
  metadata?: Record<string, any>;
}

interface SystemMetrics {
  timestamp: string;
  cpu: number;
  memory: number;
  diskUsage: number;
  activeConnections: number;
  responseTime: number;
  errorRate: number;
  throughput: number;
}

interface TestResult {
  testName: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: string;
  timestamp: string;
  category: 'unit' | 'integration' | 'e2e' | 'api';
}

interface TestSuite {
  suiteName: string;
  tests: TestResult[];
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  totalDuration: number;
  status: 'passed' | 'failed' | 'partial';
}

export default function MonitoringPage() {
  const { data: session } = useSession() || {};
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [testResults, setTestResults] = useState<TestSuite | null>(null);
  const [loading, setLoading] = useState(false);
  const [testRunning, setTestRunning] = useState(false);

  // Cargar estado del sistema
  const loadSystemStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/monitoring/health');
      const data = await response.json();
      
      if (data.success) {
        setSystemStatus(data.data);
      } else {
        toast.error('Error al cargar el estado del sistema');
      }
    } catch (error) {
      console.error('Error loading system status:', error);
      toast.error('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  // Ejecutar tests
  const runTests = async () => {
    setTestRunning(true);
    try {
      const response = await fetch('/api/testing/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });
      
      const data = await response.json();
      
      if (data.success) {
        setTestResults(data.data.suite);
        toast.success(`Tests completados: ${data.data.suite.passedTests}/${data.data.suite.totalTests} exitosos`);
      } else {
        toast.error('Error al ejecutar tests');
      }
    } catch (error) {
      console.error('Error running tests:', error);
      toast.error('Error de conexión');
    } finally {
      setTestRunning(false);
    }
  };

  // Cargar datos iniciales
  useEffect(() => {
    loadSystemStatus();
    const interval = setInterval(loadSystemStatus, 30000); // Actualizar cada 30 segundos
    return () => clearInterval(interval);
  }, []);

  // Función para obtener el icono del estado
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'passed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'unhealthy':
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'degraded':
      case 'partial':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'skipped':
        return <Clock className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  // Función para obtener el color del badge
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'passed':
        return 'default'; // Verde por defecto
      case 'unhealthy':
      case 'failed':
        return 'destructive';
      case 'degraded':
      case 'partial':
        return 'secondary';
      case 'skipped':
        return 'outline';
      default:
        return 'outline';
    }
  };

  if (!session) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardContent className="pt-6">
            <p>Debes iniciar sesión para acceder al sistema de monitoreo.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Sistema de Monitoreo y Testing</h1>
          <p className="text-muted-foreground">
            Monitor del estado del sistema DynamicFin CRM y ejecución de tests
          </p>
        </div>
        <div className="flex space-x-2">
          <Button 
            onClick={loadSystemStatus} 
            disabled={loading}
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Button 
            onClick={runTests} 
            disabled={testRunning}
          >
            <Play className={`h-4 w-4 mr-2 ${testRunning ? 'animate-pulse' : ''}`} />
            {testRunning ? 'Ejecutando...' : 'Ejecutar Tests'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="health" className="space-y-4">
        <TabsList>
          <TabsTrigger value="health">Health Checks</TabsTrigger>
          <TabsTrigger value="metrics">Métricas</TabsTrigger>
          <TabsTrigger value="tests">Tests</TabsTrigger>
          <TabsTrigger value="alerts">Alertas</TabsTrigger>
        </TabsList>

        <TabsContent value="health" className="space-y-4">
          {systemStatus && (
            <>
              {/* Estado General */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    {getStatusIcon(systemStatus.overall)}
                    <span>Estado General del Sistema</span>
                  </CardTitle>
                  <CardDescription>
                    Última actualización: {new Date(systemStatus.checks[0]?.timestamp || Date.now()).toLocaleString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Badge variant={getStatusColor(systemStatus.overall)}>
                    {systemStatus.overall.toUpperCase()}
                  </Badge>
                </CardContent>
              </Card>

              {/* Health Checks Individuales */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {systemStatus.checks?.map((check: HealthCheck, index: number) => (
                  <Card key={index}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center space-x-2">
                        {getStatusIcon(check.status)}
                        <span className="capitalize">{check.service}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <Badge variant={getStatusColor(check.status)}>
                          {check.status.toUpperCase()}
                        </Badge>
                        <p className="text-sm text-muted-foreground">
                          Tiempo de respuesta: {check.responseTime}ms
                        </p>
                        {check.error && (
                          <p className="text-sm text-red-500">
                            Error: {check.error}
                          </p>
                        )}
                        {check.metadata && (
                          <div className="text-xs text-muted-foreground">
                            {Object.entries(check.metadata).map(([key, value]) => (
                              <div key={key}>
                                {key}: {String(value)}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          {systemStatus?.metrics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Memoria</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {Math.round(systemStatus.metrics.memory)} MB
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">CPU</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {Math.round(systemStatus.metrics.cpu)}%
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Tiempo de Respuesta</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {systemStatus.metrics.responseTime}ms
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Tasa de Error</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {systemStatus.metrics.errorRate}%
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="tests" className="space-y-4">
          {testResults && (
            <>
              {/* Resumen de Tests */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    {getStatusIcon(testResults.status)}
                    <span>{testResults.suiteName}</span>
                  </CardTitle>
                  <CardDescription>
                    Duración total: {testResults.totalDuration}ms
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-green-500">
                        {testResults.passedTests}
                      </div>
                      <div className="text-sm text-muted-foreground">Exitosos</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-red-500">
                        {testResults.failedTests}
                      </div>
                      <div className="text-sm text-muted-foreground">Fallidos</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-500">
                        {testResults.skippedTests}
                      </div>
                      <div className="text-sm text-muted-foreground">Omitidos</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">
                        {testResults.totalTests}
                      </div>
                      <div className="text-sm text-muted-foreground">Total</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tests Individuales */}
              <div className="grid grid-cols-1 gap-4">
                {testResults.tests?.map((test: TestResult, index: number) => (
                  <Card key={index}>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(test.status)}
                          <div>
                            <div className="font-medium">{test.testName}</div>
                            <div className="text-sm text-muted-foreground">
                              Categoría: {test.category} • Duración: {test.duration}ms
                            </div>
                          </div>
                        </div>
                        <Badge variant={getStatusColor(test.status)}>
                          {test.status.toUpperCase()}
                        </Badge>
                      </div>
                      {test.error && (
                        <div className="mt-2 text-sm text-red-500 bg-red-50 p-2 rounded">
                          {test.error}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}

          {!testResults && !testRunning && (
            <Card>
              <CardContent className="pt-6 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No hay resultados de tests disponibles. Haz clic en "Ejecutar Tests" para comenzar.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          {systemStatus?.alerts && systemStatus.alerts.length > 0 ? (
            <div className="space-y-2">
              {systemStatus.alerts.map((alert: string, index: number) => (
                <Card key={index}>
                  <CardContent className="pt-4">
                    <div className="flex items-start space-x-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                      <p className="text-sm">{alert}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No hay alertas activas. El sistema está funcionando correctamente.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
