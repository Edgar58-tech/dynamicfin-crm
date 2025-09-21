import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { 
  checkPaymentStatus, 
  updateServiceUsage, 
  generateBillingReport,
  suspendAgency,
  reactivateAgency,
  updateServiceTier,
  getGlobalUsageStats
} from '@/lib/payment-guard';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const agenciaId = searchParams.get('agenciaId');
    const mes = searchParams.get('mes');
    const year = searchParams.get('year');

    switch (action) {
      case 'status':
        if (!agenciaId) {
          return NextResponse.json({ error: 'ID de agencia requerido' }, { status: 400 });
        }
        const status = await checkPaymentStatus(parseInt(agenciaId));
        return NextResponse.json({ success: true, status });

      case 'billing-report':
        if (!agenciaId || !mes || !year) {
          return NextResponse.json({ error: 'Parámetros requeridos: agenciaId, mes, year' }, { status: 400 });
        }
        const report = await generateBillingReport(
          parseInt(agenciaId),
          parseInt(mes),
          parseInt(year)
        );
        return NextResponse.json({ success: true, report });

      case 'global-stats':
        // Solo para super admins
        if (session.user.rol !== 'DYNAMICFIN_ADMIN') {
          return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
        }
        const stats = await getGlobalUsageStats();
        return NextResponse.json({ success: true, stats });

      case 'agency-invoices':
        if (!agenciaId) {
          return NextResponse.json({ error: 'ID de agencia requerido' }, { status: 400 });
        }
        
        const facturas = await prisma.factura.findMany({
          where: { agenciaId: parseInt(agenciaId) },
          orderBy: { fechaGeneracion: 'desc' },
          take: 12, // Últimas 12 facturas
        });

        return NextResponse.json({ success: true, facturas });

      case 'pending-payments':
        // Solo para super admins
        if (session.user.rol !== 'DYNAMICFIN_ADMIN') {
          return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
        }

        const pendingPayments = await prisma.agencia.findMany({
          where: {
            OR: [
              { estadoPago: 'MOROSO' },
              { estadoPago: 'SUSPENDIDO' },
              { saldoPendiente: { gt: 0 } }
            ]
          },
          include: {
            marca: true,
            facturas: {
              where: { estatus: 'PENDIENTE' },
              orderBy: { fechaVencimiento: 'asc' }
            }
          },
          orderBy: { saldoPendiente: 'desc' }
        });

        return NextResponse.json({ success: true, pendingPayments });

      default:
        return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
    }

  } catch (error) {
    console.error('Error in payments API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'update-usage':
        const { agenciaId, usage } = body;
        if (!agenciaId || !usage) {
          return NextResponse.json({ error: 'Parámetros requeridos' }, { status: 400 });
        }

        const updateResult = await updateServiceUsage(agenciaId, usage);
        return NextResponse.json({ success: updateResult.success, result: updateResult });

      case 'process-payment':
        // Solo para super admins
        if (session.user.rol !== 'DYNAMICFIN_ADMIN') {
          return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
        }

        const { agenciaId: paymentAgenciaId, amount, paymentMethod, reference } = body;
        if (!paymentAgenciaId || !amount) {
          return NextResponse.json({ error: 'Parámetros requeridos' }, { status: 400 });
        }

        // Reactivar agencia después del pago
        const reactivateResult = await reactivateAgency(paymentAgenciaId, amount);
        
        if (reactivateResult.success) {
          // Crear registro de pago
          await prisma.factura.updateMany({
            where: {
              agenciaId: paymentAgenciaId,
              estatus: 'PENDIENTE'
            },
            data: {
              estatus: 'PAGADA',
              fechaPago: new Date(),
              metodoPago: paymentMethod || 'transferencia',
              comprobantePago: reference || null
            }
          });
        }

        return NextResponse.json({ success: reactivateResult.success, result: reactivateResult });

      case 'suspend-agency':
        // Solo para super admins
        if (session.user.rol !== 'DYNAMICFIN_ADMIN') {
          return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
        }

        const { agenciaId: suspendAgenciaId, reason } = body;
        if (!suspendAgenciaId || !reason) {
          return NextResponse.json({ error: 'Parámetros requeridos' }, { status: 400 });
        }

        const suspendResult = await suspendAgency(suspendAgenciaId, reason);
        return NextResponse.json({ success: suspendResult.success, result: suspendResult });

      case 'update-tier':
        // Solo para super admins
        if (session.user.rol !== 'DYNAMICFIN_ADMIN') {
          return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
        }

        const { agenciaId: tierAgenciaId, newTier } = body;
        if (!tierAgenciaId || !newTier) {
          return NextResponse.json({ error: 'Parámetros requeridos' }, { status: 400 });
        }

        const tierResult = await updateServiceTier(tierAgenciaId, newTier);
        return NextResponse.json({ success: tierResult.success, result: tierResult });

      case 'generate-invoice':
        // Solo para super admins
        if (session.user.rol !== 'DYNAMICFIN_ADMIN') {
          return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
        }

        const { agenciaId: invoiceAgenciaId, mes: invoiceMes, year: invoiceYear } = body;
        if (!invoiceAgenciaId || !invoiceMes || !invoiceYear) {
          return NextResponse.json({ error: 'Parámetros requeridos' }, { status: 400 });
        }

        // Generar reporte de facturación
        const billingReport = await generateBillingReport(
          invoiceAgenciaId,
          invoiceMes,
          invoiceYear
        );

        if (billingReport.success && billingReport.report) {
          // Crear factura en la base de datos
          const numeroFactura = `FAC-${invoiceYear}-${invoiceMes.toString().padStart(2, '0')}-${invoiceAgenciaId.toString().padStart(4, '0')}`;
          
          const factura = await prisma.factura.create({
            data: {
              agenciaId: invoiceAgenciaId,
              numeroFactura,
              mes: invoiceMes,
              year: invoiceYear,
              fechaVencimiento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
              grabacionesRealizadas: billingReport.report.grabacionesRealizadas,
              costoPorGrabacion: billingReport.report.desglose.grabaciones / billingReport.report.grabacionesRealizadas || 0,
              costoTranscripciones: billingReport.report.desglose.transcripciones,
              costoAnalisisIA: billingReport.report.desglose.analisis,
              costoAlmacenamiento: billingReport.report.desglose.almacenamiento,
              subtotal: billingReport.report.costoTotal * 0.84, // Sin IVA
              impuestos: billingReport.report.costoTotal * 0.16, // 16% IVA
              total: billingReport.report.costoTotal,
              detalleServicios: JSON.stringify(billingReport.report.desglose),
            }
          });

          return NextResponse.json({ success: true, factura, report: billingReport.report });
        }

        return NextResponse.json({ success: false, error: 'Error generando reporte de facturación' });

      default:
        return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
    }

  } catch (error) {
    console.error('Error in payments POST API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
