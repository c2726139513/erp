import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const userCount = await prisma.user.count();
    return NextResponse.json({
      success: true,
      hasUsers: userCount > 0,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: '检查失败',
    }, { status: 500 });
  }
}
