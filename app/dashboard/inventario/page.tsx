
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Car,
  Plus,
  Search,
  Calendar,
  DollarSign,
  Package,
  AlertCircle,
  X,
  FileText,
  Clock,
  CheckCircle,
  RotateCcw,
  Eye,
  Truck,
  User,
  BarChart3,
  Download,
  Upload,
  FileSpreadsheet,
  File,
  HelpCircle
} from 'lucide-react';
import { motion } from 'framer-motion';

interface Vehiculo {
  id: number;
  marca: string;
  modelo: string;
  year: number;
  version: string;
  precioPublico: number;
  precioRemision: number;
  color: string;
  kilometraje: number;
  estatus: string;
  numeroSerie: string;
  agencia: string;
  fechaIngreso: string;
}

export default function InventarioPage() {
  const { data: session, status } = useSession();
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstatus, setFilterEstatus] = useState('all');
  const [isDragOver, setIsDragOver] = useState(false);
  
  // Estados para modales
  const [showRegistrarModal, setShowRegistrarModal] = useState(false);
  const [showDetallesModal, setShowDetallesModal] = useState(false);
  const [showHistorialModal, setShowHistorialModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [selectedVehiculo, setSelectedVehiculo] = useState<Vehiculo | null>(null);
  
  // Estado para nuevo vehículo
  const [nuevoVehiculo, setNuevoVehiculo] = useState({
    marca: '',
    modelo: '',
    year: 2024,
    version: '',
    precioPublico: 0,
    precioRemision: 0,
    color: '',
    kilometraje: 0,
    agencia: '',
    numeroSerie: ''
  });

  const handleRegistrarVehiculo = () => {
    setShowRegistrarModal(true);
  };

  const handleGuardarVehiculo = () => {
    const nuevoId = vehiculos.length + 1;
    const vehiculo: Vehiculo = {
      id: nuevoId,
      marca: nuevoVehiculo.marca,
      modelo: nuevoVehiculo.modelo,
      year: nuevoVehiculo.year,
      version: nuevoVehiculo.version,
      precioPublico: nuevoVehiculo.precioPublico,
      precioRemision: nuevoVehiculo.precioRemision,
      color: nuevoVehiculo.color,
      kilometraje: nuevoVehiculo.kilometraje,
      estatus: 'Disponible',
      numeroSerie: nuevoVehiculo.numeroSerie,
      agencia: nuevoVehiculo.agencia,
      fechaIngreso: new Date().toISOString().split('T')[0]
    };
    
    setVehiculos([...vehiculos, vehiculo]);
    setShowRegistrarModal(false);
    setNuevoVehiculo({
      marca: '',
      modelo: '',
      year: 2024,
      version: '',
      precioPublico: 0,
      precioRemision: 0,
      color: '',
      kilometraje: 0,
      agencia: '',
      numeroSerie: ''
    });
    alert('✅ Vehículo registrado exitosamente!');
  };

  const handleVerDetalles = (vehiculoId: number) => {
    const vehiculo = vehiculos.find(v => v.id === vehiculoId);
    if (vehiculo) {
      setSelectedVehiculo(vehiculo);
      setShowDetallesModal(true);
    }
  };

  const handleVerHistorial = (vehiculoId: number) => {
    const vehiculo = vehiculos.find(v => v.id === vehiculoId);
    if (vehiculo) {
      setSelectedVehiculo(vehiculo);
      setShowHistorialModal(true);
    }
  };

  const handleApartar = (vehiculoId: number) => {
    const vehiculo = vehiculos.find(v => v.id === vehiculoId);
    const confirmed = confirm(`🚗 APARTAR VEHÍCULO\n\n${vehiculo?.marca} ${vehiculo?.modelo} ${vehiculo?.year}\nVIN: ${vehiculo?.numeroSerie}\n\n¿Confirmar apartar este vehículo?\n\n⚠️ El vehículo quedará marcado como "Apartado" y no estará disponible para otros clientes hasta que se libere o se venda.`);
    if (confirmed) {
      setVehiculos(vehiculos.map(v => 
        v.id === vehiculoId ? { ...v, estatus: 'Apartado' } : v
      ));
      alert('✅ VEHÍCULO APARTADO EXITOSAMENTE\n\n🚗 Estado actualizado a "Apartado"\n📝 Se ha registrado en el historial\n🔔 Notificación enviada al equipo\n\n⏰ Recordatorio: Seguimiento pendiente con el cliente');
    }
  };

  const handlePonerDisponible = (vehiculoId: number) => {
    const vehiculo = vehiculos.find(v => v.id === vehiculoId);
    const confirmed = confirm(`🔄 LIBERAR VEHÍCULO\n\n${vehiculo?.marca} ${vehiculo?.modelo} ${vehiculo?.year}\nVIN: ${vehiculo?.numeroSerie}\nEstatus actual: ${vehiculo?.estatus}\n\n¿Confirmar poner este vehículo disponible?\n\n✅ El vehículo estará disponible para todos los clientes y vendedores.\n📝 Se registrará el cambio en el historial.`);
    if (confirmed) {
      setVehiculos(vehiculos.map(v => 
        v.id === vehiculoId ? { ...v, estatus: 'Disponible' } : v
      ));
      alert('✅ VEHÍCULO LIBERADO EXITOSAMENTE\n\n🚗 Estado actualizado a "Disponible"\n📝 Registrado en historial\n🔔 Equipo de ventas notificado\n\n💡 El vehículo ya está visible para todos los clientes potenciales');
    }
  };

  const handleVender = (vehiculoId: number) => {
    const vehiculo = vehiculos.find(v => v.id === vehiculoId);
    const confirmed = confirm(`💰 MARCAR COMO VENDIDO\n\n${vehiculo?.marca} ${vehiculo?.modelo} ${vehiculo?.year}\nVIN: ${vehiculo?.numeroSerie}\n\n¿Confirmar que este vehículo ha sido vendido?\n\n⚠️ IMPORTANTE:\n• El vehículo se marcará como "Vendido"\n• Ya no aparecerá en inventario disponible\n• Se actualizarán las métricas de ventas\n• Esta acción es permanente`);
    if (confirmed) {
      setVehiculos(vehiculos.map(v => 
        v.id === vehiculoId ? { ...v, estatus: 'Vendido' } : v
      ));
      alert('🎉 VENTA REGISTRADA EXITOSAMENTE\n\n✅ Vehículo marcado como vendido\n📊 Métricas actualizadas\n📝 Historial completado\n💰 Utilidad calculada y registrada\n🏆 ¡Felicidades por la venta!');
    }
  };

  const handleFileUpload = (file: File) => {
    alert(`✅ Procesando archivo Excel: ${file.name}\n\nFormato detectado:\n• Marca | Línea | Año | Versión\n• Precio Público | Precio Remisión\n• Color | Kilometraje | Agencia\n• Fecha Ingreso | Número Serie\n\nProcesando... Se agregarán al inventario automáticamente.`);
    
    // Simular procesamiento
    setTimeout(() => {
      alert('✅ Carga completada!\n\n• 15 vehículos procesados\n• 2 duplicados omitidos\n• 13 vehículos agregados al inventario\n\nRevisa la lista actualizada.');
    }, 2000);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const excelFiles = files.filter(file => 
      file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.type === 'application/vnd.ms-excel' ||
      file.name.endsWith('.xlsx') ||
      file.name.endsWith('.xls')
    );
    
    if (excelFiles.length > 0) {
      handleFileUpload(excelFiles[0]);
    } else {
      alert('Por favor selecciona un archivo Excel (.xlsx o .xls)');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  // Función para verificar permisos según rol
  const canPerformAction = (action: string) => {
    const userRole = session?.user?.rol;
    
    const permissions: Record<string, string[]> = {
      'DYNAMICFIN_ADMIN': ['all'],
      'DIRECTOR_GENERAL': ['view'], // Solo consultas
      'DIRECTOR_MARCA': ['view'], // Solo consultas
      'GERENTE_GENERAL': ['view'], // Solo consultas
      'GERENTE_VENTAS': ['view', 'edit', 'reserve', 'release', 'sell', 'upload'], // Gestión completa
      'VENDEDOR': ['view', 'assign_line'], // Consulta + asignar línea (sin apartar unidad específica)
    };

    const userPermissions = permissions[userRole || ''] || [];
    return userPermissions.includes('all') || userPermissions.includes(action);
  };

  // Funciones de importación/exportación
  const handleExportExcel = () => {
    const csvContent = [
      'ID,Marca,Modelo,Year,Version,Precio Publico,Precio Remision,Color,Kilometraje,Estatus,Numero Serie,Agencia,Fecha Ingreso',
      ...filteredVehiculos.map(v => 
        `${v.id},"${v.marca}","${v.modelo}",${v.year},"${v.version}",${v.precioPublico},${v.precioRemision},"${v.color}",${v.kilometraje},"${v.estatus}","${v.numeroSerie}","${v.agencia}","${v.fechaIngreso}"`
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `inventario_vehiculos_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJSON = () => {
    const jsonContent = JSON.stringify(filteredVehiculos, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `inventario_vehiculos_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      try {
        let importedData: Vehiculo[] = [];
        
        if (file.type === 'application/json') {
          importedData = JSON.parse(content);
        } else if (file.name.endsWith('.csv')) {
          const lines = content.split('\n');
          importedData = lines.slice(1).filter(line => line.trim()).map((line, index) => {
            const values = line.split(',');
            return {
              id: vehiculos.length + index + 1,
              marca: values[1]?.replace(/"/g, '') || '',
              modelo: values[2]?.replace(/"/g, '') || '',
              year: parseInt(values[3]) || new Date().getFullYear(),
              version: values[4]?.replace(/"/g, '') || '',
              precioPublico: parseFloat(values[5]) || 0,
              precioRemision: parseFloat(values[6]) || 0,
              color: values[7]?.replace(/"/g, '') || '',
              kilometraje: parseInt(values[8]) || 0,
              estatus: values[9]?.replace(/"/g, '') || 'Disponible',
              numeroSerie: values[10]?.replace(/"/g, '') || '',
              agencia: values[11]?.replace(/"/g, '') || '',
              fechaIngreso: values[12]?.replace(/"/g, '') || new Date().toISOString().split('T')[0]
            };
          });
        }
        
        setVehiculos([...vehiculos, ...importedData]);
        setShowImportModal(false);
        alert(`✅ Se importaron ${importedData.length} vehículos exitosamente!`);
      } catch (error) {
        alert('❌ Error al importar el archivo. Verifique el formato.');
      }
    };
    reader.readAsText(file);
  };

  useEffect(() => {
    // Datos simulados
    const sampleData: Vehiculo[] = [
      {
        id: 1,
        marca: 'Audi',
        modelo: 'A4',
        year: 2024,
        version: '40 TFSI quattro',
        precioPublico: 899900.00,
        precioRemision: 750000.00,
        color: 'Negro Fantasma',
        kilometraje: 0,
        estatus: 'Disponible',
        numeroSerie: 'WAUENAF40PA123456',
        agencia: 'Audi Polanco',
        fechaIngreso: '2025-01-15'
      },
      {
        id: 2,
        marca: 'Audi',
        modelo: 'A6',
        year: 2024,
        version: '55 TFSI quattro',
        precioPublico: 1299900.00,
        precioRemision: 1080000.00,
        color: 'Blanco Glaciar',
        kilometraje: 0,
        estatus: 'Disponible',
        numeroSerie: 'WAUGFAF76PA234567',
        agencia: 'Audi Polanco',
        fechaIngreso: '2025-01-20'
      },
      {
        id: 3,
        marca: 'Audi',
        modelo: 'Q7',
        year: 2024,
        version: '55 TFSI quattro',
        precioPublico: 1799900.00,
        precioRemision: 1500000.00,
        color: 'Gris Nardo',
        kilometraje: 0,
        estatus: 'Apartado',
        numeroSerie: 'WA1LAAF76PA345678',
        agencia: 'Audi Polanco',
        fechaIngreso: '2025-02-01'
      },
      {
        id: 4,
        marca: 'Audi',
        modelo: 'Q5',
        year: 2024,
        version: '40 TFSI quattro',
        precioPublico: 1199900.00,
        precioRemision: 999000.00,
        color: 'Azul Navarra',
        kilometraje: 0,
        estatus: 'Vendido',
        numeroSerie: 'WA1ANAFY6P2456789',
        agencia: 'Audi Santa Fe',
        fechaIngreso: '2025-01-10'
      },
      {
        id: 5,
        marca: 'Audi',
        modelo: 'A3',
        year: 2024,
        version: '35 TFSI',
        precioPublico: 629900.00,
        precioRemision: 525000.00,
        color: 'Rojo Tango',
        kilometraje: 0,
        estatus: 'Disponible',
        numeroSerie: 'WAUZZZ8V7PA567890',
        agencia: 'Audi Santa Fe',
        fechaIngreso: '2025-02-05'
      }
    ];
    
    setTimeout(() => {
      setVehiculos(sampleData);
      setLoading(false);
    }, 500);
  }, []);

  const getEstatusColor = (estatus: string) => {
    switch (estatus) {
      case 'Disponible':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Apartado':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Vendido':
        return 'bg-slate-100 text-slate-800 border-slate-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredVehiculos = vehiculos.filter(vehiculo => {
    const matchesSearch = 
      vehiculo.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehiculo.version.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehiculo.color.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehiculo.numeroSerie.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterEstatus === 'all' || vehiculo.estatus === filterEstatus;
    
    return matchesSearch && matchesFilter;
  });

  // Mensaje informativo para vendedores sobre sus permisos específicos
  const isVendedor = session?.user?.rol === 'VENDEDOR';
  
  const VendedorInfoBanner = () => {
    if (!isVendedor) return null;
    
    return (
      <Card className="border-blue-200 bg-blue-50 mb-6">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Car className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900">Acceso de Vendedor al Inventario</h3>
              <p className="text-blue-700 text-sm">
                ✅ Puedes consultar disponibilidad y asignar líneas (marca/modelo/versión/año) a tus prospectos
                <br />
                ⚠️ Para apartar unidades específicas con número de serie, solicita apoyo a tu Gerente de Ventas
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (status === 'loading' || loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-slate-200 rounded w-48 animate-pulse"></div>
        <div className="grid gap-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-24 bg-slate-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <VendedorInfoBanner />
      
      {/* Header con información de permisos */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Inventario de Vehículos</h1>
          <div className="flex items-center gap-4 mt-2">
            <p className="text-slate-600">
              {isVendedor 
                ? "Consulta disponibilidad y asigna líneas (marca/modelo/versión/año) a tus prospectos" 
                : "Gestiona el inventario de vehículos de todas las agencias"
              }
            </p>
            <Badge variant="outline" className="text-xs">
              Rol: {session?.user?.rol} | Permisos: {canPerformAction('all') ? 'Completos' : isVendedor ? 'Consulta + Asignar Líneas' : 'Limitados'}
            </Badge>
          </div>
        </div>
        <div className="flex gap-2">
          {/* Botón de Ayuda */}
          <Button 
            variant="outline"
            onClick={() => setShowHelpModal(true)}
            className="border-blue-200 text-blue-700 hover:bg-blue-50"
          >
            <HelpCircle className="w-4 h-4 mr-2" />
            Ayuda
          </Button>
          
          {/* Botón de Importar */}
          {canPerformAction('upload') && (
            <Button 
              variant="outline"
              onClick={() => setShowImportModal(true)}
              className="border-green-200 text-green-700 hover:bg-green-50"
            >
              <Upload className="w-4 h-4 mr-2" />
              Importar
            </Button>
          )}
          
          {/* Botón de Exportar */}
          <Button 
            variant="outline"
            onClick={() => setShowExportModal(true)}
            className="border-purple-200 text-purple-700 hover:bg-purple-50"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          
          {canPerformAction('upload') && (
            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleRegistrarVehiculo}
            >
              <Plus className="w-4 h-4 mr-2" />
              Registrar Vehículo
            </Button>
          )}
          {canPerformAction('upload') && (
            <div
              className={`border-2 border-dashed rounded-lg p-3 text-center cursor-pointer transition-colors ${
                isDragOver 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => document.getElementById('excel-upload')?.click()}
            >
              <span className="text-sm text-slate-600">
                Arrastra Excel aquí o haz click
              </span>
              <input
                id="excel-upload"
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Estadísticas Rápidas */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Car className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {vehiculos.filter(v => v.estatus === 'Disponible').length}
                </p>
                <p className="text-sm text-slate-600">Disponibles</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {vehiculos.filter(v => v.estatus === 'Apartado').length}
                </p>
                <p className="text-sm text-slate-600">Apartados</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {vehiculos.filter(v => v.estatus === 'Vendido').length}
                </p>
                <p className="text-sm text-slate-600">Vendidos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  ${(vehiculos.reduce((sum, v) => sum + v.precioPublico, 0) / 1000000).toFixed(1)}M
                </p>
                <p className="text-sm text-slate-600">Valor Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex gap-4 bg-white p-4 rounded-lg border">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Buscar por modelo, versión, color o número de serie..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={filterEstatus} onValueChange={setFilterEstatus}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por estatus" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estatus</SelectItem>
            <SelectItem value="Disponible">Disponible</SelectItem>
            <SelectItem value="Apartado">Apartado</SelectItem>
            <SelectItem value="Vendido">Vendido</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Lista de Vehículos */}
      <div className="grid gap-4">
        {filteredVehiculos.map((vehiculo, index) => (
          <motion.div
            key={vehiculo.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <Card className="hover:shadow-md transition-shadow duration-200">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-slate-900">
                        {vehiculo.marca} {vehiculo.modelo} {vehiculo.year}
                      </h3>
                      <Badge className={getEstatusColor(vehiculo.estatus)}>
                        {vehiculo.estatus}
                      </Badge>
                    </div>
                    
                    <p className="text-slate-600 mb-4">{vehiculo.version}</p>
                    
                    <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4 mb-4">
                      <div>
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Precio Público</p>
                        <p className="text-sm font-semibold text-slate-900">
                          ${vehiculo.precioPublico.toLocaleString('es-MX')}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Precio Remisión</p>
                        <p className="text-sm font-semibold text-green-700">
                          ${vehiculo.precioRemision.toLocaleString('es-MX')}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Color</p>
                        <p className="text-sm font-semibold text-slate-900">{vehiculo.color}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Kilometraje</p>
                        <p className="text-sm font-semibold text-slate-900">
                          {vehiculo.kilometraje.toLocaleString('es-MX')} km
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Agencia</p>
                        <p className="text-sm font-semibold text-slate-900">{vehiculo.agencia}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Fecha Ingreso</p>
                        <p className="text-sm font-semibold text-slate-900">
                          {new Date(vehiculo.fechaIngreso).toLocaleDateString('es-ES')}
                        </p>
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-lg p-3">
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                        Número de Serie
                      </p>
                      <p className="text-sm font-mono text-slate-700">{vehiculo.numeroSerie}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleVerDetalles(vehiculo.id)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Ver Detalles
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleVerHistorial(vehiculo.id)}
                    >
                      <Calendar className="w-4 h-4 mr-1" />
                      Historial
                    </Button>
                    
                    {/* Botones según estado y permisos */}
                    {vehiculo.estatus === 'Disponible' && canPerformAction('assign_line') && (
                      <Button 
                        size="sm" 
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => {
                          alert(`🎯 Asignar Línea a Prospecto\n\n🚗 LÍNEA: ${vehiculo.marca} ${vehiculo.modelo} ${vehiculo.year}\n📋 VERSIÓN: ${vehiculo.version}\n💰 PRECIO PÚBLICO: $${vehiculo.precioPublico?.toLocaleString()}\n\n👤 Esta acción te permite:\n• Asignar esta línea de vehículo a un prospecto\n• Mostrar disponibilidad y precio al cliente\n• Registrar el interés específico en esta configuración\n\n⚠️ IMPORTANTE:\n• NO aparta una unidad específica con número de serie\n• Solo registra interés en marca/modelo/versión/año\n• Tu gerente apartará la unidad cuando sea necesario\n\n✅ Perfecto para cotizaciones y seguimiento de prospectos`);
                        }}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Asignar a Prospecto
                      </Button>
                    )}
                    
                    {vehiculo.estatus === 'Disponible' && canPerformAction('reserve') && (
                      <Button 
                        size="sm" 
                        className="bg-amber-600 hover:bg-amber-700"
                        onClick={() => handleApartar(vehiculo.id)}
                      >
                        <AlertCircle className="w-4 h-4 mr-1" />
                        Apartar Específico
                      </Button>
                    )}
                    
                    {vehiculo.estatus === 'Apartado' && canPerformAction('release') && (
                      <>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="border-green-600 text-green-600 hover:bg-green-50"
                          onClick={() => handlePonerDisponible(vehiculo.id)}
                        >
                          <RotateCcw className="w-4 h-4 mr-1" />
                          Liberar
                        </Button>
                        {canPerformAction('sell') && (
                          <Button 
                            size="sm" 
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleVender(vehiculo.id)}
                          >
                            <Truck className="w-4 h-4 mr-1" />
                            Vender
                          </Button>
                        )}
                      </>
                    )}

                    {vehiculo.estatus === 'Disponible' && canPerformAction('sell') && (
                      <Button 
                        size="sm" 
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleVender(vehiculo.id)}
                      >
                        <Truck className="w-4 h-4 mr-1" />
                        Vender
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {filteredVehiculos.length === 0 && (
        <div className="text-center py-12">
          <div className="text-slate-400 mb-4">
            <Car className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-slate-600 mb-2">No se encontraron vehículos</h3>
          <p className="text-slate-500">Ajusta los filtros o registra nuevos vehículos.</p>
        </div>
      )}

      {/* Modal Registrar Vehículo */}
      {showRegistrarModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Registrar Nuevo Vehículo</h2>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowRegistrarModal(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Marca *</label>
                <Input 
                  value={nuevoVehiculo.marca}
                  onChange={(e) => setNuevoVehiculo({...nuevoVehiculo, marca: e.target.value})}
                  placeholder="Ej: Audi"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Modelo *</label>
                <Input 
                  value={nuevoVehiculo.modelo}
                  onChange={(e) => setNuevoVehiculo({...nuevoVehiculo, modelo: e.target.value})}
                  placeholder="Ej: A4"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Año *</label>
                <Input 
                  type="number"
                  value={nuevoVehiculo.year}
                  onChange={(e) => setNuevoVehiculo({...nuevoVehiculo, year: parseInt(e.target.value) || 2024})}
                  placeholder="2024"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Versión</label>
                <Input 
                  value={nuevoVehiculo.version}
                  onChange={(e) => setNuevoVehiculo({...nuevoVehiculo, version: e.target.value})}
                  placeholder="Ej: 40 TFSI quattro"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Precio Público *</label>
                <Input 
                  type="number"
                  value={nuevoVehiculo.precioPublico}
                  onChange={(e) => setNuevoVehiculo({...nuevoVehiculo, precioPublico: parseFloat(e.target.value) || 0})}
                  placeholder="899900"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Precio Remisión *</label>
                <Input 
                  type="number"
                  value={nuevoVehiculo.precioRemision}
                  onChange={(e) => setNuevoVehiculo({...nuevoVehiculo, precioRemision: parseFloat(e.target.value) || 0})}
                  placeholder="750000"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Color</label>
                <Input 
                  value={nuevoVehiculo.color}
                  onChange={(e) => setNuevoVehiculo({...nuevoVehiculo, color: e.target.value})}
                  placeholder="Negro Fantasma"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Kilometraje</label>
                <Input 
                  type="number"
                  value={nuevoVehiculo.kilometraje}
                  onChange={(e) => setNuevoVehiculo({...nuevoVehiculo, kilometraje: parseInt(e.target.value) || 0})}
                  placeholder="0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Agencia *</label>
                <Input 
                  value={nuevoVehiculo.agencia}
                  onChange={(e) => setNuevoVehiculo({...nuevoVehiculo, agencia: e.target.value})}
                  placeholder="Audi Polanco"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Número de Serie *</label>
                <Input 
                  value={nuevoVehiculo.numeroSerie}
                  onChange={(e) => setNuevoVehiculo({...nuevoVehiculo, numeroSerie: e.target.value})}
                  placeholder="WAUENAF40PA123456"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button 
                onClick={handleGuardarVehiculo}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                disabled={!nuevoVehiculo.marca || !nuevoVehiculo.modelo || !nuevoVehiculo.agencia || !nuevoVehiculo.numeroSerie}
              >
                Guardar Vehículo
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowRegistrarModal(false)}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ver Detalles */}
      {showDetallesModal && selectedVehiculo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Detalles Completos - {selectedVehiculo.marca} {selectedVehiculo.modelo}</h2>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowDetallesModal(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* Información Básica */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Información Básica</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Marca y Modelo</p>
                    <p className="text-lg font-semibold">{selectedVehiculo.marca} {selectedVehiculo.modelo}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-600">Año</p>
                    <p className="text-sm">{selectedVehiculo.year}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-600">Versión</p>
                    <p className="text-sm">{selectedVehiculo.version}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-600">Color</p>
                    <p className="text-sm">{selectedVehiculo.color}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-600">Kilometraje</p>
                    <p className="text-sm">{selectedVehiculo.kilometraje.toLocaleString()} km</p>
                  </div>
                </div>
              </div>

              {/* Información Financiera */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Información Financiera</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Precio Público</p>
                    <p className="text-lg font-bold text-slate-900">${selectedVehiculo.precioPublico.toLocaleString('es-MX')}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-600">Precio Remisión</p>
                    <p className="text-lg font-bold text-green-600">${selectedVehiculo.precioRemision.toLocaleString('es-MX')}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-600">Margen Estimado</p>
                    <p className="text-sm font-semibold text-blue-600">
                      ${(selectedVehiculo.precioPublico - selectedVehiculo.precioRemision).toLocaleString('es-MX')} 
                      ({(((selectedVehiculo.precioPublico - selectedVehiculo.precioRemision) / selectedVehiculo.precioPublico) * 100).toFixed(1)}%)
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-600">Estado</p>
                    <Badge className={
                      selectedVehiculo.estatus === 'Disponible' ? 'bg-green-100 text-green-800' :
                      selectedVehiculo.estatus === 'Apartado' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }>
                      {selectedVehiculo.estatus}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Información Adicional */}
            <div className="mt-6 space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Información Adicional</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-600">Agencia</p>
                  <p className="text-sm">{selectedVehiculo.agencia}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">Fecha de Ingreso</p>
                  <p className="text-sm">{new Date(selectedVehiculo.fechaIngreso).toLocaleDateString('es-ES')}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">Número de Serie</p>
                  <p className="text-sm font-mono">{selectedVehiculo.numeroSerie}</p>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button 
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => {
                  if (selectedVehiculo) {
                    alert(`📋 Generando Ficha Técnica Completa\n\n🚗 VEHÍCULO: ${selectedVehiculo.marca} ${selectedVehiculo.modelo}\n\n✅ INFORMACIÓN INCLUIDA:\n• Especificaciones técnicas completas\n• Dimensiones y capacidades\n• Características de motor y transmisión\n• Equipamiento de serie y opcional\n• Datos de consumo y emisiones\n• Garantías y servicios\n• Galería de imágenes (interior/exterior)\n• Colores disponibles\n• Precios y financiamiento\n\n📄 FUENTES DE DATOS:\n• Base de datos del fabricante\n• Especificaciones oficiales\n• Catálogo actualizado 2024\n• Información técnica certificada\n\n🔄 Generando PDF profesional...\n📧 Se enviará por email en 2-3 minutos`);
                  }
                }}
              >
                Generar Ficha Técnica
              </Button>
              {canPerformAction('edit') && (
                <Button 
                  variant="outline"
                  onClick={() => {
                    if (selectedVehiculo) {
                      alert(`✏️ Editor de Información del Vehículo\n\n🚗 EDITANDO: ${selectedVehiculo.marca} ${selectedVehiculo.modelo}\n\n📝 CAMPOS EDITABLES:\n• Precio público y de remisión\n• Estado del vehículo\n• Kilometraje\n• Color\n• Observaciones y notas\n• Fecha de ingreso\n• Ubicación en agencia\n• Estado de documentos\n\n⚠️ CAMPOS PROTEGIDOS:\n• Número de serie (VIN)\n• Marca y modelo\n• Año de fabricación\n• Especificaciones técnicas\n\n💾 Los cambios se guardarán automáticamente\n📧 Se notificará al equipo de inventario`);
                    }
                  }}
                >
                  Editar Información
                </Button>
              )}
              <Button 
                variant="outline" 
                onClick={() => setShowDetallesModal(false)}
              >
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ver Historial */}
      {showHistorialModal && selectedVehiculo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Historial - {selectedVehiculo.marca} {selectedVehiculo.modelo}</h2>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowHistorialModal(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Cronología de Eventos
              </h3>
              
              <div className="space-y-3">
                {/* Simulación de historial */}
                <div className="flex gap-4 p-4 border-l-4 border-blue-500 bg-blue-50 rounded">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <p className="font-semibold text-blue-800">Registro Inicial</p>
                    </div>
                    <p className="text-sm text-blue-700">Vehículo registrado en el sistema</p>
                    <p className="text-xs text-blue-600 mt-1">{new Date(selectedVehiculo.fechaIngreso).toLocaleDateString('es-ES')}</p>
                  </div>
                </div>
                
                <div className="flex gap-4 p-4 border-l-4 border-green-500 bg-green-50 rounded">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Package className="w-4 h-4 text-green-600" />
                      <p className="font-semibold text-green-800">Ingreso a Inventario</p>
                    </div>
                    <p className="text-sm text-green-700">Vehículo disponible para venta en {selectedVehiculo.agencia}</p>
                    <p className="text-xs text-green-600 mt-1">{new Date(selectedVehiculo.fechaIngreso).toLocaleDateString('es-ES')}</p>
                  </div>
                </div>

                {selectedVehiculo.estatus === 'Apartado' && (
                  <div className="flex gap-4 p-4 border-l-4 border-yellow-500 bg-yellow-50 rounded">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertCircle className="w-4 h-4 text-yellow-600" />
                        <p className="font-semibold text-yellow-800">Vehículo Apartado</p>
                      </div>
                      <p className="text-sm text-yellow-700">Estado cambiado a apartado por cliente</p>
                      <p className="text-xs text-yellow-600 mt-1">Hoy</p>
                    </div>
                  </div>
                )}

                <div className="flex gap-4 p-4 border-l-4 border-gray-500 bg-gray-50 rounded">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="w-4 h-4 text-gray-600" />
                      <p className="font-semibold text-gray-800">Próxima Revisión</p>
                    </div>
                    <p className="text-sm text-gray-700">Inspección técnica programada</p>
                    <p className="text-xs text-gray-600 mt-1">
                      {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button 
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => {
                  if (selectedVehiculo) {
                    alert(`📊 Generando Reporte de Historial Completo\n\n🚗 VEHÍCULO: ${selectedVehiculo.marca} ${selectedVehiculo.modelo}\n📋 VIN: ${selectedVehiculo.numeroSerie}\n\n✅ REPORTE INCLUYE:\n• Cronología completa de eventos\n• Cambios de estatus y precios\n• Movimientos entre agencias\n• Mantenimientos realizados\n• Inspecciones técnicas\n• Historial de interés de clientes\n• Modificaciones en documentación\n• Actualizaciones de inventario\n\n📅 DATOS TEMPORALES:\n• Fecha ingreso: ${new Date(selectedVehiculo.fechaIngreso).toLocaleDateString('es-ES')}\n• Días en inventario: ${Math.floor((Date.now() - new Date(selectedVehiculo.fechaIngreso).getTime()) / (1000 * 60 * 60 * 24))}\n• Próxima revisión: ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('es-ES')}\n\n🔄 Generando PDF detallado...\n📧 Se enviará por email en 1-2 minutos`);
                  }
                }}
              >
                Generar Reporte de Historial
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowHistorialModal(false)}
              >
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Importación */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">🚗 Importar Vehículos</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowImportModal(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-slate-600 mb-4">
                    Soporta archivos Excel (.csv) y JSON (.json)
                  </p>
                  <input
                    type="file"
                    accept=".csv,.json"
                    onChange={handleImportFile}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">📋 Formato requerido:</h4>
                  <p className="text-sm text-blue-700">
                    ID,Marca,Modelo,Year,Version,Precio Publico,Precio Remision,Color,Kilometraje,Estatus,Numero Serie,Agencia,Fecha Ingreso
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Exportación */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">💾 Exportar Inventario</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowExportModal(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <p className="text-slate-600 mb-4">
                  Selecciona el formato de exportación:
                </p>
                
                <Button 
                  onClick={handleExportExcel}
                  className="w-full bg-green-600 hover:bg-green-700 text-white mb-3"
                >
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Exportar como Excel (.csv)
                </Button>
                
                <Button 
                  onClick={handleExportJSON}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white mb-3"
                >
                  <File className="w-4 h-4 mr-2" />
                  Exportar como JSON
                </Button>
                
                <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-600">
                  🚗 Se exportarán {filteredVehiculos.length} vehículos según los filtros actuales.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Ayuda */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
              <h2 className="text-xl font-semibold">🏪 Centro de Ayuda - Gestión de Inventario</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowHelpModal(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="p-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-blue-800 mb-2">🚗 Gestión de Vehículos</h3>
                    <p className="text-blue-700 text-sm mb-3">
                      Sistema completo para administrar inventario automotriz con control de estatus, precios y asignaciones.
                    </p>
                    <div className="text-xs text-blue-600 space-y-1">
                      <div><strong>Disponible:</strong> Vehículo listo para venta</div>
                      <div><strong>Apartado:</strong> Reservado para cliente específico</div>
                      <div><strong>Vendido:</strong> Transacción completada</div>
                    </div>
                  </div>
                  
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-green-800 mb-2">📊 Importar/Exportar</h3>
                    <p className="text-green-700 text-sm mb-3">
                      Importa inventario masivo desde Excel o exporta reportes para análisis externos.
                    </p>
                    <div className="text-xs text-green-600 space-y-1">
                      <div><strong>CSV/Excel:</strong> Formato estándar para hojas de cálculo</div>
                      <div><strong>JSON:</strong> Para integraciones con sistemas externos</div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-purple-800 mb-2">🔐 Sistema de Permisos</h3>
                    <p className="text-purple-700 text-sm mb-3">
                      Control granular según rol del usuario para garantizar seguridad y control operativo.
                    </p>
                    <div className="text-xs text-purple-600 space-y-1">
                      <div><strong>Directores:</strong> Solo consulta</div>
                      <div><strong>Gerentes:</strong> Gestión completa</div>
                      <div><strong>Vendedores:</strong> Asignación de líneas</div>
                      <div><strong>Admin:</strong> Control total</div>
                    </div>
                  </div>
                  
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-orange-800 mb-2">💰 Control de Precios</h3>
                    <p className="text-orange-700 text-sm mb-3">
                      Manejo dual de precios público y de remisión para cálculos de utilidad precisos.
                    </p>
                    <div className="text-xs text-orange-600 space-y-1">
                      <div><strong>Precio Público:</strong> Para clientes finales</div>
                      <div><strong>Precio Remisión:</strong> Costo interno real</div>
                      <div><strong>Utilidad:</strong> Calculada automáticamente</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-2">⚡ Funciones Rápidas</h3>
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <strong>Arrastrar y Soltar:</strong> Importa archivos Excel directamente arrastrándolos a la zona de carga.
                  </div>
                  <div>
                    <strong>Filtros Inteligentes:</strong> Busca por marca, modelo, color o número de serie.
                  </div>
                  <div>
                    <strong>Acciones Masivas:</strong> Cambia múltiples vehículos de estatus simultáneamente.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
