import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const clientId = searchParams.get('clientId');
    const contractId = searchParams.get('contractId');
    const invoiceType = searchParams.get('invoiceType');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where: any = {};

    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search } },
        { client: { name: { contains: search } } },
        { contract: { title: { contains: search } } },
        { contract: { project: { name: { contains: search } } } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (clientId) {
      where.clientId = clientId;
    }

    if (contractId) {
      where.contractId = contractId;
    }

    if (invoiceType && (invoiceType === 'ISSUED' || invoiceType === 'RECEIVED')) {
      where.invoiceType = invoiceType;
    }

    if (startDate || endDate) {
      where.invoiceDate = {};
      if (startDate) {
        where.invoiceDate.gte = new Date(startDate);
      }
      if (endDate) {
        where.invoiceDate.lte = new Date(endDate);
      }
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        client: true,
        contract: {
          include: {
            project: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(successResponse(invoices));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      invoiceNumber,
      contractId,
      clientId,
      amount,
      taxAmount,
      totalAmount,
      status,
      invoiceType,
      invoiceDate,
      dueDate,
      description,
      notes,
    } = body;

    if (!invoiceNumber || !clientId || !amount || !totalAmount) {
      return errorResponse('缺少必填字段');
    }

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        contractId,
        clientId,
        amount: parseFloat(amount),
        taxAmount: parseFloat(taxAmount) || 0,
        totalAmount: parseFloat(totalAmount),
        status: status || 'DRAFT',
        invoiceType: invoiceType || 'RECEIVED',
        invoiceDate: new Date(invoiceDate),
        dueDate: dueDate ? new Date(dueDate) : null,
        description,
        notes,
      },
      include: {
        client: true,
        contract: true,
      },
    });

    return NextResponse.json(successResponse(invoice, '发票创建成功'), { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
