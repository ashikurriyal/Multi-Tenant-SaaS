import httpStatus from 'http-status';
import type { ZodError } from 'zod';
import type { TGenericErrorResponse } from '../interfaces/error';

// The first path segment is body | query | params (see validateRequest), so drop it
const handleZodError = (err: ZodError): TGenericErrorResponse => ({
  statusCode: httpStatus.BAD_REQUEST,
  message: 'Validation failed',
  errorCode: 'VALIDATION_ERROR',
  errorDetails: err.issues.map((issue) => ({
    path: issue.path.slice(1).map(String).join('.') || String(issue.path[0] ?? ''),
    message: issue.message,
  })),
});

export default handleZodError;
