
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  MapPin,
  Settings,
  Activity,
  History,
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  BarChart3,
  MapIcon,
  Smartphone,
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

// Importar componentes específicos
import ProximityRecording from '@/components/proximity-recording';
import ZoneManagement from './zone-management';
import ProximityHistory from './proximity-history';
import ProximityStats from './proximity-stats';

export default function ProximityDashboardClient() {
  const { data: session } = useSession();
  const [estadoSistema, setEstadoSistema] = useState<any>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabActiva, setTabActiva] = useState('sistema');

  /**
   * Cargar estado inicial del sistema
   */
  useEffect(() => {
    cargarEstadoSistema();
  }, []);

  /**
   * Cargar estado del sistema de proximidad
   */
  const cargarEstadoSistema = async () => {
    try {
      setCargando(true);
      setError(null);

      const response = await fetch('/api/proximity/status?detalle=true');
      const data = await response.json();

      if (response.ok) {
        setEstadoSistema(data);
      } else {
        throw new Error(data.error || 'Error al cargar estado del sistema');
      }
    } catch (error) {
      console.error('Error cargando estado:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido');
      toast.error('Error al cargar el estado del sistema');
    } finally {
      setCargando(false);
    }
  };

  /**
   * Manejar inicio de grabación
   */
  const handleRecordingStart = (data: any) => {
    console.log('Recording started:', data);
    toast.success(`🎙️ Grabación iniciada en ${data.zona?.nombre}`);
    cargarEstadoSistema(); // Actualizar estado
  };

  /**
   * Manejar fin de grabación
   */
  const handleRecordingEnd = (data: any) => {
    console.log('Recording ended:', data);
    toast.success('✅ Grabación finalizada');
    cargarEstadoSistema(); // Actualizar estado
  };

  /**
   * Manejar actualización de ubicación
   */
  const handleLocationUpdate = (location: any) => {
    console.log('Location updated:', location);
    // Opcional: actualizar estado en tiempo real
  };

  if (cargando) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando sistema de proximidad...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {error}
            <Button
              variant="ghost"
              size="sm"
              className="ml-2 h-6 px-2 text-red-600 hover:text-red-700"
              onClick={() => setError(null)}
            >
              ✕
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Panel de estado rápido */}
      {estadoSistema && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MapPin className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">
                  {estadoSistema.estadoSistema?.zonasActivas || 0}
                </p>
                <p className="text-sm text-gray-600">Zonas Activas</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {estadoSistema.estadoSistema?.vendedoresActivos || 0}
                </p>
                <p className="text-sm text-gray-600">Vendedores Activos</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Activity className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-600">
                  {estadoSistema.estadoSistema?.grabacionesActivas || 0}
                </p>
                <p className="text-sm text-gray-600">Grabando Ahora</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <BarChart3 className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600">
                  {estadoSistema.estadoSistema?.grabacionesHoy || 0}
                </p>
                <p className="text-sm text-gray-600">Hoy</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs principales */}
      <Tabs value={tabActiva} onValueChange={setTabActiva} className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="sistema" className="flex items-center gap-2">
            <Smartphone className="w-4 h-4" />
            Sistema
          </TabsTrigger>
          <TabsTrigger 
            value="zonas" 
            className="flex items-center gap-2"
            disabled={session?.user?.rol === 'VENDEDOR'}
          >
            <MapIcon className="w-4 h-4" />
            Zonas
          </TabsTrigger>
          <TabsTrigger value="historial" className="flex items-center gap-2">
            <History className="w-4 h-4" />
            Historial
          </TabsTrigger>
          <TabsTrigger value="estadisticas" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Estadísticas
          </TabsTrigger>
        </TabsList>

        {/* Tab Sistema - Componente principal de proximidad */}
        <TabsContent value="sistema">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <ProximityRecording
              onRecordingStart={handleRecordingStart}
              onRecordingEnd={handleRecordingEnd}
              onLocationUpdate={handleLocationUpdate}
            />
          </motion.div>
        </TabsContent>

        {/* Tab Zonas - Solo para gerentes */}
        <TabsContent value="zonas">
          {session?.user?.rol === 'VENDEDOR' ? (
            <Card>
              <CardContent className="text-center p-8">
                <AlertTriangle className="w-12 h-12 text-orange-400 mx-auto mb-4" />
                <p className="text-gray-600">Solo los gerentes pueden gestionar zonas</p>
                <p className="text-sm text-gray-500 mt-2">
                  Contacta a tu gerente para configurar o modificar zonas de proximidad
                </p>
              </CardContent>
            </Card>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <ZoneManagement />
            </motion.div>
          )}
        </TabsContent>

        {/* Tab Historial */}
        <TabsContent value="historial">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <ProximityHistory />
          </motion.div>
        </TabsContent>

        {/* Tab Estadísticas */}
        <TabsContent value="estadisticas">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <ProximityStats estadoSistema={estadoSistema} />
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

