
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Solo vendedores y administradores pueden acceder a escenarios
    if (!['VENDEDOR', 'GERENTE_VENTAS', 'GERENTE_GENERAL', 'DIRECTOR_MARCA', 'DIRECTOR_GENERAL', 'DYNAMICFIN_ADMIN'].includes(session.user.rol)) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const categoria = searchParams.get('categoria');
    const dificultad = searchParams.get('dificultad');
    const activos = searchParams.get('activos') !== 'false';

    const where: any = { activo: activos };
    
    if (categoria) {
      where.categoria = categoria;
    }
    
    if (dificultad) {
      where.nivelDificultad = dificultad;
    }

    // Intentar obtener de la base de datos
    let escenarios = await prisma.rolePlayScenario.findMany({
      where,
      orderBy: [
        { categoria: 'asc' },
        { nivelDificultad: 'asc' },
        { fechaCreacion: 'desc' }
      ]
    });

    // Si no hay escenarios en la base de datos, crear algunos por defecto
    if (escenarios.length === 0) {
      const escenariosDefecto = [
        {
          titulo: 'Familia Buscando Minivan - Presupuesto Ajustado',
          descripcion: 'Matrimonio con 3 hijos pequeños necesita cambiar su sedán por una minivan. Necesidad urgente por crecimiento familiar.',
          categoria: 'PROSPECTACION',
          tipoCliente: 'Familia joven con hijos pequeños',
          vehiculoInteres: 'Minivan',
          presupuesto: 280000,
          nivelDificultad: 'PRINCIPIANTE',
          duracionEstimada: 25,
          activo: true,
          configuracionIA: {
            personalidad: 'Prácticos, buscan funcionalidad',
            presupuesto_max: 300000,
            objeciones_principales: ['precio', 'financiamiento', 'espacio']
          }
        },
        {
          titulo: 'Empresario Exitoso - SUV Premium',
          descripcion: 'Empresario de alto perfil busca SUV premium para uso personal y empresarial.',
          categoria: 'CIERRE',
          tipoCliente: 'Empresario exitoso',
          vehiculoInteres: 'SUV Premium',
          presupuesto: 800000,
          nivelDificultad: 'AVANZADO',
          duracionEstimada: 35,
          activo: true,
          configuracionIA: {
            personalidad: 'Exigente, valora el estatus',
            presupuesto_max: 1000000,
            objeciones_principales: ['tiempo', 'comparación_competencia']
          }
        },
        {
          titulo: 'Cliente Indeciso - Primera Compra',
          descripcion: 'Joven profesional comprando su primer auto. Muy indeciso entre diferentes opciones.',
          categoria: 'MANEJO_OBJECIONES',
          tipoCliente: 'Joven profesional',
          vehiculoInteres: 'Sedán compacto',
          presupuesto: 350000,
          nivelDificultad: 'INTERMEDIO',
          duracionEstimada: 30,
          activo: true,
          configuracionIA: {
            personalidad: 'Indeciso, necesita mucha información',
            presupuesto_max: 400000,
            objeciones_principales: ['indecision', 'precio', 'comparacion']
          }
        }
      ];

      // Crear escenarios por defecto
      for (const escenario of escenariosDefecto) {
        await prisma.rolePlayScenario.create({
          data: escenario
        });
      }

      // Volver a obtener los escenarios
      escenarios = await prisma.rolePlayScenario.findMany({
        where,
        orderBy: [
          { categoria: 'asc' },
          { nivelDificultad: 'asc' },
          { fechaCreacion: 'desc' }
        ]
      });
    }

    return NextResponse.json({ escenarios }, { status: 200 });

  } catch (error) {
    console.error('Error al obtener escenarios:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
