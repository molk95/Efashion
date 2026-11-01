import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { authService } from '../services/auth.service';

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, '8 caractères minimum'),
  fullName: z.string().min(2).max(100),
});
export const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });

type H = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;
export const wrap = (fn: H) => (req: Request, res: Response, next: NextFunction) => fn(req, res, next).catch(next);

export const authController = {
  register: wrap(async (req, res) => res.status(201).json(await authService.register(req.body))),
  login: wrap(async (req, res) => res.json(await authService.login(req.body))),
  me: wrap(async (req, res) => res.json(await authService.me(req.user!.sub))),
};
