
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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

import {
  Users,
  UserPlus,
  Search,
  MoreVertical,
  Edit3,
  ToggleLeft,
  ToggleRight,
  Key,
  Mail,
  Phone,
  Calendar,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Copy,
  Filter,
  Download
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

interface Vendedor {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string | null;
  activo: boolean;
  fechaCreacion: string;
  fechaUltimoAcceso: string | null;
  configuracion: any;
}

interface FormData {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
}

export default function VendedoresPage() {
  const { data: session, status } = useSession();
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [selectedVendedor, setSelectedVendedor] = useState<Vendedor | null>(null);
  const [tempPassword, setTempPassword] = useState('');
  const [formData, setFormData] = useState<FormData>({
    nombre: '',
    apellido: '',
    email: '',
    telefono: ''
  });

  useEffect(() => {
    if (status === 'authenticated') {
      loadVendedores();
    }
  }, [status]);

  const loadVendedores = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/vendedores');
      if (response.ok) {
        const data = await response.json();
        setVendedores(data.vendedores);
      } else {
        toast.error('Error al cargar vendedores');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleCrearVendedor = async () => {
    try {
      if (!formData.nombre || !formData.apellido || !formData.email) {
        toast.error('Nombre, apellido y email son requeridos');
        return;
      }

      const response = await fetch('/api/vendedores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        setTempPassword(data.tempPassword);
        setShowPasswordDialog(true);
        setShowCreateModal(false);
        resetForm();
        loadVendedores();
        toast.success('Vendedor creado exitosamente');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al crear vendedor');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error de conexión');
    }
  };

  const handleActualizarVendedor = async () => {
    if (!selectedVendedor) return;

    try {
      const response = await fetch(`/api/vendedores/${selectedVendedor.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setShowEditModal(false);
        resetForm();
        loadVendedores();
        toast.success('Vendedor actualizado exitosamente');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al actualizar vendedor');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error de conexión');
    }
  };

  const handleToggleEstado = async (vendedor: Vendedor) => {
    try {
      const response = await fetch(`/api/vendedores/${vendedor.id}/toggle-status`, {
        method: 'POST'
      });

      if (response.ok) {
        loadVendedores();
        toast.success(`Vendedor ${!vendedor.activo ? 'activado' : 'desactivado'} exitosamente`);
      } else {
        toast.error('Error al cambiar estado del vendedor');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error de conexión');
    }
  };

  const handleResetPassword = async (vendedor: Vendedor) => {
    try {
      const response = await fetch(`/api/vendedores/${vendedor.id}/reset-password`, {
        method: 'POST'
      });

      if (response.ok) {
        const data = await response.json();
        setTempPassword(data.tempPassword);
        setShowPasswordDialog(true);
        toast.success('Contraseña restablecida exitosamente');
      } else {
        toast.error('Error al restablecer contraseña');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error de conexión');
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      apellido: '',
      email: '',
      telefono: ''
    });
    setSelectedVendedor(null);
  };

  const openEditModal = (vendedor: Vendedor) => {
    setSelectedVendedor(vendedor);
    setFormData({
      nombre: vendedor.nombre,
      apellido: vendedor.apellido,
      email: vendedor.email,
      telefono: vendedor.telefono || ''
    });
    setShowEditModal(true);
  };

  const copyPassword = async (password: string) => {
    try {
      await navigator.clipboard.writeText(password);
      toast.success('Contraseña copiada al portapapeles');
    } catch (error) {
      console.error('Error copying password:', error);
      toast.error('Error al copiar contraseña');
    }
  };

  const filteredVendedores = vendedores.filter(vendedor => {
    const matchesSearch = 
      vendedor.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendedor.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendedor.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = 
      filterStatus === 'all' ||
      (filterStatus === 'active' && vendedor.activo) ||
      (filterStatus === 'inactive' && !vendedor.activo);

    return matchesSearch && matchesFilter;
  });

  if (status === 'loading' || loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-8 w-48 bg-slate-200 animate-pulse rounded"></div>
          <div className="h-10 w-32 bg-slate-200 animate-pulse rounded"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-slate-200 animate-pulse rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!session?.user || !['DYNAMICFIN_ADMIN', 'GERENTE_VENTAS', 'GERENTE_GENERAL'].includes(session.user.rol)) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-slate-800 mb-2">Acceso Restringido</h2>
        <p className="text-slate-600">No tienes permisos para gestionar vendedores.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-600" />
            Gestión de Vendedores
          </h1>
          <p className="text-slate-600 mt-1">
            Administra el equipo de vendedores del CRM
          </p>
        </div>
        
        {session.user.rol === 'DYNAMICFIN_ADMIN' && (
          <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <UserPlus className="w-4 h-4" />
                Nuevo Vendedor
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crear Nuevo Vendedor</DialogTitle>
                <DialogDescription>
                  Complete la información para crear una nueva cuenta de vendedor.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nombre">Nombre *</Label>
                    <Input
                      id="nombre"
                      value={formData.nombre}
                      onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                      placeholder="Nombre"
                    />
                  </div>
                  <div>
                    <Label htmlFor="apellido">Apellido *</Label>
                    <Input
                      id="apellido"
                      value={formData.apellido}
                      onChange={(e) => setFormData(prev => ({ ...prev, apellido: e.target.value }))}
                      placeholder="Apellido"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="email@ejemplo.com"
                  />
                </div>
                <div>
                  <Label htmlFor="telefono">Teléfono</Label>
                  <Input
                    id="telefono"
                    value={formData.telefono}
                    onChange={(e) => setFormData(prev => ({ ...prev, telefono: e.target.value }))}
                    placeholder="+52 999 123 4567"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCrearVendedor}>
                    Crear Vendedor
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="flex-1">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Buscar vendedores..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Activos</SelectItem>
            <SelectItem value="inactive">Inactivos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Total Vendedores</p>
                <p className="text-2xl font-bold text-slate-800">{vendedores.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Vendedores Activos</p>
                <p className="text-2xl font-bold text-slate-800">
                  {vendedores.filter(v => v.activo).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Vendedores Inactivos</p>
                <p className="text-2xl font-bold text-slate-800">
                  {vendedores.filter(v => !v.activo).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vendedores Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVendedores.map((vendedor, index) => (
          <motion.div
            key={vendedor.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className={`relative ${vendedor.activo ? 'border-green-200' : 'border-red-200'}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
                      vendedor.activo ? 'bg-green-500' : 'bg-slate-400'
                    }`}>
                      {vendedor.nombre.charAt(0)}{vendedor.apellido.charAt(0)}
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        {vendedor.nombre} {vendedor.apellido}
                      </CardTitle>
                      <Badge 
                        variant={vendedor.activo ? 'default' : 'secondary'}
                        className={vendedor.activo ? 'bg-green-500' : 'bg-slate-400'}
                      >
                        {vendedor.activo ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Mail className="w-4 h-4" />
                  <span className="truncate">{vendedor.email}</span>
                </div>
                
                {vendedor.telefono && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Phone className="w-4 h-4" />
                    <span>{vendedor.telefono}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Calendar className="w-4 h-4" />
                  <span>
                    Creado: {new Date(vendedor.fechaCreacion).toLocaleDateString()}
                  </span>
                </div>

                {vendedor.fechaUltimoAcceso && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <CheckCircle className="w-4 h-4" />
                    <span>
                      Último acceso: {new Date(vendedor.fechaUltimoAcceso).toLocaleDateString()}
                    </span>
                  </div>
                )}

                <div className="flex gap-2 pt-3">
                  {(session.user.rol === 'DYNAMICFIN_ADMIN' || session.user.rol === 'GERENTE_VENTAS') && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditModal(vendedor)}
                        className="gap-1"
                      >
                        <Edit3 className="w-3 h-3" />
                        Editar
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleEstado(vendedor)}
                        className="gap-1"
                      >
                        {vendedor.activo ? (
                          <ToggleRight className="w-3 h-3" />
                        ) : (
                          <ToggleLeft className="w-3 h-3" />
                        )}
                        {vendedor.activo ? 'Desactivar' : 'Activar'}
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleResetPassword(vendedor)}
                        className="gap-1"
                      >
                        <Key className="w-3 h-3" />
                        Reset
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {filteredVendedores.length === 0 && (
        <div className="text-center py-8">
          <Users className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-800 mb-2">
            No se encontraron vendedores
          </h3>
          <p className="text-slate-600">
            {searchTerm || filterStatus !== 'all' 
              ? 'Ajusta los filtros para ver más resultados'
              : 'Crea el primer vendedor para comenzar'
            }
          </p>
        </div>
      )}

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Vendedor</DialogTitle>
            <DialogDescription>
              Actualiza la información del vendedor.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-nombre">Nombre *</Label>
                <Input
                  id="edit-nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                  placeholder="Nombre"
                />
              </div>
              <div>
                <Label htmlFor="edit-apellido">Apellido *</Label>
                <Input
                  id="edit-apellido"
                  value={formData.apellido}
                  onChange={(e) => setFormData(prev => ({ ...prev, apellido: e.target.value }))}
                  placeholder="Apellido"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-email">Email *</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="email@ejemplo.com"
              />
            </div>
            <div>
              <Label htmlFor="edit-telefono">Teléfono</Label>
              <Input
                id="edit-telefono"
                value={formData.telefono}
                onChange={(e) => setFormData(prev => ({ ...prev, telefono: e.target.value }))}
                placeholder="+52 999 123 4567"
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowEditModal(false)}>
                Cancelar
              </Button>
              <Button onClick={handleActualizarVendedor}>
                Actualizar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="w-5 h-5" />
              Contraseña Temporal Generada
            </DialogTitle>
            <DialogDescription>
              Comparte esta contraseña temporal con el vendedor. Deberá cambiarla en su primer acceso.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-slate-100 rounded-lg">
              <div className="flex items-center justify-between">
                <code className="text-lg font-mono">{tempPassword}</code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyPassword(tempPassword)}
                  className="gap-1"
                >
                  <Copy className="w-3 h-3" />
                  Copiar
                </Button>
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setShowPasswordDialog(false)}>
                Cerrar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
