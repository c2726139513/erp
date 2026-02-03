import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-response';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        client: true,
        contract: true,
        invoice: true,
      },
    });

    if (!payment) {
      return errorResponse('收付款记录不存在', 404);
    }

    return NextResponse.json(successResponse(payment));
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
    const { id } = await params;

    const payment = await prisma.payment.update({
      where: { id },
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

    return NextResponse.json(successResponse(payment, '收付款记录更新成功'));
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
    await prisma.payment.delete({
      where: { id },
    });

    return NextResponse.json(successResponse(null, '收付款记录删除成功'));
  } catch (error) {
    return handleApiError(error);
  }
}
