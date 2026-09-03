import type { Request, Response, NextFunction } from 'express';
import type { ZodType } from 'zod';

/**
 * Validate `req.body` against a Zod schema, replacing it with the parsed value.
 * On failure, responds 400 with the flattened field errors.
 */
export function validateBody<T>(schema: ZodType<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: result.error.flatten().fieldErrors,
      });
      return;
    }
    req.body = result.data;
    next();
  };
}
