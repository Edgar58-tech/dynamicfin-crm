
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { RolePlaySession } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const data = await request.json();
    const { scenarioId, message, sessionId } = data;

    if (!scenarioId) {
      return NextResponse.json({ error: 'ID del escenario requerido' }, { status: 400 });
    }

    // Obtener el escenario
    const scenario = await prisma.rolePlayScenario.findUnique({
      where: { id: scenarioId }
    });

    if (!scenario) {
      return NextResponse.json({ error: 'Escenario no encontrado' }, { status: 404 });
    }

    let rolePlaySession: RolePlaySession | null;
    
    // Si no hay sessionId, crear nueva sesión
    if (!sessionId) {
      rolePlaySession = await prisma.rolePlaySession.create({
        data: {
          vendedorId: session.user.id,
          scenarioId: scenarioId,
          estadoSession: 'en_progreso',
          configuracionIA: JSON.stringify({
            modelo: 'gpt-4.1-mini',
            temperatura: 0.8,
            maxTokens: 1000
          }),
          modeloIAUtilizado: 'gpt-4.1-mini',
          dispositivoUsado: 'web',
          conversacionCompleta: JSON.stringify([])
        }
      });
    } else {
      // Buscar sesión existente
      rolePlaySession = await prisma.rolePlaySession.findUnique({
        where: { id: sessionId }
      });
      
      if (!rolePlaySession) {
        return NextResponse.json({ error: 'Sesión no encontrada' }, { status: 404 });
      }
    }

    // Obtener historial de conversación
    const historialConversacion = rolePlaySession.conversacionCompleta 
      ? JSON.parse(rolePlaySession.conversacionCompleta)
      : [];

    // Si es un mensaje del vendedor, agregarlo al historial
    if (message) {
      historialConversacion.push({
        role: 'user',
        content: message,
        timestamp: new Date().toISOString(),
        sender: 'vendedor'
      });
    }

    // Construir el contexto del cliente IA
    const personalidadCliente = JSON.parse(scenario.personalidadCliente || '{}');
    const objecionesComunes = JSON.parse(scenario.objecionesComunes || '[]');
    
    const systemPrompt = `
Eres un cliente potencial de automóviles en una simulación de role play para entrenar vendedores. 

INFORMACIÓN DEL ESCENARIO:
- Título: ${scenario.titulo}
- Tipo de cliente: ${scenario.tipoCliente}
- Vehículo de interés: ${scenario.vehiculoInteres || 'Sin preferencia específica'}
- Presupuesto: ${scenario.presupuestoCliente ? `$${scenario.presupuestoCliente}` : 'Flexible'}
- Contexto: ${scenario.contextoPreventa || 'Primera visita al concesionario'}

PERSONALIDAD Y COMPORTAMIENTO:
${JSON.stringify(personalidadCliente, null, 2)}

POSIBLES OBJECIONES A USAR:
${objecionesComunes.map((objecion: string) => `- ${objecion}`).join('\n')}

INSTRUCCIONES:
1. Actúa como este tipo de cliente de forma realista y consistente
2. Responde de manera natural y conversacional
3. Presenta objeciones o dudas apropiadas para el tipo de cliente
4. No seas demasiado fácil de convencer - el vendedor debe trabajar para ganarse la venta
5. Mantén el carácter durante toda la conversación
6. Si el vendedor maneja bien tus objeciones, gradualmente muéstrate más interesado
7. Usa un tono apropiado para tu tipo de cliente (indeciso, técnico, sensible al precio, etc.)
8. Limita tus respuestas a 50-100 palabras
9. Haz preguntas relevantes sobre el vehículo, financiamiento o garantías según tu tipo
10. Si el vendedor hace un excelente trabajo, puedes mostrar señales de estar listo para comprar

Responde SOLO como el cliente, no rompas el personaje.
`;

    const messages = [
      { role: 'system', content: systemPrompt }
    ];

    // Agregar historial de conversación al contexto
    historialConversacion.forEach((msg: any) => {
      if (msg.sender === 'vendedor') {
        messages.push({ role: 'user', content: msg.content });
      } else if (msg.sender === 'cliente_ia') {
        messages.push({ role: 'assistant', content: msg.content });
      }
    });

    // Llamar a la API de streaming
    const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ABACUSAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        messages: messages,
        stream: true,
        max_tokens: 1000,
        temperature: 0.8
      }),
    });

    if (!response.ok) {
      throw new Error(`Error en API: ${response.status}`);
    }

    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        const encoder = new TextEncoder();
        let buffer = '';

        try {
          while (true) {
            const { done, value } = await reader?.read() || {};
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') {
                  // Finalizar y guardar la respuesta completa
                  const respuestaCompleta = buffer;
                  
                  historialConversacion.push({
                    role: 'assistant',
                    content: respuestaCompleta,
                    timestamp: new Date().toISOString(),
                    sender: 'cliente_ia'
                  });

// Actualizar sesión en base de datos
if (rolePlaySession) { // <-- Tu comprobación de seguridad (CORRECTO)
  await prisma.rolePlaySession.update({
    where: { id: rolePlaySession.id },
    data: { // <-- Todos los campos del bloque original (COMPLETO)
      conversacionCompleta: JSON.stringify(historialConversacion),
      totalMensajes: historialConversacion.length,
      mensajesVendedor: historialConversacion.filter((m: any) => m.sender === 'vendedor').length,
      mensajesClienteIA: historialConversacion.filter((m: any) => m.sender === 'cliente_ia').length,
      estadoSession: 'en_progreso'
    }
  });
}
                  const finalData = JSON.stringify({
                    status: 'completed',
                    sessionId: rolePlaySession?.id,
                    response: respuestaCompleta,
                    totalMessages: historialConversacion.length
                  });
                  controller.enqueue(encoder.encode(`data: ${finalData}\n\n`));
                  return;
                }
                
                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content || '';
                  if (content) {
                    buffer += content;
                    const progressData = JSON.stringify({
                      status: 'streaming',
                      content: content,
                      sessionId: rolePlaySession?.id
                    });
                    controller.enqueue(encoder.encode(`data: ${progressData}\n\n`));
                  }
                } catch (e) {
                  // Ignorar errores de parsing JSON
                }
              }
            }
          }
        } catch (error) {
          console.error('Stream error:', error);
          const errorData = JSON.stringify({
            status: 'error',
            message: 'Error en el streaming'
          });
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Error in simulation:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// Endpoint para finalizar una sesión
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const data = await request.json();
    const { sessionId, ventaLograda, clienteSatisfecho, observaciones } = data;

    if (!sessionId) {
      return NextResponse.json({ error: 'ID de sesión requerido' }, { status: 400 });
    }

    // Calcular duración de la sesión
    const rolePlaySession = await prisma.rolePlaySession.findUnique({
      where: { id: sessionId }
    });

    if (!rolePlaySession) {
      return NextResponse.json({ error: 'Sesión no encontrada' }, { status: 404 });
    }

    const duracionMinutos = Math.round((Date.now() - rolePlaySession.fechaInicio.getTime()) / (1000 * 60));

    const updatedSession = await prisma.rolePlaySession.update({
      where: { id: sessionId },
      data: {
        fechaFin: new Date(),
        duracionMinutos,
        estadoSession: 'completada',
        objetivoCumplido: true, // Se puede evaluar mejor después
        ventaLograda: ventaLograda || false,
        clienteSatisfecho: clienteSatisfecho || false,
        observacionesVendedor: observaciones
      }
    });

    // Actualizar estadísticas del escenario
    await prisma.rolePlayScenario.update({
      where: { id: rolePlaySession.scenarioId },
      data: {
        completadoVeces: {
          increment: 1
        }
      }
    });

    return NextResponse.json({
      message: 'Sesión finalizada exitosamente',
      session: {
        id: updatedSession.id,
        duracionMinutos: duracionMinutos,
        estadoSession: updatedSession.estadoSession,
        totalMensajes: updatedSession.totalMensajes
      }
    });

} catch (error) {
  // Patrón de manejo de errores robusto
  let errorMessage = 'Error interno del servidor';
  if (error instanceof Error) {
    errorMessage = error.message;
  }
  console.error('Error finalizing session:', error);
  return NextResponse.json(
    { error: errorMessage },
    { status: 500 }
  );
}
}
