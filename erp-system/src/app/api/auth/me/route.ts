import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return errorResponse('未登录', 401);
    }

    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

    try {
      const payload = jwt.verify(token, JWT_SECRET) as { userId: string };

      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
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
      return errorResponse('无效的token', 401);
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 });
  }
}
