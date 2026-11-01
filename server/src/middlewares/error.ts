import { NextFunction, Request, Response } from 'express';
import { ZodError, ZodSchema } from 'zod';
import { Prisma } from '@prisma/client';
import { HttpError } from '../utils/http-error';

export const validate =
  (schema: ZodSchema) =>
  (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) return next(result.error);
    req.body = result.data;
    next();
  };

export function notFound(_req: Request, _res: Response, next: NextFunction) {
  next(new HttpError(404, 'Ressource introuvable.'));
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({ message: 'Données invalides.', details: err.flatten().fieldErrors });
  }
  if (err instanceof HttpError) {
    return res.status(err.status).json({ message: err.message, details: err.details });
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2025') return res.status(404).json({ message: 'Ressource introuvable.' });
    if (err.code === 'P2002') return res.status(409).json({ message: 'Valeur déjà utilisée.' });
  }
  console.error(err);
  res.status(500).json({ message: 'Erreur interne du serveur.' });
}
