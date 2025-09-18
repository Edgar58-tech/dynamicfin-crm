
/**
 * API para transcripción de archivos de audio usando múltiples proveedores de IA
 * Utiliza OpenAI Whisper principalmente, con fallbacks según tier de servicio
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { transcribeAudio, getBestTranscriptionProvider } from '@/lib/ai-providers';
import { checkPaymentStatus, updateServiceUsage } from '@/lib/payment-guard';
import { downloadFile } from '@/lib/storage';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

/**
 * POST - Transcribir archivo de audio
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

    const paymentStatus = await checkPaymentStatus(session.user.agenciaId, 'transcripcion');
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
    const { grabacionId, language = 'es' } = body;

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
    });

    if (!grabacion) {
      return NextResponse.json(
        { error: 'Grabación no encontrada o no autorizada' },
        { status: 404 }
      );
    }

    if (!grabacion.rutaArchivo) {
      return NextResponse.json(
        { error: 'La grabación no tiene archivo de audio asociado' },
        { status: 400 }
      );
    }

    if (grabacion.transcripcion && grabacion.transcripcion.trim().length > 0) {
      return NextResponse.json(
        { 
          error: 'La grabación ya tiene transcripción',
          transcripcion: grabacion.transcripcion,
        },
        { status: 400 }
      );
    }

    try {
      // Descargar archivo de audio desde Supabase Storage
      const downloadResult = await downloadFile(grabacion.rutaArchivo, 'audio');
      
      if (!downloadResult.success || !downloadResult.url) {
        console.error('Error descargando archivo:', downloadResult.error);
        return NextResponse.json(
          { error: 'Error al acceder al archivo de audio' },
          { status: 500 }
        );
      }

      // Descargar el archivo desde la URL firmada
      const audioResponse = await fetch(downloadResult.url);
      if (!audioResponse.ok) {
        console.error('Error fetching audio file:', audioResponse.statusText);
        return NextResponse.json(
          { error: 'Error al descargar archivo de audio' },
          { status: 500 }
        );
      }

      const audioBuffer = Buffer.from(await audioResponse.arrayBuffer());
      const fileName = grabacion.rutaArchivo.split('/').pop() || 'audio.wav';

      // Obtener el mejor proveedor para transcripción
      let provider: string;
      try {
        provider = getBestTranscriptionProvider();
      } catch (error) {
        console.error('Error getting transcription provider:', error);
        return NextResponse.json(
          { error: 'No hay proveedores de transcripción disponibles' },
          { status: 503 }
        );
      }

      // Realizar transcripción
      console.log(`Iniciando transcripción con ${provider} para grabación ${grabacionId}`);
      
      const transcriptionResult = await transcribeAudio(audioBuffer, fileName, language);
      
      console.log(`Transcripción completada. Texto length: ${transcriptionResult.text.length}, Costo: $${transcriptionResult.cost}`);

      // Actualizar grabación con transcripción
      const updatedGrabacion = await prisma.grabacionConversacion.update({
        where: { id: parseInt(grabacionId) },
        data: {
          transcripcion: transcriptionResult.text,
          proveedorIA: transcriptionResult.provider,
          costoTranscripcion: transcriptionResult.cost,
          procesado: true,
          fechaProcesamiento: new Date(),
        },
        include: {
          prospecto: {
            select: {
              nombre: true,
              apellido: true,
              vehiculoInteres: true,
            },
          },
          vendedor: {
            select: {
              nombre: true,
              apellido: true,
            },
          },
        },
      });

      // Actualizar costos de la agencia
      await updateServiceUsage(session.user.agenciaId, {
        grabacionesIncrement: 0,
        costoGrabacion: 0,
        costoTranscripcion: transcriptionResult.cost,
        costoAnalisis: 0,
      });

      return NextResponse.json({
        success: true,
        transcripcion: transcriptionResult.text,
        grabacion: {
          ...updatedGrabacion,
          costoTranscripcion: updatedGrabacion.costoTranscripcion?.toNumber(),
          costoAnalisis: updatedGrabacion.costoAnalisis?.toNumber(),
          tamanoArchivo: updatedGrabacion.tamanoArchivo?.toString(),
        },
        metadata: {
          provider: transcriptionResult.provider,
          cost: transcriptionResult.cost,
          duration: transcriptionResult.duration,
          language,
        },
        paymentStatus,
      });

    } catch (transcriptionError) {
      console.error('Error en transcripción:', transcriptionError);
      
      // Registrar error en la base de datos
      await prisma.grabacionConversacion.update({
        where: { id: parseInt(grabacionId) },
        data: {
          errorProcesamiento: `Error en transcripción: ${transcriptionError instanceof Error ? transcriptionError.message : 'Unknown error'}`,
          fechaProcesamiento: new Date(),
        },
      });

      return NextResponse.json(
        { error: `Error en transcripción: ${transcriptionError instanceof Error ? transcriptionError.message : 'Unknown error'}` },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error in transcribe endpoint:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * GET - Obtener estado de transcripción
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
        transcripcion: true,
        proveedorIA: true,
        costoTranscripcion: true,
        procesado: true,
        errorProcesamiento: true,
        fechaGrabacion: true,
        fechaProcesamiento: true,
        duracion: true,
      },
    });

    if (!grabacion) {
      return NextResponse.json(
        { error: 'Grabación no encontrada o no autorizada' },
        { status: 404 }
      );
    }

    const hasTranscription = grabacion.transcripcion && grabacion.transcripcion.trim().length > 0;

    return NextResponse.json({
      grabacionId: grabacion.id,
      hasTranscription,
      transcripcion: hasTranscription ? grabacion.transcripcion : null,
      procesado: grabacion.procesado,
      errorProcesamiento: grabacion.errorProcesamiento,
      metadata: {
        provider: grabacion.proveedorIA,
        cost: grabacion.costoTranscripcion?.toNumber() || 0,
        duracion: grabacion.duracion,
        fechaGrabacion: grabacion.fechaGrabacion,
        fechaProcesamiento: grabacion.fechaProcesamiento,
      },
    });

  } catch (error) {
    console.error('Error getting transcription status:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
