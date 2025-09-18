
// Dashboard Gerencial para monitorear Pendientes de Calificación
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { MonitoreoPendientesClient } from './_components/monitoreo-pendientes-client';

export default async function MonitoreoPendientesPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect('/auth/login');
  }

  // Solo gerentes pueden acceder
  if (!['GERENTE_VENTAS', 'GERENTE_GENERAL'].includes(session.user.rol)) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Monitoreo de Pendientes de Calificación
              </h1>
              <p className="text-gray-600">
                Supervisión y gestión de leads pendientes de calificación SPCC del equipo
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">
                Gerente de Ventas
              </div>
              <div className="font-semibold text-gray-900">
                {session.user.nombre} {session.user.apellido}
              </div>
            </div>
          </div>

          {/* Información del Sistema */}
          <div className="bg-purple-50 border-l-4 border-purple-400 p-4 rounded">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-purple-400 rounded-full mr-3"></div>
              <div className="text-sm text-purple-800">
                <strong>Vista Gerencial:</strong> Monitorea el rendimiento del equipo en la calificación de leads del Centro de Leads. 
                Identifica cuellos de botella y oportunidades de mejora.
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Cliente */}
        <MonitoreoPendientesClient 
          userRole={session.user.rol} 
          agenciaId={session.user.agenciaId}
        />
      </div>
    </div>
  );
}

export const metadata = {
  title: 'Monitoreo Pendientes - DynamicFin CRM',
  description: 'Dashboard gerencial para monitorear pendientes de calificación'
};
