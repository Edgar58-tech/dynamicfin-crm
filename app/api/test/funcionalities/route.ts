
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('🔧 Iniciando pruebas de funcionalidad...');
    
    const tests = {
      database: false,
      pilaresSPCC: false,
      prospectos: false,
      usuarios: false,
      crmConfig: false,
      rolePlay: false
    };

    const results: any = {};

    // 1. TEST BASE DE DATOS
    try {
      const dbTest = await prisma.agencia.count();
      tests.database = true;
      results.database = {
        status: 'OK',
        agenciasCount: dbTest,
        message: 'Conexión a base de datos exitosa'
      };
      console.log('✅ Database test passed');
    } catch (error) {
      results.database = {
        status: 'ERROR',
        error: (error as Error).message
      };
      console.log('❌ Database test failed:', error);
    }

    // 2. TEST PILARES SPCC
    try {
      const pilares = await prisma.pilar.findMany({
        where: { activo: true }
      });
      
      const totalPeso = pilares.reduce((sum, p) => sum + Number(p.pesoEstrategico), 0);
      
      tests.pilaresSPCC = pilares.length === 15 && Math.abs(totalPeso - 1.0) < 0.1;
      results.pilaresSPCC = {
        status: tests.pilaresSPCC ? 'OK' : 'WARNING',
        pilaresCount: pilares.length,
        pesoTotal: totalPeso,
        esperado: 15,
        message: tests.pilaresSPCC ? 
          'Sistema SPCC configurado correctamente' : 
          `Solo ${pilares.length} pilares encontrados, peso total: ${totalPeso}`
      };
      console.log('✅ SPCC Pillars test passed');
    } catch (error) {
      results.pilaresSPCC = {
        status: 'ERROR',
        error: (error as Error).message
      };
      console.log('❌ SPCC Pillars test failed:', error);
    }

    // 3. TEST PROSPECTOS
    try {
      const prospectos = await prisma.prospecto.findMany({
        include: {
          calificaciones: true
        },
        take: 5
      });
      
      tests.prospectos = prospectos.length > 0;
      
      const prospectosConCalificacion = prospectos.filter(p => 
        p.calificaciones && p.calificaciones.length > 0
      );
      
      results.prospectos = {
        status: 'OK',
        totalProspectos: prospectos.length,
        prospectosConSPCC: prospectosConCalificacion.length,
        muestraClasificaciones: prospectos.map(p => ({
          id: p.id,
          nombre: `${p.nombre} ${p.apellido}`,
          clasificacion: p.clasificacion,
          spccScore: Number(p.calificacionTotal)
        }))
      };
      console.log('✅ Prospects test passed');
    } catch (error) {
      results.prospectos = {
        status: 'ERROR',
        error: (error as Error).message
      };
      console.log('❌ Prospects test failed:', error);
    }

    // 4. TEST USUARIOS
    try {
      const usuarios = await prisma.user.groupBy({
        by: ['rol'],
        _count: { rol: true }
      });
      
      tests.usuarios = usuarios.length > 0;
      results.usuarios = {
        status: 'OK',
        distribuciones: usuarios.map(u => ({
          rol: u.rol,
          cantidad: u._count.rol
        })),
        totalUsuarios: usuarios.reduce((sum, u) => sum + u._count.rol, 0)
      };
      console.log('✅ Users test passed');
    } catch (error) {
      results.usuarios = {
        status: 'ERROR',
        error: (error as Error).message
      };
      console.log('❌ Users test failed:', error);
    }

    // 5. TEST CONFIGURACIÓN CRM
    try {
      const crmConfigs = await prisma.crmConfiguration.findMany({
        where: { activo: true },
        include: {
          _count: {
            select: { 
              mapeosCampos: true,
              logsSync: true
            }
          }
        }
      });
      
      tests.crmConfig = crmConfigs.length > 0;
      results.crmConfig = {
        status: 'OK',
        configuracionesActivas: crmConfigs.length,
        detalles: crmConfigs.map(crm => ({
          nombre: crm.nombre,
          tipo: crm.crmTipo,
          activo: crm.activo,
          fieldMappings: crm._count.mapeosCampos,
          syncLogs: crm._count.logsSync,
          ultimaSincronizacion: crm.ultimaSincronizacion
        }))
      };
      console.log('✅ CRM Config test passed');
    } catch (error) {
      results.crmConfig = {
        status: 'ERROR',
        error: (error as Error).message
      };
      console.log('❌ CRM Config test failed:', error);
    }

    // 6. TEST ROLE PLAY
    try {
      const scenarios = await prisma.rolePlayScenario.findMany({
        where: { activo: true }
      });
      
      tests.rolePlay = scenarios.length > 0;
      results.rolePlay = {
        status: 'OK',
        escenariosActivos: scenarios.length,
        categorias: [...new Set(scenarios.map(s => s.categoria))],
        nivelosDificultad: [...new Set(scenarios.map(s => s.nivelDificultad))]
      };
      console.log('✅ Role Play test passed');
    } catch (error) {
      results.rolePlay = {
        status: 'ERROR',
        error: (error as Error).message
      };
      console.log('❌ Role Play test failed:', error);
    }

    // RESUMEN FINAL
    const totalTests = Object.keys(tests).length;
    const passedTests = Object.values(tests).filter(t => t === true).length;
    const failedTests = totalTests - passedTests;

    const overallStatus = failedTests === 0 ? 'SUCCESS' : 
                         failedTests <= 2 ? 'PARTIAL_SUCCESS' : 'FAILURE';

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      overallStatus,
      summary: {
        totalTests,
        passed: passedTests,
        failed: failedTests,
        successRate: `${Math.round((passedTests / totalTests) * 100)}%`
      },
      testResults: results,
      systemHealth: {
        database: tests.database ? 'HEALTHY' : 'ERROR',
        spccSystem: tests.pilaresSPCC ? 'HEALTHY' : 'WARNING',
        prospectManagement: tests.prospectos ? 'HEALTHY' : 'ERROR',
        userManagement: tests.usuarios ? 'HEALTHY' : 'ERROR',
        crmIntegration: tests.crmConfig ? 'HEALTHY' : 'WARNING',
        rolePlaySystem: tests.rolePlay ? 'HEALTHY' : 'WARNING'
      },
      recommendations: generateRecommendations(tests, results)
    });

  } catch (error: any) {
    console.error('❌ Test suite failed:', error);
    return NextResponse.json({
      overallStatus: 'CRITICAL_FAILURE',
      error: 'Test suite could not complete',
      details: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

function generateRecommendations(tests: any, results: any): string[] {
  const recommendations = [];

  if (!tests.database) {
    recommendations.push('🔴 CRÍTICO: Verificar conexión a base de datos');
  }

  if (!tests.pilaresSPCC) {
    recommendations.push('🟡 IMPORTANTE: Sistema SPCC requiere ajustes - verificar 15 pilares con peso total 1.0');
  }

  if (!tests.prospectos) {
    recommendations.push('🟡 ADVERTENCIA: No hay prospectos de prueba - ejecutar script de seeding');
  }

  if (!tests.usuarios) {
    recommendations.push('🟡 ADVERTENCIA: Sistema de usuarios no configurado correctamente');
  }

  if (!tests.crmConfig) {
    recommendations.push('🟠 OPCIONAL: Configurar integraciones CRM para sincronización completa');
  }

  if (!tests.rolePlay) {
    recommendations.push('🟠 OPCIONAL: Agregar escenarios de Role Play para entrenamiento');
  }

  if (Object.values(tests).every(t => t === true)) {
    recommendations.push('✅ EXCELENTE: Todos los sistemas funcionan correctamente');
    recommendations.push('💡 LISTO PARA PRODUCCIÓN: El CRM está completamente funcional');
  }

  return recommendations;
}

// POST endpoint para ejecutar tests específicos
export async function POST(request: NextRequest) {
  try {
    const { testType } = await request.json();
    
    let result: any = {};
    
    switch (testType) {
      case 'spcc_calculation':
        // Test de cálculo SPCC
        result = await testSPCCCalculation();
        break;
      
      case 'crm_sync':
        // Test de sincronización CRM
        result = await testCRMSync();
        break;
        
      case 'recording_processing':
        // Test de procesamiento de grabaciones
        result = await testRecordingProcessing();
        break;
        
      default:
        return NextResponse.json({ 
          error: 'Tipo de test no válido',
          availableTests: ['spcc_calculation', 'crm_sync', 'recording_processing']
        }, { status: 400 });
    }
    
    return NextResponse.json({
      testType,
      timestamp: new Date().toISOString(),
      result
    });
    
  } catch (error: any) {
    return NextResponse.json({
      error: 'Error ejecutando test específico',
      details: error.message
    }, { status: 500 });
  }
}

async function testSPCCCalculation() {
  try {
    // Obtener un prospecto con calificaciones
    const prospecto = await prisma.prospecto.findFirst({
      where: {
        calificacionTotal: { gt: 0 }
      },
      include: {
        calificaciones: {
          include: {
            pilar: true
          }
        }
      }
    });

    if (!prospecto) {
      return {
        status: 'NO_DATA',
        message: 'No hay prospectos con calificaciones SPCC'
      };
    }

    // Recalcular puntaje manualmente
    const puntajeCalculado = prospecto.calificaciones.reduce((total, cal) => {
      return total + (cal.puntajeObtenido * Number(cal.pilar.pesoEstrategico));
    }, 0);

    const diferencia = Math.abs(Number(prospecto.calificacionTotal) - puntajeCalculado);
    const esConsistente = diferencia < 0.01; // Margen de error mínimo

    return {
      status: esConsistente ? 'OK' : 'ERROR',
      prospectoId: prospecto.id,
      nombreProspecto: `${prospecto.nombre} ${prospecto.apellido}`,
      puntajeAlmacenado: Number(prospecto.calificacionTotal),
      puntajeCalculado: puntajeCalculado,
      diferencia: diferencia,
      esConsistente,
      detalleCalificaciones: prospecto.calificaciones.map(cal => ({
        pilar: cal.pilar.nombrePilar,
        puntaje: cal.puntajeObtenido,
        peso: Number(cal.pilar.pesoEstrategico),
        contribucion: cal.puntajeObtenido * Number(cal.pilar.pesoEstrategico)
      }))
    };

  } catch (error) {
    return {
      status: 'ERROR',
      error: (error as Error).message
    };
  }
}

async function testCRMSync() {
  try {
    // Verificar configuraciones CRM
    const configs = await prisma.crmConfiguration.findMany({
      where: { activo: true }
    });

    if (configs.length === 0) {
      return {
        status: 'NO_CONFIG',
        message: 'No hay configuraciones CRM activas'
      };
    }

    // Obtener logs recientes
    const recentLogs = await prisma.crmSyncLog.findMany({
      where: {
        fechaInicio: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Últimas 24 horas
        }
      },
      orderBy: { fechaInicio: 'desc' },
      take: 10,
      include: {
        crmConfiguration: {
          select: { nombre: true, crmTipo: true }
        }
      }
    });

    return {
      status: 'OK',
      configuracionesActivas: configs.length,
      logsRecientes: recentLogs.length,
      ultimasSincronizaciones: recentLogs.map(log => ({
        crm: log.crmConfiguration.nombre,
        tipo: log.crmConfiguration.crmTipo,
        operacion: log.tipoOperacion,
        estado: log.estadoSync,
        fecha: log.fechaInicio,
        registrosProcesados: log.registrosProcesados
      }))
    };

  } catch (error) {
    return {
      status: 'ERROR',
      error: (error as Error).message
    };
  }
}

async function testRecordingProcessing() {
  try {
    // Verificar grabaciones procesadas
    const grabaciones = await prisma.grabacionConversacion.findMany({
      where: {
        fechaGrabacion: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Última semana
        }
      },
      orderBy: { fechaGrabacion: 'desc' },
      take: 10
    });

    const totalGrabaciones = grabaciones.length;
    const procesadas = grabaciones.filter(g => g.procesado).length;
    const conTranscripcion = grabaciones.filter(g => g.transcripcion).length;
    const conAnalisis = grabaciones.filter(g => g.analisisIA).length;

    return {
      status: totalGrabaciones > 0 ? 'OK' : 'NO_DATA',
      totalGrabaciones,
      procesadas,
      conTranscripcion,
      conAnalisis,
      tasaProcesamiento: totalGrabaciones > 0 ? (procesadas / totalGrabaciones) * 100 : 0,
      promedioScore: grabaciones.length > 0 ? 
        grabaciones.reduce((sum, g) => sum + (g.scoreConversacion || 0), 0) / grabaciones.length : 0,
      distribucimCalidad: {
        excelente: grabaciones.filter(g => g.calidad === 'EXCELENTE').length,
        buena: grabaciones.filter(g => g.calidad === 'BUENA').length,
        regular: grabaciones.filter(g => g.calidad === 'REGULAR').length,
        mala: grabaciones.filter(g => g.calidad === 'MALA').length
      }
    };

  } catch (error) {
    return {
      status: 'ERROR',
      error: (error as Error).message
    };
  }
}
