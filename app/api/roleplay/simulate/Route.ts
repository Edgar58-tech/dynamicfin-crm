
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Simulación de roleplay API endpoint
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Extract escenario session data
    const escenarioSession = body.escenarioSession || body.rolePlaySession || null

    // Validar que la sesión existe
    if (!escenarioSession) {
      return NextResponse.json(
        { error: 'No scenario session provided' },
        { status: 400 }
      )
    }

    // Simulación de procesamiento de roleplay
    const historialConversacion = body.messages || []
    const buffer = body.content || ''
    
    // Stream response setup
    const encoder = new TextEncoder()
    
    const stream = new ReadableStream({
      start(controller) {
        try {
          // Progress data with null-safe access
          const progressData = JSON.stringify({
            status: 'streaming',
            content: buffer,
            sessionId: escenarioSession?.id || 0,  // ✅ CORREGIDO - Era línea 192
            totalContent: buffer
          })
          controller.enqueue(encoder.encode(`data: ${progressData}\n\n`))
          
          // Simular procesamiento
          setTimeout(async () => {
            try {
              // Actualizar sesión en base de datos con null-safe access
              await prisma.rolePlaySession.update({
                where: { id: escenarioSession?.id || 0 },  // ✅ CORREGIDO - Era línea 226
                data: {
                  conversacionCompleta: JSON.stringify(historialConversacion),
                  fechaFin: new Date(),
                  completado: true
                }
              })

              // Respuesta final con null-safe access
              const respuestaCompleta = `Roleplay completado exitosamente`
              
              const finalData = JSON.stringify({
                status: 'completed',
                sessionId: escenarioSession?.id || 0,  // ✅ CORREGIDO - Era línea 238
                response: respuestaCompleta,
                duration: historialConversacion.length
              })
              
              controller.enqueue(encoder.encode(`data: ${finalData}\n\n`))
              controller.enqueue(encoder.encode('data: [DONE]\n\n'))
              controller.close()
              
            } catch (updateError) {
              console.error('Error updating roleplay session:', updateError)
              const errorMessage = updateError instanceof Error ? updateError.message : 'Failed to update session'
              const errorData = JSON.stringify({
                status: 'error',
                sessionId: escenarioSession?.id || 0,  // ✅ NULL-SAFE
                error: errorMessage
              })
              controller.enqueue(encoder.encode(`data: ${errorData}\n\n`))
              controller.close()
            }
          }, 1000)
          
        } catch (streamError) {
          console.error('Stream error:', streamError)
          const errorMessage = streamError instanceof Error ? streamError.message : 'Stream processing failed'
          const errorData = JSON.stringify({
            status: 'error',
            message: 'Error en el streaming de la IA',
            error: errorMessage,
            sessionId: escenarioSession?.id || 0
          })
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`))
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
    
  } catch (error) {
    console.error('Roleplay simulation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET method para obtener estado de sesión
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID required' },
        { status: 400 }
      )
    }

    const session = await prisma.escenarioSession.findUnique({
      where: { id: parseInt(sessionId) }
    })

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      sessionId: session.id,
      status: session.completado ? 'completed' : 'active',
      duration: session.duracionSegundos || 0,
      completedAt: session.fechaFin,
      createdAt: session.createdAt
    })
    
  } catch (error) {
    console.error('Get roleplay session error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
