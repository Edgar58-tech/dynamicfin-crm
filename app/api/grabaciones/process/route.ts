
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { downloadFile } from '@/lib/s3';

export const dynamic = 'force-dynamic';

interface TranscriptionResult {
  text: string;
  duration: number;
  language: string;
  confidence: number;
}

interface AnalysisResult {
  spcc_analysis: {
    pilares_detectados: { [key: string]: number };
    insights_clave: string[];
    recomendaciones: string[];
  };
  sentiment: {
    overall: 'positive' | 'neutral' | 'negative';
    score: number;
  };
  keywords: string[];
  quality_score: number;
  cliente_satisfaccion: number;
}

export async function POST(request: NextRequest) {
  try {
    const { grabacionId } = await request.json();

    if (!grabacionId) {
      return NextResponse.json({ error: 'ID de grabación requerido' }, { status: 400 });
    }

    // Obtener grabación
    const grabacion = await prisma.grabacionConversacion.findUnique({
      where: { id: grabacionId },
      include: {
        prospecto: {
          include: {
            calificaciones: {
              include: {
                pilar: true
              }
            }
          }
        },
        vendedor: {
          select: { nombre: true, apellido: true }
        }
      }
    });

    if (!grabacion) {
      return NextResponse.json({ error: 'Grabación no encontrada' }, { status: 404 });
    }

    if (grabacion.procesado) {
      return NextResponse.json({ 
        message: 'Grabación ya procesada', 
        transcripcion: grabacion.transcripcion,
        analisis: grabacion.analisisIA 
      });
    }

    // Obtener URL del archivo de audio
    const audioUrl = await downloadFile(grabacion.rutaArchivo!);

    // PASO 1: Transcripción con Whisper
    console.log(`Iniciando transcripción para grabación ${grabacionId}`);
    const transcriptionResult = await transcribeAudio(audioUrl);

    if (!transcriptionResult.success) {
      throw new Error(`Error en transcripción: ${transcriptionResult.error}`);
    }

    // PASO 2: Análisis con IA
    console.log(`Iniciando análisis IA para grabación ${grabacionId}`);
    const analysisResult = await analyzeTranscription(
      transcriptionResult.transcription!,
      grabacion.prospecto,
      grabacion.vendedor
    );

    if (!analysisResult.success) {
      throw new Error(`Error en análisis: ${analysisResult.error}`);
    }

    // PASO 3: Calcular costos
    const costoTranscripcion = calculateTranscriptionCost(grabacion.duracion);
    const costoAnalisis = calculateAnalysisCost(transcriptionResult.transcription!.length);

    // PASO 4: Actualizar base de datos
    const grabacionActualizada = await prisma.grabacionConversacion.update({
      where: { id: grabacionId },
      data: {
        transcripcion: transcriptionResult.transcription,
        analisisIA: JSON.stringify(analysisResult.analysis),
        analisisPilaresSPPC: JSON.stringify(analysisResult.analysis!.spcc_analysis),
        proveedorIA: 'abacus-ai',
        costoTranscripcion: costoTranscripcion,
        costoAnalisis: costoAnalisis,
        fechaProcesamiento: new Date(),
        procesado: true,
        calidad: determineQuality(grabacion.duracion, analysisResult.analysis!.quality_score),
        palabrasClave: JSON.stringify(analysisResult.analysis!.keywords),
        sentimientoGeneral: analysisResult.analysis!.sentiment.overall,
        scoreConversacion: Math.round(analysisResult.analysis!.quality_score)
      }
    });

    // PASO 5: Actualizar calificaciones SPCC si se detectaron insights
    if (analysisResult.analysis?.spcc_analysis.pilares_detectados) {
      await updateSPCCFromAnalysis(
        grabacion.prospectoId,
        analysisResult.analysis.spcc_analysis.pilares_detectados
      );
    }

    console.log(`Procesamiento completo para grabación ${grabacionId}`);

    return NextResponse.json({
      success: true,
      grabacion: {
        id: grabacionActualizada.id,
        transcripcion: grabacionActualizada.transcripcion,
        duracion: grabacionActualizada.duracion,
        calidad: grabacionActualizada.calidad,
        sentimiento: grabacionActualizada.sentimientoGeneral,
        score: grabacionActualizada.scoreConversacion,
        palabrasClave: JSON.parse(grabacionActualizada.palabrasClave || '[]'),
        fechaProcesamiento: grabacionActualizada.fechaProcesamiento
      },
      analisis: analysisResult.analysis,
      costos: {
        transcripcion: costoTranscripcion,
        analisis: costoAnalisis,
        total: costoTranscripcion + costoAnalisis
      }
    });

  } catch (error: any) {
    console.error('Error procesando grabación:', error);

    // Actualizar grabación con error
    if (request.body) {
      try {
        const { grabacionId } = await request.json();
        await prisma.grabacionConversacion.update({
          where: { id: grabacionId },
          data: {
            errorProcesamiento: error.message,
            fechaProcesamiento: new Date()
          }
        });
      } catch (dbError) {
        console.error('Error actualizando grabación con error:', dbError);
      }
    }

    return NextResponse.json({
      error: 'Error procesando grabación',
      details: error.message
    }, { status: 500 });
  }
}

async function transcribeAudio(audioUrl: string): Promise<{
  success: boolean;
  transcription?: string;
  duration?: number;
  error?: string;
}> {
  try {
    // Descargar archivo de audio
    const audioResponse = await fetch(audioUrl);
    if (!audioResponse.ok) {
      throw new Error('No se pudo descargar el archivo de audio');
    }

    const audioBuffer = await audioResponse.arrayBuffer();
    const audioBase64 = Buffer.from(audioBuffer).toString('base64');

    // Transcribir con IA
    const transcriptionPrompt = `
Transcribe el siguiente archivo de audio de una conversación de ventas automotrices. 
El audio está en formato base64. Proporciona una transcripción limpia y precisa.

Responde en formato JSON:
{
  "transcription": "transcripción completa aquí",
  "language": "es",
  "confidence": 0.95,
  "duration_seconds": 120
}
`;

    const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ABACUSAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: transcriptionPrompt },
              { 
                type: 'file', 
                file: { 
                  filename: 'audio.webm', 
                  file_data: `data:audio/webm;base64,${audioBase64}` 
                }
              }
            ]
          }
        ],
        temperature: 0.1,
        max_tokens: 2000,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      throw new Error(`API de transcripción falló: ${response.status}`);
    }

    const result = await response.json();
    const transcriptionData = JSON.parse(result.choices[0].message.content);

    return {
      success: true,
      transcription: transcriptionData.transcription,
      duration: transcriptionData.duration_seconds
    };

  } catch (error: any) {
    console.error('Error en transcripción:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

async function analyzeTranscription(
  transcripcion: string,
  prospecto: any,
  vendedor: any
): Promise<{
  success: boolean;
  analysis?: AnalysisResult;
  error?: string;
}> {
  try {
    const analysisPrompt = `
Eres un experto en análisis de conversaciones de ventas automotrices y evaluación SPCC.

INFORMACIÓN DEL CONTEXTO:
- Cliente: ${prospecto.nombre} ${prospecto.apellido}
- Vendedor: ${vendedor.nombre} ${vendedor.apellido}
- Vehículo de interés: ${prospecto.vehiculoInteres}
- Presupuesto: $${prospecto.presupuesto || 'No especificado'}
- Clasificación actual: ${prospecto.clasificacion}

TRANSCRIPCIÓN DE LA CONVERSACIÓN:
"${transcripcion}"

PILARES SPCC PARA ANALIZAR:
1. Capacidad Económica - ¿Qué tan sólida es financieramente?
2. Urgencia de Compra - ¿Cuándo necesita el vehículo?
3. Autoridad de Compra - ¿Es quien decide?
4. Vehículo Actual - ¿Qué maneja actualmente?
5. Necesidades Específicas - ¿Qué busca exactamente?
6. Proceso de Investigación - ¿Ha comparado opciones?
7. Sensibilidad al Precio - ¿Qué tan flexible es?
8. Confianza en la Marca - ¿Confía en nosotros?
9. Objeciones Identificadas - ¿Qué le preocupa?
10. Timing de Compra - ¿Cuándo comprará?

Analiza la conversación y responde ÚNICAMENTE en formato JSON:

{
  "spcc_analysis": {
    "pilares_detectados": {
      "capacidad_economica": 75,
      "urgencia_compra": 60,
      "autoridad_compra": 80,
      ... (etc para cada pilar detectado, escala 1-100)
    },
    "insights_clave": [
      "Cliente mencionó presupuesto específico",
      "Muestra urgencia por reemplazo de vehículo actual",
      "Necesita aprobación de cónyuge"
    ],
    "recomendaciones": [
      "Programar segunda cita incluyendo al cónyuge",
      "Preparar opciones de financiamiento",
      "Enviar información detallada por email"
    ]
  },
  "sentiment": {
    "overall": "positive",
    "score": 0.75
  },
  "keywords": ["financiamiento", "test drive", "garantía", "precio"],
  "quality_score": 85,
  "cliente_satisfaccion": 80
}

Responde únicamente con JSON limpio, sin markdown ni explicaciones.`;

    const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ABACUSAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        messages: [{ role: 'user', content: analysisPrompt }],
        temperature: 0.3,
        max_tokens: 2000,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      throw new Error(`API de análisis falló: ${response.status}`);
    }

    const result = await response.json();
    const analysis = JSON.parse(result.choices[0].message.content);

    return {
      success: true,
      analysis
    };

  } catch (error: any) {
    console.error('Error en análisis:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

async function updateSPCCFromAnalysis(prospectoId: number, pilaresDetectados: { [key: string]: number }) {
  try {
    // Mapear nombres de pilares a IDs
    const pilares = await prisma.pilar.findMany({
      where: { activo: true }
    });

    const updates = [];

    for (const [pilarNombre, puntaje] of Object.entries(pilaresDetectados)) {
      const pilar = pilares.find(p => 
        p.nombrePilar.toLowerCase().includes(pilarNombre.replace('_', ' ').toLowerCase())
      );

      if (pilar && puntaje > 0) {
        updates.push(
          prisma.calificacion.upsert({
            where: {
              prospectoId_pilarId: {
                prospectoId,
                pilarId: pilar.id
              }
            },
            update: {
              puntajeObtenido: Math.round(puntaje),
              notas: `Actualizado automáticamente desde análisis de grabación - ${new Date().toLocaleDateString()}`,
              updatedAt: new Date()
            },
            create: {
              prospectoId,
              pilarId: pilar.id,
              puntajeObtenido: Math.round(puntaje),
              notas: `Evaluado automáticamente desde grabación - ${new Date().toLocaleDateString()}`
            }
          })
        );
      }
    }

    if (updates.length > 0) {
      await Promise.all(updates);
      
      // Recalcular puntaje total del prospecto
      const todasCalificaciones = await prisma.calificacion.findMany({
        where: { prospectoId },
        include: { pilar: true }
      });

      const puntajeTotal = todasCalificaciones.reduce((total, cal) => {
        return total + (cal.puntajeObtenido * Number(cal.pilar.pesoEstrategico));
      }, 0);

      let nuevaClasificacion = '';
      if (puntajeTotal >= 85) nuevaClasificacion = 'Elite';
      else if (puntajeTotal >= 70) nuevaClasificacion = 'Calificado';
      else if (puntajeTotal >= 50) nuevaClasificacion = 'A Madurar';
      else nuevaClasificacion = 'Explorador';

      await prisma.prospecto.update({
        where: { id: prospectoId },
        data: {
          calificacionTotal: puntajeTotal,
          clasificacion: nuevaClasificacion
        }
      });

      console.log(`SPCC actualizado para prospecto ${prospectoId}: ${puntajeTotal.toFixed(2)} (${nuevaClasificacion})`);
    }

  } catch (error) {
    console.error('Error actualizando SPCC desde análisis:', error);
  }
}

function calculateTranscriptionCost(durationSeconds: number): number {
  // $0.006 por minuto según OpenAI Whisper pricing
  const minutes = Math.ceil(durationSeconds / 60);
  return minutes * 0.006;
}

function calculateAnalysisCost(textLength: number): number {
  // Aproximadamente $0.03 por 1K tokens de input + $0.06 por 1K de output
  const estimatedInputTokens = Math.ceil(textLength / 4); // ~4 chars per token
  const estimatedOutputTokens = 500; // Análisis típico
  
  const inputCost = (estimatedInputTokens / 1000) * 0.03;
  const outputCost = (estimatedOutputTokens / 1000) * 0.06;
  
  return inputCost + outputCost;
}

function determineQuality(durationSeconds: number, qualityScore: number): string {
  if (durationSeconds < 30) return 'MALA';
  if (qualityScore >= 80) return 'EXCELENTE';
  if (qualityScore >= 60) return 'BUENA';
  if (qualityScore >= 40) return 'REGULAR';
  return 'MALA';
}
