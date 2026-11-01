import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { Role } from '@prisma/client';
import { authController, loginSchema, registerSchema } from '../controllers/auth.controller';
import {
  dashboardController as dc,
  dashboardSchema,
  dashboardUpdateSchema,
  embedSchema,
} from '../controllers/dashboard.controller';
import { authenticate, requireRole } from '../middlewares/auth';
import { validate } from '../middlewares/error';

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 50, standardHeaders: true, legacyHeaders: false });

const auth = Router();
auth.post('/register', authLimiter, validate(registerSchema), authController.register);
auth.post('/login', authLimiter, validate(loginSchema), authController.login);
auth.get('/me', authenticate, authController.me);

const dashboards = Router();
const admin = requireRole(Role.ADMIN);
dashboards.use(authenticate);
dashboards.get('/', dc.list);
dashboards.post('/validate-embed', validate(embedSchema), dc.validateEmbed);
dashboards.get('/:id', dc.get);
dashboards.post('/', admin, validate(dashboardSchema), dc.create);
dashboards.put('/:id', admin, validate(dashboardUpdateSchema), dc.update);
dashboards.delete('/:id', admin, dc.remove);

export const apiRouter = Router();
apiRouter.get('/health', (_req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));
apiRouter.use('/auth', auth);
apiRouter.use('/dashboards', dashboards);
