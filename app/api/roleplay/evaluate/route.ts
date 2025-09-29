
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { sessionId, ventaLograda } = await request.json();

    if (!sessionId) {
      return NextResponse.json({ error: 'ID de sesión requerido' }, { status: 400 });
    }

    // Obtener la sesión
    const roleplaySession = await prisma.rolePlaySession.findUnique({
      where: { id: sessionId },
      include: {
        scenario: true
      }
    });

    if (!roleplaySession) {
      return NextResponse.json({ error: 'Sesión no encontrada' }, { status: 404 });
    }

    const conversacion = roleplaySession.conversacion as any[];
    const duracion = Math.floor((new Date().getTime() - roleplaySession.fechaInicio.getTime()) / 1000 / 60); // en minutos

    // Generar evaluación simplificada
    const evaluacion = generarEvaluacion(conversacion, roleplaySession.scenario, ventaLograda);

    // Actualizar la sesión
    await prisma.rolePlaySession.update({
      where: { id: sessionId },
      data: {
        estado: 'COMPLETADA',
        fechaFinalizacion: new Date(),
        duracionMinutos: duracion,
        ventaLograda: ventaLograda || false
      }
    });

    // Crear registro de evaluación
    const nuevaEvaluacion = await prisma.rolePlayEvaluation.create({
      data: {
        sessionId: sessionId,
        usuarioId: session.user.id,
        puntuacionGeneral: evaluacion.puntuacionGeneral,
        puntuacionProspectacion: evaluacion.puntuacionProspectacion,
        puntuacionPresentacion: evaluacion.puntuacionPresentacion,
        puntuacionManejoObjeciones: evaluacion.puntuacionManejoObjeciones,
        puntuacionCierre: evaluacion.puntuacionCierre,
        ventaLograda: ventaLograda || false,
        feedback: evaluacion.feedback,
        recomendaciones: evaluacion.recomendaciones,
        fechaEvaluacion: new Date()
      }
    });

    return NextResponse.json({
      evaluation: {
        id: nuevaEvaluacion.id,
        ...evaluacion,
        duracionSesion: duracion,
        fechaEvaluacion: nuevaEvaluacion.fechaEvaluacion
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Error al evaluar sesión de roleplay:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limite = parseInt(searchParams.get('limit') || '10');

    const evaluaciones = await prisma.rolePlayEvaluation.findMany({
      where: {
        usuarioId: session.user.id
      },
      include: {
        session: {
          include: {
            scenario: {
              select: {
                titulo: true,
                categoria: true,
                tipoCliente: true
              }
            }
          }
        }
      },
      orderBy: {
        fechaEvaluacion: 'desc'
      },
      take: limite
    });

    return NextResponse.json({
      evaluaciones.map(evaluation => ({
        id: eval.id,
        scenario: {
          titulo: eval.session.scenario.titulo,
          categoria: eval.session.scenario.categoria,
          tipoCliente: eval.session.scenario.tipoCliente
        },
        puntuacionGeneral: eval.puntuacionGeneral,
        ventaLograda: eval.ventaLograda,
        duracionSesion: eval.session.duracionMinutos,
        fechaEvaluacion: eval.fechaEvaluacion.toISOString()
      }))
    }, { status: 200 });

  } catch (error) {
    console.error('Error al obtener evaluaciones:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

function generarEvaluacion(conversacion: any[], scenario: any, ventaLograda: boolean) {
  const mensajesVendedor = conversacion.filter(m => m.sender === 'vendedor');
  const totalMensajes = mensajesVendedor.length;

  // Puntuaciones base
  let puntuacionProspectacion = Math.min(85, 60 + (totalMensajes * 5));
  let puntuacionPresentacion = Math.min(90, 65 + (totalMensajes * 4));
  let puntuacionManejoObjeciones = Math.min(88, 70 + (totalMensajes * 3));
  let puntuacionCierre = ventaLograda ? 95 : Math.max(50, 70 - 10);

  // Ajustes por contenido de mensajes
  const contenidoTotal = mensajesVendedor.map(m => m.content.toLowerCase()).join(' ');
  
  if (contenidoTotal.includes('precio') || contenidoTotal.includes('financiamiento')) {
    puntuacionManejoObjeciones += 10;
  }
  
  if (contenidoTotal.includes('característica') || contenidoTotal.includes('beneficio')) {
    puntuacionPresentacion += 8;
  }

  const puntuacionGeneral = Math.round((puntuacionProspectacion + puntuacionPresentacion + puntuacionManejoObjeciones + puntuacionCierre) / 4);

  const feedback = [
    `Sesión completada con ${totalMensajes} intercambios.`,
    ventaLograda ? '¡Excelente! Lograste cerrar la venta.' : 'No se logró cerrar la venta, continúa practicando.',
    puntuacionGeneral >= 80 ? 'Muy buen desempeño general.' : 'Hay oportunidades de mejora en tu técnica.'
  ];

  const recomendaciones = [
    puntuacionProspectacion < 75 ? 'Mejora tus técnicas de prospección y calificación inicial.' : null,
    puntuacionPresentacion < 75 ? 'Enfócate más en presentar beneficios específicos del producto.' : null,
    puntuacionManejoObjeciones < 75 ? 'Practica más el manejo de objeciones comunes.' : null,
    puntuacionCierre < 75 ? 'Trabaja en tus técnicas de cierre de venta.' : null
  ].filter(Boolean);

  return {
    puntuacionGeneral,
    puntuacionProspectacion: Math.min(100, puntuacionProspectacion),
    puntuacionPresentacion: Math.min(100, puntuacionPresentacion),
    puntuacionManejoObjeciones: Math.min(100, puntuacionManejoObjeciones),
    puntuacionCierre: Math.min(100, puntuacionCierre),
    feedback: feedback.join(' '),
    recomendaciones: recomendaciones.join(' ')
  };
}
