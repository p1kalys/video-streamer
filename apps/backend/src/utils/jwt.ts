import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';

interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export const generateToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, config.JWT_SECRET);
};

export const verifyToken = (token: string): TokenPayload => {
  return jwt.verify(token, config.JWT_SECRET) as TokenPayload;
};
