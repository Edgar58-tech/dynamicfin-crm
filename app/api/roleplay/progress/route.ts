
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const vendedorId = searchParams.get('vendedorId') || session.user.id;
    const mes = parseInt(searchParams.get('mes') || new Date().getMonth().toString()) + 1;
    const año = parseInt(searchParams.get('año') || new Date().getFullYear().toString());

    // Verificar permisos
    if (vendedorId !== session.user.id && 
        !['GERENTE_VENTAS', 'GERENTE_GENERAL', 'DIRECTOR_MARCA', 'DIRECTOR_GENERAL', 'DYNAMICFIN_ADMIN'].includes(session.user.rol)) {
      return NextResponse.json({ error: 'Sin permisos para ver progreso de otro vendedor' }, { status: 403 });
    }

    // Calcular progreso del mes actual
    const startOfMonth = new Date(año, mes - 1, 1);
    const endOfMonth = new Date(año, mes, 0, 23, 59, 59);

    const [sessions, evaluations, currentProgress] = await Promise.all([
      // Sesiones del mes
      prisma.rolePlaySession.findMany({
        where: {
          vendedorId,
          fechaInicio: {
            gte: startOfMonth,
            lte: endOfMonth
          }
        },
        include: {
          scenario: {
            select: {
              titulo: true,
              categoria: true,
              tipoCliente: true
            }
          }
        }
      }),

      // Evaluaciones del mes
      prisma.rolePlayEvaluation.findMany({
        where: {
          vendedorId,
          fechaEvaluacion: {
            gte: startOfMonth,
            lte: endOfMonth
          }
        }
      }),

      // Progreso existente
      prisma.rolePlayProgress.findUnique({
        where: {
          vendedorId_mes_año: {
            vendedorId,
            mes,
            año
          }
        }
      })
    ]);

    // Calcular estadísticas
    const totalSesiones = sessions.length;
    const sesionesCompletadas = sessions.filter(s => s.estadoSession === 'completada').length;
    const sesionesAbandonadas = sessions.filter(s => s.estadoSession === 'abandonada').length;
    const totalMinutos = sessions.reduce((acc, s) => acc + (s.duracionMinutos || 0), 0);
    const ventasSimuladas = sessions.filter(s => s.ventaLograda).length;
    const objetivosLogrados = sessions.filter(s => s.objetivoCumplido).length;

    const puntuacionPromedio = evaluations.length > 0
      ? evaluations.reduce((acc, e) => acc + Number(e.puntuacionGeneral), 0) / evaluations.length
      : 0;

    const puntuacionMejor = evaluations.length > 0
      ? Math.max(...evaluations.map(e => Number(e.puntuacionGeneral)))
      : 0;

    // Análisis por categoría de escenarios
    const escenariosPorCategoria = sessions.reduce((acc: any, session) => {
      const categoria = session.scenario.categoria;
      if (!acc[categoria]) {
        acc[categoria] = { total: 0, completadas: 0, puntuacionPromedio: 0, evaluaciones: 0 };
      }
      acc[categoria].total++;
      if (session.estadoSession === 'completada') {
        acc[categoria].completadas++;
      }
      return acc;
    }, {});

    // Agregar puntuaciones por categoría
    evaluations.forEach(evaluation => {
      const sessionData = sessions.find(s => s.id === evaluation.sessionId);
      if (sessionData) {
        const categoria = sessionData.scenario.categoria;
        if (escenariosPorCategoria[categoria]) {
          escenariosPorCategoria[categoria].puntuacionPromedio += Number(evaluation.puntuacionGeneral);
          escenariosPorCategoria[categoria].evaluaciones++;
        }
      }
    });

    // Calcular promedios finales
    Object.keys(escenariosPorCategoria).forEach(categoria => {
      const cat = escenariosPorCategoria[categoria];
      if (cat.evaluaciones > 0) {
        cat.puntuacionPromedio = cat.puntuacionPromedio / cat.evaluaciones;
      }
    });

    // Identificar fortalezas y debilidades
    const escenariosFuertes = Object.entries(escenariosPorCategoria)
      .filter(([_, data]: [string, any]) => data.puntuacionPromedio >= 80)
      .map(([categoria, _]) => categoria);

    const escenariosDebiles = Object.entries(escenariosPorCategoria)
      .filter(([_, data]: [string, any]) => data.puntuacionPromedio < 70 && data.puntuacionPromedio > 0)
      .map(([categoria, _]) => categoria);

    // Análisis de pilares SPCC
    const pilaresAnalisis = evaluations.reduce((acc: any, evaluation) => {
      const puntuaciones = JSON.parse(evaluation.puntuacionesPilares || '{}');
      Object.entries(puntuaciones).forEach(([pilar, puntuacion]: [string, any]) => {
        if (!acc[pilar]) {
          acc[pilar] = { total: 0, count: 0 };
        }
        acc[pilar].total += Number(puntuacion);
        acc[pilar].count++;
      });
      return acc;
    }, {});

    const pilaresFortaleza = Object.entries(pilaresAnalisis)
      .filter(([_, data]: [string, any]) => (data.total / data.count) >= 8.0)
      .map(([pilar, _]) => pilar);

    const pilaresOportunidad = Object.entries(pilaresAnalisis)
      .filter(([_, data]: [string, any]) => (data.total / data.count) < 7.0)
      .map(([pilar, _]) => pilar);

    // Calcular nivel actual
    let nivelActual = 'principiante';
    if (puntuacionPromedio >= 90) nivelActual = 'experto';
    else if (puntuacionPromedio >= 80) nivelActual = 'avanzado';
    else if (puntuacionPromedio >= 70) nivelActual = 'medio';

    // Calcular puntos de gamificación
    const puntosGameficacion = (currentProgress?.puntosGameficacion || 0) + 
      (sesionesCompletadas * 10) + 
      (ventasSimuladas * 25) + 
      (objetivosLogrados * 15);

    // Actualizar o crear progreso
    const progressData = {
      totalSesiones,
      totalMinutosEntrenados: totalMinutos,
      sesionesCompletadas,
      sesionesAbandonadas,
      promedioCompletitud: totalSesiones > 0 ? (sesionesCompletadas / totalSesiones) * 100 : 0,
      puntuacionPromedio,
      puntuacionMejor,
      escenariosFuertes: JSON.stringify(escenariosFuertes),
      escenariosDebiles: JSON.stringify(escenariosDebiles),
      pilaresFortaleza: JSON.stringify(pilaresFortaleza),
      pilaresOportunidad: JSON.stringify(pilaresOportunidad),
      objetivosLogrados,
      ventasSimuladas,
      tasaExitoSimulaciones: totalSesiones > 0 ? (ventasSimuladas / totalSesiones) * 100 : 0,
      tiempoPromedioSesion: totalSesiones > 0 ? totalMinutos / totalSesiones : 0,
      nivelActual,
      puntosGameficacion,
      ultimaActividad: new Date()
    };

    const progress = await prisma.rolePlayProgress.upsert({
      where: {
        vendedorId_mes_año: {
          vendedorId,
          mes,
          año
        }
      },
      update: progressData,
      create: {
        vendedorId,
        mes,
        año,
        ...progressData
      }
    });

    // Obtener progreso de meses anteriores para comparación
    const mesAnterior = mes === 1 ? { mes: 12, año: año - 1 } : { mes: mes - 1, año };
    const progressAnterior = await prisma.rolePlayProgress.findUnique({
      where: {
        vendedorId_mes_año: {
          vendedorId,
          mes: mesAnterior.mes,
          año: mesAnterior.año
        }
      }
    });

    const mejoraGeneral = progressAnterior && Number(progressAnterior.puntuacionPromedio) > 0
      ? ((Number(progress.puntuacionPromedio) - Number(progressAnterior.puntuacionPromedio)) / Number(progressAnterior.puntuacionPromedio)) * 100
      : 0;

    if (mejoraGeneral !== 0) {
      await prisma.rolePlayProgress.update({
        where: { id: progress.id },
        data: { mejoraGeneral }
      });
    }

    // Generar badges basados en logros
    const badges = [];
    if (sesionesCompletadas >= 5) badges.push('Practicante Constante');
    if (puntuacionPromedio >= 85) badges.push('Vendedor Elite');
    if (ventasSimuladas >= 3) badges.push('Cerrador Efectivo');
    if (totalMinutos >= 120) badges.push('Entrenamientos Intensivos');
    if (mejoraGeneral >= 10) badges.push('Mejora Continua');

    await prisma.rolePlayProgress.update({
      where: { id: progress.id },
      data: {
        badgesObtenidos: JSON.stringify(badges)
      }
    });

    return NextResponse.json({
      progress: {
        ...progressData,
        mejoraGeneral,
        badges,
        escenariosPorCategoria,
        pilaresAnalisis: Object.fromEntries(
          Object.entries(pilaresAnalisis).map(([pilar, data]: [string, any]) => [
            pilar,
            { promedio: data.total / data.count, evaluaciones: data.count }
          ])
        )
      },
      mes,
      año,
      fechaCalculado: new Date()
    });

  } catch (error) {
    console.error('Error calculating progress:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// Obtener progreso histórico
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const data = await request.json();
    const { vendedorId = session.user.id, meses = 6 } = data;

    // Verificar permisos
    if (vendedorId !== session.user.id && 
        !['GERENTE_VENTAS', 'GERENTE_GENERAL', 'DIRECTOR_MARCA', 'DIRECTOR_GENERAL', 'DYNAMICFIN_ADMIN'].includes(session.user.rol)) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
    }

    const progresses = await prisma.rolePlayProgress.findMany({
      where: { vendedorId },
      orderBy: [
        { año: 'desc' },
        { mes: 'desc' }
      ],
      take: meses
    });

    const historialFormatted = progresses.map(progress => ({
      mes: progress.mes,
      año: progress.año,
      totalSesiones: progress.totalSesiones,
      puntuacionPromedio: Number(progress.puntuacionPromedio),
      ventasSimuladas: progress.ventasSimuladas,
      nivelActual: progress.nivelActual,
      puntosGameficacion: progress.puntosGameficacion,
      mejoraGeneral: Number(progress.mejoraGeneral || 0),
      badges: JSON.parse(progress.badgesObtenidos || '[]')
    }));

    return NextResponse.json({
      historial: historialFormatted
    });

  } catch (error) {
    console.error('Error fetching progress history:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
