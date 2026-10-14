import type { Request, Response } from 'express';
import httpStatus from 'http-status';

const notFound = (req: Request, res: Response) => {
  res.status(httpStatus.NOT_FOUND).json({
    success: false,
    statusCode: httpStatus.NOT_FOUND,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
    errorCode: 'NOT_FOUND',
    errorDetails: [],
  });
};

export default notFound;
