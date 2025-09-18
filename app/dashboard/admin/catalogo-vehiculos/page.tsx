
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Plus, 
  Upload, 
  Download, 
  Edit, 
  Trash2, 
  Car, 
  Users, 
  Globe,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle,
  Loader2,
  Eye,
  EyeOff
} from 'lucide-react';
import { motion } from 'framer-motion';
import { TipoRol } from '@prisma/client';

interface VehiculoCatalogo {
  id: number;
  marca: string;
  modelo: string;
  year: number;
  activo: boolean;
  fechaCreacion: string;
  fechaActualizacion: string;
  displayName: string;
  prospectosCount: number;
}

interface ImportResult {
  message: string;
  resumen: {
    totalProcesados?: number;
    vehiculosCreados: number;
    vehiculosExistentes: number;
  };
  vehiculosCreados: VehiculoCatalogo[];
  vehiculosExistentes: string[];
}

export default function CatalogoVehiculosPage() {
  const { data: session, status } = useSession();
  const [vehiculos, setVehiculos] = useState<VehiculoCatalogo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [marcaFilter, setMarcaFilter] = useState('all');
  const [activoFilter, setActivoFilter] = useState('all');
  
  // Estados para modales
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showScrapeModal, setShowScrapeModal] = useState(false);
  const [selectedVehiculo, setSelectedVehiculo] = useState<VehiculoCatalogo | null>(null);
  
  // Estados para formularios
  const [newVehiculo, setNewVehiculo] = useState({
    marca: '',
    modelo: '',
    year: new Date().getFullYear()
  });
  
  const [editVehiculo, setEditVehiculo] = useState({
    marca: '',
    modelo: '',
    year: 2024,
    activo: true
  });

  // Estados para importación y scraping
  const [importing, setImporting] = useState(false);
  const [scraping, setScraping] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [scrapeMarca, setScrapeMarca] = useState('');
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  // Verificar permisos
  const allowedRoles: TipoRol[] = [
    TipoRol.GERENTE_GENERAL, 
    TipoRol.GERENTE_VENTAS, 
    TipoRol.DYNAMICFIN_ADMIN
  ];
  const hasPermission = session?.user?.rol && allowedRoles.includes(session.user.rol as TipoRol);

  useEffect(() => {
    if (status === 'authenticated' && hasPermission) {
      fetchVehiculos();
    }
  }, [status, hasPermission]);

  const fetchVehiculos = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.set('search', searchTerm);
      if (marcaFilter !== 'all') params.set('marca', marcaFilter);
      if (activoFilter !== 'all') params.set('activo', activoFilter);

      const response = await fetch(`/api/vehiculos-catalogo?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setVehiculos(data.vehiculos || []);
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddVehiculo = async () => {
    try {
      const response = await fetch('/api/vehiculos-catalogo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newVehiculo)
      });

      const result = await response.json();
      
      if (response.ok) {
        alert('✅ ' + result.message);
        setShowAddModal(false);
        setNewVehiculo({ marca: '', modelo: '', year: new Date().getFullYear() });
        fetchVehiculos();
      } else {
        alert('❌ Error: ' + result.error);
      }
    } catch (error) {
      alert('❌ Error al agregar vehículo');
    }
  };

  const handleEditVehiculo = async () => {
    if (!selectedVehiculo) return;

    try {
      const response = await fetch(`/api/vehiculos-catalogo/${selectedVehiculo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editVehiculo)
      });

      const result = await response.json();
      
      if (response.ok) {
        alert('✅ ' + result.message);
        setShowEditModal(false);
        setSelectedVehiculo(null);
        fetchVehiculos();
      } else {
        alert('❌ Error: ' + result.error);
      }
    } catch (error) {
      alert('❌ Error al actualizar vehículo');
    }
  };

  const handleDeleteVehiculo = async (vehiculo: VehiculoCatalogo) => {
    const mensaje = vehiculo.prospectosCount > 0
      ? `¿Estás seguro de desactivar "${vehiculo.displayName}"?\n\nTiene ${vehiculo.prospectosCount} prospectos asociados, por lo que será desactivado en lugar de eliminado.`
      : `¿Estás seguro de eliminar "${vehiculo.displayName}"?\n\nEsta acción no se puede deshacer.`;

    if (!confirm(mensaje)) return;

    try {
      const response = await fetch(`/api/vehiculos-catalogo/${vehiculo.id}`, {
        method: 'DELETE'
      });

      const result = await response.json();
      
      if (response.ok) {
        alert('✅ ' + result.message);
        fetchVehiculos();
      } else {
        alert('❌ Error: ' + result.error);
      }
    } catch (error) {
      alert('❌ Error al eliminar vehículo');
    }
  };

  const handleImport = async () => {
    if (!importFile) return;

    try {
      setImporting(true);
      const formData = new FormData();
      formData.append('file', importFile);

      const response = await fetch('/api/vehiculos-catalogo/import', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      
      if (response.ok) {
        setImportResult(result);
        setImportFile(null);
        fetchVehiculos();
      } else {
        alert('❌ Error: ' + result.error);
        if (result.errores) {
          alert('Errores específicos:\n' + result.errores.join('\n'));
        }
      }
    } catch (error) {
      alert('❌ Error al importar archivo');
    } finally {
      setImporting(false);
    }
  };

  const handleScrape = async () => {
    if (!scrapeMarca) return;

    try {
      setScraping(true);
      const response = await fetch('/api/vehiculos-catalogo/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ marca: scrapeMarca })
      });

      const result = await response.json();
      
      if (response.ok) {
        alert(`✅ ${result.message}\n\n📊 Resumen:\n- Encontrados: ${result.resumen.totalEncontrados}\n- Nuevos: ${result.resumen.vehiculosCreados}\n- Existentes: ${result.resumen.vehiculosExistentes}`);
        setShowScrapeModal(false);
        setScrapeMarca('');
        fetchVehiculos();
      } else {
        alert('❌ Error: ' + result.error);
      }
    } catch (error) {
      alert('❌ Error al hacer scraping');
    } finally {
      setScraping(false);
    }
  };

  const handleExport = () => {
    const csvContent = [
      'Marca,Modelo,Año,Activo,Prospectos Asociados,Fecha Creación',
      ...filteredVehiculos.map(v => 
        `"${v.marca}","${v.modelo}",${v.year},"${v.activo ? 'Sí' : 'No'}",${v.prospectosCount},"${new Date(v.fechaCreacion).toLocaleDateString('es-ES')}"`
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `catalogo_vehiculos_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const openEditModal = (vehiculo: VehiculoCatalogo) => {
    setSelectedVehiculo(vehiculo);
    setEditVehiculo({
      marca: vehiculo.marca,
      modelo: vehiculo.modelo,
      year: vehiculo.year,
      activo: vehiculo.activo
    });
    setShowEditModal(true);
  };

  const filteredVehiculos = vehiculos.filter(vehiculo => {
    const matchesSearch = 
      vehiculo.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehiculo.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehiculo.displayName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesMarca = marcaFilter === 'all' || vehiculo.marca === marcaFilter;
    const matchesActivo = activoFilter === 'all' || 
      (activoFilter === 'true' && vehiculo.activo) ||
      (activoFilter === 'false' && !vehiculo.activo);
    
    return matchesSearch && matchesMarca && matchesActivo;
  });

  const uniqueMarcas = Array.from(new Set(vehiculos.map(v => v.marca))).sort();

  if (status === 'loading' || loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-slate-200 rounded w-48 animate-pulse"></div>
        <div className="grid gap-4">
          {[...Array(5)].map((_, i) => (
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

  if (!hasPermission) {
    return (
      <div className="flex items-center justify-center h-96">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Acceso Restringido</h3>
            <p className="text-slate-600">
              No tienes permisos suficientes para acceder al catálogo de vehículos.
              Solo gerentes y administradores pueden gestionar el catálogo.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Catálogo de Vehículos</h1>
          <p className="text-slate-600 mt-2">Gestión centralizada del catálogo de vehículos para prospectos</p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline"
            onClick={() => setShowScrapeModal(true)}
            className="border-blue-200 text-blue-700 hover:bg-blue-50"
          >
            <Globe className="w-4 h-4 mr-2" />
            Scraping Web
          </Button>
          <Button 
            variant="outline"
            onClick={() => setShowImportModal(true)}
            className="border-green-200 text-green-700 hover:bg-green-50"
          >
            <Upload className="w-4 h-4 mr-2" />
            Importar Excel
          </Button>
          <Button 
            variant="outline"
            onClick={handleExport}
            className="border-purple-200 text-purple-700 hover:bg-purple-50"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button 
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => setShowAddModal(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Vehículo
          </Button>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Vehículos</p>
                <p className="text-2xl font-bold text-slate-900">{vehiculos.length}</p>
              </div>
              <Car className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Activos</p>
                <p className="text-2xl font-bold text-green-600">{vehiculos.filter(v => v.activo).length}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Marcas</p>
                <p className="text-2xl font-bold text-purple-600">{uniqueMarcas.length}</p>
              </div>
              <Badge className="w-8 h-8 flex items-center justify-center text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Con Prospectos</p>
                <p className="text-2xl font-bold text-orange-600">{vehiculos.filter(v => v.prospectosCount > 0).length}</p>
              </div>
              <Users className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Buscar por marca o modelo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={marcaFilter} onValueChange={setMarcaFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por marca" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las marcas</SelectItem>
                {uniqueMarcas.map(marca => (
                  <SelectItem key={marca} value={marca}>{marca}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={activoFilter} onValueChange={setActivoFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="true">Activos</SelectItem>
                <SelectItem value="false">Inactivos</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={fetchVehiculos}>
              Filtrar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de vehículos */}
      <div className="grid gap-4">
        {filteredVehiculos.map((vehiculo, index) => (
          <motion.div
            key={vehiculo.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card className="hover:shadow-md transition-shadow duration-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-slate-900">
                        {vehiculo.displayName}
                      </h3>
                      <Badge variant={vehiculo.activo ? "default" : "secondary"} className="flex items-center gap-1">
                        {vehiculo.activo ? (
                          <>
                            <Eye className="w-3 h-3" />
                            Activo
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3 h-3" />
                            Inactivo
                          </>
                        )}
                      </Badge>
                      {vehiculo.prospectosCount > 0 && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {vehiculo.prospectosCount} prospectos
                        </Badge>
                      )}
                    </div>
                    
                    <div className="grid md:grid-cols-3 gap-4 text-sm text-slate-600">
                      <div>
                        <span className="font-medium">Marca:</span> {vehiculo.marca}
                      </div>
                      <div>
                        <span className="font-medium">Modelo:</span> {vehiculo.modelo}
                      </div>
                      <div>
                        <span className="font-medium">Año:</span> {vehiculo.year}
                      </div>
                    </div>
                    
                    <div className="mt-2 text-xs text-slate-500">
                      Creado: {new Date(vehiculo.fechaCreacion).toLocaleDateString('es-ES')} • 
                      Actualizado: {new Date(vehiculo.fechaActualizacion).toLocaleDateString('es-ES')}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => openEditModal(vehiculo)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDeleteVehiculo(vehiculo)}
                      className="text-red-600 hover:text-red-700 hover:border-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {filteredVehiculos.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-slate-400 mb-4">
            <Car className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-slate-600 mb-2">No se encontraron vehículos</h3>
          <p className="text-slate-500">Ajusta los filtros o agrega nuevos vehículos al catálogo.</p>
        </div>
      )}

      {/* Modal Agregar Vehículo */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-semibold mb-4">Agregar Nuevo Vehículo</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Marca *</label>
                <Input 
                  value={newVehiculo.marca}
                  onChange={(e) => setNewVehiculo({...newVehiculo, marca: e.target.value})}
                  placeholder="Ej: Audi, BMW, Toyota..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Modelo *</label>
                <Input 
                  value={newVehiculo.modelo}
                  onChange={(e) => setNewVehiculo({...newVehiculo, modelo: e.target.value})}
                  placeholder="Ej: A4 Sedan, X3, Corolla..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Año *</label>
                <Input 
                  type="number"
                  min="2000"
                  max={new Date().getFullYear() + 2}
                  value={newVehiculo.year}
                  onChange={(e) => setNewVehiculo({...newVehiculo, year: parseInt(e.target.value) || new Date().getFullYear()})}
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button 
                onClick={handleAddVehiculo}
                className="flex-1"
                disabled={!newVehiculo.marca || !newVehiculo.modelo || !newVehiculo.year}
              >
                Agregar Vehículo
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowAddModal(false);
                  setNewVehiculo({ marca: '', modelo: '', year: new Date().getFullYear() });
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Vehículo */}
      {showEditModal && selectedVehiculo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-semibold mb-4">Editar Vehículo</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Marca *</label>
                <Input 
                  value={editVehiculo.marca}
                  onChange={(e) => setEditVehiculo({...editVehiculo, marca: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Modelo *</label>
                <Input 
                  value={editVehiculo.modelo}
                  onChange={(e) => setEditVehiculo({...editVehiculo, modelo: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Año *</label>
                <Input 
                  type="number"
                  min="2000"
                  max={new Date().getFullYear() + 2}
                  value={editVehiculo.year}
                  onChange={(e) => setEditVehiculo({...editVehiculo, year: parseInt(e.target.value) || 2024})}
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="activo"
                  checked={editVehiculo.activo}
                  onChange={(e) => setEditVehiculo({...editVehiculo, activo: e.target.checked})}
                  className="rounded"
                />
                <label htmlFor="activo" className="text-sm font-medium">
                  Vehículo activo
                </label>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button 
                onClick={handleEditVehiculo}
                className="flex-1"
                disabled={!editVehiculo.marca || !editVehiculo.modelo || !editVehiculo.year}
              >
                Guardar Cambios
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedVehiculo(null);
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Importar */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">Importar desde Excel/CSV</h2>
            
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">Formato requerido:</h3>
                <p className="text-sm text-blue-700 mb-2">El archivo debe contener columnas con los siguientes nombres:</p>
                <ul className="text-xs text-blue-600 space-y-1">
                  <li>• <strong>marca</strong>: Nombre de la marca (Ej: Audi, BMW)</li>
                  <li>• <strong>modelo</strong>: Nombre del modelo (Ej: A4 Sedan, X3)</li>
                  <li>• <strong>año</strong> o <strong>year</strong>: Año del vehículo (2000-{new Date().getFullYear() + 2})</li>
                </ul>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Seleccionar archivo</label>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>

              {importResult && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h3 className="font-medium text-green-900 mb-2">Resultado de la importación:</h3>
                  <div className="text-sm text-green-700 space-y-1">
                    <p>✅ {importResult.message}</p>
                    {importResult.resumen.totalProcesados && (
                      <p>📊 Total procesados: {importResult.resumen.totalProcesados}</p>
                    )}
                    <p>🆕 Nuevos creados: {importResult.resumen.vehiculosCreados}</p>
                    <p>📋 Ya existían: {importResult.resumen.vehiculosExistentes}</p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button 
                onClick={handleImport}
                className="flex-1"
                disabled={!importFile || importing}
              >
                {importing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Importar
                  </>
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowImportModal(false);
                  setImportFile(null);
                  setImportResult(null);
                }}
              >
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Scraping */}
      {showScrapeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-semibold mb-4">Scraping Web de Vehículos</h2>
            
            <div className="space-y-4">
              <div className="p-4 bg-yellow-50 rounded-lg">
                <p className="text-sm text-yellow-700">
                  Esta función obtiene modelos actualizados directamente desde las páginas oficiales de las marcas.
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Seleccionar marca</label>
                <Select value={scrapeMarca} onValueChange={setScrapeMarca}>
                  <SelectTrigger>
                    <SelectValue placeholder="Elegir marca para scraping..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Audi">Audi</SelectItem>
                    <SelectItem value="BMW">BMW</SelectItem>
                    <SelectItem value="Mercedes-Benz">Mercedes-Benz</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button 
                onClick={handleScrape}
                className="flex-1"
                disabled={!scrapeMarca || scraping}
              >
                {scraping ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Obteniendo datos...
                  </>
                ) : (
                  <>
                    <Globe className="w-4 h-4 mr-2" />
                    Iniciar Scraping
                  </>
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowScrapeModal(false);
                  setScrapeMarca('');
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
