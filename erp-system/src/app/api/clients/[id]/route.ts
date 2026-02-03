import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-response';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        contracts: true,
        invoices: true,
        payments: true,
      },
    });

    if (!client) {
      return errorResponse('客户不存在', 404);
    }

    return NextResponse.json(successResponse(client));
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
    const { name, contactName, phone, email, address, clientType } = body;
    const { id } = await params;

    const client = await prisma.client.update({
      where: { id },
      data: {
        name,
        contactName,
        phone,
        email,
        address,
        clientType: clientType || 'CUSTOMER',
      },
    });

    return NextResponse.json(successResponse(client, '客户更新成功'));
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
    await prisma.client.delete({
      where: { id },
    });

    return NextResponse.json(successResponse(null, '客户删除成功'));
  } catch (error) {
    return handleApiError(error);
  }
}
