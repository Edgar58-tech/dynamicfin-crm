
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  Settings, 
  Target,
  DollarSign,
  Users,
  Zap,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Save,
  Plus,
  Edit3,
  Trash2,
  Calendar,
  Percent,
  TrendingUp,
  Award
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import toast from 'react-hot-toast';

interface MetaVendedor {
  id?: number;
  vendedorId: string;
  vendedorNombre: string;
  especialidad: string;
  metaAutos: number;
  metaIngresos: number;
  mes: number;
  year: number;
  activo: boolean;
}

interface EsquemaComision {
  id?: number;
  vendedorId: string;
  vendedorNombre: string;
  nombre: string;
  porcentajeBase: number;
  bonoVolumen: number;
  bonoMargen: number;
  incentivesReferencia: number;
  incentiveMejora: number;
  activo: boolean;
}

interface AutomatizacionWorkflow {
  id?: number;
  nombre: string;
  tipoTrigger: string;
  condiciones: any;
  acciones: any;
  activo: boolean;
}

export default function ConfiguracionPage() {
  const { data: session, status } = useSession();
  const [metasVendedores, setMetasVendedores] = useState<MetaVendedor[]>([]);
  const [esquemasComision, setEsquemasComision] = useState<EsquemaComision[]>([]);
  const [automatizaciones, setAutomatizaciones] = useState<AutomatizacionWorkflow[]>([]);
  const [selectedMeta, setSelectedMeta] = useState<MetaVendedor | null>(null);
  const [selectedComision, setSelectedComision] = useState<EsquemaComision | null>(null);
  const [selectedAutomatizacion, setSelectedAutomatizacion] = useState<AutomatizacionWorkflow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConfiguracionData();
  }, []);

  const fetchConfiguracionData = async () => {
    try {
      setLoading(true);
      
      // Simular data hasta que la API esté lista
      const mockMetas: MetaVendedor[] = [
        {
          id: 1,
          vendedorId: '1',
          vendedorNombre: 'Carlos Hernández',
          especialidad: 'SUVs Premium',
          metaAutos: 8,
          metaIngresos: 5200000,
          mes: 9,
          year: 2025,
          activo: true
        },
        {
          id: 2,
          vendedorId: '2',
          vendedorNombre: 'María González',
          especialidad: 'Autos Familiares',
          metaAutos: 6,
          metaIngresos: 3600000,
          mes: 9,
          year: 2025,
          activo: true
        },
        {
          id: 3,
          vendedorId: '3',
          vendedorNombre: 'Ana López',
          especialidad: 'Autos Compactos',
          metaAutos: 4,
          metaIngresos: 2400000,
          mes: 9,
          year: 2025,
          activo: true
        },
        {
          id: 4,
          vendedorId: '4',
          vendedorNombre: 'Pedro Ramírez',
          especialidad: 'Sedanes',
          metaAutos: 5,
          metaIngresos: 3000000,
          mes: 9,
          year: 2025,
          activo: true
        }
      ];

      const mockComisiones: EsquemaComision[] = [
        {
          id: 1,
          vendedorId: '1',
          vendedorNombre: 'Carlos Hernández',
          nombre: 'Senior Premium',
          porcentajeBase: 5.0,
          bonoVolumen: 15000,
          bonoMargen: 8000,
          incentivesReferencia: 25000,
          incentiveMejora: 0,
          activo: true
        },
        {
          id: 2,
          vendedorId: '2',
          vendedorNombre: 'María González',
          nombre: 'Senior',
          porcentajeBase: 5.0,
          bonoVolumen: 15000,
          bonoMargen: 8000,
          incentivesReferencia: 25000,
          incentiveMejora: 0,
          activo: true
        },
        {
          id: 3,
          vendedorId: '3',
          vendedorNombre: 'Ana López',
          nombre: 'En Desarrollo',
          porcentajeBase: 4.0,
          bonoVolumen: 0,
          bonoMargen: 0,
          incentivesReferencia: 15000,
          incentiveMejora: 20000,
          activo: true
        },
        {
          id: 4,
          vendedorId: '4',
          vendedorNombre: 'Pedro Ramírez',
          nombre: 'Regular',
          porcentajeBase: 4.5,
          bonoVolumen: 12000,
          bonoMargen: 5000,
          incentivesReferencia: 20000,
          incentiveMejora: 5000,
          activo: true
        }
      ];

      const mockAutomatizaciones: AutomatizacionWorkflow[] = [
        {
          id: 1,
          nombre: 'Reasignación por falta de seguimiento',
          tipoTrigger: 'tiempo_sin_contacto',
          condiciones: {
            tiempoSinContacto: 72,
            clasificacionMinima: 'Calificado'
          },
          acciones: {
            tipo: 'reasignar',
            criterios: ['especialidad', 'disponibilidad', 'conversion']
          },
          activo: true
        },
        {
          id: 2,
          nombre: 'Alerta vendedor sobrecargado',
          tipoTrigger: 'vendedor_sobrecarga',
          condiciones: {
            leadsActivos: 35,
            conversionBajo: 15
          },
          acciones: {
            tipo: 'alerta',
            destinatario: 'gerente',
            mensaje: 'Vendedor necesita redistribución de leads'
          },
          activo: true
        },
        {
          id: 3,
          nombre: 'Auto-asignación leads premium',
          tipoTrigger: 'lead_entrada',
          condiciones: {
            presupuestoMinimo: 800000,
            clasificacion: 'Elite'
          },
          acciones: {
            tipo: 'asignar',
            criterios: ['top_performer', 'especialidad']
          },
          activo: true
        }
      ];

      setMetasVendedores(mockMetas);
      setEsquemasComision(mockComisiones);
      setAutomatizaciones(mockAutomatizaciones);
      
    } catch (error) {
      console.error('Error fetching configuracion data:', error);
      toast.error('Error al cargar configuración');
    } finally {
      setLoading(false);
    }
  };

  const guardarMeta = async () => {
    if (!selectedMeta) return;

    try {
      const response = await fetch('/api/gerente/metas', {
        method: selectedMeta.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedMeta)
      });

      if (response.ok) {
        toast.success('Meta guardada exitosamente');
        setSelectedMeta(null);
        fetchConfiguracionData();
      } else {
        toast.error('Error al guardar meta');
      }
    } catch (error) {
      toast.error('Error de conexión');
    }
  };

  const guardarComision = async () => {
    if (!selectedComision) return;

    try {
      const response = await fetch('/api/gerente/comisiones', {
        method: selectedComision.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedComision)
      });

      if (response.ok) {
        toast.success('Esquema de comisión guardado exitosamente');
        setSelectedComision(null);
        fetchConfiguracionData();
      } else {
        toast.error('Error al guardar esquema de comisión');
      }
    } catch (error) {
      toast.error('Error de conexión');
    }
  };

  const guardarAutomatizacion = async () => {
    if (!selectedAutomatizacion) return;

    try {
      const response = await fetch('/api/gerente/automatizaciones', {
        method: selectedAutomatizacion.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedAutomatizacion)
      });

      if (response.ok) {
        toast.success('Automatización guardada exitosamente');
        setSelectedAutomatizacion(null);
        fetchConfiguracionData();
      } else {
        toast.error('Error al guardar automatización');
      }
    } catch (error) {
      toast.error('Error de conexión');
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-slate-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!session || session.user.rol !== 'GERENTE_VENTAS') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-slate-600">Acceso restringido a gerentes de ventas únicamente</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            ⚙️ Configuración del Sistema
          </h1>
          <p className="text-slate-600 mt-1">
            Personaliza metas, comisiones y automatizaciones de tu agencia automotriz
          </p>
        </div>
        <Button 
          onClick={fetchConfiguracionData}
          variant="outline"
          className="gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Actualizar
        </Button>
      </div>

      {/* Tabs de Configuración */}
      <Tabs defaultValue="metas" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="metas" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Metas y Objetivos
          </TabsTrigger>
          <TabsTrigger value="comisiones" className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Esquemas de Comisiones
          </TabsTrigger>
          <TabsTrigger value="automatizaciones" className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Automatizaciones
          </TabsTrigger>
        </TabsList>

        {/* Metas y Objetivos */}
        <TabsContent value="metas">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Metas Mensuales por Vendedor
                  </CardTitle>
                  <CardDescription>
                    Establece metas individualizadas basadas en especialización y experiencia
                  </CardDescription>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      className="gap-2"
                      onClick={() => setSelectedMeta({
                        vendedorId: '',
                        vendedorNombre: '',
                        especialidad: '',
                        metaAutos: 0,
                        metaIngresos: 0,
                        mes: new Date().getMonth() + 1,
                        year: new Date().getFullYear(),
                        activo: true
                      })}
                    >
                      <Plus className="w-4 h-4" />
                      Nueva Meta
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Configurar Meta de Vendedor</DialogTitle>
                      <DialogDescription>
                        Establece metas personalizadas para optimizar el rendimiento
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                      <div>
                        <Label>Vendedor</Label>
                        <Select 
                          value={selectedMeta?.vendedorId || ''} 
                          onValueChange={(value) => {
                            const vendedor = metasVendedores.find(m => m.vendedorId === value);
                            setSelectedMeta(prev => prev ? {
                              ...prev,
                              vendedorId: value,
                              vendedorNombre: vendedor?.vendedorNombre || '',
                              especialidad: vendedor?.especialidad || ''
                            } : null);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona vendedor..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">Carlos Hernández</SelectItem>
                            <SelectItem value="2">María González</SelectItem>
                            <SelectItem value="3">Ana López</SelectItem>
                            <SelectItem value="4">Pedro Ramírez</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Meta Autos</Label>
                          <Input 
                            type="number" 
                            value={selectedMeta?.metaAutos || 0}
                            onChange={(e) => setSelectedMeta(prev => prev ? {
                              ...prev,
                              metaAutos: parseInt(e.target.value) || 0
                            } : null)}
                          />
                        </div>
                        <div>
                          <Label>Meta Ingresos ($)</Label>
                          <Input 
                            type="number" 
                            value={selectedMeta?.metaIngresos || 0}
                            onChange={(e) => setSelectedMeta(prev => prev ? {
                              ...prev,
                              metaIngresos: parseInt(e.target.value) || 0
                            } : null)}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Mes</Label>
                          <Select 
                            value={selectedMeta?.mes.toString() || ''} 
                            onValueChange={(value) => setSelectedMeta(prev => prev ? {
                              ...prev,
                              mes: parseInt(value)
                            } : null)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 12 }, (_, i) => (
                                <SelectItem key={i + 1} value={(i + 1).toString()}>
                                  {new Date(0, i).toLocaleString('es-ES', { month: 'long' })}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Año</Label>
                          <Input 
                            type="number" 
                            value={selectedMeta?.year || 2025}
                            onChange={(e) => setSelectedMeta(prev => prev ? {
                              ...prev,
                              year: parseInt(e.target.value) || 2025
                            } : null)}
                          />
                        </div>
                      </div>
                    </div>

                    <DialogFooter>
                      <Button variant="outline" onClick={() => setSelectedMeta(null)}>
                        Cancelar
                      </Button>
                      <Button onClick={guardarMeta}>
                        <Save className="w-4 h-4 mr-2" />
                        Guardar Meta
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metasVendedores.map((meta, index) => (
                  <motion.div
                    key={meta.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="p-4 border rounded-lg hover:shadow-md transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Target className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold">{meta.vendedorNombre}</h4>
                          <p className="text-sm text-slate-600">{meta.especialidad}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-6 text-center">
                        <div>
                          <p className="text-xs text-slate-500">Meta Autos</p>
                          <p className="font-bold text-lg">{meta.metaAutos}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Meta Ingresos</p>
                          <p className="font-bold text-lg">
                            ${meta.metaIngresos.toLocaleString('es-MX')}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge className={meta.activo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {meta.activo ? 'Activo' : 'Inactivo'}
                        </Badge>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setSelectedMeta(meta)}
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Esquemas de Comisiones */}
        <TabsContent value="comisiones">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Esquemas de Comisiones Personalizables
                  </CardTitle>
                  <CardDescription>
                    Configura comisiones base, bonos por volumen, margen y referidos
                  </CardDescription>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      className="gap-2"
                      onClick={() => setSelectedComision({
                        vendedorId: '',
                        vendedorNombre: '',
                        nombre: '',
                        porcentajeBase: 0,
                        bonoVolumen: 0,
                        bonoMargen: 0,
                        incentivesReferencia: 0,
                        incentiveMejora: 0,
                        activo: true
                      })}
                    >
                      <Plus className="w-4 h-4" />
                      Nuevo Esquema
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Configurar Esquema de Comisiones</DialogTitle>
                      <DialogDescription>
                        Personaliza la estructura de comisiones según el nivel del vendedor
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Vendedor</Label>
                          <Select 
                            value={selectedComision?.vendedorId || ''} 
                            onValueChange={(value) => {
                              const vendedor = metasVendedores.find(m => m.vendedorId === value);
                              setSelectedComision(prev => prev ? {
                                ...prev,
                                vendedorId: value,
                                vendedorNombre: vendedor?.vendedorNombre || ''
                              } : null);
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona vendedor..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">Carlos Hernández</SelectItem>
                              <SelectItem value="2">María González</SelectItem>
                              <SelectItem value="3">Ana López</SelectItem>
                              <SelectItem value="4">Pedro Ramírez</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Nombre del Esquema</Label>
                          <Input 
                            value={selectedComision?.nombre || ''}
                            onChange={(e) => setSelectedComision(prev => prev ? {
                              ...prev,
                              nombre: e.target.value
                            } : null)}
                            placeholder="Ej: Senior Premium"
                          />
                        </div>
                      </div>

                      <div>
                        <Label>Porcentaje Base (%)</Label>
                        <Input 
                          type="number" 
                          step="0.1"
                          value={selectedComision?.porcentajeBase || 0}
                          onChange={(e) => setSelectedComision(prev => prev ? {
                            ...prev,
                            porcentajeBase: parseFloat(e.target.value) || 0
                          } : null)}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Bono por Volumen ($)</Label>
                          <Input 
                            type="number" 
                            value={selectedComision?.bonoVolumen || 0}
                            onChange={(e) => setSelectedComision(prev => prev ? {
                              ...prev,
                              bonoVolumen: parseInt(e.target.value) || 0
                            } : null)}
                            placeholder="Por cada auto sobre meta"
                          />
                        </div>
                        <div>
                          <Label>Bono por Margen ($)</Label>
                          <Input 
                            type="number" 
                            value={selectedComision?.bonoMargen || 0}
                            onChange={(e) => setSelectedComision(prev => prev ? {
                              ...prev,
                              bonoMargen: parseInt(e.target.value) || 0
                            } : null)}
                            placeholder="Por auto con margen >20%"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Incentivo por Referencia ($)</Label>
                          <Input 
                            type="number" 
                            value={selectedComision?.incentivesReferencia || 0}
                            onChange={(e) => setSelectedComision(prev => prev ? {
                              ...prev,
                              incentivesReferencia: parseInt(e.target.value) || 0
                            } : null)}
                            placeholder="Por cliente referido"
                          />
                        </div>
                        <div>
                          <Label>Incentivo por Mejora ($)</Label>
                          <Input 
                            type="number" 
                            value={selectedComision?.incentiveMejora || 0}
                            onChange={(e) => setSelectedComision(prev => prev ? {
                              ...prev,
                              incentiveMejora: parseInt(e.target.value) || 0
                            } : null)}
                            placeholder="Por mejora mensual"
                          />
                        </div>
                      </div>
                    </div>

                    <DialogFooter>
                      <Button variant="outline" onClick={() => setSelectedComision(null)}>
                        Cancelar
                      </Button>
                      <Button onClick={guardarComision}>
                        <Save className="w-4 h-4 mr-2" />
                        Guardar Esquema
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {esquemasComision.map((esquema, index) => (
                  <motion.div
                    key={esquema.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="p-4 border rounded-lg hover:shadow-md transition-all"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                          <DollarSign className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold">{esquema.vendedorNombre}</h4>
                          <p className="text-sm text-slate-600">{esquema.nombre}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={esquema.activo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {esquema.activo ? 'Activo' : 'Inactivo'}
                        </Badge>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setSelectedComision(esquema)}
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-5 gap-4 text-center">
                      <div>
                        <p className="text-xs text-slate-500">Base</p>
                        <p className="font-bold">{esquema.porcentajeBase}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Bono Volumen</p>
                        <p className="font-bold">${esquema.bonoVolumen.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Bono Margen</p>
                        <p className="font-bold">${esquema.bonoMargen.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Referencia</p>
                        <p className="font-bold">${esquema.incentivesReferencia.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Mejora</p>
                        <p className="font-bold">${esquema.incentiveMejora.toLocaleString()}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Automatizaciones */}
        <TabsContent value="automatizaciones">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    Automatizaciones y Workflows
                  </CardTitle>
                  <CardDescription>
                    Configura reglas automáticas para optimizar la gestión de leads
                  </CardDescription>
                </div>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Nueva Automatización
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {automatizaciones.map((auto, index) => (
                  <motion.div
                    key={auto.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="p-4 border rounded-lg hover:shadow-md transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                          <Zap className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold">{auto.nombre}</h4>
                          <p className="text-sm text-slate-600">
                            Trigger: {auto.tipoTrigger.replace('_', ' ')}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Switch 
                          checked={auto.activo}
                          onCheckedChange={(checked) => {
                            // Aquí actualizarías el estado
                          }}
                        />
                        <Badge className={auto.activo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {auto.activo ? 'Activo' : 'Inactivo'}
                        </Badge>
                        <Button 
                          size="sm" 
                          variant="outline"
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
