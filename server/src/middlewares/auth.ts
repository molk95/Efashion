import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { env } from '../config/env';
import { HttpError } from '../utils/http-error';

export interface AuthPayload {
  sub: string;
  email: string;
  role: Role;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return next(new HttpError(401, 'Authentification requise.'));
  try {
    req.user = jwt.verify(header.slice(7), env.jwtSecret) as AuthPayload;
    next();
  } catch {
    next(new HttpError(401, 'Jeton invalide ou expiré.'));
  }
}

export const requireRole =
  (...roles: Role[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new HttpError(401, 'Authentification requise.'));
    if (!roles.includes(req.user.role)) return next(new HttpError(403, 'Accès réservé aux administrateurs.'));
    next();
  };
