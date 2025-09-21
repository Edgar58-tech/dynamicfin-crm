import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  validateGuardiaBalance,
  generateBalancedAssignment,
  applyGuardiaAssignment,
  getGuardiaStats,
  detectAndCreateBalanceAlerts,
} from '@/lib/guardia-balancer';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const agenciaId = parseInt(searchParams.get('agenciaId') || '0');
    const mes = parseInt(searchParams.get('mes') || new Date().getMonth() + 1 + '');
    const year = parseInt(searchParams.get('year') || new Date().getFullYear() + '');

    if (!agenciaId) {
      return NextResponse.json({ error: 'ID de agencia requerido' }, { status: 400 });
    }

    switch (action) {
      case 'validate':
        const validation = await validateGuardiaBalance(agenciaId, mes, year);
        return NextResponse.json({ success: true, validation });

      case 'generate':
        const assignment = await generateBalancedAssignment(agenciaId, mes, year);
        return NextResponse.json({ success: true, assignment });

      case 'stats':
        const stats = await getGuardiaStats(agenciaId, mes, year);
        return NextResponse.json({ success: true, stats });

      case 'detect-alerts':
        const alerts = await detectAndCreateBalanceAlerts(agenciaId);
        return NextResponse.json({ success: true, alerts });

      default:
        return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
    }

  } catch (error) {
    console.error('Error in guardia balance API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar que el usuario sea gerente
    if (!['GERENTE_GENERAL', 'GERENTE_VENTAS', 'DYNAMICFIN_ADMIN'].includes(session.user.rol)) {
      return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
    }

    const body = await request.json();
    const { action, agenciaId, assignments, observaciones } = body;

    if (!agenciaId) {
      return NextResponse.json({ error: 'ID de agencia requerido' }, { status: 400 });
    }

    switch (action) {
      case 'apply':
        if (!assignments || !Array.isArray(assignments)) {
          return NextResponse.json({ error: 'Asignaciones requeridas' }, { status: 400 });
        }

        const result = await applyGuardiaAssignment(
          agenciaId,
          assignments,
          session.user.id,
          observaciones
        );

        return NextResponse.json({ success: result.success, result });

      default:
        return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
    }

  } catch (error) {
    console.error('Error in guardia balance POST API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
