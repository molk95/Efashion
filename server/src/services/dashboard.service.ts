import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { HttpError } from '../utils/http-error';
import { validateEmbed } from '../utils/powerbi';

export type DashboardInput = {
  title: string;
  authorName: string;
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
  list(includeInactive: boolean) {
    return prisma.dashboard.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: [{ category: 'asc' }, { displayOrder: 'asc' }, { title: 'asc' }],
    });
  },

  async get(id: string, includeInactive: boolean) {
    const d = await prisma.dashboard.findUnique({ where: { id } });
    if (!d || (!d.isActive && !includeInactive)) throw new HttpError(404, 'Dashboard introuvable.');
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
