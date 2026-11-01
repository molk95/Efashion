import { Prisma, Role } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { HttpError } from '../utils/http-error';
import { validateEmbed } from '../utils/powerbi';
import { AuthPayload } from '../middlewares/auth';

export type DashboardInput = {
  title: string;
  authorName: string;
  authorEmail?: string;
  description?: string;
  embedUrl?: string;
  category: string;
  displayOrder?: number;
  isActive?: boolean;
};

/** Valide la valeur brute (lien ou iframe) si elle est renseignée. Le snippet brut est conservé tel quel. */
function checkEmbed(embedUrl?: string) {
  if (embedUrl && embedUrl.trim()) {
    const v = validateEmbed(embedUrl);
    if (!v.valid) throw new HttpError(400, v.error ?? 'Lien Power BI invalide.');
  }
}

export const dashboardService = {
  list(user?: AuthPayload, includeInactive?: boolean) {
    if (!user || user.role === Role.ADMIN) {
      return prisma.dashboard.findMany({
        where: includeInactive ? {} : { isActive: true },
        orderBy: [{ category: 'asc' }, { displayOrder: 'asc' }, { title: 'asc' }],
      });
    }

    // Un utilisateur VIEWER ne voit strictement que son propre dashboard
    const email = (user.email || '').toLowerCase();
    const prefix = email.split('@')[0] || '';
    const firstName = prefix.split('.')[0] || email;

    return prisma.dashboard.findMany({
      where: {
        isActive: true,
        OR: [
          { authorEmail: { equals: email, mode: 'insensitive' } },
          { authorName: { contains: firstName, mode: 'insensitive' } },
        ],
      },
      orderBy: [{ category: 'asc' }, { displayOrder: 'asc' }, { title: 'asc' }],
    });
  },

  async get(id: string, user?: AuthPayload) {
    const d = await prisma.dashboard.findUnique({ where: { id } });
    if (!d) throw new HttpError(404, 'Dashboard introuvable.');

    if (!user || user.role === Role.ADMIN) {
      return d;
    }

    if (!d.isActive) throw new HttpError(404, 'Dashboard introuvable.');

    const email = (user.email || '').toLowerCase();
    const prefix = email.split('@')[0] || '';
    const firstName = prefix.split('.')[0] || email;

    const isOwner =
      (d.authorEmail && d.authorEmail.toLowerCase() === email) ||
      d.authorName.toLowerCase().includes(firstName.toLowerCase());

    if (!isOwner) {
      throw new HttpError(403, "Accès restreint : vous n'avez accès qu'à votre propre dashboard.");
    }

    return d;
  },

  create(data: DashboardInput) {
    checkEmbed(data.embedUrl);
    return prisma.dashboard.create({ data: data as Prisma.DashboardCreateInput });
  },

  update(id: string, data: Partial<DashboardInput>) {
    checkEmbed(data.embedUrl);
    return prisma.dashboard.update({ where: { id }, data });
  },

  async remove(id: string) {
    await prisma.dashboard.delete({ where: { id } });
  },
};
