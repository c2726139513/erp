import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-response';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        client: true,
        contract: true,
        payments: true,
      },
    });

    if (!invoice) {
      return errorResponse('发票不存在', 404);
    }

    return NextResponse.json(successResponse(invoice));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const {
      invoiceNumber,
      contractId,
      clientId,
      amount,
      taxAmount,
      status,
      invoiceType,
      invoiceDate,
      dueDate,
      description,
      notes,
    } = body;
    const { id } = await params;

    const invoice = await prisma.invoice.update({
      where: { id },
      data: {
        invoiceNumber,
        contractId,
        clientId,
        amount: parseFloat(amount),
        taxAmount: parseFloat(taxAmount) || 0,
        status,
        invoiceType,
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

    return NextResponse.json(successResponse(invoice, '发票更新成功'));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.invoice.delete({
      where: { id },
    });

    return NextResponse.json(successResponse(null, '发票删除成功'));
  } catch (error) {
    return handleApiError(error);
  }
}
