
/**
 * Middleware de control de pagos y límites por agencia
 * Verifica el estado de pago y tier de servicio antes de permitir operaciones de IA
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface PaymentStatus {
  canUseService: boolean;
  reason?: string;
  agencia: {
    id: number;
    nombreAgencia: string;
    estadoPago: string;
    tierServicio: string;
    limiteGrabacionesMes: number;
    grabacionesUsadas: number;
    saldoPendiente: number;
    costosPorGrabacion: number;
    fechaUltimoPago?: Date | null;
  };
  limits: {
    monthlyLimit: number;
    used: number;
    remaining: number;
    percentage: number;
  };
  costs: {
    estimatedCost: number;
    costPerRecording: number;
    availableBalance: number;
  };
}

export interface UsageUpdate {
  grabacionesIncrement: number;
  costoGrabacion: number;
  costoTranscripcion: number;
  costoAnalisis: number;
}

/**
 * Verifica si una agencia puede usar los servicios de grabación
 */
export async function checkPaymentStatus(
  agenciaId: number,
  operationType: 'grabacion' | 'transcripcion' | 'analisis' = 'grabacion'
): Promise<PaymentStatus> {
  try {
    const agencia = await prisma.agencia.findUnique({
      where: { id: agenciaId },
      select: {
        id: true,
        nombreAgencia: true,
        estadoPago: true,
        tierServicio: true,
        limiteGrabacionesMes: true,
        grabacionesUsadas: true,
        costosPorGrabacion: true,
        saldoPendiente: true,
        fechaUltimoPago: true,
      },
    });

    if (!agencia) {
      return {
        canUseService: false,
        reason: 'Agencia no encontrada',
        agencia: {} as any,
        limits: {} as any,
        costs: {} as any,
      };
    }

    // Verificar estado de pago
    if (agencia.estadoPago === 'SUSPENDIDO') {
      return {
        canUseService: false,
        reason: 'Servicio suspendido por falta de pago. Contacte al administrador.',
        agencia: {
          ...agencia,
          costosPorGrabacion: Number(agencia.costosPorGrabacion),
          saldoPendiente: Number(agencia.saldoPendiente),
        },
        limits: {
          monthlyLimit: agencia.limiteGrabacionesMes,
          used: agencia.grabacionesUsadas,
          remaining: Math.max(0, agencia.limiteGrabacionesMes - agencia.grabacionesUsadas),
          percentage: (agencia.grabacionesUsadas / agencia.limiteGrabacionesMes) * 100,
        },
        costs: {
          estimatedCost: Number(agencia.costosPorGrabacion),
          costPerRecording: Number(agencia.costosPorGrabacion),
          availableBalance: -Number(agencia.saldoPendiente),
        },
      };
    }

    if (agencia.estadoPago === 'MOROSO') {
      return {
        canUseService: false,
        reason: 'Cuenta en estado moroso. Regularice su situación de pago para continuar.',
        agencia: {
          ...agencia,
          costosPorGrabacion: Number(agencia.costosPorGrabacion),
          saldoPendiente: Number(agencia.saldoPendiente),
        },
        limits: {
          monthlyLimit: agencia.limiteGrabacionesMes,
          used: agencia.grabacionesUsadas,
          remaining: Math.max(0, agencia.limiteGrabacionesMes - agencia.grabacionesUsadas),
          percentage: (agencia.grabacionesUsadas / agencia.limiteGrabacionesMes) * 100,
        },
        costs: {
          estimatedCost: Number(agencia.costosPorGrabacion),
          costPerRecording: Number(agencia.costosPorGrabacion),
          availableBalance: -Number(agencia.saldoPendiente),
        },
      };
    }

    // Verificar límites mensuales
    const remaining = Math.max(0, agencia.limiteGrabacionesMes - agencia.grabacionesUsadas);
    if (remaining <= 0 && operationType === 'grabacion') {
      return {
        canUseService: false,
        reason: `Límite mensual de grabaciones alcanzado (${agencia.limiteGrabacionesMes}). Upgrade su plan o espere al siguiente mes.`,
        agencia: {
          ...agencia,
          costosPorGrabacion: Number(agencia.costosPorGrabacion),
          saldoPendiente: Number(agencia.saldoPendiente),
        },
        limits: {
          monthlyLimit: agencia.limiteGrabacionesMes,
          used: agencia.grabacionesUsadas,
          remaining: 0,
          percentage: 100,
        },
        costs: {
          estimatedCost: Number(agencia.costosPorGrabacion),
          costPerRecording: Number(agencia.costosPorGrabacion),
          availableBalance: -Number(agencia.saldoPendiente),
        },
      };
    }

    // Advertencia si está cerca del límite
    const percentage = (agencia.grabacionesUsadas / agencia.limiteGrabacionesMes) * 100;
    let reason: string | undefined;
    
    if (percentage >= 90) {
      reason = `⚠️ Advertencia: Ha usado ${agencia.grabacionesUsadas} de ${agencia.limiteGrabacionesMes} grabaciones (${percentage.toFixed(1)}%). Considere hacer upgrade.`;
    } else if (percentage >= 75) {
      reason = `⚠️ Ha usado ${agencia.grabacionesUsadas} de ${agencia.limiteGrabacionesMes} grabaciones (${percentage.toFixed(1)}%).`;
    }

    return {
      canUseService: true,
      reason,
      agencia: {
        ...agencia,
        costosPorGrabacion: Number(agencia.costosPorGrabacion),
        saldoPendiente: Number(agencia.saldoPendiente),
      },
      limits: {
        monthlyLimit: agencia.limiteGrabacionesMes,
        used: agencia.grabacionesUsadas,
        remaining,
        percentage,
      },
      costs: {
        estimatedCost: Number(agencia.costosPorGrabacion),
        costPerRecording: Number(agencia.costosPorGrabacion),
        availableBalance: -Number(agencia.saldoPendiente),
      },
    };

  } catch (error) {
    console.error('Error checking payment status:', error);
    return {
      canUseService: false,
      reason: 'Error verificando estado de pago. Intente nuevamente.',
      agencia: {} as any,
      limits: {} as any,
      costs: {} as any,
    };
  }
}

/**
 * Actualiza el uso de servicios de una agencia
 */
export async function updateServiceUsage(
  agenciaId: number,
  usage: UsageUpdate
): Promise<{ success: boolean; error?: string }> {
  try {
    const agencia = await prisma.agencia.findUnique({
      where: { id: agenciaId },
    });

    if (!agencia) {
      return { success: false, error: 'Agencia no encontrada' };
    }

    // Calcular nuevo saldo pendiente
    const totalCosto = usage.costoGrabacion + usage.costoTranscripcion + usage.costoAnalisis;
    const nuevoSaldoPendiente = Number(agencia.saldoPendiente) + totalCosto;

    // Actualizar uso y costos
    await prisma.agencia.update({
      where: { id: agenciaId },
      data: {
        grabacionesUsadas: {
          increment: usage.grabacionesIncrement,
        },
        saldoPendiente: nuevoSaldoPendiente,
      },
    });

    return { success: true };

  } catch (error) {
    console.error('Error updating service usage:', error);
    return { success: false, error: 'Error actualizando uso del servicio' };
  }
}

/**
 * Reinicia contadores mensuales (para uso en tareas programadas)
 */
export async function resetMonthlyUsage(): Promise<{
  success: boolean;
  resetCount?: number;
  error?: string;
}> {
  try {
    const result = await prisma.agencia.updateMany({
      data: {
        grabacionesUsadas: 0,
      },
    });

    return {
      success: true,
      resetCount: result.count,
    };

  } catch (error) {
    console.error('Error resetting monthly usage:', error);
    return {
      success: false,
      error: 'Error reiniciando contadores mensuales',
    };
  }
}

/**
 * Suspende una agencia por falta de pago
 */
export async function suspendAgency(
  agenciaId: number,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.agencia.update({
      where: { id: agenciaId },
      data: {
        estadoPago: 'SUSPENDIDO',
      },
    });

    // Crear alerta para todos los usuarios de la agencia
    const usuarios = await prisma.user.findMany({
      where: { agenciaId },
      select: { id: true },
    });

    if (usuarios.length > 0) {
      await prisma.alertaSistema.createMany({
        data: usuarios.map(user => ({
          usuarioId: user.id,
          tipoAlerta: 'servicio_suspendido',
          prioridad: 'alta',
          titulo: 'Servicio de Grabaciones Suspendido',
          mensaje: `El servicio de grabaciones ha sido suspendido. Motivo: ${reason}`,
          datos: JSON.stringify({ agenciaId, reason, suspendedAt: new Date() }),
        })),
      });
    }

    return { success: true };

  } catch (error) {
    console.error('Error suspending agency:', error);
    return { success: false, error: 'Error suspendiendo agencia' };
  }
}

/**
 * Reactiva una agencia después de pago
 */
export async function reactivateAgency(
  agenciaId: number,
  paymentAmount: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const agencia = await prisma.agencia.findUnique({
      where: { id: agenciaId },
    });

    if (!agencia) {
      return { success: false, error: 'Agencia no encontrada' };
    }

    // Calcular nuevo saldo después del pago
    const nuevoSaldo = Math.max(0, Number(agencia.saldoPendiente) - paymentAmount);
    
    await prisma.agencia.update({
      where: { id: agenciaId },
      data: {
        estadoPago: nuevoSaldo > 0 ? 'ACTIVO' : 'ACTIVO',
        saldoPendiente: nuevoSaldo,
        fechaUltimoPago: new Date(),
      },
    });

    // Crear alerta de reactivación
    const usuarios = await prisma.user.findMany({
      where: { agenciaId },
      select: { id: true },
    });

    if (usuarios.length > 0) {
      await prisma.alertaSistema.createMany({
        data: usuarios.map(user => ({
          usuarioId: user.id,
          tipoAlerta: 'servicio_reactivado',
          prioridad: 'media',
          titulo: 'Servicio de Grabaciones Reactivado',
          mensaje: `El servicio de grabaciones ha sido reactivado. Pago procesado: $${paymentAmount}`,
          datos: JSON.stringify({ agenciaId, paymentAmount, reactivatedAt: new Date() }),
        })),
      });
    }

    return { success: true };

  } catch (error) {
    console.error('Error reactivating agency:', error);
    return { success: false, error: 'Error reactivando agencia' };
  }
}

/**
 * Actualiza el tier de servicio de una agencia
 */
export async function updateServiceTier(
  agenciaId: number,
  newTier: 'BASICO' | 'PROFESIONAL' | 'PREMIUM'
): Promise<{ success: boolean; error?: string }> {
  try {
    // Mapear límites por tier
    const tierLimits = {
      BASICO: parseInt(process.env.LIMIT_BASICO_GRABACIONES_MES || '100'),
      PROFESIONAL: parseInt(process.env.LIMIT_PROFESIONAL_GRABACIONES_MES || '500'),
      PREMIUM: parseInt(process.env.LIMIT_PREMIUM_GRABACIONES_MES || '2000'),
    };

    // Costos por tier (ajustar según política de precios)
    const tierCosts = {
      BASICO: 2.50,
      PROFESIONAL: 2.00,
      PREMIUM: 1.50,
    };

    await prisma.agencia.update({
      where: { id: agenciaId },
      data: {
        tierServicio: newTier,
        limiteGrabacionesMes: tierLimits[newTier],
        costosPorGrabacion: tierCosts[newTier],
      },
    });

    return { success: true };

  } catch (error) {
    console.error('Error updating service tier:', error);
    return { success: false, error: 'Error actualizando tier de servicio' };
  }
}

/**
 * Genera reporte de facturación para una agencia
 */
export async function generateBillingReport(
  agenciaId: number,
  mes: number,
  year: number
): Promise<{
  success: boolean;
  report?: {
    agencia: string;
    periodo: string;
    grabacionesRealizadas: number;
    costoTotal: number;
    desglose: {
      grabaciones: number;
      transcripciones: number;
      analisis: number;
      almacenamiento: number;
    };
  };
  error?: string;
}> {
  try {
    const agencia = await prisma.agencia.findUnique({
      where: { id: agenciaId },
      select: {
        nombreAgencia: true,
        grabacionesUsadas: true,
        costosPorGrabacion: true,
      },
    });

    if (!agencia) {
      return { success: false, error: 'Agencia no encontrada' };
    }

    // Obtener grabaciones del mes
    const startDate = new Date(year, mes - 1, 1);
    const endDate = new Date(year, mes, 0, 23, 59, 59);

    const grabaciones = await prisma.grabacionConversacion.findMany({
      where: {
        vendedor: {
          agenciaId,
        },
        fechaGrabacion: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        costoTranscripcion: true,
        costoAnalisis: true,
      },
    });

    const grabacionesCount = grabaciones.length;
    const costoGrabaciones = grabacionesCount * Number(agencia.costosPorGrabacion);
    const costoTranscripciones = grabaciones.reduce((sum, g) => sum + Number(g.costoTranscripcion || 0), 0);
    const costoAnalisis = grabaciones.reduce((sum, g) => sum + Number(g.costoAnalisis || 0), 0);
    const costoAlmacenamiento = grabacionesCount * 0.10; // $0.10 por grabación almacenada

    const costoTotal = costoGrabaciones + costoTranscripciones + costoAnalisis + costoAlmacenamiento;

    return {
      success: true,
      report: {
        agencia: agencia.nombreAgencia,
        periodo: `${mes.toString().padStart(2, '0')}/${year}`,
        grabacionesRealizadas: grabacionesCount,
        costoTotal,
        desglose: {
          grabaciones: costoGrabaciones,
          transcripciones: costoTranscripciones,
          analisis: costoAnalisis,
          almacenamiento: costoAlmacenamiento,
        },
      },
    };

  } catch (error) {
    console.error('Error generating billing report:', error);
    return { success: false, error: 'Error generando reporte de facturación' };
  }
}

/**
 * Middleware para APIs que requieren verificación de pago
 */
export function withPaymentGuard(
  handler: Function,
  operationType: 'grabacion' | 'transcripcion' | 'analisis' = 'grabacion'
) {
  return async (req: any, res: any) => {
    try {
      // Extraer agenciaId de la sesión o request
      const agenciaId = req.user?.agenciaId || req.body?.agenciaId || req.query?.agenciaId;
      
      if (!agenciaId) {
        return res.status(400).json({
          error: 'ID de agencia requerido',
          code: 'MISSING_AGENCY_ID',
        });
      }

      // Verificar estado de pago
      const paymentStatus = await checkPaymentStatus(Number(agenciaId), operationType);
      
      if (!paymentStatus.canUseService) {
        return res.status(403).json({
          error: paymentStatus.reason,
          code: 'PAYMENT_REQUIRED',
          paymentStatus,
        });
      }

      // Agregar información de pago al request
      req.paymentStatus = paymentStatus;
      
      // Continuar con el handler original
      return handler(req, res);

    } catch (error) {
      console.error('Error in payment guard middleware:', error);
      return res.status(500).json({
        error: 'Error verificando estado de pago',
        code: 'PAYMENT_CHECK_ERROR',
      });
    }
  };
}

/**
 * Obtiene estadísticas de uso global
 */
export async function getGlobalUsageStats(): Promise<{
  success: boolean;
  stats?: {
    totalAgencies: number;
    activeAgencies: number;
    suspendedAgencies: number;
    totalRecordings: number;
    totalRevenue: number;
    averageUsagePerAgency: number;
    topTierDistribution: {
      BASICO: number;
      PROFESIONAL: number;
      PREMIUM: number;
    };
  };
  error?: string;
}> {
  try {
    const agencias = await prisma.agencia.findMany({
      select: {
        estadoPago: true,
        tierServicio: true,
        grabacionesUsadas: true,
        saldoPendiente: true,
      },
    });

    const totalRecordings = await prisma.grabacionConversacion.count();
    const totalAgencies = agencias.length;
    const activeAgencies = agencias.filter(a => a.estadoPago === 'ACTIVO').length;
    const suspendedAgencies = agencias.filter(a => a.estadoPago === 'SUSPENDIDO').length;
    const totalRevenue = agencias.reduce((sum, a) => sum + Number(a.saldoPendiente), 0);
    const averageUsagePerAgency = totalAgencies > 0 ? 
      agencias.reduce((sum, a) => sum + a.grabacionesUsadas, 0) / totalAgencies : 0;

    const topTierDistribution = {
      BASICO: agencias.filter(a => a.tierServicio === 'BASICO').length,
      PROFESIONAL: agencias.filter(a => a.tierServicio === 'PROFESIONAL').length,
      PREMIUM: agencias.filter(a => a.tierServicio === 'PREMIUM').length,
    };

    return {
      success: true,
      stats: {
        totalAgencies,
        activeAgencies,
        suspendedAgencies,
        totalRecordings,
        totalRevenue,
        averageUsagePerAgency,
        topTierDistribution,
      },
    };

  } catch (error) {
    console.error('Error getting global usage stats:', error);
    return {
      success: false,
      error: 'Error obteniendo estadísticas globales',
    };
  }
}
