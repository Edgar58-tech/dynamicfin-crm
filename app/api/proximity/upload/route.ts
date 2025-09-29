
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Solo vendedores y gerentes pueden subir grabaciones
    if (!['VENDEDOR', 'GERENTE_VENTAS', 'GERENTE_GENERAL'].includes(session.user.rol)) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
    }

    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    const metadata = formData.get('metadata') as string;

    if (!audioFile || !metadata) {
      return NextResponse.json({ error: 'Archivo de audio y metadata requeridos' }, { status: 400 });
    }

    const parsedMetadata = JSON.parse(metadata);

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'uploads', 'proximity');
    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch (error) {
      // Directory may already exist
    }

    // Save file
    const buffer = Buffer.from(await audioFile.arrayBuffer());
    const filename = `${session.user.id}-${parsedMetadata.sessionId}.webm`;
    const filepath = join(uploadsDir, filename);
    
    await writeFile(filepath, buffer);

    // In a real implementation, you would:
    // 1. Save metadata to database
    // 2. Upload to cloud storage (S3, etc.)
    // 3. Process audio file
    // 4. Generate transcription
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000));

    return NextResponse.json({
      success: true,
      filename,
      metadata: parsedMetadata,
      message: 'Grabación subida exitosamente'
    }, { status: 200 });

  } catch (error) {
    console.error('Error uploading proximity recording:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
