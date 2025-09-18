
/**
 * API para análisis SPPC de transcripciones usando múltiples proveedores de IA
 * Analiza los 15 pilares del sistema SPPC y genera recomendaciones
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { smartChatCompletion, getTierConfig } from '@/lib/ai-router';
import { checkPaymentStatus, updateServiceUsage } from '@/lib/payment-guard';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

// Definición de los 15 pilares SPPC para el análisis
const PILARES_SPPC = [
  { id: 1, nombre: "Canal de Contacto e Intención Inicial", peso: 6 },
  { id: 2, nombre: "La Realidad Financiera", peso: 15 },
  { id: 3, nombre: "El 'Para Qué' Profundo", peso: 10 },
  { id: 4, nombre: "El Termómetro de la Urgencia", peso: 15 },
  { id: 5, nombre: "El Círculo de Decisión", peso: 7 },
  { id: 6, nombre: "Vehículo Inicial vs. Solución Ideal", peso: 2 },
  { id: 7, nombre: "Nivel de Conocimiento", peso: 2 },
  { id: 8, nombre: "La Moneda de Cambio (Auto a Cuenta)", peso: 9 },
  { id: 9, nombre: "Calidad de la Conversación", peso: 9 },
  { id: 10, nombre: "Historial y Barreras Previas", peso: 2 },
  { id: 11, nombre: "Cercanía a la Agencia", peso: 4 },
  { id: 12, nombre: "Lealtad a la Marca", peso: 8 },
  { id: 13, nombre: "Posesión de Múltiples Vehículos", peso: 4 },
  { id: 14, nombre: "Actitud del Prospecto", peso: 5 },
  { id: 15, nombre: "Círculo de Influencia", peso: 2 },
];

/**
 * Genera el prompt para análisis SPPC
 */
function generateSPPCAnalysisPrompt(transcripcion: string, prospectoInfo: any): string {
  return `
Eres un experto en análisis de ventas automotrices usando el sistema SPPC (Sistema de Perfilamiento y Potencial de Cliente).

INFORMACIÓN DEL PROSPECTO:
- Nombre: ${prospectoInfo.nombre} ${prospectoInfo.apellido || ''}
- Vehículo de interés: ${prospectoInfo.vehiculoInteres || 'No especificado'}

TRANSCRIPCIÓN DE LA CONVERSACIÓN:
${transcripcion}

INSTRUCCIONES:
Analiza la transcripción y califica cada uno de los 15 pilares SPPC del 0 al 100, donde:
- 0-20: Muy bajo/No aplicable
- 21-40: Bajo
- 41-60: Medio
- 61-80: Alto
- 81-100: Excelente

RESPONDE ÚNICAMENTE EN FORMATO JSON CON LA SIGUIENTE ESTRUCTURA:
{
  "analisisPilares": {
    "pilar1": { "puntuacion": 85, "justificacion": "El cliente visitó físicamente la agencia, mostrando alto compromiso inicial.", "evidencia": "Cita textual de la transcripción" },
    "pilar2": { "puntuacion": 70, "justificacion": "Mencionó presupuesto específico y capacidad de enganche.", "evidencia": "Cita textual de la transcripción" },
    ... (continúa para los 15 pilares)
  },
  "resumenGeneral": {
    "puntuacionTotal": 72,
    "clasificacion": "Prospecto Calificado",
    "sentimiento": "positivo",
    "palabrasClave": ["presupuesto", "familia", "urgencia", "financiamiento"],
    "momentosImportantes": [
      { "minuto": 2, "descripcion": "Cliente reveló presupuesto específico" },
      { "minuto": 5, "descripcion": "Mostró urgencia por cambio de vehículo" }
    ]
  },
  "objeciones": [
    { "tipo": "precio", "descripcion": "Preocupación por el costo total", "severidad": "media" }
  ],
  "recomendaciones": [
    "Preparar simulación de crédito con diferentes plazos",
    "Enfatizar características de seguridad para familia",
    "Agendar prueba de manejo dentro de 48 horas"
  ],
  "proximosPasos": [
    "Enviar cotización detallada por email",
    "Programar llamada de seguimiento en 2 días",
    "Preparar comparativo con modelos similares"
  ]
}

PILARES SPPC A EVALUAR:
1. Canal de Contacto e Intención Inicial (Peso: 6%) - Mide esfuerzo inicial del prospecto
2. La Realidad Financiera (Peso: 15%) - Factor crítico de viabilidad
3. El 'Para Qué' Profundo (Peso: 10%) - Necesidad real detrás de la compra
4. El Termómetro de la Urgencia (Peso: 15%) - Necesidad inmediata
5. El Círculo de Decisión (Peso: 7%) - Quién está involucrado en la decisión
6. Vehículo Inicial vs. Solución Ideal (Peso: 2%) - Flexibilidad del cliente
7. Nivel de Conocimiento (Peso: 2%) - Investigación previa del cliente
8. La Moneda de Cambio - Auto a Cuenta (Peso: 9%) - Vehículo actual
9. Calidad de la Conversación (Peso: 9%) - Nivel de interacción
10. Historial y Barreras Previas (Peso: 2%) - Experiencias pasadas
11. Cercanía a la Agencia (Peso: 4%) - Factor de conveniencia
12. Lealtad a la Marca (Peso: 8%) - Cliente recurrente
13. Posesión de Múltiples Vehículos (Peso: 4%) - Capacidad económica
14. Actitud del Prospecto (Peso: 5%) - Personalidad del cliente
15. Círculo de Influencia (Peso: 2%) - Potencial como embajador

Responde SOLO con el JSON válido, sin explicaciones adicionales.`;
}

/**
 * POST - Analizar transcripción con SPPC
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (session.user.rol !== 'VENDEDOR' && session.user.rol !== 'GERENTE_VENTAS') {
      return NextResponse.json({ error: 'Rol no autorizado' }, { status: 403 });
    }

    // Verificar estado de pago de la agencia
    if (!session.user.agenciaId) {
      return NextResponse.json(
        { error: 'Usuario no asociado a agencia' },
        { status: 400 }
      );
    }

    const paymentStatus = await checkPaymentStatus(session.user.agenciaId, 'analisis');
    if (!paymentStatus.canUseService) {
      return NextResponse.json(
        { 
          error: paymentStatus.reason,
          paymentStatus,
          code: 'PAYMENT_REQUIRED',
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { grabacionId, forceReanalysis = false } = body;

    if (!grabacionId) {
      return NextResponse.json(
        { error: 'ID de grabación requerido' },
        { status: 400 }
      );
    }

    // Verificar que la grabación pertenezca al vendedor o su agencia
    let whereClause: any = { id: parseInt(grabacionId) };
    
    if (session.user.rol === 'VENDEDOR') {
      whereClause.vendedorId = session.user.id;
    } else if (session.user.rol === 'GERENTE_VENTAS') {
      whereClause.vendedor = { agenciaId: session.user.agenciaId };
    }

    const grabacion = await prisma.grabacionConversacion.findFirst({
      where: whereClause,
      include: {
        prospecto: {
          select: {
            nombre: true,
            apellido: true,
            vehiculoInteres: true,
            calificacionTotal: true,
          },
        },
      },
    });

    if (!grabacion) {
      return NextResponse.json(
        { error: 'Grabación no encontrada o no autorizada' },
        { status: 404 }
      );
    }

    if (!grabacion.transcripcion || grabacion.transcripcion.trim().length === 0) {
      return NextResponse.json(
        { error: 'La grabación debe tener transcripción antes del análisis' },
        { status: 400 }
      );
    }

    if (grabacion.analisisPilaresSPPC && !forceReanalysis) {
      return NextResponse.json(
        { 
          error: 'La grabación ya tiene análisis SPPC',
          analisis: JSON.parse(grabacion.analisisPilaresSPPC),
        },
        { status: 400 }
      );
    }

    try {
      // Obtener tier de servicio de la agencia
      const agencia = await prisma.agencia.findUnique({
        where: { id: session.user.agenciaId },
        select: { tierServicio: true },
      });

      const tier = agencia?.tierServicio || 'BASICO';
      
      // Generar prompt para análisis SPPC
      const prompt = generateSPPCAnalysisPrompt(grabacion.transcripcion, grabacion.prospecto);
      
      // Realizar análisis con IA
      console.log(`Iniciando análisis SPPC con tier ${tier} para grabación ${grabacionId}`);
      
      const analysisResult = await smartChatCompletion(
        [
          {
            role: 'system',
            content: 'Eres un experto en análisis de ventas automotrices. Responde únicamente con JSON válido.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        tier,
        {
          temperature: 0.3, // Más determinista para análisis
          maxTokens: 4000,
        }
      );

      console.log(`Análisis completado. Provider: ${analysisResult.providerInfo.provider}, Costo: $${analysisResult.cost}`);

      // Parsear el resultado JSON
      let analisisData: any;
      try {
        analisisData = JSON.parse(analysisResult.content);
      } catch (parseError) {
        console.error('Error parseando JSON del análisis:', parseError);
        console.log('Contenido recibido:', analysisResult.content);
        
        // Intentar extraer JSON del contenido
        const jsonMatch = analysisResult.content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            analisisData = JSON.parse(jsonMatch[0]);
          } catch (secondParseError) {
            throw new Error('Respuesta de IA no contiene JSON válido');
          }
        } else {
          throw new Error('No se encontró JSON en la respuesta de IA');
        }
      }

      // Validar estructura del análisis
      if (!analisisData.analisisPilares || !analisisData.resumenGeneral) {
        throw new Error('Estructura de análisis inválida');
      }

      // Calcular puntuación total basada en pesos
      let puntuacionCalculada = 0;
      for (const pilar of PILARES_SPPC) {
        const pilarData = analisisData.analisisPilares[`pilar${pilar.id}`];
        if (pilarData && pilarData.puntuacion) {
          puntuacionCalculada += (pilarData.puntuacion * pilar.peso) / 100;
        }
      }

      // Actualizar puntuación en el análisis
      analisisData.resumenGeneral.puntuacionTotal = Math.round(puntuacionCalculada);

      // Determinar clasificación
      const clasificacion = puntuacionCalculada >= 85 ? 'Elite' :
                           puntuacionCalculada >= 65 ? 'Calificado' :
                           puntuacionCalculada >= 40 ? 'A Madurar' : 'Explorador';
      
      analisisData.resumenGeneral.clasificacion = clasificacion;

      // Actualizar grabación con análisis
      const updatedGrabacion = await prisma.grabacionConversacion.update({
        where: { id: parseInt(grabacionId) },
        data: {
          analisisPilaresSPPC: JSON.stringify(analisisData),
          costoAnalisis: analysisResult.cost,
          sentimientoGeneral: analisisData.resumenGeneral.sentimiento || 'neutro',
          scoreConversacion: analisisData.resumenGeneral.puntuacionTotal,
          palabrasClave: JSON.stringify(analisisData.resumenGeneral.palabrasClave || []),
          fechaProcesamiento: new Date(),
        },
      });

      // Actualizar calificación del prospecto si ha mejorado
      const puntuacionActual = Number(grabacion.prospecto.calificacionTotal) || 0;
      if (puntuacionCalculada > puntuacionActual) {
        await prisma.prospecto.update({
          where: { id: grabacion.prospectoId },
          data: {
            calificacionTotal: puntuacionCalculada,
            clasificacion,
          },
        });
      }

      // Actualizar costos de la agencia
      await updateServiceUsage(session.user.agenciaId, {
        grabacionesIncrement: 0,
        costoGrabacion: 0,
        costoTranscripcion: 0,
        costoAnalisis: analysisResult.cost,
      });

      return NextResponse.json({
        success: true,
        analisis: analisisData,
        grabacion: {
          ...updatedGrabacion,
          costoTranscripcion: updatedGrabacion.costoTranscripcion?.toNumber(),
          costoAnalisis: updatedGrabacion.costoAnalisis?.toNumber(),
          tamanoArchivo: updatedGrabacion.tamanoArchivo?.toString(),
        },
        metadata: {
          provider: analysisResult.providerInfo.provider,
          cost: analysisResult.cost,
          tier,
          puntuacionCalculada,
          clasificacion,
          prospectoActualizado: puntuacionCalculada > puntuacionActual,
        },
        paymentStatus,
      });

    } catch (analysisError) {
      console.error('Error en análisis SPPC:', analysisError);
      
      // Registrar error en la base de datos
      await prisma.grabacionConversacion.update({
        where: { id: parseInt(grabacionId) },
        data: {
          errorProcesamiento: `Error en análisis: ${analysisError instanceof Error ? analysisError.message : 'Unknown error'}`,
          fechaProcesamiento: new Date(),
        },
      });

      return NextResponse.json(
        { error: `Error en análisis SPPC: ${analysisError instanceof Error ? analysisError.message : 'Unknown error'}` },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error in analyze endpoint:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * GET - Obtener análisis SPPC existente
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const grabacionId = searchParams.get('grabacionId');

    if (!grabacionId) {
      return NextResponse.json(
        { error: 'ID de grabación requerido' },
        { status: 400 }
      );
    }

    // Verificar que la grabación pertenezca al vendedor o su agencia
    let whereClause: any = { id: parseInt(grabacionId) };
    
    if (session.user.rol === 'VENDEDOR') {
      whereClause.vendedorId = session.user.id;
    } else if (session.user.rol === 'GERENTE_VENTAS') {
      whereClause.vendedor = { agenciaId: session.user.agenciaId };
    }

    const grabacion = await prisma.grabacionConversacion.findFirst({
      where: whereClause,
      select: {
        id: true,
        analisisPilaresSPPC: true,
        costoAnalisis: true,
        sentimientoGeneral: true,
        scoreConversacion: true,
        palabrasClave: true,
        fechaProcesamiento: true,
        prospecto: {
          select: {
            nombre: true,
            apellido: true,
            vehiculoInteres: true,
          },
        },
      },
    });

    if (!grabacion) {
      return NextResponse.json(
        { error: 'Grabación no encontrada o no autorizada' },
        { status: 404 }
      );
    }

    const hasAnalysis = grabacion.analisisPilaresSPPC && grabacion.analisisPilaresSPPC.trim().length > 0;

    return NextResponse.json({
      grabacionId: grabacion.id,
      hasAnalysis,
      analisis: hasAnalysis && grabacion.analisisPilaresSPPC ? JSON.parse(grabacion.analisisPilaresSPPC) : null,
      metadata: {
        cost: grabacion.costoAnalisis?.toNumber() || 0,
        sentimiento: grabacion.sentimientoGeneral,
        score: grabacion.scoreConversacion,
        palabrasClave: grabacion.palabrasClave ? JSON.parse(grabacion.palabrasClave) : [],
        fechaProcesamiento: grabacion.fechaProcesamiento,
        prospecto: grabacion.prospecto,
      },
    });

  } catch (error) {
    console.error('Error getting analysis:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
