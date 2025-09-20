
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { CatalogoVendedoresClient } from './_components/catalogo-vendedores-client';

export default async function CatalogoVendedoresPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect('/auth/login');
  }

  // Solo gerentes pueden acceder a esta página
  if (!['GERENTE_VENTAS', 'GERENTE_GENERAL', 'DIRECTOR_GENERAL'].includes(session.user.rol)) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Catálogo de Vendedores
              </h1>
              <p className="text-gray-600">
                Gestión completa de vendedores: Alta, Modificación y Baja
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">
                {session.user.rol === 'GERENTE_VENTAS' ? 'Gerente de Ventas' : 
                 session.user.rol === 'GERENTE_GENERAL' ? 'Gerente General' : 'Director General'}
              </div>
              <div className="font-semibold text-gray-900">
                {session.user.nombre} {session.user.apellido}
              </div>
            </div>
          </div>

          {/* Indicador de Estado */}
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-gray-700">
                  Sistema de Gestión de Vendedores Activo
                </span>
              </div>
              <div className="text-xs text-gray-500">
                Permisos: {session.user.rol}
              </div>
            </div>
          </div>
        </div>

        {/* Componente Cliente */}
        <CatalogoVendedoresClient userRole={session.user.rol} />
      </div>
    </div>
  );
}

export const metadata = {
  title: 'Catálogo de Vendedores - DynamicFin CRM',
  description: 'Sistema de gestión completa de vendedores'
};
