import type { NextFunction, Request, Response } from 'express';
import type { ZodType } from 'zod';

type TRequestSchema = ZodType<{ body?: unknown; query?: unknown; params?: unknown }>;

// Schemas are written as z.object({ body, query, params }); each part is optional
const validateRequest =
  (schema: TRequestSchema) => async (req: Request, _res: Response, next: NextFunction) => {
    const parsed = await schema.parseAsync({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (parsed.body !== undefined) req.body = parsed.body;
    if (parsed.params !== undefined) req.params = parsed.params as Request['params'];
    // Express 5 makes req.query a getter, so shadow it with the parsed (coerced) value
    if (parsed.query !== undefined) {
      Object.defineProperty(req, 'query', {
        value: parsed.query,
        writable: true,
        configurable: true,
        enumerable: true,
      });
    }

    next();
  };

export default validateRequest;
