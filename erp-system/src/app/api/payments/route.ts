import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const paymentType = searchParams.get('paymentType');
    const clientId = searchParams.get('clientId');
    const contractId = searchParams.get('contractId');
    const invoiceId = searchParams.get('invoiceId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where: any = {};

    if (search) {
      where.OR = [
        { paymentNumber: { contains: search } },
        { client: { name: { contains: search } } },
        { contract: { title: { contains: search } } },
        { contract: { project: { name: { contains: search } } } },
      ];
    }

    if (paymentType) {
      where.paymentType = paymentType;
    }

    if (clientId) {
      where.clientId = clientId;
    }

    if (contractId) {
      where.contractId = contractId;
    }

    if (invoiceId) {
      where.invoiceId = invoiceId;
    }

    if (startDate || endDate) {
      where.paymentDate = {};
      if (startDate) {
        where.paymentDate.gte = new Date(startDate);
      }
      if (endDate) {
        where.paymentDate.lte = new Date(endDate);
      }
    }

    const payments = await prisma.payment.findMany({
      where,
      include: {
        client: true,
        contract: {
          include: {
            project: true,
          },
        },
        invoice: true,
      },
      orderBy: { paymentDate: 'desc' },
    });

    return NextResponse.json(successResponse(payments));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      paymentNumber,
      invoiceId,
      contractId,
      clientId,
      amount,
      paymentType,
      paymentMethod,
      paymentDate,
      bankAccount,
      referenceNumber,
      notes,
    } = body;

    if (!paymentNumber || !clientId || !amount || !paymentType || !paymentMethod) {
      return errorResponse('缺少必填字段');
    }

    const payment = await prisma.payment.create({
      data: {
        paymentNumber,
        invoiceId,
        contractId,
        clientId,
        amount: parseFloat(amount),
        paymentType,
        paymentMethod,
        paymentDate: new Date(paymentDate),
        bankAccount,
        referenceNumber,
        notes,
      },
      include: {
        client: true,
        contract: true,
        invoice: true,
      },
    });

    return NextResponse.json(successResponse(payment, '收付款记录创建成功'), { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
