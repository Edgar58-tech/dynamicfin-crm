/**
 * Sistema de Balanceo Automático de Guardias
 * Valida y balancea la distribución de guardias entre vendedores
 */

import { PrismaClient } from '@prisma/client';
import { startOfMonth, endOfMonth, format, getDay, eachDayOfInterval } from 'date-fns';

const prisma = new PrismaClient();

export interface GuardiaBalance {
  vendedorId: string;
  nombre: string;
  totalGuardias: number;
  sabados: number;
  domingos: number;
  diasSemana: number;
  cargaActual: number;
  disponible: boolean;
}

export interface BalanceValidation {
  isBalanced: boolean;
  issues: string[];
  suggestions: string[];
  balanceReport: GuardiaBalance[];
  statistics: {
    totalGuardias: number;
    promedioGuardias: number;
    desviacionMaxima: number;
    sabadosBalanceados: boolean;
    domingosBalanceados: boolean;
  };
}

export interface GuardiaAssignment {
  fecha: Date;
  vendedorId: string;
  tipo: 'SABADO' | 'DOMINGO' | 'SEMANA';
  justificacion: string;
}

/**
 * Valida el balance actual de guardias para un mes específico
 */
export async function validateGuardiaBalance(
  agenciaId: number,
  mes: number,
  year: number
): Promise<BalanceValidation> {
  try {
    const startDate = startOfMonth(new Date(year, mes - 1));
    const endDate = endOfMonth(new Date(year, mes - 1));

    // Obtener vendedores activos de la agencia
    const vendedores = await prisma.user.findMany({
      where: {
        agenciaId,
        rol: 'VENDEDOR',
        activo: true,
      },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        cargaProspectos: true,
      },
    });

    if (vendedores.length === 0) {
      return {
        isBalanced: false,
        issues: ['No hay vendedores activos en la agencia'],
        suggestions: ['Agregar vendedores activos a la agencia'],
        balanceReport: [],
        statistics: {
          totalGuardias: 0,
          promedioGuardias: 0,
          desviacionMaxima: 0,
          sabadosBalanceados: false,
          domingosBalanceados: false,
        },
      };
    }

    // Obtener guardias existentes del mes
    const guardias = await prisma.vendedorGuardia.findMany({
      where: {
        vendedor: { agenciaId },
        fecha: {
          gte: startDate,
          lte: endDate,
        },
        activo: true,
      },
      include: {
        vendedor: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
          },
        },
      },
    });

    // Calcular balance por vendedor
    const balanceReport: GuardiaBalance[] = vendedores.map(vendedor => {
      const guardiasVendedor = guardias.filter(g => g.vendedorId === vendedor.id);
      
      const sabados = guardiasVendedor.filter(g => getDay(g.fecha) === 6).length;
      const domingos = guardiasVendedor.filter(g => getDay(g.fecha) === 0).length;
      const diasSemana = guardiasVendedor.length - sabados - domingos;

      return {
        vendedorId: vendedor.id,
        nombre: `${vendedor.nombre} ${vendedor.apellido}`,
        totalGuardias: guardiasVendedor.length,
        sabados,
        domingos,
        diasSemana,
        cargaActual: vendedor.cargaProspectos,
        disponible: vendedor.cargaProspectos < 15, // Límite configurable
      };
    });

    // Calcular estadísticas
    const totalGuardias = balanceReport.reduce((sum, b) => sum + b.totalGuardias, 0);
    const promedioGuardias = totalGuardias / vendedores.length;
    const desviaciones = balanceReport.map(b => Math.abs(b.totalGuardias - promedioGuardias));
    const desviacionMaxima = Math.max(...desviaciones);

    // Validar balance de sábados y domingos
    const sabadosCounts = balanceReport.map(b => b.sabados);
    const domingosCounts = balanceReport.map(b => b.domingos);
    
    const sabadosBalanceados = Math.max(...sabadosCounts) - Math.min(...sabadosCounts) <= 1;
    const domingosBalanceados = Math.max(...domingosCounts) - Math.min(...domingosCounts) <= 1;

    // Identificar problemas
    const issues: string[] = [];
    const suggestions: string[] = [];

    if (desviacionMaxima > 3) {
      issues.push(`Desbalance significativo: diferencia máxima de ${desviacionMaxima.toFixed(1)} guardias`);
      suggestions.push('Redistribuir guardias para equilibrar la carga');
    }

    if (!sabadosBalanceados) {
      issues.push('Sábados no están balanceados entre vendedores');
      suggestions.push('Redistribuir guardias de sábado equitativamente');
    }

    if (!domingosBalanceados) {
      issues.push('Domingos no están balanceados entre vendedores');
      suggestions.push('Redistribuir guardias de domingo equitativamente');
    }

    // Verificar vendedores sobrecargados
    const sobrecargados = balanceReport.filter(b => b.totalGuardias > promedioGuardias + 3);
    if (sobrecargados.length > 0) {
      issues.push(`Vendedores sobrecargados: ${sobrecargados.map(s => s.nombre).join(', ')}`);
      suggestions.push('Reasignar guardias de vendedores sobrecargados');
    }

    // Verificar vendedores con poca carga
    const subcargados = balanceReport.filter(b => b.totalGuardias < promedioGuardias - 3);
    if (subcargados.length > 0) {
      suggestions.push(`Asignar más guardias a: ${subcargados.map(s => s.nombre).join(', ')}`);
    }

    const isBalanced = issues.length === 0;

    return {
      isBalanced,
      issues,
      suggestions,
      balanceReport,
      statistics: {
        totalGuardias,
        promedioGuardias,
        desviacionMaxima,
        sabadosBalanceados,
        domingosBalanceados,
      },
    };

  } catch (error) {
    console.error('Error validating guardia balance:', error);
    throw new Error('Error validando balance de guardias');
  }
}

/**
 * Genera una propuesta de asignación balanceada para un mes
 */
export async function generateBalancedAssignment(
  agenciaId: number,
  mes: number,
  year: number
): Promise<{
  success: boolean;
  assignments: GuardiaAssignment[];
  validation: BalanceValidation;
  error?: string;
}> {
  try {
    const startDate = startOfMonth(new Date(year, mes - 1));
    const endDate = endOfMonth(new Date(year, mes - 1));

    // Obtener vendedores disponibles
    const vendedores = await prisma.user.findMany({
      where: {
        agenciaId,
        rol: 'VENDEDOR',
        activo: true,
        cargaProspectos: { lt: 15 }, // Solo vendedores no sobrecargados
      },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        cargaProspectos: true,
      },
      orderBy: {
        cargaProspectos: 'asc', // Priorizar vendedores con menos carga
      },
    });

    if (vendedores.length === 0) {
      return {
        success: false,
        assignments: [],
        validation: await validateGuardiaBalance(agenciaId, mes, year),
        error: 'No hay vendedores disponibles para asignar guardias',
      };
    }

    // Obtener todos los días del mes
    const diasDelMes = eachDayOfInterval({ start: startDate, end: endDate });
    
    // Separar por tipo de día
    const sabados = diasDelMes.filter(dia => getDay(dia) === 6);
    const domingos = diasDelMes.filter(dia => getDay(dia) === 0);
    const diasSemana = diasDelMes.filter(dia => getDay(dia) >= 1 && getDay(dia) <= 5);

    const assignments: GuardiaAssignment[] = [];

    // Asignar sábados balanceadamente
    let vendedorIndex = 0;
    for (const sabado of sabados) {
      const vendedor = vendedores[vendedorIndex % vendedores.length];
      assignments.push({
        fecha: sabado,
        vendedorId: vendedor.id,
        tipo: 'SABADO',
        justificacion: `Asignación balanceada - Sábado ${format(sabado, 'dd/MM')}`,
      });
      vendedorIndex++;
    }

    // Asignar domingos balanceadamente (empezar desde diferente índice)
    vendedorIndex = Math.floor(vendedores.length / 2);
    for (const domingo of domingos) {
      const vendedor = vendedores[vendedorIndex % vendedores.length];
      assignments.push({
        fecha: domingo,
        vendedorId: vendedor.id,
        tipo: 'DOMINGO',
        justificacion: `Asignación balanceada - Domingo ${format(domingo, 'dd/MM')}`,
      });
      vendedorIndex++;
    }

    // Asignar días de semana (distribución equitativa)
    vendedorIndex = 0;
    for (const diaSemana of diasSemana) {
      const vendedor = vendedores[vendedorIndex % vendedores.length];
      assignments.push({
        fecha: diaSemana,
        vendedorId: vendedor.id,
        tipo: 'SEMANA',
        justificacion: `Asignación balanceada - ${format(diaSemana, 'EEEE dd/MM')}`,
      });
      vendedorIndex++;
    }

    // Validar la propuesta
    const validation = await validateProposedAssignment(agenciaId, assignments);

    return {
      success: true,
      assignments,
      validation,
    };

  } catch (error) {
    console.error('Error generating balanced assignment:', error);
    return {
      success: false,
      assignments: [],
      validation: await validateGuardiaBalance(agenciaId, mes, year),
      error: 'Error generando asignación balanceada',
    };
  }
}

/**
 * Valida una propuesta de asignación antes de aplicarla
 */
async function validateProposedAssignment(
  agenciaId: number,
  assignments: GuardiaAssignment[]
): Promise<BalanceValidation> {
  // Simular la asignación para validar balance
  const vendedorStats = new Map<string, {
    totalGuardias: number;
    sabados: number;
    domingos: number;
    diasSemana: number;
  }>();

  // Obtener nombres de vendedores
  const vendedorIds = [...new Set(assignments.map(a => a.vendedorId))];
  const vendedores = await prisma.user.findMany({
    where: { id: { in: vendedorIds } },
    select: { id: true, nombre: true, apellido: true, cargaProspectos: true },
  });

  const vendedorMap = new Map(vendedores.map(v => [v.id, v]));

  // Calcular estadísticas de la propuesta
  for (const assignment of assignments) {
    if (!vendedorStats.has(assignment.vendedorId)) {
      vendedorStats.set(assignment.vendedorId, {
        totalGuardias: 0,
        sabados: 0,
        domingos: 0,
        diasSemana: 0,
      });
    }

    const stats = vendedorStats.get(assignment.vendedorId)!;
    stats.totalGuardias++;

    switch (assignment.tipo) {
      case 'SABADO':
        stats.sabados++;
        break;
      case 'DOMINGO':
        stats.domingos++;
        break;
      case 'SEMANA':
        stats.diasSemana++;
        break;
    }
  }

  // Crear reporte de balance
  const balanceReport: GuardiaBalance[] = [];
  for (const [vendedorId, stats] of vendedorStats) {
    const vendedor = vendedorMap.get(vendedorId);
    if (vendedor) {
      balanceReport.push({
        vendedorId,
        nombre: `${vendedor.nombre} ${vendedor.apellido}`,
        totalGuardias: stats.totalGuardias,
        sabados: stats.sabados,
        domingos: stats.domingos,
        diasSemana: stats.diasSemana,
        cargaActual: vendedor.cargaProspectos,
        disponible: true,
      });
    }
  }

  // Calcular estadísticas
  const totalGuardias = balanceReport.reduce((sum, b) => sum + b.totalGuardias, 0);
  const promedioGuardias = totalGuardias / balanceReport.length;
  const desviaciones = balanceReport.map(b => Math.abs(b.totalGuardias - promedioGuardias));
  const desviacionMaxima = Math.max(...desviaciones);

  const sabadosCounts = balanceReport.map(b => b.sabados);
  const domingosCounts = balanceReport.map(b => b.domingos);
  
  const sabadosBalanceados = Math.max(...sabadosCounts) - Math.min(...sabadosCounts) <= 1;
  const domingosBalanceados = Math.max(...domingosCounts) - Math.min(...domingosCounts) <= 1;

  const issues: string[] = [];
  const suggestions: string[] = [];

  if (desviacionMaxima > 2) {
    issues.push(`La propuesta tiene desbalance: diferencia máxima de ${desviacionMaxima.toFixed(1)} guardias`);
  }

  if (!sabadosBalanceados) {
    issues.push('Los sábados no están perfectamente balanceados en la propuesta');
  }

  if (!domingosBalanceados) {
    issues.push('Los domingos no están perfectamente balanceados en la propuesta');
  }

  if (issues.length === 0) {
    suggestions.push('La propuesta está perfectamente balanceada y lista para aplicar');
  }

  return {
    isBalanced: issues.length === 0,
    issues,
    suggestions,
    balanceReport,
    statistics: {
      totalGuardias,
      promedioGuardias,
      desviacionMaxima,
      sabadosBalanceados,
      domingosBalanceados,
    },
  };
}

/**
 * Aplica una asignación de guardias después de la confirmación del gerente
 */
export async function applyGuardiaAssignment(
  agenciaId: number,
  assignments: GuardiaAssignment[],
  gerenteId: string,
  observaciones?: string
): Promise<{
  success: boolean;
  applied: number;
  errors: string[];
}> {
  try {
    let applied = 0;
    const errors: string[] = [];

    for (const assignment of assignments) {
      try {
        await prisma.vendedorGuardia.upsert({
          where: {
            vendedorId_fecha: {
              vendedorId: assignment.vendedorId,
              fecha: assignment.fecha,
            },
          },
          update: {
            activo: true,
            observaciones: assignment.justificacion,
            creadoPor: gerenteId,
          },
          create: {
            vendedorId: assignment.vendedorId,
            fecha: assignment.fecha,
            activo: true,
            observaciones: assignment.justificacion,
            creadoPor: gerenteId,
          },
        });
        applied++;
      } catch (error) {
        errors.push(`Error asignando guardia ${format(assignment.fecha, 'dd/MM')}: ${error}`);
      }
    }

    // Crear alerta de balance aplicado
    if (applied > 0) {
      const gerente = await prisma.user.findUnique({
        where: { id: gerenteId },
        select: { nombre: true, apellido: true },
      });

      await prisma.alertaSistema.create({
        data: {
          usuarioId: gerenteId,
          tipoAlerta: 'guardias_balanceadas',
          prioridad: 'media',
          titulo: 'Guardias Balanceadas Aplicadas',
          mensaje: `Se aplicaron ${applied} asignaciones de guardia balanceadas para la agencia.`,
          datos: JSON.stringify({
            agenciaId,
            assignmentsApplied: applied,
            errors: errors.length,
            observaciones,
            appliedBy: gerente ? `${gerente.nombre} ${gerente.apellido}` : 'Sistema',
          }),
        },
      });
    }

    return {
      success: errors.length === 0,
      applied,
      errors,
    };

  } catch (error) {
    console.error('Error applying guardia assignment:', error);
    return {
      success: false,
      applied: 0,
      errors: ['Error general aplicando asignaciones de guardia'],
    };
  }
}

/**
 * Obtiene estadísticas de guardias para el dashboard
 */
export async function getGuardiaStats(
  agenciaId: number,
  mes: number,
  year: number
): Promise<{
  totalVendedores: number;
  vendedoresConGuardias: number;
  totalGuardias: number;
  promedioGuardiasPorVendedor: number;
  balanceScore: number; // 0-100, donde 100 es perfectamente balanceado
  alertasActivas: number;
  proximasGuardias: Array<{
    fecha: Date;
    vendedor: string;
    tipo: string;
  }>;
}> {
  try {
    const validation = await validateGuardiaBalance(agenciaId, mes, year);
    
    // Calcular score de balance (0-100)
    let balanceScore = 100;
    if (validation.statistics.desviacionMaxima > 0) {
      balanceScore = Math.max(0, 100 - (validation.statistics.desviacionMaxima * 10));
    }
    if (!validation.statistics.sabadosBalanceados) balanceScore -= 10;
    if (!validation.statistics.domingosBalanceados) balanceScore -= 10;

    // Obtener próximas guardias (próximos 7 días)
    const hoy = new Date();
    const proximasSemana = new Date(hoy.getTime() + 7 * 24 * 60 * 60 * 1000);

    const proximasGuardias = await prisma.vendedorGuardia.findMany({
      where: {
        vendedor: { agenciaId },
        fecha: {
          gte: hoy,
          lte: proximasSemana,
        },
        activo: true,
      },
      include: {
        vendedor: {
          select: { nombre: true, apellido: true },
        },
      },
      orderBy: { fecha: 'asc' },
      take: 10,
    });

    // Contar alertas activas relacionadas con guardias
    const alertasActivas = await prisma.alertaDesbalance.count({
      where: {
        usuario: { agenciaId },
        estadoAlerta: 'ACTIVA',
        tipoDesbalance: { in: ['CARGA_ALTA', 'CARGA_DESIGUAL'] },
      },
    });

    return {
      totalVendedores: validation.balanceReport.length,
      vendedoresConGuardias: validation.balanceReport.filter(b => b.totalGuardias > 0).length,
      totalGuardias: validation.statistics.totalGuardias,
      promedioGuardiasPorVendedor: validation.statistics.promedioGuardias,
      balanceScore,
      alertasActivas,
      proximasGuardias: proximasGuardias.map(g => ({
        fecha: g.fecha,
        vendedor: `${g.vendedor.nombre} ${g.vendedor.apellido}`,
        tipo: getDay(g.fecha) === 6 ? 'Sábado' : getDay(g.fecha) === 0 ? 'Domingo' : 'Día de semana',
      })),
    };

  } catch (error) {
    console.error('Error getting guardia stats:', error);
    return {
      totalVendedores: 0,
      vendedoresConGuardias: 0,
      totalGuardias: 0,
      promedioGuardiasPorVendedor: 0,
      balanceScore: 0,
      alertasActivas: 0,
      proximasGuardias: [],
    };
  }
}

/**
 * Detecta y crea alertas de desbalance automáticamente
 */
export async function detectAndCreateBalanceAlerts(
  agenciaId: number
): Promise<{ alertsCreated: number; errors: string[] }> {
  try {
    const hoy = new Date();
    const mes = hoy.getMonth() + 1;
    const year = hoy.getFullYear();

    const validation = await validateGuardiaBalance(agenciaId, mes, year);
    
    if (validation.isBalanced) {
      return { alertsCreated: 0, errors: [] };
    }

    // Obtener gerentes de la agencia para notificar
    const gerentes = await prisma.user.findMany({
      where: {
        agenciaId,
        rol: { in: ['GERENTE_GENERAL', 'GERENTE_VENTAS'] },
        activo: true,
      },
    });

    let alertsCreated = 0;
    const errors: string[] = [];

    for (const gerente of gerentes) {
      try {
        // Verificar si ya existe una alerta activa similar
        const existingAlert = await prisma.alertaDesbalance.findFirst({
          where: {
            usuarioId: gerente.id,
            tipoDesbalance: 'CARGA_DESIGUAL',
            estadoAlerta: 'ACTIVA',
            fechaDeteccion: {
              gte: new Date(hoy.getTime() - 24 * 60 * 60 * 1000), // Últimas 24 horas
            },
          },
        });

        if (!existingAlert) {
          await prisma.alertaDesbalance.create({
            data: {
              usuarioId: gerente.id,
              tipoDesbalance: 'CARGA_DESIGUAL',
              diferenciaDetectada: Math.floor(validation.statistics.desviacionMaxima),
              umbralConfigurado: 3,
              sugerenciaAccion: 'redistribuir',
              datosDesbalance: JSON.stringify({
                issues: validation.issues,
                suggestions: validation.suggestions,
                statistics: validation.statistics,
                balanceReport: validation.balanceReport,
              }),
              observaciones: `Desbalance detectado automáticamente: ${validation.issues.join(', ')}`,
            },
          });
          alertsCreated++;
        }
      } catch (error) {
        errors.push(`Error creando alerta para ${gerente.nombre}: ${error}`);
      }
    }

    return { alertsCreated, errors };

  } catch (error) {
    console.error('Error detecting balance alerts:', error);
    return { alertsCreated: 0, errors: ['Error general detectando alertas de balance'] };
  }
}
