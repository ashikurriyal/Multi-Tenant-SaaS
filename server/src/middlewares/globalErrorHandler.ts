import type { ErrorRequestHandler } from 'express';
import httpStatus from 'http-status';
import { ZodError } from 'zod';
import { Prisma } from '../../generated/prisma/client';
import { Stripe } from '../lib/stripe';
import config from '../config';
import AppError from '../errors/AppError';
import handleZodError from '../errors/handleZodError';
import {
  handlePrismaInitError,
  handlePrismaKnownError,
  handlePrismaValidationError,
} from '../errors/handlePrismaError';
import type { TGenericErrorResponse } from '../interfaces/error';

// Errors thrown by express.json() (body-parser) carry a `type` and a `status`
type BodyParserError = Error & { type: string; status: number };
const isBodyParserError = (err: unknown): err is BodyParserError =>
  err instanceof Error && 'type' in err && 'status' in err;

const toErrorResponse = (err: unknown): TGenericErrorResponse => {
  if (err instanceof ZodError) return handleZodError(err);
  if (err instanceof Prisma.PrismaClientKnownRequestError) return handlePrismaKnownError(err);
  if (err instanceof Prisma.PrismaClientValidationError) return handlePrismaValidationError();
  if (err instanceof Prisma.PrismaClientInitializationError) return handlePrismaInitError();

  // A declined card is the customer's problem to fix, not a server error
  if (err instanceof Stripe.errors.StripeCardError) {
    return {
      statusCode: httpStatus.PAYMENT_REQUIRED,
      message:
        'The card was declined, so nothing was changed. Update the payment method and try again.',
      errorCode: 'PAYMENT_FAILED',
      errorDetails: [],
    };
  }
  // The same Idempotency-Key was sent for a different request (FR-BILL-05)
  if (err instanceof Stripe.errors.StripeIdempotencyError) {
    return {
      statusCode: httpStatus.CONFLICT,
      message: 'This Idempotency-Key was already used for a different request.',
      errorCode: 'IDEMPOTENCY_KEY_REUSED',
      errorDetails: [],
    };
  }
  // Stripe's own message can mention ids and internals: log it, answer generically
  if (err instanceof Stripe.errors.StripeError) {
    return {
      statusCode: httpStatus.BAD_GATEWAY,
      message: 'The payment provider could not complete the request. Please try again.',
      errorCode: 'PAYMENT_PROVIDER_ERROR',
      errorDetails: [],
    };
  }

  if (err instanceof AppError) {
    return {
      statusCode: err.statusCode,
      message: err.message,
      errorCode: err.errorCode,
      errorDetails: err.errorDetails,
    };
  }

  if (isBodyParserError(err)) {
    if (err.type === 'entity.parse.failed') {
      return {
        statusCode: httpStatus.BAD_REQUEST,
        message: 'Malformed JSON in request body',
        errorCode: 'BAD_REQUEST',
        errorDetails: [],
      };
    }
    if (err.type === 'entity.too.large') {
      return {
        statusCode: httpStatus.REQUEST_ENTITY_TOO_LARGE,
        message: 'Request body is too large',
        errorCode: 'PAYLOAD_TOO_LARGE',
        errorDetails: [],
      };
    }
  }

  return {
    statusCode: httpStatus.INTERNAL_SERVER_ERROR,
    message: 'Something went wrong',
    errorCode: 'INTERNAL_ERROR',
    errorDetails: [],
  };
};

// Express recognises an error handler by its 4 parameters, so `_next` must stay
const globalErrorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const response = toErrorResponse(err);

  // Unexpected errors are logged once here, never sent to the client. Stripe errors carry
  // their whole HTTP exchange, so log the useful part (type, message, Stripe request id)
  if (err instanceof Stripe.errors.StripeError && response.statusCode >= 500) {
    console.error(`[stripe] ${err.type}: ${err.message} (request ${err.requestId ?? 'n/a'})`);
  } else if (response.statusCode >= 500) {
    console.error(err);
  }

  res.status(response.statusCode).json({
    success: false,
    ...response,
    ...(!config.isProd && err instanceof Error && { stack: err.stack }),
  });
};

export default globalErrorHandler;
