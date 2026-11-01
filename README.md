# eFashion BI — Portail décisionnel collaboratif

Portail web qui centralise les dashboards **Power BI** (« Publier sur le web ») de chaque membre de l'équipe du projet décisionnel eFashion.

**Stack** : Angular 19 (standalone, signals) + Tailwind CSS · Node.js / Express / TypeScript · Prisma · PostgreSQL 16 · Docker Compose.

## 🚀 Démarrage (une seule commande)

```bash
docker compose up --build
```

| Service  | URL                              |
|----------|----------------------------------|
| Frontend | http://localhost:8080            |
| API      | http://localhost:4000/api/health |
| Postgres | interne (`db:5432`), volume `pgdata` |

Au démarrage, le conteneur `server` attend PostgreSQL (`wait-for-it.sh`), applique les migrations Prisma (`migrate deploy`) puis lance le seed (idempotent).

### Accès par défaut

| Rôle  | Email                  | Mot de passe |
|-------|------------------------|--------------|
| ADMIN | `admin@efashion.local` | `Admin123!`  |

Les comptes créés via **S'inscrire** ont le rôle **VIEWER** (lecture seule).
Changez `JWT_SECRET` et `ADMIN_PASSWORD` en production : `cp .env.example .env`.

## 🔗 Ajouter un rapport Power BI

Dans **Espace Admin**, collez **indifféremment** :

1. le lien direct : `https://app.powerbi.com/view?r=eyJrIjoi...`
2. ou le code complet :
   `<iframe title="..." width="600" height="373.5" src="https://app.powerbi.com/view?r=eyJrIjoi..." frameborder="0" allowFullScreen="true"></iframe>`

Le format est détecté en direct, l'attribut `src` est extrait, l'URL validée (HTTPS + domaine `app.powerbi.com`) et un aperçu s'affiche.
Côté Angular : [`PowerBiUrlService`](client/src/app/core/powerbi-url.service.ts) + [`SanitizeEmbedUrlPipe`](client/src/app/shared/sanitize-embed-url.pipe.ts) (`DomSanitizer.bypassSecurityTrustResourceUrl` appliqué **uniquement** après validation).
Côté serveur : [`utils/powerbi.ts`](server/src/utils/powerbi.ts) valide aussi chaque enregistrement.

## 📡 API

| Méthode | Route | Accès |
|---|---|---|
| POST | `/api/auth/register` | public |
| POST | `/api/auth/login` | public |
| GET | `/api/auth/me` | authentifié |
| GET | `/api/dashboards` (`?all=true` pour les inactifs, admin) | authentifié |
| GET | `/api/dashboards/:id` | authentifié |
| POST | `/api/dashboards/validate-embed` `{ embed }` | authentifié |
| POST / PUT / DELETE | `/api/dashboards[/:id]` | ADMIN |

## 🛠 Développement local (sans Docker pour le front/back)

```bash
docker compose up db -d
cd server && npm install && set DATABASE_URL=postgresql://efashion:efashion@localhost:5432/efashion && npx prisma migrate deploy && npx prisma db seed && npm run dev
cd client && npm install && npm start   # http://localhost:4200 (proxy /api -> :4000)
```

> Pour le dev local, exposez le port 5432 du service `db` dans `docker-compose.yml` (`ports: ["5432:5432"]`).

## 📁 Structure

```
client/   Angular (core/, shared/, layout/, pages/{auth,home,viewer,admin}) + Nginx
server/   Express (src/{config,controllers,services,routes,middlewares,utils}) + prisma/
docker-compose.yml
```
