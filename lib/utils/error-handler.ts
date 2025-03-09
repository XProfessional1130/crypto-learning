export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class AuthError extends AppError {
  constructor(message: string, code: string = 'AUTH_ERROR', originalError?: unknown) {
    super(message, code, 401, originalError);
    this.name = 'AuthError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, code: string = 'VALIDATION_ERROR', originalError?: unknown) {
    super(message, code, 400, originalError);
    this.name = 'ValidationError';
  }
}

export function handleError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    return new AppError(error.message, 'UNKNOWN_ERROR', 500, error);
  }

  return new AppError('An unknown error occurred', 'UNKNOWN_ERROR', 500, error);
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function formatErrorMessage(error: unknown): string {
  if (isAppError(error)) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unknown error occurred';
} 