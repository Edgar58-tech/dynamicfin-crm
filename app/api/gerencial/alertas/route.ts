
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (!['GERENTE_VENTAS', 'GERENTE_GENERAL', 'DIRECTOR_MARCA', 'DIRECTOR_GENERAL', 'DYNAMICFIN_ADMIN'].includes(session.user.rol)) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
    }

    const agenciaId = session.user.agenciaId;
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    // Obtener alertas existentes del sistema
    const alertasSistema = await prisma.alertaSistema.findMany({
      where: {
        usuarioId: session.user.id,
        leida: false
      },
      orderBy: [
        { prioridad: 'desc' },
        { fechaCreacion: 'desc' }
      ]
    });

    // Generar alertas inteligentes en tiempo real
    const alertasGeneradas = [];

    // 1. Alertas de leads pendientes de calificación > 4 horas
    const leadsCriticos = await prisma.prospecto.findMany({
      where: {
        estatus: 'PENDIENTE_CALIFICACION',
        fechaAsignacion: {
          lte: new Date(Date.now() - 4 * 60 * 60 * 1000) // 4 horas atrás
        },
        ...(agenciaId && { agenciaId })
      },
      include: {
        vendedor: { select: { nombre: true, apellido: true } },
        coordinador: { select: { nombre: true } }
      }
    });

    if (leadsCriticos.length > 0) {
      alertasGeneradas.push({
        id: `leads-criticos-${Date.now()}`,
        tipo: 'lead_critico',
        prioridad: 'alta',
        titulo: `${leadsCriticos.length} leads sin calificar > 4 horas`,
        mensaje: `Hay ${leadsCriticos.length} leads pendientes de calificación por más de 4 horas. Acción requerida inmediatamente.`,
        datos: leadsCriticos.slice(0, 5),
        accionSugerida: 'reasignar_vendedor',
        fechaCreacion: new Date()
      });
    }

    // 2. Alertas de desbalance de carga
    const vendedoresGuardia = await prisma.vendedorGuardia.findMany({
      where: {
        fecha: {
          gte: startOfDay,
          lt: new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000)
        },
        activo: true,
        ...(agenciaId && { vendedor: { agenciaId } })
      },
      include: {
        vendedor: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            cargaProspectos: true
          }
        }
      }
    });

    const cargas = vendedoresGuardia.map(v => v.cargaActual);
    const cargaMax = Math.max(...cargas, 0);
    const cargaMin = Math.min(...cargas, 0);
    const desbalance = cargaMax - cargaMin;

    if (desbalance > 5) {
      const vendedorSobrecargado = vendedoresGuardia.find(v => v.cargaActual === cargaMax);
      alertasGeneradas.push({
        id: `desbalance-${Date.now()}`,
        tipo: 'sobrecarga_vendedor',
        prioridad: 'media',
        titulo: `Desbalance de carga detectado (${desbalance} leads)`,
        mensaje: `${vendedorSobrecargado?.vendedor.nombre || 'Vendedor'} tiene ${desbalance} leads más que el vendedor con menor carga.`,
        datos: { vendedorSobrecargado: vendedorSobrecargado?.vendedor, desbalance },
        accionSugerida: 'redistribuir_leads',
        fechaCreacion: new Date()
      });
    }

    // 3. Alertas de vendedores de guardia no definidos para mañana
    const manana = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const mananaDia = new Date(manana.getFullYear(), manana.getMonth(), manana.getDate());
    
    const vendedoresManana = await prisma.vendedorGuardia.count({
      where: {
        fecha: {
          gte: mananaDia,
          lt: new Date(mananaDia.getTime() + 24 * 60 * 60 * 1000)
        },
        activo: true,
        ...(agenciaId && { vendedor: { agenciaId } })
      }
    });

    if (vendedoresManana === 0) {
      alertasGeneradas.push({
        id: `no-guardia-manana-${Date.now()}`,
        tipo: 'configuracion_critica',
        prioridad: 'alta',
        titulo: 'Sin vendedores de guardia para mañana',
        mensaje: `No hay vendedores de guardia configurados para ${manana.toLocaleDateString('es-ES')}. Los leads entrantes no podrán ser asignados.`,
        datos: { fecha: manana },
        accionSugerida: 'configurar_vendedores_guardia',
        fechaCreacion: new Date()
      });
    }

    // 4. Alertas de metas en riesgo
    const metasEnRiesgo = await prisma.metaVendedor.findMany({
      where: {
        mes: today.getMonth() + 1,
        year: today.getFullYear(),
        activo: true,
        porcentajeCumplimiento: { lt: 70 }, // Menos del 70% de cumplimiento
        ...(agenciaId && { vendedor: { agenciaId } })
      },
      include: {
        vendedor: {
          select: { nombre: true, apellido: true }
        }
      }
    });

    if (metasEnRiesgo.length > 0) {
      alertasGeneradas.push({
        id: `metas-riesgo-${Date.now()}`,
        tipo: 'meta_riesgo',
        prioridad: 'media',
        titulo: `${metasEnRiesgo.length} vendedores con metas en riesgo`,
        mensaje: `${metasEnRiesgo.length} vendedores tienen menos del 70% de cumplimiento en sus metas mensuales.`,
        datos: metasEnRiesgo.map(meta => ({
          vendedor: `${meta.vendedor.nombre} ${meta.vendedor.apellido || ''}`.trim(),
          cumplimiento: meta.porcentajeCumplimiento,
          metaAutos: meta.metaAutos,
          autosVendidos: meta.autosVendidos
        })),
        accionSugerida: 'sesion_coaching',
        fechaCreacion: new Date()
      });
    }

    // 5. Alertas de grabaciones sin procesar
    const grabacionesSinProcesar = await prisma.grabacionConversacion.count({
      where: {
        procesado: false,
        fechaGrabacion: {
          lte: new Date(Date.now() - 2 * 60 * 60 * 1000) // Más de 2 horas sin procesar
        },
        ...(agenciaId && { vendedor: { agenciaId } })
      }
    });

    if (grabacionesSinProcesar > 0) {
      alertasGeneradas.push({
        id: `grabaciones-sin-procesar-${Date.now()}`,
        tipo: 'procesamiento_pendiente',
        prioridad: 'baja',
        titulo: `${grabacionesSinProcesar} grabaciones sin procesar`,
        mensaje: `Hay ${grabacionesSinProcesar} grabaciones pendientes de transcripción y análisis IA.`,
        datos: { cantidad: grabacionesSinProcesar },
        accionSugerida: 'revisar_procesamiento_ia',
        fechaCreacion: new Date()
      });
    }

    // Combinar alertas y ordenar por prioridad
    const todasLasAlertas = [
      ...alertasSistema.map(alerta => ({
        ...alerta,
        datos: alerta.datos ? JSON.parse(alerta.datos) : null
      })),
      ...alertasGeneradas
    ].sort((a, b) => {
      const prioridadOrder = { 'alta': 3, 'media': 2, 'baja': 1 };
      return (prioridadOrder[b.prioridad as keyof typeof prioridadOrder] || 0) - 
             (prioridadOrder[a.prioridad as keyof typeof prioridadOrder] || 0);
    });

    return NextResponse.json({
      alertas: todasLasAlertas,
      resumen: {
        total: todasLasAlertas.length,
        criticas: todasLasAlertas.filter(a => a.prioridad === 'alta').length,
        medias: todasLasAlertas.filter(a => a.prioridad === 'media').length,
        bajas: todasLasAlertas.filter(a => a.prioridad === 'baja').length
      },
      ultimaActualizacion: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching alerts:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// Marcar alertas como leídas
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { alertaIds } = await request.json();

    if (!alertaIds || !Array.isArray(alertaIds)) {
      return NextResponse.json({ error: 'IDs de alertas requeridos' }, { status: 400 });
    }

    // Marcar alertas como leídas
    await prisma.alertaSistema.updateMany({
      where: {
        id: { in: alertaIds },
        usuarioId: session.user.id
      },
      data: {
        leida: true,
        fechaLectura: new Date()
      }
    });

    return NextResponse.json({ message: 'Alertas marcadas como leídas' });

  } catch (error) {
    console.error('Error updating alerts:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
