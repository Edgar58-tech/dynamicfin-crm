
'use client';

import { useSession } from 'next-auth/react';
import { Badge } from '@/components/ui/badge';
import { Bell, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export function Header() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <header className="bg-white border-b border-slate-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="h-6 bg-slate-200 rounded w-48 animate-pulse"></div>
            <div className="flex items-center space-x-4">
              <div className="h-8 w-8 bg-slate-200 rounded animate-pulse"></div>
              <div className="h-8 w-24 bg-slate-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </header>
    );
  }

  if (!session) {
    return null;
  }
  
  const getRoleBadgeColor = (rol?: string) => {
    switch (rol) {
      case 'DYNAMICFIN_ADMIN':
        return 'bg-purple-100 text-purple-800';
      case 'DIRECTOR_GENERAL':
        return 'bg-red-100 text-red-800';
      case 'DIRECTOR_MARCA':
        return 'bg-orange-100 text-orange-800';
      case 'GERENTE_GENERAL':
        return 'bg-blue-100 text-blue-800';
      case 'GERENTE_VENTAS':
        return 'bg-green-100 text-green-800';
      case 'VENDEDOR':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatRoleName = (rol?: string) => {
    if (!rol) return '';
    return rol.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const getContextInfo = () => {
    if (!session?.user) return '';
    
    // TODO: Implement with proper relations
    const { agenciaId, marcaId, grupoId } = session.user;
    
    if (agenciaId) return `Agencia ID: ${agenciaId}`;
    if (marcaId) return `Marca ID: ${marcaId}`;
    if (grupoId) return `Grupo ID: ${grupoId}`;
    
    return 'Sistema Global';
  };

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left side - Context info */}
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-800">
              Dashboard Automotriz
            </h2>
            <p className="text-sm text-slate-500">
              {getContextInfo()}
            </p>
          </div>
        </div>

        {/* Right side - Search, notifications, user info */}
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Buscar prospectos..."
              className="pl-10 w-64 bg-slate-50 border-slate-300"
            />
          </div>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </Button>

          {/* User info */}
          <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
            <div className="text-right">
              <p className="text-sm font-medium text-slate-800">
                {session?.user?.nombre} {session?.user?.apellido}
              </p>
              <Badge 
                variant="secondary" 
                className={cn('text-xs', getRoleBadgeColor(session?.user?.rol))}
              >
                {formatRoleName(session?.user?.rol)}
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}


