import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-response';
import { hashPassword } from '@/lib/auth';
import { PERMISSIONS } from '@/lib/permissions';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        permissions: true,
        isAdmin: true,
        createdAt: true,
      },
    });

    if (!user) {
      return errorResponse('用户不存在', 404);
    }

    return NextResponse.json(successResponse(user));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { username, password, permissions, isAdmin } = body;

    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return errorResponse('用户不存在', 404);
    }

    if (username && username !== existingUser.username) {
      const hasDuplicate = await prisma.user.findUnique({
        where: { username },
      });

      if (hasDuplicate) {
        return errorResponse('用户名已存在');
      }
    }

    const allPermissions = Object.values(PERMISSIONS);
    const updateData: any = {};

    if (username) updateData.username = username;
    if (password) updateData.password = await hashPassword(password);
    if (permissions && Array.isArray(permissions)) {
      const invalidPermissions = permissions.filter((p: string) => !allPermissions.includes(p as (typeof allPermissions)[number]));
      if (invalidPermissions.length > 0) {
        return errorResponse(`无效的权限: ${invalidPermissions.join(', ')}`);
      }
      updateData.permissions = permissions;
    }
    if (isAdmin !== undefined) updateData.isAdmin = isAdmin;

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        username: true,
        permissions: true,
        isAdmin: true,
        createdAt: true,
      },
    });

    return NextResponse.json(successResponse(user, '用户更新成功'));
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

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return errorResponse('用户不存在', 404);
    }

    const userCount = await prisma.user.count();

    if (userCount <= 1) {
      return errorResponse('不能删除最后一个用户');
    }

    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json(successResponse(null, '用户删除成功'));
  } catch (error) {
    return handleApiError(error);
  }
}
