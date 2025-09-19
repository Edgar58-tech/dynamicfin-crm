
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const data = await request.json();
    const { sessionId } = data;

    if (!sessionId) {
      return NextResponse.json({ error: 'ID de sesión requerido' }, { status: 400 });
    }

    // Obtener la sesión y el escenario
    const rolePlaySession = await prisma.rolePlaySession.findUnique({
      where: { id: sessionId },
      include: {
        scenario: true
      }
    });

    if (!rolePlaySession) {
      return NextResponse.json({ error: 'Sesión no encontrada' }, { status: 404 });
    }

    const historialConversacion = rolePlaySession.conversacionCompleta 
      ? JSON.parse(rolePlaySession.conversacionCompleta)
      : [];

    // Construir prompt para evaluación
    const evaluationPrompt = `
Eres un experto en evaluación de técnicas de venta automotriz. Analiza la siguiente conversación de role play entre un vendedor y un cliente simulado.

INFORMACIÓN DEL ESCENARIO:
- Título: ${rolePlaySession.scenario.titulo}
- Tipo de cliente: ${rolePlaySession.scenario.tipoCliente}
- Categoría: ${rolePlaySession.scenario.categoria}
- Objetivos de aprendizaje: ${rolePlaySession.scenario.objetivosAprendizaje}

CONVERSACIÓN COMPLETA:
${historialConversacion.map((msg: any, index: number) => 
  `${index + 1}. ${msg.sender === 'vendedor' ? 'VENDEDOR' : 'CLIENTE'}: ${msg.content}`
).join('\n')}

CRITERIOS DE EVALUACIÓN (puntúa cada uno del 1-10):
1. **Rapport y Construcción de Relación**: ¿Qué tan bien estableció conexión con el cliente?
2. **Escucha Activa**: ¿Demostró que escuchaba y entendía las necesidades del cliente?
3. **Calidad de Preguntas**: ¿Hizo preguntas efectivas para calificar al cliente?
4. **Conocimiento del Producto**: ¿Demostró conocimiento apropiado de vehículos y características?
5. **Manejo de Objeciones**: ¿Manejó efectivamente las objeciones y dudas del cliente?
6. **Técnicas de Cierre**: ¿Intentó cerrar la venta de manera apropiada?
7. **Profesionalismo**: ¿Mantuvo un tono profesional y apropiado?
8. **Adaptabilidad**: ¿Se adaptó al tipo de cliente y sus necesidades específicas?

Responde ÚNICAMENTE en formato JSON con esta estructura exacta:
{
  "puntuacionGeneral": 85,
  "puntuaciones": {
    "rapportCliente": 8.5,
    "escuchActiva": 7.2,
    "calidadPreguntas": 8.0,
    "conocimientoProducto": 9.1,
    "manejoObjeciones": 7.5,
    "cierreEfectivo": 6.8,
    "profesionalismo": 9.0,
    "adaptabilidad": 8.3
  },
  "fortalezas": [
    "Excelente conocimiento del producto",
    "Muy buen rapport inicial con el cliente",
    "Mantuvo profesionalismo en todo momento"
  ],
  "areasDeporMejora": [
    "Necesita hacer más preguntas de calificación",
    "Puede mejorar las técnicas de cierre",
    "Debería manejar mejor la objeción de precio"
  ],
  "tecnicasUtilizadas": [
    "Preguntas abiertas",
    "Escucha activa",
    "Presentación de beneficios"
  ],
  "objecionesManejadas": [
    "Precio demasiado alto",
    "Necesito pensarlo"
  ],
  "objecionesFallidas": [
    "No abordó completamente la preocupación por la garantía"
  ],
  "recomendacionesEspecificas": [
    "Practica técnicas de cierre asumptivo",
    "Desarrolla mejores respuestas para objeciones de precio",
    "Incluye más preguntas sobre cronología de compra"
  ],
  "mejorMomento": "Cuando explicó los beneficios de seguridad del vehículo de manera detallada",
  "momentosMejorables": [
    "Cuando el cliente mencionó el precio, perdió oportunidad de investigar el presupuesto real",
    "No intentó un cierre cuando el cliente mostró interés en el financiamiento"
  ]
}
`;

    const messages = [
      { role: 'system', content: 'Eres un evaluador experto en ventas automotrices. Proporciona evaluaciones detalladas y constructivas.' },
      { role: 'user', content: evaluationPrompt }
    ];

    // Llamar a la API para evaluación
    const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ABACUSAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        messages: messages,
        max_tokens: 2000,
        temperature: 0.3,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      throw new Error(`Error en API: ${response.status}`);
    }

    const result = await response.json();
    const evaluationResult = JSON.parse(result.choices[0].message.content);

    // Guardar evaluación en base de datos
    const evaluation = await prisma.rolePlayEvaluation.create({
      data: {
        sessionId: rolePlaySession.id,
        vendedorId: rolePlaySession.vendedorId,
        tipoEvaluacion: 'automatica_ia',
        puntuacionGeneral: evaluationResult.puntuacionGeneral,
        puntuacionesPilares: JSON.stringify(evaluationResult.puntuaciones),
        fortalezasDetectadas: JSON.stringify(evaluationResult.fortalezas),
        areasDeporMejora: JSON.stringify(evaluationResult.areasDeporMejora),
        tecnicasUtilizadas: JSON.stringify(evaluationResult.tecnicasUtilizadas),
        objecionesManejadas: JSON.stringify(evaluationResult.objecionesManejadas),
        objecionesFallidas: JSON.stringify(evaluationResult.objecionesFallidas),
        rapportCliente: evaluationResult.puntuaciones?.rapportCliente || null,
        escuchActiva: evaluationResult.puntuaciones?.escuchActiva || null,
        calidadPreguntas: evaluationResult.puntuaciones?.calidadPreguntas || null,
        conocimientoProducto: evaluationResult.puntuaciones?.conocimientoProducto || null,
        manejoObjeciones: evaluationResult.puntuaciones?.manejoObjeciones || null,
        cierreEfectivo: evaluationResult.puntuaciones?.cierreEfectivo || null,
        profesionalismo: evaluationResult.puntuaciones?.profesionalismo || null,
        adaptabilidad: evaluationResult.puntuaciones?.adaptabilidad || null,
        analisisIA: JSON.stringify({
          mejorMomento: evaluationResult.mejorMomento,
          momentosMejorables: evaluationResult.momentosMejorables,
          evaluacionCompleta: evaluationResult
        }),
        recomendacionesIA: JSON.stringify(evaluationResult.recomendacionesEspecificas),
        modeloIAEvaluador: 'gpt-4.1-mini',
        costoEvaluacion: 0.05 // Costo estimado
      }
    });

    // Actualizar puntuación promedio del escenario
    const scenarioStats = await prisma.rolePlayEvaluation.aggregate({
      where: {
        session: {
          scenarioId: rolePlaySession.scenarioId
        }
      },
      _avg: {
        puntuacionGeneral: true
      }
    });

    if (scenarioStats._avg.puntuacionGeneral) {
      await prisma.rolePlayScenario.update({
        where: { id: rolePlaySession.scenarioId },
        data: {
          puntuacionPromedio: scenarioStats._avg.puntuacionGeneral
        }
      });
    }

    return NextResponse.json({
      message: 'Evaluación completada exitosamente',
      evaluation: {
        id: evaluation.id,
        puntuacionGeneral: Number(evaluation.puntuacionGeneral),
        puntuaciones: evaluationResult.puntuaciones,
        fortalezas: evaluationResult.fortalezas,
        areasDeporMejora: evaluationResult.areasDeporMejora,
        recomendaciones: evaluationResult.recomendacionesEspecificas,
        mejorMomento: evaluationResult.mejorMomento,
        momentosMejorables: evaluationResult.momentosMejorables
      }
    });

  } catch (error) {
    console.error('Error in evaluation:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// Obtener evaluaciones de un vendedor
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const vendedorId = searchParams.get('vendedorId') || session.user.id;
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Verificar permisos
    if (vendedorId !== session.user.id && 
        !['GERENTE_VENTAS', 'GERENTE_GENERAL', 'DIRECTOR_MARCA', 'DIRECTOR_GENERAL', 'DYNAMICFIN_ADMIN'].includes(session.user.rol)) {
      return NextResponse.json({ error: 'Sin permisos para ver evaluaciones de otro vendedor' }, { status: 403 });
    }

    const evaluations = await prisma.rolePlayEvaluation.findMany({
      where: { vendedorId },
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
      orderBy: { fechaEvaluacion: 'desc' },
      take: limit,
      skip: offset
    });

    const evaluationsFormatted = evaluations.map(evaluation => ({
      id: evaluation.id,
      sessionId: evaluation.sessionId,
      puntuacionGeneral: Number(evaluation.puntuacionGeneral),
      puntuacionesPilares: JSON.parse(evaluation.puntuacionesPilares || '{}'),
      fortalezas: JSON.parse(evaluation.fortalezasDetectadas || '[]'),
      areasDeporMejora: JSON.parse(evaluation.areasDeporMejora || '[]'),
      recomendaciones: JSON.parse(evaluation.recomendacionesIA || '[]'),
      fechaEvaluacion: evaluation.fechaEvaluacion,
      scenario: evaluation.session.scenario,
      duracionSesion: evaluation.session.duracionMinutos
    }));

    return NextResponse.json({
      evaluations: evaluationsFormatted,
      total: evaluations.length
    });

  } catch (error) {
    console.error('Error fetching evaluations:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
