
// Dashboard de Leads Pendientes de Calificación para Vendedores
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { PendientesCalificacionClient } from './_components/pendientes-calificacion-client';

export default async function PendientesCalificacionPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect('/auth/login');
  }

  // Solo vendedores y gerentes pueden acceder
  if (!['VENDEDOR', 'GERENTE_VENTAS', 'GERENTE_GENERAL'].includes(session.user.rol)) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Pendientes de Calificación
              </h1>
              <p className="text-gray-600">
                Leads asignados por el Centro de Leads que requieren calificación SPCC
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">
                {session.user.rol === 'VENDEDOR' ? 'Vendedor' : 'Gerente de Ventas'}
              </div>
              <div className="font-semibold text-gray-900">
                {session.user.nombre} {session.user.apellido}
              </div>
            </div>
          </div>

          {/* Información de Proceso */}
          <div className="bg-orange-50 border-l-4 border-orange-400 p-4 rounded">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-orange-400 rounded-full mr-3"></div>
              <div className="text-sm text-orange-800">
                <strong>Proceso:</strong> Estos leads fueron capturados por el Centro de Leads y requieren 
                completar la calificación SPCC antes de ingresar al pipeline de ventas normal.
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Cliente */}
        <PendientesCalificacionClient 
          userRole={session.user.rol} 
          userId={session.user.id}
        />
      </div>
    </div>
  );
}

export const metadata = {
  title: 'Pendientes de Calificación - DynamicFin CRM',
  description: 'Leads del Centro de Leads pendientes de calificación SPCC'
};
