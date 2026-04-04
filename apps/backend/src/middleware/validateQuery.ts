import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';

export const validateQuery = (schema: z.ZodType) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = await schema.parseAsync(req.query);
      req.query = validated as any;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Query validation failed',
            details: error.issues,
            timestamp: new Date().toISOString(),
          },
        });
      }
      next(error);
    }
  };
};
