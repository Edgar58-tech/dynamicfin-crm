
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import DashboardGerencialClient from './_components/dashboard-gerencial-client';

export const dynamic = 'force-dynamic';

export default async function DashboardGerencialPage() {
  const session = await getServerSession(authOptions);
  
  // Verificar autenticación
  if (!session?.user) {
    redirect('/auth/login');
  }
  
  // Verificar permisos gerenciales
  if (!['GERENTE_VENTAS', 'GERENTE_GENERAL', 'DIRECTOR_MARCA', 'DIRECTOR_GENERAL', 'DYNAMICFIN_ADMIN'].includes(session.user.rol)) {
    redirect('/dashboard');
  }

  return (
    <div className="space-y-8">
      {/* Header Principal */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">
            Dashboard Gerencial
          </h1>
          <p className="text-slate-600 mt-1">
            Visión ejecutiva en tiempo real • Última actualización: {new Date().toLocaleTimeString('es-ES')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-slate-600">Datos en tiempo real</span>
        </div>
      </div>

      {/* Dashboard Client Component */}
      <DashboardGerencialClient initialData={null} />
    </div>
  );
}
