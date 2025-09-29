
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

    const { scenarioId, message, sessionId } = await request.json();

    if (!scenarioId) {
      return NextResponse.json({ error: 'ID de escenario requerido' }, { status: 400 });
    }

    // Obtener el escenario
    const scenario = await prisma.rolePlayScenario.findUnique({
      where: { id: scenarioId }
    });

    if (!scenario) {
      return NextResponse.json({ error: 'Escenario no encontrado' }, { status: 404 });
    }

    let currentSessionId = sessionId;

    // Crear nueva sesión si no existe
    if (!currentSessionId) {
      const nuevaSesion = await prisma.rolePlaySession.create({
        data: {
          usuarioId: session.user.id,
          scenarioId: scenarioId,
          estado: 'EN_PROGRESO',
          fechaInicio: new Date(),
          conversacion: []
        }
      });
      currentSessionId = nuevaSesion.id;
    }

    // Simular respuesta del cliente IA
    let respuestaIA = '';

    if (!message) {
      // Mensaje inicial del cliente
      respuestaIA = generarMensajeInicial(scenario);
    } else {
      // Respuesta a mensaje del vendedor
      respuestaIA = generarRespuestaIA(scenario, message);
    }

    // Guardar la conversación
    const sesionActual = await prisma.rolePlaySession.findUnique({
      where: { id: currentSessionId }
    });

    const nuevaConversacion = [...(sesionActual?.conversacion as any[] || [])];
    
    if (message) {
      nuevaConversacion.push({
        timestamp: new Date().toISOString(),
        sender: 'vendedor',
        content: message
      });
    }

    nuevaConversacion.push({
      timestamp: new Date().toISOString(),
      sender: 'cliente_ia',
      content: respuestaIA
    });

    await prisma.rolePlaySession.update({
      where: { id: currentSessionId },
      data: {
        conversacion: nuevaConversacion,
        fechaUltimaActividad: new Date()
      }
    });

    // Crear respuesta streaming simulada
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      start(controller) {
        // Simular streaming character por character
        let index = 0;
        const interval = setInterval(() => {
          if (index < respuestaIA.length) {
            const char = respuestaIA[index];
            const chunk = encoder.encode(`data: ${JSON.stringify({
              status: 'streaming',
              content: char,
              sessionId: currentSessionId
            })}\n\n`);
            controller.enqueue(chunk);
            index++;
          } else {
            // Mensaje final
            const finalChunk = encoder.encode(`data: ${JSON.stringify({
              status: 'completed',
              response: respuestaIA,
              sessionId: currentSessionId
            })}\n\n`);
            controller.enqueue(finalChunk);
            
            const doneChunk = encoder.encode('data: [DONE]\n\n');
            controller.enqueue(doneChunk);
            
            clearInterval(interval);
            controller.close();
          }
        }, 50); // 50ms por carácter para simular typing
      }
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      }
    });

  } catch (error) {
    console.error('Error en simulación de roleplay:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

function generarMensajeInicial(scenario: any): string {
  const mensajes = {
    'PROSPECTACION': [
      `Hola, estoy interesado en ${scenario.vehiculoInteres || 'ver opciones de vehículos'}. ¿Podrían ayudarme?`,
      `Buenos días, he visto algunos autos en línea y me gustaría saber más sobre ${scenario.vehiculoInteres || 'sus opciones'}.`,
      `Hola, necesito cambiar mi auto actual y estoy considerando ${scenario.vehiculoInteres || 'diferentes opciones'}. ¿Qué me pueden ofrecer?`
    ],
    'CIERRE': [
      `He estado pensando en la propuesta que me hicieron. Necesito tomar una decisión pronto.`,
      `Ya comparé con otras agencias. ¿Cuál sería su mejor oferta final?`,
      `Estoy casi convencido, pero necesito aclarar algunos detalles antes de decidir.`
    ],
    'MANEJO_OBJECIONES': [
      `El precio me parece un poco alto comparado con otros lugares.`,
      `No estoy seguro si este es el momento adecuado para comprar.`,
      `Me gusta el auto, pero tengo algunas dudas sobre el financiamiento.`
    ]
  };

  const categoria = scenario.categoria as keyof typeof mensajes || 'PROSPECTACION';
  const opciones = mensajes[categoria] || mensajes.PROSPECTACION;
  return opciones[Math.floor(Math.random() * opciones.length)];
}

function generarRespuestaIA(scenario: any, mensajeVendedor: string): string {
  // Análisis simple del mensaje del vendedor
  const mensaje = mensajeVendedor.toLowerCase();
  
  // Respuestas basadas en palabras clave
  if (mensaje.includes('precio') || mensaje.includes('costo')) {
    return `Mi presupuesto es de aproximadamente $${scenario.presupuesto?.toLocaleString() || '300,000'}. ¿Qué opciones tengo en ese rango?`;
  }
  
  if (mensaje.includes('financiamiento') || mensaje.includes('crédito')) {
    return 'Me interesa el financiamiento, pero necesito conocer las tasas y plazos disponibles. ¿Qué documentos necesito?';
  }
  
  if (mensaje.includes('características') || mensaje.includes('especificaciones')) {
    return `Me parece interesante. ¿Podría explicarme más sobre la seguridad y el consumo de combustible?`;
  }
  
  if (mensaje.includes('prueba') || mensaje.includes('manejo')) {
    return 'Sí, me gustaría hacer una prueba de manejo. ¿Qué necesito para eso?';
  }
  
  // Respuestas por dificultad
  const respuestasPorDificultad = {
    'PRINCIPIANTE': [
      'Suena bien, cuénteme más detalles.',
      'Eso me parece razonable. ¿Qué más incluye?',
      'Me gusta lo que me dice. ¿Cuáles serían los siguientes pasos?'
    ],
    'INTERMEDIO': [
      'Necesito pensarlo un poco. ¿Tienen alguna promoción especial?',
      'Es interesante, pero quisiera ver otras opciones también.',
      'Me gusta, pero necesito consultarlo con mi familia primero.'
    ],
    'AVANZADO': [
      'He investigado bastante y conozco los precios del mercado. ¿Cuál es su mejor oferta?',
      'Aprecio la información, pero necesito ver números concretos y comparar con la competencia.',
      'Tengo experiencia comprando autos. ¿Qué me hace diferente su propuesta?'
    ]
  };
  
  const dificultad = scenario.nivelDificultad as keyof typeof respuestasPorDificultad || 'PRINCIPIANTE';
  const opciones = respuestasPorDificultad[dificultad];
  return opciones[Math.floor(Math.random() * opciones.length)];
}
