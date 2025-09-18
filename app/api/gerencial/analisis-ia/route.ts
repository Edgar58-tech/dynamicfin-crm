
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
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());

    // Obtener análisis de grabaciones procesadas
    const grabacionesProcesadas = await prisma.grabacionConversacion.findMany({
      where: {
        procesado: true,
        analisisIA: { not: null },
        fechaGrabacion: { gte: startOfMonth },
        ...(agenciaId && { vendedor: { agenciaId } })
      },
      include: {
        vendedor: {
          select: {
            id: true,
            nombre: true,
            apellido: true
          }
        },
        prospecto: {
          select: {
            clasificacion: true,
            calificacionTotal: true,
            estatus: true
          }
        }
      }
    });

    // Procesar análisis de IA y extraer insights
    const insightsIA = {
      // Estadísticas generales de grabaciones
      totalGrabacionesProcesadas: grabacionesProcesadas.length,
      tiempoPromedioLlamadas: 0,
      scorePromedioConversacion: 0,
      
      // Análisis por vendedor
      rendimientoPorVendedor: [] as any[],
      
      // Palabras clave más efectivas
      palabrasClaveEfectivas: [] as any[],
      
      // Objeciones más comunes
      objecionesComunes: [] as any[],
      
      // Mejores horarios para llamar
      mejoresHorarios: [] as any[],
      
      // Análisis de sentimiento
      analisisSentimiento: {
        positivo: 0,
        neutro: 0,
        negativo: 0
      },
      
      // Recomendaciones automáticas
      recomendaciones: [] as any[]
    };

    if (grabacionesProcesadas.length > 0) {
      // Calcular tiempo promedio
      insightsIA.tiempoPromedioLlamadas = Math.round(
        grabacionesProcesadas.reduce((acc, g) => acc + (g.duracion || 0), 0) / grabacionesProcesadas.length / 60
      );

      // Calcular score promedio
      const scoresValidos = grabacionesProcesadas.filter(g => g.scoreConversacion).map(g => g.scoreConversacion!);
      insightsIA.scorePromedioConversacion = scoresValidos.length > 0 
        ? Math.round(scoresValidos.reduce((acc, score) => acc + score, 0) / scoresValidos.length)
        : 0;

      // Análisis por vendedor
      const vendedoresMap = new Map();
      grabacionesProcesadas.forEach(grabacion => {
        const vendedorId = grabacion.vendedorId;
        if (!vendedoresMap.has(vendedorId)) {
          vendedoresMap.set(vendedorId, {
            vendedorId,
            nombre: `${grabacion.vendedor.nombre} ${grabacion.vendedor.apellido || ''}`.trim(),
            grabaciones: 0,
            scorePromedio: 0,
            duracionPromedio: 0,
            ventasGeneradas: 0,
            scores: [] as number[]
          });
        }
        
        const vendedor = vendedoresMap.get(vendedorId);
        vendedor.grabaciones++;
        vendedor.duracionPromedio += (grabacion.duracion || 0);
        if (grabacion.scoreConversacion) {
          vendedor.scores.push(grabacion.scoreConversacion);
        }
        if (grabacion.prospecto?.estatus === 'Vendido') {
          vendedor.ventasGeneradas++;
        }
      });

      // Finalizar cálculos de vendedores
      insightsIA.rendimientoPorVendedor = Array.from(vendedoresMap.values()).map(vendedor => ({
        ...vendedor,
        scorePromedio: vendedor.scores.length > 0 
          ? Math.round(vendedor.scores.reduce((acc: number, score: number) => acc + score, 0) / vendedor.scores.length)
          : 0,
        duracionPromedio: Math.round(vendedor.duracionPromedio / vendedor.grabaciones / 60),
        tasaConversion: vendedor.grabaciones > 0 
          ? Math.round((vendedor.ventasGeneradas / vendedor.grabaciones) * 100)
          : 0
      })).sort((a, b) => b.scorePromedio - a.scorePromedio);

      // Análisis de palabras clave (simulado - en producción se extraería del análisis IA real)
      const palabrasClaveComunes = [
        { palabra: 'precio', frecuencia: 0, efectividad: 0 },
        { palabra: 'financiamiento', frecuencia: 0, efectividad: 0 },
        { palabra: 'garantía', frecuencia: 0, efectividad: 0 },
        { palabra: 'descuento', frecuencia: 0, efectividad: 0 },
        { palabra: 'promoción', frecuencia: 0, efectividad: 0 }
      ];

      // Simular extracción de palabras clave del análisis IA
      grabacionesProcesadas.forEach(grabacion => {
        if (grabacion.palabrasClave) {
          try {
            const palabras = JSON.parse(grabacion.palabrasClave);
            if (Array.isArray(palabras)) {
              palabras.forEach((palabra: string) => {
                const palabraClave = palabrasClaveComunes.find(p => palabra.toLowerCase().includes(p.palabra));
                if (palabraClave) {
                  palabraClave.frecuencia++;
                  if (grabacion.prospecto?.estatus === 'Vendido') {
                    palabraClave.efectividad++;
                  }
                }
              });
            }
          } catch (e) {
            // Ignorar errores de parsing JSON
          }
        }
      });

      insightsIA.palabrasClaveEfectivas = palabrasClaveComunes
        .filter(p => p.frecuencia > 0)
        .map(p => ({
          ...p,
          tasaEfectividad: p.frecuencia > 0 ? Math.round((p.efectividad / p.frecuencia) * 100) : 0
        }))
        .sort((a, b) => b.tasaEfectividad - a.tasaEfectividad);

      // Análisis de sentimiento
      grabacionesProcesadas.forEach(grabacion => {
        const sentimiento = grabacion.sentimientoGeneral;
        if (sentimiento === 'positivo') insightsIA.analisisSentimiento.positivo++;
        else if (sentimiento === 'negativo') insightsIA.analisisSentimiento.negativo++;
        else insightsIA.analisisSentimiento.neutro++;
      });

      // Análisis de horarios
      const horariosMap = new Map();
      grabacionesProcesadas.forEach(grabacion => {
        const hora = grabacion.fechaGrabacion.getHours();
        const rangoHora = `${hora}:00-${hora + 1}:00`;
        
        if (!horariosMap.has(rangoHora)) {
          horariosMap.set(rangoHora, { horario: rangoHora, llamadas: 0, ventas: 0 });
        }
        
        const horario = horariosMap.get(rangoHora);
        horario.llamadas++;
        if (grabacion.prospecto?.estatus === 'Vendido') {
          horario.ventas++;
        }
      });

      insightsIA.mejoresHorarios = Array.from(horariosMap.values())
        .map(h => ({
          ...h,
          tasaConversion: h.llamadas > 0 ? Math.round((h.ventas / h.llamadas) * 100) : 0
        }))
        .sort((a, b) => b.tasaConversion - a.tasaConversion)
        .slice(0, 5);

      // Generar recomendaciones automáticas
      const recomendaciones = [];
      
      // Recomendación por bajo score promedio
      if (insightsIA.scorePromedioConversacion < 70) {
        recomendaciones.push({
          tipo: 'mejora_tecnica',
          prioridad: 'alta',
          titulo: 'Score promedio de conversaciones bajo',
          descripcion: `El score promedio es ${insightsIA.scorePromedioConversacion}%. Se recomienda implementar sesiones de coaching.`,
          accion: 'programar_coaching_equipo'
        });
      }

      // Recomendación por llamadas cortas
      if (insightsIA.tiempoPromedioLlamadas < 3) {
        recomendaciones.push({
          tipo: 'duracion_llamadas',
          prioridad: 'media',
          titulo: 'Llamadas muy cortas detectadas',
          descripcion: `Promedio de ${insightsIA.tiempoPromedioLlamadas} minutos. Considerar entrenamiento en técnicas de retención.`,
          accion: 'capacitacion_duracion_llamadas'
        });
      }

      // Recomendación por sentimiento negativo alto
      const totalSentimientos = insightsIA.analisisSentimiento.positivo + insightsIA.analisisSentimiento.neutro + insightsIA.analisisSentimiento.negativo;
      const porcentajeNegativo = totalSentimientos > 0 ? (insightsIA.analisisSentimiento.negativo / totalSentimientos) * 100 : 0;
      
      if (porcentajeNegativo > 30) {
        recomendaciones.push({
          tipo: 'sentimiento_cliente',
          prioridad: 'alta',
          titulo: 'Alto porcentaje de sentimientos negativos',
          descripcion: `${Math.round(porcentajeNegativo)}% de conversaciones con sentimiento negativo. Revisar approach de ventas.`,
          accion: 'revisar_scripts_ventas'
        });
      }

      insightsIA.recomendaciones = recomendaciones;
    }

    // Obtener estadísticas de costos de IA
    const costosIA = await prisma.grabacionConversacion.aggregate({
      where: {
        fechaGrabacion: { gte: startOfMonth },
        procesado: true,
        ...(agenciaId && { vendedor: { agenciaId } })
      },
      _sum: {
        costoTranscripcion: true,
        costoAnalisis: true
      },
      _avg: {
        costoTranscripcion: true,
        costoAnalisis: true
      },
      _count: {
        id: true
      }
    });

    const analisisCompleto = {
      ...insightsIA,
      costosIA: {
        totalTranscripcion: Number(costosIA._sum.costoTranscripcion || 0),
        totalAnalisis: Number(costosIA._sum.costoAnalisis || 0),
        promedioTranscripcion: Number(costosIA._avg.costoTranscripcion || 0),
        promedioAnalisis: Number(costosIA._avg.costoAnalisis || 0),
        totalProcesadas: costosIA._count.id,
        costoPromedioPorGrabacion: costosIA._count.id > 0 
          ? (Number(costosIA._sum.costoTranscripcion || 0) + Number(costosIA._sum.costoAnalisis || 0)) / costosIA._count.id
          : 0
      },
      fechaAnalisis: today.toISOString()
    };

    return NextResponse.json(analisisCompleto);

  } catch (error) {
    console.error('Error fetching AI analysis:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
