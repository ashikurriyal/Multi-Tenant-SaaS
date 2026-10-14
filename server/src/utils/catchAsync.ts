import type { NextFunction, Request, RequestHandler, Response } from 'express';

// Express 5 already forwards rejected promises; we keep this as an explicit convention
const catchAsync =
  (fn: RequestHandler): RequestHandler =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await fn(req, res, next);
    } catch (err) {
      next(err);
    }
  };

export default catchAsync;
