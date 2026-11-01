import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/**
 * IDs fixes => upsert idempotent : le seed peut être rejoué à chaque démarrage du conteneur
 * sans créer de doublons. `update: {}` préserve les modifications faites ensuite via l'Espace Admin.
 */
const DASHBOARDS = [
  {
    id: '00000000-0000-4000-8000-000000000001',
    title: 'Diversité des Produits du Catalogue',
    authorName: 'Molk',
    category: 'Développement des collections',
    description:
      'Analyse de la diversité des articles : répartition par couleur, apparence graphique, type de vêtement et équilibre des groupes de produits.',
    embedUrl:
      'https://app.powerbi.com/reportEmbed?reportId=c1c08028-6b46-42f1-9cc6-342749d9dd77&autoAuth=true&ctid=604f1a96-cbe8-43f8-abbf-f8eaf5d85730',
    displayOrder: 1,
    isActive: true,
  },
  {
    id: '00000000-0000-4000-8000-000000000002',
    title: 'Structure et Répartition du Catalogue',
    authorName: 'Abir',
    category: 'Merchandising produit',
    description:
      "Volume total d'articles par département, répartition par section/index et identification des catégories dominantes.",
    embedUrl: 'https://app.powerbi.com/reportEmbed?placeholder=abir',
    displayOrder: 2,
    isActive: true,
  },
  {
    id: '00000000-0000-4000-8000-000000000003',
    title: 'Volume et Organisation des Références',
    authorName: 'M Anel',
    category: 'Gestion du catalogue e-commerce',
    description:
      'Suivi du volume de références, classification des articles par type/département et cartographie des catégories e-commerce.',
    embedUrl: 'https://app.powerbi.com/reportEmbed?placeholder=anel',
    displayOrder: 3,
    isActive: true,
  },
  {
    id: '00000000-0000-4000-8000-000000000004',
    title: 'Qualité des Fiches Produits',
    authorName: 'Chayma',
    category: 'Qualité des fiches produits',
    description:
      'Contrôle de la complétude : taux de descriptions renseignées, longueur moyenne des textes et identification des manques par rayon.',
    embedUrl: 'https://app.powerbi.com/reportEmbed?placeholder=chayma',
    displayOrder: 4,
    isActive: true,
  },
];

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

  // Supprime les anciens enregistrements de test éventuels
  await prisma.dashboard.deleteMany({
    where: {
      id: { notIn: DASHBOARDS.map((d) => d.id) },
    },
  });

  for (const d of DASHBOARDS) {
    await prisma.dashboard.upsert({ where: { id: d.id }, update: d, create: d });
  }
  console.log(`Seed terminé. Admin : ${email} · ${DASHBOARDS.length} dashboards`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
