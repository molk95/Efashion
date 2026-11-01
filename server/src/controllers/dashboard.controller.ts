import { z } from 'zod';
import { Role } from '@prisma/client';
import { dashboardService } from '../services/dashboard.service';
import { validateEmbed } from '../utils/powerbi';
import { wrap } from './auth.controller';

export const dashboardSchema = z.object({
  title: z.string().trim().min(2).max(200),
  authorName: z.string().trim().min(1).max(100),
  authorEmail: z.string().email().optional().or(z.literal('')),
  description: z.string().max(5000).optional().default(''),
  embedUrl: z.string().max(10000).optional().default(''),
  category: z.string().trim().min(1).max(60),
  displayOrder: z.coerce.number().int().optional().default(0),
  isActive: z.boolean().optional().default(true),
});
export const dashboardUpdateSchema = dashboardSchema.partial();
export const embedSchema = z.object({ embed: z.string().max(10000) });

export const dashboardController = {
  list: wrap(async (req, res) =>
    res.json(await dashboardService.list(req.user, req.user?.role === Role.ADMIN && req.query.all === 'true')),
  ),
  get: wrap(async (req, res) => res.json(await dashboardService.get(req.params.id, req.user))),
  create: wrap(async (req, res) => res.status(201).json(await dashboardService.create(req.body))),
  update: wrap(async (req, res) => res.json(await dashboardService.update(req.params.id, req.body))),
  remove: wrap(async (req, res) => {
    await dashboardService.remove(req.params.id);
    res.status(204).end();
  }),
  validateEmbed: wrap(async (req, res) => res.json(validateEmbed(req.body.embed))),
};
