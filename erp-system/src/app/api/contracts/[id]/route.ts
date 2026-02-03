import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-response';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const contract = await prisma.contract.findUnique({
      where: { id },
      include: {
        client: true,
        project: true,
        invoices: true,
        payments: true,
      },
    });

    if (!contract) {
      return errorResponse('合同不存在', 404);
    }

    return NextResponse.json(successResponse(contract));
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
      contractNumber,
      title,
      clientId,
      projectId,
      amount,
      status,
      contractType,
      startDate,
      endDate,
      description,
    } = body;
    const { id } = await params;

    const contract = await prisma.contract.update({
      where: { id },
      data: {
        contractNumber,
        title,
        clientId,
        projectId: projectId || null,
        amount: parseFloat(amount),
        status,
        contractType,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        description,
      },
      include: {
        client: true,
        project: true,
      },
    });

    return NextResponse.json(successResponse(contract, '合同更新成功'));
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
    await prisma.contract.delete({
      where: { id },
    });

    return NextResponse.json(successResponse(null, '合同删除成功'));
  } catch (error) {
    return handleApiError(error);
  }
}
