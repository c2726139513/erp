import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-response';
import { copyFile, access, unlink } from 'fs/promises';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    let settings = await prisma.systemSettings.findFirst();

    if (!settings) {
      settings = await prisma.systemSettings.create({
        data: {
          companyName: '我的公司',
        },
      });
    }

    return NextResponse.json(successResponse(settings));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = requireAdmin(request);
    if (!user) {
      console.log('权限检查失败：用户不是管理员');
      return errorResponse('需要管理员权限', 403);
    }

    const body = await request.json();
    const { companyName, logoUrl } = body;

    if (!companyName || companyName.trim() === '') {
      return errorResponse('公司名称不能为空');
    }

    let settings = await prisma.systemSettings.findFirst();

    if (!settings) {
      settings = await prisma.systemSettings.create({
        data: {
          companyName: companyName.trim(),
          logoUrl,
        },
      });
    } else {
      settings = await prisma.systemSettings.update({
        where: { id: settings.id },
        data: {
          companyName: companyName.trim(),
          logoUrl,
        },
      });
    }

    return NextResponse.json(successResponse(settings, '系统设置更新成功'));
  } catch (error) {
    console.error('系统设置更新失败:', error);
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = requireAdmin(request);
    if (!user) {
      return errorResponse('需要管理员权限', 403);
    }

    const settings = await prisma.systemSettings.findFirst();

    if (!settings) {
      return errorResponse('系统设置不存在', 404);
    }

    const appDir = path.join(process.cwd(), 'src', 'app');
    const faviconPath = path.join(appDir, 'favicon.ico');
    const faviconBackupPath = path.join(appDir, 'favicon.ico.bak');

    try {
      await access(faviconBackupPath);
      await copyFile(faviconBackupPath, faviconPath);
    } catch (error) {
      console.log('No backup favicon to restore');
    }

    const updatedSettings = await prisma.systemSettings.update({
      where: { id: settings.id },
      data: {
        logoUrl: null,
      },
    });

    return NextResponse.json(successResponse(updatedSettings, '公司LOGO删除成功'));
  } catch (error) {
    console.error('公司LOGO删除失败:', error);
    return handleApiError(error);
  }
}
