import { Request, Response, NextFunction } from 'express';

type Role = 'admin' | 'editor' | 'viewer';

export const authorize = (allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'NOT_AUTHENTICATED',
          message: 'Authentication required',
          timestamp: new Date().toISOString(),
        },
      });
    }

    if (!allowedRoles.includes(req.user.role as Role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
          timestamp: new Date().toISOString(),
        },
      });
    }

    next();
  };
};
