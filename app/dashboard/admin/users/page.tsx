'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  Users,
  UserPlus,
  Shield,
  Building2,
  Car,
  Eye,
  Edit,
  UserX,
  RefreshCw,
  Download,
  Upload,
  Search,
  Filter,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { TipoRol } from '@prisma/client';

interface Usuario {
  id: string;
  email: string;
  nombre: string;
  apellido: string | null;
  rol: TipoRol;
  activo: boolean;
  agencia?: {
    nombreAgencia: string;
    marca: {
      nombreMarca: string;
    };
  };
  marca?: {
    nombreMarca: string;
  };
  grupo?: {
    nombreGrupo: string;
  };
  createdAt: string;
}

interface Agencia {
  id: number;
  nombreAgencia: string;
  marca: {
    nombreMarca: string;
  };
}

interface Marca {
  id: number;
  nombreMarca: string;
  grupo: {
    nombreGrupo: string;
  };
}

interface Grupo {
  id: number;
  nombreGrupo: string;
}

interface UserStats {
  totalUsuarios: number;
  usuariosInactivos: number;
  porRol: Record<string, number>;
}

export default function AdminUsersPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [agencias, setAgencias] = useState<Agencia[]>([]);
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRol, setFilterRol] = useState('');
  const [filterAgencia, setFilterAgencia] = useState('');
  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    email: '',
    nombre: '',
    apellido: '',
    password: '',
    rol: '' as TipoRol | '',
    agenciaId: '',
    marcaId: '',
    grupoId: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Cargar usuarios
      const usuariosResponse = await fetch('/api/admin/users?action=list');
      const usuariosData = await usuariosResponse.json();
      if (usuariosData.success) {
        setUsuarios(usuariosData.usuarios);
      }

      // Cargar agencias
      const agenciasResponse = await fetch('/api/admin/users?action=agencies');
      const agenciasData = await agenciasResponse.json();
      if (agenciasData.success) {
        setAgencias(agenciasData.agencias);
      }

      // Cargar marcas
      const marcasResponse = await fetch('/api/admin/users?action=marcas');
      const marcasData = await marcasResponse.json();
      if (marcasData.success) {
        setMarcas(marcasData.marcas);
      }

      // Cargar grupos
      const gruposResponse = await fetch('/api/admin/users?action=grupos');
      const gruposData = await gruposResponse.json();
      if (gruposData.success) {
        setGrupos(gruposData.grupos);
      }

      // Cargar estadísticas
      const statsResponse = await fetch('/api/admin/users?action=stats');
      const statsData = await statsResponse.json();
      if (statsData.success) {
        setStats(statsData.stats);
      }

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createUser = async () => {
    if (!formData.email || !formData.nombre || !formData.password || !formData.rol) {
      return;
    }

    setProcessing(true);
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          ...formData
        })
      });

      const data = await response.json();
      if (data.success) {
        await loadData();
        setShowCreateModal(false);
        resetForm();
      }
    } catch (error) {
      console.error('Error creating user:', error);
    } finally {
      setProcessing(false);
    }
  };

  const updateUser = async (userId: string, updateData: any) => {
    setProcessing(true);
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          userId,
          updateData
        })
      });

      const data = await response.json();
      if (data.success) {
        await loadData();
        setSelectedUser(null);
      }
    } catch (error) {
      console.error('Error updating user:', error);
    } finally {
      setProcessing(false);
    }
  };

  const deactivateUser = async (userId: string, reason: string) => {
    setProcessing(true);
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'deactivate',
          userId,
          reason
        })
      });

      const data = await response.json();
      if (data.success) {
        await loadData();
      }
    } catch (error) {
      console.error('Error deactivating user:', error);
    } finally {
      setProcessing(false);
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      nombre: '',
      apellido: '',
      password: '',
      rol: '' as TipoRol | '',
      agenciaId: '',
      marcaId: '',
      grupoId: ''
    });
  };

  const filteredUsuarios = usuarios.filter(usuario => {
    const matchesSearch = !searchTerm || 
      usuario.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usuario.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (usuario.apellido && usuario.apellido.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesRol = !filterRol || usuario.rol === filterRol;
    
    const matchesAgencia = !filterAgencia || 
      (usuario.agencia && usuario.agencia.nombreAgencia === filterAgencia);

    return matchesSearch && matchesRol && matchesAgencia;
  });

  const getRolColor = (rol: TipoRol) => {
    switch (rol) {
      case 'DYNAMICFIN_ADMIN': return 'destructive';
      case 'DIRECTOR_GENERAL': return 'default';
      case 'GERENTE_GENERAL': return 'secondary';
      case 'GERENTE_VENTAS': return 'secondary';
      case 'VENDEDOR': return 'outline';
      case 'CENTRO_LEADS': return 'outline';
      case 'MARKETING_DIGITAL': return 'outline';
      case 'TELEMARKETING': return 'outline';
      default: return 'outline';
    }
  };

  const getRolLabel = (rol: TipoRol) => {
    const labels = {
      'DYNAMICFIN_ADMIN': 'Super Admin',
      'DIRECTOR_GENERAL': 'Director General',
      'DIRECTOR_MARCA': 'Director Marca',
      'GERENTE_GENERAL': 'Gerente General',
      'GERENTE_VENTAS': 'Gerente Ventas',
      'VENDEDOR': 'Vendedor',
      'COORDINADOR_LEADS': 'Coordinador Leads',
      'CENTRO_LEADS': 'Centro Leads',
      'MARKETING_DIGITAL': 'Marketing Digital',
      'TELEMARKETING': 'Telemarketing'
    };
    return labels[rol] || rol;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Cargando administración de usuarios...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Administración de Usuarios</h1>
          <p className="text-muted-foreground">
            Gestión completa de usuarios del sistema DynamicFin CRM
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Crear Usuario
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Crear Nuevo Usuario</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="usuario@empresa.com"
                  />
                </div>
                <div>
                  <Label>Nombre *</Label>
                  <Input
                    value={formData.nombre}
                    onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                    placeholder="Nombre"
                  />
                </div>
                <div>
                  <Label>Apellido</Label>
                  <Input
                    value={formData.apellido}
                    onChange={(e) => setFormData({...formData, apellido: e.target.value})}
                    placeholder="Apellido"
                  />
                </div>
                <div>
                  <Label>Contraseña *</Label>
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    placeholder="Contraseña segura"
                  />
                </div>
                <div>
                  <Label>Rol *</Label>
                  <Select value={formData.rol} onValueChange={(value) => setFormData({...formData, rol: value as TipoRol})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar rol" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(TipoRol).map(rol => (
                        <SelectItem key={rol} value={rol}>
                          {getRolLabel(rol)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Agencia</Label>
                  <Select value={formData.agenciaId} onValueChange={(value) => setFormData({...formData, agenciaId: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar agencia" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Sin agencia</SelectItem>
                      {agencias.map(agencia => (
                        <SelectItem key={agencia.id} value={agencia.id.toString()}>
                          {agencia.nombreAgencia} ({agencia.marca.nombreMarca})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Marca</Label>
                  <Select value={formData.marcaId} onValueChange={(value) => setFormData({...formData, marcaId: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar marca" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Sin marca</SelectItem>
                      {marcas.map(marca => (
                        <SelectItem key={marca.id} value={marca.id.toString()}>
                          {marca.nombreMarca}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Grupo</Label>
                  <Select value={formData.grupoId} onValueChange={(value) => setFormData({...formData, grupoId: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar grupo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Sin grupo</SelectItem>
                      {grupos.map(grupo => (
                        <SelectItem key={grupo.id} value={grupo.id.toString()}>
                          {grupo.nombreGrupo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={createUser} 
                  disabled={processing || !formData.email || !formData.nombre || !formData.password || !formData.rol}
                >
                  {processing ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  Crear Usuario
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Estadísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsuarios}</div>
              <p className="text-xs text-muted-foreground">
                {stats.usuariosInactivos} inactivos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Super Admins</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.porRol.DYNAMICFIN_ADMIN || 0}</div>
              <p className="text-xs text-muted-foreground">
                Acceso total al sistema
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vendedores</CardTitle>
              <Car className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.porRol.VENDEDOR || 0}</div>
              <p className="text-xs text-muted-foreground">
                Personal de ventas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gerentes</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(stats.porRol.GERENTE_GENERAL || 0) + (stats.porRol.GERENTE_VENTAS || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Personal gerencial
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros y Búsqueda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Buscar</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Nombre, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div>
              <Label>Filtrar por Rol</Label>
              <Select value={filterRol} onValueChange={setFilterRol}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos los roles</SelectItem>
                  {Object.values(TipoRol).map(rol => (
                    <SelectItem key={rol} value={rol}>
                      {getRolLabel(rol)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Filtrar por Agencia</Label>
              <Select value={filterAgencia} onValueChange={setFilterAgencia}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas las agencias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas las agencias</SelectItem>
                  {agencias.map(agencia => (
                    <SelectItem key={agencia.id} value={agencia.nombreAgencia}>
                      {agencia.nombreAgencia}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setFilterRol('');
                  setFilterAgencia('');
                }}
              >
                <Filter className="h-4 w-4 mr-2" />
                Limpiar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Usuarios */}
      <Card>
        <CardHeader>
          <CardTitle>
            Usuarios del Sistema ({filteredUsuarios.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filteredUsuarios.map((usuario) => (
              <div key={usuario.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    {usuario.rol === 'DYNAMICFIN_ADMIN' && <Shield className="h-4 w-4 text-red-500" />}
                    <Users className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {usuario.nombre} {usuario.apellido}
                      </span>
                      {!usuario.activo && (
                        <Badge variant="secondary">Inactivo</Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {usuario.email}
                    </div>
                    {usuario.agencia && (
                      <div className="text-xs text-muted-foreground">
                        {usuario.agencia.nombreAgencia} - {usuario.agencia.marca.nombreMarca}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={getRolColor(usuario.rol)}>
                    {getRolLabel(usuario.rol)}
                  </Badge>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <Edit className="h-4 w-4" />
                    </Button>
                    {usuario.rol !== 'DYNAMICFIN_ADMIN' && usuario.activo && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => deactivateUser(usuario.id, 'Desactivado por administrador')}
                      >
                        <UserX className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
