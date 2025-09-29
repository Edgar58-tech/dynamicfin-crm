
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { 
  Calculator,
  DollarSign,
  TrendingUp,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Download,
  Plus,
  Filter,
  Calendar,
  Receipt,
  CreditCard,
  AlertTriangle,
  Eye,
  Edit,
  Trash2,
  BarChart3
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

interface RegistroComision {
  id: number;
  vendedorId: string;
  esquemaComisionId: number;
  prospectoId: number | null;
  mes: number;
  year: number;
  tipoComision: string;
  montoVenta: number;
  porcentaje: number;
  montoComision: number;
  pagado: boolean;
  fechaPago: string | null;
  notas: string | null;
  createdAt: string;
  vendedor: {
    nombre: string;
    apellido: string;
  };
  esquemaComision: {
    nombre: string;
    porcentajeBase: number;
  };
  prospecto: {
    nombre: string;
    vehiculoInteres: string;
  } | null;
}

interface EsquemaComision {
  id: number;
  vendedorId: string;
  nombre: string;
  porcentajeBase: number;
  bonoVolumen: number;
  bonoMargen: number;
  incentiveReferencia: number;
  incentiveMejora: number;
  fechaInicio: string;
  fechaFin: string | null;
  activo: boolean;
  vendedor: {
    id: string;
    nombre: string;
    apellido: string;
  };
  _count: {
    comisionesGeneradas: number;
  };
}

interface ResumenGeneral {
  totalComisiones: number;
  totalRegistros: number;
  montosPagados: number;
  registrosPagados: number;
  montosPendientes: number;
  registrosPendientes: number;
}

interface TopVendedor {
  vendedorId: string;
  nombre: string;
  montoTotal: number;
}

export default function PagosComisionesPage() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [comisiones, setComisiones] = useState<RegistroComision[]>([]);
  const [esquemas, setEsquemas] = useState<EsquemaComision[]>([]);
  const [resumenGeneral, setResumenGeneral] = useState<ResumenGeneral | null>(null);
  const [topVendedores, setTopVendedores] = useState<TopVendedor[]>([]);
  const [selectedMes, setSelectedMes] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [filtroVendedor, setFiltroVendedor] = useState('');
  const [showCreateEsquemaModal, setShowCreateEsquemaModal] = useState(false);
  const [showCalcularModal, setShowCalcularModal] = useState(false);
  const [showPagarModal, setShowPagarModal] = useState(false);
  const [selectedComisiones, setSelectedComisiones] = useState<number[]>([]);
  
  const [esquemaForm, setEsquemaForm] = useState({
    vendedorId: '',
    nombre: '',
    porcentajeBase: '',
    bonoVolumen: '',
    bonoMargen: '',
    incentiveReferencia: '',
    incentiveMejora: ''
  });

  const meses = [
    { value: 1, label: 'Enero' },
    { value: 2, label: 'Febrero' },
    { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Mayo' },
    { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' },
    { value: 11, label: 'Noviembre' },
    { value: 12, label: 'Diciembre' }
  ];

  useEffect(() => {
    if (status === 'authenticated') {
      loadDatos();
    }
  }, [status, selectedMes, selectedYear]);

  const loadDatos = async () => {
    try {
      setLoading(true);

      // Cargar resumen general
      const resumenResponse = await fetch(`/api/comisiones?action=resumen-general&mes=${selectedMes}&year=${selectedYear}`);
      if (resumenResponse.ok) {
        const resumenData = await resumenResponse.json();
        setResumenGeneral(resumenData.data.resumen);
        setTopVendedores(resumenData.data.topVendedores);
      }

      // Cargar comisiones
      const comisionesResponse = await fetch(`/api/comisiones?mes=${selectedMes}&year=${selectedYear}&vendedorId=${filtroVendedor}`);
      if (comisionesResponse.ok) {
        const comisionesData = await comisionesResponse.json();
        setComisiones(comisionesData.data);
      }

      // Cargar esquemas activos
      const esquemasResponse = await fetch('/api/comisiones?action=esquemas-activos');
      if (esquemasResponse.ok) {
        const esquemasData = await esquemasResponse.json();
        setEsquemas(esquemasData.data);
      }

    } catch (error) {
      console.error('Error al cargar datos:', error);
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleCrearEsquema = async () => {
    try {
      const response = await fetch('/api/comisiones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'crear-esquema',
          ...esquemaForm
        })
      });

      if (response.ok) {
        toast.success('Esquema de comisiones creado exitosamente');
        setShowCreateEsquemaModal(false);
        resetEsquemaForm();
        loadDatos();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al crear esquema');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error de conexión');
    }
  };

  const handleCalcularComisiones = async () => {
    try {
      const response = await fetch('/api/comisiones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'calcular-comisiones',
          mes: selectedMes,
          year: selectedYear
        })
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`Calculadas ${data.data.comisionesCreadas} nuevas comisiones`);
        setShowCalcularModal(false);
        loadDatos();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al calcular comisiones');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error de conexión');
    }
  };

  const handleMarcarPagado = async () => {
    if (selectedComisiones.length === 0) {
      toast.error('Selecciona al menos una comisión');
      return;
    }

    try {
      const response = await fetch('/api/comisiones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'marcar-pagado',
          comisionIds: selectedComisiones,
          fechaPago: new Date().toISOString(),
          notas: 'Marcado como pagado desde dashboard'
        })
      });

      if (response.ok) {
        toast.success('Comisiones marcadas como pagadas');
        setShowPagarModal(false);
        setSelectedComisiones([]);
        loadDatos();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al marcar como pagado');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error de conexión');
    }
  };

  const handleToggleComision = (comisionId: number) => {
    setSelectedComisiones(prev => 
      prev.includes(comisionId) 
        ? prev.filter(id => id !== comisionId)
        : [...prev, comisionId]
    );
  };

  const resetEsquemaForm = () => {
    setEsquemaForm({
      vendedorId: '',
      nombre: '',
      porcentajeBase: '',
      bonoVolumen: '',
      bonoMargen: '',
      incentiveReferencia: '',
      incentiveMejora: ''
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  if (status === 'loading' || loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-8 w-64 bg-slate-200 animate-pulse rounded"></div>
          <div className="h-10 w-40 bg-slate-200 animate-pulse rounded"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-200 animate-pulse rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!session?.user || !['GERENTE_VENTAS', 'GERENTE_GENERAL', 'DIRECTOR_MARCA', 'DIRECTOR_GENERAL', 'DYNAMICFIN_ADMIN'].includes(session.user.rol)) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-slate-800 mb-2">Acceso Restringido</h2>
        <p className="text-slate-600">No tienes permisos para gestionar comisiones.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <Calculator className="w-8 h-8 text-green-600" />
            Comisiones y Pagos
          </h1>
          <p className="text-slate-600 mt-1">
            Gestión de comisiones por vendedor y control de pagos
          </p>
        </div>
        
        <div className="flex gap-3">
          <Dialog open={showCreateEsquemaModal} onOpenChange={setShowCreateEsquemaModal}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Plus className="w-4 h-4" />
                Esquema Comisiones
              </Button>
            </DialogTrigger>
          </Dialog>
          
          <Dialog open={showCalcularModal} onOpenChange={setShowCalcularModal}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Calculator className="w-4 h-4" />
                Calcular Comisiones
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-4 items-center">
            <div className="flex gap-2">
              <Label htmlFor="mes">Mes:</Label>
              <Select value={selectedMes.toString()} onValueChange={(value) => setSelectedMes(parseInt(value))}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {meses.map(mes => (
                    <SelectItem key={mes.value} value={mes.value.toString()}>
                      {mes.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex gap-2">
              <Label htmlFor="year">Año:</Label>
              <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2024, 2025, 2026].map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 flex-1">
              <Label htmlFor="vendedor">Filtrar por vendedor:</Label>
              <Input
                id="vendedor"
                placeholder="ID del vendedor..."
                value={filtroVendedor}
                onChange={(e) => setFiltroVendedor(e.target.value)}
                className="max-w-48"
              />
            </div>

            <Button onClick={loadDatos} variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Aplicar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resumen */}
      {resumenGeneral && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Total Comisiones</p>
                  <p className="text-2xl font-bold text-slate-800">
                    {formatCurrency(resumenGeneral.totalComisiones)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Pagadas</p>
                  <p className="text-2xl font-bold text-slate-800">
                    {formatCurrency(resumenGeneral.montosPagados)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Pendientes</p>
                  <p className="text-2xl font-bold text-slate-800">
                    {formatCurrency(resumenGeneral.montosPendientes)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Registros</p>
                  <p className="text-2xl font-bold text-slate-800">
                    {resumenGeneral.totalRegistros}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="comisiones" className="space-y-6">
        <TabsList>
          <TabsTrigger value="comisiones">Registros de Comisiones</TabsTrigger>
          <TabsTrigger value="esquemas">Esquemas Activos</TabsTrigger>
          <TabsTrigger value="top-vendedores">Top Vendedores</TabsTrigger>
        </TabsList>

        <TabsContent value="comisiones" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Registros de Comisiones</CardTitle>
                  <CardDescription>
                    {meses.find(m => m.value === selectedMes)?.label} {selectedYear}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  {selectedComisiones.length > 0 && (
                    <Button
                      onClick={() => setShowPagarModal(true)}
                      className="gap-2"
                      variant="outline"
                    >
                      <CreditCard className="w-4 h-4" />
                      Marcar como Pagado ({selectedComisiones.length})
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">
                        <input
                          type="checkbox"
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedComisiones(comisiones.map(c => c.id));
                            } else {
                              setSelectedComisiones([]);
                            }
                          }}
                          checked={selectedComisiones.length === comisiones.length && comisiones.length > 0}
                        />
                      </th>
                      <th className="text-left p-2">Vendedor</th>
                      <th className="text-left p-2">Prospecto</th>
                      <th className="text-left p-2">Tipo</th>
                      <th className="text-left p-2">Monto Venta</th>
                      <th className="text-left p-2">%</th>
                      <th className="text-left p-2">Comisión</th>
                      <th className="text-left p-2">Estado</th>
                      <th className="text-left p-2">Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comisiones.map((comision) => (
                      <motion.tr
                        key={comision.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="border-b hover:bg-slate-50"
                      >
                        <td className="p-2">
                          <input
                            type="checkbox"
                            checked={selectedComisiones.includes(comision.id)}
                            onChange={() => handleToggleComision(comision.id)}
                            disabled={comision.pagado}
                          />
                        </td>
                        <td className="p-2">
                          <div>
                            <div className="font-medium">
                              {comision.vendedor.nombre} {comision.vendedor.apellido}
                            </div>
                            <div className="text-xs text-slate-500">
                              {comision.esquemaComision.nombre}
                            </div>
                          </div>
                        </td>
                        <td className="p-2">
                          {comision.prospecto ? (
                            <div>
                              <div className="font-medium">{comision.prospecto.nombre}</div>
                              <div className="text-xs text-slate-500">
                                {comision.prospecto.vehiculoInteres}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400">Sin prospecto</span>
                          )}
                        </td>
                        <td className="p-2">
                          <Badge variant="secondary">
                            {comision.tipoComision}
                          </Badge>
                        </td>
                        <td className="p-2 font-medium">
                          {formatCurrency(comision.montoVenta)}
                        </td>
                        <td className="p-2">
                          {(comision.porcentaje * 100).toFixed(2)}%
                        </td>
                        <td className="p-2 font-bold text-green-600">
                          {formatCurrency(comision.montoComision)}
                        </td>
                        <td className="p-2">
                          <Badge
                            variant={comision.pagado ? 'default' : 'secondary'}
                            className={comision.pagado ? 'bg-green-500' : 'bg-yellow-500'}
                          >
                            {comision.pagado ? 'Pagado' : 'Pendiente'}
                          </Badge>
                        </td>
                        <td className="p-2 text-xs text-slate-500">
                          {new Date(comision.createdAt).toLocaleDateString()}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>

                {comisiones.length === 0 && (
                  <div className="text-center py-8 text-slate-500">
                    <Receipt className="w-12 h-12 mx-auto mb-4" />
                    <p>No se encontraron comisiones para el período seleccionado</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="esquemas" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {esquemas.map((esquema) => (
              <Card key={esquema.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {esquema.nombre}
                    <Badge variant={esquema.activo ? 'default' : 'secondary'}>
                      {esquema.activo ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    {esquema.vendedor.nombre} {esquema.vendedor.apellido}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>% Base:</span>
                      <span className="font-medium">{(esquema.porcentajeBase * 100).toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Bono Volumen:</span>
                      <span className="font-medium">{formatCurrency(esquema.bonoVolumen)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Comisiones generadas:</span>
                      <span className="font-medium">{esquema._count.comisionesGeneradas}</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>Desde:</span>
                      <span>{new Date(esquema.fechaInicio).toLocaleDateString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="top-vendedores" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Top 10 Vendedores - {meses.find(m => m.value === selectedMes)?.label} {selectedYear}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topVendedores.map((vendedor, index) => (
                  <div
                    key={vendedor.vendedorId}
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                        index === 0 ? 'bg-yellow-500 text-white' :
                        index === 1 ? 'bg-slate-400 text-white' :
                        index === 2 ? 'bg-amber-600 text-white' :
                        'bg-slate-200 text-slate-600'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium">{vendedor.nombre}</div>
                        <div className="text-sm text-slate-500">ID: {vendedor.vendedorId}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-green-600">
                        {formatCurrency(vendedor.montoTotal)}
                      </div>
                      <div className="text-sm text-slate-500">en comisiones</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal Crear Esquema */}
      <Dialog open={showCreateEsquemaModal} onOpenChange={setShowCreateEsquemaModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Crear Esquema de Comisiones</DialogTitle>
            <DialogDescription>
              Configura un nuevo esquema de comisiones para un vendedor
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="vendedorId">ID del Vendedor *</Label>
              <Input
                id="vendedorId"
                value={esquemaForm.vendedorId}
                onChange={(e) => setEsquemaForm(prev => ({ ...prev, vendedorId: e.target.value }))}
                placeholder="ID del vendedor"
              />
            </div>
            
            <div>
              <Label htmlFor="nombre">Nombre del Esquema *</Label>
              <Input
                id="nombre"
                value={esquemaForm.nombre}
                onChange={(e) => setEsquemaForm(prev => ({ ...prev, nombre: e.target.value }))}
                placeholder="Ej: Senior, Regular, Trainee"
              />
            </div>
            
            <div>
              <Label htmlFor="porcentajeBase">% Base *</Label>
              <Input
                id="porcentajeBase"
                type="number"
                step="0.0001"
                value={esquemaForm.porcentajeBase}
                onChange={(e) => setEsquemaForm(prev => ({ ...prev, porcentajeBase: e.target.value }))}
                placeholder="0.05 (5%)"
              />
            </div>
            
            <div>
              <Label htmlFor="bonoVolumen">Bono por Volumen</Label>
              <Input
                id="bonoVolumen"
                type="number"
                value={esquemaForm.bonoVolumen}
                onChange={(e) => setEsquemaForm(prev => ({ ...prev, bonoVolumen: e.target.value }))}
                placeholder="0"
              />
            </div>
            
            <div>
              <Label htmlFor="bonoMargen">Bono por Margen</Label>
              <Input
                id="bonoMargen"
                type="number"
                value={esquemaForm.bonoMargen}
                onChange={(e) => setEsquemaForm(prev => ({ ...prev, bonoMargen: e.target.value }))}
                placeholder="0"
              />
            </div>
            
            <div>
              <Label htmlFor="incentiveReferencia">Incentivo Referencia</Label>
              <Input
                id="incentiveReferencia"
                type="number"
                value={esquemaForm.incentiveReferencia}
                onChange={(e) => setEsquemaForm(prev => ({ ...prev, incentiveReferencia: e.target.value }))}
                placeholder="0"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setShowCreateEsquemaModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCrearEsquema}>
              Crear Esquema
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Calcular Comisiones */}
      <Dialog open={showCalcularModal} onOpenChange={setShowCalcularModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Calcular Comisiones</DialogTitle>
            <DialogDescription>
              Procesar ventas cerradas del período para generar comisiones
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">⚙️ Proceso automático:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Buscar ventas cerradas en {meses.find(m => m.value === selectedMes)?.label} {selectedYear}</li>
                <li>• Calcular comisiones según esquema de cada vendedor</li>
                <li>• Generar registros de comisiones pendientes</li>
                <li>• Evitar duplicados</li>
              </ul>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setShowCalcularModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCalcularComisiones}>
              Procesar Comisiones
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Pagar Comisiones */}
      <Dialog open={showPagarModal} onOpenChange={setShowPagarModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Marcar Comisiones como Pagadas</DialogTitle>
            <DialogDescription>
              Se marcarán {selectedComisiones.length} comisiones como pagadas
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-medium text-green-800 mb-2">✅ Acción:</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• {selectedComisiones.length} comisiones serán marcadas como pagadas</li>
                <li>• Se registrará la fecha de pago actual</li>
                <li>• Esta acción no se puede deshacer</li>
              </ul>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setShowPagarModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleMarcarPagado} className="bg-green-600 hover:bg-green-700">
              Confirmar Pago
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
