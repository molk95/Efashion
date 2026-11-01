import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/**
 * 4 décideurs métier du projet eFashion (ESPRIT)
 */
const TEAM_MEMBERS = [
  { email: 'molk.saouabi@esprit.tn', fullName: 'Molk SAOUABI', role: Role.VIEWER },
  { email: 'Abir.ELWEHDI@esprit.tn', fullName: 'Abir EL WEHDI', role: Role.VIEWER },
  { email: 'Manel.ABAKHOUCH@esprit.tn', fullName: 'Manel ABAKHOUCH', role: Role.VIEWER },
  { email: 'Chayma.SAMAALI@esprit.tn', fullName: 'Chayma SAMAALI', role: Role.VIEWER },
];

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
    authorName: 'Manel',
    category: 'Gestion du catalogue e-commerce',
    description:
      'Suivi du volume de références, classification des articles par type/département et cartographie des catégories e-commerce.',
    embedUrl: 'https://app.powerbi.com/reportEmbed?placeholder=manel',
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
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@efashion.local').toLowerCase();
  const defaultPassword = process.env.ADMIN_PASSWORD || 'Admin123!';
  const defaultHash = await bcrypt.hash(defaultPassword, 10);

  // Compte admin principal
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      fullName: 'Administrateur eFashion',
      role: Role.ADMIN,
      passwordHash: defaultHash,
    },
  });

  // Comptes des membres de l'équipe (avec leurs adresses ESPRIT)
  for (const m of TEAM_MEMBERS) {
    await prisma.user.upsert({
      where: { email: m.email.toLowerCase() },
      update: { fullName: m.fullName, role: m.role },
      create: {
        email: m.email.toLowerCase(),
        fullName: m.fullName,
        role: m.role,
        passwordHash: defaultHash,
      },
    });
  }

  // Nettoyage des anciennes fiches de test
  await prisma.dashboard.deleteMany({
    where: {
      id: { notIn: DASHBOARDS.map((d) => d.id) },
    },
  });

  // Insertion ou mise à jour respectant les URLs personnalisées définies dans l'admin
  for (const d of DASHBOARDS) {
    const existing = await prisma.dashboard.findUnique({ where: { id: d.id } });
    if (existing) {
      await prisma.dashboard.update({
        where: { id: d.id },
        data: {
          title: d.title,
          authorName: d.authorName,
          category: d.category,
          description: d.description,
          displayOrder: d.displayOrder,
          isActive: d.isActive,
          embedUrl:
            existing.embedUrl && !existing.embedUrl.includes('placeholder=')
              ? existing.embedUrl
              : d.embedUrl,
        },
      });
    } else {
      await prisma.dashboard.create({ data: d });
    }
  }

  console.log(`Seed terminé avec succès :`);
  console.log(`- Admin principal : ${adminEmail}`);
  console.log(`- Membres ESPRIT : ${TEAM_MEMBERS.map((t) => t.email).join(', ')}`);
  console.log(`- 4 dashboards créés/mis à jour (Molk, Abir, Manel, Chayma)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
