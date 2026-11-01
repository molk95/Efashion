# eFashion BI — Portail décisionnel collaboratif

Portail web qui centralise les dashboards **Power BI** (« Publier sur le web » et « Intégration sécurisée ReportEmbed ») des 4 décideurs métier du projet eFashion (ESPRIT).

**Stack** : Angular 19 (standalone, signals) + Tailwind CSS · Node.js / Express / TypeScript · Prisma · PostgreSQL 16 · Docker Compose.

---

## 👥 Équipe & Rôles

| Membre | Email ESPRIT | Catégorie métier | Rôle Portail |
|---|---|---|---|
| **Molk SAOUABI** | `molk.saouabi@esprit.tn` | Développement des collections | VIEWER |
| **Abir EL WEHDI** | `Abir.ELWEHDI@esprit.tn` | Merchandising produit | VIEWER |
| **Manel ABAKHOUCH** | `Manel.ABAKHOUCH@esprit.tn` | Gestion du catalogue e-commerce | VIEWER |
| **Chayma SAMAALI** | `Chayma.SAMAALI@esprit.tn` | Qualité des fiches produits | VIEWER |

---

## 🚀 Démarrage rapide (Docker)

```bash
docker compose up --build -d
```

| Service | URL | Note |
|---|---|---|
| **Frontend** | [http://localhost:8080](http://localhost:8080) | Nginx reverse proxy + Angular SPA |
| **API Backend** | [http://localhost:4000/api/health](http://localhost:4000/api/health) | Node.js Express + Prisma |
| **PostgreSQL** | `localhost:5432` | Base de données (volume `pgdata`) |

### Identifiants par défaut

- **Administrateur unique (gestion & configuration)** : `admin@efashion.local` / `Admin123!`
- **Membres de l'équipe (consultation)** : leur adresse `@esprit.tn` avec mot de passe `Admin123!` (rôle VIEWER)
- Les nouveaux comptes créés via **S'inscrire** ont automatiquement le rôle **VIEWER** (lecture seule).

---

## 🗄️ Visualiser la base avec Prisma Studio

Le port `5432` de PostgreSQL est exposé sur l'hôte. Pour ouvrir l'interface visuelle Prisma Studio :

```bash
# Dans le dossier server/
cd server

# Sous Windows (PowerShell) :
$env:DATABASE_URL="postgresql://efashion:efashion@localhost:5432/efashion?schema=public"; npx prisma studio

# Sous Linux / macOS (Bash) :
DATABASE_URL="postgresql://efashion:efashion@localhost:5432/efashion?schema=public" npx prisma studio
```

Prisma Studio s'ouvre automatiquement sur **[http://localhost:5555](http://localhost:5555)** pour explorer et éditer les tables `User` et `Dashboard`.

---

## 🔗 Mise à jour facile des liens Power BI

Depuis l'**Espace Admin** (`/admin`), vous pouvez à tout moment renseigner ou modifier le lien d'un membre (Abir, Manel, Chayma) :

1. Cliquez sur l'icône **Modifier** (crayon) du dashboard concerné.
2. Collez au choix :
   - Le lien direct : `https://app.powerbi.com/reportEmbed?reportId=...&autoAuth=true&ctid=...` ou `https://app.powerbi.com/view?r=...`
   - Le code HTML complet d'intégration : `<iframe ... src="https://app.powerbi.com/..." ...></iframe>`
3. Le système détecte le format, extrait l'attribut `src`, valide le domaine et le protocole HTTPS, et affiche un aperçu en direct.
4. Cliquez sur **Enregistrer** : la base de données PostgreSQL est immédiatement mise à jour.

> **Rapports avec placeholder** : tant qu'un rapport n'a pas son lien définitif, il affiche un badge ambré **« En attente de lien »** sur la page d'accueil et un écran guidé convivial dans la visionneuse.

---

## 🛡️ Sécurité de l'intégration iframe

L'iframe des dashboards Power BI est sécurisé avec les attributs recommandés :
- `allowFullScreen="true"`
- `sandbox="allow-scripts allow-same-origin allow-popups allow-forms"`
- `referrerpolicy="no-referrer-when-downgrade"`
- Détection SSO automatique : si le lien contient `autoAuth=true`, un bandeau informatif rappelle à l'utilisateur de se connecter à son compte Microsoft institutionnel (`@esprit.tn`).

---

## 📡 Endpoints de l'API

| Méthode | Route | Accès | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Inscription (rôle VIEWER) |
| `POST` | `/api/auth/login` | Public | Connexion JWT |
| `GET` | `/api/auth/me` | Authentifié | Profil connecté |
| `GET` | `/api/dashboards` | Authentifié | Liste des dashboards actifs (`?all=true` pour admin) |
| `GET` | `/api/dashboards/:id` | Authentifié | Détail d'un dashboard |
| `POST` | `/api/dashboards/validate-embed` | Authentifié | Analyse et validation d'une URL ou d'un `<iframe>` |
| `POST` | `/api/dashboards` | ADMIN | Création d'un dashboard |
| `PUT` | `/api/dashboards/:id` | ADMIN | Modification d'un dashboard |
| `DELETE` | `/api/dashboards/:id` | ADMIN | Suppression |

---

## 📁 Structure du projet

```
├── docker-compose.yml          # Orchestration multi-conteneurs (db, server, client)
├── client/                     # Application Angular 19 + Tailwind CSS
│   ├── src/app/core/           # Services (Auth, Dashboard, PowerBiUrlService), guards & models
│   ├── src/app/pages/          # Pages (auth, home, viewer, admin)
│   ├── src/app/shared/         # Pipe sanitizeEmbedUrl, helpers UI
│   ├── nginx.conf              # Configuration Nginx (SPA HTML5 + proxy /api)
│   └── Dockerfile              # Multi-stage build Node -> Nginx Alpine
└── server/                     # API REST Node.js + Express + TypeScript
    ├── prisma/                 # Schéma PostgreSQL, migrations & seed
    ├── src/controllers/        # Contrôleurs Express (auth, dashboard)
    ├── src/services/           # Logique métier
    ├── src/middlewares/        # Authentification JWT, rôles, validation Zod
    ├── src/utils/              # Analyseur & validateur d'URL Power BI
    └── Dockerfile              # Multi-stage build Node -> Runtime Alpine
```
