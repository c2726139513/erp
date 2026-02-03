import { NextRequest, NextResponse } from 'next/server';
import { writeFile, copyFile, access } from 'fs/promises';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { requireAdmin } from '@/lib/auth';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-response';

const prisma = new PrismaClient();
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const user = requireAdmin(request);
    if (!user) {
      return errorResponse('需要管理员权限', 403);
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return errorResponse('请选择要上传的文件');
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return errorResponse('只支持上传图片文件（JPEG、PNG、GIF、WebP）');
    }

    if (file.size > MAX_FILE_SIZE) {
      return errorResponse('文件大小不能超过5MB');
    }

    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = path.extname(file.name);
    const fileName = `${timestamp}-${randomString}${fileExtension}`;

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const filePath = path.join(process.cwd(), 'public', 'uploads', fileName);
    await writeFile(filePath, buffer);

    const fileUrl = `/uploads/${fileName}`;

    const appDir = path.join(process.cwd(), 'src', 'app');
    const faviconPath = path.join(appDir, 'favicon.ico');
    const faviconBackupPath = path.join(appDir, 'favicon.ico.bak');

    try {
      await access(faviconPath);
      await copyFile(faviconPath, faviconBackupPath);
    } catch (error) {
      console.log('No existing favicon to backup');
    }

    await copyFile(filePath, faviconPath);

    return NextResponse.json(successResponse({ url: fileUrl }, '文件上传成功'));
  } catch (error) {
    return handleApiError(error);
  }
}
