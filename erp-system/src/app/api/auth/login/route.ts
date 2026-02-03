import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-response';
import { verifyPassword, generateToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return errorResponse('用户名和密码不能为空');
    }

    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        password: true,
        permissions: true,
        isAdmin: true,
      },
    });

    if (!user) {
      return errorResponse('用户名或密码错误');
    }

    const isValidPassword = await verifyPassword(password, user.password);

    if (!isValidPassword) {
      return errorResponse('用户名或密码错误');
    }

    const token = generateToken({
      userId: user.id,
      username: user.username,
      permissions: user.permissions,
      isAdmin: user.isAdmin,
    });

    const response = NextResponse.json(successResponse({
      user: {
        id: user.id,
        username: user.username,
        permissions: user.permissions,
        isAdmin: user.isAdmin,
      },
      token,
    }, '登录成功'));

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
