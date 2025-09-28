
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { uploadFile } from '@/lib/s3';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (!session.user.agenciaId) {
      return NextResponse.json({ error: 'Usuario sin agencia asignada' }, { status: 400 });
    }

    const formData = await request.formData();
    const file = formData.get('audio') as File;
    const prospectoId = formData.get('prospectoId') as string;
    const tipoLlamada = formData.get('tipoLlamada') as string;
    const duracion = formData.get('duracion') as string;
    const observaciones = formData.get('observaciones') as string;
    const esProximidad = formData.get('esProximidad') === 'true';

    if (!file || !prospectoId) {
      return NextResponse.json({ 
        error: 'Archivo de audio y ID de prospecto son requeridos' 
      }, { status: 400 });
    }

    // Validar prospecto existe y pertenece a la agencia del usuario
    const prospecto = await prisma.prospecto.findFirst({
      where: {
        id: parseInt(prospectoId),
        agenciaId: session.user.agenciaId
      },
      include: {
        vendedor: true
      }
    });

    if (!prospecto) {
      return NextResponse.json({ error: 'Prospecto no encontrado' }, { status: 404 });
    }

    // Verificar límites de grabación de la agencia
    const agencia = await prisma.agencia.findUnique({
      where: { id: session.user.agenciaId },
      select: {
        limiteGrabacionesMes: true,
        grabacionesUsadas: true,
        estadoPago: true
      }
    });

    if (agencia?.estadoPago !== 'ACTIVO') {
      return NextResponse.json({ 
        error: 'La agencia tiene pagos pendientes. Contacte al administrador.' 
      }, { status: 402 });
    }

    if ((agencia?.grabacionesUsadas || 0) >= (agencia?.limiteGrabacionesMes || 0)) {
      return NextResponse.json({ 
        error: 'Límite mensual de grabaciones alcanzado. Actualice su plan.' 
      }, { status: 429 });
    }

    // Convertir archivo a buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Subir a S3
    const fileName = `${prospecto.nombre}-${prospecto.id}-${Date.now()}.webm`;
    const cloud_storage_path = await uploadFile(buffer, fileName);

    // Crear registro de grabación
    const grabacion = await prisma.grabacionConversacion.create({
      data: {
        prospectoId: parseInt(prospectoId),
        vendedorId: session.user.id,
        tipoLlamada: tipoLlamada || 'seguimiento',
        duracion: parseInt(duracion) || 0,
        rutaArchivo: cloud_storage_path, // Usar rutaArchivo en lugar de cloud_storage_path
        tamanoArchivo: BigInt(buffer.length),
        formatoAudio: 'webm',
        calidadAudio: buffer.length > 1000000 ? 'alta' : 'media',
        dispositivoGrabacion: 'web',
        ipOrigen: request.headers.get('x-forwarded-for') || 'unknown',
        esGrabacionProximidad: esProximidad,
        observacionesVendedor: observaciones,
        procesado: false
      }
    });

    // Incrementar contador de grabaciones de la agencia
    await prisma.agencia.update({
      where: { id: session.user.agenciaId },
      data: {
        grabacionesUsadas: {
          increment: 1
        }
      }
    });

    // Procesar transcripción y análisis en background
    processRecordingAsync(grabacion.id);

    return NextResponse.json({
      success: true,
      grabacion: {
        id: grabacion.id,
        rutaArchivo: grabacion.rutaArchivo,
        duracion: grabacion.duracion,
        fechaGrabacion: grabacion.fechaGrabacion,
        procesando: true
      },
      message: 'Grabación subida exitosamente. El procesamiento iniciará en breve.'
    });

  } catch (error: any) {
    console.error('Error subiendo grabación:', error);
    return NextResponse.json({
      error: 'Error interno del servidor',
      details: error.message
    }, { status: 500 });
  }
}

async function processRecordingAsync(grabacionId: number) {
  try {
    console.log(`Iniciando procesamiento de grabación ${grabacionId}`);
    
    // Llamar a la API de procesamiento
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/grabaciones/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ grabacionId })
    });

    if (!response.ok) {
      console.error(`Error procesando grabación ${grabacionId}:`, response.statusText);
    }
    
  } catch (error) {
    console.error(`Error en procesamiento asíncrono de grabación ${grabacionId}:`, error);
  }
}
