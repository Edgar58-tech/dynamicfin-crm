// Force redeploy - cache clear v1.2 - TEMPORARY FIX FOR VERCEL
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-options'
// import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // TEMPORARY: Return empty data until database is updated with AlertaDesbalance model
    return NextResponse.json({
      success: true,
      message: 'AlertaDesbalance model not available in current database',
      alertas: [],
      total: 0
    })

    /* COMMENTED OUT UNTIL DATABASE IS UPDATED
    const { searchParams } = new URL(request.url)
    const estado = searchParams.get('estado') || 'ACTIVA'
    const agenciaId = searchParams.get('agenciaId')
    const prioridad = searchParams.get('prioridad')

    // Construir filtros dinámicamente
    const where: any = {
      estadoAlerta: estado as any,
    }

    if (agenciaId) {
      where.agenciaId = agenciaId
    }

    if (prioridad) {
      where.prioridad = prioridad as any
    }

    // Obtener alertas de desbalance
    const alertas = await prisma.alertaDesbalance.findMany({
      where,
      orderBy: [
        { prioridad: 'desc' },
        { fechaCreacion: 'desc' }
      ],
      take: 100 // Limitar resultados
    })

    return NextResponse.json({
      success: true,
      alertas,
      total: alertas.length
    })
    */

  } catch (error) {
    console.error('Error in alertas-desbalance route:', error)
    return NextResponse.json(
      { error: 'Servicio temporalmente no disponible' },
      { status: 503 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // TEMPORARY: Return method not available until database is updated
    return NextResponse.json({
      success: false,
      message: 'AlertaDesbalance model not available in current database'
    }, { status: 503 })

    /* COMMENTED OUT UNTIL DATABASE IS UPDATED
    const body = await request.json()
    const {
      agenciaId,
      tipoAlerta = 'DESBALANCE_LEADS',
      mensaje,
      descripcion,
      umbralMax,
      valorActual,
      prioridad = 'MEDIA'
    } = body

    if (!mensaje) {
      return NextResponse.json(
        { error: 'El mensaje es requerido' },
        { status: 400 }
      )
    }

    const nuevaAlerta = await prisma.alertaDesbalance.create({
      data: {
        agenciaId,
        tipoAlerta: tipoAlerta as any,
        mensaje,
        descripcion,
        umbralMax,
        valorActual,
        prioridad: prioridad as any,
        estadoAlerta: 'ACTIVA'
      }
    })

    return NextResponse.json({
      success: true,
      alerta: nuevaAlerta
    })
    */

  } catch (error) {
    console.error('Error in POST alertas-desbalance route:', error)
    return NextResponse.json(
      { error: 'Servicio temporalmente no disponible' },
      { status: 503 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // TEMPORARY: Return method not available until database is updated
    return NextResponse.json({
      success: false,
      message: 'AlertaDesbalance model not available in current database'
    }, { status: 503 })

    /* COMMENTED OUT UNTIL DATABASE IS UPDATED
    const body = await request.json()
    const { id, estadoAlerta, resueltoBy } = body

    if (!id) {
      return NextResponse.json(
        { error: 'ID de alerta requerido' },
        { status: 400 }
      )
    }

    const updateData: any = {}
    
    if (estadoAlerta) {
      updateData.estadoAlerta = estadoAlerta
      
      if (estadoAlerta === 'RESUELTA') {
        updateData.fechaResolucion = new Date()
        updateData.resueltoBy = resueltoBy || session.user?.id
      }
    }

    const alertaActualizada = await prisma.alertaDesbalance.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      alerta: alertaActualizada
    })
    */

  } catch (error) {
    console.error('Error in PATCH alertas-desbalance route:', error)
    return NextResponse.json(
      { error: 'Servicio temporalmente no disponible' },
      { status: 503 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // TEMPORARY: Return method not available until database is updated
    return NextResponse.json({
      success: false,
      message: 'AlertaDesbalance model not available in current database'
    }, { status: 503 })

    /* COMMENTED OUT UNTIL DATABASE IS UPDATED
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'ID de alerta requerido' },
        { status: 400 }
      )
    }

    await prisma.alertaDesbalance.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Alerta eliminada correctamente'
    })
    */

  } catch (error) {
    console.error('Error in DELETE alertas-desbalance route:', error)
    return NextResponse.json(
      { error: 'Servicio temporalmente no disponible' },
      { status: 503 }
    )
  }
}