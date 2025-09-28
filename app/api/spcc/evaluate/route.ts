
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface EvaluationResult {
  scores: { [key: number]: number };
  notes: { [key: number]: string };
  vendor?: string;
}

interface SPCCEvaluationData {
  prospectoId: number;
  interaccionData?: {
    transcripcion?: string;
    notas?: string;
    duracion?: number;
    tipoContacto?: string;
  };
  manualInput?: {
    capacidadEconomica?: number;
    urgenciaCompra?: number;
    autoridadCompra?: number;
    vehiculoActual?: string;
    presupuesto?: number;
    tiempoCompra?: string;
  };
  mode?: 'automatic' | 'manual' | 'hybrid';
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const data: SPCCEvaluationData = await request.json();
    
    if (!data.prospectoId) {
      return NextResponse.json({ error: 'ID de prospecto requerido' }, { status: 400 });
    }

    // Obtener prospecto con calificaciones existentes
    const prospecto = await prisma.prospecto.findUnique({
      where: { id: data.prospectoId },
      include: {
        calificaciones: {
          include: {
            pilar: true
          }
        },
        vendedor: {
          select: { nombre: true, apellido: true }
        },
        agencia: {
          select: { nombreAgencia: true }
        }
      }
    });

    if (!prospecto) {
      return NextResponse.json({ error: 'Prospecto no encontrado' }, { status: 404 });
    }

    // Obtener pilares SPCC
    const pilares = await prisma.pilar.findMany({
      where: { activo: true },
      orderBy: [{ faseEvaluacion: 'asc' }, { id: 'asc' }]
    });

    let evaluationResults: any = {};
    
    if (data.mode === 'automatic' && data.interaccionData?.transcripcion) {
      // Evaluación automática con IA
      evaluationResults = await evaluateWithAI(
        data.interaccionData.transcripcion,
        pilares,
        prospecto
      );
    } else if (data.mode === 'manual' && data.manualInput) {
      // Evaluación manual
      evaluationResults = await evaluateManually(data.manualInput, pilares);
    } else {
      // Evaluación híbrida
      evaluationResults = await evaluateHybrid(data, pilares, prospecto);
    }

    // Guardar/actualizar calificaciones
    const calificacionesUpdateadas = [];
    
    for (const pilar of pilares) {
      const puntaje = evaluationResults.scores[pilar.id] || 0;
      const notas = evaluationResults.notes[pilar.id] || '';

      const calificacion = await prisma.calificacion.upsert({
        where: {
          prospectoId_pilarId: {
            prospectoId: data.prospectoId,
            pilarId: pilar.id
          }
        },
        update: {
          puntajeObtenido: Math.round(puntaje),
          notas: notas,
          updatedAt: new Date()
        },
        create: {
          prospectoId: data.prospectoId,
          pilarId: pilar.id,
          puntajeObtenido: Math.round(puntaje),
          notas: notas
        }
      });

      calificacionesUpdateadas.push({
        pilar: pilar.nombrePilar,
        puntaje: calificacion.puntajeObtenido,
        peso: Number(pilar.pesoEstrategico),
        fase: pilar.faseEvaluacion,
        notas: calificacion.notas
      });
    }

    // Calcular puntaje total SPCC
    const puntajeTotal = calificacionesUpdateadas.reduce((total, cal) => {
      return total + (cal.puntaje * cal.peso);
    }, 0);

    // Determinar clasificación
    let clasificacion = '';
    if (puntajeTotal >= 85) clasificacion = 'Elite';
    else if (puntajeTotal >= 70) clasificacion = 'Calificado';
    else if (puntajeTotal >= 50) clasificacion = 'A Madurar';
    else clasificacion = 'Explorador';

    // Actualizar prospecto
    const prospectoActualizado = await prisma.prospecto.update({
      where: { id: data.prospectoId },
      data: {
        calificacionTotal: puntajeTotal,
        clasificacion: clasificacion,
        estatus: puntajeTotal >= 70 ? 'Calificado' : 'Contactado'
      }
    });

    return NextResponse.json({
      success: true,
      prospecto: {
        id: prospectoActualizado.id,
        nombre: prospectoActualizado.nombre,
        apellido: prospectoActualizado.apellido,
        calificacionTotal: Number(prospectoActualizado.calificacionTotal),
        clasificacion: prospectoActualizado.clasificacion,
        estatus: prospectoActualizado.estatus
      },
      evaluacion: {
        puntajeTotal: puntajeTotal,
        clasificacion: clasificacion,
        calificacionesPorPilar: calificacionesUpdateadas,
        recomendaciones: generateRecommendations(puntajeTotal, calificacionesUpdateadas),
        proximosHacer: generateNextSteps(clasificacion, calificacionesUpdateadas),
        procesamiento: {
          mode: data.mode,
          timestamp: new Date().toISOString(),
          vendor: evaluationResults.vendor || 'manual'
        }
      }
    });

  } catch (error: any) {
    console.error('Error en evaluación SPCC:', error);
    return NextResponse.json({
      error: 'Error interno del servidor',
      details: error.message
    }, { status: 500 });
  }
}

async function evaluateWithAI(transcripcion: string, pilares: any[], prospecto: any) {
  try {
    const prompt = `
Eres un experto en evaluación SPCC (Sistema de Perfilamiento y Potencial de Cliente) para la industria automotriz. 

INFORMACIÓN DEL PROSPECTO:
- Nombre: ${prospecto.nombre} ${prospecto.apellido}
- Vehículo de interés: ${prospecto.vehiculoInteres}
- Presupuesto mencionado: $${prospecto.presupuesto || 'No especificado'}
- Origen del lead: ${prospecto.origenLead}

TRANSCRIPCIÓN DE LA CONVERSACIÓN:
"${transcripcion}"

PILARES SPCC A EVALUAR (1-100 puntos cada uno):
${pilares.map(p => `${p.id}. ${p.nombrePilar} (Fase ${p.faseEvaluacion}, Peso: ${Number(p.pesoEstrategico) * 100}%) - ${p.descripcion}`).join('\n')}

INSTRUCCIONES:
1. Analiza la transcripción para evaluar cada pilar del 1 al 100
2. Considera el contexto de la industria automotriz mexicana
3. Sé objetivo pero realista en la evaluación
4. Para pilares sin información suficiente, asigna un puntaje conservador (40-50)
5. Responde ÚNICAMENTE en formato JSON limpio:

{
  "scores": {
    "1": 85,
    "2": 72,
    ...etc para todos los ${pilares.length} pilares
  },
  "notes": {
    "1": "Razón específica del puntaje",
    "2": "Observación detallada",
    ...etc
  },
  "confidence": 0.85,
  "keyInsights": ["insight1", "insight2", "insight3"]
}

Responde con JSON puro sin markdown ni explicaciones adicionales.`;

    const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ABACUSAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 2000,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`);
    }

    const aiResult = await response.json();
    const evaluation = JSON.parse(aiResult.choices[0].message.content);
    
    return {
      scores: evaluation.scores,
      notes: evaluation.notes,
      confidence: evaluation.confidence,
      keyInsights: evaluation.keyInsights,
      vendor: 'abacus-ai'
    };

  } catch (error) {
    console.error('Error en evaluación IA:', error);
    // Fallback a evaluación básica
    return evaluateBasic(pilares);
  }
}

async function evaluateManually(manualInput: any, pilares: any[]) {
  const scores: { [key: number]: number } = {};
  const notes: { [key: number]: string } = {};

  pilares.forEach((pilar, index) => {
    let puntaje = 50; // Base score
    let nota = 'Evaluación manual';

    switch (pilar.nombrePilar) {
      case 'Capacidad Económica':
        puntaje = manualInput.capacidadEconomica || 50;
        nota = `Capacidad económica evaluada manualmente: ${puntaje}/100`;
        break;
      case 'Urgencia de Compra':
        puntaje = manualInput.urgenciaCompra || 50;
        nota = `Urgencia evaluada: ${puntaje}/100`;
        break;
      case 'Autoridad de Compra':
        puntaje = manualInput.autoridadCompra || 50;
        nota = `Autoridad de decisión: ${puntaje}/100`;
        break;
      case 'Vehículo Actual':
        puntaje = manualInput.vehiculoActual ? 70 : 40;
        nota = `Información de vehículo actual: ${manualInput.vehiculoActual || 'No especificado'}`;
        break;
      default:
        puntaje = Math.random() * 20 + 45; // 45-65 range for unknown
        nota = 'Requiere evaluación adicional en próxima interacción';
    }

    scores[pilar.id] = puntaje;
    notes[pilar.id] = nota;
  });

  return { scores, notes, vendor: 'manual' };
}

async function evaluateHybrid(data: any, pilares: any[], prospecto: any): Promise<EvaluationResult> {
  // Combinar evaluación IA + manual
  let aiResults: EvaluationResult = { scores: {}, notes: {} };
  
  if (data.interaccionData?.transcripcion) {
    aiResults = await evaluateWithAI(data.interaccionData.transcripcion, pilares, prospecto);
  }

  const manualResults: EvaluationResult = data.manualInput ? 
    await evaluateManually(data.manualInput, pilares) : 
    { scores: {}, notes: {} };

  // Combinar resultados (manual override AI)
  const finalScores: { [key: number]: number } = {};
  const finalNotes: { [key: number]: string } = {};

  pilares.forEach((pilar: any) => {
    const pilarId = Number(pilar.id);
    finalScores[pilarId] = manualResults.scores[pilarId] || aiResults.scores[pilarId] || 50;
    finalNotes[pilarId] = manualResults.notes[pilarId] || aiResults.notes[pilarId] || 'Evaluación pendiente';
  });

  return {
    scores: finalScores,
    notes: finalNotes,
    vendor: 'hybrid'
  };
}

function evaluateBasic(pilares: any[]) {
  const scores: { [key: number]: number } = {};
  const notes: { [key: number]: string } = {};

  pilares.forEach(pilar => {
    // Puntaje base conservador
    scores[pilar.id] = Math.floor(Math.random() * 30) + 40; // 40-70 range
    notes[pilar.id] = `Evaluación básica para ${pilar.nombrePilar}`;
  });

  return { scores, notes, vendor: 'basic' };
}

function generateRecommendations(puntajeTotal: number, calificaciones: any[]): string[] {
  const recomendaciones = [];

  if (puntajeTotal >= 85) {
    recomendaciones.push('Cliente Elite: Priorizar atención personalizada y cierre inmediato');
    recomendaciones.push('Asignar al vendedor senior más experimentado');
    recomendaciones.push('Preparar propuesta premium con todas las opciones');
  } else if (puntajeTotal >= 70) {
    recomendaciones.push('Cliente Calificado: Desarrollar relación y presentar opciones');
    recomendaciones.push('Programar test drive en 48 horas');
    recomendaciones.push('Enviar información detallada de financiamiento');
  } else if (puntajeTotal >= 50) {
    recomendaciones.push('Cliente A Madurar: Educación y construcción de confianza');
    recomendaciones.push('Seguimiento constante cada 3-5 días');
    recomendaciones.push('Invitar a evento especial o demostración');
  } else {
    recomendaciones.push('Cliente Explorador: Enfoque en educación básica');
    recomendaciones.push('Proporcionar información general sin presión');
    recomendaciones.push('Seguimiento mensual para mantener interés');
  }

  // Recomendaciones específicas por pilares débiles
  const pilaresDebiles = calificaciones.filter(c => c.puntaje < 50);
  pilaresDebiles.forEach(pilar => {
    if (pilar.pilar.includes('Económica')) {
      recomendaciones.push('Explorar opciones de financiamiento flexibles');
    } else if (pilar.pilar.includes('Urgencia')) {
      recomendaciones.push('Identificar motivadores específicos de compra');
    } else if (pilar.pilar.includes('Autoridad')) {
      recomendaciones.push('Involucrar a todos los tomadores de decisión');
    }
  });

  return recomendaciones;
}

function generateNextSteps(clasificacion: string, calificaciones: any[]): string[] {
  const nextSteps = [];

  switch (clasificacion) {
    case 'Elite':
      nextSteps.push('Contactar en las próximas 2 horas');
      nextSteps.push('Preparar cotización personalizada');
      nextSteps.push('Programar cita presencial esta semana');
      break;
    case 'Calificado':
      nextSteps.push('Seguimiento telefónico en 24 horas');
      nextSteps.push('Enviar información por email');
      nextSteps.push('Programar test drive');
      break;
    case 'A Madurar':
      nextSteps.push('Llamada de seguimiento en 3 días');
      nextSteps.push('Enviar material educativo');
      nextSteps.push('Invitar a evento o promoción');
      break;
    default:
      nextSteps.push('Seguimiento cada 2 semanas');
      nextSteps.push('Mantener en lista de interés');
      nextSteps.push('Invitar a newsletter');
  }

  return nextSteps;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const prospectoId = searchParams.get('prospectoId');

    if (!prospectoId) {
      return NextResponse.json({ error: 'ID de prospecto requerido' }, { status: 400 });
    }

    // Obtener evaluación existente
    const prospecto = await prisma.prospecto.findUnique({
      where: { id: parseInt(prospectoId) },
      include: {
        calificaciones: {
          include: {
            pilar: true
          },
          orderBy: {
            pilar: {
              faseEvaluacion: 'asc'
            }
          }
        }
      }
    });

    if (!prospecto) {
      return NextResponse.json({ error: 'Prospecto no encontrado' }, { status: 404 });
    }

    const evaluacionDetallada = prospecto.calificaciones.map(cal => ({
      pilar: {
        id: cal.pilar.id,
        nombre: cal.pilar.nombrePilar,
        descripcion: cal.pilar.descripcion,
        peso: Number(cal.pilar.pesoEstrategico),
        fase: cal.pilar.faseEvaluacion
      },
      puntaje: cal.puntajeObtenido,
      notas: cal.notas,
      fechaEvaluacion: cal.updatedAt
    }));

    return NextResponse.json({
      prospecto: {
        id: prospecto.id,
        nombre: prospecto.nombre,
        apellido: prospecto.apellido,
        calificacionTotal: Number(prospecto.calificacionTotal),
        clasificacion: prospecto.clasificacion
      },
      evaluacion: evaluacionDetallada,
      resumen: {
        fase1: evaluacionDetallada.filter(e => e.pilar.fase === 1),
        fase2: evaluacionDetallada.filter(e => e.pilar.fase === 2),
        fase3: evaluacionDetallada.filter(e => e.pilar.fase === 3)
      }
    });

  } catch (error: any) {
    console.error('Error al obtener evaluación SPCC:', error);
    return NextResponse.json({
      error: 'Error interno del servidor',
      details: error.message
    }, { status: 500 });
  }
}
