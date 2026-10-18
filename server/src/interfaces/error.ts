// Every errorCode the API can return (SRS section 10.2)
export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'BAD_REQUEST'
  | 'INVALID_SIGNATURE'
  | 'UNAUTHORIZED'
  | 'INVALID_CREDENTIALS'
  | 'TOKEN_REUSED'
  | 'INVALID_API_KEY'
  | 'PLAN_LIMIT_SEATS'
  | 'FORBIDDEN'
  | 'DEMO_RESTRICTED'
  | 'USER_BLOCKED'
  | 'EMAIL_NOT_VERIFIED'
  | 'INVITE_EMAIL_MISMATCH'
  | 'NOT_FOUND'
  | 'ORG_NOT_FOUND'
  | 'CONFLICT'
  | 'EMAIL_TAKEN'
  | 'LAST_OWNER'
  | 'ALREADY_SUBSCRIBED'
  | 'SEATS_EXCEED_TARGET_PLAN'
  | 'NO_BILLING_ACCOUNT'
  | 'NOT_SUBSCRIBED'
  | 'IDEMPOTENCY_KEY_REUSED'
  | 'PAYMENT_FAILED'
  | 'INVITE_EXPIRED'
  | 'TOKEN_EXPIRED'
  | 'PAYLOAD_TOO_LARGE'
  | 'PLAN_LIMIT_USAGE'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR'
  | 'PAYMENT_PROVIDER_ERROR'
  | 'BILLING_NOT_CONFIGURED'
  | 'SERVICE_UNAVAILABLE';

export type TErrorDetail = {
  path: string;
  message: string;
};

export type TGenericErrorResponse = {
  statusCode: number;
  message: string;
  errorCode: ErrorCode;
  errorDetails: TErrorDetail[];
};
