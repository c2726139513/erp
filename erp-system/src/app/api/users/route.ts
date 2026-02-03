import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-response';
import { hashPassword } from '@/lib/auth';
import { PERMISSIONS, PERMISSION_GROUPS } from '@/lib/permissions';

export async function GET(request: NextRequest) {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        permissions: true,
        isAdmin: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(successResponse(users));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password, permissions, isAdmin } = body;

    if (!username || !password) {
      return errorResponse('用户名和密码不能为空');
    }

    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return errorResponse('用户名已存在');
    }

    if (!permissions || !Array.isArray(permissions)) {
      return errorResponse('权限设置无效');
    }

    const allPermissions = Object.values(PERMISSIONS);
    const invalidPermissions = permissions.filter((p: string) => !allPermissions.includes(p as (typeof allPermissions)[number]));

    if (invalidPermissions.length > 0) {
      return errorResponse(`无效的权限: ${invalidPermissions.join(', ')}`);
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        permissions,
        isAdmin: isAdmin || false,
      },
      select: {
        id: true,
        username: true,
        permissions: true,
        isAdmin: true,
        createdAt: true,
      },
    });

    return NextResponse.json(successResponse(user, '用户创建成功'), { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
