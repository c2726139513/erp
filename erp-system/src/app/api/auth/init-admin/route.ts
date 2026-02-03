import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-response';
import { hashPassword } from '@/lib/auth';
import { PERMISSION_GROUPS } from '@/lib/permissions';

export async function POST(request: NextRequest) {
  try {
    const userCount = await prisma.user.count();

    if (userCount > 0) {
      return errorResponse('系统已初始化，无法创建管理员', 400);
    }

    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return errorResponse('用户名和密码不能为空');
    }

    if (password.length < 6) {
      return errorResponse('密码长度至少6位');
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        permissions: PERMISSION_GROUPS.ADMIN,
        isAdmin: true,
      },
      select: {
        id: true,
        username: true,
        permissions: true,
        isAdmin: true,
      },
    });

    return NextResponse.json(successResponse(user, '管理员账户创建成功'), { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
