
'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  Users, 
  Car, 
  Target, 
  FileText, 
  Settings, 
  LogOut, 
  Shield,
  Building2,
  TrendingUp,
  UserCheck,
  Database,
  Calculator,
  Calendar,
  UserCog,
  ArrowRightLeft,
  GraduationCap,
  Eye,
  Activity,
  Zap
} from 'lucide-react';
import { TipoRol } from '@prisma/client';

export function Sidebar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  if (status === 'loading') {
    return (
      <div className="w-64 h-screen bg-white border-r border-slate-200 animate-pulse">
        <div className="p-6">
          <div className="h-8 bg-slate-200 rounded mb-6"></div>
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-10 bg-slate-200 rounded mb-2"></div>
          ))}
        </div>
      </div>
    );
  }

  // El check de sesión se maneja en el layout, aquí asumimos que siempre hay sesión válida

  const navigationItems = [
    {
      title: 'Dashboard',
      href: '/dashboard',
      icon: BarChart3,
      roles: ['ALL'],
    },
    {
      title: 'Prospectos SPPC',
      href: '/dashboard/prospectos',
      icon: Users,
      roles: ['ALL'],
    },
    {
      title: 'Calendario',
      href: '/dashboard/calendario',
      icon: Calendar,
      roles: ['ALL'],
    },
    {
      title: 'Optimización',
      href: '/dashboard/optimizacion',
      icon: Target,
      roles: ['ALL'],
    },
    
    // SECCIÓN GERENCIAL - Solo para gerentes
    ...(session?.user?.rol === 'GERENTE_VENTAS' ? [
      {
        title: '👔 Dashboard Gerencial',
        href: '/dashboard/gerente',
        icon: UserCog,
        roles: ['GERENTE_VENTAS'],
      },
      {
        title: '🔄 Reasignación Leads',
        href: '/dashboard/gerente/reasignacion',
        icon: ArrowRightLeft,
        roles: ['GERENTE_VENTAS'],
      },
      {
        title: '🎓 Coaching Equipo',
        href: '/dashboard/gerente/coaching',
        icon: GraduationCap,
        roles: ['GERENTE_VENTAS'],
      },
      {
        title: '🔮 Forecasting',
        href: '/dashboard/gerente/forecasting',
        icon: Eye,
        roles: ['GERENTE_VENTAS'],
      },
      {
        title: '📊 Reportes Gerenciales',
        href: '/dashboard/gerente/reportes',
        icon: Activity,
        roles: ['GERENTE_VENTAS'],
      },
      {
        title: '⚙️ Configuración Sistema',
        href: '/dashboard/gerente/configuracion',
        icon: Zap,
        roles: ['GERENTE_VENTAS'],
      },
    ] : []),
    
    {
      title: 'Análisis Carga',
      href: '/dashboard/analisis-carga',
      icon: TrendingUp,
      roles: ['GERENTE_GENERAL', 'GERENTE_VENTAS', 'DIRECTOR_MARCA', 'DIRECTOR_GENERAL', 'DYNAMICFIN_ADMIN'],
    },
    {
      title: 'Inventario',
      href: '/dashboard/inventario',
      icon: Car,
      roles: ['ALL'],
    },
    {
      title: 'Finanzas',
      href: '/dashboard/finanzas',
      icon: Calculator,
      roles: ['GERENTE_GENERAL', 'GERENTE_VENTAS', 'DIRECTOR_MARCA', 'DIRECTOR_GENERAL', 'DYNAMICFIN_ADMIN'],
    },
    {
      title: 'Reportes',
      href: '/dashboard/reportes',
      icon: FileText,
      roles: ['GERENTE_GENERAL', 'GERENTE_VENTAS', 'DIRECTOR_MARCA', 'DIRECTOR_GENERAL', 'DYNAMICFIN_ADMIN'],
    },
    {
      title: 'Gestión Grupos',
      href: '/dashboard/grupos',
      icon: Building2,
      roles: ['DIRECTOR_GENERAL', 'DYNAMICFIN_ADMIN'],
    },
    {
      title: 'Usuarios',
      href: '/dashboard/usuarios',
      icon: UserCheck,
      roles: ['DIRECTOR_GENERAL', 'DIRECTOR_MARCA', 'GERENTE_GENERAL', 'DYNAMICFIN_ADMIN'],
    },
    {
      title: 'Configuración',
      href: '/dashboard/configuracion',
      icon: Settings,
      roles: ['DIRECTOR_GENERAL', 'DYNAMICFIN_ADMIN'],
    },
  ];

  const hasAccess = (roles: string[], userRole?: TipoRol) => {
    if (!userRole) return roles.includes('ALL'); // Si no hay rol, solo mostrar elementos "ALL"
    return roles.includes('ALL') || roles.includes(userRole);
  };

  const handleSignOut = () => {
    signOut({ callbackUrl: '/auth/login' });
  };

  return (
    <div className="w-64 bg-white border-r border-slate-200 min-h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-slate-200">
        <div className="relative w-full h-12 bg-slate-900 rounded-lg flex items-center justify-center mb-2">
          <Image
            src="/images/LOGO-DynamicFin-white.png"
            alt="DynamicFin"
            fill
            className="object-contain p-2"
            priority
          />
        </div>
        <h1 className="text-sm font-semibold text-slate-600 text-center">
          Optimization Suite
        </h1>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-slate-200 bg-slate-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            {session?.user?.rol === 'DYNAMICFIN_ADMIN' ? (
              <Shield className="w-5 h-5 text-blue-600" />
            ) : (
              <UserCheck className="w-5 h-5 text-blue-600" />
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-slate-800">
              {session?.user?.nombre}
            </p>
            <p className="text-xs text-slate-500">
              {session?.user?.rol?.replace('_', ' ')}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navigationItems.map((item) => {
            if (!hasAccess(item.roles, session?.user?.rol)) return null;
            
            const isActive = pathname === item.href;
            const Icon = item.icon;
            
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                    isActive 
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {item.title}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Sign Out */}
      <div className="p-4 border-t border-slate-200">
        <Button
          onClick={handleSignOut}
          variant="ghost"
          className="w-full justify-start text-slate-600 hover:text-red-600 hover:bg-red-50"
        >
          <LogOut className="w-4 h-4 mr-3" />
          Cerrar Sesión
        </Button>
      </div>
    </div>
  );
}
