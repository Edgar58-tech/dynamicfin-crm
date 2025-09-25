
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
    const categoria = searchParams.get('categoria');
    const prioridad = searchParams.get('prioridad');
    const estado = searchParams.get('estado');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Verificar permisos
    if (vendedorId !== session.user.id && 
        !['GERENTE_VENTAS', 'GERENTE_GENERAL', 'DIRECTOR_MARCA', 'DIRECTOR_GENERAL', 'DYNAMICFIN_ADMIN'].includes(session.user.rol)) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
    }

    const feedbacks = await prisma.rolePlayFeedback.findMany({
      where: {
        vendedorId,
        ...(categoria && { categoria }),
        ...(prioridad && { prioridad }),
        ...(estado && { estadoFeedback: estado })
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
      orderBy: [
        { prioridad: 'desc' },
        { fechaCreacion: 'desc' }
      ],
      take: limit,
      skip: offset
    });

    const feedbacksFormatted = feedbacks.map(feedback => ({
      id: feedback.id,
      sessionId: feedback.sessionId,
      tipoFeedback: feedback.tipoFeedback,
      categoria: feedback.categoria,
      momentoSession: feedback.momentoSession,
      feedbackTexto: feedback.feedbackTexto,
      sugerenciaMejora: feedback.sugerenciaMejora,
      ejemploMejorado: feedback.ejemploMejorado,
      recursosRecomendados: feedback.recursosRecomendados ? JSON.parse(feedback.recursosRecomendados) : [],
      prioridad: feedback.prioridad,
      implementado: feedback.implementado,
      utilidad: feedback.utilidad,
      estadoFeedback: feedback.estadoFeedback,
      fechaCreacion: feedback.fechaCreacion,
      fechaVisto: feedback.fechaVisto,
      scenario: feedback.session.scenario
    }));

    return NextResponse.json({
      feedbacks: feedbacksFormatted,
      total: feedbacks.length
    });

  } catch (error) {
    console.error('Error fetching feedback:', error);
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

    const data = await request.json();
    const { sessionId, generarFeedback } = data;

    if (!sessionId) {
      return NextResponse.json({ error: 'ID de sesión requerido' }, { status: 400 });
    }

    // Obtener la sesión y evaluación
    const rolePlaySession = await prisma.rolePlaySession.findUnique({
      where: { id: sessionId },
      include: {
        scenario: true,
        evaluations: {
          orderBy: { fechaEvaluacion: 'desc' },
          take: 1
        }
      }
    });

    if (!rolePlaySession) {
      return NextResponse.json({ error: 'Sesión no encontrada' }, { status: 404 });
    }

    const evaluation = rolePlaySession.evaluations[0];
    if (!evaluation) {
      return NextResponse.json({ error: 'No hay evaluación para esta sesión' }, { status: 404 });
    }

    if (generarFeedback) {
      // Generar feedback automático con IA
      const areasDeporMejora = JSON.parse(evaluation.areasDeporMejora || '[]');
      const puntuacionesPilares = JSON.parse(evaluation.puntuacionesPilares || '{}');
      
      const feedbackPrompt = `
Eres un mentor experto en ventas automotrices. Basándote en la evaluación de esta sesión de role play, genera feedback específico y accionable.

INFORMACIÓN DE LA EVALUACIÓN:
- Puntuación general: ${evaluation.puntuacionGeneral}/100
- Áreas de mejora identificadas: ${areasDeporMejora.join(', ')}
- Puntuaciones por área: ${JSON.stringify(puntuacionesPilares, null, 2)}
- Escenario: ${rolePlaySession.scenario.titulo}
- Tipo de cliente: ${rolePlaySession.scenario.tipoCliente}

Genera feedback específico y práctico en formato JSON:
{
  "feedbackItems": [
    {
      "categoria": "tecnicas_cierre|manejo_objeciones|rapport|conocimiento_producto|escucha_activa|presentacion",
      "tipoFeedback": "constructivo|corrective|sugerencia",
      "momentoSession": "inicio|desarrollo|cierre|general",
      "feedbackTexto": "Feedback específico sobre qué mejorar",
      "sugerenciaMejora": "Sugerencia específica y accionable",
      "ejemploMejorado": "Ejemplo concreto de cómo podría haberse manejado mejor",
      "recursosRecomendados": ["Recurso 1", "Recurso 2"],
      "prioridad": "alta|media|baja"
    }
  ]
}

Enfócate en los 3-5 aspectos más importantes a mejorar. Sé específico y práctico.
`;

      const messages = [
        { role: 'system', content: 'Eres un mentor experto en ventas que proporciona feedback constructivo y específico.' },
        { role: 'user', content: feedbackPrompt }
      ];

      const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.ABACUSAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4.1-mini',
          messages: messages,
          max_tokens: 1500,
          temperature: 0.4,
          response_format: { type: "json_object" }
        }),
      });

      if (!response.ok) {
        throw new Error(`Error en API: ${response.status}`);
      }

      const result = await response.json();
      const feedbackData = JSON.parse(result.choices[0].message.content);

      // Guardar cada item de feedback en la base de datos
      const createdFeedbacks = [];
      for (const item of feedbackData.feedbackItems) {
        const feedback = await prisma.rolePlayFeedback.create({
          data: {
            sessionId: rolePlaySession.id,
            vendedorId: rolePlaySession.vendedorId,
            tipoFeedback: item.tipoFeedback,
            categoria: item.categoria,
            momentoSession: item.momentoSession,
            feedbackTexto: item.feedbackTexto,
            sugerenciaMejora: item.sugerenciaMejora,
            ejemploMejorado: item.ejemploMejorado,
            recursosRecomendados: JSON.stringify(item.recursosRecomendados || []),
            prioridad: item.prioridad,
            feedbackGeneradoPor: 'ia_automatica',
            modeloIAUsado: 'gpt-4.1-mini',
            costoGeneracion: 0.03
          }
        });
        createdFeedbacks.push(feedback);
      }

      return NextResponse.json({
        message: 'Feedback generado exitosamente',
        feedbacks: createdFeedbacks.map(f => ({
          id: f.id,
          categoria: f.categoria,
          tipoFeedback: f.tipoFeedback,
          feedbackTexto: f.feedbackTexto,
          sugerenciaMejora: f.sugerenciaMejora,
          prioridad: f.prioridad
        }))
      });
    }

    return NextResponse.json({ message: 'Operación completada' });

  } catch (error) {
    console.error('Error generating feedback:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// Marcar feedback como visto/implementado
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const data = await request.json();
    const { feedbackId, accion, utilidad, notasImplementacion } = data;

    if (!feedbackId || !accion) {
      return NextResponse.json({ error: 'ID de feedback y acción requeridos' }, { status: 400 });
    }

    let updateData: any = {};

    switch (accion) {
      case 'marcar_visto':
        updateData = {
          estadoFeedback: 'visto',
          fechaVisto: new Date()
        };
        break;
      
      case 'marcar_implementado':
        updateData = {
          estadoFeedback: 'implementado',
          implementado: true,
          fechaImplementacion: new Date(),
          ...(utilidad && { utilidad }),
          ...(notasImplementacion && { notasImplementacion })
        };
        break;
      
      case 'archivar':
        updateData = {
          estadoFeedback: 'archivado',
          fechaArchivado: new Date()
        };
        break;
      
      default:
        return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
    }

    const feedback = await prisma.rolePlayFeedback.update({
      where: { id: feedbackId },
      data: updateData
    });

    return NextResponse.json({
      message: 'Feedback actualizado exitosamente',
      feedback: {
        id: feedback.id,
        estadoFeedback: feedback.estadoFeedback,
        implementado: feedback.implementado
      }
    });

  } catch (error) {
  console.error('Error updating feedback:', error);
  // Verificamos si 'error' es un objeto y tiene la propiedad 'code'
  if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2025') {
    return NextResponse.json({ error: 'Feedback no encontrado' }, { status: 404 });
  }
  return NextResponse.json(
    { error: 'Error interno del servidor' },
    { status: 500 }
  );
  }
}
