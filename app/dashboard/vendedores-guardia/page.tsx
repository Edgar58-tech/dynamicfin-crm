
// Dashboard para definición diaria de vendedores de guardia
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { VendedoresGuardiaClient } from './_components/vendedores-guardia-client';

export default async function VendedoresGuardiaPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect('/auth/login');
  }

  // Solo gerentes pueden acceder a esta página
  if (!['GERENTE_VENTAS', 'GERENTE_GENERAL'].includes(session.user.rol)) {
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
                Sistema de Vendedores de Guardia
              </h1>
              <p className="text-gray-600">
                Defina los vendedores de guardia diarios para asignación automática de leads
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Gerente de Ventas</div>
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
                  Sistema de Centro de Leads Activo
                </span>
              </div>
              <div className="text-xs text-gray-500">
                Reset automático: 7:00 AM | Recordatorio: 9:30 AM
              </div>
            </div>
          </div>
        </div>

        {/* Componente Cliente */}
        <VendedoresGuardiaClient />
      </div>
    </div>
  );
}

export const metadata = {
  title: 'Vendedores de Guardia - DynamicFin CRM',
  description: 'Sistema de gestión de vendedores de guardia diario'
};
