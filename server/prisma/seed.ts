import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = (process.env.ADMIN_EMAIL || 'admin@efashion.local').toLowerCase();
  const password = process.env.ADMIN_PASSWORD || 'Admin123!';

  await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      fullName: 'Administrateur eFashion',
      role: Role.ADMIN,
      passwordHash: await bcrypt.hash(password, 10),
    },
  });

  if ((await prisma.dashboard.count()) === 0) {
    await prisma.dashboard.createMany({
      data: [
        {
          title: 'Diversité des Produits du Catalogue',
          authorName: 'Molk',
          category: 'Catalogue',
          description:
            "Analyse de la largeur et de la profondeur de l'offre : nombre d'articles par famille, par ligne et par marque, répartition des prix et couleurs.",
          embedUrl: 'https://app.powerbi.com/view?r=',
          displayOrder: 1,
        },
        {
          title: 'Performance des Ventes',
          authorName: 'Camarade 1',
          category: 'Ventes',
          description:
            "Chiffre d'affaires, quantités vendues et marge par période, magasin et famille d'articles. Évolution annuelle et top produits.",
          embedUrl: '',
          displayOrder: 2,
        },
        {
          title: 'Logistique & Magasins',
          authorName: 'Camarade 2',
          category: 'Logistique',
          description:
            'Répartition géographique des points de vente, surface des magasins, volumes écoulés et rotation des stocks.',
          embedUrl: '',
          displayOrder: 3,
        },
      ],
    });
  }
  console.log(`Seed terminé. Admin : ${email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
