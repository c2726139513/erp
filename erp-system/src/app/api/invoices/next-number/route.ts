import { NextResponse } from 'next/server';
import { generateNextNumber } from '@/lib/number-generator';
import { successResponse, handleApiError } from '@/lib/api-response';

export async function GET() {
  try {
    const nextNumber = await generateNextNumber('invoice');
    return NextResponse.json(successResponse({ nextNumber }));
  } catch (error) {
    return handleApiError(error);
  }
}
