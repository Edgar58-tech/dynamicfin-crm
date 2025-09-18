
/**
 * API para subida de archivos de audio a Supabase Storage
 * Maneja la carga de archivos de grabaciones y genera URLs seguras
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { uploadFile } from '@/lib/storage';
import { checkPaymentStatus } from '@/lib/payment-guard';

export const dynamic = 'force-dynamic';

/**
 * POST - Subir archivo de audio
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

    const paymentStatus = await checkPaymentStatus(session.user.agenciaId, 'grabacion');
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

    // Procesar FormData
    const formData = await request.formData();
    const file = formData.get('audio') as File;
    const prospectoId = formData.get('prospectoId') as string;
    const tipoLlamada = formData.get('tipoLlamada') as string;
    const duracion = formData.get('duracion') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'Archivo de audio requerido' },
        { status: 400 }
      );
    }

    if (!prospectoId || !tipoLlamada || !duracion) {
      return NextResponse.json(
        { error: 'Campos requeridos: prospectoId, tipoLlamada, duracion' },
        { status: 400 }
      );
    }

    // Validar tipo de archivo
    const allowedTypes = ['audio/webm', 'audio/wav', 'audio/mp3', 'audio/m4a', 'audio/ogg'];
    if (!allowedTypes.some(type => file.type.includes(type.split('/')[1]))) {
      return NextResponse.json(
        { error: `Tipo de archivo no válido. Tipos permitidos: ${allowedTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Validar tamaño (máximo 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'El archivo excede el tamaño máximo de 50MB' },
        { status: 400 }
      );
    }

    try {
      // Generar nombre único para el archivo
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const extension = file.name.split('.').pop() || 'webm';
      const fileName = `grabacion-${timestamp}.${extension}`;

      // Subir archivo a Supabase Storage
      const uploadResult = await uploadFile(
        file,
        fileName,
        'audio',
        {
          agenciaId: session.user.agenciaId,
          prospectoId: parseInt(prospectoId),
          vendedorId: session.user.id,
          replace: false,
        }
      );

      if (!uploadResult.success) {
        console.error('Error uploading to storage:', uploadResult.error);
        return NextResponse.json(
          { error: uploadResult.error || 'Error al subir archivo' },
          { status: 500 }
        );
      }

      // Metadata adicional
      const audioMetadata = {
        size: file.size,
        type: file.type,
        duration: parseInt(duracion),
        lastModified: file.lastModified,
        quality: file.size > 1024 * 1024 && parseInt(duracion) > 60 ? 'EXCELENTE' :
                 parseInt(duracion) > 30 ? 'BUENA' :
                 parseInt(duracion) < 10 ? 'MALA' : 'REGULAR',
      };

      return NextResponse.json({
        success: true,
        url: uploadResult.url,
        path: uploadResult.path,
        metadata: {
          ...uploadResult.metadata,
          ...audioMetadata,
        },
        paymentStatus,
      });

    } catch (uploadError) {
      console.error('Error en upload:', uploadError);
      return NextResponse.json(
        { error: 'Error al procesar el archivo de audio' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error in upload endpoint:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * GET - Obtener URL de descarga para un archivo
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get('path');

    if (!filePath) {
      return NextResponse.json(
        { error: 'Path del archivo requerido' },
        { status: 400 }
      );
    }

    // TODO: Verificar que el usuario tenga acceso a este archivo
    // (debe ser su grabación o de su agencia si es gerente)

    const { downloadFile } = await import('@/lib/storage');
    const downloadResult = await downloadFile(filePath, 'audio');

    if (!downloadResult.success) {
      return NextResponse.json(
        { error: downloadResult.error || 'Error al generar URL de descarga' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      url: downloadResult.url,
      expiresAt: downloadResult.expiresAt,
    });

  } catch (error) {
    console.error('Error in download endpoint:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Eliminar archivo de audio
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get('path');

    if (!filePath) {
      return NextResponse.json(
        { error: 'Path del archivo requerido' },
        { status: 400 }
      );
    }

    // TODO: Verificar que el usuario tenga acceso a eliminar este archivo
    // Solo el vendedor propietario o gerentes de la agencia

    const { deleteFile } = await import('@/lib/storage');
    const deleteResult = await deleteFile(filePath, 'audio');

    if (!deleteResult.success) {
      return NextResponse.json(
        { error: deleteResult.error || 'Error al eliminar archivo' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Archivo eliminado exitosamente',
    });

  } catch (error) {
    console.error('Error in delete endpoint:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
