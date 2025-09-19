
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import ProximityDashboardClient from './_components/proximity-dashboard-client';

export const metadata = {
  title: 'Grabación por Proximidad - DynamicFin CRM',
  description: 'Sistema automático de grabación por proximidad geográfica',
};

export default async function ProximityPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/login');
  }

  // Solo vendedores y gerentes pueden acceder
  if (!['VENDEDOR', 'GERENTE_VENTAS', 'GERENTE_GENERAL'].includes(session.user.rol)) {
    redirect('/dashboard');
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Grabación por Proximidad</h1>
        <p className="mt-2 text-gray-600">
          Sistema automático de detección y grabación basado en ubicación geográfica
        </p>
      </div>

      <ProximityDashboardClient />
    </div>
  );
}

