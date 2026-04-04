import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.js';

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1] || (req.query.token as string);

    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'NO_TOKEN',
          message: 'Authentication token required',
          timestamp: new Date().toISOString(),
        },
      });
    }

    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired token',
        timestamp: new Date().toISOString(),
      },
    });
  }
};
