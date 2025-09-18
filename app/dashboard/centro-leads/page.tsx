
// Dashboard principal del Centro de Leads
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { CentroLeadsClient } from './_components/centro-leads-client';

export default async function CentroLeadsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect('/auth/login');
  }

  // Solo roles de centro de leads pueden acceder
  if (!['CENTRO_LEADS', 'COORDINADOR_LEADS', 'GERENTE_VENTAS', 'GERENTE_GENERAL'].includes(session.user.rol)) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Centro de Leads
              </h1>
              <p className="text-gray-600">
                Recepción de llamadas entrantes y visitas de showroom
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">
                {session.user.rol === 'CENTRO_LEADS' ? 'Coordinador Centro Leads' : 'Coordinador Leads'}
              </div>
              <div className="font-semibold text-gray-900">
                {session.user.nombre} {session.user.apellido}
              </div>
            </div>
          </div>

          {/* Indicator de Acceso Limitado para CENTRO_LEADS */}
          {session.user.rol === 'CENTRO_LEADS' && (
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-blue-400 rounded-full mr-3"></div>
                <div className="text-sm text-blue-800">
                  <strong>Acceso Limitado:</strong> Solo captura y asignación de leads. 
                  Sin acceso al Sistema SPCC de calificación.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Dashboard Cliente */}
        <CentroLeadsClient userRole={session.user.rol} />
      </div>
    </div>
  );
}

export const metadata = {
  title: 'Centro de Leads - DynamicFin CRM',
  description: 'Centro de recepción de llamadas entrantes y visitas de showroom'
};
