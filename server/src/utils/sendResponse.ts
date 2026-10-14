import type { Response } from 'express';

export type TMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type TResponse<T> = {
  statusCode: number;
  success?: boolean;
  message: string;
  meta?: TMeta;
  data?: T;
};

const sendResponse = <T>(res: Response, payload: TResponse<T>) => {
  const { statusCode, success = true, message, meta, data } = payload;

  res.status(statusCode).json({
    success,
    statusCode,
    message,
    ...(meta && { meta }),
    data: data ?? null,
  });
};

export default sendResponse;
