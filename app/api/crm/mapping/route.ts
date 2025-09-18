
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

// GET - Obtener mapeos de campos
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const configId = url.searchParams.get('configId');
    const entidad = url.searchParams.get('entidad');

    if (!configId) {
      return NextResponse.json(
        { error: 'ID de configuración CRM requerido' },
        { status: 400 }
      );
    }

    // Verificar que la configuración pertenece a la agencia del usuario
    const config = await prisma.crmConfiguration.findFirst({
      where: {
        id: parseInt(configId),
        agenciaId: session.user.agenciaId as number
      }
    });

    if (!config) {
      return NextResponse.json(
        { error: 'Configuración CRM no encontrada' },
        { status: 404 }
      );
    }

    // Construir filtros
    const whereClause: any = {
      crmConfigurationId: parseInt(configId)
    };

    if (entidad) {
      whereClause.entidad = entidad;
    }

    // Obtener mapeos
    const mapeos = await prisma.crmFieldMapping.findMany({
      where: whereClause,
      include: {
        crmConfiguration: {
          select: {
            id: true,
            nombre: true,
            crmTipo: true
          }
        }
      },
      orderBy: [
        { entidad: 'asc' },
        { campoDynamicFin: 'asc' }
      ]
    });

    return NextResponse.json({
      success: true,
      data: mapeos
    });

  } catch (error: any) {
    console.error('Error en GET /api/crm/mapping:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Error interno del servidor',
        details: error.message
      },
      { status: 500 }
    );
  }
}

// POST - Crear nuevo mapeo de campo
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const data = await request.json();
    
    // Validar campos requeridos
    const requiredFields = ['crmConfigurationId', 'entidad', 'campoDynamicFin', 'campoCrm', 'tipoDato'];
    for (const field of requiredFields) {
      if (!data[field]) {
        return NextResponse.json(
          { error: `Campo requerido: ${field}` },
          { status: 400 }
        );
      }
    }

    // Verificar que la configuración pertenece a la agencia del usuario
    const config = await prisma.crmConfiguration.findFirst({
      where: {
        id: data.crmConfigurationId,
        agenciaId: session.user.agenciaId as number
      }
    });

    if (!config) {
      return NextResponse.json(
        { error: 'Configuración CRM no encontrada' },
        { status: 404 }
      );
    }

    // Verificar que no existe un mapeo duplicado
    const existingMapping = await prisma.crmFieldMapping.findUnique({
      where: {
        crmConfigurationId_entidad_campoDynamicFin: {
          crmConfigurationId: data.crmConfigurationId,
          entidad: data.entidad,
          campoDynamicFin: data.campoDynamicFin
        }
      }
    });

    if (existingMapping) {
      return NextResponse.json(
        { error: 'Ya existe un mapeo para este campo' },
        { status: 400 }
      );
    }

    // Crear mapeo
    const newMapping = await prisma.crmFieldMapping.create({
      data: {
        crmConfigurationId: data.crmConfigurationId,
        entidad: data.entidad,
        campoDynamicFin: data.campoDynamicFin,
        campoCrm: data.campoCrm,
        tipoDato: data.tipoDato,
        direccionSincronizacion: data.direccionSincronizacion || 'bidireccional',
        transformacion: data.transformacion ? JSON.stringify(data.transformacion) : null,
        requerido: data.requerido !== undefined ? data.requerido : false,
        valorPorDefecto: data.valorPorDefecto || null,
        validacion: data.validacion ? JSON.stringify(data.validacion) : null,
        activo: data.activo !== undefined ? data.activo : true
      },
      include: {
        crmConfiguration: {
          select: {
            id: true,
            nombre: true,
            crmTipo: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Mapeo de campo creado exitosamente',
      data: newMapping
    });

  } catch (error: any) {
    console.error('Error en POST /api/crm/mapping:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Error al crear mapeo de campo',
        details: error.message
      },
      { status: 500 }
    );
  }
}

// PUT - Actualizar mapeo de campo
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const data = await request.json();
    const { mappingId, ...updateData } = data;

    if (!mappingId) {
      return NextResponse.json(
        { error: 'ID de mapeo requerido' },
        { status: 400 }
      );
    }

    // Verificar que el mapeo existe y pertenece a la agencia del usuario
    const existingMapping = await prisma.crmFieldMapping.findFirst({
      where: {
        id: mappingId
      },
      include: {
        crmConfiguration: {
          select: {
            id: true,
            agenciaId: true
          }
        }
      }
    });

    if (!existingMapping || existingMapping.crmConfiguration.agenciaId !== session.user.agenciaId) {
      return NextResponse.json(
        { error: 'Mapeo no encontrado o no autorizado' },
        { status: 404 }
      );
    }

    // Actualizar mapeo
    const updatedMapping = await prisma.crmFieldMapping.update({
      where: { id: mappingId },
      data: {
        campoCrm: updateData.campoCrm || existingMapping.campoCrm,
        tipoDato: updateData.tipoDato || existingMapping.tipoDato,
        direccionSincronizacion: updateData.direccionSincronizacion || existingMapping.direccionSincronizacion,
        transformacion: updateData.transformacion ? JSON.stringify(updateData.transformacion) : existingMapping.transformacion,
        requerido: updateData.requerido !== undefined ? updateData.requerido : existingMapping.requerido,
        valorPorDefecto: updateData.valorPorDefecto !== undefined ? updateData.valorPorDefecto : existingMapping.valorPorDefecto,
        validacion: updateData.validacion ? JSON.stringify(updateData.validacion) : existingMapping.validacion,
        activo: updateData.activo !== undefined ? updateData.activo : existingMapping.activo,
        updatedAt: new Date()
      },
      include: {
        crmConfiguration: {
          select: {
            id: true,
            nombre: true,
            crmTipo: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Mapeo de campo actualizado exitosamente',
      data: updatedMapping
    });

  } catch (error: any) {
    console.error('Error en PUT /api/crm/mapping:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Error al actualizar mapeo de campo',
        details: error.message
      },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar mapeo de campo
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const mappingId = url.searchParams.get('id');

    if (!mappingId) {
      return NextResponse.json(
        { error: 'ID de mapeo requerido' },
        { status: 400 }
      );
    }

    // Verificar que el mapeo existe y pertenece a la agencia del usuario
    const existingMapping = await prisma.crmFieldMapping.findFirst({
      where: {
        id: parseInt(mappingId)
      },
      include: {
        crmConfiguration: {
          select: {
            id: true,
            agenciaId: true
          }
        }
      }
    });

    if (!existingMapping || existingMapping.crmConfiguration.agenciaId !== session.user.agenciaId) {
      return NextResponse.json(
        { error: 'Mapeo no encontrado o no autorizado' },
        { status: 404 }
      );
    }

    // Eliminar mapeo
    await prisma.crmFieldMapping.delete({
      where: { id: parseInt(mappingId) }
    });

    return NextResponse.json({
      success: true,
      message: 'Mapeo de campo eliminado exitosamente'
    });

  } catch (error: any) {
    console.error('Error en DELETE /api/crm/mapping:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Error al eliminar mapeo de campo',
        details: error.message
      },
      { status: 500 }
    );
  }
}
