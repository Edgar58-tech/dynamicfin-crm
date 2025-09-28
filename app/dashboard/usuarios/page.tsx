
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users,
  UserPlus,
  Search,
  Mail,
  Building2,
  Shield,
  MoreHorizontal,
  Edit,
  Eye,
  X,
  Phone,
  Calendar,
  CheckCircle,
  XCircle,
  Settings,
  Lock,
  Unlock,
  UserCheck,
  AlertTriangle,
  BarChart3
} from 'lucide-react';
import { motion } from 'framer-motion';

interface Usuario {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  rol: string;
  agencia: string;
  marca: string;
  grupo: string;
  activo: boolean;
  ultimoAcceso: string;
  fechaRegistro: string;
  permisos: string[];
  ventasDelMes: number;
  metaDelMes: number;
}

export default function UsuariosPage() {
  const { data: session, status } = useSession();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRol, setFilterRol] = useState('all');
  const [showNuevoUsuarioModal, setShowNuevoUsuarioModal] = useState(false);
  const [showEditarModal, setShowEditarModal] = useState(false);
  const [showPerfilModal, setShowPerfilModal] = useState(false);
  const [showPermisosModal, setShowPermisosModal] = useState(false);
  const [selectedUsuario, setSelectedUsuario] = useState<Usuario | null>(null);
  
  // Estados para nuevo usuario
  const [nuevoUsuario, setNuevoUsuario] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    rol: '',
    agencia: '',
    marca: '',
    grupo: ''
  });

  // Estados para editar usuario
  const [editandoUsuario, setEditandoUsuario] = useState({
    id: '',
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    rol: '',
    agencia: '',
    marca: '',
    grupo: '',
    activo: true
  });

  // Estados para datos auxiliares
  const [agencias, setAgencias] = useState<any[]>([]);
  const [marcas, setMarcas] = useState<any[]>([]);
  const [grupos, setGrupos] = useState<any[]>([]);

  const roles = [
    { value: 'DYNAMICFIN_ADMIN', label: '🔰 DynamicFin Master Admin', color: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white', description: 'Acceso total al sistema, incluyendo configuraciones globales' },
    { value: 'DIRECTOR_GENERAL', label: 'Director General', color: 'bg-red-100 text-red-800', description: 'Consultas y reportes de TODAS las agencias del grupo (solo lectura)' },
    { value: 'DIRECTOR_MARCA', label: 'Director de Marca', color: 'bg-purple-100 text-purple-800', description: 'Consultas y reportes de agencias de diferentes marcas (solo lectura)' },
    { value: 'GERENTE_GENERAL', label: 'Gerente General', color: 'bg-blue-100 text-blue-800', description: 'Consultas y reportes de una agencia específica (solo lectura)' },
    { value: 'GERENTE_VENTAS', label: 'Gerente de Ventas', color: 'bg-green-100 text-green-800', description: 'Gestión completa de vendedores e inventario de su agencia' },

    { value: 'VENDEDOR', label: 'Vendedor', color: 'bg-slate-100 text-slate-800', description: 'Ve sus registros, KPIs, agenda, prospectos + consulta inventario para asignar líneas' },
    { value: 'ADMINISTRADOR', label: 'Administrador Técnico', color: 'bg-indigo-100 text-indigo-800', description: 'Soporte técnico y configuración del sistema' }
  ];

  const permisosPorRol = {
    'DYNAMICFIN_ADMIN': ['DASHBOARD_ALL', 'PROSPECTOS_ALL', 'REPORTES_ALL', 'USUARIOS_MANAGE', 'GRUPOS_MANAGE', 'CONFIGURACION', 'FINANZAS_ALL', 'INVENTARIO_MANAGE', 'OPTIMIZACION_ALL', 'SYSTEM_CONFIG', 'USER_MANAGEMENT', 'GLOBAL_REPORTS', 'DATA_EXPORT', 'BACKUP_RESTORE'],
    'DIRECTOR_GENERAL': ['DASHBOARD_ALL', 'REPORTES_ALL', 'CONSULTAS_ALL'],
    'DIRECTOR_MARCA': ['DASHBOARD_MARCA', 'REPORTES_MARCA', 'CONSULTAS_MARCA'],
    'GERENTE_GENERAL': ['DASHBOARD_AGENCIA', 'REPORTES_AGENCIA', 'CONSULTAS_AGENCIA'],
    'GERENTE_VENTAS': ['DASHBOARD_AGENCIA', 'PROSPECTOS_AGENCIA', 'REPORTES_AGENCIA', 'INVENTARIO_MANAGE', 'USUARIOS_VENDEDORES', 'OPTIMIZACION_AGENCIA', 'FINANZAS_AGENCIA', 'ANALISIS_CARGA'],

    'VENDEDOR': ['DASHBOARD_PERSONAL', 'PROSPECTOS_PERSONAL', 'REPORTES_PERSONAL', 'INVENTARIO_ASSIGN_LINE', 'AGENDA_PERSONAL'],
    'ADMINISTRADOR': ['USUARIOS_MANAGE', 'CONFIGURACION', 'GRUPOS_MANAGE', 'SYSTEM_CONFIG']
  };

  const permisosDescripciones = {
    // Dashboard
    'DASHBOARD_ALL': 'Dashboard de todas las agencias del grupo',
    'DASHBOARD_MARCA': 'Dashboard de agencias de la marca',
    'DASHBOARD_AGENCIA': 'Dashboard de la agencia específica',
    'DASHBOARD_PERSONAL': 'Dashboard personal con sus KPIs',
    
    // Prospectos
    'PROSPECTOS_ALL': 'Prospectos de todas las agencias',
    'PROSPECTOS_AGENCIA': 'Prospectos de la agencia',
    'PROSPECTOS_PERSONAL': 'Solo sus propios prospectos',
    
    // Reportes y Consultas
    'REPORTES_ALL': 'Reportes de todas las agencias',
    'REPORTES_MARCA': 'Reportes de agencias de la marca',
    'REPORTES_AGENCIA': 'Reportes de la agencia',
    'REPORTES_PERSONAL': 'Solo reportes de sus registros',
    'CONSULTAS_ALL': 'Consultas de todas las agencias',
    'CONSULTAS_MARCA': 'Consultas de la marca',
    'CONSULTAS_AGENCIA': 'Consultas de la agencia',
    
    // Inventario
    'INVENTARIO_MANAGE': 'Apartar/librar, actualizar inventario',
    'INVENTARIO_VIEW': 'Solo visualización de inventario',
    'INVENTARIO_ASSIGN_LINE': 'Consultar + asignar líneas a prospectos (sin apartar unidades)',
    
    // Usuarios
    'USUARIOS_MANAGE': 'Administración completa de usuarios',
    'USUARIOS_VENDEDORES': 'Alta/baja solo de vendedores',
    
    // Finanzas
    'FINANZAS_ALL': 'Finanzas de todas las agencias',
    'FINANZAS_AGENCIA': 'Finanzas de la agencia',
    
    // Optimización
    'OPTIMIZACION_ALL': 'Optimización de todas las agencias',
    'OPTIMIZACION_AGENCIA': 'Optimización de la agencia',
    
    // Otros
    'ANALISIS_CARGA': 'Análisis de carga de vendedores',
    'AGENDA_PERSONAL': 'Agenda personal y seguimientos',
    'CONFIGURACION': 'Configuración del sistema',
    'GRUPOS_MANAGE': 'Gestión de grupos y agencias',
    'SYSTEM_CONFIG': 'Configuraciones del sistema',
    'USER_MANAGEMENT': 'Gestión avanzada de usuarios',
    'GLOBAL_REPORTS': 'Reportes globales del sistema',
    'DATA_EXPORT': 'Exportación masiva de datos',
    'BACKUP_RESTORE': 'Respaldo y restauración'
  };

  const handleNuevoUsuario = () => {
    setShowNuevoUsuarioModal(true);
  };

  const handleCrearUsuario = async () => {
    if (!nuevoUsuario.nombre || !nuevoUsuario.apellido || !nuevoUsuario.email || !nuevoUsuario.rol) {
      alert('⚠️ Por favor completa todos los campos obligatorios:\n• Nombre\n• Apellido\n• Email\n• Rol');
      return;
    }
    
    // Validaciones especiales para usuario maestro
    if (nuevoUsuario.rol === 'DYNAMICFIN_ADMIN') {
      const confirmMaster = confirm('🔰 CREAR USUARIO MAESTRO DYNAMICFIN\n\n⚠️ IMPORTANTE:\nEstás creando un usuario con acceso completo al sistema.\n\n🔹 Este usuario tendrá:\n• Acceso a todas las funciones\n• Capacidad de gestionar otros usuarios\n• Acceso a configuraciones globales\n• Permisos de respaldo y exportación\n• Visibilidad de todos los datos\n\n¿Confirmas la creación de este usuario maestro?');
      
      if (!confirmMaster) {
        return;
      }
    }

    try {
      setLoading(true);
      
      // Generar contraseña temporal
      const tempPassword = 'DynamicFin2025' + Math.floor(Math.random() * 1000);
      
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create',
          email: nuevoUsuario.email,
          nombre: nuevoUsuario.nombre,
          apellido: nuevoUsuario.apellido,
          password: tempPassword,
          rol: nuevoUsuario.rol,
          agenciaId: nuevoUsuario.agencia ? parseInt(nuevoUsuario.agencia) : null,
          marcaId: nuevoUsuario.marca ? parseInt(nuevoUsuario.marca) : null,
          grupoId: nuevoUsuario.grupo ? parseInt(nuevoUsuario.grupo) : null
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear usuario');
      }

      const rolInfo = roles.find(r => r.value === nuevoUsuario.rol);
      
      // Mensaje de confirmación exitosa
      let mensaje = `✅ USUARIO CREADO EXITOSAMENTE\n\n👤 USUARIO: ${nuevoUsuario.nombre} ${nuevoUsuario.apellido}\n📧 EMAIL: ${nuevoUsuario.email}\n🏷️ ROL: ${rolInfo?.label}\n🔑 CONTRASEÑA TEMPORAL: ${tempPassword}`;
      
      if (nuevoUsuario.rol === 'VENDEDOR') {
        mensaje += '\n\n📋 ALCANCE PERSONAL:\n• Solo ve sus propios registros y KPIs\n• Agenda personal y prospectos asignados\n• Reportes únicamente de sus ventas\n• Sin acceso a datos de otros vendedores\n\n🚗 ACCESO A INVENTARIO:\n• Puede consultar disponibilidad de vehículos\n• Puede asignar líneas (marca/modelo/versión/año) a prospectos\n• NO puede apartar unidades específicas con número de serie\n• Para apartar debe solicitar apoyo al Gerente de Ventas';
      }
      
      mensaje += '\n\n✅ PRÓXIMOS PASOS:\n• El usuario debe cambiar la contraseña temporal en su primer acceso\n• Coordinar capacitación inicial\n• Verificar permisos específicos';
      
      alert(mensaje);
      
      // Reset form y cerrar modal
      setNuevoUsuario({
        nombre: '', apellido: '', email: '', telefono: '', rol: '', agencia: '', marca: '', grupo: ''
      });
      setShowNuevoUsuarioModal(false);
      
      // Recargar la lista de usuarios
      await loadUsuarios();
      
    } catch (error) {
      console.error('Error creating user:', error);
      alert(`❌ Error al crear usuario:\n${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos auxiliares (agencias, marcas, grupos)
  const loadAuxiliarData = async () => {
    try {
      // Cargar agencias
      const agenciasResponse = await fetch('/api/admin/users?action=agencies');
      const agenciasData = await agenciasResponse.json();
      if (agenciasResponse.ok) {
        setAgencias(agenciasData.agencias || []);
      }

      // Cargar marcas
      const marcasResponse = await fetch('/api/admin/users?action=marcas');
      const marcasData = await marcasResponse.json();
      if (marcasResponse.ok) {
        setMarcas(marcasData.marcas || []);
      }

      // Cargar grupos
      const gruposResponse = await fetch('/api/admin/users?action=grupos');
      const gruposData = await gruposResponse.json();
      if (gruposResponse.ok) {
        setGrupos(gruposData.grupos || []);
      }
    } catch (error) {
      console.error('Error loading auxiliary data:', error);
    }
  };

  const handleEditarUsuario = (usuario: Usuario) => {
    setEditandoUsuario({
      id: usuario.id,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      email: usuario.email,
      telefono: usuario.telefono,
      rol: usuario.rol,
      agencia: '', // Se podría mapear el ID de agencia si fuera necesario
      marca: '', // Se podría mapear el ID de marca si fuera necesario
      grupo: '', // Se podría mapear el ID de grupo si fuera necesario
      activo: usuario.activo
    });
    setSelectedUsuario(usuario);
    setShowEditarModal(true);
  };

  const handleActualizarUsuario = async () => {
    if (!editandoUsuario.nombre || !editandoUsuario.email || !editandoUsuario.rol) {
      alert('⚠️ Por favor completa todos los campos obligatorios:\n• Nombre\n• Email\n• Rol');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'update',
          userId: editandoUsuario.id,
          updateData: {
            nombre: editandoUsuario.nombre,
            apellido: editandoUsuario.apellido,
            email: editandoUsuario.email,
            rol: editandoUsuario.rol,
            agenciaId: editandoUsuario.agencia ? parseInt(editandoUsuario.agencia) : null,
            marcaId: editandoUsuario.marca ? parseInt(editandoUsuario.marca) : null,
            grupoId: editandoUsuario.grupo ? parseInt(editandoUsuario.grupo) : null,
            activo: editandoUsuario.activo
          }
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al actualizar usuario');
      }

      alert(`✅ Usuario actualizado exitosamente\n\n👤 ${editandoUsuario.nombre} ${editandoUsuario.apellido}\n📧 ${editandoUsuario.email}`);
      
      setShowEditarModal(false);
      await loadUsuarios(); // Recargar lista

    } catch (error) {
      console.error('Error updating user:', error);
      alert(`❌ Error al actualizar usuario:\n${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEstado = async (usuario: Usuario) => {
    const accion = usuario.activo ? 'desactivar' : 'activar';
    const confirmar = confirm(`⚠️ ${accion.toUpperCase()} USUARIO\n\n¿Estás seguro de que deseas ${accion} a:\n${usuario.nombre} ${usuario.apellido} (${usuario.email})?\n\n${usuario.activo ? 'El usuario perderá acceso al sistema pero se mantendrán sus registros.' : 'El usuario recuperará acceso al sistema.'}`);
    
    if (!confirmar) return;

    try {
      setLoading(true);

      if (usuario.activo) {
        // Desactivar usuario
        const response = await fetch('/api/admin/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'deactivate',
            userId: usuario.id,
            reason: 'Desactivado por administrador'
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Error al desactivar usuario');
        }

        alert(`✅ Usuario desactivado exitosamente\n\n${usuario.nombre} ${usuario.apellido} ya no tiene acceso al sistema.`);
      } else {
        // Activar usuario (actualizar con activo: true)
        const response = await fetch('/api/admin/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'update',
            userId: usuario.id,
            updateData: {
              activo: true
            }
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Error al activar usuario');
        }

        alert(`✅ Usuario activado exitosamente\n\n${usuario.nombre} ${usuario.apellido} ahora tiene acceso al sistema.`);
      }
      
      await loadUsuarios(); // Recargar lista

    } catch (error) {
      console.error(`Error ${accion} user:`, error);
      alert(`❌ Error al ${accion} usuario:\n${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleVerPerfil = (usuario: Usuario) => {
    setSelectedUsuario(usuario);
    setShowPerfilModal(true);
  };

  const handleGestionarPermisos = (usuario: Usuario) => {
    alert(`🔧 GESTIÓN DE PERMISOS\n\nFuncionalidad en desarrollo para:\n${usuario.nombre} ${usuario.apellido}\n\nPróximamente podrás gestionar permisos específicos para cada usuario.`);
  };

  const handleResetPassword = async (usuario: Usuario) => {
    const confirmar = confirm(`🔑 RESTABLECER CONTRASEÑA\n\n¿Deseas generar una nueva contraseña temporal para:\n${usuario.nombre} ${usuario.apellido}?\n\nSe enviará la nueva contraseña por email.`);
    
    if (!confirmar) return;

    try {
      setLoading(true);
      
      // Generar nueva contraseña temporal
      const newPassword = 'DynamicFin2025' + Math.floor(Math.random() * 1000);
      
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'update',
          userId: usuario.id,
          updateData: {
            password: newPassword
          }
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al restablecer contraseña');
      }

      alert(`✅ CONTRASEÑA RESTABLECIDA\n\n👤 Usuario: ${usuario.nombre} ${usuario.apellido}\n🔑 Nueva contraseña: ${newPassword}\n\n📧 Se ha enviado por email al usuario.\n⚠️ El usuario debe cambiar esta contraseña temporal en su próximo acceso.`);
      
    } catch (error) {
      console.error('Error resetting password:', error);
      alert(`❌ Error al restablecer contraseña:\n${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setLoading(false);
    }
  };



  const getRolColor = (rol: string) => {
    return roles.find(r => r.value === rol)?.color || 'bg-gray-100 text-gray-800';
  };

  const getRolLabel = (rol: string) => {
    return roles.find(r => r.value === rol)?.label || rol;
  };

  const filteredUsuarios = usuarios.filter(usuario => {
    const matchesSearch = 
      usuario.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usuario.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usuario.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = filterRol === 'all' || usuario.rol === filterRol;
    
    return matchesSearch && matchesRole;
  });

  // Función para cargar usuarios desde la API
  const loadUsuarios = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/users?action=list');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al cargar usuarios');
      }
      
      // Transformar datos para que coincidan con la interfaz Usuario
      const usuariosTransformados: Usuario[] = data.usuarios.map((user: any) => ({
        id: user.id,
        nombre: user.nombre,
        apellido: user.apellido || '',
        email: user.email,
        telefono: '', // Este campo no viene de la API, se podría agregar después
        rol: user.rol,
        agencia: user.agencia?.nombreAgencia || 'Sin asignar',
        marca: user.marca?.nombreMarca || user.agencia?.marca?.nombreMarca || 'Sin asignar',
        grupo: user.grupo?.nombreGrupo || 'Sin asignar',
        activo: user.activo,
        ultimoAcceso: new Date().toISOString().split('T')[0], // Placeholder
        fechaRegistro: new Date(user.createdAt).toISOString().split('T')[0],
        permisos: permisosPorRol[user.rol as keyof typeof permisosPorRol] || [],
        ventasDelMes: 0, // Placeholder - se podría obtener de métricas
        metaDelMes: 0 // Placeholder - se podría obtener de metas
      }));
      
      setUsuarios(usuariosTransformados);
    } catch (error) {
      console.error('Error loading users:', error);
      alert(`❌ Error al cargar usuarios:\n${error instanceof Error ? error.message : 'Error desconocido'}`);
      
      // Fallback a datos de ejemplo si hay error
      setUsuarios([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsuarios();
    loadAuxiliarData();
  }, []);

  if (status === 'loading' || loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-slate-200 rounded w-48 animate-pulse"></div>
        <div className="grid gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-16 bg-slate-200 rounded"></div>
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
          <h1 className="text-3xl font-bold text-slate-900">Gestión de Usuarios</h1>
          <p className="text-slate-600 mt-2">Administra usuarios, roles y permisos del sistema</p>
        </div>
        <Button 
          className="bg-blue-600 hover:bg-blue-700"
          onClick={handleNuevoUsuario}
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Nuevo Usuario
        </Button>
      </div>

      {/* Información sobre la jerarquía de permisos */}
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-blue-900">Sistema de Permisos por Jerarquía</h3>
              <p className="text-blue-700 text-sm">La diferencia clave es el ALCANCE (qué pueden ver) y PERMISOS (qué pueden modificar)</p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-white rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-slate-100 text-slate-800">VENDEDOR</Badge>
              </div>
              <p className="text-sm text-slate-600 mb-2">
                <strong>Alcance:</strong> Solo sus registros<br/>
                <strong>Permisos:</strong> Ver KPIs, agenda, prospectos
              </p>
              <p className="text-xs text-green-600">✅ Inventario: consulta + asignar líneas</p>
            </div>

            <div className="p-4 bg-white rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-green-100 text-green-800">GERENTE VENTAS</Badge>
              </div>
              <p className="text-sm text-slate-600 mb-2">
                <strong>Alcance:</strong> Su agencia<br/>
                <strong>Permisos:</strong> Gestión completa
              </p>
              <p className="text-xs text-green-600">✅ Apartar/librar, alta/baja vendedores</p>
            </div>

            <div className="p-4 bg-white rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-blue-100 text-blue-800">GERENTE GENERAL</Badge>
              </div>
              <p className="text-sm text-slate-600 mb-2">
                <strong>Alcance:</strong> Su agencia<br/>
                <strong>Permisos:</strong> Solo consultas
              </p>
              <p className="text-xs text-blue-600">👁️ Reportes y dashboard únicamente</p>
            </div>

            <div className="p-4 bg-white rounded-lg border border-red-200">
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-red-100 text-red-800">DIRECTOR GENERAL</Badge>
              </div>
              <p className="text-sm text-slate-600 mb-2">
                <strong>Alcance:</strong> Todas las agencias<br/>
                <strong>Permisos:</strong> Solo consultas
              </p>
              <p className="text-xs text-red-600">🌐 Vista ejecutiva completa</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas Rápidas */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{usuarios.filter(u => u.activo).length}</p>
                <p className="text-sm text-slate-600">Usuarios Activos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {usuarios.filter(u => ['DIRECTOR_GENERAL', 'DIRECTOR_MARCA'].includes(u.rol)).length}
                </p>
                <p className="text-sm text-slate-600">Directivos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {usuarios.filter(u => ['GERENTE_GENERAL', 'GERENTE_VENTAS'].includes(u.rol)).length}
                </p>
                <p className="text-sm text-slate-600">Gerentes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {usuarios.filter(u => u.rol.includes('VENDEDOR')).length}
                </p>
                <p className="text-sm text-slate-600">Vendedores</p>
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
              placeholder="Buscar usuarios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={filterRol} onValueChange={setFilterRol}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por rol" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los roles</SelectItem>
            {roles.map(rol => (
              <SelectItem key={rol.value} value={rol.value}>
                {rol.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Lista de Usuarios */}
      <div className="grid gap-4">
        {filteredUsuarios.map((usuario, index) => (
          <motion.div
            key={usuario.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <Card className="hover:shadow-md transition-shadow duration-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                      <span className="text-lg font-semibold text-slate-700">
                        {usuario.nombre.charAt(0)}{usuario.apellido.charAt(0)}
                      </span>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-slate-900">
                          {usuario.nombre} {usuario.apellido}
                        </h3>
                        <Badge className={getRolColor(usuario.rol)}>
                          {getRolLabel(usuario.rol)}
                        </Badge>
                        {usuario.activo ? (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Activo
                          </Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-800">
                            <XCircle className="w-3 h-3 mr-1" />
                            Inactivo
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-4 mb-2">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Mail className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{usuario.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Phone className="w-4 h-4 flex-shrink-0" />
                          <span>{usuario.telefono}</span>
                        </div>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-4 text-sm text-slate-600">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 flex-shrink-0" />
                          <span>{usuario.agencia} • {usuario.marca}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 flex-shrink-0" />
                          <span>Último acceso: {new Date(usuario.ultimoAcceso).toLocaleDateString('es-ES')}</span>
                        </div>
                      </div>

                      {/* Métricas de vendedores */}
                      {(usuario.rol.includes('VENDEDOR') && usuario.ventasDelMes > 0) && (
                        <div className="mt-3 p-2 bg-slate-50 rounded-lg">
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-slate-600">Ventas del mes:</span>
                            <span className="font-semibold text-green-600">
                              {usuario.ventasDelMes}/{usuario.metaDelMes}
                            </span>
                            <div className="flex-1 bg-slate-200 rounded-full h-2">
                              <div 
                                className="bg-green-600 h-2 rounded-full transition-all"
                                style={{ width: `${Math.min((usuario.ventasDelMes/usuario.metaDelMes)*100, 100)}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-slate-500">
                              {((usuario.ventasDelMes/usuario.metaDelMes)*100).toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleVerPerfil(usuario)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Ver Perfil
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEditarUsuario(usuario)}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleEstado(usuario)}
                    >
                      {usuario.activo ? (
                        <Lock className="w-4 h-4 mr-1" />
                      ) : (
                        <Unlock className="w-4 h-4 mr-1" />
                      )}
                      {usuario.activo ? 'Desactivar' : 'Activar'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {filteredUsuarios.length === 0 && (
        <div className="text-center py-12">
          <div className="text-slate-400 mb-4">
            <Users className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-slate-600 mb-2">No se encontraron usuarios</h3>
          <p className="text-slate-500">Ajusta los filtros o agrega nuevos usuarios.</p>
        </div>
      )}

      {/* Modal Nuevo Usuario */}
      {showNuevoUsuarioModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Crear Nuevo Usuario</h2>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowNuevoUsuarioModal(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nombre">Nombre *</Label>
                  <Input
                    id="nombre"
                    value={nuevoUsuario.nombre}
                    onChange={(e) => setNuevoUsuario({...nuevoUsuario, nombre: e.target.value})}
                    placeholder="Nombre"
                  />
                </div>
                <div>
                  <Label htmlFor="apellido">Apellido *</Label>
                  <Input
                    id="apellido"
                    value={nuevoUsuario.apellido}
                    onChange={(e) => setNuevoUsuario({...nuevoUsuario, apellido: e.target.value})}
                    placeholder="Apellido"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="email">Email Corporativo *</Label>
                <Input
                  id="email"
                  type="email"
                  value={nuevoUsuario.email}
                  onChange={(e) => setNuevoUsuario({...nuevoUsuario, email: e.target.value})}
                  placeholder="usuario@empresa.com"
                />
              </div>
              
              <div>
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  value={nuevoUsuario.telefono}
                  onChange={(e) => setNuevoUsuario({...nuevoUsuario, telefono: e.target.value})}
                  placeholder="+52 55 1234-5678"
                />
              </div>
              
              <div>
                <Label htmlFor="rol">Rol del Usuario *</Label>
                <Select value={nuevoUsuario.rol} onValueChange={(value) => setNuevoUsuario({...nuevoUsuario, rol: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar rol" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map(rol => (
                      <SelectItem key={rol.value} value={rol.value}>
                        {rol.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Campos condicionales según el rol */}
              {nuevoUsuario.rol !== 'DYNAMICFIN_ADMIN' && (
                <>
                  <div>
                    <Label htmlFor="agencia">
                      Agencia {(nuevoUsuario.rol === 'GERENTE_GENERAL' || nuevoUsuario.rol === 'GERENTE_VENTAS' || nuevoUsuario.rol.includes('VENDEDOR')) ? '*' : ''}
                    </Label>
                    <Input
                      id="agencia"
                      value={nuevoUsuario.agencia}
                      onChange={(e) => setNuevoUsuario({...nuevoUsuario, agencia: e.target.value})}
                      placeholder={
                        nuevoUsuario.rol === 'DIRECTOR_GENERAL' ? 'Todas (opcional)' :
                        nuevoUsuario.rol === 'DIRECTOR_MARCA' ? 'Todas de la marca (opcional)' :
                        'Nombre de la agencia específica'
                      }
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="marca">
                      Marca {(nuevoUsuario.rol === 'DIRECTOR_MARCA' || nuevoUsuario.rol === 'GERENTE_GENERAL') ? '*' : ''}
                    </Label>
                    <Input
                      id="marca"
                      value={nuevoUsuario.marca}
                      onChange={(e) => setNuevoUsuario({...nuevoUsuario, marca: e.target.value})}
                      placeholder={
                        nuevoUsuario.rol === 'DIRECTOR_GENERAL' ? 'Todas (opcional)' :
                        'Marca específica (Audi, BMW, Mercedes, etc.)'
                      }
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="grupo">Grupo Automotriz</Label>
                    <Input
                      id="grupo"
                      value={nuevoUsuario.grupo}
                      onChange={(e) => setNuevoUsuario({...nuevoUsuario, grupo: e.target.value})}
                      placeholder="Nombre del grupo (ej: Grupo Alemán Premium)"
                    />
                  </div>
                </>
              )}

              {nuevoUsuario.rol === 'DYNAMICFIN_ADMIN' && (
                <div className="p-4 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">🔰</span>
                    <h3 className="font-semibold text-purple-800">Usuario Maestro DynamicFin</h3>
                  </div>
                  <p className="text-sm text-purple-700 mb-2">
                    Este usuario tendrá acceso completo a todas las funciones del sistema, incluidos todos los grupos, marcas y agencias.
                  </p>
                  <div className="text-xs text-purple-600">
                    <p>• No requiere asignación de agencia o marca específica</p>
                    <p>• Puede gestionar todos los usuarios del sistema</p>
                    <p>• Acceso a configuraciones globales y respaldos</p>
                    <p>• Ideal para soporte técnico de DynamicFin</p>
                  </div>
                </div>
              )}

              {nuevoUsuario.rol && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-blue-800">Permisos del rol seleccionado:</p>
                    <Badge variant="secondary" className="text-xs">
                      {(permisosPorRol[nuevoUsuario.rol as keyof typeof permisosPorRol] || []).length} permisos
                    </Badge>
                  </div>
                  <div className="text-xs text-blue-700 space-y-1">
                    {(permisosPorRol[nuevoUsuario.rol as keyof typeof permisosPorRol] || []).map(permiso => (
                      <div key={permiso} className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs px-2 py-1">
                          {permiso}
                        </Badge>
                        <span className="text-xs text-slate-600">
                          {permisosDescripciones[permiso as keyof typeof permisosDescripciones]}
                        </span>
                      </div>
                    ))}
                  </div>
                  {roles.find(r => r.value === nuevoUsuario.rol)?.description && (
                    <div className="mt-3 pt-2 border-t border-blue-200">
                      <p className="text-xs font-medium text-blue-800">Descripción del rol:</p>
                      <p className="text-xs text-blue-700 mt-1">
                        {roles.find(r => r.value === nuevoUsuario.rol)?.description}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button 
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                onClick={handleCrearUsuario}
              >
                Crear Usuario
              </Button>
              <Button 
                variant="outline"
                onClick={() => setShowNuevoUsuarioModal(false)}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ver Perfil */}
      {showPerfilModal && selectedUsuario && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Perfil de Usuario</h2>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowPerfilModal(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-semibold text-slate-700">
                    {selectedUsuario.nombre.charAt(0)}{selectedUsuario.apellido.charAt(0)}
                  </span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">
                    {selectedUsuario.nombre} {selectedUsuario.apellido}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={getRolColor(selectedUsuario.rol)}>
                      {getRolLabel(selectedUsuario.rol)}
                    </Badge>
                    <Badge className={selectedUsuario.activo ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                      {selectedUsuario.activo ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Información de Contacto</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-slate-500" />
                      <span>{selectedUsuario.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-slate-500" />
                      <span>{selectedUsuario.telefono}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Building2 className="w-4 h-4 text-slate-500" />
                      <span>{selectedUsuario.agencia}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Información del Sistema</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-sm">
                      <span className="text-slate-500">Registrado: </span>
                      <span>{new Date(selectedUsuario.fechaRegistro).toLocaleDateString('es-ES')}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-slate-500">Último acceso: </span>
                      <span>{new Date(selectedUsuario.ultimoAcceso).toLocaleDateString('es-ES')}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-slate-500">Grupo: </span>
                      <span>{selectedUsuario.grupo}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Permisos del Sistema
                    <Badge variant="secondary" className="ml-auto">
                      {selectedUsuario.permisos.length} permisos
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {selectedUsuario.permisos.map(permiso => (
                      <div key={permiso} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="font-mono text-xs">
                            {permiso}
                          </Badge>
                          <span className="text-sm text-slate-700">
                            {permisosDescripciones[permiso as keyof typeof permisosDescripciones] || permiso}
                          </span>
                        </div>
                        <div className="text-green-600">
                          <CheckCircle className="w-4 h-4" />
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {selectedUsuario.rol === 'DYNAMICFIN_ADMIN' && (
                    <div className="mt-4 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">🔰</span>
                        <h4 className="font-semibold text-purple-800">Usuario Maestro</h4>
                      </div>
                      <p className="text-sm text-purple-700">
                        Este usuario tiene acceso completo y sin restricciones a todas las funcionalidades del sistema.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {selectedUsuario.rol.includes('VENDEDOR') && selectedUsuario.ventasDelMes > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      Rendimiento de Ventas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">Ventas del mes</span>
                        <span className="font-bold">{selectedUsuario.ventasDelMes}/{selectedUsuario.metaDelMes}</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full transition-all"
                          style={{ width: `${Math.min((selectedUsuario.ventasDelMes/selectedUsuario.metaDelMes)*100, 100)}%` }}
                        ></div>
                      </div>
                      <div className="text-sm text-slate-500">
                        {((selectedUsuario.ventasDelMes/selectedUsuario.metaDelMes)*100).toFixed(1)}% de la meta alcanzada
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button 
                variant="outline"
                onClick={() => handleGestionarPermisos(selectedUsuario)}
              >
                <Settings className="w-4 h-4 mr-2" />
                Gestionar Permisos
              </Button>
              <Button 
                variant="outline"
                onClick={() => handleResetPassword(selectedUsuario)}
              >
                <Lock className="w-4 h-4 mr-2" />
                Restablecer Contraseña
              </Button>
              <Button variant="outline" onClick={() => setShowPerfilModal(false)}>
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Usuario */}
      {showEditarModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Editar Usuario</h2>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowEditarModal(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Nombre *</Label>
                  <Input
                    value={editandoUsuario.nombre}
                    onChange={(e) => setEditandoUsuario(prev => ({...prev, nombre: e.target.value}))}
                    placeholder="Nombre del usuario"
                  />
                </div>
                <div>
                  <Label>Apellido</Label>
                  <Input
                    value={editandoUsuario.apellido}
                    onChange={(e) => setEditandoUsuario(prev => ({...prev, apellido: e.target.value}))}
                    placeholder="Apellido del usuario"
                  />
                </div>
              </div>

              <div>
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={editandoUsuario.email}
                  onChange={(e) => setEditandoUsuario(prev => ({...prev, email: e.target.value}))}
                  placeholder="email@empresa.com"
                />
              </div>

              <div>
                <Label>Rol *</Label>
                <Select 
                  value={editandoUsuario.rol}
                  onValueChange={(value) => setEditandoUsuario(prev => ({...prev, rol: value}))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un rol" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map(rol => (
                      <SelectItem key={rol.value} value={rol.value}>
                        {rol.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label>Agencia</Label>
                  <Select 
                    value={editandoUsuario.agencia}
                    onValueChange={(value) => setEditandoUsuario(prev => ({...prev, agencia: value}))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona agencia" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Sin agencia</SelectItem>
                      {agencias.map(agencia => (
                        <SelectItem key={agencia.id} value={agencia.id.toString()}>
                          {agencia.nombreAgencia}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Marca</Label>
                  <Select 
                    value={editandoUsuario.marca}
                    onValueChange={(value) => setEditandoUsuario(prev => ({...prev, marca: value}))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona marca" />
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
                  <Select 
                    value={editandoUsuario.grupo}
                    onValueChange={(value) => setEditandoUsuario(prev => ({...prev, grupo: value}))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona grupo" />
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

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="activo"
                  checked={editandoUsuario.activo}
                  onChange={(e) => setEditandoUsuario(prev => ({...prev, activo: e.target.checked}))}
                  className="w-4 h-4"
                />
                <Label htmlFor="activo">Usuario activo</Label>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button 
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                onClick={handleActualizarUsuario}
                disabled={loading}
              >
                Actualizar Usuario
              </Button>
              <Button 
                variant="outline"
                onClick={() => setShowEditarModal(false)}
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
