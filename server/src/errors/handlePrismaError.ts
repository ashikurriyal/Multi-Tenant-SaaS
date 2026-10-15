import httpStatus from 'http-status';
import { Prisma } from '../../generated/prisma/client';
import type { TGenericErrorResponse } from '../interfaces/error';

type TAdapterCause = {
  table?: string;
  constraint?: { fields?: string[]; index?: string };
};

// With driver adapters, Prisma 7 reports the unique index (e.g. plans_code_key)
// instead of `meta.target`, so derive the field names from whichever is present
const getUniqueFields = (err: Prisma.PrismaClientKnownRequestError): string[] => {
  const target = err.meta?.target as string[] | string | undefined;
  if (target) return Array.isArray(target) ? target : [target];

  const cause = (err.meta?.driverAdapterError as { cause?: TAdapterCause } | undefined)?.cause;
  if (cause?.constraint?.fields) return cause.constraint.fields;

  const index = cause?.constraint?.index;
  if (!index) return [];
  const prefix = cause.table ? `${cause.table}_` : '';
  return [index.replace(prefix, '').replace(/_key$/, '')];
};

// Safety net only: services should throw a specific AppError (e.g. EMAIL_TAKEN) first
export const handlePrismaKnownError = (
  err: Prisma.PrismaClientKnownRequestError,
): TGenericErrorResponse => {
  switch (err.code) {
    case 'P2002': {
      const fields = getUniqueFields(err);
      return {
        statusCode: httpStatus.CONFLICT,
        message: `A record with this ${fields.join(', ') || 'value'} already exists`,
        errorCode: 'CONFLICT',
        errorDetails: fields.map((path) => ({ path, message: 'Must be unique' })),
      };
    }
    case 'P2025':
      return {
        statusCode: httpStatus.NOT_FOUND,
        message: 'Resource not found',
        errorCode: 'NOT_FOUND',
        errorDetails: [],
      };
    case 'P2003':
      return {
        statusCode: httpStatus.BAD_REQUEST,
        message: 'Related record does not exist',
        errorCode: 'BAD_REQUEST',
        errorDetails: [],
      };
    case 'P1000':
    case 'P1001':
    case 'P1002':
    case 'P1017':
    case 'P2024':
      return {
        statusCode: httpStatus.SERVICE_UNAVAILABLE,
        message: 'Database is unavailable, please try again',
        errorCode: 'SERVICE_UNAVAILABLE',
        errorDetails: [],
      };
    default:
      return {
        statusCode: httpStatus.INTERNAL_SERVER_ERROR,
        message: 'Something went wrong',
        errorCode: 'INTERNAL_ERROR',
        errorDetails: [],
      };
  }
};

export const handlePrismaValidationError = (): TGenericErrorResponse => ({
  statusCode: httpStatus.BAD_REQUEST,
  message: 'Invalid data for the database query',
  errorCode: 'BAD_REQUEST',
  errorDetails: [],
});

export const handlePrismaInitError = (): TGenericErrorResponse => ({
  statusCode: httpStatus.SERVICE_UNAVAILABLE,
  message: 'Database is unavailable, please try again',
  errorCode: 'SERVICE_UNAVAILABLE',
  errorDetails: [],
});
