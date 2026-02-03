import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const clientType = searchParams.get('clientType');

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { contactName: { contains: search } },
        { phone: { contains: search } },
        { email: { contains: search } },
      ];
    }

    if (clientType && (clientType === 'CUSTOMER' || clientType === 'SUPPLIER')) {
      where.clientType = clientType;
    }

    const clients = await prisma.client.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(successResponse(clients));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, contactName, phone, email, address, clientType } = body;

    if (!name) {
      return errorResponse('客户名称不能为空');
    }

    const client = await prisma.client.create({
      data: {
        name,
        contactName,
        phone,
        email,
        address,
        clientType: clientType || 'CUSTOMER',
      },
    });

    return NextResponse.json(successResponse(client, '客户创建成功'), { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
