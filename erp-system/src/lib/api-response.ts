export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export function successResponse<T>(data: T, message?: string): ApiResponse<T> {
  return {
    success: true,
    data,
    message,
  };
}

export function errorResponse(error: string, status: number = 400): Response {
  return new Response(
    JSON.stringify({
      success: false,
      error,
      message: error,
    } as ApiResponse),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}

export function successJsonResponse<T>(data: T, message?: string): Response {
  return new Response(
    JSON.stringify(successResponse(data, message)),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}

export function handleApiError(error: any): Response {
  console.error('API Error:', error);
  const message = error instanceof Error ? error.message : '未知错误';
  return errorResponse(message, 500);
}
