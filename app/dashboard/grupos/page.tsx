
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Building2, 
  Plus,
  MapPin,
  Mail,
  Globe,
  Users,
  Car,
  Settings,
  Edit,
  X,
  Phone,
  Shield,
  Target,
  BarChart3,
  UserPlus,
  Building,
  Eye
} from 'lucide-react';
import { motion } from 'framer-motion';

interface Agencia {
  id: number;
  nombreAgencia: string;
  direccion: string;
  telefono: string;
  gerente: string;
  vendedoresActivos: number;
}

interface Marca {
  id: number;
  nombreMarca: string;
  agencias: Agencia[];
  ventasDelMes: number;
  metaDelMes: number;
}

interface Grupo {
  id: number;
  nombreGrupo: string;
  direccion: string;
  email: string;
  telefono: string;
  paginaWeb: string;
  fechaFundacion: string;
  director: string;
  marcas: Marca[];
  totalVendedores: number;
  totalAgencias: number;
  ventasDelMes: number;
  estatus: 'Activo' | 'Inactivo';
}

export default function GruposPage() {
  const { data: session, status } = useSession();
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNuevoGrupoModal, setShowNuevoGrupoModal] = useState(false);
  const [showEditarModal, setShowEditarModal] = useState(false);
  const [showUsuariosModal, setShowUsuariosModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [selectedGrupo, setSelectedGrupo] = useState<Grupo | null>(null);
  
  // Estados para nuevo grupo
  const [nuevoGrupo, setNuevoGrupo] = useState({
    nombreGrupo: '',
    direccion: '',
    email: '',
    telefono: '',
    paginaWeb: '',
    director: ''
  });

  const handleNuevoGrupo = () => {
    setShowNuevoGrupoModal(true);
  };

  const handleCrearGrupo = () => {
    if (!nuevoGrupo.nombreGrupo || !nuevoGrupo.director || !nuevoGrupo.email) {
      alert('⚠️ Por favor completa todos los campos obligatorios:\n• Nombre del Grupo\n• Director\n• Email de contacto');
      return;
    }
    
    alert(`✅ GRUPO CREADO EXITOSAMENTE\n\n🏢 GRUPO: ${nuevoGrupo.nombreGrupo}\n👤 DIRECTOR: ${nuevoGrupo.director}\n📧 EMAIL: ${nuevoGrupo.email}\n📞 TELÉFONO: ${nuevoGrupo.telefono || 'No especificado'}\n\n✅ PRÓXIMOS PASOS:\n• Configurar marcas automotrices\n• Añadir agencias y sucursales\n• Asignar usuarios y permisos\n• Establecer metas comerciales\n• Configurar parámetros SPPC\n\n📧 Se enviará confirmación por email`);
    
    // Reset form
    setNuevoGrupo({
      nombreGrupo: '', direccion: '', email: '', telefono: '', paginaWeb: '', director: ''
    });
    setShowNuevoGrupoModal(false);
  };

  const handleVerUsuarios = (grupo: Grupo) => {
    setSelectedGrupo(grupo);
    setShowUsuariosModal(true);
  };

  const handleEditarGrupo = (grupo: Grupo) => {
    setSelectedGrupo(grupo);
    setShowEditarModal(true);
  };

  const handleConfiguracion = (grupo: Grupo) => {
    setSelectedGrupo(grupo);
    setShowConfigModal(true);
  };

  const handleAñadirMarca = (grupoId: number) => {
    const marcas = ['Mercedes-Benz', 'Volkswagen', 'Nissan', 'Ford', 'Chevrolet', 'Hyundai', 'Kia', 'Mazda', 'Peugeot', 'Volvo'];
    const marcaSeleccionada = prompt(`Selecciona una marca para añadir al grupo:\n\n${marcas.map((m, i) => `${i+1}. ${m}`).join('\n')}\n\nEscribe el número:`);
    
    if (marcaSeleccionada && parseInt(marcaSeleccionada) > 0 && parseInt(marcaSeleccionada) <= marcas.length) {
      const marca = marcas[parseInt(marcaSeleccionada) - 1];
      alert(`✅ MARCA AÑADIDA: ${marca}\n\n📋 CONFIGURACIÓN INICIAL:\n• Se ha añadido ${marca} al grupo\n• Status: Activa\n• Inventario: 0 vehículos\n• Vendedores: 0 asignados\n\n🔧 PRÓXIMOS PASOS:\n• Configurar agencias para ${marca}\n• Asignar personal de ventas\n• Cargar inventario inicial\n• Establecer metas comerciales`);
    }
  };

  const handleAñadirAgencia = (grupoId: number, marcaId: number) => {
    const nombreAgencia = prompt('Nombre de la nueva agencia:');
    const direccion = prompt('Dirección de la agencia:');
    const gerente = prompt('Nombre del gerente:');
    
    if (nombreAgencia && direccion && gerente) {
      alert(`✅ AGENCIA CREADA: ${nombreAgencia}\n\n📍 DIRECCIÓN: ${direccion}\n👤 GERENTE: ${gerente}\n\n📋 CONFIGURACIÓN INICIAL:\n• Status: Activa\n• Inventario: 0 vehículos\n• Vendedores: 0 asignados\n• Meta mensual: $0\n\n🔧 PRÓXIMOS PASOS:\n• Asignar equipo de ventas\n• Cargar inventario\n• Configurar metas comerciales\n• Establecer parámetros SPPC`);
    }
  };

  useEffect(() => {
    const sampleData: Grupo[] = [
      {
        id: 1,
        nombreGrupo: 'Grupo Automotriz Alemán Premium',
        direccion: 'Av. Revolución 1425, Col. Campestre, Ciudad de México',
        email: 'contacto@grupoalemanpremium.com',
        telefono: '+52 55 1234-5678',
        paginaWeb: 'https://grupoalemanpremium.com',
        fechaFundacion: '2010-03-15',
        director: 'Carlos Mendoza',
        totalVendedores: 24,
        totalAgencias: 3,
        ventasDelMes: 87,
        estatus: 'Activo',
        marcas: [
          {
            id: 1,
            nombreMarca: 'Audi',
            ventasDelMes: 45,
            metaDelMes: 50,
            agencias: [
              { id: 1, nombreAgencia: 'Audi Polanco', direccion: 'Polanco, CDMX', telefono: '+52 55 1111-1111', gerente: 'Ana García', vendedoresActivos: 8 },
              { id: 2, nombreAgencia: 'Audi Santa Fe', direccion: 'Santa Fe, CDMX', telefono: '+52 55 2222-2222', gerente: 'Luis Martín', vendedoresActivos: 6 }
            ]
          },
          {
            id: 2,
            nombreMarca: 'BMW',
            ventasDelMes: 42,
            metaDelMes: 45,
            agencias: [
              { id: 3, nombreAgencia: 'BMW Interlomas', direccion: 'Interlomas, EdoMex', telefono: '+52 55 3333-3333', gerente: 'María López', vendedoresActivos: 10 }
            ]
          }
        ]
      },
      {
        id: 2,
        nombreGrupo: 'Grupo Automotriz Japonés MX',
        direccion: 'Blvd. Manuel Ávila Camacho 191, Col. Lomas de Chapultepec',
        email: 'info@grupojaponesmx.com',
        telefono: '+52 55 9876-5432',
        paginaWeb: 'https://grupojaponesmx.com',
        fechaFundacion: '2008-07-22',
        director: 'Roberto Tanaka',
        totalVendedores: 18,
        totalAgencias: 2,
        ventasDelMes: 63,
        estatus: 'Activo',
        marcas: [
          {
            id: 3,
            nombreMarca: 'Toyota',
            ventasDelMes: 38,
            metaDelMes: 40,
            agencias: [
              { id: 4, nombreAgencia: 'Toyota Sureste', direccion: 'Sureste CDMX', telefono: '+52 55 4444-4444', gerente: 'Pedro Sánchez', vendedoresActivos: 10 }
            ]
          },
          {
            id: 4,
            nombreMarca: 'Honda',
            ventasDelMes: 25,
            metaDelMes: 30,
            agencias: [
              { id: 5, nombreAgencia: 'Honda Centro', direccion: 'Centro CDMX', telefono: '+52 55 5555-5555', gerente: 'Sofia Herrera', vendedoresActivos: 8 }
            ]
          }
        ]
      }
    ];
    
    setTimeout(() => {
      setGrupos(sampleData);
      setLoading(false);
    }, 500);
  }, []);

  if (status === 'loading' || loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-slate-200 rounded w-48 animate-pulse"></div>
        <div className="grid gap-6">
          {[...Array(2)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-32 bg-slate-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Gestión de Grupos</h1>
          <p className="text-slate-600 mt-2">Administra grupos automotrices, marcas y agencias</p>
        </div>
        <Button 
          className="bg-blue-600 hover:bg-blue-700"
          onClick={handleNuevoGrupo}
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Grupo
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{grupos.length}</p>
                <p className="text-sm text-slate-600">Grupos Activos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Car className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{grupos.reduce((total, grupo) => total + grupo.marcas.length, 0)}</p>
                <p className="text-sm text-slate-600">Marcas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Building className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{grupos.reduce((total, grupo) => total + grupo.totalAgencias, 0)}</p>
                <p className="text-sm text-slate-600">Agencias</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{grupos.reduce((total, grupo) => total + grupo.totalVendedores, 0)}</p>
                <p className="text-sm text-slate-600">Vendedores</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Grupos */}
      <div className="grid gap-6">
        {grupos.map((grupo, index) => (
          <motion.div
            key={grupo.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <Card className="hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{grupo.nombreGrupo}</CardTitle>
                      <CardDescription className="mt-1">
                        👤 Director: {grupo.director} • 📅 Fundado: {new Date(grupo.fechaFundacion).getFullYear()}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge className="bg-green-50 text-green-700 border-green-200">
                    {grupo.estatus}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* KPIs del Grupo */}
                <div className="grid md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-lg">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{grupo.ventasDelMes}</p>
                    <p className="text-sm text-slate-600">Ventas del Mes</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{grupo.totalVendedores}</p>
                    <p className="text-sm text-slate-600">Vendedores</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">{grupo.marcas.length}</p>
                    <p className="text-sm text-slate-600">Marcas</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-amber-600">{grupo.totalAgencias}</p>
                    <p className="text-sm text-slate-600">Agencias</p>
                  </div>
                </div>

                {/* Información de Contacto */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span>{grupo.direccion}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Mail className="w-4 h-4 flex-shrink-0" />
                    <span>{grupo.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Phone className="w-4 h-4 flex-shrink-0" />
                    <span>{grupo.telefono}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Globe className="w-4 h-4 flex-shrink-0" />
                    <a href={grupo.paginaWeb} target="_blank" rel="noopener noreferrer" 
                       className="text-blue-600 hover:underline">
                      Sitio Web
                    </a>
                  </div>
                </div>

                {/* Marcas y Agencias */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                      <Car className="w-4 h-4" />
                      Marcas y Agencias
                    </h4>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleAñadirMarca(grupo.id)}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Añadir Marca
                    </Button>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    {grupo.marcas.map((marca) => (
                      <div key={marca.id} className="bg-slate-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-slate-200 rounded flex items-center justify-center">
                              <Car className="w-4 h-4 text-slate-600" />
                            </div>
                            <span className="font-medium text-slate-900">{marca.nombreMarca}</span>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-green-600">{marca.ventasDelMes}/{marca.metaDelMes} ventas</p>
                            <p className="text-xs text-slate-500">{((marca.ventasDelMes/marca.metaDelMes)*100).toFixed(1)}% meta</p>
                          </div>
                        </div>
                        <div className="space-y-2 mb-3">
                          {marca.agencias.map((agencia) => (
                            <div key={agencia.id} className="flex items-center justify-between text-sm">
                              <span className="text-slate-600">• {agencia.nombreAgencia}</span>
                              <div className="text-xs text-slate-500">
                                👤 {agencia.gerente} • {agencia.vendedoresActivos} vendedores
                              </div>
                            </div>
                          ))}
                        </div>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="w-full text-xs"
                          onClick={() => handleAñadirAgencia(grupo.id, marca.id)}
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Añadir Agencia
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex gap-2 pt-4 border-t">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleVerUsuarios(grupo)}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Ver Usuarios
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleEditarGrupo(grupo)}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Editar
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleConfiguracion(grupo)}
                  >
                    <Settings className="w-4 h-4 mr-1" />
                    Configuración
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Modal Nuevo Grupo */}
      {showNuevoGrupoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Crear Nuevo Grupo</h2>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowNuevoGrupoModal(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="nombreGrupo">Nombre del Grupo *</Label>
                <Input
                  id="nombreGrupo"
                  value={nuevoGrupo.nombreGrupo}
                  onChange={(e) => setNuevoGrupo({...nuevoGrupo, nombreGrupo: e.target.value})}
                  placeholder="Ej: Grupo Automotriz Premium"
                />
              </div>
              <div>
                <Label htmlFor="director">Director General *</Label>
                <Input
                  id="director"
                  value={nuevoGrupo.director}
                  onChange={(e) => setNuevoGrupo({...nuevoGrupo, director: e.target.value})}
                  placeholder="Nombre completo"
                />
              </div>
              <div>
                <Label htmlFor="email">Email Corporativo *</Label>
                <Input
                  id="email"
                  type="email"
                  value={nuevoGrupo.email}
                  onChange={(e) => setNuevoGrupo({...nuevoGrupo, email: e.target.value})}
                  placeholder="contacto@empresa.com"
                />
              </div>
              <div>
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  value={nuevoGrupo.telefono}
                  onChange={(e) => setNuevoGrupo({...nuevoGrupo, telefono: e.target.value})}
                  placeholder="+52 55 1234-5678"
                />
              </div>
              <div>
                <Label htmlFor="direccion">Dirección Corporativa</Label>
                <Input
                  id="direccion"
                  value={nuevoGrupo.direccion}
                  onChange={(e) => setNuevoGrupo({...nuevoGrupo, direccion: e.target.value})}
                  placeholder="Dirección completa"
                />
              </div>
              <div>
                <Label htmlFor="paginaWeb">Página Web</Label>
                <Input
                  id="paginaWeb"
                  value={nuevoGrupo.paginaWeb}
                  onChange={(e) => setNuevoGrupo({...nuevoGrupo, paginaWeb: e.target.value})}
                  placeholder="https://empresa.com"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button 
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                onClick={handleCrearGrupo}
              >
                Crear Grupo
              </Button>
              <Button 
                variant="outline"
                onClick={() => setShowNuevoGrupoModal(false)}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ver Usuarios */}
      {showUsuariosModal && selectedGrupo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Usuarios - {selectedGrupo.nombreGrupo}</h2>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowUsuariosModal(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-6">
              {/* Estructura del grupo con usuarios simulados */}
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Shield className="w-5 h-5" />
                      Directivos
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{selectedGrupo.director}</p>
                          <p className="text-sm text-slate-600">Director General</p>
                        </div>
                        <Badge variant="secondary">Admin</Badge>
                      </div>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">María Elena Ruiz</p>
                          <p className="text-sm text-slate-600">Subdirectora Comercial</p>
                        </div>
                        <Badge variant="secondary">Manager</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Gerentes por Agencia
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {selectedGrupo.marcas.map(marca => (
                      marca.agencias.map(agencia => (
                        <div key={agencia.id} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{agencia.gerente}</p>
                              <p className="text-sm text-slate-600">{agencia.nombreAgencia}</p>
                            </div>
                            <Badge variant="outline">Gerente</Badge>
                          </div>
                        </div>
                      ))
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button variant="outline">
                <UserPlus className="w-4 h-4 mr-2" />
                Añadir Usuario
              </Button>
              <Button variant="outline">
                Gestionar Permisos
              </Button>
              <Button variant="outline" onClick={() => setShowUsuariosModal(false)}>
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Configuración */}
      {showConfigModal && selectedGrupo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Configuración - {selectedGrupo.nombreGrupo}</h2>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowConfigModal(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Parámetros SPPC
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-3 border rounded-lg">
                      <p className="font-medium text-sm">Peso Élite</p>
                      <p className="text-lg font-bold text-green-600">3x</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <p className="font-medium text-sm">Peso Calificado</p>
                      <p className="text-lg font-bold text-blue-600">2x</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">Configurar Pesos SPPC</Button>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Metas Comerciales
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedGrupo.marcas.map(marca => (
                    <div key={marca.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{marca.nombreMarca}</p>
                        <p className="text-sm text-slate-600">Meta mensual actual</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{marca.metaDelMes} ventas</p>
                        <Button variant="ghost" size="sm">Ajustar</Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button className="bg-blue-600 hover:bg-blue-700">
                Guardar Configuración
              </Button>
              <Button variant="outline" onClick={() => setShowConfigModal(false)}>
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
