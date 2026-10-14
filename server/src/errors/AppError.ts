import type { ErrorCode, TErrorDetail } from '../interfaces/error';

class AppError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: ErrorCode;
  public readonly errorDetails: TErrorDetail[];

  constructor(
    statusCode: number,
    errorCode: ErrorCode,
    message: string,
    errorDetails: TErrorDetail[] = [],
  ) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.errorDetails = errorDetails;
    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;
